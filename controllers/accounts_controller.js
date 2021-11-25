var _ = require("root/lib/underscore")
var Config = require("root/config")
var Crypto = require("crypto")
var Router = require("express").Router
var accountsDb = require("root/db/accounts_db")
var sql = require("sqlate")
var {assertAdmin} = require("root/lib/middleware/session_middleware")
var sendEmail = require("root").sendEmail
var outdent = require("root/lib/outdent")

exports.router = Router({mergeParams: true})

exports.router.get("/", assertAdmin, function(_req, res) {
	var accounts = accountsDb.search(sql`
		SELECT
			account.*,

			json_group_array(json_object(
				'registry_code', org.registry_code,
				'name', org.name
			)) AS memberships

		FROM accounts AS account

		LEFT JOIN organization_members AS member
		ON member.account_id = account.id

		LEFT JOIN organizations AS org
		ON org.registry_code = member.registry_code

		GROUP BY account.id
		ORDER BY administrative DESC, id ASC
	`)

	accounts.forEach(function(account) {
		account.memberships = JSON.parse(account.memberships)
		account.memberships = account.memberships.filter((m) => m.registry_code)
	})

	res.render("accounts/index_page.jsx", {accounts})
})

exports.router.get("/new", assertAdmin, function(_req, res) {
	res.render("accounts/create_page.jsx")
})

exports.router.post("/", assertAdmin, _.next(async function(req, res) {
	var {name, email} = parse(req.body)
	var inviteToken = Crypto.randomBytes(8)

	try {
		accountsDb.create({
			name,
			email,
			invite_token_sha256: _.sha256(inviteToken),
			administrative: true
		})
	}
	catch (err) {
		if (err.code == "SQLITE_CONSTRAINT_UNIQUE") {
			res.statusMessage = "Account Already Exists"
			res.flash("error", "Selle meiliaadressiga konto juba eksisteerib.")
			res.redirect(303, req.baseUrl)
		}

		throw err
	}

	var inviteUrl = Config.url
	inviteUrl += "/accounts/invites/" + inviteToken.toString("hex")

	await sendEmail({
		to: email,
		subject: "Oled kutsutud täiendama SEV andmebaasi",

		text: outdent`
			Tere

			Sind kutsuti administreerima SEV andmebaasi.
			Alustamiseks loo endale konto ${inviteUrl} lehel.

			Tervitades

			SEV
		`
	})

	res.statusMessage = "Account Created"
	res.flash("notice", "Administraator lisatud.")
	res.redirect(303, req.baseUrl)
}))

exports.router.delete("/:id", assertAdmin, function(req, res) {
	accountsDb.delete(Number(req.params.id))

	res.statusMessage = "Account Deleted"
	res.flash("notice", "Konto kustutatud")
	res.redirect(303, req.baseUrl)
})

exports.router.use("/invites", require("./accounts/invites_controller").router)

function parse(obj) {
	return {
		name: obj.name && String(obj.name) || null,
		email: obj.email && String(obj.email) || null
	}
}
