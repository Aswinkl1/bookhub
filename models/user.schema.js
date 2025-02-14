const mongoose = require('mongoose')
const {Schema} = mongoose

const userSchema = new Schema({

    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    phone:{
        type:String,
        required:false,
        sparse:true,
        default:null
    },
    googleId:{
        type:String,
        unique:true
    },
    password:{
        type:String,
        required:false
    },
    isBlocked:{
        type:Boolean,
        defualt:false
    },
    isAdmin:{
        type:Boolean,
        defualt:false
    },
    // cart:[{
    //     type:Schema.Types.ObjectId,
    //     ref:'Cart'
    // }],
    // wallet:[{
    //     type:Schema.Types.ObjectId,
    //     ref:"Wishlist"
    // }],
    // orderHistory:[{
    //     type:Schema.Types.ObjectId,
    //     ref:'Order'
    // }],
    // createdOn:{
    //     type:Date,
    //     defualt:Date.now
    // },
    // referalCode:{
    //     type:String
    // },
    // redeemed:{
    //     type:Boolean
    // },
    // redeemedUsers:[{
    //     type:Schema.Types.ObjectId,
    //     ref:'User'
    // }],
    // searchHistory:[{
    //     category:{
    //         type:Schema.Types.ObjectId,
    //         ref:'Category'
    //     },
    //     brand:{
    //         type:String
    //     },
    //     searchOn:{
    //         type:Date,
    //         defualt:Date.now
    //     }
    // }]

})


const User = mongoose.model('User',userSchema)

module.exports = {User}