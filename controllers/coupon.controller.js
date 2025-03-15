const Coupon = require("../models/coupon.schema")
const User = require("../models/user.schema")

// admin
const addCounpons = async (req,res)=>{

}


const loadCouponPage = async (req,res)=>{

    return res.render("coupons")
}


module.exports={
    loadCouponPage,
    addCounpons
}