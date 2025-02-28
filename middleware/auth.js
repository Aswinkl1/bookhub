const User = require('../models/user.schema')

const userAuth = (req,res,next)=>{
    if(req.session.userId){
        User.findById(req.session.userId).then((data=>{
            if(data && !data.isBlocked){
                next()
            }else{
                re.redirect('/login')
            }
        }))
        .catch(error=>{
            console.log("Error in user auth middleware",error)
            res.status(500).send("internal server error")
        })
    }else{
        res.redirect("/login")
    }
}


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

