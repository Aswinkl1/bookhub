const User = require('../models/user.schema')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const Address = require("../models/address.schema");

const getShowAddresses = async (req,res)=>{
    try{

        res.render("show-address");
    }catch (error){
        console.log(error)
    }
}

const getAddAddresses = async (req,res)=>{
    try{
        res.render("add-address");
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

        return res.status(201).json({
            success: true,
            message: "Address added successfully!",
            // address: savedAddress
            redirect:"/account/Addresses"
        });

    } catch (error) {
        console.error("Error adding address:", error);
        res.status(500).json({ success: false, message: "Internal Server Error." });
    }
}

module.exports = {
    getShowAddresses,
    getAddAddresses,
    postAddAddress,

    
}