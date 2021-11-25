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
	var {quarters} = attrs
	var path = req.baseUrl

	var now = new Date
	var currentYear = now.getFullYear()
	var currentQuarter = Math.floor(now.getMonth() / 3) + 1

	return <Page
		page="taxes"
		req={attrs.req}

		nav={[
			{name: "Andmebaas", path: "/"},
			{name: "Maksuandmed"}
		]}

		header={<Fragment>
			<h1 class="page-heading">Maksuandmed</h1>
		</Fragment>}
	>
		<FlashSection flash={req.flash} />

		<Section>
			<p class="page-paragraph">
				Maksuinfo CSV failid leiad
				{" "}
				<a href="https://www.emta.ee/ariklient/amet-uudised-ja-kontakt/uudised-pressiinfo-statistika/statistika-ja-avaandmed" class="link-button">Maksuameti statistika ja avaandmete lehelt</a>
			</p>

			{quarters.length > 0 ? <table class="page-table">
				<thead class="page-table-header">
					<tr>
						<th>Aasta</th>
						<th>Kvartal</th>
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
								onclick={confirm(`Kindel, et soovid ${year} ${quarter}. kvartali maksuandmed eemaldada?`)}
							>Eemalda</FormButton>
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
					<label class="page-form-label">Aasta ja kvartal</label>

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
					<label class="page-form-label">CSV fail maksuandmetega</label>
					<input type="file" name="csv" required />
				</fieldset>

				<fieldset>
					<button type="submit" class="blue-button page-form-submit">
						Lisa maksuandmed
					</button>
				</fieldset>
			</Form>
		</Section>
	</Page>
}
