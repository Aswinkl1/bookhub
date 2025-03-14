const express = require('express')
const router = express.Router()
const controller = require('../controllers/user.controler');
const passport = require('passport');
const address = require("../controllers/address.controller")
const cart = require("../controllers/cart.controller")


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

router.get('/account',controller.getAccount)

// api for progile
router.put("/api/editprofile",controller.editProfile);
router.put("/api/editEmail",controller.editEmail);
router.patch("/api/verifyOtpForEmail",controller.verifyOtpForEditEmail)

// address
router.get("/account/addresses",address.getShowAddresses);
router.get("/account/addAddress",address.getAddAddresses);
router.post("/account/addAddress",address.postAddAddress);


// Cart
router.post("/cart/addToCart",cart.addTocart)
router.get('/cart',cart.loadcartPage)
router.patch("/cart/updatecart",cart.addTocart)
router.delete("/cart/removeCart",cart.removeFromCart)

module.exports = router;
