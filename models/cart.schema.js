const mongoose = require("mongoose");
const { Schema } = mongoose;

const cartSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: [ 
        {
            productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
            quantity: { type: Number, required: true, min: 1 },
            price: { type: Number, required: true }, // Store price at the time of adding
            totalPrice:{type:Number,}
        }
    ],
    totalPrice: { type: Number, required: true, default: 0 },
}, { timestamps: true });

cartSchema.pre("save",function(next) {
    this.items.forEach(item => {
        item.totalPrice = item.quantity * item.price
    });

    this.totalPrice = this.items.reduce((sum,item)=> sum += item.totalPrice,0);
    next()
})
const Cart = mongoose.model("Cart", cartSchema);
module.exports = Cart;


