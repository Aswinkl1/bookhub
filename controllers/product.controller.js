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
        // console.log(productData)
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

async function postEditProduct(req, res) {
    console.log(req.body); 
    console.log("Processing product edit");
    try {
        const productId = req.params.id;
        const productData = req.body;
        
        // Find the product to update
        const existingProduct = await Product.findById(productId);
        
        if (!existingProduct) {
            return res.status(404).json("Product not found");
        }
        
        console.log("Existing images:", existingProduct.productImage);
        
        // Get all existing images from the product
        const allExistingImages = existingProduct.productImage || [];
        
        // Get images that should be deleted (those explicitly marked)
        let imagesToDelete = [];
        if (req.body.deleteImages) {
            // Convert to array if it's a single value
            imagesToDelete = Array.isArray(req.body.deleteImages)
                ? req.body.deleteImages
                : [req.body.deleteImages];
        }
        console.log("Images to delete:", imagesToDelete);
        
        // Delete the physical files
        for (const image of imagesToDelete) {
            try {
                const imagePath = path.join(__dirname, '../public/uploads/products-images', image);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                    console.log(`Deleted image: ${image}`);
                }
            } catch (err) {
                console.error(`Error deleting image ${image}:`, err);
            }
        }
        
        // Get the images that should be kept
        const imagesToKeep = allExistingImages.filter(image => !imagesToDelete.includes(image));
        console.log("Images to keep:", imagesToKeep);
        
        // Process any new images
        const newImages = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                try {
                    const originalImagePath = file.path;
                    const resizedImagePath = path.join(__dirname, '../public/uploads/products-images', file.filename);
                    
                    // Resize the image
                    await sharp(originalImagePath)
                        .resize({ width: 440, height: 440 })
                        .toFile(resizedImagePath);
                    
                    // Add to new images array
                    newImages.push(file.filename);
                } catch (err) {
                    console.error(`Error processing image ${file.filename}:`, err);
                }
            }
        }
        
        // Combine kept images and new images
        const updatedImages = [...imagesToKeep, ...newImages];
        console.log("Final image list:", updatedImages);
        
        // Get category ID
        const categoryId = await Category.findOne({ name: productData.category });
        if (!categoryId) {
            return res.status(400).send("Invalid category name");
        }
        
        // Update the product
        const updatedProduct = {
            productTitle: productData.productName,
            description: productData.description,
            category: categoryId._id,
            regularPrice: productData.regularPrice,
            salePrice: productData.salePrice || existingProduct.salePrice,
            quantity: productData.quantity,
            productImage: updatedImages,
            status: productData.status || existingProduct.status,
            authorname: productData.authorName,
            language: productData.language,
            updatedAt: new Date()
        };
        
        await Product.findByIdAndUpdate(productId, updatedProduct);
        
        // Redirect to products page
        return res.redirect("/admin/products");
        
    } catch (error) {
        console.log("Error updating product");
        console.log(error);
        return res.redirect("/admin/pageerror");
    }
}

module.exports = {
    getProductAddPage,
    addproducts,
    getAllProducts,
    getEditProducts,
    postEditProduct

}