var _ = require("root/lib/underscore")
var Multer = require("multer")
var {MulterError} = Multer
var HttpError = require("standard-http-error")
var MEGABYTE = Math.pow(2, 20)
var LIMIT = process.env.ENV == "test" ? 128 : 50 * MEGABYTE
var multer = new Multer({limits: {fileSize: LIMIT, files: 1}})
var parseFiles = multer.any()
var EMPTY = Object.prototype

module.exports = function(req, res, next) {
	parseFiles(req, res, function(err) {
		if (err) {
			if (err instanceof MulterError && err.code == "LIMIT_FILE_SIZE")
				err = new HttpError(422, "File Too Large", {
					description: "Fail peab olema väiksem kui 50 MiB."
				})

			return void next(err)
		}

		req.files = req.files && _.indexBy(req.files, "fieldname") || EMPTY
		next()
	})
}
