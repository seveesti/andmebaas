var outdent = require("root/lib/outdent")

exports.wrapBoilerplate = function(html) {
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
