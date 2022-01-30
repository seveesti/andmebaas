var _ = require("root/lib/underscore")
var LANGS = require("root/config").languages
var DEFAULT_LANG = LANGS[0]

// Clear prototype for easy "a in b" checks.
var TEXTS = _.create(null, _.object(LANGS, (lang) => require(`./i18n/${lang}`)))

exports.t = function(lang, key, props) {
	var text = TEXTS[lang][key] || TEXTS[DEFAULT_LANG][key]
	if (text == null) console.warn("Missing phrase: %s", key)
	return text == null ? null : props == null ? text : interpolate(text, props)
}

function interpolate(string, props) {
	return string.replace(/\$\{(\w+)\}/g, (_match, key) => props[key])
}
