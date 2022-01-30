var _ = require("root/lib/underscore")
var Router = require("express").Router
var HttpError = require("standard-http-error")
var Crypto = require("crypto")
var Config = require("root/config")
var Csv = require("root/lib/csv")
var organizationsDb = require("root/db/organizations_db")
var {parseOrder} = require("root/lib/filtering")
var taxesDb = require("root/db/organization_taxes_db")
var taxesUpdatesDb = require("root/db/organization_taxes_updates_db")
var businessRegisterApi = require("root/lib/estonian_business_register_api")
var sql = require("sqlate")
var sqlite = require("root").sqlite
var registryCardsDb = require("root/db/organization_registry_cards_db")
var accountsDb = require("root/db/accounts_db")
var membersDb = require("root/db/organization_members_db")
var updatesDb = require("root/db/organization_updates_db")
var parseRegistryCardHtml = require("root/lib/registry_card").parseHtml
var {assertAdmin} = require("root/lib/middleware/session_middleware")
var logger = require("root").logger
var sendEmail = require("root").sendEmail
var outdent = require("root/lib/outdent")
var concat = Array.prototype.concat.bind(Array.prototype)
var flatten = Function.apply.bind(Array.prototype.concat, Array.prototype)
var BUSINESS_MODELS = new Set(_.keys(require("root/lib/business_models")))
var REGIONS = new Set(_.keys(require("root/lib/regions")))
var GOALS = require("root/lib/sustainability_goals")
exports.router = Router({mergeParams: true})
exports.isAdminOrMember = isAdminOrMember

var ORDER_COLUMNS = {
	name: sql`org.name`,
	revenue: sql`revenue`,
	"employee-count": sql`COALESCE(updates.employee_count, taxes.employee_count)`
}

var ORG_COLUMNS = [
	"registry_code",
	"name",
	"official_name",
	"founded_on",
	"url",
	"other_urls",
	"email",
	"short_description",
	"long_description",
	"board_members",
	"business_models",
	"regions",
	"sustainability_goals",
	"created_at",
	"published_at",
	"logo_type"
]

exports.router.get("/", function(req, res) {
	var {account} = req
	var filters = parseFilters(req.query)
	var order = req.query.order ? parseOrder(req.query.order) : null
	var format = req.accepts(["html", "text/csv"])

	var taxQuarter = format == "text/csv" ? null : taxesDb.read(sql`
		SELECT year, quarter
		FROM organization_taxes
		ORDER BY year DESC, quarter DESC
		LIMIT 1
	`)

	var orgs = organizationsDb.search(sql`
		WITH filtered_organizations AS (
			SELECT
				${sql.csv(ORG_COLUMNS.map((col) => sql`org.${sql.column(col)}`))},

				last_value(COALESCE(updates.employee_count, taxes.employee_count))
				OVER (PARTITION BY org.registry_code ORDER BY taxes.year, taxes.quarter)
				AS latest_employee_count,

				json_group_array(json_object(
					'year', taxes.year,
					'quarter', taxes.quarter,
					'revenue', COALESCE(updates.revenue, taxes.revenue),
					'taxes', COALESCE(updates.taxes, taxes.taxes),

					'employee_count',
						COALESCE(updates.employee_count, taxes.employee_count),

					'employment_taxes',
						COALESCE(updates.employment_taxes, taxes.employment_taxes)
				)) AS taxes

			FROM organizations AS org

			LEFT JOIN organization_taxes AS taxes
			ON taxes.registry_code = org.registry_code

			${taxQuarter ? sql`
				AND taxes.year = ${taxQuarter.year}
				AND taxes.quarter = ${taxQuarter.quarter}
			` : sql``}

			LEFT JOIN organization_taxes_updates AS updates
			ON updates.registry_code = taxes.registry_code
			AND updates.year = taxes.year
			AND updates.quarter = taxes.quarter

			WHERE (
				org.published_at IS NOT NULL

				${account ? (account.administrative ? sql`OR true` : sql`
					OR org.registry_code IN (
						SELECT registry_code FROM organization_members
						WHERE account_id = ${account.id}
					)
				`) : sql``}
			)

			${filters.businessModels ? sql.concat(
				Array.from(filters.businessModels, (m) => sql`
					AND business_models LIKE ${`%${m}%`}
				`)
			) : sql``}

			GROUP BY org.registry_code

			${order ? sql`
				ORDER BY ${ORDER_COLUMNS[order[0]]}
				${order[1] == "asc" ? sql`ASC` : sql`DESC`}
			`: sql`ORDER BY org.name ASC`}
		)

		SELECT * FROM filtered_organizations
		WHERE true

		${filters.employeeCount ? sql`
			AND latest_employee_count >= ${filters.employeeCount[0]}
			AND latest_employee_count < ${filters.employeeCount[1]}
		` : sql``}
	`)

	if (filters.sustainabilityGoals) orgs = orgs.filter((org) => (
		Array.from(filters.sustainabilityGoals).every((id) => (
			org.sustainability_goals.has(id)
		))
	))

	orgs.forEach(function(org) {
		org.taxes = JSON.parse(org.taxes).filter((taxes) => taxes.year)
	})

	switch (format) {
		case "text/csv":
			res.setHeader("Content-Type", "text/csv")
			return void res.end(serializeOrganizationsAsCsv(orgs))

		default: res.render("organizations/index_page.jsx", {
			organizations: orgs,
			taxQuarter,
			filters,
			order
		})
	}
})

