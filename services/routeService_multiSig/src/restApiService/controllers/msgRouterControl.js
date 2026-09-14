const { Router } = require('express');
const bodyParser = require('body-parser');
const _ = require("lodash");
const crypto = require('crypto');

// ---------------------------------------------------------------------------
// Low-level validation + hash helpers (so the service can bind the FULL
// request to the pk signature, not only a single dataHash field).
// ---------------------------------------------------------------------------
const HEX_BYTES32_RE = /^0x[0-9a-fA-F]{64}$/;
const HEX_ANY_RE      = /^0x[0-9a-fA-F]*$/;

function isHexString(v, expectedByteLen) {
  if (typeof v !== 'string' || !HEX_ANY_RE.test(v)) return false;
  if (Number.isInteger(expectedByteLen)) {
    // 0x prefix + 2 chars per byte
    if (v.length !== 2 + expectedByteLen * 2) return false;
  }
  return true;
}

function isPositiveInteger(v) {
  return Number.isInteger(v) && v > 0;
}

function strip0x(hex) {
  return hex.toLowerCase().startsWith('0x') ? hex.slice(2) : hex;
}

// keccak-256 over concatenated hex strings, returns 0x-prefixed bytes32 hex string.
// We use "solidity packed" semantics by feeding the raw bytes of each field into
// the hash in a strictly ordered order, so every permutation of the 5-tuple
// (chainType, uniqueId, rawData, dataHash, minSignCount) produces a distinct
// hash and a signature for one request can never be reused with a different one.
function requestDigestHex(chainType, uniqueId, rawData, dataHash, minSignCount) {
  const h = crypto.createHash('sha3-256');

  // length-prefix strings so maliciously-sized adjacent fields cannot collide
  const encStr = (s) => {
    const b = Buffer.from(s, 'utf8');
    h.update(Buffer.alloc(4).writeUInt32BE(b.length, 0));
    h.update(b);
  };

  const encU64 = (n) => {
    const b = Buffer.alloc(8);
    b.writeBigUInt64BE(BigInt(n), 0);
    h.update(b);
  };

  const encHex = (hex) => {
    const raw = Buffer.from(strip0x(hex), 'hex');
    h.update(Buffer.alloc(4).writeUInt32BE(raw.length, 0));
    h.update(raw);
  };

  encStr(chainType);
  encStr(uniqueId);
  encHex(rawData);
  encHex(dataHash);
  encU64(minSignCount);

  return '0x' + h.digest('hex');
}

// Signature-threshold policy derived SERVER-SIDE. Clients SHOULD send the same
// value but the service never trusts the client as the source of truth. This
// closes the "raise threshold to 99 to freeze tasks" vector from the report.
function deriveServerMinSignCount(configService, totalPks) {
  const MIN_ALLOWED = configService.getGlobalConfig("MIN_ALLOWED_SIGNERS") ?? 2;
  // ceil((2/3) * totalPks)  ——  standard BFT 2f+1 ceiling.
  const byzantineCeil = Math.ceil((2 * totalPks) / 3);
  return Math.max(MIN_ALLOWED, Math.min(totalPks, byzantineCeil));
}

let frameworkService = require("../../frameworkService/frameworkService");

const txSignStatus_collect = 0;
const txSignStatus_finish = 1;
const txSignStatus_notEnough = 2;

class MsgRouterControl {
  constructor(){
  }

  async init() {
    const router = Router();

    // leader
    router.post('/addTxForSign/:chainType', bodyParser.json({ inflate: true }), this.addTxForSign);

    // fellow query need sign Tx
    router.get('/queryTxForSign/:chainType/:toSignPk', this.queryTxForSign);
    // fellow
    router.post('/addTxSignature/:chainType', bodyParser.json({ inflate: true }), this.addTxSignature);

    // leader
    router.get("/queryTxSignature/:chainType/:uniqueId", this.queryTxSignature);

    return router;
  }

