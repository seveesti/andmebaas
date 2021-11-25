var sql = require("sqlate")
var sqlite = require("root").sqlite

exports = module.exports = function() {
	beforeEach(exports.delete)
}

exports.delete = function() {
	sqlite(sql`DELETE FROM organization_taxes`)
	sqlite(sql`DELETE FROM organization_taxes_updates`)
	sqlite(sql`DELETE FROM organization_registry_cards`)
	sqlite(sql`DELETE FROM organization_members`)
	sqlite(sql`DELETE FROM organization_updates`)
	sqlite(sql`DELETE FROM organizations`)
	sqlite(sql`DELETE FROM sessions`)
	sqlite(sql`DELETE FROM accounts`)
}
