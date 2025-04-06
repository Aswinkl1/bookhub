const category = require('../models/category.schema');
const Category = require('../models/category.schema')
const mongoose = require('mongoose')

const CategoryInfo = async (req,res)=>{
    try {
        const page = parseInt(req.query.page) || 1;

        const limit = 4

        const skip = (page -1 ) * limit;

        const categoryData = await category.find({})
        .sort({createdAt:-1})
        .skip(skip)
        .limit(limit)

        const totalcategories = await Category.countDocuments()
        const totalPages = Math.ceil(totalcategories/limit)
        res.render('category',{
            cat:categoryData,
            currentPage:page,
            totalPages:totalPages,
            totalcategories:totalcategories
        })
    } catch (error) {
        console.error(error)
    }
}

const addCategory = async (req,res)=>{
    
    const {name,description,status,discountPercentage} = req.body
   
    try {
        const existingCategory = await Category.findOne({name:name})
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
        
        res.redirect("/admin/category")
        
    } catch (error) {
        
    }
}

const getUnlistCategory = async (req,res)=>{
    try {
        const id = req.query.id
        const a= await Category.updateOne({_id:id},{$set:{isListed:false}})
        console.log(a)
        res.redirect("/admin/category")
        
    } catch (error) {
        
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
    postEditcategory


}