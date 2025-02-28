const Product = require("../models/product.schema")
const Category = require("../models/category.schema")
const User = require("../models/user.schema")
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')
const category = require("../models/category.schema")


const getProductAddPage = async (req,res)=>{
    try {
        const category = await Category.find({isListed:true},{name:1,_id:0})
        res.render("add-product",{
            category:category
        })
    } catch (error) {
        console.log(error)
    }
}

const addproducts = async (req,res)=>{
    console.log(req.body)
    console.log("gkdfhgjgh")
    try {
        const products = req.body
        const productExists = await Product.findOne({
            productTitle:products.productName,

        });
        if(!productExists){
            const images = []

            if(req.files && req.files.length >0){
                for(let i=0;i<req.files.length;i++){
                    const originalImagePath = req.files[i].path;

                    const resizedImagePath = path.join('public','uploads','products-images',req.files[i].filename)
                    await sharp(originalImagePath).resize({width:440,height:440}).toFile(resizedImagePath)
                    images.push(req.files[i].filename)
                
                }   
                
            }
            const categoryId = await Category.findOne({name:products.category})
            

            if(!categoryId){
                return res.status(400).send("invalid category name")
            }

            const newProduct = new Product({
                productTitle:products.productName,
                description:products.description,
                category:categoryId._id,
                regularPrice:products.regularPrice,
                salePrice:products.salePrice,
                createdAt:new Date(),
                quantity:products.quantity,
                productImage:images,
                status:"Available",
                authorname:products.authorName,
                language:products.language
            })

            await newProduct.save()
            return res.redirect("/admin/addProducts")
        }else{
            return res.status(400).json("products already exist , please try with another name")

        }
    } catch (error) {
        console.log("Error saving product")
        console.log(error);
        
        return res.redirect("/admin/pageerror");
        
        
    }
}

const getAllProducts = async (req,res)=>{
    try {
        const search = req.query.search || ""
        const page = req.query.page || 1 
        const limit = 4;
        const skip = (page -1) * limit
        const productData = await Product.find({
            $or:[
                {productTitle:{$regex:new RegExp(".*"+search+".*","i")}}
            ]
        }).skip(skip)
        .limit(limit)
        .populate("category")
        .exec()

        const count = await Product.find({
            
                productTitle:{$regex:new RegExp(".*"+search+".*","i")}
            
        }).countDocuments()
        const category = await Category.find({isListed:true})
        console.log(productData)
        res.render("product-list",{
            data:productData,
            currentPage:page,
            totalPages:Math.ceil(count/limit),
            category:category
        })
    } catch (error) {
        console.log(error)
        res.status(400).send("server error")
    }
}

const getEditProducts = async (req,res)=>{
    try {
        const id = req.query.id;
        const product = await Product.findOne({_id:id})
        const category = await Category.find({})
        console.log(product._id)
        res.render("edit-product",{
            product:product,
            category:category
        })
    } catch (error) {
        console.log(error)
    }
}



module.exports = {
    getProductAddPage,
    addproducts,
    getAllProducts,
    getEditProducts,

}