  async addTxForSign(req, res) {
    try {
      const chainType = String(req.params.chainType || '').toUpperCase();
      const txObj = req.body || {};

      const utilService            = frameworkService.getService("UtilService");
      const configService          = frameworkService.getService("ConfigService");
      const verifySignatureService = frameworkService.getService("VerifySignatureService");
      const mongoDB                = frameworkService.getService("MongoDBService");
      const txTableName            = await configService.getGlobalConfig("txSignTableName");

      // -----------------------------------------------------------------------
      // 1) Strict client-input type & shape validation. Reject malformed fields
      //    BEFORE any signature / DB work so the service cannot be tricked into
      //    storing garbage or computing a hash on unexpected types.
      // -----------------------------------------------------------------------
      if (typeof txObj.uniqueId !== 'string' || txObj.uniqueId.length === 0) {
        return res.status(400).send({ status: false, err: "addTxForSign: missing uniqueId" });
      }
      if (!isHexString(txObj.rawData)) {
        return res.status(400).send({ status: false, err: "addTxForSign: rawData must be 0x hex" });
      }
      if (!isHexString(txObj.dataHash, 32)) {
        return res.status(400).send({ status: false, err: "addTxForSign: dataHash must be 0x-prefixed 32-byte hex" });
      }
      if (!isPositiveInteger(txObj.minSignCount)) {
        return res.status(400).send({ status: false, err: "addTxForSign: minSignCount must be positive integer" });
      }

      let pk = typeof txObj.pk === 'string' ? utilService.hexTrip0x(txObj.pk) : '';
      if (!isHexString(pk, 65) && !isHexString(pk, 33)) {
        // uncompressed: 65B (04 || x || y); compressed: 33B (02/03 || x)
        return res.status(400).send({ status: false, err: "addTxForSign: pk must be valid 0x hex (33B compressed or 65B uncompressed)" });
      }
      if (!isHexString(txObj.signature)) {
        return res.status(400).send({ status: false, err: "addTxForSign: signature must be 0x hex" });
      }

      // -----------------------------------------------------------------------
      // 2) Service-side threshold. The client-reported minSignCount MUST equal
      //    this value, otherwise reject — the service remains the source of
      //    truth for how many signatures are required (fixes raise-to-99 DoS).
      // -----------------------------------------------------------------------
      const allPks            = configService.getGlobalConfig("pks") || [];
      const serverMinSignCount = deriveServerMinSignCount(configService, allPks.length);
      if (txObj.minSignCount !== serverMinSignCount) {
        return res.status(400).send({
          status: false,
          err: `addTxForSign: minSignCount must equal server policy ${serverMinSignCount}, got ${txObj.minSignCount}`
        });
      }

      // -----------------------------------------------------------------------
      // 3) Compute the CANONICAL REQUEST DIGEST that authenticates EVERY field
      //    the client sends (not only dataHash). A signature valid for tuple A
      //    (uniqueId=X, rawData=R, dataHash=H, minSign=N) can NEVER be reused
      //    for tuple B with any differing field — closes the "replay valid
      //    signature to overwrite unrelated task" vector.
      // -----------------------------------------------------------------------
      const requestHash = requestDigestHex(
        chainType,
        txObj.uniqueId,
        txObj.rawData,
        txObj.dataHash,
        txObj.minSignCount
      );

      if (false === verifySignatureService.verifySignature(chainType, pk, requestHash, txObj.signature)) {
        const errMsg = `${chainType} pk=${pk} sig=${txObj.signature} over requestHash=${requestHash}`;
        return res.status(401).send({ status: false, err: "addTxForSign: request signature invalid. " + errMsg });
      }

      // -----------------------------------------------------------------------
      // 4) Immutability rule: once created, (chainType, uniqueId) maps to a
      //    fixed (rawData, dataHash, minSignCount). Any attempt to submit
      //    different semantics for the same uniqueId is rejected outright —
      //    there is no upsert/overwrite of the task body.
      // -----------------------------------------------------------------------
      const keyQuery = { chainType, uniqueId: txObj.uniqueId };
      const existing = await mongoDB.queryOne(txTableName, keyQuery, {}, {});

      let statusFinal = txSignStatus_collect;
      if (existing) {
        // Byte-level match on all semantic fields. If any differs, the caller
        // is trying to mutate an existing task -> reject (task immutability).
        const matches = existing.chainType   === chainType
                     && existing.rawData     === txObj.rawData
                     && existing.dataHash    === txObj.dataHash
                     && existing.minSignCount === serverMinSignCount;
        if (!matches) {
          return res.status(409).send({
            status: false,
            err: "addTxForSign: immutable task already exists with different semantics; create a new uniqueId instead"
          });
        }

        // Idempotency: this pk already signed this exact task? -> 200 OK, no-op.
        const alreadySigned = existing.signInfo && existing.signInfo.some(s => s.pk === pk);
        if (alreadySigned) {
          return res.send({ status: true, idempotent: true, reason: "already signed" });
        }

        // Append the new valid signer exactly like the fellow addTxSignature
        // endpoint does, and bump status to `finish` if threshold is now hit.
        const pushUpdate = {
          $set:   { timestamp: _.now() },
          $push:  { signInfo: { pk, signature: txObj.signature, timestamp: _.now() } }
        };
        const nextCount = (existing.signInfo || []).length + 1;
        if (nextCount >= serverMinSignCount) {
          pushUpdate.$set = { ...pushUpdate.$set, status: txSignStatus_finish };
          statusFinal = txSignStatus_finish;
        }
        const ok = await mongoDB.updateOne(txTableName, keyQuery, pushUpdate);
        if (ok === false) {
          return res.status(500).send({ status: false, err: "addTxForSign: append signature failed" });
        }
      } else {
        // Fresh task — insert only (no upsert overwrite), so the first signer
        // who introduces a uniqueId owns its immutable semantics.
        const doc = {
          chainType,
          uniqueId: txObj.uniqueId,
          rawData: txObj.rawData,
          dataHash: txObj.dataHash,
          minSignCount: serverMinSignCount,
          timestamp: _.now(),
          status: serverMinSignCount === 1 ? txSignStatus_finish : txSignStatus_collect,
          signInfo: [{ pk, signature: txObj.signature, timestamp: _.now() }]
        };
        statusFinal = doc.status;
        const ok = await mongoDB.insertOrUpdateOne(txTableName, keyQuery, { $setOnInsert: doc });
        if (ok === false) {
          return res.status(500).send({ status: false, err: "addTxForSign: insert failed" });
        }
      }

      // Best-effort index (idempotent — creating an existing one is a no-op).
      await mongoDB.createIndex(
        txTableName,
        { chainType: 1, uniqueId: 1, dataHash: 1 },
        { unique: true, background: true, collation: { locale: "en", strength: 2 } }
      );

      res.send({ status: true, statusFinal });
    }
    catch (err) {
      console.log("addTxForSign err:", err);
      res.status(500).send({ status: false, err: "catch err" });
    }
  }

