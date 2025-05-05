const Cart = require("../models/cart.schema");
const Product = require("../models/product.schema");
const Wishlist = require("../models/wishlist.schema");
const {compareOffers} = require("./user.controler")
const Category = require("../models/category.schema")

const addTocart = async (req,res)=>{
  try{
  const {productId,quantity} = req.body
  const userId = req.session.userId
    console.log(quantity)
  if(quantity <=0 || quantity >5 || !Number.isInteger(quantity)){
    return res.status(400).json({message:"Invalid Quantity"})
  }

  const product = await Product.findById(productId).populate("category");
  
  if(!product){
    return res.status(400).json({message:"product not found"});
  }

  if(product.isBlocked || product.status != "Available" || product.category.isListed == false){
    console.log(product.category.name)
    return res.status(400).json({message:"product is blocked"});
  }

  if(product.quantity < quantity){
    return res.status(400).json({message:"Not enough stock available"});
  }

  const price = await compareOffers(product,product.category)
  

  let cart = await Cart.findOne({userId:userId});
  if(!cart){
     cart = new Cart({userId:userId,items:[]});
  }

  const existingProductIndex = cart.items.findIndex(item =>item.productId == productId)

  if(existingProductIndex > -1){
    const existingProduct = cart.items[existingProductIndex]
    console.log()
    if(+existingProduct.quantity -1 == quantity || +existingProduct.quantity +1 == quantity){
      existingProduct.quantity = quantity
      existingProduct.price = price
      cart.items[existingProductIndex] = existingProduct
      
    }else{
      return res.status(200).json({message:"product is already in the cart"});
    }
    

  }else{
    cart.items.push({productId:productId,quantity:quantity,price:price})
  }
  const result =await cart.save()

  const wishlist = await Wishlist.findOneAndUpdate(
    {userId},
    { $pull:{ items: productId} },
    {new:true}
  )
  const totalPrice = result.items[existingProductIndex]?.totalPrice || ""
  console.log(quantity)
  res.status(200).json({message:"product added to cart",quantity:quantity,totalPrice:totalPrice});
}catch (error){

  console.log(error)
  res.status(500).json({message:"internal server error . Please refresh the page and try again"});

}
 
}

const loadcartPage = async (req,res)=>{
  try {
    const userId = req.session.userId

    console.log("hi")
    const cart = await Cart.findOne({userId:userId}).populate("items.productId","productTitle productImage status isBlocked quantity category")

    if(!cart){
      return res.status(400).render("cart",{cart:[]})
    }
    
  // cart.items.find(async(item,index) => {
  //     console.log("pundee")
  //     const product = item.productId;
  //     const category = await Category.findById(product.category)
  //     cart.items[index].isCategoryBlocked = !category.isListed   


  //   });


  for(let item of cart.items){
    const product = item.productId;
    const category = await Category.findById(product.category)
    // console.log(category)
    item.isCategoryBlocked = !category.isListed
  }
  
  console.log(cart.items[0].isCategoryBlocked)


   return res.render("cart",{cart:cart})

    

    

  } catch (error) {
    console.log(error)
    
  }
}


const removeFromCart = async (req,res)=>{
  const productId = req.body.productId

  const userId = req.session.userId

  const cart =await Cart.findOne({userId:userId})
  if(!cart){
    return res.status(400).json({message:"cart is not found"})
  }
  const existingProductIndex = cart.items.findIndex(item =>item.productId == productId)
  if(existingProductIndex <= -1){
    return res.status(400).json({message:"product not found"})
  }
  const removedItemPrice = cart.items[existingProductIndex].price 
  console.log(removedItemPrice)
   cart.items.splice(existingProductIndex,1)
   
   console.log(cart.items)
  //  cart.totalPrice -= removedItemPrice
   await cart.save()
  console.log(productId)

  res.status(200).json({message:"Product Removed successfull"})


}


module.exports = { 
  addTocart,
  loadcartPage,
  removeFromCart
};
