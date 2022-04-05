/** @jsx Jsx */
var Jsx = require("j6pack")
var Page = require("../page")
var {Fragment} = Jsx
var {Section} = Page
var {Form} = Page
var {FlashSection} = Page
var {ROOT_PATH} = Page

module.exports = function(attrs) {
	var {req} = attrs
	var {t} = attrs
	var {email} = attrs
	var {password} = attrs
	var sessionsPath = ROOT_PATH + req.baseUrl

	return <Page
		page="create-session"
		req={req}
		title={t("create_session_page.title")}

		header={<Fragment>
			<h1 class="page-heading">{t("create_session_page.title")}</h1>
		</Fragment>}
	>
		<FlashSection flash={req.flash} />

		<Section>
			<Form
				id="signin-form"
				class="page-form"
				req={req}
				action={sessionsPath}
				method="post"
			>
				<label class="page-form-label">
					{t("create_session_page.form.email")}
				</label>

				<input
					name="email"
					type="email"
					class="page-form-input"
					autocomplete="username"
					value={email}
					required
				/>

				<label class="page-form-label">
					{t("create_session_page.form.password")}
				</label>

				<input
					name="password"
					type="password"
					class="page-form-input"
					autocomplete="current-password"
					value={password}
					required
				/>

				<button type="submit" class="page-form-submit blue-button">
					{t("create_session_page.form.create")}
				</button>
			</Form>
		</Section>
	</Page>
}
