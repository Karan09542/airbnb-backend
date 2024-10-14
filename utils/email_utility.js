const nodemailer = require("nodemailer")
const htmlTempletes = require("../static/htmlTempletes.json")

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
    let html = htmlTempletes[options.html_file]
    html = html.replace("{{subject}}", options.subject).replace("{{message}}", options.message).replace("{{url}}", `${(process.env.FRONTEND_URL&& process.env.FRONTEND_URL + "/")||"http://localhost:5173/"}${options.path}?resetToken=` + options.token)

    const transporter = nodemailer.createTransport({

        // if Email Trap
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        // secure: false,

        // if Gmail configured already
        // service: "gmail",
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

module.exports.sendEmail = sendEmail;

const sendEmailToVerifyEmail = async function(user,res) {
    const [verifyEmailToken, otp] = await user.createVerifyEmailToken();
    await user.save({validateBeforeSave: false});

    const veryfyEmailOptions = {
        email:user.email,
        subject: "Verify Your Email",
        message: `Please click the button below to verify your email address.`,
        token: verifyEmailToken,
        html_file: "verifyEmail.html",
        path: "verify-email"
    }
    await sendEmail(veryfyEmailOptions)
    
    return res.status(201).json({
        status: "success",
        otp,
        message: "An email is sent in your Inbox Please verify Your email"
    })
}
module.exports.sendEmailToVerifyEmail = sendEmailToVerifyEmail;