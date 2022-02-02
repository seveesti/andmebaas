var _ = require("root/lib/underscore")
var Db = require("root/lib/db")
var sqlite = require("root").sqlite
exports = module.exports = new Db(Object, sqlite, "organizations")
exports.idAttribute = "registry_code"
exports.idColumn = "registry_code"

exports.parse = function(attrs) {
	return _.defaults({
		founded_on: attrs.founded_on && new Date(attrs.founded_on),
		created_at: attrs.created_at && new Date(attrs.created_at),
		published_at: attrs.published_at && new Date(attrs.published_at),
		other_urls: attrs.other_urls && JSON.parse(attrs.other_urls),
		board_members: attrs.board_members && JSON.parse(attrs.board_members),
		regions: attrs.regions && new Set(JSON.parse(attrs.regions)),

		short_descriptions: attrs.short_descriptions &&
			JSON.parse(attrs.short_descriptions),
		long_descriptions: attrs.long_descriptions &&
			JSON.parse(attrs.long_descriptions),
		business_models:
			attrs.business_models && new Set(JSON.parse(attrs.business_models)),

		sustainability_goals:
			attrs.sustainability_goals &&
			new Set(JSON.parse(attrs.sustainability_goals))
	}, attrs)
}

exports.serialize = function(attrs) {
	var obj = _.clone(attrs)

	if (obj.founded_on) obj.founded_on = _.formatDate("iso", obj.founded_on)
	if ("other_urls" in obj) obj.other_urls = JSON.stringify(obj.other_urls)

	if ("short_descriptions" in obj)
		obj.short_descriptions = JSON.stringify(obj.short_descriptions)
	if ("long_descriptions" in obj)
		obj.long_descriptions = JSON.stringify(obj.long_descriptions)
	if ("board_members" in obj)
		obj.board_members = JSON.stringify(obj.board_members)
	if ("business_models" in obj)
		obj.business_models = JSON.stringify([...obj.business_models])
	if ("regions" in obj)
		obj.regions = JSON.stringify([...obj.regions])
	if ("sustainability_goals" in obj)
		obj.sustainability_goals = JSON.stringify([...obj.sustainability_goals])

	return obj
}
