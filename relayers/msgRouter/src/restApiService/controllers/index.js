/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
const { Router } = require('express');
const msgRouterControl = require('./msgRouterControl');

module.exports = async function initControllers() {
  const router = Router();
  router.use("/", await msgRouterControl())
  return router;
};
