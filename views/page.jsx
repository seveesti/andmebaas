/** @jsx Jsx */
var _ = require("root/lib/underscore")
var Jsx = require("j6pack")
var Url = require("url")
var {Fragment} = Jsx
var LIVERELOAD_PORT = process.env.LIVERELOAD_PORT || 35738
var LANGS = require("root/config").languages
var DEFAULT_LANG = LANGS[0]
var {HEADER_MENUS} = require("root/lib/i18n")
var {FOOTER_MENUS} = require("root/lib/i18n")
var {ENV} = process.env
var HTTP_URL = /^https?:\/\//
var EMAIL_URL = /^mailto:/
var EMPTY_ARR = Array.prototype
exports = module.exports = Page
exports.Centered = Centered
exports.Section = Section
exports.Heading = Heading
exports.Subheading = Subheading
exports.Flash = Flash
exports.FlashSection = FlashSection
exports.Form = Form
exports.FormButton = FormButton
exports.Table = Table
exports.UntrustedLink = UntrustedLink
exports.MoneyElement = MoneyElement
exports.SdgImage = SdgImage

var ROOT_PATH = Url.parse(require("root/config").url).pathname
if (ROOT_PATH == "/") ROOT_PATH = ""
exports.ROOT_PATH = ROOT_PATH

function Page(attrs, children) {
	var {req} = attrs
	var {t} = req
	var {account} = req
	var {title} = attrs
	var {page} = attrs
	var {nav} = attrs

	var headerMenu = HEADER_MENUS[t.lang] || HEADER_MENUS[DEFAULT_LANG]
	var footerMenu = FOOTER_MENUS[t.lang] || FOOTER_MENUS[DEFAULT_LANG]

	return <html lang="en" class={attrs.class}>
		<head>
			<meta charset="utf-8" />
			<meta name="viewport" content="width=1000px" />

			<link
				rel="stylesheet"
				href={`${ROOT_PATH}/assets/page.css`}
				type="text/css"
			/>

			<title>{title == null ? "" : title + " - "} {t("title")}</title>
			<LiveReload req={req} />

			<link rel="shortcut icon" href={`${ROOT_PATH}/favicon.ico`} />

			<link
				rel="apple-touch-icon"
				sizes="76x76"
				href={`${ROOT_PATH}/assets/apple-touch-icon.png`}
			/>

			<link
				rel="icon"
				type="image/png"
				sizes="16x16"
				href={`${ROOT_PATH}/assets/favicon-16x16.png`}
			/>

			<link
				rel="icon"
				type="image/png"
				sizes="32x32"
				href={`${ROOT_PATH}/assets/favicon-32x32.png`}
			/>
		</head>

		<body id={page + "-page"}>
			<div id="hero">
				<nav id="nav"><Centered>
					<a href="/" class="home"><img
						src={`${ROOT_PATH}/assets/sev-logo.svg`}
						alt="SEV"
						title={t("title")}
					/></a>

					<ol>
						{headerMenu.map((item) => <li class={
							"page-link" + (item.children.length > 0 ? " with-submenu" : "")
						}>
							<a
								href={item.url}
								class={item.id == "andmebaas" ? "selected" : ""}
							>
								{item.title}
							</a>

							{item.children.length > 0 ? <ol class="submenu">
								{item.children.map(function(child) {
									return <li><a href={child.url}>
										{child.title}
									</a></li>
								})}
							</ol> : null}
						</li>)}

						<li class="join-button">
							<a
								href="https://kell.ee/liitu-kogukonnaga/"
								class="blue-border-button"
							>
								{t("nav.join")}
							</a>
						</li>

						<li>
							<Form
								action={`${ROOT_PATH}/language`}
								method="put"
								class="languages-form"
								req={req}
							>
								<ol class="languages">{LANGS.map((lang) => <li><button
									name="language"
									class="language"
									value={lang}
									disabled={t.lang === lang}
								>{t("nav." + lang)}
								</button></li>)}</ol>
							</Form>
						</li>
					</ol>
				</Centered></nav>

				{attrs.header ? <header id="header">
					{attrs.header}
				</header> : null}
			</div>

			{account ? <nav id="account-nav"><Centered>
				{nav ? <ol class="breadcrumbs">
					{nav.map(function({name, path, pages}) {
						return <li class="breadcrumb">
							{name ? <a href={path}>{name}</a> : null}

							{pages ? <ul class="pages">
								{pages.map(({name, path}) => <li class="page">
									<a href={path}>{name}</a>
								</li>)}
							</ul> : null}
						</li>
					})}
				</ol> : null}

				<div class="session">
					<span class="account-name">{account.name || account.email}</span>

					<FormButton
						req={req}
						formClass="signout-form"
						action={ROOT_PATH + "/sessions/" + req.session.id}
						name="_method"
						value="delete"
					>{t("nav.signout")}</FormButton>
				</div>
			</Centered></nav> : null}

			<main id="main">{children}</main>

			<footer id="footer"><Centered>
				<ol class="links">
					{footerMenu.links.map(function(item) {
						return <li><a href={item.url}>{item.title}</a></li>
					})}
				</ol>

				<a href="/" class="logo">
					<img
						src={`${ROOT_PATH}/assets/sev-logo.svg`}
						alt="SEV"
						title={t("title")}
					/>
				</a>

				<div class="contacts">
					<a href={footerMenu.facebookUrl}>
						<img
							src={`${ROOT_PATH}/assets/facebook.svg`}
							alt="Facebook"
							title="Facebook"
						/>
					</a>

					<a href={footerMenu.linkedinUrl}>
						<img
							src={`${ROOT_PATH}/assets/linkedin.svg`}
							alt="LinkedIn"
							title="LinkedIn"
						/>
					</a>

					<span class="address">{footerMenu.address}</span>

					<a
						class="email"
						href={"mailto:" + footerMenu.email}
					>
						{footerMenu.email}
					</a>

					<span class="copyright">{footerMenu.copyright}</span>
				</div>
			</Centered></footer>
		</body>
	</html>
}

