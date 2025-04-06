const Cart = require("../models/cart.schema");
const Product = require("../models/product.schema");
const Wishlist = require("../models/wishlist.schema");
const {compareOffers} = require("./user.controler")
 

const addTocart = async (req,res)=>{
  try{
  const {productId,quantity} = req.body
  const userId = req.session.userId
    console.log(quantity)
  if(quantity <=0 || quantity >5 || !Number.isInteger(quantity)){
    return res.status(400).json({message:"Invalid Quantity"})
  }

  const product = await Product.findById(productId);
  
  if(!product){
    return res.status(400).json({message:"product not found"});
  }

  if(product.isBlocked || product.status != "Available"){
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
    existingProduct.quantity = quantity
    existingProduct.price = price
    cart.items[existingProductIndex] = existingProduct
    

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
    const cart = await Cart.findOne({userId:userId}).populate("items.productId","productTitle productImage status isBlocked")
    if(!cart){
      return res.status(400).render("cart",{cart:[]})
    }
    console.log("hh")
    console.log(cart)
    

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

   cart.items.pull({productId:productId})
   await cart.save()
  console.log(productId)

  res.status(200).json({message:"Product Removed successfull"})


}

// exports.clearCart = async (req, res) => {
//   try {
//     const userId = req.user.id;

//     await Cart.findOneAndUpdate({ user: userId }, { items: [] });

//     res.json({ success: true, message: "Cart cleared successfully." });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Internal server error.", error: error.message });
//   }
// };

module.exports = { 
  addTocart,
  loadcartPage,
  removeFromCart
};
