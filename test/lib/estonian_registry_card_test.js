var _ = require("root/lib/underscore")
var RegisterXml = require("root/lib/estonian_business_register_xml")
var RegistryCard = require("root/lib/estonian_registry_card")
var outdent = require("root/lib/outdent")
var parse = _.compose(RegistryCard.parse, _.property("item"), RegisterXml.parse)

describe("EstonianRegistryCard", function() {
	describe(".parse", function() {
		it("must parse registry card", function() {
			parse(wrapXml(outdent`
				<ariregistri_kood>80562143</ariregistri_kood>
				<nimi>Mittetulundus&#xFC;hing Edumus</nimi>

				<yldandmed>
					<esmaregistreerimise_kpv>2015-06-18Z</esmaregistreerimise_kpv>
				</yldandmed>

				<isikuandmed>
					<kaardile_kantud_isikud>
						<item>
							<isiku_tyyp>F</isiku_tyyp>
							<isiku_roll>JUHL</isiku_roll>
							<isikukood_registrikood>38706181337</isikukood_registrikood>
							<eesnimi>John</eesnimi>
							<nimi_arinimi>Smith</nimi_arinimi>
						</item>
					</kaardile_kantud_isikud>
				</isikuandmed>
			`)).must.eql({
				registryCode: "80562143",
				foundedOn: new Date(2015, 5, 18),
				name: "Mittetulundusühing Edumus",

				boardMembers: [{
					name: "John Smith",
					personalId: "38706181337",
					role: "JUHL"
				}]
			})
		})

		it("must parse registry card without board members", function() {
			parse(wrapXml(outdent`
				<ariregistri_kood>80562143</ariregistri_kood>
				<nimi>Mittetulundus&#xFC;hing Edumus</nimi>

				<yldandmed>
					<esmaregistreerimise_kpv>2015-06-18Z</esmaregistreerimise_kpv>
				</yldandmed>

				<isikuandmed><kaardile_kantud_isikud /></isikuandmed>
			`)).must.eql({
				registryCode: "80562143",
				foundedOn: new Date(2015, 5, 18),
				name: "Mittetulundusühing Edumus",
				boardMembers: []
			})
		})
	})
})

function wrapXml(xml) {
	return `<item xmlns="http://arireg.x-road.eu/producer/">${xml}</item>`
}
