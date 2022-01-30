var I18n = require("root/lib/i18n")
var Config = require("root/config")
var LANGS = Config.languages
var DEFAULT_LANG = Config.languages[0]
var COOKIE = Config.languageCookieName

module.exports = function(req, res, next) {
	var lang = req.cookies[COOKIE]
	if (!LANGS.includes(lang)) lang = DEFAULT_LANG
	req.t = res.locals.t = I18n.t.bind(null, lang)
	req.t.lang = lang
	next()
}
