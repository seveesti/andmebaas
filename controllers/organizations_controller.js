var _ = require("root/lib/underscore")
var I18n = require("root/lib/i18n")
var Router = require("express").Router
var DateFns = require("date-fns")
var HttpError = require("standard-http-error")
var Crypto = require("crypto")
var Config = require("root/config")
var Csv = require("root/lib/csv")
var RegisterXml = require("root/lib/estonian_business_register_xml")
var {parseOrder} = require("root/lib/filtering")
var taxesDb = require("root/db/organization_taxes_db")
var taxesUpdatesDb = require("root/db/organization_taxes_updates_db")
var businessRegisterApi = require("root/lib/estonian_business_register_api")
var sql = require("sqlate")
var sqlite = require("root").sqlite
var organizationsDb = require("root/db/organizations_db")
var registryCardsDb = require("root/db/organization_registry_cards_db")
var accountsDb = require("root/db/accounts_db")
var membersDb = require("root/db/organization_members_db")
var updatesDb = require("root/db/organization_updates_db")
var parseRegistryCard = require("root/lib/estonian_registry_card").parse
var {assertAdmin} = require("root/lib/middleware/session_middleware")
var sendEmail = require("root").sendEmail
var renderTable = require("root/views/organizations/index_page").Table
var BUSINESS_MODELS = new Set(_.keys(require("root/lib/business_models")))
var REGIONS = require("root/lib/regions")
var GOALS = require("root/lib/sustainability_goals")
var LANGS = require("root/config").languages
var DEFAULT_LANG = LANGS[0]
exports.router = Router({mergeParams: true})
exports.isAdminOrMember = isAdminOrMember

var ORDER_COLUMNS = {
	name: sql`org.name`,
	revenue: sql`revenue`,
	"founded-on": sql`org.founded_on`,
	"employee-count": sql`COALESCE(updates.employee_count, taxes.employee_count)`
}

var DEFAULT_ORG = {
	other_urls: [],
	email: null,
	founded_on: null,
	logo: null,
	logo_type: null,
	published_at: null,
	regions: new Set,
	board_members: [],
	sev_member: false,
	short_descriptions: {},
	long_descriptions: {},
	sustainability_goals: new Set,
	business_models: new Set,
	url: null
}

