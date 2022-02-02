/** @jsx Jsx */
var Jsx = require("j6pack")
var {Fragment} = Jsx
var Page = require("./page")
var {Section} = Page

module.exports = function(attrs) {
	var {req} = attrs
	var title = attrs.title || req.t("error_page.sorry")
	var {message} = attrs

	return <Page
		page="error"
		req={attrs.req}
		title={title}

		header={<Fragment>
			<h1 class="page-heading">{title}</h1>
		</Fragment>}
	>
		<Section>{message ? <p class="page-paragraph">
			{message}
		</p> : null}</Section>
	</Page>
}
