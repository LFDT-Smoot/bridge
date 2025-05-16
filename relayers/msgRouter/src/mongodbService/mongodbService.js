/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
'use strict';

const mongoose = require('mongoose');

module.exports = class MongodbService {
    constructor(){
    }

    async init(mongoUrl) {
        try {
            this.dbo = await this.connectMongoDB(mongoUrl);
            console.log('MongoClient.connect success');
        }
        catch (err) {
            console.log("DbService err:", err);
            process.exit(0);
        }
    }

    async connectMongoDB(url) {
        try {
            await mongoose.connect(url, { useNewUrlParser: true });

            const db = mongoose.connection
            db.on('error', (error) => {
                console.log(`MongoDB connecting failed: ${error}`);
                process.exit(0);
            })
            db.once('open', () => {
                console.log('MongoDB connecting succeeded');
            })
            return db
        } catch (error) {
            console.log(`MongoDB connecting failed: ${error}`);
            process.exit(0);
        }
    }

    insertOne = async (tblName, obj) => {
        try {
            if (!obj) {
                return;
            }

            let ret = await this.dbo.collection(tblName).insertOne(obj);
            return (ret.result.ok === 1);
        }
        catch (err) {
            console.log("db.js:insertOne err:", err);
            return false;
        }
    }

    createIndex = async (tblName, indexJson, optionJson) => {
        try {
            let ret = await this.dbo.collection(tblName).createIndex(indexJson, optionJson);
            return true;
        }
        catch (err) {
            console.log("db.js:createIndex err:", err);
            return false;
        }
    }

    updateOne = async (tblName, whereJson, updateJson) => {
        try {
            let ret = await this.dbo.collection(tblName).updateOne(whereJson, updateJson);
            return true;
        }
        catch (err) {
            console.log("db.js:updateOne err:", err);
            return false;
        }
    }

    query = async (tblName, whereJson, sortJson, filterJson, limit) => {
        try {
            let ret = await this.dbo.collection(tblName).find(whereJson, filterJson).sort(sortJson).limit(limit).toArray();
            return { success: true, data: ret };
        }
        catch (err) {
            console.log("db.js:query err:", err);
            return { success: false };
        }
    }

    queryCount = async (tblName, whereJson) => {
        try {
            let ret = await this.dbo.collection(tblName).find(whereJson).count();
            return ret;
        }
        catch (err) {
            console.log("db.js:queryCount err:", err);
            return 0;
        }
    }

    checkRecIsExist = async (tblName, whereJson) => {
        try {
            let ret = await this.dbo.collection(tblName).estimatedDocumentCount(whereJson);
            return ret > 0;
        }
        catch (err) {
            console.log("db.js:queryCount err:", err);
            return false;
        }
    }

    queryOne = async (tblName, whereJson, sortJson, filterJson) => {
        try {
            if (filterJson === null) {
                filterJson = { "projection": {} };
            }
            if (sortJson === null) {
                sortJson = {};
            }
            let ret = await this.dbo.collection(tblName).find(whereJson, filterJson).sort(sortJson).limit(1).toArray();
            if (ret.length > 0) {
                return ret[0];
            }
            else {
                return null;
            }
        }
        catch (err) {
            console.log("db.js:queryCount err:", err);
            return [];
        }
    }

    insertMany = async (tblName, insertAry) => {
        try {
            let ret = await this.dbo.collection(tblName).insertMany(insertAry);
            return (ret.result.ok === 1);
        }
        catch (err) {
            console.log("db.js:insertMany err:", err);
            return false;
        }
    }

    aggregate = async (tblName, aggregateJson) => {
        try {
            return await this.dbo.collection(tblName).aggregate(aggregateJson).toArray();
        }
        catch (err) {
            console.log("aggregate err:", err);
            return [];
        }
    }

    insertOrUpdateOne = async (tblName, whereJson, updateJson) => {
        try {
          let ret = await this.dbo.collection(tblName).updateOne(whereJson, updateJson, { "upsert": true });
          return true;
        }
        catch (err) {
            console.log("db.js:insertOrUpdateOne err:", err);
            return false;
        }
    }
};

