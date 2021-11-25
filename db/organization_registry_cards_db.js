var _ = require("root/lib/underscore")
var Db = require("root/lib/db")
var sqlite = require("root").sqlite
exports = module.exports = new Db(Object, sqlite, "organization_registry_cards")
exports.idAttribute = "registry_code"
exports.idColumn = "registry_code"

exports.parse = function(attrs) {
	return _.defaults({
		created_at: attrs.created_at && new Date(attrs.created_at),
		issued_at: attrs.issued_at && new Date(attrs.issued_at)
	}, attrs)
}
