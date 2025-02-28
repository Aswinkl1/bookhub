const mongoose = require('mongoose')
const {Schema} = mongoose

const publisherSchema = new Schema({
    publisherName:{
        type:String,
        required:true
    },
    publisherImage:{
        type:[String],
        required:true
    },
    isBlocked:{
        type:Boolean,
        default:false
    },
    createdAt:{
        type:Date,
        defualt:Date.now
    }
})

const publisher = mongoose.model('Publisher',publisherSchema)

module.exports = publisher