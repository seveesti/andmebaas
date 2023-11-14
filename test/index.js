var _ = require("root/lib/underscore")
var Mocha = require("mocha")
var CACHE = require.cache

process.on("unhandledRejection", function() {})

// Egal.js doesn't support comparing Buffers, Sets and Maps out of the box.
/* eslint no-extend-native: 0 */
Buffer.prototype.valueOf = Buffer.prototype.toJSON
Set.prototype.valueOf = function() { return Array.from(this) }
Map.prototype.valueOf = function() { return Array.from(this) }

Mocha.prototype.loadFiles = _.wrap(Mocha.prototype.loadFiles, function(orig) {
	orig.apply(this, _.slice(arguments, 1))

	// Mocha will not clear files in the bin directory.
	after(function() { delete CACHE[require.resolve("root/bin/web")] })

	after(function() {
		for (var path in CACHE) if (path.endsWith(".jsx")) delete CACHE[path]
	})
})
