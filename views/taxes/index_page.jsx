/** @jsx Jsx */
var _ = require("root/lib/underscore")
var Jsx = require("j6pack")
var {Fragment} = Jsx
var Page = require("../page")
var {Section} = Page
var {confirm} = require("root/lib/jsx")
var {Form} = Page
var {FormButton} = Page
var {FlashSection} = Page

module.exports = function(attrs) {
	var {req} = attrs
	var {t} = req
	var {quarters} = attrs
	var path = req.baseUrl

	var now = new Date
	var currentYear = now.getFullYear()
	var currentQuarter = Math.floor(now.getMonth() / 3) + 1

	return <Page
		page="taxes"
		req={attrs.req}
		title={t("taxes_page.title")}

		nav={[
			{name: t("admin_nav.organizations"), path: "/organizations"},
			{name: t("admin_nav.taxes")}
		]}

		header={<Fragment>
			<h1 class="page-heading">{t("taxes_page.title")}</h1>
		</Fragment>}
	>
		<FlashSection flash={req.flash} />

		<Section>
			<p class="page-paragraph">
				{Jsx.html(t("taxes_page.description"))}
			</p>

			{quarters.length > 0 ? <table class="page-table">
				<thead class="page-table-header">
					<tr>
						<th>{t("taxes_page.year_column")}</th>
						<th>{t("taxes_page.quarter_column")}</th>
						<th />
					</tr>
				</thead>

				<tbody>{quarters.map(function({year, quarter}) {
					var quarterPath = path + "/" + year + "Q" + quarter

					return <tr>
						<td>{year}</td>
						<td>{quarter}</td>

						<td>
							<FormButton
								req={req}
								action={quarterPath}
								class="link-button"
								name="_method"
								value="delete"

								onclick={
									confirm(t("taxes_page.delete_confirmation", {
										year,
										quarter
									}))
								}
							>{t("taxes_page.delete")}
							</FormButton>
						</td>
					</tr>
				})}</tbody>
			</table> : null}

			<Form
				req={req}
				id="upload-form"
				class="page-form page-post-table-form"
				action={path}
				method="post"
				enctype="multipart/form-data"
			>
				<fieldset>
					<label class="page-form-label">
						{t("taxes_page.form.year_and_quarter")}
					</label>

					<select name="year" required>{_.times(20).map(function(i) {
						var year = currentYear - 10 + i

						return <option value={year} selected={year == currentYear}>
							{year}
						</option>
					})}</select>

					<select name="quarter" required>{_.times(4).map(function(i) {
						var quarter = i + 1
						return <option
							value={quarter}
							selected={quarter == currentQuarter}
						>{quarter}</option>
					})}</select>
				</fieldset>

				<fieldset>
					<label class="page-form-label">
						{t("taxes_page.form.csv_file")}
					</label>

					<input type="file" name="csv" required />
				</fieldset>

				<fieldset>
					<button type="submit" class="blue-button page-form-submit">
						{t("taxes_page.form.create")}
					</button>
				</fieldset>
			</Form>
		</Section>
	</Page>
}
