var Db = require("root/lib/db")
var sqlite = require("root").sqlite
module.exports = new Db(Object, sqlite, "organization_taxes")