  async queryTxForSign(req, res) {
    try {
      let chainType = req.params.chainType;
      let toSignPk = req.params.toSignPk;
      chainType = chainType.toUpperCase();

      let configService = frameworkService.getService("ConfigService");
      let txTableName = await configService.getGlobalConfig("txSignTableName");
      let mongoDB = frameworkService.getService("MongoDBService");

      let aggregateJson = [
        {
          "$match": { "chainType": chainType, "status": txSignStatus_collect, "signInfo.pk" : {"$nin": [toSignPk]} }
        },
        {
          "$sort": { "timestamp": 1 }
        },
        {
          "$project": {
            "_id": 0,
            "status": 0,
            "timestamp": 0,
            "signInfo": 0,
            "minSignCount":0
          }
        }
      ];
      let ret = await mongoDB.aggregate(txTableName, aggregateJson);
      res.send( { status: true, result: ret });
    }
    catch(err) {
      console.log("queryTxForSign err:", err);
      res.send({ status: false });
    }
  }

  async addTxSignature(req, res) {
    try {
      let chainType = req.params.chainType;
      chainType = chainType.toUpperCase();
      let txObj = req.body;
      // example
      // {
      //   uniqueId: uniqueId,
      //   pk: hexPk
      //   dataHash:dataHash,
      //   signature: hexSignature
      // }
      let utilService = frameworkService.getService("UtilService");
      txObj.pk = utilService.hexTrip0x(txObj.pk);
      let configService = frameworkService.getService("ConfigService");
      let txTableName = await configService.getGlobalConfig("txSignTableName");
      
      let mongoDB = frameworkService.getService("MongoDBService");

      let whereJson = {
        "chainType": chainType,
        "uniqueId": txObj.uniqueId,
        "dataHash": txObj.dataHash
      };

      let rec = await mongoDB.queryOne(txTableName, whereJson, {}, {});
      if(rec === null) {
        res.send({status: false, "err": "no found tx"});
        return ;
      }
      let minSignCount = rec.minSignCount;
      let verifySignatureService = frameworkService.getService("VerifySignatureService");
      if(false === verifySignatureService.verifySignature(chainType, txObj.pk, txObj.dataHash, txObj.signature)) {
        const errMsg = ` ${chainType} signing object pk: ${txObj.pk}, signature: ${txObj.signature}`;
        res.send({ status: false, "err": "addTxSignature() checkPkAndSignature fail. " + errMsg});
        return ;
      }

      let foundItem = rec.signInfo.find(item => item.pk === txObj.pk);
      if(foundItem !== undefined) {
        res.send({ status: true });
        return ;
      }

      let updateJson = {
        "$push": {
          signInfo: {
            "pk": txObj.pk,
            signature: txObj.signature,
            "timestamp": _.now()
          }
        }
      };

      if(minSignCount === rec.signInfo.length + 1) {
        updateJson["$set"] = {
          "status": txSignStatus_finish
        }
      }
      await mongoDB.updateOne(txTableName, whereJson, updateJson);
      res.send({status: true});
    }
    catch (err) {
      console.log("addTxSignature err:", err);
      res.send({ status: false});
    }
  }

