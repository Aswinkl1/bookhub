const express = require("express")
const router = express.Router()
const Address = require("../models/address.schema")
const Cart = require("../models/cart.schema")
const Coupon = require("../models/coupon.schema")
const Category = require("../models/category.schema")




const loadCheckout = async (req,res)=>{
    const userId = req.session.userId
    console.log(userId)
    const address =await Address.find({userId})
    const cart = await Cart.findOne({userId}).populate('items.productId','productTitle productImage status isBlocked regularPrice quantity category')
    
    if(!cart){
      return res.redirect('/cart')
      }
      const listedCategories = await Category.find({ isListed: true }).select('_id');
      const listedCategoryIds = listedCategories.map(cat => cat._id.toString());
      console.log(listedCategoryIds)

      const invalidItem = cart.items.find(item => {
         const product = item.productId;
         
         const isCategoryBlocked = listedCategoryIds.includes(product.category.toString())
  
         return (
           !product ||                              
           product.isBlocked ||                    
           item.quantity > product.quantity ||     
           product.status != "Available" ||
           !isCategoryBlocked
                            
         );

         
       });

       console.log(invalidItem)
       if (invalidItem) {
         console.log('Invalid item detected:', invalidItem.productId?.productTitle);
         // Optionally, use req.flash('error', 'Some products are unavailable');
         return res.redirect('/cart');
       }
      const availableCoupon = await Coupon.find({minCartAmount:{$lte:cart.totalPrice},expiryDate:{$gte: new Date()},status:"1",isDeleted:false})
      const totalRegularprice = cart.items.reduce((acc,curr)=>{
      
       acc += parseInt(curr.productId.regularPrice * curr.quantity)
       return acc
    },0)
    console.log("Total price"+totalRegularprice)
    if(!address){
       return res.status(400).json({message:"user not found"})
    }
    
   //  console.log(cart.items)
   return res.render("checkout",{address,cart,totalRegularprice,availableCoupon})

}








module.exports={
    loadCheckout
}