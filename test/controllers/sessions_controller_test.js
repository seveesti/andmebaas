describe("SessionsController", function() {
	require("root/test/db")()
	require("root/test/web")()
	require("root/test/fixtures").csrf()

	describe("GET /", function() {
		it("must redirect to /new", async function() {
			var res = await this.request("/sessions")
			res.statusCode.must.equal(302)
			res.headers.location.must.equal("/sessions/new")
		})
	})
})
