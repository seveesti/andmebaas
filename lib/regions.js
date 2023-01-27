var _ = require("./underscore")

var COUNTRIES = [
	"global",
	"estonia",
	"baltic",
	"nordic",
	"africa",
	"asia",
	"australia",
	"europe",
	"north_america",
	"south_america"
]

var COUNTIES = {
  "harju": "Harju",
  "hiiu": "Hiiu",
  "ida-viru": "Ida-Viru",
  "järva": "Järva",
  "jõgeva": "Jõgeva",
  "lääne": "Lääne",
  "lääne-viru": "Lääne-Viru",
  "pärnu": "Pärnu",
  "põlva": "Põlva",
  "rapla": "Rapla",
  "saare": "Saare",
  "tartu": "Tartu",
  "valga": "Valga",
  "viljandi": "Viljandi",
  "võru": "Võru"
}

exports = module.exports = new Set(_.concat(COUNTRIES, _.keys(COUNTIES)))
exports.COUNTRIES = COUNTRIES
exports.COUNTIES = COUNTIES
