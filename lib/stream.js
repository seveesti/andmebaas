var Fs = require("fs")

exports.read = function(path, encoding) {
	var stream = path == "-" ? process.stdin : Fs.createReadStream(path)
	if (encoding) stream.setEncoding(encoding)
	return stream
}
