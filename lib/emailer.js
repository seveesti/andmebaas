var _ = require("root/lib/underscore")
var Nodemailer = require("nodemailer/lib/mailer")
var SmtpTransport = require("nodemailer/lib/smtp-transport")
var SendmailTransport = require("nodemailer/lib/sendmail-transport")
var logger = require("root").logger

module.exports = function(opts, transport) {
  var defaults = {from: opts.from}

  var nodemailer = new Nodemailer(transport || (opts.host ? new SmtpTransport({
    host: opts.host,
    port: opts.port,
    auth: opts.user != null ? {user: opts.user, pass: opts.password} : null
  }) : new SendmailTransport({path: opts.path})), null, defaults)

	return sendEmail.bind(null, nodemailer)
}

function sendEmail(nodemailer, message) {
	var emails = _.concat(message.to).map((to) => to.address || to).join(", ")
	logger.info("Emailing %s: %j.", emails, message.subject)
  return nodemailer.sendMail(message)
}
