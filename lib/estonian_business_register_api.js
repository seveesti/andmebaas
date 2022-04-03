var fetch = require("fetch-off")
var API_URL = "https://ariregxmlv6.rik.ee"
var WEB_URL = "https://ariregister.rik.ee"

var api = require("fetch-defaults")(fetch, API_URL, {
	timeout: 10000,
	headers: {Accept: "text/xml"}
})

api = require("fetch-parse")(api, {json: true})
api = require("fetch-throw")(api)
exports = module.exports = api

exports.readRegistryCardHtml = async function(registryCode) {
	var url = `${WEB_URL}/est/company/${registryCode}/tab/registry_card`

	// From testing an invalid registry code (like 1337123x), the registry
	// responds with 404 Not Found and an HTML page for the error.
	//
	// If it's merely a non-existent registry code, it'll respond with "303 See
	// Other" and redirects to the front page (/est) with a wmsg query parameter
	// hex-encoding the phrase "Juriidilist isikut ei leitud."
	var res = await exports(url, {
		headers: {
			Accept: "application/json",
			"X-Requested-With": "XMLHttpRequest"
		}
	})

	if (res.status >= 300 && res.status < 400) return null
	var {status, data: {html}} = res.body
	return status == "OK" ? html : null
}
