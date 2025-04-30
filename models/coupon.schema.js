const mongoose = require("mongoose");

const {Schema} = mongoose;

const couponSchema = new Schema({
    name:{
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
     },
     status:{
      type:String,
      required:true,
      
     },
     isDeleted:{
      type:Boolean,
      default:false
     }

},{timestamps:true});

const coupon = mongoose.model("coupon",couponSchema);
module.exports = coupon;
