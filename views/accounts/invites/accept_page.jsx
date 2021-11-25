/** @jsx Jsx */
var Jsx = require("j6pack")
var Page = require("../../page")
var {Fragment} = Jsx
var {Section} = Page
var {Form} = Page

module.exports = function(attrs) {
	var {req} = attrs
	var {account} = attrs
	var organizations = attrs.organizations || []
	var path = req.baseUrl + "/" + attrs.token.toString("hex")

	return <Page
		page="accept-account-invite"
		req={req}

		header={<Fragment>
			<h1 class="page-heading">Uus konto</h1>
		</Fragment>}
	>
		<Section>
			<p class="page-paragraph">
				Sind on kutsutud SEVi andmebaasi täiendama.
				<br />
				Konto luukakse meiliaadressiga <a href={"mailto:" + account.email}>{account.email}</a>, kuid seda saad hiljem profiilist muuta.
			</p>

			{organizations.length > 0 ? <Fragment>
				<p>
					Peale parooli määramist saad hallata järgmisi ettevõtteid:
				</p>

				<ul>{organizations.map(function(org) {
					return <li>{org.name}</li>
				})}</ul>
			</Fragment> : null}

			<Form req={req} action={path} method="put" class="page-form">
				<input
					name="email"
					type="email"
					autocomplete="username"
					value={account.email}
					hidden
				/>

				<label class="page-form-label">Parool</label>

				<input
					name="password"
					type="password"
					autocomplete="new-password"
					required
				/>

				<button type="submit" class="blue-button page-form-submit">
					Loo konto
				</button>
			</Form>
		</Section>
	</Page>
}
