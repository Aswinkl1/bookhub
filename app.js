const express = require('express')
const app = express()
const env = require('dotenv').config()
const db = require('./config/db')
db()










const PORT = process.env.PORT || 3000
app.listen(PORT,()=>{
    console.log(`server runs on port ${PORT}`)
})

module.exports = app