  async queryTxSignature(req, res) {
    try {
      let chainType = req.params.chainType;
      chainType = chainType.toUpperCase();
      let uniqueId = req.params.uniqueId;

      let configService = frameworkService.getService("ConfigService");
      let txTableName = await configService.getGlobalConfig("txSignTableName");
      let mongoDB = frameworkService.getService("MongoDBService");

      let aggregateJson = [
        {
          "$match": { "chainType": chainType, "uniqueId": uniqueId }
        },
        {
          "$project": {
            "_id": 0,
            "chainType": 0,
            "uniqueId": 0,
            "dataHash": 0,
            "rawData": 0,
            "timestamp": 0,
            "status": 0
          }
        },
      ];

      let ret = await mongoDB.aggregate(txTableName, aggregateJson);
      if(ret.length === 0) {
        res.send( { status: false });
        return ;
      }
      ret = ret[0];

      let result = {
        count: ret.signInfo.length
      };

      if(ret.signInfo.length < ret.minSignCount) {
        result.signatures = [];
      }
      else {
        result.signatures = ret.signInfo;
      }

      res.send( { status: true, result: result });
    }
    catch(err) {
      console.log("queryTxSignature err:", err);
      res.send({ status: false });
    }
  }

  checkPkAndSignature(chainType, pk, dataHash, signature) {
    let verifySignatureService = frameworkService.getService("VerifySignatureService");
    if(!verifySignatureService.verifySignature(chainType, pk, dataHash, signature)) {
      return false;
    }
    return true;
  }
}

module.exports = async () => {
    const c = new MsgRouterControl();
    return await c.init();
};

