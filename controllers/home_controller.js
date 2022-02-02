var Router = require("express").Router
var LANGS = require("root/config").languages
var LANG_COOKIE = require("root/config").languageCookieName

exports.router = Router({mergeParams: true})

exports.router.get("/", usePath.bind(null, "/enterprises"))

exports.router.put("/language", function(req, res) {
	var lang = req.body.language

	if (LANGS.includes(lang)) res.cookie(LANG_COOKIE, lang, {
		httpOnly: true,
		secure: req.secure,
		maxAge: 365 * 86400 * 1000
	})

	res.redirect(303, req.headers.referer || "/")
})

function usePath(path, req, _res, next) {
	req.url = path + req.url.replace(/^[^?]+/, "")
	next()
}
