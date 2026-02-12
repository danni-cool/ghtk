const gh = require("./lib/gh");
const npmrc = require("./lib/npmrc");
const prompt = require("./lib/prompt");

module.exports = {
  ...gh,
  ...npmrc,
  ...prompt,
};
