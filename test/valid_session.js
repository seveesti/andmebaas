var _ = require("root/lib/underscore")
var Crypto = require("crypto")

module.exports = function(attrs) {
	var token = attrs.token || Crypto.randomBytes(12)

	var session = _.assign({
		created_at: new Date,
		token_sha256: _.sha256(token),
	}, attrs)

	Object.defineProperty(session, "token", {
		value: token, configurable: true, writable: true
	})

	return session
}
