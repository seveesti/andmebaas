/** @jsx Jsx */
var Jsx = require("j6pack")
var Page = require("../../page")
var {Fragment} = Jsx
var {Section} = Page
var {Form} = Page
var {ROOT_PATH} = Page

module.exports = function(attrs) {
	var {req} = attrs
	var {t} = req
	var {account} = attrs
	var organizations = attrs.organizations || []
	var invitePath = ROOT_PATH + req.baseUrl + "/" + attrs.token.toString("hex")

	return <Page
		page="accept-account-invite"
		req={req}
		title={t("invite_accept_page.title")}

		header={<Fragment>
			<h1 class="page-heading">{t("invite_accept_page.title")}</h1>
		</Fragment>}
	>
		<Section>
			<p class="page-paragraph">
				{t("invite_accept_page.description", {email: account.email})}
			</p>

			{organizations.length > 0 ? <Fragment>
				<p class="page-paragraph">
					{t("invite_accept_page.organization_list")}:
				</p>

				<ul id="organizations">{organizations.map(function(org) {
					return <li>{org.name}</li>
				})}</ul>
			</Fragment> : null}

			<Form
				req={req}
				action={invitePath}
				method="put"
				id="account-form"
				class="page-form"
			>
				<input
					name="email"
					type="email"
					autocomplete="username"
					value={account.email}
					hidden
				/>

				<label class="page-form-label">
					{t("invite_accept_page.password")}
				</label>

				<input
					name="password"
					type="password"
					autocomplete="new-password"
					required
				/>

				<button type="submit" class="blue-button page-form-submit">
					{t("invite_accept_page.create")}
				</button>
			</Form>
		</Section>
	</Page>
}
