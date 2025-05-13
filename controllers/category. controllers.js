const category = require('../models/category.schema');
const Category = require('../models/category.schema')
const mongoose = require('mongoose')


const categoryPageRender =  async (req,res)=>{
    try {
        res.render("category")
    } catch (error) {
        console.log(error)
    }
}
const CategoryInfo = async (req,res)=>{
    try {
        let page = parseInt(req.query.page) || 1;
        const search = req.query.search || ""
        const limit = 6
        const filter = {}
        filter.$or = [
            {'name':{$regex:search,$options:'i'}},
            {'description':{$regex:search,$options:'i'}}
        ]
       
        const totalcategories = await Category.countDocuments(filter)
        // Reset page to 1 if the total number of filtered categories is less than the current limit.
        // This prevents scenarios where the user is on a higher page (e.g., page 3) but searches for a term
        // that returns fewer documents (e.g., 1 result). Since that result wouldn't exist on page 3,
        // we reset to page 1 to ensure the filtered data is visible.
        if(totalcategories <limit){
            page =1
        }
        const categoryData = await category.find(filter)
        .sort({createdAt:-1})
        .skip((page -1 ) * limit)
        .limit(limit)
        console.log(categoryData)
        const totalPages = Math.ceil(totalcategories/limit)
        
        // res.render('category',{
        //     cat:categoryData,
        //     currentPage:page,
        //     totalPages:totalPages,
        //     totalcategories:totalcategories
        // })
        
        res.status(200).json({categoryData,currentPage:page,totalPages,totalcategories})

    } catch (error) {
        console.error(error)
    }
}

const addCategory = async (req,res)=>{
    
    let {name,description,status,discountPercentage =0} = req.body
    discountPercentage = discountPercentage || 0
   console.log(discountPercentage)
    try {
        const existingCategory = await Category.findOne({name:name}) .collation({ locale: 'en', strength: 2 });

        if(existingCategory) {
            return res.status(400).json({error:"Category already exists"})
        }
        const newCategory = new Category({
            name,
            description,
            categoryOffer:{
                discountPercentage,
                isActive:(!!+status)
            }
        })

        await  newCategory.save()
        return res.status(200).json({message:"category added successfully"})
    } catch (error) {
        console.log(error)
        return res.status(500).json({error:"Internal server Error"})
    }
}

const getListCategory = async (req,res)=>{
    try {
        console.log("no");
        const id = req.query.id
        const a = await Category.updateOne({_id:id},{$set:{isListed:true}})
        console.log(a);
        
        res.status(200).end()
        
    } catch (error) {
        console.log(error)
        res.status(400).end()
    }
}

const getUnlistCategory = async (req,res)=>{
    try {
        const id = req.query.id
        const a= await Category.updateOne({_id:id},{$set:{isListed:false}})
        console.log(a)
        res.status(200).end()

        
    } catch (error) {
        console.log(error)
        res.status(400).end()

    }
}

const getEditCategory = async (req,res)=>{
    const id = req.query.id
    const category =await Category.findOne({_id:id})
    res.render('edit-category',{category:category})
}


const postEditcategory = async (req,res)=>{
    try {
        const id = req.params.id
        console.log(req.body)
        const {name,description,discountPercentage,status} = req.body
        const existingcategory = await Category.findOne({name,_id:{$ne:id}});
        if(existingcategory){
            return res.status(400).json({error:"Category exists, Please choose another name"})
            req.session.msg  = "Category exists, Please choose another name"
            // return res.status(400).redirect("/admin/editCategory/")
        }
        
        // const updateCategory = await Category.findByIdAndUpdate(id,{
        //     name,description
        // },)
        const updateCategory = await Category.findById(id)
        updateCategory.name = name;
        updateCategory.description = description
        updateCategory.categoryOffer.discountPercentage = discountPercentage
        updateCategory.categoryOffer.isActive = (!!status)
        await updateCategory.save()
        console.log(updateCategory)

        if(updateCategory){
            console.log("redire") 
            res.status(200).json({message:"category updated successfull",redirect:"/admin/category"})
        }else{
            console.log("else")
            res.status(404).json({error:"category not found"})
        }

    } catch (error) {
        console.log(error);
        
        res.status(500).json({error:"Internal server eror"})
    }
}


module.exports ={
    CategoryInfo,
    addCategory,
    getListCategory,
    getUnlistCategory,
    getEditCategory,
    postEditcategory,
    categoryPageRender,

}