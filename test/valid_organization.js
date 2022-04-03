var _ = require("root/lib/underscore")

module.exports = function(attrs) {
	return _.assign({
		official_name: null,
		other_urls: [],
		created_at: new Date,
		email: null,
		founded_on: null,
		logo: null,
		logo_type: null,
		published_at: null,
		regions: new Set,
		board_members: [],
		sev_member: false,
		short_descriptions: {},
		long_descriptions: {},
		sustainability_goals: new Set,
		business_models: new Set,
		url: null
	}, attrs)
}
