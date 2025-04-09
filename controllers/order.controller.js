const Order = require("../models/order.schema");
const Cart = require("../models/cart.schema");
const Product = require("../models/product.schema");
const { verifyEmailForForgetPassword } = require("./user.controler");
const Wallet = require("../models/wallet.schema");
const Transaction = require('../models/transaction.schema')
const Razorpay = require("razorpay")
const Coupon = require("../models/coupon.schema")
const User = require("../models/user.schema")

const razorpayInstance = new Razorpay({
    key_id:process.env.key_id,
    key_secret:process.env.key_secret
})


const payWithRazorpay = async (req,res)=>{
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

const validateCoupon = async (req,res)=>{
    const {couponCode,cartTotal} = req.query
    const {userId} = req.session

    const coupon = await Coupon.findOne({code:couponCode,status:"1"})
    console.log(coupon)
    if(!coupon){
        return res.status(400).json({error:"invalid Coupon code"})
    }

    if(coupon.expiryDate <= new Date()){
        return res.status(400).json({error:"coupon expired"})
    }

    if(!(coupon.minCartAmount <= +cartTotal)){
        return res.status(400).json({error:`You need to add items worth ${coupon.minCartAmount} to use this coupon.`})
    }
    
    const user = await User.findById(userId)
    if(user.usedCoupons.includes(coupon._id)){
        return res.status(400).json({error:`You have already used this coupon.`})
    }

    let discountAmount = (coupon.discountPercentage * cartTotal) / 100
    if(!discountAmount <= coupon.maxDiscountAmount){

        discountAmount = coupon.maxDiscountAmount

    }

    console.log(discountAmount)
    const newCartTotal = cartTotal - discountAmount
    console.log(newCartTotal)
    res.status(200).json({message:"",cartTotal:newCartTotal,discountAmount,coupon})

}


const addOrder = async (req, res) => {
    try {
        const userId = req.session.userId
        const addressId = req.body.addressId
        const {paymentMethod,cartTotal,couponId,totalDiscount} = req.body
        console.log('totsl discoeunt'+totalDiscount)
        const cart = await Cart.findOne({ userId }).populate("items.productId");

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: "Your cart is empty." });
        }


        // Calculate total price
        const orderItems = cart.items.map(item => {
            return {
                productId: item.productId._id,
                quantity: item.quantity,
                price: item.price
            };
        });

        // Create new order
        const newOrder = new Order({

            userId,
            items: orderItems,
            totalPrice:cartTotal, // amount the customer paid 
            addressId:addressId,
            paymentMethod:paymentMethod,
            discountAmount:totalDiscount

        });

        await newOrder.save();
        if(couponId){

            const user = await User.findOne({_id:userId})
            user.usedCoupons.push(couponId)
            user.save()
        }

        // Reduce stock for each product
        for (const item of cart.items) {
            await Product.findByIdAndUpdate(
                item.productId._id,
                { $inc: { stock: -item.quantity } }
            );
        }

        // Clear user's cart after successful order placement
        await Cart.findOneAndDelete({ userId });

        res.status(201).json({ message: "Order placed successfully", order: newOrder });
    } catch (error) {
        console.error("Error placing order:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


const getUserOrders = async (req,res) =>{
    try {
        const userId = req.session.userId
        const orderData = await Order.find({userId}).sort({orderDate:-1})
        console.log(orderData)
        res.render('order',{orderData:orderData})
        
    } catch (error) {
        
    }
}


const getOrderById = async (req,res)=>{

    try {
        console.log("dj")
        const  id  = req.params.id;
        // console.log(orderId)
        const order = await Order.findById(id)
            .populate("items.productId")
            .populate("addressId");
        // console.log(order)
        debugger;
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.render('order-details',{order})
    } catch (error) {
        console.error("Error fetching order:", error);
        res.status(500).json({ message: "Internal server error" });
    }

    
}


const cancelOrder = async (req,res)=>{
    try {
        const { orderId } = req.params;
        const { reason } = req.body;  
        const {userId} = req.session

        const order = await Order.findOne({ orderId }).populate('items.productId');

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        
        if (order.status === "Cancelled") {
            return res.status(400).json({ message: "Order is already cancelled" });
        }

        // Restore stock for all items
        for (let item of order.items) {
            
            await Product.findByIdAndUpdate(item.productId._id, { 
                $inc: { stock: item.quantity } 
            });
        }

        // Update order status
        order.status = "Cancelled";
        let refundedAmount = 0
        order.items.forEach(item =>{

            if((item.status == "Cancelled" || item.status == "Returned") && order.paymentMethod != "COD"){
                refundedAmount += item.quantity * item.price
            }
             item.status = "Cancelled"
            });
        order.cancelRequest = reason || null;
        if(order.paymentMethod != "COD"){
            // return the money to the wallet
            _returnMoneyToWallet(userId,orderId,order.totalPrice - refundedAmount)
        }

        await order.save();

        res.json({ message: "Order cancelled successfully", order });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Server error", error });
    }
}

const cancelSingleProduct = async (req,res)=>{

        try {
            const { orderId, productId } = req.params;
            const { reason } = req.body;
            const {userId} = req.session
            console.log("hi")
    
            const order = await Order.findOne({ orderId });
            if (!order) return res.status(404).json({ message: "Order not found" });
    
            const item = order.items.find(item => item.productId.toString() === productId);
            if (!item) return res.status(404).json({ message: "Product not found in order" });
    
            if (item.status === "Cancelled") {
                return res.status(400).json({ message: "Product already cancelled" });
            }
    
            // Restore stock
            await Product.findByIdAndUpdate(productId, { $inc: { stock: item.quantity } });
    
            // Update product status
            item.status = "Cancelled";
            item.cancelRequest = reason || null;
            
            if(order.paymentMethod != "COD"){
                _returnMoneyToWallet(userId,orderId,item.price * item.quantity)
            }
            console.log(item.price * item.quantity)
            // If all items are cancelled, update order status
            if (order.items.every(item => item.status === "Cancelled")) {
                order.status = "Cancelled";
            }
    
            await order.save();
    
            res.json({ message: "Product cancelled successfully", order });
        } catch (error) {
            res.status(500).json({ message: "Server error", error });
        }

    
}

const returnOrder = async (req,res)=>{

        try {

            const { orderId } = req.params;
            const { reason } = req.body;  // Mandatory reason
            
            if (!reason) return res.status(400).json({ message: "Return reason is required" });
            
            const order = await Order.findOne({ orderId }).populate('items.productId');
            if (!order) return res.status(404).json({ message: "Order not found" });
            
            if (order.status !== "Delivered") {
                return res.status(400).json({ message: "Only delivered orders can be returned" });
            }
            
            // Restore stock for all items
            for (let item of order.items) {
                // await Product.findByIdAndUpdate(item.productId._id, { $inc: { stock: item.quantity } });
                if(item.status != "Cancelled" && item.status != "Returned"){
                    item.status = "Return-pending";
                    item.returnRequest = reason;
                }

            }
            
            order.status = "Return-pending";
            await order.save();
            
            res.json({ message: "Order returned successfully", order });
        } catch (error) {
            console.log(error)
            res.status(500).json({ message: "Server error", error });
        }
        
}

const productReturn = async (req,res)=>{
    
    try {
        const {productId,orderId} = req.params
        const {reason} = req.body
        const {userId} = req.session
        if(!productId || !orderId){
            return res.status(400).json({error:"invalid id"})
        }

        const order = await Order.findOne({orderId:orderId})
        if(!order){
            return res.status(400).json({error:"order not found"})
        }
        console.log(order)

        const item = order.items.find(item => item.productId.toString() == productId)
        if(!item){
            return res.status(400).json({error:"product not found"})
        }
        if(item.status == "Cancelled" || item.status == "Return-pending" || item.status == "Returned"){
            return res.status(400).json({error:"product is already retured or cancelled"})
        }

        item.status = "Return-pending"
        item.returnRequest = reason || null
        if (order.items.every(item => item.status === "Return-pending")) {
            order.status = "Return-pending";
        }
        await  order.save()
        res.status(200).json({message:"product returned successfully"})

    } catch (error) {
        console.log(error)
        res.status(400).json({error:"internal server error"})
    }

}

const _returnMoneyToWallet = async (userId,orderId,amount)=>{
    try{
        let wallet = await Wallet.findOne({userId})

        if(!wallet){
            wallet = new Wallet({userId})
        }

        wallet.balance += amount
        await wallet.save()

        const transaction = new Transaction({
            userId,
            orderId,
            amount,
            status:"Complete",
            type:"Credit"

        })
        await transaction.save()
        return true


    } catch (error) {
        console.log(error)
        return false
    }
}



// order management for admin 
const renderOrderList  = async (req,res)=>{
    try {
        return res.render("order-list")
    } catch (error) {
        console.log(error)
    }
}

const getOrderData = async (req,res)=>{

    
    try {
        let {search,status,page=1,} = req.query
        // status= "Pending"
        // search = "sanjay"
        let limit = 10
        const skip = (page -1) * limit
        let searchQuery = {$match:{}}
    
        if(search){
            searchQuery = {
                $match:{
                     $or:[
                         {'user.name':{$regex:search,$options:'i'}},
                         {'user.email':{$regex:search,$options:'i'}},
                         
                        ]
                } 
            }
        }
    
        let statusQuery = {$match:{}}
        
        if(status){
            
            statusQuery = {
                $match:{'status':status}
                
            }
        }
    
        const order = await Order.aggregate([
            statusQuery,
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: "$user" },
            searchQuery,
            {
                $addFields: {
                    returnPendingPriority: {
                        $cond: [{ $eq: ["$status", "Return-pending"] }, 0, 1]
                    }
                }
            },
            {
                $sort: {
                    returnPendingPriority: 1,       // Put "Return-pending" first
                    orderDate: -1                   // Then sort by newest
                }
            },
            {
                $project: {
                    _id: 1,
                    status: 1,
                    orderdate: 1,
                    orderId: 1,
                    totalPrice: 1,
                    "user.name": 1,
                    "user.email": 1
                }
            },
            { $skip: skip },
            { $limit: limit }
        ])
        
    
        return res.status(200).json({data:order})
    } catch (error) {
        console.log(error)
        return res.status(400).json({error:"internal server error"})
    }




}

const getOrderDetail = async (req,res)=>{
    try {
        const orderId = req.params.id
        const order = await Order.findById(orderId).populate('userId addressId items.productId')
        console.log(order)
        res.render('admin-order-details',{order:order})
    } catch (error) {
        console.log(error)
        return res.status(400).json({message:"Internal server error "})
        
    }
}

const changeStatusForProduct = async (req,res)=>{
    try {
        
        console.log("inside change status of produt")
        const {productId,orderId} = req.params
        let {newStatus,userId} = req.body
        console.log(userId.length)
        const order = await Order.findById(orderId)

        if(!order){
            return res.status(400).json({error:"order not found"})
        }

        // console.log(order)
        let quantity = 0
        let amount = 0
        order.items.forEach((value) =>{
            if(value.productId.toString() == productId){
                value.status = newStatus
                quantity = value.quantity
                amount = value.price
            }
        })

        const statusArray = ["Cancelled","Returned"]
    
        if(statusArray.includes(newStatus)){
            // Reduce stock for each product
            for (const item of order.items) {
                if(item.productId.toString() == productId){
                    await Product.findByIdAndUpdate(
                        item.productId,
                        { $inc: { stock: item.quantity } }
                    );
                }
            }
    
            if(order.paymentMethod != "COD" ||newStatus == "Returned"){
                // return the money to the wallet
                _returnMoneyToWallet(userId,orderId,quantity * amount)
            } 
    
        }

        await order.save()
        res.status(200).json({message:"product status change successfull"})
    } catch (error) {
        console.log(error)
        
    }




}

const changeOrderStatus = async (req,res)=>{
    const {orderId} = req.params
    const {newStatus,userId}  =req.body

    const order = await Order.findById(orderId)
    if(!order){
        return res.status(400).json({error:"order not found"})
    }

    order.status = newStatus

    // order.items.forEach(item =>{
        
    //     item.status = newStatus
    // })
    let refundedAmount =0
    if(newStatus == "Returned" || newStatus == "Cancelled"){
        // for return money to the wallet 
        for(const item of order.items){
            await Product.findOneAndUpdate(item.productId,{
                $inc: { stock: item.quantity }
            })
            if(item.status == "Returned" || item.status == "Cancelled"){
                refundedAmount += item.quantity * item.price
            }
            item.status = newStatus;
            

        }
        console.log(refundedAmount)
        // return money here
        _returnMoneyToWallet(userId,orderId,order.totalPrice - refundedAmount)
    }

    await order.save()
    res.status(200).json({message:"change status successfully"})


}


const register = async (req,res)=>{
    const {email,name} = req.body

    const user = await User.findOne({email})

    if(user){
       return res.status(400).json({message:"user already exist"})
    }

    user = new User({email,name})
    await user.save()
    
}
module.exports = { 
    addOrder,
    getUserOrders,
    getOrderById,
    cancelOrder,
    cancelSingleProduct,
    returnOrder,
    productReturn,
    renderOrderList,
    getOrderData,
    getOrderDetail,
    changeStatusForProduct,
    changeOrderStatus,
    payWithRazorpay,
    validateCoupon

 };

