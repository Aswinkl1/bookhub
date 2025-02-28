const User = require('../models/user.schema')


const customerInfo = async (req,res)=>{
    try {
        let search = req.query.search || ""
        
        let page = req.query.page || 1
        
        
        const limit = 4; 
        const userData = await User.find({
            isAdmin:false,
            $or:[
                {name:{$regex:".*" + search + ".*"}},
                {email:{$regex:".*" + search + ".*"}}
            ]
        })
        .skip((page-1) * limit)
        .limit(limit)
        .exec()
        
        const count = await User.find({
            isAdmin:false,
            $or:[
                {name:{$regex:".*" + search + ".*"}},
                {email:{$regex:".*" + search + ".*"}}
            ]
        }).countDocuments()
        // const count = await user.
        console.log(userData)
        res.render('customers',{
            data:userData,
            totalPages:Math.ceil(count/limit),
            currentPage:page,
            count:count
        })
    } catch (error) {
        console.log("error incustomer infi",error)
    }
}


const customerBlocked  = async (req,res)=>{
    try {
        let id = req.query.id
        await User.updateOne({_id:id},{$set:{isBlocked:true}})
        res.redirect('/admin/users')
    } catch (error) {
        
        
    }
}
const customerUnBlocked  = async (req,res)=>{
    try {
        let id = req.query.id
        await User.updateOne({_id:id},{$set:{isBlocked:false}})
        res.redirect('/admin/users')
    } catch (error) {

        
    }
}

module.exports = {
    customerInfo,
    customerBlocked,
    customerUnBlocked

}