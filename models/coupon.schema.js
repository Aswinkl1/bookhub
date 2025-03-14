const mongoose = require("mongoose");

const {Schema} = mongoose;

const couponSchema = new Schema({
    description:{
        type:String,
        required:true
    },
     code:{
        type:String,
        required:true,
        unique:true
     },
     discountPercentage:{
        type:Number,
        required:true
     },
     maxDiscountAmount:{
        type:Number,
        required:true
     },
     minCartAmount:{
        type:Number,
        required:true
     },
     expiryDate:{
        type:Date,
        required:true
     }

});

const coupon = mongoose.model("coupon",couponSchema);
module.exports = coupon;
