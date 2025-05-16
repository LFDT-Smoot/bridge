/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var stellar_sdk_1 = require("@stellar/stellar-sdk");
var isArray_1 = tslib_1.__importDefault(require("lodash/isArray"));
var isString_1 = tslib_1.__importDefault(require("lodash/isString"));
var functionsIn_1 = tslib_1.__importDefault(require("lodash/functionsIn"));
var includes_1 = tslib_1.__importDefault(require("lodash/includes"));
var without_1 = tslib_1.__importDefault(require("lodash/without"));
var isBuffer_1 = tslib_1.__importDefault(require("lodash/isBuffer"));
var sorobanXdrUtils_1 = require("./sorobanXdrUtils");
function extrapolateFromXdr(input, type) {
    function buildTreeFromObject(object, anchor, name) {
        anchor.type = name;
        if (name == "ed25519") {
        }
        if ((0, isArray_1.default)(object)) {
            parseArray(anchor, object);
        }
        else if (!hasChildren(object)) {
            anchor.value = getValue(object, name);
        }
        else if (object.switch) {
            parseArm(anchor, object);
        }
        else {
            parseNormal(anchor, object);
        }
    }
    function parseArray(anchor, object) {
        anchor.value = "Array[".concat(object.length, "]");
        anchor.nodes = [];
        for (var i = 0; i < object.length; i++) {
            anchor.nodes.push({});
            buildTreeFromObject(object[i], anchor.nodes[anchor.nodes.length - 1], "[" + i + "]");
        }
    }
    function parseArm(anchor, object) {
        anchor.value = "[" + object.switch().name + "]";
        if (object.switch().name == "publicKeyTypeEd25519") {
        }
        if ((0, isString_1.default)(object.arm())) {
            anchor.nodes = [{}];
            var v1 = (0, sorobanXdrUtils_1.scValByType)(object);
            var v21 = object.arm();
            var v2 = object[v21]();
            var arg1 = v1 !== null && v1 !== void 0 ? v1 : v2;
            var arg2 = anchor.nodes[anchor.nodes.length - 1];
            var arg3 = object.arm();
            buildTreeFromObject(arg1, arg2, arg3);
        }
    }
    function parseNormal(anchor, object) {
        anchor.nodes = [];
        // console.log("parseNormal() ================================================================= start");
        // console.log("parseNormal() typeof (object): ", typeof object, Object.prototype.toString.call(object));
        // console.log("parseNormal() functionsIn(object): ", (0, functionsIn_1.default)(object));
        // console.log("parseNormal() anchor: ", anchor);
        (0, without_1.default)((0, functionsIn_1.default)(object), "toXDR").forEach(function (name) {
            anchor.nodes.push({});
            // console.log("parseNormal() name: ", name);
            // console.log("parseNormal() object[name]: ", object[name]);
            var arg1 = object[name]();
            var arg2 = anchor.nodes[anchor.nodes.length - 1];
            buildTreeFromObject(arg1, arg2, name);
        });
        // console.log("parseNormal() ================================================================= end ");
    }
    function hasChildren(object) {
        if ((0, isString_1.default)(object)) {
            return false;
        }
        if (object && (object._isBuffer || (0, isBuffer_1.default)(object))) {
            return false;
        }
        var functions = (0, functionsIn_1.default)(object);
        if (functions.length == 0) {
            return false;
        }
        if ((0, includes_1.default)(functions, "getLowBits") &&
            (0, includes_1.default)(functions, "getHighBits")) {
            return false;
        }
        return true;
    }
    var amountFields = [
        "amount",
        "startingBalance",
        "sendMax",
        "sendAmount",
        "destMin",
        "destAmount",
        "limit",
    ];
    function getValue(object, name) {
        if ((0, includes_1.default)(amountFields, name)) {
            return {
                type: "amount",
                value: {
                    parsed: stellar_sdk_1.Operation._fromXDRAmount(object),
                    raw: object.toString(),
                },
            };
        }
        if (name === "hint") {
            var hintBytes = new Buffer(object, "base64");
            var partialPublicKey = Buffer.concat([new Buffer(28).fill(0), hintBytes]);
            var keypair = new stellar_sdk_1.Keypair({
                type: "ed25519",
                publicKey: partialPublicKey,
            });
            var partialPublicKeyString = "G" +
                new Buffer(46).fill("_").toString() +
                keypair.publicKey().substr(47, 5) +
                new Buffer(4).fill("_").toString();
            return { type: "code", value: partialPublicKeyString };
        }
        if (name === "ed25519" || name === "sourceAccountEd25519") {
            var address = stellar_sdk_1.StrKey.encodeEd25519PublicKey(object);
            return { type: "code", value: address };
        }
        if (name === "assetCode" ||
            name === "assetCode4" ||
            name === "assetCode12") {
            return object.toString();
        }
        if (name === "contractId" && object) {
            return stellar_sdk_1.StrKey.encodeContract(object);
        }
        if (name === "functionName" || name === "sym") {
            return object.toString();
        }
        if (name === "durability") {
            return JSON.stringify(object);
        }
        if (name === "type") {
            return JSON.stringify(object);
        }
        if (object && object._isBuffer) {
            return {
                type: "code",
                raw: object,
                value: new Buffer(object).toString("base64"),
            };
        }
        if (typeof object === "undefined") {
            return;
        }
        if (typeof object.toString === "function") {
            return object.toString();
        }
        throw new Error("Internal laboratory bug: Encountered value type in XDR viewer that does not have a toString method");
    }
    var xdrObject;
    try {
        xdrObject = stellar_sdk_1.xdr[type].fromXDR(input, "base64");
    }
    catch (error) {
        throw new Error("Input XDR could not be parsed");
    }
    var tree = [{}];
    buildTreeFromObject(xdrObject, tree[0], type);
    return tree;
}
exports.default = extrapolateFromXdr;
//# sourceMappingURL=extrapolateFromXdr.js.map