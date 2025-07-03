
const { Router } = require('express');
const msgRouterControl = require('./msgRouterControl');

module.exports = async function initControllers() {
  const router = Router();
  router.use("/", await msgRouterControl())
  return router;
};
