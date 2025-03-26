const express = require('express')
const router = express.Router()
const {userAuth }= require('../middleware/auth')
const controller = require('../controllers/user.controler');
const passport = require('passport');
const address = require("../controllers/address.controller")
const cart = require("../controllers/cart.controller")
const coupon = require("../controllers/coupon.controller")
const checkout = require("../controllers/checkout.controller")
const order = require("../controllers/order.controller")
const product = require('../controllers/product.controller')



router.get('/',controller.HomePageLoad);

router.get('/pageNotFound',controller.pageNotFound);

router.get('/signup',controller.loadSignUp);
router.post('/signup',controller.postSignUp)

router.get('/login',controller.loadLoginPage);

router.post('/verify-otp',controller.verifyOtp)

router.post('/resend-otp',controller.resendOtp)
// forget Pasword
router.get("/forgetPassword",controller.getForgetPassword)
router.patch("/verify-email-for-forgetPassword",controller.verifyEmailForForgetPassword)
router.patch("/forgetPassword-verfy-otp",controller.verifyOtpForForgetPassword)
router.patch("/forgetPassword-passwordChange",controller.changePasswordForForgetPassword)

router.get('/auth/google',passport.authenticate('google',{scope:['profile','email']}))

router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/signup'}),(req,res)=>{
    // req.session.user
    res.redirect('/')
})



router.post('/login',controller.postLoginPage)

router.get('/logout',userAuth,controller.logout)

router.get('/account',userAuth,controller.getAccount)

// api for progile
router.put("/api/editprofile",userAuth,controller.editProfile);
router.put("/api/editEmail",userAuth,controller.editEmail);
router.patch("/api/verifyOtpForEmail",userAuth,controller.verifyOtpForEditEmail)

// address
router.get("/account/addresses",userAuth,address.getShowAddresses); // just rendering the address page
router.get('/api/addresses',userAuth,address.loadShowAddress) // loading the address data
router.get("/account/addAddress",userAuth,address.getAddAddresses);
router.post("/account/addAddress",userAuth,address.postAddAddress);
router.get("/account/editAddress",userAuth,address.getEditAddress)
router.put("/account/editAddress",userAuth,address.postEditAddress)
router.delete('/account/deleteAddress',userAuth,address.deleteAddress)

// Cart 
router.post("/cart/addToCart",userAuth,cart.addTocart)
router.get('/cart',userAuth,cart.loadcartPage)
router.patch("/cart/updatecart",userAuth,cart.addTocart)
router.delete("/cart/removeCart",userAuth,cart.removeFromCart)

// coupon
router.post("/addCoupons",coupon.addCoupons)

// Checkout
router.get("/checkout",userAuth,checkout.loadCheckout)

// order
router.post('/placeOrder',userAuth,order.addOrder)
router.get('/order',userAuth,order.getUserOrders)
router.get('/order/:id',userAuth,order.getOrderById)
router.put('/cancelOrder/:orderId',userAuth,order.cancelOrder)
router.put('/cancelProduct/:orderId/:productId',userAuth,order.cancelSingleProduct)
router.put('/returnOrder/:orderId',userAuth,order.returnOrder)
router.put('/order/return/:productId/:orderId',order.productReturn)


//product -shop
router.get('/shop',product.renderShopPage)
router.get('/api/shop',product.fetchAvailableProducts )
router.get('/product/:id',product.getProductForUser)





module.exports = router;
