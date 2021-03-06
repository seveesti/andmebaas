var _ = require("root/lib/underscore")
var I18n = require("root/lib/i18n")
var ValidOrganization = require("root/test/valid_organization")
var parseHtml = require("root/test/html").parse
var parseCsv = require("csv-parse/lib/sync")
var outdent = require("root/lib/outdent")
var organizationsDb = require("root/db/organizations_db")
var registryCardsDb = require("root/db/organization_registry_cards_db")
var updatesDb = require("root/db/organization_updates_db")
var taxesDb = require("root/db/organization_taxes_db")
var sql = require("sqlate")
var wrapRegistryCardHtml = require("../lib/registry_card").wrapBoilerplate
var LANGS = require("root/config").languages
var DEFAULT_LANG = LANGS[0]
var t = I18n.t.bind(null, DEFAULT_LANG)

var CSV_HEADERS = [
	"name",
	"registry_code",
	"founded_on",
	"short_description",
	"long_description",
	"email",
	"url",
	"other_urls",
	"goals",
	"business_models",
	"regions",
	"board_members"
]

describe("OrganizationsController", function() {
	require("root/test/db")()
	require("root/test/web")()
	require("root/test/fixtures").csrf()

	describe("GET /", function() {
		it("must render given no organizations", async function() {
			var res = await this.request("/enterprises")
			res.statusCode.must.equal(200)

			var dom = parseHtml(res.body)
			var table = dom.body.querySelector("#organizations-table")
			var text = table.tBodies[0].textContent
			text.must.include(t("organizations_page.empty_placeholder"))
		})
	})

	describe("GET / as application/csv", function() {
		it("must respond with empty CSV given no organizations", async function() {
			var res = await this.request("/enterprises.csv")
			res.statusCode.must.equal(200)
			res.headers["content-type"].must.equal("text/csv")
			res.body.must.equal(CSV_HEADERS.join(","))
		})

		it("must not respond with unpublished organizations", async function() {
			organizationsDb.create({
				registry_code: "31337121",
				name: "Example OÜ"
			})

			var res = await this.request("/enterprises.csv")
			res.statusCode.must.equal(200)
			res.headers["content-type"].must.equal("text/csv")
			res.body.must.equal(CSV_HEADERS.join(","))
		})

		it("must respond with minimal organization", async function() {
			var org = organizationsDb.create({
				registry_code: "31337121",
				name: "Example OÜ",
				published_at: new Date
			})

			var res = await this.request("/enterprises.csv")
			res.statusCode.must.equal(200)
			res.headers["content-type"].must.equal("text/csv")

			parseCsv(res.body, {columns: true}).must.eql([_.defaults({
				name: org.name,
				registry_code: org.registry_code
			}, _.object(CSV_HEADERS, () => ""))])
		})

		it("must respond with organization", async function() {
			var org = organizationsDb.create({
				registry_code: "31337121",
				name: "Example OÜ",
				founded_on: new Date(2015, 5, 18),
				short_descriptions: {et: "Good company."},
				long_descriptions: {et: "Really good company."},
				url: "http://example.com",
				email: "now@example.com",
				regions: new Set(["harju", "tartu"]),
				sustainability_goals: new Set(["1", "5", "culture"]),
				business_models: new Set(["b2b", "b2g"]),
				published_at: new Date,

				board_members: [
					"John Smith",
					"Mary Smith"
				],

				other_urls: [
					"http://facebook.com/example",
					"http://twitter.com/example",
					"http://linkedin.com/example"
				]
			})

			taxesDb.create({
				registry_code: org.registry_code,
				year: 2015,
				quarter: 2,
				revenue: 11,
				taxes: 22,
				employee_count: 33,
				employment_taxes: 44
			})

			var res = await this.request("/enterprises.csv")
			res.statusCode.must.equal(200)
			res.headers["content-type"].must.equal("text/csv")

			parseCsv(res.body, {columns: true}).must.eql([{
				name: org.name,
				registry_code: org.registry_code,
				founded_on: "2015-06-18",
				goals: "1\n5\nculture",
				business_models: "b2b\nb2g",
				url: "http://example.com",
				email: "now@example.com",
				short_description: org.short_descriptions.et,
				long_description: org.long_descriptions.et,
				regions: "harju\ntartu",

				board_members: outdent`
					John Smith
					Mary Smith
				`,

				other_urls: outdent`
					http://facebook.com/example
					http://twitter.com/example
					http://linkedin.com/example
				`,

				"2015Q2_revenue": "11",
				"2015Q2_taxes": "22",
				"2015Q2_employee_count": "33",
				"2015Q2_employment_taxes": "44"
			}])
		})

		it("must respond with organizations", async function() {
			var orgs = organizationsDb.create(_.times(3, (i) => ({
				registry_code: String(31337120 + i),
				name: "Example OÜ #" + (i + 1),
				sustainability_goals: new Set([String(i + 1), "5", "7"]),
				published_at: new Date
			})))

			var res = await this.request("/enterprises.csv")
			res.statusCode.must.equal(200)
			res.headers["content-type"].must.equal("text/csv")

			parseCsv(res.body, {
				columns: true
			}).must.eql(orgs.map((org, i) => _.defaults({
				name: org.name,
				registry_code: org.registry_code,
				goals: [i + 1, 5, 7].join("\n")
			}, _.object(CSV_HEADERS, () => ""))))
		})

		it("must respond with organizations with all tax quarters",
			async function() {
			var a = organizationsDb.create({
				registry_code: "31337121",
				name: "Example A OÜ",
				published_at: new Date
			})

			var b = organizationsDb.create({
				registry_code: "31337123",
				name: "Example B OÜ",
				published_at: new Date
			})

			taxesDb.create({
				registry_code: a.registry_code,
				year: 2015,
				quarter: 1,
				revenue: 11,
				taxes: 22,
				employee_count: 33,
				employment_taxes: 44
			})

			taxesDb.create({
				registry_code: b.registry_code,
				year: 2015,
				quarter: 3,
				revenue: 55,
				taxes: 66,
				employee_count: 77,
				employment_taxes: 88
			})

			var res = await this.request("/enterprises.csv")
			res.statusCode.must.equal(200)
			res.headers["content-type"].must.equal("text/csv")

			var defaults = _.assign(_.object(CSV_HEADERS, () => ""), {
				"2015Q1_revenue": "",
				"2015Q1_taxes": "",
				"2015Q1_employee_count": "",
				"2015Q1_employment_taxes": "",
				"2015Q3_revenue": "",
				"2015Q3_taxes": "",
				"2015Q3_employee_count": "",
				"2015Q3_employment_taxes": ""
			})

			parseCsv(res.body, {columns: true}).must.eql([_.defaults({
				name: a.name,
				registry_code: a.registry_code,
				"2015Q1_revenue": "11",
				"2015Q1_taxes": "22",
				"2015Q1_employee_count": "33",
				"2015Q1_employment_taxes": "44"
			}, defaults), _.defaults({
				name: b.name,
				registry_code: b.registry_code,
				"2015Q3_revenue": "55",
				"2015Q3_taxes": "66",
				"2015Q3_employee_count": "77",
				"2015Q3_employment_taxes": "88"
			}, defaults)])
		})
	})

	describe("POST /", function() {
		require("root/test/mitm")()
		require("root/test/time")()
		beforeEach(require("root/test/mitm").router)

		it("must render form and not create organization given only registry code", async function() {
			respondWithOrganizationFromBusinessRegister(
				this.router,
				"31337123",
				"Example MTÜ"
			)

			var res = await this.request("/enterprises", {
				method: "POST",
				form: {registry_code: "31337123"}
			})

			res.statusCode.must.equal(200)
			res.statusMessage.must.equal("Organization Creatable")
			res.headers["content-type"].must.equal("text/html; charset=utf-8")

			organizationsDb.search(sql`SELECT * FROM organizations`).must.be.empty()
		})

		it("must reuse fetched registry card", async function() {
			registryCardsDb.create({
				registry_code: "31337123",
				created_at: new Date,
				issued_at: new Date,
				content: newRegistryCardHtml("31337123", "Example MTÜ"),
				content_type: "text/html"
			})

			var res = await this.request("/enterprises", {
				method: "POST",
				form: {registry_code: "31337123"}
			})

			res.statusCode.must.equal(200)
			res.statusMessage.must.equal("Organization Creatable")
			res.headers["content-type"].must.equal("text/html; charset=utf-8")

			organizationsDb.search(sql`SELECT * FROM organizations`).must.be.empty()
		})

		it("must create organization", async function() {
			registryCardsDb.create({
				registry_code: "31337123",
				created_at: new Date,
				issued_at: new Date,
				content: newRegistryCardHtml("31337123", "Example MTÜ"),
				content_type: "text/html"
			})

			var res = await this.request("/enterprises", {
				method: "POST",
				form: {
					registry_code: "31337123",
					name: "Example Now OÜ",
					url: "http://example.com",
					email: "now@example.com",
					"short_descriptions[et]": "Hea firma!",
					"short_descriptions[en]": "Good company.",
					"long_descriptions[et]": "Tõesti hea firma!",
					"long_descriptions[en]": "Really good company.",
					"business_models[]": "b2c",
					"regions[0]": "harju",
					"regions[1]": "tartu",
					"sustainability_goals[0]": "4",
					"sustainability_goals[1]": "8",
					"sustainability_goals[2]": "culture",

					other_urls: outdent`
						http://facebook.com/example
						http://twitter.com/example
						http://linkedin.com/example
					`
				}
			})

			res.statusCode.must.equal(303)
			res.statusMessage.must.equal("Organization Created")
			res.headers.location.must.equal("/enterprises")

			organizationsDb.read(sql`
				SELECT * FROM organizations
			`).must.eql(new ValidOrganization({
				registry_code: "31337123",
				name: "Example Now OÜ",
				official_name: "Example MTÜ",

				short_descriptions: {
					et: "Hea firma!",
					en: "Good company."
				},

				long_descriptions: {
					et: "Tõesti hea firma!",
					en: "Really good company."
				},

				url: "http://example.com",
				email: "now@example.com",
				business_models: new Set(["b2c"]),
				regions: new Set(["harju", "tartu"]),
				sustainability_goals: new Set(["4", "8", "culture"]),

				other_urls: [
					"http://facebook.com/example",
					"http://twitter.com/example",
					"http://linkedin.com/example"
				]
			}))
		})

		it("must redirect if organization already exists and published",
			async function() {
			var org = organizationsDb.create({
				registry_code: "31337123",
				name: "Example OÜ",
				published_at: new Date
			})

			var res = await this.request("/enterprises", {
				method: "POST",
				form: {registry_code: "31337123"}
			})

			res.statusCode.must.equal(302)
			res.statusMessage.must.equal("Organization Already Exists")
			res.headers.location.must.equal("/enterprises/" + org.registry_code)
		})

		it("must err if organization already exists and not published",
			async function() {
			organizationsDb.create({registry_code: "31337123", name: "Example OÜ"})

			var res = await this.request("/enterprises", {
				method: "POST",
				form: {registry_code: "31337123"}
			})

			res.statusCode.must.equal(422)
			res.statusMessage.must.equal("Organization Already Exists")
		})

		it("must err if registry responds with 303", async function() {
			respondWith303FromBusinessRegister(this.router, "31337123")

			var res = await this.request("/enterprises", {
				method: "POST",
				form: {registry_code: "31337123"}
			})

			res.statusCode.must.equal(422)

			res.statusMessage.must.equal(
				"Organization Not In Business Register"
			)

			organizationsDb.search(sql`SELECT * FROM organizations`).must.be.empty()
		})

		it("must err if registry responds with 404", async function() {
			respondWith404FromBusinessRegister(this.router, "31337123")

			var res = await this.request("/enterprises", {
				method: "POST",
				form: {registry_code: "31337123"}
			})

			res.statusCode.must.equal(422)

			res.statusMessage.must.equal(
				"Organization Not In Business Register"
			)

			organizationsDb.search(sql`SELECT * FROM organizations`).must.be.empty()
		})
	})

	describe("GET /:registryCode", function() {
		it("must render organization", async function() {
			var org = organizationsDb.create({
				registry_code: "31337128",
				name: "Example OÜ",
				published_at: new Date
			})

			var res = await this.request("/enterprises/" + org.registry_code)
			res.statusCode.must.equal(200)
		})
	})

	describe("GET /:registryCode as application/csv", function() {
		it("must respond with organization", async function() {
			var org = organizationsDb.create({
				registry_code: "31337121",
				name: "Example OÜ",
				founded_on: new Date(2015, 5, 18),
				short_descriptions: {et: "Good company."},
				long_descriptions: {et: "Really good company."},
				url: "http://example.com",
				email: "now@example.com",
				regions: new Set(["harju", "tartu"]),
				sustainability_goals: new Set(["1", "5", "culture"]),
				business_models: new Set(["b2b", "b2g"]),
				published_at: new Date,

				board_members: [
					"John Smith",
					"Mary Smith"
				],

				other_urls: [
					"http://facebook.com/example",
					"http://twitter.com/example",
					"http://linkedin.com/example"
				]
			})

			taxesDb.create({
				registry_code: org.registry_code,
				year: 2015,
				quarter: 2,
				revenue: 11,
				taxes: 22,
				employee_count: 33,
				employment_taxes: 44
			})

			var res = await this.request("/enterprises/" + org.registry_code + ".csv")
			res.statusCode.must.equal(200)
			res.headers["content-type"].must.equal("text/csv")

			parseCsv(res.body, {columns: true}).must.eql([{
				name: org.name,
				registry_code: org.registry_code,
				founded_on: "2015-06-18",
				goals: "1\n5\nculture",
				business_models: "b2b\nb2g",
				url: "http://example.com",
				email: "now@example.com",
				short_description: org.short_descriptions.et,
				long_description: org.long_descriptions.et,
				regions: "harju\ntartu",

				board_members: outdent`
					John Smith
					Mary Smith
				`,

				other_urls: outdent`
					http://facebook.com/example
					http://twitter.com/example
					http://linkedin.com/example
				`,

				"2015Q2_revenue": "11",
				"2015Q2_taxes": "22",
				"2015Q2_employee_count": "33",
				"2015Q2_employment_taxes": "44"
			}])
		})
	})

	describe("PUT /:registryCode", function() {
		require("root/test/fixtures").account({administrative: true})

		it("must update organization", async function() {
			var org = organizationsDb.create({
				registry_code: "31337128",
				name: "Example OÜ"
			})

			var res = await this.request("/enterprises/" + org.registry_code, {
				method: "PUT",

				form: {
					name: "Example Now OÜ",
					url: "http://example.com",
					email: "now@example.com",
					"short_descriptions[et]": "Hea firma!",
					"short_descriptions[en]": "Good company.",
					"long_descriptions[et]": "Tõesti hea firma!",
					"long_descriptions[en]": "Really good company.",
					"business_models[]": "b2c",
					"regions[0]": "harju",
					"regions[1]": "tartu",
					"sustainability_goals[0]": "4",
					"sustainability_goals[1]": "8",
					"sustainability_goals[2]": "culture",

					other_urls: outdent`
						http://facebook.com/example
						http://twitter.com/example
						http://linkedin.com/example
					`
				}
			})

			res.statusCode.must.equal(303)
			res.statusMessage.must.equal("Organization Updated")
			res.headers.location.must.equal("/enterprises/" + org.registry_code)

			organizationsDb.read(org).must.eql(_.assign({}, org, {
				name: "Example Now OÜ",

				short_descriptions: {
					et: "Hea firma!",
					en: "Good company."
				},

				long_descriptions: {
					et: "Tõesti hea firma!",
					en: "Really good company."
				},

				url: "http://example.com",
				email: "now@example.com",
				business_models: new Set(["b2c"]),
				regions: new Set(["harju", "tartu"]),
				sustainability_goals: new Set(["4", "8", "culture"]),

				other_urls: [
					"http://facebook.com/example",
					"http://twitter.com/example",
					"http://linkedin.com/example"
				]
			}))
		})

		it("must save updated attributes", async function() {
			var org = organizationsDb.create({
				registry_code: "31337128",
				name: "Example OÜ",
				url: "http://example.com",
				email: "now@example.com",
			})

			var res = await this.request("/enterprises/" + org.registry_code, {
				method: "PUT",

				form: {
					name: "Example Now OÜ",
					url: "http://example.com",
					email: "then@example.com"
				}
			})

			res.statusCode.must.equal(303)
			res.statusMessage.must.equal("Organization Updated")
			res.headers.location.must.equal("/enterprises/" + org.registry_code)

			var update = updatesDb.read(sql`SELECT * FROM organization_updates`)

			update.must.eql({
				id: 1,
				registry_code: org.registry_code,
				by_id: this.account.id,
				at: update.at,
				attributes: ["name", "email"]
			})
		})

		it("must save no updated attributes if equal", async function() {
			var org = organizationsDb.create({
				registry_code: "31337128",
				name: "Example OÜ",

				other_urls: [
					"http://facebook.com/example",
					"http://twitter.com/example",
					"http://linkedin.com/example"
				]
			})

			var res = await this.request("/enterprises/" + org.registry_code, {
				method: "PUT",
				form: {
					name: "Example OÜ",

					other_urls: outdent`
						http://facebook.com/example
						http://twitter.com/example
						http://linkedin.com/example
					`
				}
			})

			res.statusCode.must.equal(303)
			res.statusMessage.must.equal("Organization Updated")
			res.headers.location.must.equal("/enterprises/" + org.registry_code)

			var update = updatesDb.read(sql`SELECT * FROM organization_updates`)

			update.must.eql({
				id: 1,
				registry_code: org.registry_code,
				by_id: this.account.id,
				at: update.at,
				attributes: []
			})
		})
	})
})

