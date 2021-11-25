/** @jsx Jsx */
var _ = require("root/lib/underscore")
var Jsx = require("j6pack")
var Fragment = Jsx.Fragment
var Page = require("../page")
var {Section} = Page
var {Form} = Page
var {FlashSection} = Page
var {FormButton} = Page
var {confirm} = require("root/lib/jsx")
var SUSTAINABILITY_GOALS = require("root/lib/sustainability_goals")
var COUNTIES = require("root/lib/estonian_counties")
var BUSINESS_MODELS = require("root/lib/business_models")

var OTHER_URLS_PLACEHOLDER = [
	"https://facebook.com/…",
	"https://instagram.com/…",
	"https://twitter.com/…",
	"https://linkedin.com/…"
].join("\n")

module.exports = function(attrs) {
	var {req} = attrs
	var {account} = req
	var org = attrs.organization
	var orgPath = "/organizations/" + org.registry_code

	return <Page
		page="update-organization"
		req={attrs.req}

		nav={[
			{name: "Organisatsioonid", path: "/organizations"},
			{name: org.name, path: orgPath},
			{name: "Muuda"}
		]}

		header={<Fragment>
			<h1 class="page-heading">{org.name}</h1>
		</Fragment>}
	>
		<FlashSection flash={req.flash} />

		<Form
			req={req}
			method="put"
			action={req.baseUrl + "/" + org.registry_code}
			enctype="multipart/form-data"
		>
			<header class="centered">
				<h1>
					<input
						name="name"
						value={org.name}
						required
						placeholder="Organisatsiooni nimi"
					/>
				</h1>

				<span class="official-name">{org.official_name}</span>
				{", "}
				<span class="registry-code">reg nr {org.registry_code}</span>
			</header>

			<Section>
				<ul>
					<li class="field-row">
						<label class="field-name">Lühikirjeldus</label>

						<textarea name="short_description">
							{org.short_description}
						</textarea>
					</li>

					<li class="field-row">
						<label class="field-name">Kirjeldus</label>

						<textarea name="long_description">
							{org.long_description}
						</textarea>
					</li>

					<li id="organization-logo-row" class="field-row">
						<label class="field-name">Logo</label>

						<p>
							{org.logo_type ? <img src={orgPath + "/logo"} /> : null}

							JPEG, PNG või GIF formaadis pilt.
						</p>

						<input
							type="file"
							name="logo"
						accept="image/jpeg, image/png, image/gif, image/svg+xml"
						/>
					</li>

					<li class="field-row">
						<label class="field-name">Veebileht</label>
						<input name="url" type="url" value={org.url} />
					</li>

					<li class="field-row">
						<label class="field-name">Meiliaadress</label>
						<input name="email" type="email" value={org.email} />
					</li>

					<li class="field-row">
						<label class="field-name">Sotsiaalmeedia aadressid</label>
						<textarea
							name="other_urls"
							placeholder={OTHER_URLS_PLACEHOLDER}
						>{org.other_urls.join("\n")}</textarea>
					</li>

					<li class="field-row">
						<label class="field-name">Ärimudel</label>
						<input type="hidden" name="business_models[none]" value="off" />

						<ul>{_.map(BUSINESS_MODELS, (name, id) => <li>
							<label class="sev-checkbox">
								<input
									type="checkbox"
									name={`business_models[${id}]`}
									checked={org.business_models.has(id)}
								/>
								{name}
							</label>
						</li>)}</ul>
					</li>

					<li id="regions" class="field-row">
						<label class="field-name">
							Tegutsemisala
						</label>

						<input type="hidden" name="regions[none]" value="off" />

						<h3>Riigid</h3>
						<label class="sev-checkbox">
							<input
								type="checkbox"
								name="regions[global]"
								checked={org.regions.has("global")}
							/>
								Globaalne
							</label>
						<br />

						<label class="sev-checkbox">
							<input
								type="checkbox"
								name="regions[estonia]"
								checked={org.regions.has("estonia")}
							/>
								Kogu Eesti
						</label>
						<br />

						<h3>Eesti maakonnad</h3>

						<ul>{_.map(COUNTIES, (name, id) => <li>
							<label class="sev-checkbox">
								<input
									type="checkbox"
									name={`regions[${id}]`}
									checked={org.regions.has(id)}
								/>
								{name}maa
							</label>
						</li>)}</ul>
					</li>

					<li id="sustainability-goals" class="field-row">
						<label class="field-name">
							Ülemaailmsed säästva arengu eesmärgid
						</label>

						<p class="field-description">
							<a href="https://www.riigikantselei.ee/valitsuse-too-planeerimine-ja-korraldamine/valitsuse-too-toetamine/saastev-areng#item-3" class="link-button">Loe säästva arengu kohta lähemalt</a> Riigikantselei lehelt.
						</p>

						<input
							type="hidden"
							name="sustainability_goals[none]"
							value="off"
						/>

						{_.map(SUSTAINABILITY_GOALS, function(goal, id) {
							return <Fragment>
								<label class="sev-checkbox">
									<input
										type="checkbox"
										name={`sustainability_goals[${id}]`}
										checked={org.sustainability_goals.has(id)}
									/>
									{/^\d+$/.test(id) ? <strong>Eesmärk {id}:</strong> : null}
									{" "}
									{goal.title}
								</label>
								<br />
							</Fragment>
						})}
					</li>

					<li class="field-row">
						<label class="field-name">Ligipääs</label>

						<label id="publish-checkbox" class="sev-checkbox">
							<input type="hidden" name="published" value="off" />

							<input
								type="checkbox"
								name="published"
								checked={org.published_at != null}
							/>

							Organisatsioon on avalik ja nähtav kõigile külastajatele.
						</label>
					</li>
				</ul>
			</Section>

			{org.taxes.length > 0 ? <Section>
				<h2 class="page-section-heading">Maksuandmed</h2>

				<table id="taxes-table" class="page-table">
					<thead class="page-table-header">
						<tr>
							<th class="year-column">Aasta</th>
							<th class="quarter-column">Kvartal</th>
							<th>Käive</th>
							<th>Riiklikud maksud</th>
							<th>Töötajate arv</th>
							<th>Tööjõumaksud</th>
						</tr>
					</thead>

					<tbody>{org.taxes.map(function(period) {
						return <tr>
							<th class="year-column">{period.year}</th>
							<th class="quarter-column">{period.quarter}</th>

							<td>
								<input
									type="number"
									name={`taxes[${period.year}Q${period.quarter}][revenue]`}
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
				<button type="submit" class="blue-button">
					Salvesta organisatsioon
				</button>
			</Section>
		</Form>

		{account.administrative ? <Section id="delete-section">
			<span>Soovid organisatsioni hoopis kustutada?</span>

			<FormButton
				req={req}
				action={orgPath}
				class="red-button"
				name="_method"
				value="delete"
				onclick={confirm(`Kindel, et soovid organisatsiooni kustutada?`)}
			>Kustuta organisatsioon</FormButton>
		</Section> : null}
	</Page>
}

function renderOriginal(value) {
	return <p class="original">Algselt: <output>{value}</output></p>
}
