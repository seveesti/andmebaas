/** @jsx Jsx */
var Jsx = require("j6pack")
var Page = require("../page")
var {Fragment} = Jsx
var {Section} = Page
var {Form} = Page

module.exports = function(attrs) {
	var {req} = attrs
	var {email} = attrs
	var {password} = attrs
	var path = req.baseUrl

	return <Page
		page="create-session"
		req={req}

		header={<Fragment>
			<h1 class="page-heading">Logi sisse</h1>
		</Fragment>}
	>
		<Section>
			<Form
				id="signin-form"
				class="page-form"
				req={req}
				action={path}
				method="post"
			>
				<label class="page-form-label">Meiliaadress</label>
				<input
					name="email"
					type="email"
					autocomplete="username"
					value={email}
					required
				/>

				<label class="page-form-label">Parool</label>
				<input
					name="password"
					type="password"
					autocomplete="current-password"
					value={password}
					required
				/>

				<button type="submit" class="page-form-submit blue-button">
					Logi sisse
				</button>
			</Form>
		</Section>
	</Page>
}
