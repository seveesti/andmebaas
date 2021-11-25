exports.parseOrder = function(query) {
	var direction = query[0] == "-" ? "desc" : "asc"
	var field = query.replace(/^[-+]/, "")
	return [field, direction]
}
