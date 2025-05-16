/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
const { Router } = require('express');
const urlnormalizeMiddleware = require('./urlnormalize');

module.exports = async function initMiddlewares() {
  const router = Router();
  router.use(urlnormalizeMiddleware());
  return router;
};
