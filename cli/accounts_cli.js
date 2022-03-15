var _ = require("root/lib/underscore")
var Crypto = require("crypto")
var Neodoc = require("neodoc")
var Config = require("root/config")
var accountsDb = require("root/db/accounts_db")
var sql = require("sqlate")

var USAGE_TEXT = `
Usage: cli accounts (-h | --help)
       cli accounts create [options] <email>
       cli accounts list [options]
       cli accounts delete [options] <id-or-email>

Options:
    -h, --help   Display this help and exit.

Commands:
    create  Create a new admin account.
    list    List all accounts.
    delete  Delete account.
`

module.exports = function(argv) {
  var args = Neodoc.run(USAGE_TEXT, {argv: argv})
  if (args["--help"]) return void process.stdout.write(USAGE_TEXT.trimLeft())

	if (args.create) createAccount(args["<email>"])
	else if (args.list) listAccounts()
	else if (args.delete) deleteAccount(args["<id-or-email>"])
	else process.stdout.write(USAGE_TEXT.trimLeft())
}

function createAccount(email) {
	var inviteToken = Crypto.randomBytes(16)

	accountsDb.create({
		email: email,
		invite_token_sha256: _.sha256(inviteToken),
		administrative: true
	})

	var url = Config.url + "/accounts/invites/" + inviteToken.toString("hex")
	console.log("Sign up at %s.", url)
}

function listAccounts() {
	var accounts = accountsDb.search(sql`SELECT * FROM accounts`)

	accounts.forEach(function(account) {
		console.log("%d\t%s", account.id, account.email)
	})
}

function deleteAccount(idOrEmail) {
	var account = /^\d+$/.test(idOrEmail)
		? accountsDb.read(Number(idOrEmail))
		: accountsDb.read(sql`SELECT * FROM accounts WHERE email = ${idOrEmail}`)

	if (account == null) {
		console.error("No account with id or email: " + idOrEmail)
		process.exit(1)
	}

	accountsDb.delete(account)
}
