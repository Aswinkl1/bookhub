const { name } = require('ejs')
const User = require('../models/user.schema')



const getCustomerInfoPage = async (req,res)=>{
    try {
        res.render('customers')
    } catch (error) {
        console.log(error)
    }
}
const customerInfo = async (req,res)=>{
    try {
        let search = req.query.search || ""
        
        let page = req.query.page || 1
        
        
        const limit = 4
        const count = await User.find({
            isAdmin:false,
            $or:[
                {name:{$regex:".*" + search + ".*"}},
                {email:{$regex:".*" + search + ".*"}}
            ]
        }).countDocuments()
        // when it is page 2 and the search has only 1 document AFTER block  
        // beacuse it is page 2 it will skip the doc because of limit 4 and there is only 1 doc
        // 
        if(count<=limit){
            page = 1
        }
        const userData = await User.find({
            isAdmin:false,
            $or:[
                {name:{$regex:".*" + search + ".*",$options:"i"}},
                {email:{$regex:".*" + search + ".*",$options:"i"}}
            ]
        })
        .skip((page-1) * limit)
        .limit(limit).sort({createdAt:-1,name:1})
        .exec()
        
        
        const totalPages = Math.ceil(count/limit)
        console.log(userData)
        // res.render('customers',{
        //     data:userData,
        //     totalPages:Math.ceil(count/limit),
        //     currentPage:page,
        //     count:count
        // })

        const activeCount = await User.countDocuments({isBlocked:false})
        const blockedCount = await User.countDocuments({isBlocked:true})
        res.status(200).json({users:userData,totalPages,currentPage:page,activeCount,blockedCount})
    } catch (error) {
        console.log("error in customer info",error)
    }
}


const customerBlocked  = async (req,res)=>{
    try {
        let id = req.query.id
        await User.updateOne({_id:id},{$set:{isBlocked:true}})
        res.status(200).end()
    } catch (error) {
        res.status(400).end()
        
    }
}
const customerUnBlocked  = async (req,res)=>{
    try {
        let id = req.query.id
        await User.updateOne({_id:id},{$set:{isBlocked:false}})
        res.status(200).end()
        
    } catch (error) {
        res.status(400).end()
        console.log("error",error)
        
    }
}

module.exports = {
    customerInfo,
    customerBlocked,
    customerUnBlocked,
    getCustomerInfoPage

}