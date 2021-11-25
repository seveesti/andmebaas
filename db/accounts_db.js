var _ = require("root/lib/underscore")
var Db = require("root/lib/db")
var sqlite = require("root").sqlite
exports = module.exports = new Db(Object, sqlite, "accounts")

exports.parse = function(attrs) {
	return _.defaults({
		created_at: attrs.created_at && new Date(attrs.created_at),

		invite_accepted_at:
			attrs.invite_accepted_at && new Date(attrs.invite_accepted_at),

		administrative: Boolean(attrs.administrative)
	}, attrs)
}

exports.serialize = function(attrs) {
	var obj = _.clone(attrs)
	if ("administrative" in obj) obj.administrative = Number(obj.administrative)
	return obj
}
