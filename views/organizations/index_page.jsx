/** @jsx Jsx */
var _ = require("root/lib/underscore")
var Qs = require("qs")
var Jsx = require("j6pack")
var {Fragment} = Jsx
var Page = require("../page")
var {Section} = Page
var {Form} = Page
var {MoneyElement} = Page
var {FlashSection} = Page
var {SdgImage} = Page
var {javascript} = require("root/lib/jsx")
var SUSTAINABILITY_GOALS = require("root/lib/sustainability_goals")
var BUSINESS_MODELS = require("root/lib/business_models")
var {ROOT_PATH} = Page
exports = module.exports = IndexPage
exports.Table = Table

function IndexPage(attrs) {
	var {req} = attrs
	var {t} = req
	var {account} = req
	var {filters} = attrs
	var {organizations} = attrs
	var {taxQuarters} = attrs
	var {taxQuarter} = attrs
	var {order} = attrs
	var orgsPath = ROOT_PATH + req.baseUrl

	return <Page
		page="organizations"
		title={t("organizations_page.title")}
		req={attrs.req}

		nav={account && [{pages: [
			{name: t("admin_nav.organizations"), path: ROOT_PATH + "/enterprises"},

			account.administrative && {
				name: t("admin_nav.accounts"),
				path: ROOT_PATH + "/accounts"
			},

			account.administrative && {
				name: t("admin_nav.taxes"),
				path: ROOT_PATH + "/taxes"
			}
		].filter(Boolean)}]}

		header={<Fragment>
			<h1 class="page-heading">{t("organizations_page.title")}</h1>
			<p class="page-paragraph">{t("organizations_page.description")}</p>
		</Fragment>}
	>
		<FlashSection flash={req.flash} />

		<Section>
			<Filters
				t={t}
				path={orgsPath}
				filters={filters}
				order={order}
			/>

			<Table
				t={t}
				account={account}
				taxQuarters={taxQuarters}
				taxQuarter={taxQuarter}
				organizations={organizations}
				path={orgsPath}
				filters={filters}
				order={order}
			/>
		</Section>

		<Section id="new-organization-section">
			<Form
				id="new-organization-form"
				class="page-form"
				req={req}
				method="post"
				action={orgsPath}
			>
				<h2 class="page-section-heading">
					{t("organizations_page.create_organization.title")}
				</h2>

				<fieldset>
					<label class="page-form-label">
						{t("organizations_page.create_organization.registry_code")}
					</label>

					<input
						class="page-form-input"
						name="registry_code"
						required
						pattern="[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]"
						inputmode="numeric"
						placeholder={t("organizations_page.create_organization.registry_code_placeholder")}
					/>
				</fieldset>

				<button type="submit" class="white-button">
					{t("organizations_page.create_organization.create")}
				</button>
			</Form>
		</Section>
	</Page>
}

