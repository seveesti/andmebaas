var Fs = require("fs")
var concatStream = require("concat-stream")

exports.read = function(path, encoding) {
	var stream = path == "-" ? process.stdin : Fs.createReadStream(path)
	if (encoding) stream.setEncoding(encoding)
	return stream
}

exports.slurp = function(stream, encoding) {
	return new Promise(function(resolve, reject) {
		if (encoding) stream.setEncoding(encoding)
		stream.pipe(concatStream(resolve))
		stream.on("error", reject)
	})
}
