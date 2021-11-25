var _ = require("root/lib/underscore")
var Crypto = require("crypto")
var counter = 0

module.exports = function(attrs) {
	var createdAt = new Date
	var email = attrs && attrs.email || "john-" + ++counter + "@example.com"
	var inviteToken = attrs && attrs.invite_token || Crypto.randomBytes(16)

	var account = _.assign({
		email,
		created_at: createdAt,
		updated_at: createdAt,
		invite_token_sha256: _.sha256(inviteToken)
	}, attrs)

	Object.defineProperty(account, "invite_tokenn", {
		value: inviteToken, configurable: true, writable: true
	})

	return account
}
