const mongoose = require('mongoose')
const {Schema} = mongoose


const categorySchema = new Schema({
    name:{
        type:String,
        required:true,
        unique:true
    },
    description:{
        type:String,
        required:true
    },
    isListed:{
        type:Boolean,
        default:true
    },
    categoryOffer:{
        discountPercentage:{
            type:Number,
            default:0
        },
        isActive:{
            type:Boolean,
            default:false
        },
    },
    createdAt:{
        type:Date,
        default:Date.now
    }
})

const category =  mongoose.model('Category',categorySchema)
module.exports = category