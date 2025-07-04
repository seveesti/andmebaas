/** @jsx Jsx */
var _ = require("root/lib/underscore")
var Jsx = require("j6pack")
var Fragment = Jsx.Fragment
var Page = require("../page")
var {Section} = Page
var {Form} = Page
var {FlashSection} = Page
var {FormButton} = Page
var {SdgImage} = Page
var {confirm} = require("root/lib/jsx")
var SUSTAINABILITY_GOALS = require("root/lib/sustainability_goals")
var {COUNTRIES} = require("root/lib/regions")
var {COUNTIES} = require("root/lib/regions")
var BUSINESS_MODELS = require("root/lib/business_models")
var LANGS = require("root/config").languages
var DEFAULT_LANG = LANGS[0]
var {ROOT_PATH} = Page

var OTHER_URLS_PLACEHOLDER = [
	"https://facebook.com/…",
	"https://instagram.com/…",
	"https://twitter.com/…",
	"https://linkedin.com/…"
].join("\n")

module.exports = function(attrs) {
	var {req} = attrs
	var {t} = req
	var {account} = req
	var org = attrs.organization
	var orgsPath = ROOT_PATH + req.baseUrl
	var orgPath = orgsPath + "/" + org.registry_code

	var pageTitle = attrs.new
		? t("organization_create_page.title", {name: org.name})
		: t("organization_update_page.title", {name: org.name})

	return <Page
		page={attrs.new ? "create-organization" : "update-organization"}
		class="update-organization-page"
		req={attrs.req}
		title={pageTitle}

		nav={[
			{name: t("admin_nav.organizations"), path: ROOT_PATH + "/enterprises"},
			{name: org.name, path: orgPath},
			{name: t("organization_page.admin_nav.update")}
		]}

		header={<Fragment>
			<h1 class="page-heading">{pageTitle}</h1>
		</Fragment>}
	>
		<FlashSection flash={req.flash} />

		<Form
			req={req}
			method={attrs.new ? "post" : "put"}
			action={attrs.new ? orgsPath : orgPath}
			enctype="multipart/form-data"
		>
			<header class="centered">
				<h1>
					<input
						name="name"
						value={org.name}
						required
						class="page-form-input"
						placeholder={t("organization_update_page.name_placeholder")}
					/>
				</h1>

				{org.official_name ? [
					<span class="official-name">{org.official_name}</span>,
					", "
				] : null}

				<input type="hidden" name="registry_code" value={org.registry_code} />
				<span class="registry-code">reg nr {org.registry_code}</span>
			</header>

			<Section>
				<ul>
					{LANGS.map((lang) => <li class="field-row">
						<label class="page-form-label">
							{t("organization_update_page.short_description")}
							{" "}
							({t("organization_update_page.in_" + lang)})
						</label>

						{lang != DEFAULT_LANG ? <p class="field-description">
							{t("organization_update_page.description_translation_empty")}
						</p> : null}

						<textarea
							name={`short_descriptions[${lang}]`}
							class="page-form-input"
						>
							{org.short_descriptions[lang]}
						</textarea>
					</li>)}

					{LANGS.map((lang) => <li class="field-row">
						<label class="page-form-label">
							{t("organization_update_page.long_description")}
							{" "}
							({t("organization_update_page.in_" + lang)})
						</label>

						{lang != DEFAULT_LANG ? <p class="field-description">
							{t("organization_update_page.description_translation_empty")}
						</p> : null}

						<textarea
							name={`long_descriptions[${lang}]`}
							class="page-form-input"
						>
							{org.long_descriptions[lang]}
						</textarea>
					</li>)}

					<li id="organization-logo-row" class="field-row">
						<label class="page-form-label">
							{t("organization_update_page.logo")}
						</label>

						<p class="field-description">
							{org.logo_type ? <img src={orgPath + "/logo"} /> : null}
							{t("organization_update_page.logo_formats")}
						</p>

						<input
							type="file"
							name="logo"
							accept="image/jpeg, image/png, image/gif, image/svg+xml"
						/>
					</li>

					<li class="field-row">
						<label class="page-form-label">
							{t("organization_update_page.url")}
						</label>

						<input
							name="url"
							type="url"
							value={org.url}
							class="page-form-input"
						/>
					</li>

					<li class="field-row">
						<label class="page-form-label">
							{t("organization_update_page.email")}
						</label>

						<input
							name="email"
							type="email"
							value={org.email}
							class="page-form-input"
						/>
					</li>

					<li id="other-urls-row" class="field-row">
						<label class="page-form-label">
							{t("organization_update_page.social_media")}
						</label>

						<textarea
							name="other_urls"
							placeholder={OTHER_URLS_PLACEHOLDER}
							class="page-form-input"
						>{org.other_urls.join("\n")}</textarea>
					</li>

					<li class="field-row">
						<label class="page-form-label">
							{t("organization_update_page.business_model")}
						</label>

						<ul>{_.map(BUSINESS_MODELS, (name, id) => <li>
							<label class="sev-checkbox">
								<input
									type="checkbox"
									name="business_models[]"
									value={id}
									checked={org.business_models.has(id)}
								/>
								{name}
							</label>
						</li>)}</ul>
					</li>

					<li id="regions" class="field-row">
						<label class="page-form-label">
							{t("organization_update_page.region")}
						</label>

						<input type="hidden" name="regions[]" value="off" />

						<h3>Riigid</h3>

						{_.intersperse(COUNTRIES.map(function(region) {
							return <label class="sev-checkbox">
								<input
									type="checkbox"
									name="regions[]"
									value={region}
									checked={org.regions.has(region)}
								/>
									{t("organization_page.regions." + region)}
							</label>
						}), <br />)}

						<h3>{t("organization_update_page.regions.estonian_counties")}</h3>

						<ul>{_.map(COUNTIES, (name, id) => <li>
							<label class="sev-checkbox">
								<input
									type="checkbox"
									name="regions[]"
									value={id}
									checked={org.regions.has(id)}
								/>
								{name}maa
							</label>
						</li>)}</ul>
					</li>

					<li id="sustainability-goals" class="field-row">
						<label class="page-form-label">
							{t("organization_update_page.sdgs")}
						</label>

						<p class="field-description">
							{Jsx.html(t("organization_update_page.sdgs_description"))}
						</p>

						{SUSTAINABILITY_GOALS.map((id) => <Fragment>
							<label class="sev-checkbox">
								<SdgImage t={t} goal={id} />

								<input
									type="checkbox"
									name="sustainability_goals[]"
									value={id}
									checked={org.sustainability_goals.has(id)}
								/>

								{/^\d+$/.test(id) ? <strong>
									{t("organization_update_page.sdg_goal")} {id}:
								</strong> : null}

								{" "}
								{t(`sdg.${id}.title`)}
							</label>

							<br />
						</Fragment>)}
					</li>

					{account && account.administrative ? <li class="field-row">
						<label class="page-form-label">
							{t("organization_update_page.sev_membership")}
						</label>

						<label class="sev-checkbox">
							<input type="hidden" name="sev_member" value="off" />

							<input
								type="checkbox"
								name="sev_member"
								checked={org.sev_member}
							/>

							{t("organization_update_page.sev_member")}
						</label>
					</li> : null}

					{account && account.administrative ? <li class="field-row">
						<label class="page-form-label">
							{t("organization_update_page.access")}
						</label>

						<label class="sev-checkbox">
							<input type="hidden" name="published" value="off" />

							<input
								type="checkbox"
								name="published"
								checked={org.published_at != null}
							/>

							{t("organization_update_page.public")}
						</label>
					</li> : null}
				</ul>
			</Section>

			{org.taxes.length > 0 ? <Section>
				<h2 class="page-section-heading">
					{t("organization_update_page.taxes")}
				</h2>

				<table id="taxes-table" class="page-table">
					<thead class="page-table-header">
						<tr>
							<th class="year-column">
								{t("organization_page.financials.year")}
							</th>

							<th class="quarter-column">
								{t("organization_page.financials.quarter")}
							</th>

							<th>{t("organization_page.financials.revenue")}</th>
							<th>{t("organization_page.financials.taxes")}</th>
							<th>{t("organization_page.financials.employee_count")}</th>
							<th>{t("organization_page.financials.employment_taxes")}</th>
						</tr>
					</thead>

					<tbody>{org.taxes.map(function(period) {
						var periodName = _.formatYearQuarter(period.year, period.quarter)

						return <tr>
							<th class="year-column">{period.year}</th>
							<th class="quarter-column">{period.quarter}</th>

							<td>
								<input
									type="number"
									name={`taxes[${periodName}][revenue]`}
									class="page-form-input"
									step="0.01"
									value={period.revenue}
									required
								/>

								{period.revenue != period.original_revenue ?
									renderOriginal(period.original_revenue)
								: null}
							</td>

							<td>
								<input
									type="number"
									name={`taxes[${period.year}Q${period.quarter}][taxes]`}
									class="page-form-input"
									min="0"
									step="0.01"
									value={period.taxes}
									required
								/>

								{period.taxes != period.original_taxes ?
									renderOriginal(period.original_taxes)
								: null}
							</td>

							<td>
								<input
									type="number"
									name={`taxes[${period.year}Q${period.quarter}][employee_count]`}
									class="page-form-input"
									min="0"
									step="1"
									value={period.employee_count}
									required
								/>

								{period.employee_count != period.original_employee_count ?
									renderOriginal(period.original_employee_count)
								: null}
							</td>

							<td>
								<input
									type="number"
									name={`taxes[${period.year}Q${period.quarter}][employment_taxes]`}
									class="page-form-input"
									step="0.01"
									min="0"
									value={period.employment_taxes}
									required
								/>

								{period.employment_taxes != period.original_employment_taxes ?
									renderOriginal(period.original_employment_taxes)
								: null}
							</td>
						</tr>
					})}</tbody>
				</table>
			</Section> : null}

			<Section id="submit-section">
				<button type="submit" class="blue-button">{attrs.new
					? t("organization_create_page.create")
					: t("organization_update_page.update")
				}</button>
			</Section>
		</Form>

		{account && account.administrative && !attrs.new ? <Section
			id="delete-section"
		>
			<span>{t("organization_update_page.delete?")}</span>

			<FormButton
				req={req}
				action={orgPath}
				class="red-button"
				name="_method"
				value="delete"
				onclick={confirm(t("organization_update_page.delete_confirmation"))}
				>{t("organization_update_page.delete")}
			</FormButton>
		</Section> : null}
	</Page>
}

function renderOriginal(value) {
	return <p class="original">Algselt: <output>{value}</output></p>
}
