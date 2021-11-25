var _ = require("root/lib/underscore")
var Db = require("root/lib/db")
var sqlite = require("root").sqlite
exports = module.exports = new Db(Object, sqlite, "organization_updates")

exports.parse = function(attrs) {
	return _.defaults({
		at: attrs.at && new Date(attrs.at),
		attributes: attrs.attributes && JSON.parse(attrs.attributes),
	}, attrs)
}

exports.serialize = function(attrs) {
	var obj = _.clone(attrs)
	if ("attributes" in obj) obj.attributes = JSON.stringify(obj.attributes)
	return obj
}