function Centered(_attrs, children) {
	return <div class="centered">{children}</div>
}

function Section(attrs, children) {
	return <section
		id={attrs && attrs.id}
		class={"centered page-section " + (attrs && attrs.class || "")}
	>
		{children}
	</section>
}

function Heading(_attrs, children) {
	return <h2 class="page-heading">{children}</h2>
}

function Subheading(_attrs, children) {
	return <h3 class="page-subheading">{children}</h3>
}

function Table(attrs, children) {
	return <div class="page-table-wrapper">
		<table {...attrs}>{children}</table>
	</div>
}

function Form(attrs, children) {
	var {method} = attrs

	return <form
		id={attrs.id}
		class={attrs.class}
		action={attrs.action}
		hidden={attrs.hidden}
		enctype={attrs.enctype}
		method={method == "get" ? method : "post"}
	>
		{method && !(method == "get" || method == "post") ?
			<input type="hidden" name="_method" value={method} />
		: null}

		{method != "get" ?
			<input type="hidden" name="_csrf_token" value={attrs.req.csrfToken} />
		: null}

		{children}
	</form>
}

function Flash(attrs) {
	var {flash} = attrs

	return <Fragment>
		{flash("notice") ? <p class="flash notice">{flash("notice")}</p> : null}
		{flash("error") ? <p class="flash error">{flash("error")}</p> : null}
	</Fragment>
}

function FlashSection(attrs) {
	var {flash} = attrs
	if (_.isEmpty(flash())) return null
	return <Section class="flash-section"><Flash flash={flash} /></Section>
}

function FormButton(attrs, children) {
	return <Form
		req={attrs.req}
		action={attrs.action}
		class={attrs.formClass}
		method={attrs.name == "_method" ? "post" : "put"}
	>
		<button
			id={attrs.id}
			class={attrs.class}
			type={attrs.type}
			name={attrs.name}
			value={attrs.value}
			onclick={attrs.onclick}
			disabled={attrs.disabled}
		>{children}</button>
	</Form>
}

function LiveReload(attrs) {
	if (ENV != "development") return null
	var {req} = attrs

	return <script
		src={`http://${req.hostname}:${LIVERELOAD_PORT}/livereload.js?snipver=1`}
		async
		defer
	/>
}

function UntrustedLink(attrs, children) {
	var {href} = attrs
	children = children ? children.filter(Boolean) : EMPTY_ARR
	var text = children.length ? children : href

	if (HTTP_URL.test(href) || EMAIL_URL.test(href)) return <a
		rel="external noopener"
		{...attrs}
		class={attrs.class}
	>
		{text}
	</a>
	else return <span class={attrs.class}>{text}</span>
}

function MoneyElement(attrs) {
	var amount = attrs.amount
	var currency = attrs.currency

	var text = _.formatMoney(currency, amount)

	var major, cents = ""
	if (/\.\d+$/.test(text)) [major, cents] = text.split(".")
	else major = text

	return <span class="sev-money" title={_.formatPrice(currency, amount)}>
		{major}{cents ? <sup>.{cents}</sup> : null}
	</span>
}

function SdgImage(attrs) {
	var {t} = attrs
	var {goal} = attrs

	return <img
		src={`${ROOT_PATH}/assets/sdg-` + goal + "-" + t.lang +".svg"}
		alt={t(`sdg.${goal}.title`)}
		title={t(`sdg.${goal}.description`)}
	/>
}
