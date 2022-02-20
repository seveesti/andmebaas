var _ = require("root/lib/underscore")
var Router = require("express").Router
var HttpError = require("standard-http-error")
var MediaType = require("medium-type")
var Emta = require("root/lib/emta")
var taxesDb = require("root/db/organization_taxes_db")
var sql = require("sqlate")
var {assertAdmin} = require("root/lib/middleware/session_middleware")

exports.router = Router({mergeParams: true})
exports.router.use(assertAdmin)

exports.router.get("/", function(_req, res) {
	var quarters = taxesDb.search(sql`
		SELECT year, quarter
		FROM organization_taxes
		GROUP BY year, quarter
		ORDER BY year DESC, quarter DESC
	`)

	res.render("taxes/index_page.jsx", {quarters})
})

exports.router.post("/", _.next(async function(req, res) {
	var {year, quarter, csv} = parse(req.body, req.files)

	taxesDb.execute(sql`BEGIN`)

	try {
		taxesDb.execute(sql`
			DELETE FROM organization_taxes
			WHERE year = ${year} AND quarter = ${quarter}
		`)

		for await (var attrs of Emta.parse(year, quarter, csv)) {
			try { taxesDb.create(attrs) }
			catch (ex) { console.error("Failed to insert:", attrs); throw ex }
		}

		taxesDb.execute(sql`COMMIT`)
	}
	catch (ex) { taxesDb.execute(sql`ROLLBACK`); throw ex }

	res.statusMessage = "Tax Info Imported"
	res.flash("notice", req.t("taxes_page.created", {year, quarter}))
	res.redirect(303, req.baseUrl)
}))

exports.router.delete("/:quarter", function(req, res) {
	var ynq = _.parseYearQuarter(req.params.quarter)
	if (ynq == null) throw new HttpError(422, "Invalid Year and Quarter")
	var [year, quarter] = ynq

	taxesDb.execute(sql`
		DELETE FROM organization_taxes WHERE year = ${year} AND quarter = ${quarter}
	`)

	res.statusMessage = "Tax Info Deleted"
	res.flash("notice", req.t("taxes_page.deleted", {year, quarter}))
	res.redirect(303, req.baseUrl)
})

function parse(obj, files) {
	var year = Number(obj.year)
	var quarter = Math.max(1, Math.min(Number(obj.quarter), 4))

	var csvFile = files.csv
	if (csvFile == null) throw new HttpError(422, "Missing Tax CSV")

	var csvType = new MediaType(csvFile.mimetype)
	if (csvType.name != "text/csv") throw new HttpError(422, "Tax CSV Not text/csv")
	return {year, quarter, csv: csvFile.buffer}
}
