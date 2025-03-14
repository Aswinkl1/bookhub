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
    gender:{
        type:String,
    },
    profilePicture:{
        type:String,
        required:false
    },
    dateOfBirth:{
        type:Date,
        required:false
    },
    phone:{
        type:String,
        required:false,
        sparse:true,
        default:null
    },
    googleId:{
        type:String,
        default:null
    },
    password:{
        type:String,
        required:false
    },
    isBlocked:{
        type:Boolean,
        default:false
    },
    isAdmin:{
        type:Boolean,
        default:false
    },
    addresses: [{
         type: Schema.Types.ObjectId,
          ref: "Address"
    }],
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

module.exports = User