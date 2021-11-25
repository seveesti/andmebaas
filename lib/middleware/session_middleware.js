var _ = require("root/lib/underscore")
var Config = require("root/config")
var HttpError = require("standard-http-error")
var accountsDb = require("root/db/accounts_db")
var sessionsDb = require("root/db/sessions_db")
var sql = require("sqlate")

exports = module.exports = function(req, _res, next) {
	req.session = null
	req.account = null

	var sessionToken = req.cookies[Config.sessionCookieName]
	if (sessionToken == null) return void next()

	var session = sessionsDb.read(sql`
		SELECT * FROM sessions
		WHERE token_sha256 = ${_.sha256(Buffer.from(sessionToken, "hex"))}
		AND deleted_at IS NULL
	`)

	if (session == null) return void next()

	req.session = session
	req.account = accountsDb.read(session.account_id)
	next()
}

exports.assertAdmin = function(req, _res, next) {
	var {account} = req

	if (account == null) throw new HttpError(401, "Not Signed In", {
		description: "Lehe vaatamiseks pead sisse logima ning olema administraator."
	})

	if (!account.administrative) throw new HttpError(403, "Not An Admin", {
		description: "Lehe vaatamiseks pead olema administraator."
	})

	next()
}
