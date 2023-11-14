var _ = require("root/lib/underscore")
var Config = require("root/config")
var RegisterXml = require("root/lib/estonian_business_register_xml")
var fetch = require("fetch-off")
var API_URL = "https://ariregxmlv6.rik.ee"

var api = require("fetch-defaults")(fetch, API_URL, {
	timeout: 10000,
	headers: {Accept: "text/xml"}
})

api = require("fetch-parse")(api, {xml: true})
api = require("fetch-throw")(api)
exports = module.exports = api

exports.readRegistryCard = function(registryCode) {
	return exports("/", {
		method: "POST",
		headers: {"Content-Type": "text/xml"},

		body: `<Envelope xmlns="http://schemas.xmlsoap.org/soap/envelope/">
			<Header />

			<Body>
				<detailandmed_v3 xmlns="http://arireg.x-road.eu/producer/">
					<keha>
						<ariregister_kasutajanimi>
							${Config.estonianBusinessRegisterUser}
						</ariregister_kasutajanimi>

						<ariregister_parool>
							${Config.estonianBusinessRegisterPassword}
						</ariregister_parool>

						<ariregistri_kood>${registryCode}</ariregistri_kood>
						<ariregister_valjundi_formaat>xml</ariregister_valjundi_formaat>

						<yandmed>true</yandmed>
						<iandmed>true</iandmed>
						<kandmed>false</kandmed>
						<dandmed>false</dandmed>
						<maarused>false</maarused>
						<keel>est</keel>
					</keha>
				</detailandmed_v3>
			</Body>
		</Envelope>`
	}).then(function(res) {
		// The register responds with an empty <ettevotjad> tag but no <item> if
		// not found.
		var soap = RegisterXml.parse(res.body).soap$Envelope.soap$Body
		var orgs = soap.detailandmed_v3Response.keha.ettevotjad.item || null
		return orgs && (_.isArray(orgs) ? orgs[0] : orgs)
	})
}
