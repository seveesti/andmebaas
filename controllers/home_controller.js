var Router = require("express").Router

exports.router = Router({mergeParams: true})

exports.router.get("/", usePath.bind(null, "/organizations"))

function usePath(path, req, _res, next) {
	req.url = path + req.url.replace(/^[^?]+/, "")
	next()
}
