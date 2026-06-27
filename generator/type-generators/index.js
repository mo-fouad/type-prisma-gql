const generateObjectTypes = require("./generateObjectTypes.js").default;
const generateInputTypes = require("./generateInputTypes.js").default;
const generateResolvers = require("./generateResolvers.js").default;
const generateFieldResolvers = require("./generateFieldResolvers.js").default;
const generateEnum = require("./generateEnum.js").default;

module.exports = {
  generateObjectTypes,
  generateInputTypes,
  generateResolvers,
  generateFieldResolvers,
  generateEnum,
};
