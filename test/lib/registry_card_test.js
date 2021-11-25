var {parseHtml} = require("root/lib/registry_card")
var outdent = require("root/lib/outdent")

describe("RegistryCard", function() {
	describe(".parseHtml", function() {
		it("must parse registry card HTML", function() {
			parseHtml(wrapBoilerplate(outdent`
				<div>Mittetulundusühingute ja sihtasutuste registri kehtivate andmete väljatrükk seisuga  08.11.2021 kell 13:09</div>

				<TABLE>
					<TR><TD colspan='2'>&nbsp;</TD></TR>

					<TR><TD colspan="2"><span>Mittetulundusühing Edumus (registrikood 80562143) kohta on avatud Tartu Maakohtu registriosakonna mittetulundusühingu registrikaart&nbsp;nr&nbsp;1:</span></TD></TR>

					<TR><TD colspan='2'>&nbsp;</TD></TR><TR><TD colspan="2"><span>Nimi ja aadress</span></TD></TR>

					<TR>
						<TD><span>1. kanne:</span></TD>
						<TD><span>Nimi on Mittetulundusühing Edumus</span></TD>
					</TR>

					<TR>
						<TD><span>1. kanne:</span></TD>
						<TD><span>Aadress on Harju maakond, Tallinn, Kristiine linnaosa, Rästa tn 7/5, 13425</span></TD>
					</TR>

					<TR><TD colspan='2'>&nbsp;</TD></TR><TR><TD colspan="2"><span>Esindusõigus</span></TD></TR>

					<TR>
						<TD><span>1. kanne:</span></TD>
						<TD><span>Juhatuse liige on Maria Rahamägi, isikukood 49209020217</span></TD>
					</TR>

					<TR>
						<TD><span></span></TD>
						<TD><span>* Mittetulundusühingut võib kõikide tehingute tegemisel esindada iga juhatuse liige.</span></TD>
					</TR>

					<TR><TD colspan='2'>&nbsp;</TD></TR><TR><TD colspan="2"><span>Õiguslik seisund</span></TD></TR>

					<TR>
						<TD><span>1. kanne:</span></TD>
						<TD><span>Õiguslik vorm on mittetulundusühing</span></TD>
					</TR>

					<TR>
						<TD><span>1. kanne:</span></TD>
						<TD><span>Mittetulundusühingu alaliik on tavaline mittetulundusühing</span></TD>
					</TR>

					<TR>
						<TD><span>3. kanne:</span></TD>
						<TD><span>Põhikiri on kinnitatud 18.11.2019</span></TD>
					</TR>

					<TR>
						<TD><span>1. kanne:</span></TD>
						<TD><span>Majandusaasta algab 01.08 ja lõppeb 31.07</span></TD>
					</TR>

					<TR><TD colspan='2'>&nbsp;</TD></TR><TR><TD colspan="2"><span>Kannete loetelu</span></TD></TR>

					<TR><TD colspan="2"><span>Tartu Maakohtu registriosakonnas tehtud kanded:</span></TD></TR>

					<TR>
						<TD><span>1. kanne:</span></TD>
						<TD><span>Kinnitatud 25.02.2019  (esmakanne)</span></TD>
					</TR>

					<TR>
						<TD><span>3. kanne:</span></TD>
						<TD><span>Kinnitatud 07.01.2020  (muutmiskanne)</span></TD>
					</TR>
				</TABLE>

				<div>Väljatrüki lõpp</div>
			`)).must.eql({
				registryCode: "80562143",
				issuedAt: new Date(2021, 10, 8, 13, 9),
				foundedOn: new Date(2019, 1, 25),
				name: "Mittetulundusühing Edumus",
				address: "Harju maakond, Tallinn, Kristiine linnaosa, Rästa tn 7/5, 13425",
				boardMembers: [{name: "Maria Rahamägi", personalId: "49209020217"}]
			})
	})
		})
})

function wrapBoilerplate(html) {
	return outdent`<div>
		<div class="card-body card-body-shrinking">
			<div>Registrikaart</div>

			<div>
				<div>
					<a
						href="#eng"
						data-href="/est/company/80562143/tab/registry_card?registry_card_lang=eng"
					>Inglise keeles</a>

					<a href="/est/company/80562143/registry_card_pdf?registry_card_lang=est">
						<img src="/static/icons/pdf.svg"> PDF
					</a>
				</div>

			</div>

			<style type="text/css" nonce="2dc48bbd">
				.registrikaart { font-family: "Liberation Sans"; }
			</style>

			<div class="registrikaart">
				${html}
			</div>
		</div>
	</div>`
}
