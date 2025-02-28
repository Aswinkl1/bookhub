const express = require('express')
const app = express()
const path = require('path')
const env = require('dotenv').config()
const db = require('./config/db')
const exp = require('constants')
const session = require('express-session')
const {userRouter,adminRouter} = require('./routes')
const passport = require('./config/passport')
db()


app.set('view engine','ejs')
app.set('views',[path.join(__dirname,'views/user'),path.join(__dirname,'views/admin'),path.join(__dirname,'views')])

//session
app.use(session({
    secret:"secreta is myhjkfjg",
    resave:false,
    saveUninitialized:true,
    cookie:{
        secure:false,
        httpOnly:true,
        maxAge:72*60*60*100
    }
}));

// app level middleware

app.use(passport.initialize())
app.use(passport.session())
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(express.static(path.join(__dirname, 'public')));

// app.use(function(req, res, next) {
//     res.locals.msg = req.session.msg || ""
//     next();
//   });



//Router middleware
app.use('/',userRouter)
app.use('/admin',adminRouter)
// app.use('/admin',adminRouter)









const PORT = process.env.PORT || 3000
app.listen(PORT,()=>{
    console.log(`server runs on port ${PORT}`)
})

module.exports = app