exports.router.post("/", assertAdmin, _.next(async function(req, res) {
	var attrs = parse(null, req.body, req.files)
	attrs.registry_code = String(req.body.registry_code)

	var [card, cardHtml] = (
		await readRegistryCardFromBusinessRegister(attrs.registry_code)
	) || []

	var org = organizationsDb.create(_.assign(attrs, {
		official_name: card ? card.name : null,
		founded_on: card ? card.foundedOn : null,
		email: attrs.email || card ? card.email : null,
		board_members: card ? card.boardMembers.map((member) => member.name) : []
	}))

	if (card) createRegistryCard(card, cardHtml)

	res.statusCode = 302
	res.statusMessage = "Organization Created"
	res.flash("notice", "Organisatsioon loodud.")
	res.redirect("/organizations/" + org.registry_code)
}))

exports.router.use("/:registryCode", function(req, res, next) {
	var org = organizationsDb.read(sql`
		SELECT ${sql.csv(ORG_COLUMNS.map(sql.column))}
		FROM organizations
		WHERE registry_code = ${req.params.registryCode}
	`)

	if (org == null) throw new HttpError(404, "Organization Not Found")

	var members = membersDb.search(sql`
		SELECT * FROM organization_members
		WHERE registry_code = ${org.registry_code}
	`)

	var {account} = req

	if (
		org.published_at == null &&
		!(account && isAdminOrMember(members, account))
	) throw new HttpError(403, "Organization Not Public")

	org.taxes = taxesDb.search(sql`
		SELECT
			taxes.year AS year,
			taxes.quarter AS quarter,

			COALESCE(updates.revenue, taxes.revenue) AS revenue,
			COALESCE(updates.taxes, taxes.taxes) AS taxes,
			COALESCE(updates.employee_count, taxes.employee_count) AS employee_count,
			COALESCE(updates.employment_taxes, taxes.employment_taxes)
			AS employment_taxes,

			taxes.revenue AS original_revenue,
			taxes.taxes AS original_taxes,
			taxes.employee_count AS original_employee_count,
			taxes.employment_taxes AS original_employment_taxes

		FROM organization_taxes AS taxes

		LEFT JOIN organization_taxes_updates AS updates
		ON updates.registry_code = taxes.registry_code
		AND updates.year = taxes.year
		AND updates.quarter = taxes.quarter

		WHERE taxes.registry_code = ${org.registry_code}
		ORDER BY taxes.year DESC, taxes.quarter DESC
	`)

	req.organization = org
	req.members = members
	res.locals.organization = org
	next()
})

exports.router.get("/:registryCode", function(req, res) {
	var org = req.organization

	var updates = updatesDb.search(sql`
		SELECT "update".*, account.name, account.email
		FROM organization_updates AS "update"
		JOIN accounts AS account ON account.id = "update".by_id
		WHERE "update".registry_code = ${org.registry_code}
		ORDER BY at DESC
		LIMIT 25
	`)

	res.render("organizations/read_page.jsx", {updates})
})

exports.router.get("/:registryCode/edit", assertMember, function(_req, res) {
	res.render("organizations/update_page.jsx")
})

exports.router.put("/:registryCode", assertMember, function(req, res) {
	var org = req.organization
	var {account} = req

	sqlite.transact(function() {
		var attrs = parse(org, req.body, req.files)
		organizationsDb.update(org, attrs)
		var diff = _.diff(org, attrs)

		if ("taxes" in req.body)
			replaceTaxesUpdates(org, parseTaxesUpdates(req.body.taxes))

		updatesDb.create({
			registry_code: org.registry_code,
			at: new Date,
			by_id: account.id,
			attributes: diff ? _.keys(diff) : []
		})
	})

	res.statusCode = 302
	res.statusMessage = "Organization Updated"
	res.flash("notice", "Organisatsioon uuendatud.")
	res.redirect(303, "/organizations/" + org.registry_code)
})

