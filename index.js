var Fs = require("fs")
var Config = require("root/config")
var lazy = require("lazy-object").defineLazyProperty
var ENV = process.env.ENV

// eslint-disable-next-line no-extend-native
Object.defineProperty(Object.prototype, "__proto__", {
  value: undefined, configurable: true, writable: true
})

lazy(exports, "logger", function() {
  switch (ENV) {
		case "test": return require("root/lib/null_logger")
		default: return console
  }
})

lazy(exports, "sqlite", function() {
	var connect = require("root/lib/sqlite")

	switch (ENV) {
		case "test":
			var sqlite = connect(":memory:")
			var sql = require("sqlate")
			sqlite.batch(String(Fs.readFileSync(__dirname + "/db/schema.sql")))
			sqlite(sql`PRAGMA foreign_keys = ON`) // Schema resets foreign_keys.
			return sqlite

		default: return connect(__dirname + "/config/" + ENV + ".sqlite3")
	}
})

lazy(exports, "sendEmail", function() {
  switch (ENV) {
		case "test": return function() {}
		default: return require("root/lib/emailer")(Config.email)
  }
})
