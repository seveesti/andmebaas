var _ = require("root/lib/underscore")
var Crypto = require("crypto")
var Config = require("root/config")
var ValidAccount = require("root/test/valid_account")
var ValidSession = require("root/test/valid_session")
var fetchDefaults = require("fetch-defaults")
var accountsDb = require("root/db/accounts_db")
var sessionsDb = require("root/db/sessions_db")

var request = require("fetch-off")
request = require("fetch-formify")(request)
request = require("root/lib/fetch_cook")(request)
request = fetchSession(request)

request = require("fetch-parse")(request, {
	json: true,
	"text/*": true
})

request = _.wrap(request, function(request, url, opts) {
	return request(url, opts).then(fetchNodeify)
})

exports.request = request

exports.csrf = function() {
	beforeEach(function() {
		this.csrfToken = Crypto.randomBytes(16).toString("hex")

		this.request = fetchDefaults(this.request, {
			headers: {"X-CSRF-Token": this.csrfToken},
			cookies: {csrf_token: this.csrfToken}
		})
	})
}

exports.account = function(attrs) {
	beforeEach(function() {
		var account = accountsDb.create(new ValidAccount(attrs))
		var session = new ValidSession({account_id: account.id})
		session = _.assign(sessionsDb.create(session), {token: session.token})

		this.account = account
		this.session = session
		this.request = fetchDefaults(this.request, {session: session})
	})
}

function fetchSession(fetch) {
	return _.assign(function(url, opts) {
		var session = opts && opts.session

		if (session) {
			if (opts.cookies == null) opts.cookies = {}
			opts.cookies[Config.sessionCookieName] = session.token.toString("hex")
		}

		return fetch(url, opts)
	}, fetch)
}

function fetchNodeify(res) {
	var msg = res.valueOf()
	if ("body" in res) msg.body = res.body
	return msg
}
