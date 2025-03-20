const Order = require("../models/order.schema");
const Cart = require("../models/cart.schema");
const Product = require("../models/product.schema");

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
        res.render('order-details',{orderData:orderData})
        
    } catch (error) {
        
    }
}

module.exports = { 
    addOrder,
    getUserOrders,

 };
