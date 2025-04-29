const Product = require("../models/product.schema")
const Category = require("../models/category.schema")
const User = require("../models/user.schema")
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')
const category = require("../models/category.schema")
const {compareOffers} = require("./user.controler")

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

const productListPageRender = async (req,res)=>{
    try {
        res.render("product-list")
    } catch (error) {
        console.log(error)
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


        // res.render("product-list",{
        //     data:productData,
        //     currentPage:page,
        //     totalPages:Math.ceil(count/limit),
        //     category:category
        // })

        res.status(200).json({productData,currentPage:page,totalPages:Math.ceil(count/limit),category:category})
    } catch (error) {
        console.log(error)
        res.status(400).send("server error")
    }
}

const getEditProducts = async (req,res)=>{
    try {
        const id = req.query.id;
        const product = await Product.findOne({_id:id}).populate("category")
        console.log(product)
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



const deleteProduct = async (req, res) => {
    try {
        const { id } = req.body; // Get ID from request body

        // Check if ID is provided
        if (!id) {
            return res.status(400).json({ success: false, message: "Product ID is required" });
        }

        // Find and delete the product
        const deletedProduct = await Product.findByIdAndDelete(id);

        // If product not found
        if (!deletedProduct) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Success response
        res.status(200).json({ success: true, message: "Product deleted successfully" });

    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
    
};





// user side product controller 
const getProductForUser = async (req,res)=>{
    try {
        const productId = req.params.id
        const product = await Product.findById(productId)
        console.log(product)
        product.salePrice = await compareOffers(product,product.category)
        if(!product){
          return  res.status(400).json("product not found")
        }
        res.render('product-details.ejs',{product:product})


    } catch (error) {
        
    }
}


const renderShopPage = async (req,res)=>{
    try {
        res.render('shop')
    } catch (error) {
        console.log(error)

    }
}


const fetchAvailableProducts  = async (req,res)=>{
    try {
        const page = req.query.page || 1;
        const limit = 4
        const search = req.query.search || ""
        const skip = (page - 1) * limit
        // console.log(skip)
        console.log(req.query)
        const sort = JSON.parse(req.query.sort) || {}
        // sort = JSON.parse(sort)
        console.log(sort)

        const products = await Product.find({isBlocked:false,productTitle:{$regex:search,$options:'i'}}).skip(skip).sort(sort).limit(limit).populate("category")

        const totalNumberOfProduct = await Product.find({isBlocked:false}).countDocuments()
        const totalPages = Math.ceil(totalNumberOfProduct/limit)
        
        // console.log(products)
        for(let product of products){
            product.salePrice = await compareOffers(product,product.category)
        }
        if(!products){
            return res.status(400).json({message:"products not found"})
        }
        res.status(200).json({productsData:products,currentPage:page,totalPages})
    } catch (error) {
        console.log(error)
        res.status(400).json({message:"some internal error "})
    }
}


// product offer 

const getProductOffer = async (req,res)=>{
    try {
        const productId = req.params.id
        res.render("add-offer",{productId})
    } catch (error) {
        console.log(error)
    }
}

const addProductOffer = async (req,res)=>{
    try {
        
        const {offerName,isActive,discountPercentage,productId} = req.body

        const product = await Product.findOne({_id:productId})
        if(!product){
            return res.status(400).json({error:"product not found"})
        }
        product.productOffer.discountPercentage = discountPercentage
        product.productOffer.isActive = isActive
        product.productOffer.offerName = offerName
        product.save()
        
        res.status(200).json({message:"offer added successfull",redirect:"/admin/products/"})
    } catch (error) {
        console.log(error)
    }

}

const getEditProductOffer = async (req,res)=>{
    try {
        const productId = req.params.id
        console.log(productId)
        const product = await Product.findOne({_id:productId})
        if(!product){
            return res.status(400).json({error:"product not found"})
        }
        res.render("edit-offer",{product})
    } catch (error) {
        console.log(error)
    }
}


const putEditProduct = async (req,res)=>{
    try {
        
        const {offerName,isActive,discountPercentage,productId} = req.body

        const product = await Product.findOne({_id:productId})
        if(!product){
            return res.status(400).json({error:"product not found"})
        }

        product.productOffer.discountPercentage = discountPercentage
        product.productOffer.isActive = isActive
        product.productOffer.offerName = offerName
        product.save()
        
        res.status(200).json({message:"offer added successfull",redirect:"/admin/products/"})
    } catch (error) {
        console.log(error)
    }

}


module.exports = {
    
    getProductAddPage,
    addproducts,
    getAllProducts,
    getEditProducts,
    postEditProduct,
    getProductForUser,
    deleteProduct,
    renderShopPage,
    fetchAvailableProducts,
    getProductOffer,
    addProductOffer,
    getEditProductOffer,
    putEditProduct,
    productListPageRender

}