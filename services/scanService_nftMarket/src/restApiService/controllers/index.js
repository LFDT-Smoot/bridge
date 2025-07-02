
const { Router } = require('express');
const msgRouterControl = require('./msgRouterControl');
const NftRouterControl = require("./nftRouterControl");

module.exports = async function initControllers() {
  const router = Router();
  router.use("/", await msgRouterControl());
  router.use("/nft/", await NftRouterControl());
  return router;
};
