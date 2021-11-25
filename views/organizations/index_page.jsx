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
var {javascript} = require("root/lib/jsx")
var SUSTAINABILITY_GOALS = require("root/lib/sustainability_goals")
var BUSINESS_MODELS = require("root/lib/business_models")

module.exports = function(attrs) {
	var {req} = attrs
	var {account} = req
	var {filters} = attrs
	var {organizations} = attrs
	var {taxQuarter} = attrs
	var [orderName, orderDirection] = attrs.order || ["name", "asc"]
	var path = req.baseUrl

	return <Page
		page="organizations"
		title="Andmebaas"
		req={attrs.req}

		nav={account && [{pages: [
			{name: "Organisatsioonid", path: "/organizations"},
			account.administrative && {name: "Kontod", path: "/accounts"},
			account.administrative && {name: "Maksuandmed", path: "/taxes"}
		].filter(Boolean)}]}

		header={<Fragment>
			<h1 class="page-heading">Andmebaas</h1>

			<p class="page-paragraph">Sotsiaalse ettevõtte lühidefinitsioon: ühiskondliku eesmärgiga organisatsioon, mis kasutab oma sihi saavutamiseks ettevõtlust. Ühiskondliku eesmärgi olemasolu tähendab, et see on püsivalt fikseeritud organisatsiooni põhikirjas. Ettevõte tegutseb majandusüksusena ehk pakub kaupu või teenuseid tasu eest püsiva tegevusena.</p>
		</Fragment>}
	>
		<FlashSection flash={req.flash} />

		<Section>
			<Filters path={path} filters={filters} />

			<table
				id="organizations-table"
				class={
					"page-table" + (account && account.administrative ? " has-form" : "")
				}
			>
				<caption><div>
					<span class="count">
						{organizations.length == 1
							? "1 sotsiaalne ettevõte"
							: organizations.length + " sotsiaalset ettevõtet"
						}.
						{" "}

						{account && account.administrative ?
							<a class="link-button" href="#new-organization-form">
								Lisa uus
							</a>
						: null}
					</span>

					{" "}

					{taxQuarter ? <span class="taxes-description">
						Finantsandmed {taxQuarter.year} {taxQuarter.quarter}. kvartalist.
					</span> : null}
				</div></caption>

				<thead class="page-table-header">
					<tr>
						<th class="name-column">
							<SortButton
								path={path}
								query={{}}
								name="name"
								sorted={orderName == "name" ? orderDirection : null}
							>
								Ettevõte
							</SortButton>
						</th>

						<th>
							Eesmärgid
						</th>

						<th class="revenue-column">
							<SortButton
								path={path}
								query={{}}
								name="revenue"
								sorted={orderName == "revenue" ? orderDirection : null}
								direction="desc"
							>
								Käive
							</SortButton>
						</th>

						<th class="employee-count-column">
							<SortButton
								path={path}
								query={{}}
								name="employee-count"
								sorted={orderName == "employee-count" ? orderDirection : null}
								direction="desc"
							>
								Töötajaid
							</SortButton>
						</th>

						<th class="business-models-column">
							Ärimudel
						</th>
					</tr>
				</thead>

				<tbody>{organizations.map(function(org) {
					var orgPath = "/organizations/" + org.registry_code
					var taxes = org.taxes[0]

					var klass = ["organization"]
					if (!org.published_at) klass.push("unpublished")

					return <Fragment>
						<tr class={klass.join(" ")}>
							<td class="name-column">
								<a href={orgPath}>{org.name}</a>

								{org.published_at ? "" : <span
									class="unpublished-icon"
									title="Avalikustamata"
								> 🕵</span>}
							</td>

							<td class="goals">
								<ul>{Array.from(org.sustainability_goals, (id) => <li>
									<img
										src={"/assets/sdg-" + id + ".svg"}
										alt={SUSTAINABILITY_GOALS[id].name}
										title={SUSTAINABILITY_GOALS[id].title}
									/>
								</li>)}</ul>
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
				})}</tbody>

				<tfoot class="page-table-footer">
					<tr>
						<td colspan="5">
							Lae organisatsioonide avaandmed
							{" "}
							<a href={path + ".csv"} class="link-button">CSV</a>
							{" "}
							formaadis.
						</td>
					</tr>
				</tfoot>
			</table>

			{account && account.administrative ? <Form
				id="new-organization-form"
				class="page-form page-post-table-form"
				req={req}
				method="post"
				action={req.baseUrl}
			>
				<fieldset>
					<label class="page-form-label">Nimi</label>
					<input
						name="name"
						required
						placeholder="Organisatsiooni nimi"
					/>
				</fieldset>

				<fieldset>
					<label class="page-form-label">Registrikood</label>
					<input
						name="registry_code"
						required
						placeholder="Registrikood"
					/>
				</fieldset>

				<button type="submit" class="blue-button">
					Lisa uus organisatsioon
				</button>
			</Form> : null}
		</Section>
	</Page>
}

