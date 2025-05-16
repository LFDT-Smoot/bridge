/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
'use strict';

require("dotenv").config();
const express = require('express');
let frameworkService = require("../frameworkService/frameworkService");

const { resolve } = require('path');
const { promisify } = require('util');
const initMiddlewares = require('./middlewares');
const initControllers = require('./controllers');
const webServer = express();

function errorHandler(err, req, res, next) {
  res.send({ success: false });
  return;
}

module.exports = class RestApiService {
  constructor(){
  }

  async init() {
    webServer.all('*', async (req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'content-type,Content-Length, Authorization,Origin,Accept,X-Requested-With');
      res.header('Access-Control-Allow-Methods', 'POST, GET');
      res.header('Access-Control-Allow-Credentials', false);
      next();
    });

    try {
      webServer.use(await initControllers());
      webServer.use(await initMiddlewares());
      webServer.use(errorHandler);
      let configService = frameworkService.getService("ConfigService");
      let port = await configService.getGlobalConfig("webPort");
      await promisify(webServer.listen.bind(webServer, port))();
      console.log(`> Started on port ${port}`);
    }
    catch (err) {
        console.log("server.all init err:", err);
        process.exit(0);
        return;
    }
    return true;
  }
};

