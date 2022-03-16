/** @jsx Jsx */
var Jsx = require("j6pack")
var {Fragment} = Jsx
var Page = require("../page")
var {Section} = Page
var {confirm} = require("root/lib/jsx")
var {Form} = Page
var {FormButton} = Page
var {FlashSection} = Page
var {ROOT_PATH} = Page

module.exports = function(attrs) {
	var {req} = attrs
	var {t} = req
	var currentAccount = req.account
	var {accounts} = attrs
	var accountsPath = ROOT_PATH + req.baseUrl

	return <Page
		page="accounts"
		req={attrs.req}
		title={t("accounts_page.title")}

		nav={[
			{name: t("admin_nav.organizations"), path: ROOT_PATH + "/enterprises"},
			{name: t("accounts_page.title")}
		]}

		header={<Fragment>
			<h1 class="page-heading">{t("accounts_page.title")}</h1>
		</Fragment>}
	>
		<FlashSection flash={req.flash} />

		<Section>
			<table class="page-table">
				<thead class="page-table-header">
					<tr>
						<th>{t("accounts_page.name_column")}</th>
						<th>{t("accounts_page.email_column")}</th>
						<th>{t("accounts_page.access_column")}</th>
						<th />
					</tr>
				</thead>

				<tbody>{accounts.map(function(account) {
					var accountPath = accountsPath + "/" + account.id

					return <tr>
						<td>{account.name}</td>
						<td>{account.email}</td>
						<td>{account.administrative
							? <span class="administrative">{t("accounts_page.admin")}</span>
							: <ul>{account.memberships.map((membership) => <li>
									<a
										href={
											ROOT_PATH + "/enterprises/" + membership.registry_code
										}

										class="link-button"
									>
										{membership.name}
									</a>
								</li>)}
							</ul>
						}</td>

						<td>
							{currentAccount.id == account.id ? null : <FormButton
								req={req}
								action={accountPath}
								class="link-button"
								name="_method"
								value="delete"
								onclick={confirm(t("accounts_page.delete_confirmation"))}
							>{t("accounts_page.delete")}</FormButton>}
						</td>
					</tr>
				})}</tbody>
			</table>

			<Form
				id="new-account-form"
				class="page-form page-post-table-form"
				req={req}
				method="post"
				action={accountsPath}
			>
				<fieldset>
					<label class="page-form-label">
						<th>{t("accounts_page.form.name")}</th>
					</label>

					<input name="name" />
				</fieldset>

				<fieldset>
					<label class="page-form-label">
						<th>{t("accounts_page.form.email")}</th>
					</label>

					<input name="email" type="email" required />
				</fieldset>

				<fieldset>
					<button type="submit" class="blue-button page-form-submit">
						<th>{t("accounts_page.form.create")}</th>
					</button>
				</fieldset>
			</Form>
		</Section>
	</Page>
}
