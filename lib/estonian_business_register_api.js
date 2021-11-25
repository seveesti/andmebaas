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

	var res = await exports(url, {
		headers: {
			Accept: "application/json",
			"X-Requested-With": "XMLHttpRequest"
		}
	})

	var {status, data: {html}} = res.body
	if (status != "OK") throw new Error("Invalid status: " + status)
	return html
}
