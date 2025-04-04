const mongoose = require('mongoose');

const { Schema } = mongoose;



const wishlistSchema = new mongoose.Schema({
    userId:{type:Schema.Types.ObjectId ,ref:"users",required:true , unique:true},
    items:[{type:Schema.Types.ObjectId , ref:"Product"}]
    
})

const wishlist = mongoose.model('wishlist',wishlistSchema)


module.exports = wishlist