exports.router.delete("/:registryCode", assertAdmin, function(req, res) {
	var org = req.organization

	sqlite.transact(function() {
		sqlite(sql`
			DELETE FROM organization_registry_cards
			WHERE registry_code = ${org.registry_code}
		`)

		organizationsDb.delete(org)
	})

	res.statusCode = 302
	res.statusMessage = "Organization Deleted"
	res.flash("notice", "Organisatsioon kustutatud.")
	res.redirect(303, "/organizations")
})

exports.router.get("/:registryCode/logo", function(req, res) {
	var org = req.organization

	var logo = organizationsDb.read(sql`
		SELECT logo AS data, logo_type AS type
		FROM organizations WHERE registry_code = ${org.registry_code}
	`)

	if (logo.data == null) throw new HttpError(404)

	res.setHeader("Content-Type", logo.type)
	res.setHeader("Content-Length", logo.data.length)
	res.end(logo.data)
})

exports.router.get("/:registryCode/members", assertAdmin, function(req, res) {
	var org = req.organization

	var members = membersDb.search(sql`
		SELECT member.*, account.name, account.email
		FROM organization_members AS member
		JOIN accounts AS account ON account.id = member.account_id
		WHERE member.registry_code = ${org.registry_code}
	`)

	res.render("organizations/members/index_page.jsx", {members})
})

exports.router.post("/:registryCode/members",
	assertAdmin,
	_.next(async function(req, res) {
	var {account} = req
	var org = req.organization
	var {name, email} = parseMember(req.body)

	var invitee = accountsDb.read(sql`
		SELECT * FROM accounts WHERE email = ${email}
	`)

	var inviteToken
	if (invitee == null) {
		inviteToken = Crypto.randomBytes(8)

		invitee = accountsDb.create({
			name,
			email,
			invite_token_sha256: _.sha256(inviteToken)
		})

		var inviteUrl = Config.url + "/accounts/invites/" + inviteToken.toString("hex")

		await sendEmail({
			to: email,
			subject: "Oled kutsutud täiendama SEV andmebaasi",

			text: outdent`
				Tere

				Sind kutsuti täiendama SEV andmebaasis ${org.name} profiili.
				Alustamiseks loo endale konto ${inviteUrl} lehel.

				Tervitades

				SEV
			`
		})
	}

	membersDb.create({
		registry_code: org.registry_code,
		account_id: invitee.id,
		created_at: new Date,
		created_by_id: account.id
	})

	res.statusMessage = "Member Created"
	res.flash("notice", "Kutsutud.")
	res.redirect(303, "/organizations/" + org.registry_code + "/members")
}))

exports.router.delete("/:registryCode/members/:memberId", assertAdmin,
	function(req, res) {
	var org = req.organization

	membersDb.execute(sql`
		DELETE FROM organization_members
		WHERE registry_code = ${org.registry_code}
		AND account_id = ${req.params.memberId}
	`)

	res.statusMessage = "Member Deleted"
	res.flash("notice", "Liige eemaldatud.")
	res.redirect(303, "/organizations/" + org.registry_code + "/members")
})

function parseFilters(query) {
	var filters = {}

	if (query["employee-count"]) {
		var [from, to] = query["employee-count"].split("-")
		filters.employeeCount = [Number(from) || 0, to ? Number(to) : Infinity]
	}

	if (query["business-models"]) {
		filters.businessModels = parseBusinessModels(query["business-models"])
	}

	if (query.sdg) {
		var goals = parseSustainabilityGoals(query.sdg)
		if (goals.size > 0) filters.sustainabilityGoals = goals
	}

	return filters
}

function parse(org, obj, files) {
	var attrs = {}

	if ("name" in obj) attrs.name = obj.name.trim() || null
	if ("email" in obj) attrs.email = obj.email.trim() || null
	if ("url" in obj) attrs.url = obj.url.trim() || null
	if ("regions" in obj) attrs.regions = parseRegions(obj.regions || {})

	if ("other_urls" in obj) attrs.other_urls =
		obj.other_urls.split(/\n/g).map((url) => url.trim()).filter(Boolean)

	if ("published" in obj) attrs.published_at = _.parseBoolean(obj.published)
		? org && org.published_at || new Date
		: null

	if ("short_description" in obj)
		attrs.short_description = obj.short_description.trim() || null
	if ("long_description" in obj)
		attrs.long_description = obj.long_description.trim() || null
	if ("business_models" in obj)
		attrs.business_models = parseBusinessModels(obj.business_models || {})

	if ("sustainability_goals" in obj) attrs.sustainability_goals =
		parseSustainabilityGoals(obj.sustainability_goals)

	if (files.logo && isValidImageType(files.logo.mimetype)) {
		attrs.logo = files.logo.buffer
		attrs.logo_type = files.logo.mimetype
	}

	return attrs
}

async function readRegistryCardFromBusinessRegister(registryCode) {
	var html

	try {
		html = await businessRegisterApi.readRegistryCardHtml(registryCode)
		return [parseRegistryCardHtml(html), html]
	}
	catch (err) { logger.error(html, err); return null }
}