function Filters(attrs) {
	var {path} = attrs
	var {filters} = attrs

	var employeeCount = filters.employeeCount && filters.employeeCount.join("-")
	var {businessModels} = filters
	var {sustainabilityGoals} = filters

	return <div id="filters">
		<h2>Filtreeri organisatsioone</h2>

		<form
			id="filters-form"
			method="get"
			action={path}
		>
			<details class="filter">
				<summary>Töötajate arv</summary>

				<div class="dropdown">
					<ol>
						<li>
							<label class="sev-radiobox">
								<input
									type="radio"
									name="employee-count"
									value=""
									checked={employeeCount == null}
								/> Kõik
							</label>
						</li>

						<li>
							<label class="sev-radiobox">
								<input
									type="radio"
									name="employee-count"
									value="0-10"
									checked={employeeCount == "0-10"}
								/> 0–9
							</label>
						</li>

						<li>
							<label class="sev-radiobox">
								<input
									type="radio"
									name="employee-count"
									value="10-50"
									checked={employeeCount == "10-50"}
								/> 10–49
							</label>
						</li>

						<li>
							<label class="sev-radiobox">
								<input
									type="radio"
									name="employee-count"
									value="50-250"
									checked={employeeCount == "50-250"}
								/> 50–249
							</label>
						</li>

						<li>
							<label class="sev-radiobox">
								<input
									type="radio"
									name="employee-count"
									value="250-"
									checked={employeeCount == "250-"}
								/> 250–
							</label>
						</li>
					</ol>

				</div>
			</details>

			<details class="filter">
				<summary>Ärimudel</summary>

				<div class="dropdown">
					<ul>{_.map(BUSINESS_MODELS, (name, id) => <li>
						<label class="sev-checkbox">
							<input
								type="checkbox"
								name={`business-models[${id}]`}
								checked={businessModels && businessModels.has(id)}
							/>
							{name}
						</label>
					</li>)}</ul>
				</div>
			</details>

			<details class="filter" id="sustainability-goals-filter">
				<summary>Eesmärgid</summary>

				<div class="dropdown">
					<input type="hidden" name="sdg[_]" value="off" />

					<ol>{_.map(SUSTAINABILITY_GOALS, function(goal, id) {
						return <li>
							<label class="sev-checkbox">
								<img
									src={"/assets/sdg-" + id + ".svg"}
									alt={SUSTAINABILITY_GOALS[id].name}
									title={SUSTAINABILITY_GOALS[id].title}
								/>

								<input
									type="checkbox"
									name={`sdg[${id}]`}

									checked={
										sustainabilityGoals && sustainabilityGoals.has(id)
									}
								/>

								{/^\d+$/.test(id) ? [<strong>{id}.</strong>, " "] : null}
								{goal.name}
							</label>
						</li>
					})}</ol>
				</div>
			</details>

			<noscript>
				<button class="submit-button blue-button">Filtreeri</button>
			</noscript>

			{_.any(filters) ? <Fragment>
				<a href={path} class="reset-button link-button">
					või eemalda filtrid
				</a>.
			</Fragment> : null}
		</form>

		{_.any(filters) ? <div class="current">
			<h3>Filter hetkel:</h3>

			<ul>
				{employeeCount ? <li>{employeeCount} töötajat</li> : null}

				{businessModels ? Array.from(businessModels).map((id) => <li>
					{id.toUpperCase()}
				</li>) : null}

				{sustainabilityGoals ? Array.from(sustainabilityGoals).map((id) => <li>
					<img
						src={"/assets/sdg-" + id + ".svg"}
						alt={SUSTAINABILITY_GOALS[id].name}
						title={SUSTAINABILITY_GOALS[id].title}
					/>

					{/^\d+$/.test(id) ? [<strong>{id}.</strong>, " "] : null}
					{SUSTAINABILITY_GOALS[id].name}
				</li>) : null}
			</ul>
		</div> : null}

		<script>{javascript`
			var filtersEl = document.getElementById("filters")
			var form = document.getElementById("filters-form")
			var forEach = Function.call.bind(Array.prototype.forEach)

			form.addEventListener("change", function(ev) {
				this.submit()
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
	query = _.assign({}, query, {order: (direction == "asc" ? "" : "-") + name})
	var url = path + "?" + Qs.stringify(query)

	return <a href={url} class={"column-name sort-button " + (sorted || "")}>
		{children}
	</a>
}
