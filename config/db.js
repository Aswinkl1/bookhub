const mongoose = require('mongoose')
const env = require('dotenv').config()

const connectDB = async ()=>{
    try{
     await mongoose.connect(process.env.MONGODB_URI)
     console.log("db connected")
    }catch (e){
        console.log("db not connected")
        process.exit(1)
    }
}

module.exports = connectDB