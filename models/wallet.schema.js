const mongoose =require("mongoose")
const {Schema} = mongoose

const walletSchema  = new Schema({
    userId :{
        type:Schema.Types.ObjectId,
        ref:"User"
    },
    balance:{
        type:Number,
        default:0
    }
})

const wallet = mongoose.model("wallet",walletSchema)

module.exports = wallet