exports.router.get("/", function(req, res) {
	var {account} = req
	var {lang} = req.t
	var filters = parseFilters(req.query)
	var order = req.query.order ? parseOrder(req.query.order) : null
	var format = req.accepts(["html", "text/csv"])
	var taxQuarters = []
	var taxQuarter = null

	if (format != "text/csv") {
		taxQuarters = taxesDb.search(sql`
			SELECT year, quarter
			FROM organization_taxes
			GROUP BY year, quarter
			ORDER BY year DESC, quarter DESC
		`)

		var ynq = req.query.quarter && _.parseYearQuarter(req.query.quarter)
		taxQuarter = ynq ? {year: ynq[0], quarter: ynq[1]} : taxQuarters[0]
	}

	var orgs = organizationsDb.search(sql`
		WITH filtered_organizations AS (
			SELECT
				org.registry_code,
				org.name,
				org.founded_on,
				org.business_models,
				org.sustainability_goals,
				org.sev_member,
				org.published_at,
				COALESCE(updates.revenue, taxes.revenue) as revenue,

				${format == "text/csv" ? sql`
					COALESCE(
						json_extract(short_descriptions, ${"$." + lang}),
						json_extract(short_descriptions, ${"$." + DEFAULT_LANG})
					) AS short_description,

					COALESCE(
						json_extract(long_descriptions, ${"$." + lang}),
						json_extract(long_descriptions, ${"$." + DEFAULT_LANG})
					) AS long_description,

					org.email,
					org.url,
					org.other_urls,
					org.board_members,
					org.business_models,
					org.regions,
					org.sustainability_goals,
				` : sql``}

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
					AND org.business_models LIKE ${`%${m}%`}
				`)
			) : sql``}

			${filters.sevMember ? sql`AND sev_member` : sql``}

			GROUP BY org.registry_code

			${order ? sql`
				ORDER BY ${ORDER_COLUMNS[order[0]]}
				${order[1] == "asc" ? sql`ASC` : sql`DESC`}
				NULLS LAST
			`: sql`ORDER BY org.name ASC`}
		)

		SELECT * FROM filtered_organizations
		WHERE true

		${filters.employeeCounts ? sql`AND (
			${sql.concat(_.intersperse(filters.employeeCounts.map(([a, b]) => sql`(
				latest_employee_count >= ${a}  AND latest_employee_count < ${b}
			)`), sql` OR `))}
		)` : sql``}
	`)

	// The number of organizations is too low to bother with database
	// normalization or writing a complicated query to unpack the JSON array.
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

		default:
			if (req.headers.prefer == "return=minimal") res.send(String(renderTable({
				t: req.t,
				path: req.baseUrl,
				account,
				organizations: orgs,
				taxQuarters,
				taxQuarter,
				filters,
				order
			})))
			else res.render("organizations/index_page.jsx", {
				organizations: orgs,
				taxQuarters,
				taxQuarter,
				filters,
				order
			})
	}
})

exports.router.post("/", _.next(async function(req, res) {
	var attrs = parse(null, req.account, req.body, req.files)
	var registryCode = attrs.registry_code = String(req.body.registry_code)
	var org = organizationsDb.read(registryCode)

	if (org) {
		if (!org.published_at)
			throw new HttpError(422, "Organization Already Exists", {
				description: req.t(
					"organizations_page.create_organization.already_exists"
				)
			})

		res.statusMessage = "Organization Already Exists"

		res.flash("notice",
			req.t("organizations_page.create_organization.already_exists")
		)

		return void res.redirect(302, req.baseUrl + "/" + registryCode)
	}

	// Reusing the registry card because adding an organization is a two-step
	// process — first we ask for the registry code, fetch related data from the
	// Business Register and display a prefilled form to add other details.
	var card = registryCardsDb.read(sql`
		SELECT * FROM organization_registry_cards
		WHERE registry_code = ${registryCode}
		AND content_type = 'application/xml'
		AND issued_at > ${DateFns.addDays(new Date, -7)}
		ORDER BY created_at DESC
		LIMIT 1
	`), cardAttrs

	if (card)
		cardAttrs = parseRegistryCard(RegisterXml.parse(card.content).item)
	else {
		var cardEl = await businessRegisterApi.readRegistryCard(registryCode)

		if (cardEl) {
			cardAttrs = parseRegistryCard(cardEl)

			var now = new Date

			registryCardsDb.create({
				registry_code: cardAttrs.registryCode,
				created_at: now,
				issued_at: now,
				content: RegisterXml.serialize({item: cardEl}),
				content_type: "application/xml"
			})
		}
		else throw new HttpError(422, "Organization Not In Business Register", {
			description: req.t(
				"organizations_page.create_organization.not_in_registry"
			)
		})
	}

	_.assign(attrs, {
		registry_code: cardAttrs.registryCode,
		official_name: cardAttrs.name,
		founded_on: cardAttrs.foundedOn,
		board_members: cardAttrs.boardMembers
	})

	if ("name" in attrs) {
		org = organizationsDb.create(_.assign(attrs, {created_at: new Date}))

		var appUrl = Config.url
		var orgUrl = appUrl + "/enterprises/" + org.registry_code
		var signinUrl = appUrl + "/sessions/new"

		var admins = accountsDb.search(sql`
			SELECT * FROM accounts WHERE administrative
		`)

		await sendEmail({
			to: admins.map((account) => account.email),

			subject: I18n.t(DEFAULT_LANG, "organization_created_email.subject", {
				organizationName: org.name
			}),

			text: I18n.t(DEFAULT_LANG, "organization_created_email.body", {
				organizationName: org.name,
				organizationUrl: orgUrl,
				signinUrl
			})
		})

		res.statusMessage = "Organization Created"
		res.flash("notice", req.t("organization_create_page.created"))
		res.redirect(303, req.baseUrl)
	}
	else {
		res.statusMessage = "Organization Creatable"

		res.render("organizations/update_page.jsx", {
			new: true,

			organization: _.defaults(attrs, {
				taxes: [],
				name: cardAttrs.name,
				email: cardAttrs.email
			}, DEFAULT_ORG)
		})
	}
}))

exports.router.use("/:registryCode", function(req, res, next) {
	var {lang} = req.t

	var org = organizationsDb.read(sql`
		SELECT
			registry_code,
			name,
			official_name,
			founded_on,
			url,
			email,
			other_urls,
			board_members,
			business_models,
			regions,
			sustainability_goals,
			created_at,
			sev_member,
			published_at,
			logo_type,

			COALESCE(
				json_extract(short_descriptions, ${"$." + lang}),
				json_extract(short_descriptions, ${"$." + DEFAULT_LANG})
			) AS short_description,

			COALESCE(
				json_extract(long_descriptions, ${"$." + lang}),
				json_extract(long_descriptions, ${"$." + DEFAULT_LANG})
			) AS long_description

		FROM organizations WHERE registry_code = ${req.params.registryCode}
	`)

	if (org == null) throw new HttpError(404, "Organization Not Found", {
		description: req.t("organization_page.404_description")
	})

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
	var format = req.accepts(["html", "text/csv"])

	var updates = updatesDb.search(sql`
		SELECT "update".*, account.name, account.email
		FROM organization_updates AS "update"
		JOIN accounts AS account ON account.id = "update".by_id
		WHERE "update".registry_code = ${org.registry_code}
		ORDER BY at DESC
		LIMIT 25
	`)

	switch (format) {
		case "text/csv":
			res.setHeader("Content-Type", "text/csv")
			return void res.end(serializeOrganizationsAsCsv([org]))

		default: res.render("organizations/read_page.jsx", {updates})
	}
})

exports.router.get("/:registryCode/edit", assertMember, function(req, res) {
	var org = req.organization

	_.assign(org, _.pick(organizationsDb.read(sql`
		SELECT short_descriptions, long_descriptions
		FROM organizations WHERE registry_code = ${org.registry_code}
	`), ["short_descriptions", "long_descriptions"]))

	res.render("organizations/update_page.jsx")
})

exports.router.put("/:registryCode", assertMember, function(req, res) {
	var org = req.organization
	var {account} = req

	sqlite.transact(function() {
		var attrs = parse(org, account, req.body, req.files)
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

	res.statusMessage = "Organization Updated"
	res.flash("notice", req.t("organization_update_page.updated"))
	res.redirect(303, req.baseUrl + "/" + org.registry_code)
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

	res.statusMessage = "Organization Deleted"
	res.flash("notice", req.t("organization_update_page.deleted"))
	res.redirect(303, req.baseUrl)
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

	var newInvitee = invitee == null

	var inviteToken
	if (newInvitee) {
		inviteToken = Crypto.randomBytes(8)

		invitee = accountsDb.create({
			name,
			email,
			invite_token_sha256: _.sha256(inviteToken)
		})

		var siteUrl = Config.url
		var inviteUrl = siteUrl + "/accounts/invites/" + inviteToken.toString("hex")
		var signinUrl = siteUrl + "/sessions/new"

		await sendEmail({
			to: email,
			subject: I18n.t(DEFAULT_LANG, "organization_member_invite_email.subject"),

			text: I18n.t(DEFAULT_LANG, "organization_member_invite_email.body", {
				organizationName: org.name,
				inviteUrl,
				signinUrl
			})
		})
	}

	try {
		membersDb.create({
			registry_code: org.registry_code,
			account_id: invitee.id,
			created_at: new Date,
			created_by_id: account.id
		})
	}
	catch (err) {
		if (err.code == "SQLITE_CONSTRAINT_PRIMARYKEY") {
			res.statusMessage = "Member Already Exists"
			res.flash("error", req.t("organization_members_page.already_exists"))
			return void res.redirect(303, req.baseUrl + req.path)
		}

		throw err
	}

	if (newInvitee) {
		res.statusMessage = "Member Created and Invited"
		res.flash("notice", req.t("organization_members_page.created_and_invited"))
	}
	else {
		res.statusMessage = "Member Created"
		res.flash("notice", req.t("organization_members_page.created"))
	}

	res.redirect(303, req.baseUrl + "/" + org.registry_code + "/members")
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
	res.flash("notice", req.t("organization_members_page.removed"))
	res.redirect(303, req.baseUrl + "/" + org.registry_code + "/members")
})

function parseFilters(query) {
	var filters = {}

	if (query["employee-count"]) filters.employeeCounts = parseEmployeeCounts(
		_.concat(query["employee-count"])
	)

	if (query["business-model"]) filters.businessModels = parseBusinessModels(
		_.concat(query["business-model"])
	)

	if (query.sdg) {
		var goals = parseSustainabilityGoals(_.concat(query.sdg))
		if (goals.size > 0) filters.sustainabilityGoals = goals
	}

	if (query["sev-member"])
		filters.sevMember = _.parseBoolean(query["sev-member"])

	return filters
}

function parse(org, account, obj, files) {
	var attrs = {}

	if ("name" in obj) attrs.name = obj.name.trim() || null
	if ("email" in obj) attrs.email = obj.email.trim() || null
	if ("url" in obj) attrs.url = obj.url.trim() || null
	if ("regions" in obj) attrs.regions = parseRegions(obj.regions || {})

	if ("other_urls" in obj) attrs.other_urls =
		obj.other_urls.split(/\n/g).map((url) => url.trim()).filter(Boolean)

	if (account && account.administrative && "published" in obj)
		attrs.published_at = _.parseBoolean(obj.published)
			? org && org.published_at || new Date
			: null

	if ("short_descriptions" in obj) attrs.short_descriptions =
		_.mapValues(obj.short_descriptions, (desc, lang) => (
			LANGS.includes(lang) && desc.trim() || undefined
		))

	if ("long_descriptions" in obj) attrs.long_descriptions =
		_.mapValues(obj.long_descriptions, (desc, lang) => (
			LANGS.includes(lang) && desc.trim() || undefined
		))

	if ("business_models" in obj)
		attrs.business_models = parseBusinessModels(obj.business_models || {})

	if ("sustainability_goals" in obj) attrs.sustainability_goals =
		parseSustainabilityGoals(obj.sustainability_goals)

	if (files.logo && isValidImageType(files.logo.mimetype)) {
		attrs.logo = files.logo.buffer
		attrs.logo_type = files.logo.mimetype
	}

	if (account && account.administrative && "sev_member" in obj)
		attrs.sev_member = _.parseBoolean(obj.sev_member)

	return attrs
}

function parseEmployeeCounts(countRanges) {
	return countRanges.map(function(range) {
		var [from, to] = range.split("-")
		return [Number(from) || 0, to ? Number(to) : Infinity]
	})
}

function parseBusinessModels(models) {
	return new Set(models.filter((model) => BUSINESS_MODELS.has(model)))
}

function parseSustainabilityGoals(goals) {
	return new Set(goals.filter((goal)=> GOALS.includes(goal)))
}

function parseRegions(regions) {
	return new Set(regions.filter((region) => REGIONS.has(region)))
}

function parseTaxesUpdates(objs) {
	return _.map(objs, function(obj, yearAndQuarter) {
		var ynq = _.parseYearQuarter(yearAndQuarter)
		if (ynq == null) throw new RangeError(422, "Invalid Year and Quarter")
		var [year, quarter] = ynq

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
		description: req.t("organization_page.403_description")
	})
}

function isAdminOrMember(members, account) {
	return (
		account.administrative ||
		members.find((member) => member.account_id == account.id)
	)
}

function serializeOrganizationsAsCsv(organizations) {
	// Presuming people care more about the latest quarter and if they've made
	// formulas referencing columns by position, they'll get updated results if
	// they just paste over the old table. For more advanced uses, identifying
	// columns by name is more sustainable.
	var taxQuarters = Array.from(new Set(_.flatten(organizations.map((org) => (
		org.taxes.map(({year, quarter}) => _.formatYearQuarter(year, quarter))
	))))).sort().reverse()

	var header = _.concat([
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
	], _.flatten(taxQuarters.map((yearAndQuarter) => [
		yearAndQuarter + "_revenue",
		yearAndQuarter + "_taxes",
		yearAndQuarter + "_employee_count",
		yearAndQuarter + "_employment_taxes"
	])))

	var rows = organizations.map(function(org) {
		return _.concat([
			org.name,
			org.registry_code,
			org.founded_on && _.formatDate("iso", org.founded_on),
			org.short_description,
			org.long_description,
			org.email || "",
			org.url,
			org.other_urls.join("\n"),
			Array.from(org.sustainability_goals).join("\n"),
			Array.from(org.business_models).join("\n"),
			Array.from(org.regions).join("\n"),
			org.board_members.join("\n")
		], _.flatten(taxQuarters.map(function(yearAndQuarter) {
			var [year, quarter] = _.parseYearQuarter(yearAndQuarter)

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

	return _.concat([header], rows).map(Csv.serialize).join("\n")
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
