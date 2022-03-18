var _ = require("root/lib/underscore")
var Neodoc = require("neodoc")
var Stream = require("root/lib/stream")
var concatStream = require("concat-stream")
var api = require("root/lib/estonian_business_register_api")
var organizationsDb = require("root/db/organizations_db")
var registryCardsDb = require("root/db/organization_registry_cards_db")
var parseRegistryCardHtml = require("root/lib/registry_card").parseHtml

var USAGE_TEXT = `
Usage: sev estonian-business-register (-h | --help)
       sev estonian-business-register parse-emtak [options] (<path>|-)
       sev estonian-business-register update-registry-card [options] <registry-code>

Options:
    -h, --help   Display this help and exit.

Commands:
    update-registry-card  Update the organization's registry card in the
                          database from the register.
    parse-emtak  Parse the EMTAK CSV to JSON.
                 Get the CSV from https://emtak.rik.ee/EMTAK/pages/klassifikaatorOtsing.jspx.
`

module.exports = async function(argv) {
  var args = Neodoc.run(USAGE_TEXT, {argv: argv})
  if (args["--help"]) return void process.stdout.write(USAGE_TEXT.trimLeft())

	if (args["parse-emtak"]) {
		var path
		if (args["-"]) path = ["-"]
		else if ("<path>" in args) path = args["<path>"]
		parseEmtak(path)
	}
	else if (args["update-registry-card"]) {
		await readAndParseRegistryCard(String(args["<registry-code>"]))
	}
	else
		process.stdout.write(USAGE_TEXT.trimLeft())
}

function parseEmtak(path) {
	Stream.readCsv(path).pipe(concatStream(function(emtaks) {
		console.log(JSON.stringify(_.fromEntries(emtaks.map(parse)), null, "\t"))
	}))

	function parse(obj) { return [obj.Kood, obj["Tegevusala tekst"]] }
}

async function readAndParseRegistryCard(registryCode) {
	var org = organizationsDb.read(registryCode)

	if (org == null)
		throw new Error("Organization not in the database: " + registryCode)

	var html = await api.readRegistryCardHtml(registryCode)
	var card = parseRegistryCardHtml(html)

	if (card.registryCode != registryCode) throw new Error([
		"Registry card's registry code different from requested: ",
		card.registryCode,
		" vs ",
		registryCode
	].join(""))

	registryCardsDb.create({
		registry_code: card.registryCode,
		created_at: new Date,
		issued_at: card.issuedAt,
		content: html,
		content_type: "text/html"
	})

	organizationsDb.update(org, {
		official_name: card.name,
		founded_on: card.foundedOn,
		board_members: card.boardMembers.map((member) => member.name)
	})
}
