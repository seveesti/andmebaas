var _ = require("root/lib/underscore")
var Config = require("root/config")
var Router = require("express").Router
var Crypto = require("crypto")
var Bcrypt = require("bcryptjs")
var HttpError = require("standard-http-error")
var accountsDb = require("root/db/accounts_db")
var sessionsDb = require("root/db/sessions_db")
var sql = require("sqlate")
var csrf = require("root/lib/middleware/csrf_middleware")
exports.router = Router({mergeParams: true})
exports.signIn = signIn

exports.router.get("/new", function(_req, res) {
	res.render("sessions/create_page.jsx")
})

exports.router.post("/", function(req, res) {
	var attrs = parse(req.body)

	var account = accountsDb.read(sql`
		SELECT * FROM accounts
		WHERE email = ${attrs.email}
	`)

	if (account == null) throw new HttpError(422, "No Such Account")

	if (!Bcrypt.compareSync(attrs.password, account.encrypted_password)) {
		throw new HttpError(422, "Invalid Password")
	}

	signIn(account, req, res)
	res.statusMessage = "Signed In"
	res.redirect(303, "/")
})

exports.router.use("/:id", function(req, _res, next) {
	if (req.account == null) throw new HttpError(401)

	var {session} = req
	if (Number(req.params.id) != session.id) throw new HttpError(403)
	next()
})

exports.router.delete("/:id", function(req, res) {
	sessionsDb.update(req.session, {deleted_at: new Date})

	// NOTE: There's no security benefit in resetting the CSRF token on signout.
	res.clearCookie(Config.sessionCookieName, {
		httpOnly: true,
		secure: req.secure
	})

	res.statusMessage = "Signed Out"
	res.redirect(303, "/")
})

function signIn(account, req, res) {
	var sessionToken = Crypto.randomBytes(16)

	sessionsDb.create({
		account_id: account.id,
		token_sha256: _.sha256(sessionToken)
	})

	res.cookie(Config.sessionCookieName, sessionToken.toString("hex"), {
		httpOnly: true,
		secure: req.secure,
		maxAge: 365 * 86400 * 1000
	})

	csrf.reset(req, res)
}

function parse(obj) {
	return {email: String(obj.email), password: String(obj.password)}
}
