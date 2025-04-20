const mongooose = require("mongoose")
const {Schema} =mongooose

const transactionSchema = new Schema({
    userId: {
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    amount: {
        type:Number,
        required:true
    },
    type: {
        type:String,
        enum:["Credit","Debit"],
        required:true
    },
    status: {
        type:String,
        enum:["Pending","Complete"],
        default:"Pending"
    },
    orderId: {
        type:String,
    },
    createdAt: {
        type: Date, 
        default: Date.now
    }
})

const Transaction = mongooose.model("Transaction",transactionSchema)

module.exports = Transaction
