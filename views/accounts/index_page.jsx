/** @jsx Jsx */
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
	var currentAccount = req.account
	var {accounts} = attrs
	var path = req.baseUrl

	return <Page
		page="accounts"
		req={attrs.req}

		nav={[
			{name: "Andmebaas", path: "/"},
			{name: "Kontod"}
		]}

		header={<Fragment>
			<h1 class="page-heading">Kasutajakontod</h1>
		</Fragment>}
	>
		<FlashSection flash={req.flash} />

		<Section>
			<table class="page-table">
				<thead class="page-table-header">
					<tr>
						<th>Nimi</th>
						<th>Meiliaadress</th>
						<th>Organisatsioonid</th>
						<th />
					</tr>
				</thead>

				<tbody>{accounts.map(function(account) {
					var accountPath = path + "/" + account.id

					return <tr>
						<td>{account.name}</td>
						<td>{account.email}</td>
						<td>{account.administrative
							? <span class="administrative">Administraator</span>
							: <ul>{account.memberships.map((membership) => <li>
									<a
										href={"/organizations/" + membership.registry_code}
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
								onclick={confirm(`Kindel, et soovid konto eemaldada?`)}
							>Eemalda</FormButton>}
						</td>
					</tr>
				})}</tbody>
			</table>

			<Form
				id="new-account-form"
				class="page-form page-post-table-form"
				req={req}
				method="post"
				action={req.baseUrl}
			>
				<fieldset>
					<label class="page-form-label">Nimi</label>
					<input name="name" />
				</fieldset>

				<fieldset>
					<label class="page-form-label">Meiliaadress</label>
					<input
						name="email"
						type="email"
						required
					/>
				</fieldset>

				<fieldset>
					<button type="submit" class="blue-button page-form-submit">
						Lisa uus administraator
					</button>
				</fieldset>
			</Form>
		</Section>
	</Page>
}
