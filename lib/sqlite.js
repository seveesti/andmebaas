var Sqlite3 = require("better-sqlite3")
var Sql = require("sqlate").Sql
var sql = require("sqlate")

module.exports = function(path, opts) {
	opts = {fileMustExist: opts == null || !opts.create}
	var sqlite = new Sqlite3(path, opts)

	sqlite.pragma("foreign_keys = ON")
	sqlite.pragma("journal_mode = DELETE")

	var db = execute.bind(null, sqlite)
	db.pragma = sqlite.pragma.bind(sqlite)
	db.prepare = function(sql) { return new Statement(sqlite.prepare(sql)) }
	db.batch = sqlite.exec.bind(sqlite)
	db.each = iterate.bind(null, sqlite)
	db.close = sqlite.close.bind(sqlite)
	db.transact = transact.bind(null, db)
	return db
}

function Statement(statement) {
	this.statement = statement
}

Statement.prototype.__defineGetter__("reader", function() {
	return this.statement.reader
})

Statement.prototype.all = function(params) {
	return this.statement.all(params.map(serialize))
}

Statement.prototype.get = function(params) {
	return this.statement.get(params.map(serialize))
}

Statement.prototype.run = function(params) {
	return this.statement.run(params.map(serialize))
}

Statement.prototype.iterate = function(params) {
	return this.statement.iterate(params.map(serialize))
}

function execute(sqlite, sql) {
	if (!(sql instanceof Sql)) throw new TypeError("Not Sql: " + sql)

	// Better-Sqlite3 throws if you use `all` on a statement that doesn't return
	// anything.
	var statement = sqlite.prepare(String(sql)), params = sql.parameters
	return statement.reader ? statement.all(params) : statement.run(params)
}

function iterate(sqlite, sql) {
	if (!(sql instanceof Sql)) throw new TypeError("Not Sql: " + sql)

	var statement = sqlite.prepare(String(sql)), params = sql.parameters
	return statement.iterate(params)
}

function transact(sqlite, fn) {
	sqlite(sql`BEGIN`)
	try { fn(); sqlite(sql`COMMIT`) }
	catch (err) { sqlite(sql`ROLLBACK`); throw err }
}

function serialize(value) {
	if (value instanceof Date) return value.toISOString()
	return value
}
