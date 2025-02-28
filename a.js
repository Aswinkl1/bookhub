const nodemailer = require('nodemailer')
const env = require('dotenv').config()
async function sendVerificationEmail(email,otp) {
    try {
        const transporter = nodemailer.createTransport({
            service:'gmail',
            port:587,
            secure:false,
            requireTLS:true,
            auth:{
                user:process.env.NODEMAIL_EMAIL,
                pass:process.env.NODEMAIL_PASSWORD
            }
        })

        const info = await transporter.sendMail({
            from:process.env.NODEMAIL_EMAIL,
            to:email,
            subject:`Your OTP is ${otp}`,
            html:`<br>Your OTP : ${otp}</br>`
        })

        return info.accepted.length > 0
    } catch (error) {
        console.error("Error sednign email",error)
        return false
        
    }

}


const bb = async () => {
    const bb = await sendVerificationEmail("nuzhumaki9@gmail.com", 12345);
    return bb;
};
// console.log(process.env.NODEMAIL_EMAIL)
console.log(bb);
