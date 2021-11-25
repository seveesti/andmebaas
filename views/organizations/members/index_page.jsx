/** @jsx Jsx */
var _ = require("root/lib/underscore")
var Jsx = require("j6pack")
var {Fragment} = Jsx
var Page = require("../../page")
var {Section} = Page
var {Form} = Page
var {FormButton} = Page
var {FlashSection} = Page
var {confirm} = require("root/lib/jsx")

module.exports = function(attrs) {
	var {req} = attrs
	var org = attrs.organization
	var {members} = attrs
	var orgPath = "/organizations/" + org.registry_code
	var path = orgPath + "/members"

	return <Page
		page="organization-members"
		req={req}

		nav={[
			{name: "Organisatsioonid", path: "/organizations"},
			{name: org.name, path: orgPath},
			{name: "Liikmed"}
		]}

		header={<Fragment>
			<h1 class="page-heading">{org.name} liikmed</h1>
		</Fragment>}
	>
		<FlashSection flash={req.flash} />

		<Section>
			<p class="page-paragraph">
				Liikmed saavad muuta organisatsiooni andmeid ning avalikustamata
				organisatsiooni avalikuks teha. Liikmeid saavad lisada vaid SEV
				andmebaasi administraatorid.
			</p>

			{members.length > 0 ? <table class="page-table">
				<thead class="page-table-header">
					<tr>
						<th>Lisatud</th>
						<th>Nimi</th>
						<th>Meiliaadress</th>
						<th />
					</tr>
				</thead>

				<tbody>{members.map(function(member) {
					var memberPath = path + "/" + member.account_id

					return <tr>
						<td>{_.formatDate("ee", member.created_at)}</td>
						<td>{member.name}</td>

						<td>
							<a href={"mailto:" + member.email} class="link-button">
								{member.email}
							</a>
						</td>

						<td>
							<FormButton
								req={req}
								action={memberPath}
								class="link-button"
								name="_method"
								value="delete"
								onclick={confirm(`Kindel, et soovid eemaldada ${member.email} organisatsiooni esindajate seast?`)}
							>Eemalda</FormButton>
						</td>
					</tr>
				})}</tbody>
			</table> : null}

			<Form
				req={req}
				action={path}
				id="new-member-form"
				class="page-form page-post-table-form"
				method="post"
			>
				<fieldset>
					<label class="page-form-label">Nimi</label>
					<input name="name" />
				</fieldset>

				<fieldset>
					<label class="page-form-label">Meiliaadress</label>
					<input name="email" type="email" />
				</fieldset>

				<fieldset>
					<button type="submit" class="blue-button page-form-submit">
						Kutsu
					</button>
				</fieldset>
			</Form>
		</Section>
	</Page>
}
