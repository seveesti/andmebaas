var _ = require("./underscore")

module.exports = _.assign({
	global: "Globaalne",
	estonia: "Eesti"
}, _.mapValues(require("./estonian_counties"), (name) => name + "maa"))
