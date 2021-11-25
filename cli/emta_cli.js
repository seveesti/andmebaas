var _ = require("root/lib/underscore")
var Neodoc = require("neodoc")
var Stream = require("root/lib/stream")
var sql = require("sqlate")
var Emta = require("root/lib/emta")
var sqlite = require("root").sqlite
var taxesDb = require("root/db/organization_taxes_db")

var USAGE_TEXT = `
Usage: cli emta (-h | --help)
       cli emta import-taxes [options] <quarter> (<path>|-)

Options:
    -h, --help   Display this help and exit.
    --replace    Delete given quarter's data before importing.

Commands:
    import-taxes  Import organization tax information CSV.
                  Download from https://www.emta.ee/et/tasutud-maksud.
`

module.exports = async function(argv) {
  var args = Neodoc.run(USAGE_TEXT, {argv: argv})
  if (args["--help"]) return void process.stdout.write(USAGE_TEXT.trimLeft())

	if (args["import-taxes"]) {
		var path
		if (args["-"]) path = ["-"]
		else if ("<path>" in args) path = args["<path>"]
		await importTaxes(path, args["--replace"], args["<quarter>"])
	}
	else process.stdout.write(USAGE_TEXT.trimLeft())
}

async function importTaxes(path, replace, yearAndQuarter) {
	var stream = Stream.read(path, "latin1")
	var [year, quarter] = _.parseYearQuarter(yearAndQuarter)
	await sqlite(sql`BEGIN`)

	if (replace) sqlite(sql`
		DELETE FROM organization_taxes WHERE year = ${year} AND quarter = ${quarter}
	`)

	for await (var attrs of Emta.parseStream(year, quarter, stream)) {
		try { taxesDb.create(attrs) }
		catch (ex) { console.error("Failed to insert:", attrs); throw ex }
	}

	await sqlite(sql`COMMIT`)
}
