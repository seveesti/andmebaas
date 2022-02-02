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
	var {t} = req
	var org = attrs.organization
	var {members} = attrs
	var orgPath = "/enterprises/" + org.registry_code
	var path = orgPath + "/members"

	return <Page
		page="organization-members"
		req={req}
		title={t("organization_members_page.title", {name: org.name})}

		nav={[
			{name: t("admin_nav.organizations"), path: "/enterprises"},
			{name: org.name, path: orgPath},
			{name: t("organization_page.admin_nav.members")}
		]}

		header={<Fragment>
			<h1 class="page-heading">
				{t("organization_members_page.title", {name: org.name})}
			</h1>
		</Fragment>}
	>
		<FlashSection flash={req.flash} />

		<Section>
			<p class="page-paragraph">{t("organization_members_page.description")}</p>

			{members.length > 0 ? <table class="page-table">
				<thead class="page-table-header">
					<tr>
						<th>{t("organization_members_page.added_column")}</th>
						<th>{t("organization_members_page.name_column")}</th>
						<th>{t("organization_members_page.email_column")}</th>
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

								onclick={
									confirm(t("organization_members_page.remove_confirmation", {
										email: member.email
									}))
								}
							>{t("organization_members_page.remove")}</FormButton>
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
					<label class="page-form-label">
						{t("organization_members_page.form.name")}
					</label>
					<input name="name" />
				</fieldset>

				<fieldset>
					<label class="page-form-label">
						{t("organization_members_page.form.email")}
					</label>

					<input name="email" type="email" />
				</fieldset>

				<fieldset>
					<button type="submit" class="blue-button page-form-submit">
						{t("organization_members_page.form.invite")}
					</button>
				</fieldset>
			</Form>
		</Section>
	</Page>
}
