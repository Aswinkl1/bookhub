const express = require('express')
const app = express()
const path = require('path')
const env = require('dotenv').config()
const db = require('./config/db')
const exp = require('constants')
const session = require('express-session')
const {userRouter,adminRouter} = require('./routes')
const passport = require('./config/passport')
const  morgan = require('morgan')
const { url } = require('inspector')
const mongoStore = require('connect-mongo');
const User = require('./models/user.schema')
db()


// app.use(morgan('dev'))
app.set('view engine','ejs')
app.set('views',[path.join(__dirname,'views/user'),path.join(__dirname,'views/admin'),path.join(__dirname,'views')])

//session
app.use(session({
    secret:"secreta is myhjkfjg",
    resave:false,
    saveUninitialized:true,
    store:  mongoStore.create({
        mongoUrl:process.env.MONGODB_URI,
        ttl:14 * 24 *60 *60,
        collectionName: "sessions",
        autoRemove:'native'

    }),
    
    cookie:{
        secure:false,
        httpOnly:true,
        maxAge:72*60*60*100
    },
    
}));


// app level middleware

app.use(passport.initialize())
app.use(passport.session())
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(express.static(path.join(__dirname, 'public')));

app.use( async function(req, res, next) {
    if (req.session && req.session.userId) {
        
        const user = await User.findById(req.session.userId); // Fetch from DB
        
        res.locals.user = user || null;
        
    }
    next();
  });



//Router middleware
app.use('/',userRouter)
app.use('/admin',adminRouter)
// app.use('/admin',adminRouter)









const PORT = process.env.PORT || 3000
app.listen(PORT,()=>{
    console.log(`server runs on port ${PORT}`)
})

module.exports = app