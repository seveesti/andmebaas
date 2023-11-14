var _ = require("./underscore")
var TransformStream = require("stream").Transform
var parseCsv = require("csv-parse")
var EMTAK = _.invert(require("./emtak"))
var CSV_OPTS = {columns: true, delimiter: ";"}
var UTF8_BOM = Buffer.from("efbbbf", "hex")

exports.parse = function(year, quarter, csvs) {
	if (csvs instanceof Buffer)
		csvs = csvs.toString(hasUtf8Bom(csvs) ? "utf8" : "latin1")

	var parse = newParserStream(parseEmtaCsv.bind(null, year, quarter))
	return parseCsv(csvs, CSV_OPTS).pipe(parse)
}

exports.parseStream = function(year, quarter, csvs) {
	var parse = newParserStream(parseEmtaCsv.bind(null, year, quarter))
	return csvs.pipe(parseCsv(CSV_OPTS)).pipe(parse)
}

function parseEmtaCsv(year, quarter, obj) {
	var emtakTitle = obj["EMTAK tegevusvaldkond, mis on EMTAKi struktuuris tähistatud tähtkoodiga"]

	return {
		registry_code: obj.Registrikood,
		year: year,
		quarter: quarter,
		emtak: emtakTitle ? EMTAK[emtakTitle] : null,
		// Revenue can be negative.
		revenue: parseSum(obj.Kaive),
		taxes: parseSum(obj["Riiklikud Maksud"]),
		employee_count: Number(obj.Tootajaid) || 0,
		employment_taxes: parseSum(obj["Tööjõumaksud Ja Maksed"]),
	}
}

function newParserStream(fn) {
	return new TransformStream({
		objectMode: true,

		transform: function(obj, _encoding, done) {
			try { done(null, fn(obj)) }
			catch (err) { err.cause = obj; done(err) }
		}
	})
}

function parseSum(n) { return Number(n.replace(/\s/g, "").replace(/,/g, ".")) }

function hasUtf8Bom(buffer) {
	return UTF8_BOM.equals(buffer.slice(0, UTF8_BOM.length))
}
