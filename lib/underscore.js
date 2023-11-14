var _ = require("lodash")
var O = require("oolong")
var {Hash} = require("crypto")
var egal = require("egal")
var formatDateTime = require("date-fns/format")
var ISO8601_DATE = /^(\d\d\d\d)-(\d\d)-(\d\d)$/

// Egal.js doesn't support comparing Buffers, Sets and Maps out of the box.
/* eslint no-extend-native: 0 */
Set.prototype.valueOf = function() { return Array.from(this) }
Map.prototype.valueOf = function() { return Array.from(this) }

exports.create = O.create
exports.assign = O.assign
exports.mapValues = O.map
exports.merge = O.merge
exports.keys = O.keys
exports.hasOwn = O.hasOwn
exports.object = O.object
exports.defaults = O.defaults
exports.clone = O.clone
exports.isEmpty = O.isEmpty
exports.isPlainObject = O.isPlainObject
exports.property = O.property
exports.each = _.each
exports.map = _.map
exports.pick = _.pick
exports.indexBy = _.keyBy
exports.groupBy = _.groupBy
exports.sortBy = _.sortBy
exports.fromEntries = _.fromPairs
exports.toEntries = _.toPairs
exports.invert = _.invert
exports.wrap = _.wrap
exports.times = _.times
exports.any = _.some
exports.compose = _.flowRight
exports.isArray = Array.isArray
exports.toUpperCase = Function.call.bind(String.prototype.toUpperCase)
exports.last = function(array) { return array[array.length - 1] }
exports.concat = Array.prototype.concat.bind(Array.prototype)
exports.slice = Function.call.bind(Array.prototype.slice)
exports.flatten = Function.apply.bind(Array.prototype.concat, Array.prototype)
exports.isObject = function(obj) { return obj && typeof obj == "object" }

exports.intersperse = function(array, elem) {
	if (array.length < 2) return array
	var output = new Array(array.length + array.length - 1)
	output.push(array[0])
	for (var i = 1; i < array.length; ++i) output.push(elem, array[i])
	return output
}

exports.diff = function diff(a, b) {
  /* eslint consistent-return: 0 */
  if (egal(a, b)) return undefined

	var value
	if (exports.isPlainObject(a) && exports.isPlainObject(b)) {
		let changes = {}

		for (var key in b) {
			if (!(key in a)) changes[key] = b[key]
			else if ((value = diff(a[key], b[key])) !== void 0) changes[key] = value
		}

		return exports.isEmpty(changes) ? undefined : changes
	}
	else if (exports.isArray(a) && exports.isArray(b)) {
		if (a.length != b.length) return b

		for (let i = 0; i < a.length; ++i)
			if ((value = diff(a[i], b[i])) !== void 0) return b

		return undefined
	}
	else return b
}

exports.parseIsoDate = function(date) {
	var match = ISO8601_DATE.exec(date)
	if (match == null) throw new SyntaxError("Invalid Date: " + date)
	return new Date(+match[1], +match[2] - 1, +match[3])
}

exports.formatDate = function(format, date) {
	switch (format) {
		case "iso": return date.toISOString().slice(0, 10)
		case "ee": return formatDateTime(date, "D.MM.YYYY")
		default: throw new RangeError("Invalid format: " + format)
	}
}

exports.formatDateTime = function(format, date) {
	switch (format) {
		case "iso": return date.toISOString()
		case "ee": return formatDateTime(date, "D.MM.YYYY HH:mm")
		default: throw new RangeError("Invalid format: " + format)
	}
}

exports.formatMoney = function(currency, price) {
	var [adjustedPrice, suffix] =
		Math.abs(price) >= 1e9 ? [price / 1e9, "B"] :
		Math.abs(price) >= 1e6 ? [price / 1e6, "M"] :
		[price, ""]

	return exports.formatPrice(currency, adjustedPrice) + suffix
}

exports.formatPrice = function(currency, price) {
	switch (currency) {
		case "USD": return "$" + exports.formatThousands(price)
		case "EUR": return "€" + exports.formatThousands(price)
		default: throw new RangeError("Unsupported currency: " + currency)
	}
}

exports.formatThousands = function(n) {
	var [int, fraction] = Math.abs(n).toFixed(2).split(".")

	int = int.slice(0, int.length % 3 || 3) + (
		int.slice(int.length % 3 || 3).replace(/.../g, ",$&")
	)

	return (n < 0 ? "-" : "") + (fraction == "00" ? int : int + "." + fraction)
}

exports.parseYearQuarter = function(yearAndQuarter) {
	var m = /^(\d{1,4})Q([1234])$/.exec(yearAndQuarter)
	if (m == null) return null
	return [Number(m[1]), Number(m[2])]
}

exports.formatYearQuarter = function(year, quarter) {
	return year + "Q" + quarter
}

exports.parseBoolean = function(input) {
  if (typeof input != "string") return !!input

  switch (input.toLowerCase()) {
    case "1":
    case "on":
    case "t":
    case "true":
    case "y":
    case "yes":
      return true

    default:
      return false
  }
}

exports.next = function(fn) {
  // Special casing arity 4 to get Express to recognize it as an error handling
  // middleware.
  if (fn.length == 4) return function(err, req, res, next) {
    return fn.call(this, err, req, res, next).catch(next)
  }

  return function() {
    return fn.apply(this, arguments).catch(arguments[arguments.length - 1])
  }
}

exports.sha256 = function(data) {
	return new Hash("sha256").update(data).digest()
}