function Table(attrs) {
	var {t} = attrs
	var {account} = attrs
	var {organizations} = attrs
	var {taxQuarters} = attrs
	var {taxQuarter} = attrs
	var orgsPath = attrs.path

	var {filters} = attrs
	var {order} = attrs
	var [orderName, orderDirection] = order || ["name", "asc"]

	var query = _.assign(serializeFiltersQuery(filters), order
		? {order: (orderDirection == "asc" ? "" : "-") + orderName}
		: null
	)

	var employeeCounts = filters.employeeCounts &&
		filters.employeeCounts.map(([a, b]) => `${a}–${b == Infinity ? "" : b}`)

	var {businessModels} = filters
	var sdgs = filters.sustainabilityGoals

	return <table
		id="organizations-table"
		class={
			"page-table" + (account && account.administrative ? " has-form" : "")
		}
	>
		<caption><div>
			<span class="organizations-description">
				{organizations.length == 1
					? t("organizations_page.organization_count_1", {
						count: organizations.length
					})
					: t("organizations_page.organization_count_n", {
						count: organizations.length
					})
				}.

				{" "}

				{account && account.administrative ?
					<a class="link-button" href="#new-organization-form">
						{t("organizations_page.create_new_link")}
					</a>
				: null}

				{_.any(filters) ? <div class="filter">
					<h3>{t("organizations_page.filters.current")}:</h3>

					<ul>
						{employeeCounts ? <li>
							{employeeCounts.join("/")}
							{" "}
							{t("organizations_page.filters.current_filter_employee_count")}
						</li> : null}

						{businessModels ? Array.from(businessModels).map((id) => <li>
							{id.toUpperCase()}
						</li>) : null}

						{sdgs ? Array.from(sdgs).map((id) => <li>
							<SdgImage t={t} goal={id} />
							{/^\d+$/.test(id) ? [<strong>{id}.</strong>, " "] : null}
							{t(`sdg.${id}.title`)}
						</li>) : null}

						{filters.sevMember ? <li>
							<img src={`${ROOT_PATH}/assets/sev-icon.svg`} alt="" />
							{t("organizations_page.filters.current_filter_sev_member")}
						</li> : null}
					</ul>
				</div> : null}
			</span>

			{" "}

			{taxQuarters.length > 0 && taxQuarter ? <span class="taxes-description">
				{t("organizations_page.financials_from")}
				{" "}
				<details>
					<summary>{t("organizations_page.financials_from_quarter", {
						year: taxQuarter.year,
						quarter: taxQuarter.quarter
					})}</summary>

					<div class="dropdown">
						<ol>{taxQuarters.map(function({year, quarter}) {
							var url = orgsPath + Qs.stringify(_.defaults({
								quarter: _.formatYearQuarter(year, quarter)
							}, query), {addQueryPrefix: true})

							var selected = (
								year == taxQuarter.year &&
								quarter == taxQuarters.quarter
							)

							return <li class={selected ? "selected" : ""}><a href={url}>
								{t("organizations_page.financials_from_quarter", {
									year: year,
									quarter:quarter
								})}
							</a></li>
						})}</ol>
					</div>
				</details>
			</span> : null}
		</div></caption>

		<thead class="page-table-header">
			<tr>
				<th
					class="sev-member-column"
					title={t("organizations_page.sev_member")}
				>
					<img src={`${ROOT_PATH}/assets/sev-icon.svg`} alt="" />
				</th>

				<th class="name-column">
					<SortButton
						path={orgsPath}
						query={query}
						name="name"
						sorted={orderName == "name" ? orderDirection : null}
					>
						{t("organizations_page.table.organization_column")}
					</SortButton>
				</th>

				<th class="goals-column">
					{t("organizations_page.table.goals_column")}
				</th>

				<th class="founded-on-column">
					<SortButton
						path={orgsPath}
						query={query}
						name="founded-on"
						sorted={orderName == "founded-on" ? orderDirection : null}
					>
						{t("organizations_page.table.founded_on_column")}
					</SortButton>
				</th>

				<th class="revenue-column">
					<SortButton
						path={orgsPath}
						query={query}
						name="revenue"
						sorted={orderName == "revenue" ? orderDirection : null}
						direction="desc"
					>
						{t("organizations_page.table.revenue_column")}
					</SortButton>
				</th>

				<th class="employee-count-column">
					<SortButton
						path={orgsPath}
						query={query}
						name="employee-count"
						sorted={orderName == "employee-count" ? orderDirection : null}
						direction="desc"
					>
						{t("organizations_page.table.employees_column")}
					</SortButton>
				</th>

				<th class="business-models-column">
					{t("organizations_page.table.business_model_column")}
				</th>
			</tr>
		</thead>

		<tbody>{organizations.length > 0 ? organizations.map(function(org) {
			var orgPath = ROOT_PATH + "/enterprises/" + org.registry_code
			var taxes = org.taxes[0]

			var klass = ["organization"]
			if (!org.published_at) klass.push("unpublished")

			return <Fragment>
				<tr class={klass.join(" ")}>
					<td
						class="sev-member-column"
						title={org.sev_member ? t("organizations_page.sev_member") : null}
					>{org.sev_member
						? <img src={`${ROOT_PATH}/assets/sev-icon.svg`} alt="" />
						: null
					}</td>

					<td class="name-column">
						<a href={orgPath} title={org.name}>{org.name}</a>

						{org.published_at ? "" : <span
							class="unpublished-icon"
							title={t("organizations_page.unpublished")}
						> 🕵</span>}
					</td>

					<td class="goals-column">
						<ul>{Array.from(org.sustainability_goals, (id) => <li>
							<SdgImage t={t} goal={id} />
						</li>)}</ul>
					</td>

					<td
						class="founded-on-column"

						title={org.founded_on ? t("organizations_page.table.founded_on", {
							year: org.founded_on.getFullYear()
						}) : null}
					>
						{org.founded_on ? org.founded_on.getFullYear() : null}
					</td>

					<td class="revenue-column">{taxes ?
						<MoneyElement amount={taxes.revenue} currency="EUR" />
					: null}</td>

					<td class="employee-count-column">{taxes ?
						taxes.employee_count
					: null}</td>

					<td class="business-models-column">
						<ul>{Array.from(org.business_models, (id) => <li>
							{" "}{id.toUpperCase()}
						</li>)}</ul>
					</td>
				</tr>
			</Fragment>
		}) : <tr class="empty-placeholder">
			<td colspan="7">{t("organizations_page.empty_placeholder")}</td>
		</tr>}</tbody>

		<tfoot class="page-table-footer">
			<tr>
				<td colspan="7">
					{Jsx.html(t("organizations_page.download_in_csv", {
						url: orgsPath + ".csv" + Qs.stringify(query, {addQueryPrefix: true})
					}))}
					{" "}
				</td>
			</tr>
		</tfoot>
	</table>
}

