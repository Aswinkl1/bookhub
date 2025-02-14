const express = require('express')
const app = express()
const path = require('path')
const env = require('dotenv').config()
const db = require('./config/db')
const exp = require('constants')
const {userRouter,adminRouter} = require('./routes')


db()


app.set('view engine','ejs')
app.set('views',[path.join(__dirname,'views/user'),path.join(__dirname,'views/admin'),path.join(__dirname,'views')])

// app level middleware
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(express.static(path.join(__dirname, 'public')));




//Router middleware
app.use('/',userRouter)
// app.use('/admin',adminRouter)









const PORT = process.env.PORT || 3000
app.listen(PORT,()=>{
    console.log(`server runs on port ${PORT}`)
})

module.exports = app