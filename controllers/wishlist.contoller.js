const mongoose = require('mongoose')
const Wishlist  = require('../models/wishlist.schema')



const getWishlistRender = async (req,res)=>{
    try {
        res.render('wishlist')
    } catch (error) {
        console.log(error)
    }
}


const loadWishlistDetails = async (req,res)=>{
    try {
        const {userId} = req.session
        console.log(userId)
        const wishlist = await Wishlist.findOne({userId}).populate('items')
        if(!wishlist){
            return res.status(400).json({eroor:"wishlist is empty"})
        }

        res.status(200).json({wishlist:wishlist.items})
    } catch (error) {
        console.log(error)
    }
}

const addToWishlist = async (req,res)=>{
    try {
        const userId = req.session.userId
        const {productId} = req.body
        console.log("eethi tto")
        console.log(userId)
        console.log(productId)
        let wishlist = await Wishlist.findOne({userId})
        console.log(wishlist)
        
        if(!wishlist){
            wishlist = new Wishlist({
                userId:userId,
                items:[]
            })
        }

        console.log(wishlist)
        if(!wishlist.items.includes(productId)){
            wishlist.items.push(productId)
        }

        await wishlist.save()
        res.status(200).json({message:"item added successfully"})
    } catch (error) {
        console.log(error)
    }
}

const removeFromWishlist = async (req,res)=>{
    try {
        
        const {userId} =req.session
        const {productId} = req.params
        
        const wishlist = await Wishlist.findOneAndUpdate(
            {userId},
            { $pull:{ items: productId} },
            {new:true}
        )
        console.log(wishlist)
    
        if(!wishlist){
            return res.status(400).json({error:"wishlist not found"})
        }

        res.status(200).json({message:"removed successgully",wishlist:wishlist.items})
    } catch (error) {
        console.log(error)
        res.status(500).json({error:"internal server error"})
    }



}


module.exports = {
    addToWishlist,
    getWishlistRender,
    loadWishlistDetails,
    removeFromWishlist

}