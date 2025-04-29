const Wallet = require("../models/wallet.schema")
const Transaction = require("../models/transaction.schema")
const Razorpay = require("razorpay")

const razorpayInstance = new Razorpay({
    key_id:process.env.key_id,
    key_secret:process.env.key_secret
})

const getWallet = async (req,res)=>{
    try {
        const userId = req.session.userId
        const wallet = await Wallet.findOne({userId})
        const transactions = await Transaction.find({userId}).sort({createdAt:-1}).limit(10)
        console.log(wallet)
        // console.log(transactions)
        
        res.render("wallet",{transactions,wallet})
    } catch (error) {
        console.log(error)
    }
}

const creataOrderUsingRazorpay = async (req,res)=>{
    const amount = parseInt(req.body.amount)
    const options = {
        amount: amount * 100,
        currency:"INR"
    }


    razorpayInstance.orders.create(options,function (err,order){
        if(err){
            console.log(err)
        }
        console.log(order)
        res.status(200).json({order})
    })
    
}

const addMoneyToWallet = async (req,res)=>{
    try {
        console.log("djj")
        let amount = parseInt(req.body.amount)
        console.log(amount)

        const userId = req.session.userId
        console.log(userId);
        
        let wallet = await Wallet.findOne({userId})
        let newWallet ;
            if(!wallet){
                wallet = new Wallet({userId})
            }
    
            wallet.balance += amount
             await wallet.save()
    
            const transaction = new Transaction({
                userId,
                
                amount,
                status:"Complete",
                type:"Credit"
    
            })
    
            await transaction.save()
            res.status(200).end()
    } catch (error) {
        console.log(error)
    }
}
module.exports = {
    getWallet,
    creataOrderUsingRazorpay,
    addMoneyToWallet
}