function newRegistryCardHtml(registryCode, name) {
	return wrapRegistryCardHtml(outdent`
		<div>Mittetulundusühingute ja sihtasutuste registri kehtivate andmete väljatrükk seisuga  08.11.2021 kell 13:09</div>

		<TABLE>
			<TR><TD colspan='2'>&nbsp;</TD></TR>

			<TR><TD colspan="2"><span>${name} (registrikood ${registryCode}) kohta on avatud Tartu Maakohtu registriosakonna mittetulundusühingu registrikaart&nbsp;nr&nbsp;1:</span></TD></TR>

			<TR><TD colspan='2'>&nbsp;</TD></TR><TR><TD colspan="2"><span>Nimi ja aadress</span></TD></TR>

			<TR>
				<TD><span>1. kanne:</span></TD>
				<TD><span>Nimi on ${name}</span></TD>
			</TR>
		</TABLE>
	`)
}

function respondWithOrganizationFromBusinessRegister(
	router,
	registryCode,
	name
) {
	router.get(`/est/company/${registryCode}/tab/registry_card`, (req, res) => {
		req.headers.host.must.equal("ariregister.rik.ee")
		req.headers["x-requested-with"].must.equal("XMLHttpRequest")
		res.setHeader("Content-Type", "application/json")

		res.end(JSON.stringify({
			status: "OK",
			data: {html: newRegistryCardHtml(registryCode, name)}
		}))
	})
}

function respondWith303FromBusinessRegister(router, registryCode) {
	router.get(`/est/company/${registryCode}/tab/registry_card`, (req, res) => {
		req.headers.host.must.equal("ariregister.rik.ee")

		// Content-Type is still set in their 303 response.
		res.setHeader("Content-Type", "text/html; charset=UTF-8")
		res.statusCode = 303
		res.setHeader("Location", "https://ariregister.rik.ee/est?wmsg=...")
		res.end()
	})
}

function respondWith404FromBusinessRegister(router, registryCode) {
	router.get(`/est/company/${registryCode}/tab/registry_card`, (req, res) => {
		req.headers.host.must.equal("ariregister.rik.ee")
		res.setHeader("Content-Type", "text/html; charset=UTF-8")
		res.statusCode = 404

		res.end(outdent`
			<!DOCTYPE html>
			<html lang="et">
				<head>
					<title>e-Äriregister &ndash; Lehekülge ei leitud</title>
				</head>
			</html>
		`)
	})
}
