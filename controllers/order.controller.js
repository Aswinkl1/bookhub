const Order = require("../models/order.schema");
const Cart = require("../models/cart.schema");
const Product = require("../models/product.schema");
const { verifyEmailForForgetPassword } = require("./user.controler");

const addOrder = async (req, res) => {
    try {
        console.log("hei heiuj")
        const userId = req.session.userId
        const addressId = req.body.addressId
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
        console.log(cart.items[0].price)
        // Create new order
        const newOrder = new Order({

            userId,
            items: orderItems,
            totalPrice:cart.totalPrice,
            addressId:addressId

        });

        await newOrder.save();

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
        const orderData = await Order.find({userId})
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
        const { reason } = req.body;  // Optional reason

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
        order.items.forEach(item => item.status = "Cancelled");
        order.cancelRequest = reason || null;
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
                await Product.findByIdAndUpdate(item.productId._id, { $inc: { stock: item.quantity } });
                item.status = "Returned";
                item.returnRequest = reason;
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
        
        await  order.save()
        res.status(200).json({message:"product returned successfully"})

    } catch (error) {
        console.log(error)
        res.status(400).json({error:"internal server error"})
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
        let limit = 4
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
    
        const order  =await Order.aggregate([
            statusQuery,
            {
                $lookup:{
                    from:"users",
                    localField:"userId",
                    foreignField:"_id",
                    as:"user"
                }
            },
            {$unwind:"$user"},
            searchQuery,
            {
                $project:{
                    _id:1,
                    status:1,
                    orderdate:1,
                    orderId:1,
                    totalPrice:1,
                    "user.name":1,
                    "user.email":1
                }
            }
    
            
    
        ]).skip(skip).limit(limit).sort({status:"Return-pending"})
    
        return res.status(200).json({data:order})
    } catch (error) {
        console.log(error)
        return res.status(400).json({error:"internal server error"})
    }




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




 };

