var Neodoc = require("neodoc")
var organizationsDb = require("root/db/organizations_db")
var businessRegisterApi = require("root/lib/estonian_business_register_api")
var parseRegistryCardHtml = require("root/lib/registry_card").parseHtml
var registryCardsDb = require("root/db/organization_registry_cards_db")

var USAGE_TEXT = `
Usage: sev organizations create [options] <registry-code> [<name>]
       sev organizations (-h | --help)

Options:
    -h, --help   Display this help and exit.

Commands:
    create  Create a new organization and read its registry card.
`

module.exports = async function(argv) {
  var args = Neodoc.run(USAGE_TEXT, {argv: argv})
  if (args["--help"]) return void process.stdout.write(USAGE_TEXT.trimLeft())

	if (args.create) await createOrganization(
		String(args["<registry-code>"]),
		String(args["<name>"])
	)
	else process.stdout.write(USAGE_TEXT.trimLeft())
}

async function createOrganization(registryCode, name) {
	var org = organizationsDb.read(registryCode)

	if (org) {
		console.warn("Already present: %s.", registryCode)
		process.exit(2)
	}

	var html = await businessRegisterApi.readRegistryCardHtml(registryCode)
	var card = parseRegistryCardHtml(html)

	if (name == null) name = card.name
	console.log("Creating %s (%s)…", name, card.registryCode)

	organizationsDb.create({
		registry_code: card.registryCode,
		name: name,
		official_name: card.name,
		founded_on: card.foundedOn,
		email: card.email,
		board_members: card.boardMembers.map((member) => member.name)
	})

	registryCardsDb.create({
		registry_code: card.registryCode,
		created_at: new Date,
		issued_at: card.issuedAt,
		content: html,
		content_type: "text/html"
	})
}
