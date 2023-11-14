var _ = require("./underscore")
var ESTONIAN_PERSONAL_ID_FORMAT = /^[123456]\d\d\d\d\d\d\d\d\d\d$/

exports.parse = function(el) {
	return {
		registryCode: el.ariregistri_kood.$,
		name: el.nimi.$,
		foundedOn: parseRegisterDate(el.yldandmed.esmaregistreerimise_kpv.$),

		// Only physical people (tyyp == F).
		boardMembers: _.concat(el.isikuandmed.kaardile_kantud_isikud.item || [])
			.map((e) => e.isiku_tyyp.$ == "F" && parsePerson(e))
			.filter(Boolean)
	}
}

function parsePerson(el) {
	if (!(
		el.isikukood_registrikood &&
		ESTONIAN_PERSONAL_ID_FORMAT.test(el.isikukood_registrikood.$)
	)) return null

	// Presuming that if the term ending date is present, it's always in the past
	// and therefore the person is no longer associated with the organization.
	// Saves the UI from having to track dates.
	if (el.lopp_kpv) return null

	return {
		name: el.eesnimi.$ + " " + el.nimi_arinimi.$,
		personalId: el.isikukood_registrikood.$,
		role: el.isiku_roll.$,
	}
}

function parseRegisterDate(date) {
	// For some reason dates in the register XML have a "Z" suffix. That doesn't
	// make sense as time zoned dates seldom make sense and especially not in UTC
	// for dates pertaining to Estonian organizations.
	return _.parseIsoDate(date.replace(/Z$/, ""))
}
