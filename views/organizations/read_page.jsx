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
var {SdgImage} = Page
var {isAdminOrMember} = require("root/controllers/organizations_controller")
var BUSINESS_MODELS = require("root/lib/business_models")
var EMTAK = require("root/lib/emtak")
var REGIONS = require("root/lib/regions")
var COUNTIES = require("root/lib/estonian_counties")

module.exports = function(attrs) {
	var {req} = attrs
	var {t} = req
	var {account} = req
	var {members} = req
	var {updates} = attrs
	var org = attrs.organization
	var orgPath = "/enterprises/" + org.registry_code

	return <Page
		page="organization"
		class="organization-page"
		title={org.name}
		req={req}

		nav={account && [
			{name: t("admin_nav.organizations"), path: "/enterprises"},

			{
				name: org.name,

				pages: [
					isAdminOrMember(members, account) && {
						name: t("organization_page.admin_nav.update"),
						path: orgPath + "/edit"
					},

					account.administrative && {
						name: t("organization_page.admin_nav.members"),
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
				>{t("organization_page.publish")}</FormButton>

				{t("organization_page.unpublished")}
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
					<h2>{t("organization_page.founded_on")}</h2>
					<p>{org.founded_on.getFullYear()}</p>
				</li> : null}

				{org.regions.size > 0 ? <li class="fact">
					<h2>{t("organization_page.region")}</h2>

					<ul>{Array.from(org.regions, function(id) {
						if (id in COUNTIES && org.regions.has("estonia")) return null
						return <li>{REGIONS[id]}</li>
					})}</ul>
				</li> : null}

				{org.business_models.size > 0 ? <li class="fact">
					<h2>{t("organization_page.business_model")}</h2>

					<ul>{Array.from(org.business_models, (id) => <li>
						{" "}<abbr title={BUSINESS_MODELS[id]}>{id.toUpperCase()}</abbr>
					</li>)}</ul>
				</li> : null}

				{org.emtak ? <li class="fact">
					<h2>{t("organization_page.sector")}</h2>
					<p>{EMTAK[org.emtak]}</p>
				</li> : null}
			</ul>
		</Section>

		{org.sustainability_goals.size > 0 ? <Section id="sustainability-goals">
			<h2>{t("organization_page.goals")}</h2>

			<ol>
				{Array.from(org.sustainability_goals, function(id) {
					return <li>
						<SdgImage t={t} goal={id} />

						<h3>
							{/^\d+$/.test(id) ? [<strong>{id}.</strong>, " "] : null}
							{t(`sdg.${id}.title`)}
						</h3>

						<p>{t(`sdg.${id}.description`)}</p>
					</li>
				})}
			</ol>
		</Section> : null}

		{org.long_description ? <Section id="long-description">
			<h2>{t("organization_page.long_description")}</h2>
			<p>{org.long_description}</p>
		</Section> : null}

		{org.board_members.length > 0 ? <Section id="board-members">
			<h2>{t("organization_page.board_members")}</h2>
			<ul>{org.board_members.map((name) => <li>{name}</li>)}</ul>
		</Section> : null}

		{org.taxes.length > 0 ? <Section id="taxes">
			<h2>{t("organization_page.financials")}</h2>

			<table id="taxes-table" class="page-table">
				<thead class="page-table-header">
					<tr>
						<th>{t("organization_page.financials.year")}</th>
						<th>{t("organization_page.financials.quarter")}</th>
						<th>{t("organization_page.financials.revenue")}</th>
						<th>{t("organization_page.financials.employee_count")}</th>
						<th>{t("organization_page.financials.taxes")}</th>
						<th>{t("organization_page.financials.employment_taxes")}</th>
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
			<h2>{t("organization_page.updates.title")}</h2>

			<table class="page-table">
				<thead class="page-table-header">
					<tr>
						<th>{t("organization_page.updates.time")}</th>
						<th>{t("organization_page.updates.updater")}</th>
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
