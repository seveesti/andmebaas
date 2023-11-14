var Emta = require("root/lib/emta")
var Stream = require("root/lib/stream")
var outdent = require("root/lib/outdent")

describe("Emta", function() {
	describe(".parse", function() {
		it("must parse line from 2021Q1 CSV as String", async function() {
			var sv = outdent`
				Registrikood;Nimi;Liik;Registreeritud käibemaksukohustuslaste registrisse;EMTAK tegevusvaldkond, mis on EMTAKi struktuuris tähistatud tähtkoodiga;Maakond;Riiklikud Maksud;Tööjõumaksud Ja Maksed;Kaive;Tootajaid
				10000024;EESTI RAAMAT, OÜ;Äriühing;jah;INFO JA SIDE;Harju ( Tallinn );22 353,85;18 034,91;140 346,67;11
			`

			await Stream.slurp(Emta.parse(2021, 2, sv)).must.then.eql([{
				registry_code: "10000024",
				year: 2021,
				quarter: 2,
				emtak: "J",
				revenue: 140346.67,
				taxes: 22353.85,
				employee_count: 11,
				employment_taxes: 18034.91
			}])
		})

		it("must parse line from 2021Q1 CSV as latin1", async function() {
			var sv = Buffer.from(outdent`
				Registrikood;Nimi;Liik;Registreeritud käibemaksukohustuslaste registrisse;EMTAK tegevusvaldkond, mis on EMTAKi struktuuris tähistatud tähtkoodiga;Maakond;Riiklikud Maksud;Tööjõumaksud Ja Maksed;Kaive;Tootajaid
				10000024;EESTI RAAMAT, OÜ;Äriühing;jah;INFO JA SIDE;Harju ( Tallinn );22 353,85;18 034,91;140 346,67;11
			`, "latin1")

			await Stream.slurp(Emta.parse(2021, 2, sv)).must.then.eql([{
				registry_code: "10000024",
				year: 2021,
				quarter: 2,
				emtak: "J",
				revenue: 140346.67,
				taxes: 22353.85,
				employee_count: 11,
				employment_taxes: 18034.91
			}])
		})

		it("must parse line from 2021Q2 CSV as latin1", async function() {
			var sv = Buffer.from(outdent`
				Registrikood;Nimi;Liik;Registreeritud käibemaksukohustuslaste registrisse;EMTAK tegevusvaldkond, mis on EMTAKi struktuuris tähistatud tähtkoodiga;Maakond;Riiklikud Maksud;Tööjõumaksud Ja Maksed;Kaive;Tootajaid
				10000018;AMSERV AUTO AKTSIASELTS;Äriühing;jah;"HULGI- JA JAEKAUBANDUS; MOOTORSÕIDUKITE JA MOOTORRATASTE REMONT";Harju ( Tallinn );1134805,23;736604,35;19142710,36;200
			`, "latin1")

			await Stream.slurp(Emta.parse(2021, 2, sv)).must.then.eql([{
				registry_code: "10000018",
				year: 2021,
				quarter: 2,
				emtak: "G",
				revenue: 19142710.36,
				taxes: 1134805.23,
				employee_count: 200,
				employment_taxes: 736604.35
			}])
		})

		it("must parse line from 2023Q3 CSV with UTF-8 with BOM", async function() {
			var sv = Buffer.from(outdent`
				\uFEFFRegistrikood;Nimi;Liik;Registreeritud käibemaksukohustuslaste registrisse;EMTAK tegevusvaldkond, mis on EMTAKi struktuuris tähistatud tähtkoodiga;Maakond;Riiklikud Maksud;Tööjõumaksud Ja Maksed;Kaive;Tootajaid
				10000018;AMSERV AUTO AKTSIASELTS;Äriühing;jah;"HULGI- JA JAEKAUBANDUS; MOOTORSÕIDUKITE JA MOOTORRATASTE REMONT";Harju ( Tallinn );1711113,62;1102150,32;30819500,53;224
			`, "utf8")

			await Stream.slurp(Emta.parse(2023, 3, sv)).must.then.eql([{
				registry_code: "10000018",
				year: 2023,
				quarter: 3,
				emtak: "G",
				revenue: 30819500.53,
				taxes: 1711113.62,
				employee_count: 224,
				employment_taxes: 1102150.32
			}])
		})
	})
})
