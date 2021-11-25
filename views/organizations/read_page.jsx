/** @jsx Jsx */
var _ = require("root/lib/underscore")
var Url = require("url")
var Jsx = require("j6pack")
var Page = require("../page")
var {Fragment} = Jsx
var {Section} = Page
var {Centered} = Page
var {UntrustedLink} = Page
var {MoneyElement} = Page
var {FormButton} = Page
var {Flash} = Page
var {isAdminOrMember} = require("root/controllers/organizations_controller")
var BUSINESS_MODELS = require("root/lib/business_models")
var EMTAK = require("root/lib/emtak")
var REGIONS = require("root/lib/regions")
var COUNTIES = require("root/lib/estonian_counties")
var SUSTAINABILITY_GOALS = require("root/lib/sustainability_goals")

module.exports = function(attrs) {
	var {req} = attrs
	var {account} = req
	var {members} = req
	var {updates} = attrs
	var org = attrs.organization
	var orgPath = "/organizations/" + org.registry_code

	return <Page
		page="organization"
		class="organization-page"
		title={org.name}
		req={req}

		nav={account && [
			{name: "Organisatsioonid", path: "/organizations"},

			{
				name: org.name,

				pages: [
					isAdminOrMember(members, account) && {
						name: "Muuda",
						path: orgPath + "/edit"
					},

					account.administrative && {
						name: "Liikmed",
						path: orgPath + "/members"
					}
				].filter(Boolean)
			},
		]}

		header={<Fragment>
			<h1 class="page-heading">{org.name}</h1>
		</Fragment>}
	>
		{org.published_at == null ? <div id="publish-bar">
			<Centered>
				<FormButton
					req={req}
					formClass="publishing-form"
					action={orgPath}
					class="blue-button"
					name="published"
					value="true"
				>Avalikusta</FormButton>

				Organisatsioon on peidetud ja ei ole nähtav külastajatele.
			</Centered>
		</div> : null}

		{!_.isEmpty(req.flash()) ? <Section>
			<Flash flash={req.flash} />
		</Section> : null}

		<header class="centered">
			{org.logo_type ? <img id="logo" src={orgPath + "/logo"} /> : null}

			{org.official_name ? [
				<span class="official-name">{org.official_name}</span>,
				", "
			] : null}

			<span class="registry-code">reg nr {org.registry_code}</span>

			{org.short_description ? <p id="short-description">
				{org.short_description}
			</p> : null}

			{(
				org.url ||
				org.email ||
				org.other_urls.length > 0
			) ? <ul id="links">
				{org.url ? <li>
					<SocialLink href={org.url} type="web" />
				</li> : null}

				{org.email ? <li>
					<SocialLink href={org.email} type="email" />
				</li> : null}

				{org.other_urls.map((url) => <li>
					<SocialLink href={url} type="social" />
				</li>)}
			</ul> : null}
		</header>

		<Section id="details">
			<ul id="general">
				{org.founded_on ? <li class="fact">
					<h2>Asutamise aasta</h2>
					<p>{org.founded_on.getFullYear()}</p>
				</li> : null}

				{org.regions.size > 0 ? <li class="fact">
					<h2>Regioon</h2>

					<ul>{Array.from(org.regions, function(id) {
						if (id in COUNTIES && org.regions.has("estonia")) return null
						return <li>{REGIONS[id]}</li>
					})}</ul>
				</li> : null}

				{org.business_models.size > 0 ? <li class="fact">
					<h2>Ärimudel</h2>

					<ul>{Array.from(org.business_models, (id) => <li>
						{" "}<abbr title={BUSINESS_MODELS[id]}>{id.toUpperCase()}</abbr>
					</li>)}</ul>
				</li> : null}

				{org.emtak ? <li class="fact">
					<h2>Sektor</h2>
					<p>{EMTAK[org.emtak]}</p>
				</li> : null}
			</ul>

			{org.sustainability_goals.size > 0 ? <div id="sustainability-goals">
				<h2>Säästva arengu eesmärgid</h2>

				<ol>
					{Array.from(org.sustainability_goals, function(id) {
						var goal = SUSTAINABILITY_GOALS[id]

						return <li>
							<img
								src={"/assets/sdg-" + id + ".svg"}
								alt={SUSTAINABILITY_GOALS[id].name}
								title={SUSTAINABILITY_GOALS[id].title}
							/>

							{/^\d+$/.test(id) ? <h3>Eesmärk {id}</h3> : null}
							<p>{goal.title}</p>
						</li>
					})}
				</ol>
			</div> : null}
		</Section>

		{org.long_description ? <Section id="long-description">
			<h2>Kirjeldus</h2>
			<p>{org.long_description}</p>
		</Section> : null}

		{org.board_members.length > 0 ? <Section id="board-members">
			<h2>Juhatuse liikmed</h2>
			<ul>{org.board_members.map((name) => <li>{name}</li>)}</ul>
		</Section> : null}

		{org.taxes.length > 0 ? <Section id="taxes">
			<h2>Finantsinfo</h2>

			<table id="taxes-table" class="page-table">
				<thead class="page-table-header">
					<tr>
						<th>Aasta</th>
						<th>Kvartal</th>
						<th>Käive</th>
						<th>Töötajate arv</th>
						<th>Riiklikud maksud</th>
						<th>Tööjõumaksud</th>
					</tr>
				</thead>

				<tbody>{org.taxes.map(function(taxes) {
					return <tr>
						<th scope="row">{taxes.year}</th>
						<th scope="row">{taxes.quarter}</th>

						<td>
							<MoneyElement amount={taxes.revenue} currency="EUR" />
						</td>

						<td>{taxes.employee_count}</td>

						<td>
							<MoneyElement amount={taxes.taxes} currency="EUR" />
						</td>

						<td>
							<MoneyElement amount={taxes.employment_taxes} currency="EUR" />
						</td>
					</tr>
				})}</tbody>
			</table>
		</Section> : null}

		{account && isAdminOrMember(members, account) && updates.length > 0 ?
			<Section id="updates">
			<h2>Muudatused</h2>

			<table class="page-table">
				<thead class="page-table-header">
					<tr>
						<th>Kellaaeg</th>
						<th>Muutja</th>
					</tr>
				</thead>

				<tbody>{updates.map(function(update) {
					return <tr>
						<th scope="row">{_.formatDateTime("ee", update.at)}</th>
						<th scope="row">{account.name || account.email}</th>
					</tr>
				})}</tbody>
			</table>
		</Section> : null}
	</Page>
}

function SocialLink(attrs) {
	var {href} = attrs
	var {type} = attrs

	switch (type) {
		case "web": return <UntrustedLink href={href} class="web-button">
			{href.replace(/^https?:\/\//, "")}
		</UntrustedLink>

		case "email": return <UntrustedLink
			href={"mailto:" + href}
			class="email-button"
		>
			{href}
		</UntrustedLink>

		case "social":
			var site = categorizeSocialUrl(href) || "web"

			return <UntrustedLink href={href} class={site + "-button"}>
				{href.replace(/^https?:\/\//, "")}
			</UntrustedLink>

		default: throw new TypeError("Unknown link type: " + type)
	}
}

var SITE_BY_HOST = {
	"facebook.com": "facebook",
	"fb.com": "facebook",
	"twitter.com": "twitter",
	"linkedin.com": "linkedin",
	"instagram.com": "instagram"
}

function categorizeSocialUrl(url) {
	var host
	try { host = Url.parse(url).hostname } catch (_err) {}
	return host && SITE_BY_HOST[host.replace(/^www\./, "")] || null
}
