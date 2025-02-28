const express = require('express')
const router = express.Router()
const controller = require('../controllers/user.controler');
const passport = require('passport');


router.get('/',controller.HomePageLoad);

router.get('/pageNotFound',controller.pageNotFound);

router.get('/signup',controller.loadSignUp);
router.post('/signup',controller.postSignUp)

router.get('/login',controller.loadLoginPage);

router.post('/verify-otp',controller.verifyOtp)

router.post('/resend-otp',controller.resendOtp)

router.get('/auth/google',passport.authenticate('google',{scope:['profile','email']}))

router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/signup'}),(req,res)=>{
    // req.session.user
    res.redirect('/')
})

router.post('/login',controller.postLoginPage)

router.get('/logout',controller.logout)





module.exports = router;