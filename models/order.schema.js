const mongoose = require('mongoose');
const { Schema } = mongoose;
const { v4: uuidv4 } = require("uuid");

const orderSchema = new Schema({
    orderId: {
        type: String,
        unique: true,
        default: uuidv4
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    addressId: {
        type: Schema.Types.ObjectId,
        ref: 'Address',
        required: true
    }, 
    items: [
        {
            productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
            quantity: { type: Number, required: true }, 
            price: { type: Number, required: true }, 
            status: {
                type: String,
                enum: ["Pending", "Shipped", "Delivered", "Cancelled", "Returned","Return-pending"], 
                default: "Pending"
            },
            cancelRequest: { type: String, default: null },
            returnRequest: { type: String, default: null }
        }
    ],
    totalPrice: { type: Number, required: true },
    status: {
        type: String,
        enum: ["Pending", "Shipped", "Delivered", "Cancelled","Returned","Return-pending","Return-cancelled"], 
        default: "Pending"
    },
    orderDate: { type: Date, default: Date.now },
    paymentMethod: {
        type: String,
        enum: ["COD", "Razorpay", "Wallet"],
    },
    paymentStatus: {
        type: String,
        enum: ["Pending", "Paid", "Refunded"],
        default: "Pending"
    },
    discountAmount:{
        type:Number,
        default:0
    }
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;