function Filters(attrs) {
	var orgsPath = attrs.path
	var {filters} = attrs
	var {t} = attrs
	var [orderName, orderDirection] = attrs.order || ["name", "asc"]

	var employeeCounts = new Set(filters.employeeCounts
		? filters.employeeCounts.map(([a, b]) => `${a}-${b == Infinity ? "" : b}`)
		: []
	)

	var {businessModels} = filters
	var {sustainabilityGoals} = filters

	return <div id="filters">
		<h2>{t("organizations_page.filters.title")}</h2>

		<form
			id="filters-form"
			method="get"
			action={orgsPath}
		>
			<details class="filter">
				<summary>{t("organizations_page.filters.employee_count")}</summary>

				<div class="dropdown">
					<ol>
						<li>
							<label class="sev-checkbox">
								<input
									type="checkbox"
									name="employee-count[]"
									value="0-10"
									checked={employeeCounts.has("0-10")}
								/> 0–9
							</label>
						</li>

						<li>
							<label class="sev-checkbox">
								<input
									type="checkbox"
									name="employee-count[]"
									value="10-50"
									checked={employeeCounts.has("10-50")}
								/> 10–49
							</label>
						</li>

						<li>
							<label class="sev-checkbox">
								<input
									type="checkbox"
									name="employee-count[]"
									value="50-250"
									checked={employeeCounts.has("50-250")}
								/> 50–249
							</label>
						</li>

						<li>
							<label class="sev-checkbox">
								<input
									type="checkbox"
									name="employee-count"
									value="250-"
									checked={employeeCounts.has("250-")}
								/> 250–
							</label>
						</li>
					</ol>
				</div>

				{/* Set order last as that's where the sort buttons put it, too. */}
				<input
					type="hidden"
					name="order"
					value={(orderDirection == "asc" ? "" : "-") + orderName}
				/>
			</details>

			<details class="filter">
				<summary>{t("organizations_page.filters.business_model")}</summary>

				<div class="dropdown">
					<ul>{_.map(BUSINESS_MODELS, (name, id) => <li>
						<label class="sev-checkbox">
							<input
								type="checkbox"
								name="business-model[]"
								value={id}
								checked={businessModels && businessModels.has(id)}
							/>
							{name}
						</label>
					</li>)}</ul>
				</div>
			</details>

			<details class="filter" id="sustainability-goals-filter">
				<summary>{t("organizations_page.filters.goals")}</summary>

				<div class="dropdown">
					<ol>{SUSTAINABILITY_GOALS.map(function(id) {
						return <li>
							<label class="sev-checkbox">
								<SdgImage t={t} goal={id} />

								<input
									type="checkbox"
									name="sdg[]"
									value={id}

									checked={
										sustainabilityGoals && sustainabilityGoals.has(id)
									}
								/>

								{/^\d+$/.test(id) ? <strong>{id}.</strong> : null}
								{" "}
								{t(`sdg.${id}.title`)}
							</label>
						</li>
					})}</ol>
				</div>
			</details>

			<div class="filter" id="sev-member-filter">
				<label class="sev-checkbox">
					<input
						type="checkbox"
						name="sev-member"
						value="on"
						checked={filters.sevMember}
					/>

					<img src={`${ROOT_PATH}/assets/sev-icon.svg`} alt="" />
					SEV liige
				</label>
			</div>

			<noscript>
				<button class="submit-button blue-button">
					{t("organizations_page.filters.filter")}
				</button>
			</noscript>

			<a
				href={orgsPath}
				id="reset-filters-button"
				class="link-button"
				hidden={_.isEmpty(filters)}
			>
				{t("organizations_page.filters.remove")}
			</a>

			<div id="loading-spinner" hidden />
		</form>

		<script>{javascript`
			var filtersEl = document.getElementById("filters")
			var formEl = document.getElementById("filters-form")
			var spinnerEl = document.getElementById("loading-spinner")
			var resetEl = document.getElementById("reset-filters-button")
			var forEach = Function.call.bind(Array.prototype.forEach)

			formEl.addEventListener("change", function(ev) {
				spinnerEl.hidden = false

				try {
					var query = new URLSearchParams(new FormData(formEl))
					var url = ${orgsPath} + "?" + query.toString()

					var hasFilters = (
						query.get("employee-count") ||
						query.get("business-model[]") ||
						query.get("sdg[]")
					)

					var res = fetch(url, {
						headers: {Prefer: "return=minimal"}
					})

					var html = res.then(function(res) {
						if (!res.ok) return void formEl.submit()
						return res.text()
					})

					html.then(function(html) {
						spinnerEl.hidden = true

						// Can't cache the table as it gets replaced every time. ;)
						var tableEl = document.getElementById("organizations-table")
						tableEl.outerHTML = html

						resetEl.hidden = !hasFilters
						history.replaceState(null, "", url)
					}).catch(handleError)
				}
				catch (ex) { handleError(ex) }

				function handleError(err) {
					if (console) console.error(err)
					formEl.submit()
				}
			})

			forEach(filtersEl.querySelectorAll("details"), function(el) {
				function handleClickOutside(ev) {
					if (ev.target.closest("details") == el) return
					el.open = false
				}

				el.addEventListener("toggle", function(ev) {
					if (ev.target.open) {
						document.addEventListener("mousedown", handleClickOutside)
					}
					else {
						document.removeEventListener("mousedown", handleClickOutside)
						return
					}
				})
			})

		`}</script>
	</div>
}

function SortButton(attrs, children) {
	var {name} = attrs
	var {sorted} = attrs
	var defaultDirection = attrs.direction || "asc"
	var direction = !sorted ? defaultDirection : sorted == "asc" ? "desc" : "asc"

	var {path} = attrs
	var {query} = attrs
	query = _.defaults({order: (direction == "asc" ? "" : "-") + name}, query)
	var url = path + Qs.stringify(query, {addQueryPrefix: true})

	var klass = ["column-name", "sort-button"]
	if (attrs.class) klass.push(attrs.class)
	if (sorted) klass.push(sorted)

	return <a href={url} class={klass.join(" ")}>{children}</a>
}

function serializeFiltersQuery(filters) {
	var query = {}

	if (filters.employeeCount)
		query["employee-count"] = filters.employeeCount.join("-")

	if (filters.businessModels)
		query["business-model"] = Array.from(filters.businessModels)

	if (filters.sustainabilityGoals)
		query.sdg = Array.from(filters.sustainabilityGoals)

	if (filters.sevMember) query["sev-member"] = "on"

	return query
}
