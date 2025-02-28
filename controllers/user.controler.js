const User = require('../models/user.schema')
const nodemailer =require('nodemailer')
const env = require('dotenv').config()
const bcrypt = require('bcrypt')
const { json } = require('express')

const HomePageLoad = async (req,res)=>{
    try{
        const userId = req.session.userId
        // console.log(data)
        if(userId){
            const userData = await User.findOne({_id:userId});
            res.render('home',{user:userData});
        }else{
            res.render('home');
        }
    }catch (e){
        console.log("Home doesnt load ")
        
    }
}

const pageNotFound = async (req,res)=>{
    try {
        res.render('page-404')
    } catch (error) {
        console.log(error);
        res.redirect('/pageNotFound')
        
    }
}


const loadSignUp = async (req,res)=>{
    try {
        res.render('signup')
    } catch (error) {
        console.log("coudnt signup")
        res.status(500).send("server error")
    }
}

function generateOtp(){
    return Math.floor(100000 + Math.random() *900000).toString();
}

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
const postSignUp = async (req,res)=>{
   try {
    const {email,password,name} = req.body
    const findUser = await User.findOne({email})
    if(findUser){
        return res.render('signup',{message:"User with this email already exists"})
        
    }
    const otp = generateOtp()
    const emailSend = sendVerificationEmail(email,otp);
    if(!emailSend){
        return res.json("email-error")
    }
    
    console.log("Otp send",otp);
    req.session.userOtp = otp;
    req.session.userData = req.body;
    // store thimgs n session before rendering a resonce page
    res.render("verify-otp")

   } catch (error) {
    console.error("signup error",error)
    res.redirect('/pageNotFound')
   }
}



const securePassword = async (password)=>{
    try {
       return await bcrypt.hash(password,10)
    } catch (error) {
        console.log("hashed error",error)
    }
}

const verifyOtp = async (req,res)=>{
    try{
        console.log(req.session)
        const {otp} = req.body;
        console.log("user otp",otp)
        if(otp === req.session.userOtp){
            const user = req.session.userData
            const passwordHash = await securePassword(user.password)
            const saveUserData = new User({
                name:user.name,
                email:user.email,
                phone:user.phone,
                password:passwordHash
            })

            await saveUserData.save();
            req.session.user = saveUserData._id;
            res.json({success:true,redirectUrl:'/login'})

        }else{
            res.status(400).json({success:false,message:"Invalid OTP, Please try again"})
        }
    }catch (error){
        console.error("Error verifying OTP",error);
        res.status(500).json({
            success:false,
            message:"An error occured"
        })
    }
}

const resendOtp = async (req,res)=>{
    try {
        const {email} = req.session.userData
        if(!email){
            return res.status(400),json({success:false,message:"Email not found in session"})
        }
        const otp = generateOtp()
        req.session.userOtp = otp;
        const emailSend = await sendVerificationEmail(email,otp)
        if(emailSend){
            console.log("Resend otp ",otp)
            res.status(200).json({success:true,message:"OTP resend successfully"})
        }else{
            res.status(500).json({success:false,message:"Failed to resend OTP, Plase try again"})
        }
    } catch (error) {
        console.error("error resending OTP",error)
        res.status(500).json({success:false,message:"internal server error, Plase try again"})

    }
}


const loadLoginPage = async (req,res)=>{
    try {
        res.render('login')
    } catch (error) {
        
    }
}

const postLoginPage = async (req,res)=>{
    try {
        const {email,password} = req.body
        const findUser = await User.findOne({isAdmin:0,email:email})
        console.log(findUser)
        if(!findUser){
            return res.render("login",{message:"User not found"})
        }
        if(findUser.isBlocked){
            return res.render('login',{message:"User is blocked by admin"})
        }

        const passwordMatch = await bcrypt.compare(password,findUser.password)

        if(!passwordMatch){
            return res.render("login",{message:"Incorrect password"})
        }

        req.session.userId = findUser._id
        res.redirect('/')
        
    } catch (error) {
        console.error("login error",error)
        res.render("login",{message:"login failed. Please try again later"})
    }
}

const logout = async (req,res)=>{
    try {
        req.session.destroy((err)=>{
            if(err){
                console.error("logout error in session ",err)
               return res.redirect('/pageNotFound')
            }
            return res.redirect('/login')
        })
    } catch (error) {
        console.log("Error on logout",error)
        return res.redirect('/pageNotFound')
        
    }
}

module.exports = {
    HomePageLoad,
    pageNotFound,
    loadSignUp,
    loadLoginPage,
    postSignUp,
    verifyOtp,
    resendOtp,
    postLoginPage,
    logout,



}