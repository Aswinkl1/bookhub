const User = require('../models/user.schema')

const userAuth = async (req, res, next) => {
    try {
        if (!req.session.userId) {
            return res.redirect('/login'); // Redirect if no session
        }

        const user = await User.findById(req.session.userId);
        
        if (!user || user.isBlocked) {
            req.session.destroy(() => {  // Destroy session if blocked
                res.redirect('/login'); // Redirect to login after logging out
            });
            return;
        }

        next(); // Allow access if user is valid
    } catch (error) {
        console.error("Error in user auth middleware", error);
        res.status(500).send("Internal server error");
    }
};



const adminAuth = (req,res,next)=>{
    if(req.session.admin){
        User.findOne({isAdmin:true}).then(data=>{
            if(data){
                next()
            }else{
                res.redirect("/admin/login")
            }
        }).catch(error=>{
            console.log("Error in admin middleware",error)
            res.status(500).send("Internal server Error")
        })
    }else{
        res.redirect("/admin/login")
    }
}

module.exports = {
    userAuth,
    adminAuth,
    
}

