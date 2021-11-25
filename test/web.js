var Http = require("http")
var Events = require("events")
var Web = require("root/bin/web")
var {request} = require("./fixtures")
var fetchDefaults = require("fetch-defaults")

exports = module.exports = function() {
	before(exports.listen)
	after(exports.close)
}

exports.listen = async function() {
	this.server = new Http.Server(Web)
	this.server.listen(0, "127.0.0.1")
	await Events.once(this.server, "listening")

	this.url = "http://localhost:" + this.server.address().port
	this.request = fetchDefaults(request, this.url)
}

exports.close = function(done) {
	this.server.close(done)
}
