import ExpressErrors from "../utils/ExpressErrors.js";
import nodemailer from 'nodemailer'
import 'dotenv/config'

const sendForgotPasswordMail = (req,res,next,userEmail,token) =>{
    const transporter = nodemailer.createTransport({
        host:'smtp.gmail.com',
        port:587,
        secure:false,
        requireTLS:true,
        auth: {
          user: process.env.EMAIL,
          pass: process.env.PASSWORD
        }
      });
    
    const mailOptions = {
        from: process.env.EMAIL,
        to: userEmail,
        subject: 'Password Reset Request',
        html: `<p>You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n`
          + `Please click on the following link, or paste this into your browser to complete the process:\n\n`
          + `http://${req.headers.host}/reset/${token}\n\n`
          + `If you did not request this, please ignore this email and your password will remain unchanged.\n</p>`
      };
      
    try {
        transporter.sendMail(mailOptions,(err,info)=>{
            if(err){
              console.log(err)
                return next(new ExpressErrors(500,'Failed to send email.'))
            }
            req.flash('success','Email sent with password reset instructions.')
            return res.redirect('/forgot-password');
        })
    } catch (error) {
      return next(new ExpressErrors(500,'Internal Server Error in nodemailer'))
    }
  }


  export default sendForgotPasswordMail;