function createRegistryCard(card, html) {
	registryCardsDb.create({
		registry_code: card.registryCode,
		created_at: new Date,
		issued_at: card.issuedAt,
		content: html,
		content_type: "text/html"
	})
}

function parseBusinessModels(models) {
	return new Set(_.keys(models).filter((model) => BUSINESS_MODELS.has(model)))
}

function parseSustainabilityGoals(goals) {
	return new Set(_.keys(goals).filter((goal)=> GOALS.includes(goal)))
}

function parseRegions(regions) {
	return new Set(_.keys(regions).filter((region) => REGIONS.has(region)))
}

function parseTaxesUpdates(objs) {
	return _.map(objs, function(obj, period) {
		var [year, quarter] = _.parseYearQuarter(period)

		return {
			year,
			quarter,
			revenue: Number(obj.revenue),
			taxes: Number(obj.taxes),
			employee_count: Number(obj.employee_count),
			employment_taxes: Number(obj.employment_taxes)
		}
	})
}

function parseMember(obj) {
	return {
		name: obj.name && String(obj.name) || null,
		email: obj.email && String(obj.email) || null
	}
}

function replaceTaxesUpdates(org, updates) {
	var taxes = _.indexBy(taxesDb.search(sql`
		SELECT * FROM organization_taxes
		WHERE registry_code = ${org.registry_code}
	`), ({year, quarter}) => `${year}Q${quarter}`)

	taxesUpdatesDb.execute(sql`
		DELETE FROM organization_taxes_updates
		WHERE registry_code = ${org.registry_code}
	`)

	taxesUpdatesDb.create(updates.map(function(updates) {
		var old = taxes[`${updates.year}Q${updates.quarter}`]
		if (old == null) return null

		return {
			registry_code: org.registry_code,
			year: updates.year,
			quarter: updates.quarter,

			revenue: old.revenue == updates.revenue ? null : updates.revenue,
			taxes: old.taxes == updates.taxes ? null : updates.taxes,

			employee_count: old.employee_count == updates.employee_count
				? null
				: updates.employee_count,

			employment_taxes: old.employment_taxes == updates.employment_taxes
				? null
				: updates.employment_taxes
		}
	}).filter(Boolean))
}

function assertMember(req, _res, next) {
	var {account} = req
	var {members} = req

	if (account == null) throw new HttpError(401, "Not Signed In")
	if (isAdminOrMember(members, account)) return void next()

	throw new HttpError(403, "Not An Organization Member", {
		description: "Organisatsiooni andmete muutmiseks pead olema organisatsiooni liige. Palun võta selleks meiega ühendust."
	})
}

function isAdminOrMember(members, account) {
	return (
		account.administrative ||
		members.find((member) => member.account_id == account.id)
	)
}

function serializeOrganizationsAsCsv(organizations) {
	// Keep older quarters first so their column position wouldn't change in time.
	// This makes updating their spreadsheets easier for people.
	var taxQuarters = Array.from(new Set(flatten(organizations.map((org) => (
		org.taxes.map(({year, quarter}) => `${year}Q${quarter}`)
	))))).sort()

	var header = concat([
		"name",
		"registry_code",
		"short_description",
		"long_description",
		"email",
		"url",
		"other_urls",
		"goals",
		"business_models",
		"regions",
		"board_members"
	], flatten(taxQuarters.map((yearAndQuarter) => [
		yearAndQuarter + "_revenue",
		yearAndQuarter + "_taxes",
		yearAndQuarter + "_employee_count",
		yearAndQuarter + "_employment_taxes"
	])))

	var rows = organizations.map(function(org) {
		return concat([
			org.name,
			org.registry_code,
			org.short_description,
			org.long_description,
			org.email || "",
			org.url,
			org.other_urls.join("\n"),
			Array.from(org.sustainability_goals).join("\n"),
			Array.from(org.business_models).join("\n"),
			Array.from(org.regions).join("\n"),
			org.board_members.join("\n")
		], flatten(taxQuarters.map(function(yearAndQuarter) {
			var [year, quarter] = yearAndQuarter.split("Q").map(Number)

			var taxes = org.taxes.find((taxes) => (
				taxes.year == year && taxes.quarter == quarter
			))

			return [
				taxes ? taxes.revenue : "",
				taxes ? taxes.taxes : "",
				taxes ? taxes.employee_count : "",
				taxes ? taxes.employment_taxes : ""
			]
		})))
	})

	return concat([header], rows).map(Csv.serialize).join("\n")
}

function isValidImageType(type) {
  switch (type) {
    case "image/png":
    case "image/jpeg":
    case "image/gif":
    case "image/svg+xml": return true
    default: return false
  }
}
