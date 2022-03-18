var _ = require("./underscore")
var parseHtmlFragment = require("parse5").parseFragment
var shiftEntry = shiftLine.bind(null, /^\d+\. kanne: \s*/)
var logger = require("root").logger
var BLOCK_ELEMENTS = new Set(require("./html_block_elements"))
var ELEMENT_CHILDREN = new Set(["table", "tbody", "tr"])

exports.parseHtml = function(html) {
	var fragment = parseHtmlFragment(html)

	var text = elementToText(fragment)
	var lines = text.split(/\n/).filter((s) => s && /\S/.test(s))

	var lastLineCount
	do {
		lastLineCount = lines.length
		shiftLine(/^\s*Registrikaart\s*$/, lines)
		shiftLine(/^\s*Inglise keeles\s*$/, lines)
		shiftLine(/^\s*PDF\s*$/, lines)
	} while (lastLineCount != lines.length)

	var header = lines.shift()
	var m = header.match(/^.*?registri kehtivate andmete väljatrükk seisuga\s+(\S+) kell (\S+)$/)
	if (m == null) throw new Error("Invalid registry card header: " + header)
	var issuedDate = m[1]
	var issuedTime = m[2]

	var issuedAt = _.parseEstonianDate(issuedDate)
	if (issuedAt == null) throw new SyntaxError("Invalid Date: " + issuedAt)
	var [issuedHour, issuedMinute] = issuedTime.split(":").map(Number)
	issuedAt.setHours(issuedHour, issuedMinute)

	header = lines.shift()
	var registryCode = header.match(/^.*? \(registrikood (\d+)(?:, [^)]+)?\)/)[1]

	var attrs = {
		registryCode,
		issuedAt,
		boardMembers: []
	}

	while (lines.length > 0) {
		var title = lines.shift()

		switch (title) {
			case "Nimi ja aadress":
			case "Ärinimi ja aadress":
				_.assign(attrs, parseContacts(lines))
				break

			case "Esindusõigus":
				attrs.boardMembers = parseBoardMembers(lines)
				break

			case "Õiguslik seisund":
				while (shiftEntry(lines) != null);
				break

			case "Kannete loetelu":
				_.assign(attrs, parseHistory(lines))
				break

			case "Väljatrüki lõpp": break

			default:
				logger.warn("Unknown section: " + title)
				while (shiftEntry(lines) != null);
		}
	}

	return attrs
}

function parseContacts(lines) {
	var attrs = {}, line

	while ((line = shiftEntry(lines)) != null) {
		var m

		if (m = line.match(/^(?:Nimi|Ärinimi) on (.+)/))
			attrs.name = m[1]
		else if (m = line.match(/^Aadress on (.+)/))
			attrs.address = m[1]
		else if (m = line.match(/^Elektronposti aadress on (.+)/))
			attrs.email = m[1]

		else logger.warn("Unknown contacts line: " + line)
	}

	return attrs
}

function parseBoardMembers(lines) {
	var members = [], line

	while ((line = shiftEntry(lines)) != null) {
		let m

		if (m = line.match(/^Juhatuse liige on (.+?), isikukood (\d+)/))
			members.push({name: m[1], personalId: m[2]})

		else logger.warn("Unknown board member line: " + line)
	}

	while ((line = shiftLine(/^\s*\*\s+/, lines)) != null) {
		let m = line.match(
			/^\S+ võib kõikide tehingute tegemisel esindada iga juhatuse liige\.$/
		)

		if (m == null) logger.warn("Invalid representation line: " + line)
	}

	return members
}

function parseHistory(lines) {
	var attrs = {}, line

	while (shiftLine(/^.*?registriosakonnas tehtud kanded:/, lines) != null) {
		while ((line = shiftEntry(lines)) != null) {
			var m

			if (m = line.match(
				/^Kinnitatud (\d\d\.\d\d\.\d\d\d\d)(?:\s+\(esmakanne\))?$/)
			) {
				var date = _.parseEstonianDate(m[1])
				if (date == null) throw new SyntaxError("Invalid Date: " + date)
				attrs.foundedOn = date
			}

			else if (
				line.match(/^Kinnitatud (\d\d\.\d\d\.\d\d\d\d)\s+\(muutmiskanne\)$/)
			);

			else logger.warn("Unknown history line: " + line)
		}
	}


	return attrs
}

function elementToText(el) {
	var children = el.childNodes
	if (ELEMENT_CHILDREN.has(el.tagName)) children = children.filter(isElement)

	return children.reduce(function(texts, child) {
		var needsNewline = BLOCK_ELEMENTS.has(child.tagName)

		if (child.tagName == "td") {
			if (lastMatches(/\S$/, texts)) texts.push(" ")
		}
		else if (needsNewline&& !lastMatches(/\n$/, texts)) texts.push("\n")

		var text = nodeToText(child)
		if (text) texts.push(text)
		if (text && needsNewline && !/\n$/.test(text)) texts.push("\n")
		return texts
	}, []).join("")
}

function nodeToText(node) {
	if (node.nodeName == "#text") return node.value

	if (node.tagName != null) switch (node.tagName) {
		case "script": return null
		case "style": return null
		default: return elementToText(node)
	}

	throw new Error("Unknown node: " + node.nodeName)
}

function lastMatches(regexp, texts) {
	return texts.length > 0 && regexp.test(_.last(texts))
}

function shiftLine(prefix, lines) {
	if (lines.length == 0 || !prefix.test(lines[0])) return null
	return lines.shift().replace(prefix, "")
}

function isElement(node) { return node.tagName != null }
