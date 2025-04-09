const User = require('../models/user.schema')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const Address = require("../models/address.schema");
// const mongoose = require("mongoose")
const getShowAddresses = async (req,res)=>{
    try{
        
        
        res.render("show-address")
    }catch (error){
        console.log(error)
    }
}

const loadShowAddress = async (req,res)=>{
    const userId = req.session.userId
        if(!userId){
            return res.status(400).json({message:"user not found"})
        }

        const addresses = await Address.find({userId}).sort({isDefault:-1})
        if(!addresses){
            return res.status(400).json({message:"no defualt address"})
        }
        res.status(200).json({data:addresses})
}

const getAddAddresses = async (req,res)=>{
    try{
        console.log("dsfkl")
        req.session.redirectTo = req.query.redirectTo 
        return res.render("add-address");
    }catch (error){
        console.log(error)
    }
}

const postAddAddress = async (req,res)=>{
    console.log("yo kos")
    console.log(req.body)
    try {
        let { fullName, phoneNumber, email, streetAddress, city, state, postalCode, country, addressType, deliveryInstructions, isDefault } = req.body;
       const userId = req.session.userId || "67c466bc5d269f89c3810e4e"
       isDefault = Boolean(isDefault)
       console.log(isDefault)
        // Validate required fields
        if (!userId || !fullName || !phoneNumber || !email || !streetAddress || !city || !state || !postalCode || !country || !addressType) {
            console.log("hare va vava")
            return res.status(400).json({ success: false, message: "All required fields must be filled." });
        }

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        // Create new address
        const newAddress = new Address({
            userId,
            fullName,
            phoneNumber,
            email,
            streetAddress,
            city,
            state,
            postalCode,
            country,
            addressType,
            deliveryInstructions,
            isDefault
        });

        // Save address to database
        const savedAddress = await newAddress.save();

        // Add address ID to user's addresses array
        user.addresses.push(savedAddress._id);
        await user.save();

        let redirectTo = req.session.redirectTo || '/account/Addresses'
        req.session.redirectTo = null
        return res.status(201).json({
            success: true,
            message: "Address added successfully!",
            // address: savedAddress
            redirect:redirectTo
        });

    } catch (error) {
        console.error("Error adding address:", error);
        res.status(500).json({ success: false, message: "Internal Server Error." });
    }
}



const getEditAddress = async (req,res)=>{
    try {
        req.session.redirectTo = req.query.redirectTo 
        const addressId = req.query.id

        
        if(!addressId){
            return res.status(400).json({message:"Invalid address id"})
        }
        
        const addresses = await Address.findById(addressId)
        console.log(addresses)
        if(!addresses){
            return res.status(400).json({message:"No address found"})
        }

        res.render('edit-address',{data:addresses})

    } catch (error) {
        console.log(error)
    }
}


const postEditAddress = async (req,res)=>{

        try {
            
            let { addressId, fullName, phoneNumber,email, streetAddress, city, state, postalCode, country, addressType, isDefault } = req.body;
            isDefault = Boolean(isDefault)
            const userId = req.session.userId ||
            console.log(req.body)
            if (!userId || !fullName || !phoneNumber || !email || !streetAddress || !city || !state || !postalCode || !country || !addressType) {
                console.log("hare va vava")
                return res.status(400).json({ success: false, message: "All required fields must be filled." });
            }

            // Check if the address exists
            const address = await Address.findById(addressId);
            if (!address) {
                return res.status(404).json({ message: "Address not found" });
            }
    
            // Update address fields
            address.fullName = fullName;
            address.phoneNumber = phoneNumber;
            address.streetAddress = streetAddress;
            address.city = city;
            address.state = state;
            address.postalCode = postalCode;
            address.country = country;
            address.addressType = addressType;
            address.isDefault = isDefault;
            address.email = email
    
            
            // Save the updated address
            await address.save();
            let redirectTo = req.session.redirectTo || '/account/Addresses'
            req.session.redirectTo = null

            return res.status(201).json({
                success: true,
                message: "Address updated successfully!",
                // address: savedAddress
                redirect:redirectTo
            });
    
    
        } catch (error) {
            console.error("Error updating address:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    
    
}


const deleteAddress = async (req,res)=>{

    try {
        const addressId = req.body.id
        console.log(addressId)

    if(!addressId){
        return res.status(400).json({message:"id not found"})
    }

    const address = Address.findById(addressId)
    if(!address){
        return res.status(400).json({message:"Address not found"})
    }

    await address.deleteOne()
    return res.status(200).json({message:"deleted successfully"})
        
    } catch (error) {
        console.log(error)
    }
    

}
module.exports = {
    getShowAddresses,
    getAddAddresses,
    postAddAddress,
    loadShowAddress,
    getEditAddress,
    postEditAddress,
    deleteAddress,


    
}