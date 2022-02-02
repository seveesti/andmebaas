var _ = require("root/lib/underscore")

describe("Web", function() {
	require("root/test/db")()
	require("root/test/web")()
	require("root/test/fixtures").csrf()

	describe("/organizations", function() {
		_.each({
			"/organizations": "/enterprises",
			"/organizations?foo": "/enterprises?foo",
			"/organizations/": "/enterprises",
			"/organizations/?foo": "/enterprises?foo",
			"/organizations/42": "/enterprises/42",
			"/organizations/42?foo": "/enterprises/42?foo",
			"/organizations/42/edit": "/enterprises/42/edit",
			"/organizations/42/edit?foo": "/enterprises/42/edit?foo"
		}, function(to, from) {
			it(`must redirect ${from} to ${to}`, async function() {
				var res = await this.request(from)
				res.statusCode.must.equal(307)
				res.headers.location.must.equal(to)
			})
		})
	})
})
