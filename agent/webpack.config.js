const path = require('path');

const moduleAliases = require('./package.json')._moduleAliases;
const alias = {};

for (const key in moduleAliases) {
  alias[key] = path.resolve(__dirname, moduleAliases[key]);
}

console.log("[webpack.config.js] alias:", alias);

module.exports = {
  resolve: { alias },
};
