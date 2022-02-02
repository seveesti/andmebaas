var _ = require("root/lib/underscore")
var Router = require("express").Router
var Bcrypt = require("bcryptjs")
var HttpError = require("standard-http-error")
var accountsDb = require("root/db/accounts_db")
var organizationsDb = require("root/db/organizations_db")
var {signIn} = require("../sessions_controller")
var sql = require("sqlate")

exports.router = Router({mergeParams: true})

exports.router.get("/:token", function(req, res) {
	if (req.account) {
		res.statusMessage = "Already Signed In"
		return void res.redirect(302, "/")
	}

	var token = req.params.token

	if (token == null) throw new HttpError(400, "Invite Token Missing", {
		description: req.t("invite_accept_page.invalid_invite_link")
	})

	var account = readInvitedUnacceptedAccount(req.t, Buffer.from(token, "hex"))

	var organizations = organizationsDb.search(sql`
		SELECT org.* FROM organizations AS org
		JOIN organization_members AS member
		ON member.registry_code = org.registry_code
		AND member.account_id = ${account.id}
	`)

	res.render("accounts/invites/accept_page.jsx", {
		account,
		organizations,
		token
	})
})

exports.router.put("/:token", function(req, res) {
	var token = Buffer.from(req.params.token, "hex")
	var account = readInvitedUnacceptedAccount(req.t, token)
	var password = String(req.body.password)

	if (!password) throw new HttpError(422, "Empty Password", {
		description: req.t("invite_accept_page.empty_password")
	})

	account = accountsDb.update(account, {
		encrypted_password: Bcrypt.hashSync(password, 10),
		invite_accepted_at: new Date,
		updated_at: new Date
	})

	signIn(account, req, res)
	res.statusMessage = "Account Invite Accepted"
	res.redirect(303, "/")
})

function readInvitedUnacceptedAccount(t, token) {
	var inviteTokenSha256 = _.sha256(token)

	var account = accountsDb.read(sql`
		SELECT * FROM accounts
		WHERE invite_token_sha256 = ${inviteTokenSha256}
	`)

	if (account == null) throw new HttpError(404, "No Invite Found", {
		description: t("invite_accept_page.invalid_invite_link")
	})

	if (account.invite_accepted_at)
		throw new HttpError(409, "Account Already Created", {
			description: t("invite_accept_page.invite_used_already")
		})

	return account
}
