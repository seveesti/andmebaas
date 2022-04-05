var _ = require("root/lib/underscore")
var LANGS = require("root/config").languages
var DEFAULT_LANG = LANGS[0]
var SITE_URL = require("root/config").siteUrl
var fetch = require("fetch-off")

var request = require("fetch-defaults")(fetch, SITE_URL, {
	timeout: 10000,
	headers: {Accept: "application/json"}
})

request = require("fetch-parse")(request, {json: true})
request = require("fetch-throw")(request)

var HEADER_MENU_FALLBACKS = {
	et: require("./i18n/et_header_menu"),
	en: require("./i18n/en_header_menu")
}

var FOOTER_MENU_FALLBACKS = {
	et: require("./i18n/et_footer_menu"),
	en: require("./i18n/en_footer_menu")
}

// Clear prototype for easy "a in b" checks.
var TEXTS = _.create(null, _.object(LANGS, (lang) => require(`./i18n/${lang}`)))

exports.t = function(lang, key, props) {
	var text = TEXTS[lang][key] || TEXTS[DEFAULT_LANG][key]
	if (text == null) console.warn("Missing phrase: %s", key)
	return text == null ? null : props == null ? text : interpolate(text, props)
}

exports.HEADER_MENUS = _.mapValues(HEADER_MENU_FALLBACKS, parseHeaderMenu)
exports.FOOTER_MENUS = _.mapValues(FOOTER_MENU_FALLBACKS, parseFooterMenu)

function parseHeaderMenu(menu) {
	return menu.items.map(function parse(item) {
		return {
			title: item.title,
			url: item.url,
			children: item.child_items ? item.child_items.map(parse) : []
		}
	})
}

function parseFooterMenu(menu) {
	return {
		address: menu.acf.address,
		email: menu.acf.contact_email,
		copyright: menu.acf.copyright,
		facebookUrl: menu.acf.facebook_url,
		linkedinUrl: menu.acf.linkedin_url,

		links: menu.acf.footer_menu.map((item) => ({
			title: item.link.title,
			url: item.link.url
		}))
	}
}

exports.updateMenus = function() {
	async function get(lang) {
		var root = lang == "et" ? "" : "/" + lang

		var header = (await request(root + "/wp-json/menus/v1/menus/primary")).body
		if (header == null) throw new TypeError(`Failed to load ${lang} header`)

		var footer = (await request(root + "/wp-json/acf/v3/options/options")).body
		if (footer == null) throw new TypeError(`Failed to load ${lang} footer`)

		return {header: parseHeaderMenu(header), footer: parseFooterMenu(footer)}
	}

	return Promise.all(LANGS.map((lang) => get(lang).then(({header, footer}) => {
		exports.HEADER_MENUS[lang] = header
		exports.FOOTER_MENUS[lang] = footer
	})))
}

function interpolate(string, props) {
	return string.replace(/\$\{(\w+)\}/g, (_match, key) => props[key])
}
