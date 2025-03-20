const express = require("express")
const router = express.Router()
const Address = require("../models/address.schema")
const Cart = require("../models/cart.schema")

const loadCheckout = async (req,res)=>{
    const userId = req.session.userId
    console.log(userId)
    const address =await Address.find({userId})
    const cart = await Cart.findOne({userId}).populate('items.productId','productTitle productImage status isBlocked regularPrice')
    // console.log(address)
    if(!cart){
      // return res.status(400).json({message:"cart is empty",redirect:"/cart"})
      return res.redirect('/cart')
   }
    const totalRegularprice = cart.items.reduce((acc,curr)=>{
      

       acc += parseInt(curr.productId.regularPrice * curr.quantity)
       return acc
    },0)
    console.log("Total price"+totalRegularprice)
    if(!address){
       return res.status(400).json({message:"user not found"})
    }
    
   //  console.log(cart.items)
   return res.render("checkout",{address,cart,totalRegularprice})

}





module.exports={
    loadCheckout
}