var _ = require("root/lib/underscore")
var Neodoc = require("neodoc")
var Stream = require("root/lib/stream")
var RegisterXml = require("root/lib/estonian_business_register_xml")
var concatStream = require("concat-stream")
var api = require("root/lib/estonian_business_register_api")
var organizationsDb = require("root/db/organizations_db")
var registryCardsDb = require("root/db/organization_registry_cards_db")
var parseRegistryCard = require("root/lib/estonian_registry_card").parse
var sql = require("sqlate")

var USAGE_TEXT = `
Usage: sev estonian-business-register (-h | --help)
       sev estonian-business-register parse-emtak [options] (<path>|-)
       sev estonian-business-register update-registry-card [options] <registry-code>
       sev estonian-business-register update-registry-cards [options]

Options:
    -h, --help   Display this help and exit.

Commands:
    update-registry-card   Update the organization's registry card in the
                           database from the register.
    update-registry-cards  Update the registry cards of all organizations.
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
		parseEmtakCmd(path)
	}
	else if (args["update-registry-cards"]) {
		await updateRegistryCardsCmd()
	}
	else if (args["update-registry-card"]) {
		await updateRegistryCardCmd(String(args["<registry-code>"]))
	}
	else
		process.stdout.write(USAGE_TEXT.trimLeft())
}

function parseEmtakCmd(path) {
	Stream.readCsv(path).pipe(concatStream(function(emtaks) {
		console.log(JSON.stringify(_.fromEntries(emtaks.map(parse)), null, "\t"))
	}))

	function parse(obj) { return [obj.Kood, obj["Tegevusala tekst"]] }
}

async function updateRegistryCardsCmd() {
	var registryCodes = organizationsDb.search(sql`
		SELECT registry_code FROM organizations
	`).map((obj) => obj.registry_code)

	for (var i = 0; i < registryCodes.length; ++i) {
		var registryCode = registryCodes[i]
		console.log(`Updating ${registryCode}…`)
		await updateRegistryCard(registryCode)
	}
}

async function updateRegistryCardCmd(registryCode) {
	var org = organizationsDb.read(registryCode)

	if (org == null)
		throw new Error("Organization not in the database: " + registryCode)

	await updateRegistryCard(registryCode)
}

async function updateRegistryCard(registryCode) {
	var cardEl = await api.readRegistryCard(registryCode)
	var card = parseRegistryCard(cardEl)

	if (card.registryCode != registryCode) throw new Error([
		"Registry card's registry code different from requested: ",
		card.registryCode,
		" vs ",
		registryCode
	].join(""))

	var now = new Date

	registryCardsDb.create({
		registry_code: card.registryCode,
		created_at: now,
		issued_at: now,
		content: RegisterXml.serialize({item: cardEl}),
		content_type: "application/xml"
	})

	organizationsDb.update(card.registryCode, {
		official_name: card.name,
		founded_on: card.foundedOn,
		board_members: card.boardMembers
	})
}
