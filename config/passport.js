const passport = require('passport')
const googleStratagy = require('passport-google-oauth20').Strategy
const User = require('../models/user.schema')
const env = require('dotenv')

passport.use(new googleStratagy({
    clientID:process.env.GOOGLE_CLIENT_ID,
    clientSecret:process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:'/auth/google/callback'
},
async (accessToken,refreshToken,profile,done)=>{
    console.log(typeof profile.id)
    try {
        let user = await User.findOne({googleId:profile.id});
        if(user){
            
            console.log("inside user");
            console.log(user)
            return done(null,user)
        }
        user = await User.findOne({ email: profile.emails[0].value });
        
        if (user) {
            user.googleId = profile.id;
            user = await user.save();
            return done(null, user);
          }


            user = new User({
                name:profile.displayName,
                email:profile.emails[0].value,
                googleId:profile.id
                
            });
          user =  await user.save();
            return done(null,user)
        
    } catch (error) {
        return done(error,null)
    }
}

))

passport.serializeUser((user,done)=>{
    done(null,user.id)
});

passport.deserializeUser((id,done)=>{
    User.findOne({_id:id}).then((user)=>{
        done(null,user)
    })
    .catch(err=> done(err,null))
})


module.exports = passport