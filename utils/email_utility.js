const nodemailer = require("nodemailer")
const fs = require("fs/promises")
const path = require("path")

const os = require("os")

let ipaddress;
const networkInterfaces = os.networkInterfaces()

for(let interfaceName in networkInterfaces){
    const interfaces = networkInterfaces[interfaceName]
    for(let interface of interfaces ){
        if(interface.family === "IPv4" && !interface.internal){
            ipaddress = interface.address
        }
    }
}

const sendEmail = async function(options) {
    let html = await fs.readFile(path.join(path.resolve("static"), "ram.html"), "utf8")
    html = html.replace("{{subject}}", options.subject).replace("{{message}}", options.message).replace("{{reset_url}}", `http://${ipaddress}:5173/reset-password?resetToken=` + options.resetToken)

    const transporter = nodemailer.createTransport({

        // if Email Trap
        // host: process.env.EMAIL_HOST,
        // port: process.env.EMAIL_PORT,
        // secure: false,

        // if Gmail configured already
        service: "gmail",
        logger: true,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD,
        }
    });
    // 2 Define Email Options
    const mailOptions = {
        // from: "हर हर महादेव",
        from: "Sitaram Gourishankar",
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: html
    };
    // 3 Actually send the email
    console.log("now sending ...")
    await transporter.sendMail(mailOptions)
    console.log("sent")
}

module.exports = sendEmail;