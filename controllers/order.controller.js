const Order = require("../models/order.schema");
const Cart = require("../models/cart.schema");
const Product = require("../models/product.schema");
const { verifyEmailForForgetPassword } = require("./user.controler");
const Wallet = require("../models/wallet.schema");
const Transaction = require('../models/transaction.schema')
const Razorpay = require("razorpay")
const Coupon = require("../models/coupon.schema")
const User = require("../models/user.schema")
const PDFDocument = require("pdfkit")

const razorpayInstance = new Razorpay({
    key_id:process.env.key_id,
    key_secret:process.env.key_secret
})


const payWithRazorpay = async (req,res)=>{
    const userId = req.session.userId

    const amount = parseInt(req.body.amount)
    const options = {
        amount: amount * 100,
        currency:"INR"
    }

    const cart = await Cart.findOne({ userId }).populate("items.productId");

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: "Your cart is empty." });
        }
        
    razorpayInstance.orders.create(options,function (err,order){
        if(err){
            console.log(err)
        }
        console.log(order)
        res.status(200).json({order})
    })
}

const validateCoupon = async (req,res)=>{
    const {couponCode,cartTotal} = req.query
    const {userId} = req.session

    const coupon = await Coupon.findOne({code:couponCode,status:"1"})
    console.log(coupon)
    if(!coupon){
        return res.status(400).json({error:"invalid Coupon code"})
    }

    if(coupon.expiryDate <= new Date()){
        return res.status(400).json({error:"coupon expired"})
    }

    if(!(coupon.minCartAmount <= +cartTotal)){
        return res.status(400).json({error:`You need to add items worth ${coupon.minCartAmount} to use this coupon.`})
    }
    
    const user = await User.findById(userId)
    if(user.usedCoupons.includes(coupon._id)){
        return res.status(400).json({error:`You have already used this coupon.`})
    }

    let discountAmount = (coupon.discountPercentage * cartTotal) / 100
    if(!discountAmount <= coupon.maxDiscountAmount){

        discountAmount = coupon.maxDiscountAmount

    }

    console.log(discountAmount)
    const newCartTotal = cartTotal - discountAmount
    console.log(newCartTotal)
    res.status(200).json({message:"",cartTotal:newCartTotal,discountAmount,coupon})

}


const addOrder = async (req, res) => {
    function itemPriceAfterDiscount(itemPrice,couponDiscount,cartTotal,quantity){
        console.log(arguments)
        
        const totalPrice = itemPrice * quantity
        return totalPrice + (Math.round(couponDiscount * (totalPrice/ +cartTotal)))

    }
    try {

        const userId = req.session.userId
        const addressId = req.body.addressId
        const {paymentMethod,cartTotal,couponId,totalDiscount,couponDiscount} = req.body
        console.log('coupon discount'+couponDiscount)
        const cart = await Cart.findOne({ userId }).populate("items.productId");
        
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: "Your cart is empty." });
        }
        console.log(cart.items.length)
        // Calculate total price
        const orderItems = cart.items.map(item => {
            const totalItemPrice = itemPriceAfterDiscount(item.price,couponDiscount,cart.totalPrice,item.quantity)
            return {
                productId: item.productId._id,
                quantity: item.quantity,
                price: item.price,
                totalItemPrice:totalItemPrice,
                totalItemDiscount:(item.productId.regularPrice *item.quantity)- totalItemPrice
            };
        });
        console.log(orderItems)

        


        // Create new order
        const newOrder = new Order({

            userId,
            items: orderItems,
            totalPrice:cartTotal, // amount the customer paid 
            addressId:addressId,
            paymentMethod:paymentMethod,
            discountAmount:totalDiscount

        });
        console.log(newOrder)
        await newOrder.save();
        if(couponId){

            const user = await User.findOne({_id:userId})
            user.usedCoupons.push(couponId)
            // user.save()
        }

        // Reduce quantity for each product
        for (const item of cart.items) {
            await Product.findByIdAndUpdate(
                item.productId._id,
                { $inc: { quantity: -item.quantity } }
            );
        }

        // Clear user's cart after successful order placement
        await Cart.findOneAndDelete({ userId });

        res.status(201).json({ message: "Order placed successfully", order: newOrder });
    } catch (error) {
        console.error("Error placing order:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


const getUserOrders = async (req,res) =>{
    try {
        const userId = req.session.userId
        const orderData = await Order.find({userId}).sort({orderDate:-1})
        console.log(orderData)
        res.render('order',{orderData:orderData})
        
    } catch (error) {
        
    }
}


const getOrderById = async (req,res)=>{

    try {
        console.log("dj")
        const  id  = req.params.id;
        // console.log(orderId)
        const order = await Order.findById(id)
            .populate("items.productId")
            .populate("addressId");
        // console.log(order)
        debugger;
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.render('order-details',{order})
    } catch (error) {
        console.error("Error fetching order:", error);
        res.status(500).json({ message: "Internal server error" });
    }

    
}


const cancelOrder = async (req,res)=>{
    try {
        const { orderId } = req.params;
        const { reason } = req.body;  
        const {userId} = req.session

        const order = await Order.findOne({ orderId }).populate('items.productId');

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        
        if (order.status === "Cancelled") {
            return res.status(400).json({ message: "Order is already cancelled" });
        }

        // Restore quantity for all items
        for (let item of order.items) {
            console.log("item quantity",item.quantity)
            console.log(typeof item.quantity)
           const re= await Product.findByIdAndUpdate(item.productId._id, { 
                $inc: { quantity: item.quantity } 
            });
            console.log(re)
            console.log("fuck it")
        }

        // Update order status
        order.status = "Cancelled";
        let refundedAmount = 0
        order.items.forEach(item =>{

            if((item.status == "Cancelled" || item.status == "Returned") && order.paymentMethod != "COD"){
                refundedAmount += item.totalItemPrice
            }
            
             item.status = "Cancelled"
            });
        order.cancelRequest = reason || null;
        if(order.paymentMethod != "COD"){
            // return the money to the wallet

            _returnMoneyToWallet(userId,orderId,order.totalPrice)
        }
        order.paymentStatus = "Refunded"
        await order.save();

        res.json({ message: "Order cancelled successfully", order });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Server error", error });
    }
}

const cancelSingleProduct = async (req,res)=>{

        try {
            const { orderId, productId } = req.params;
            const { reason } = req.body;
            const {userId} = req.session
            console.log("hi")
    
            const order = await Order.findOne({ orderId });
            if (!order) return res.status(404).json({ message: "Order not found" });
    
            const item = order.items.find(item => item.productId.toString() === productId);
            if (!item) return res.status(404).json({ message: "Product not found in order" });
    
            if (item.status === "Cancelled") {
                return res.status(400).json({ message: "Product already cancelled" });
            }
    
            // Restore quantity
            await Product.findByIdAndUpdate(productId, { $inc: { quantity: item.quantity } });
    
            // Update product status
            item.status = "Cancelled";
            item.cancelRequest = reason || null;
            
            if(order.paymentMethod != "COD"){

                _returnMoneyToWallet(userId,orderId,item.totalItemPrice)
            }
            order.totalPrice -= item.totalItemPrice
            order.refundedAmount += item.totalItemPrice
            order.discountAmount -= item.totalItemDiscount

            console.log(item.price * item.quantity)
            // If all items are cancelled, update order status
            if (order.items.every(item => item.status === "Cancelled")) {
                order.status = "Cancelled";
                order.paymentStatus = "Refunded"
            }
            
            await order.save();
    
            res.json({ message: "Product cancelled successfully", order });
        } catch (error) {
            res.status(500).json({ message: "Server error", error });
        }

    
}

const returnOrder = async (req,res)=>{

        try {

            const { orderId } = req.params;
            const { reason } = req.body;  // Mandatory reason
            
            if (!reason) return res.status(400).json({ message: "Return reason is required" });
            
            const order = await Order.findOne({ orderId }).populate('items.productId');
            if (!order) return res.status(404).json({ message: "Order not found" });
            
            if (order.status !== "Delivered") {
                return res.status(400).json({ message: "Only delivered orders can be returned" });
            }
            
            // Restore quantity for all items
            for (let item of order.items) {
                // await Product.findByIdAndUpdate(item.productId._id, { $inc: { quantity: item.quantity } });
                if(item.status != "Cancelled" && item.status != "Returned" && item.status != "Return-cancelled"){
                    item.status = "Return-pending";
                    item.returnRequest = reason;
                }

            }
            
            order.status = "Return-pending";
            await order.save();
            
            res.json({ message: "Order returned successfully", order });
        } catch (error) {
            console.log(error)
            res.status(500).json({ message: "Server error", error });
        }
        
}

const productReturn = async (req,res)=>{
    
    try {
        const {productId,orderId} = req.params
        const {reason} = req.body
        const {userId} = req.session
        if(!productId || !orderId){
            return res.status(400).json({error:"invalid id"})
        }

        const order = await Order.findOne({orderId:orderId})
        if(!order){
            return res.status(400).json({error:"order not found"})
        }
        console.log(order)

        const item = order.items.find(item => item.productId.toString() == productId)
        if(!item){
            return res.status(400).json({error:"product not found"})
        }
        if(item.status == "Cancelled" || item.status == "Return-pending" || item.status == "Returned"){
            return res.status(400).json({error:"product is already retured or cancelled"})
        }

        item.status = "Return-pending"
        item.returnRequest = reason || null
        if (order.items.every(item => item.status === "Return-pending")) {
            order.status = "Return-pending";
        }
        await  order.save()
        res.status(200).json({message:"product returned successfully"})

    } catch (error) {
        console.log(error)
        res.status(400).json({error:"internal server error"})
    }

}

const _returnMoneyToWallet = async (userId,orderId,amount)=>{
    try{
        let wallet = await Wallet.findOne({userId})

        if(!wallet){
            wallet = new Wallet({userId})
        }

        wallet.balance += amount
        await wallet.save()

        const transaction = new Transaction({
            userId,
            orderId,
            amount,
            status:"Complete",
            type:"Credit"

        })
        await transaction.save()
        return true


    } catch (error) {
        console.log(error)
        return false
    }
}

const downloadInvoice = async (req, res) => {
    try {
      const orderId = req.params.id;
  
      const order = await Order.findOne({ orderId })
        .populate('userId')
        .populate('addressId')
        .populate('items.productId');
      console.log(order)
      if (!order) return res.status(404).send('Order not found');
  
      // Create a PDF document with proper margins
      const doc = new PDFDocument({ 
        size: 'A4',
        margins: {
          top: 50,
          bottom: 50,
          left: 55,
          right: 55
        }
      });
  
      // Set response headers
      res.setHeader('Content-Disposition', `attachment; filename=Invoice-${order.orderId}.pdf`);
      res.setHeader('Content-Type', 'application/pdf');
      doc.pipe(res);
  
      // Define dimensions
      const pageWidth = 595.28; // A4 width in points
      const margin = 55;
      const contentWidth = pageWidth - (margin * 2);
      
      // Header - INVOICE title
      doc.font('Helvetica-Bold').fontSize(26).text('INVOICE', 0, 30, { align: 'center' });
      
      // First horizontal line
      doc.moveDown(1);
      const firstLineY = 80;
      doc.strokeColor('#000000').lineWidth(1)
        .moveTo(margin, firstLineY)
        .lineTo(pageWidth - margin, firstLineY)
        .stroke();
      
      // Two-column layout - Customer Details and Invoice Details
      const colWidth = contentWidth / 2;
      const leftColX = margin;
      const rightColX = margin + colWidth;
      const detailsStartY = firstLineY + 20;
      
      // Customer Details - Left column
      doc.font('Helvetica-Bold').fontSize(18)
        .text('Customer Details', leftColX, detailsStartY);
      
      // Customer details with aligned labels
      const labelWidth = 140;
      
      // Name
      doc.moveDown(0.7);
      let y = doc.y;
      doc.font('Helvetica-Bold').fontSize(11)
        .text('Name:', leftColX, y);
      doc.font('Helvetica').fontSize(11)
        .text(order.userId.name, leftColX + labelWidth, y);
      
      // Shipping Address
      doc.moveDown(0.5);
      y = doc.y;
      doc.font('Helvetica-Bold').fontSize(11)
        .text('Shipping Address:', leftColX, y);
      const address = order.addressId;
      doc.font('Helvetica').fontSize(11)
        .text(address?.fullName || 'abhi', leftColX + labelWidth, y);
      
      // City on the next line aligned with address field
      doc.font('Helvetica').fontSize(11)
        .text(address?.city || 'kochi', leftColX, y + 15);
      
      // Invoice Details - Right column
      doc.font('Helvetica-Bold').fontSize(18)
        .text('Invoice Details', rightColX, detailsStartY);
      
      // Invoice details with aligned labels
      const invoiceDetailY = detailsStartY + 30;
      
      // Helper function to create aligned invoice details
      const createDetailRow = (label, value, yPosition, color = '#000000') => {
        doc.font('Helvetica-Bold').fontSize(11)
          .text(label, rightColX, yPosition);
        doc.font('Helvetica').fontSize(11)
          .fillColor(color)
          .text(value, rightColX + 130, yPosition);
        doc.fillColor('#000000'); // Reset to black
      };
      
      // Invoice #
      createDetailRow('Invoice #:', order.orderId, invoiceDetailY);
      
      // Date
      createDetailRow('Date:', new Date(order.orderDate).toLocaleDateString(), invoiceDetailY + 30);
      
      // Payment Method
      createDetailRow('Payment Method:', order.paymentMethod, invoiceDetailY + 60);
      
      // Payment Status (with red color for Pending)
    //   createDetailRow('Payment Status:', order.paymentStatus, invoiceDetailY + 90, 
    //                  order.paymentStatus === 'Pending' ? '#FF0000' : '#000000');
      
      // Second horizontal line
      const secondLineY = invoiceDetailY + 130;
      doc.strokeColor('#000000').lineWidth(1)
        .moveTo(margin, secondLineY)
        .lineTo(pageWidth - margin, secondLineY)
        .stroke();
      
      // Order Items section title
      doc.font('Helvetica-Bold').fontSize(20)
        .text('Order Items', 0, secondLineY + 20, { align: 'center' });
      
      // Order Items Table
      const tableTop = secondLineY + 60;
      const tableColWidths = [contentWidth * 0.38, contentWidth * 0.24, contentWidth * 0.12, contentWidth * 0.26];
      
      // Table header row with gray background
      doc.fillColor('#f0f0f0')
        .rect(margin, tableTop, contentWidth, 30)
        .fill();
      
      // Add header texts
      doc.fillColor('#000000').font('Helvetica-Bold').fontSize(11);
      
      let colX = margin;
      doc.text('Product', colX + 10, tableTop + 10);
      
      colX += tableColWidths[0];
      doc.text('Status', colX + 10, tableTop + 10);
      
      colX += tableColWidths[1];
      doc.text('Qty', colX + 10, tableTop + 10, { align: 'center', width: tableColWidths[2] - 20 });
      
      colX += tableColWidths[2];
      doc.text('Price', colX + 10, tableTop + 10, { align: 'right', width: tableColWidths[3] - 20 });
      
      
      // Table rows
      let rowY = tableTop + 30;
      let subtotal = 0;
      
      for (const item of order.items) {
        const product = item.productId;
        const isDelivered = item.status === 'Delivered' || item.status == "Return-cancelled" ;
        if(isDelivered){
            // Row background (subtle alternating effect)
            doc.fillColor('#f9f9f9')
            .rect(margin, rowY, contentWidth, 30)
            .fill();
            
            // Product name
            colX = margin;
            doc.fillColor('#000000').font('Helvetica').fontSize(11)
            .text(product.productTitle, colX + 10, rowY + 10);
            
            // Status with color
            colX += tableColWidths[0];
            let statusColor = '#000000';
            if (item.status === 'Cancelled') statusColor = '#FF0000';
            if (item.status === 'Returned') statusColor = '#FFA500';
            if (item.status === 'Delivered') statusColor = '#008000';
            
            doc.fillColor(statusColor).font('Helvetica').fontSize(11)
            .text(item.status, colX + 10, rowY + 10);
            
            // Quantity centered
            colX += tableColWidths[1];
            doc.fillColor('#000000').font('Helvetica').fontSize(11)
            .text(item.quantity.toString(), colX + 10, rowY + 10, 
                { align: 'center', width: tableColWidths[2] - 20 });
            
            // Price right-aligned with rupee symbol
            colX += tableColWidths[2];
            doc.fillColor('#000000').font('Helvetica').fontSize(11)
            .text(`₹${item.price.toFixed(2)}`, colX + 10, rowY + 10, 
                { align: 'right', width: tableColWidths[3] - 20 });
            
            
            if (isDelivered) {
            subtotal += item.totalItemPrice;
            }
            
            // Bottom border for row
            doc.strokeColor('#e0e0e0').lineWidth(0.5)
            .moveTo(margin, rowY + 30)
            .lineTo(margin + contentWidth, rowY + 30)
            .stroke();
            
            rowY += 30;
      }}
      
      // Third horizontal line
      const thirdLineY = rowY + 30;
      doc.strokeColor('#000000').lineWidth(1)
        .moveTo(margin, thirdLineY)
        .lineTo(pageWidth - margin, thirdLineY)
        .stroke();
      
      // Order Summary section - fixed to match the image exactly
      const summaryWidth = 460;
      const summaryLeft = margin; // Align with left margin
      const summaryTop = thirdLineY + 30;
      
      // Order Summary Header
      doc.fillColor('#f0f0f0')
        .rect(summaryLeft, summaryTop, summaryWidth, 30)
        .fill();
      
      doc.fillColor('#000000').font('Helvetica-Bold').fontSize(12)
        .text('Order Summary', summaryLeft + 15, summaryTop + 10);
      
      // Subtotal row with border
      doc.fillColor('#ffffff')
        .rect(summaryLeft, summaryTop + 30, summaryWidth, 30)
        .fill()
        .strokeColor('#e0e0e0').lineWidth(0.5)
        .rect(summaryLeft, summaryTop + 30, summaryWidth, 30)
        .stroke();
      
      doc.fillColor('#000000').font('Helvetica').fontSize(11)
        .text('Subtotal (Delivered items only):', summaryLeft + 15, summaryTop + 40);
      
      // Format currency with proper right alignment
      const formattedSubtotal = `₹${order.totalPrice.toFixed(2)}`;
      doc.text(formattedSubtotal, summaryLeft + summaryWidth - 50, summaryTop + 40, { align: 'left' });
      
      // discount amount row
      doc.fillColor('#ffffff')
        .rect(summaryLeft, summaryTop + 60, summaryWidth, 30)
        .fill()
        .strokeColor('#e0e0e0').lineWidth(0.5)
        .rect(summaryLeft, summaryTop + 60, summaryWidth, 30)
        .stroke();
      
        
      doc.fillColor('#000000').font('Helvetica-Bold').fontSize(11)
        .text('Refunted Amount:', summaryLeft + 15, summaryTop + 70);
      
      // Format final amount with proper right alignment
      const discountAmount = Math.max(0,  order.totalPrice - subtotal);
      const formatteddiscountAmount = `-${discountAmount.toFixed(2)}`;
      doc.text(formatteddiscountAmount, summaryLeft + summaryWidth - 50, summaryTop + 70, { align: 'left' });
      
      
      // Final Amount row with border
      doc.fillColor('#ffffff')
        .rect(summaryLeft, summaryTop + 90, summaryWidth, 30)
        .fill()
        .strokeColor('#e0e0e0').lineWidth(0.5)
        .rect(summaryLeft, summaryTop + 90, summaryWidth, 30)
        .stroke();
      
      doc.fillColor('#000000').font('Helvetica-Bold').fontSize(11)
        .text('Final Amount:', summaryLeft + 15, summaryTop + 100);
      
      // Format final amount with proper right alignment
      const finalAmount = Math.max(0, subtotal);
      const formattedFinalAmount = `${finalAmount.toFixed(2)}`;
      doc.text(formattedFinalAmount, summaryLeft + summaryWidth - 50, summaryTop + 100, { align: 'left' });
      
      // Finalize PDF
      doc.end();
      
    } catch (err) {
      console.error(err);
      res.status(500).send("Error generating invoice");
    }
  };

// order management for admin 
const renderOrderList  = async (req,res)=>{
    try {
        return res.render("order-list")
    } catch (error) {
        console.log(error)
    }
}

const getOrderData = async (req,res)=>{

    
    try {
        let {search,status,page=1,} = req.query
        // status= "Pending"
        // search = "sanjay"
        let limit = 5
        const skip = (page -1) * limit
        let searchQuery = {$match:{}}
    
        if(search){
            searchQuery = {
                $match:{
                     $or:[
                         {'user.name':{$regex:search,$options:'i'}},
                         {'user.email':{$regex:search,$options:'i'}},
                         
                        ]
                } 
            }
        }
    
        let statusQuery = {$match:{}}
        
        if(status){
            
            statusQuery = {
                $match:{'status':status}
                
            }
        }
    
        const result = await Order.aggregate([
            statusQuery,
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: "$user" },
            searchQuery,
            {
                $addFields: {
                    returnPendingPriority: {
                        $cond: [{ $eq: ["$status", "Return-pending"] }, 0, 1]
                    }
                }
            },
            {
                $sort: {
                    returnPendingPriority: 1,
                    orderDate: -1
                }
            },
            {
                $facet: {
                    metadata: [{ $count: "total" }],
                    data: [
                        { 
                            $project: {
                                _id: 1,
                                status: 1,
                                orderDate: 1,
                                orderId: 1,
                                totalPrice: 1,
                                "user.name": 1,
                                "user.email": 1
                            }
                        },
                        { $skip: skip },
                        { $limit: limit }
                    ]
                }
            },
            
        ]);
        
        
        console.log(result[0]?.metadata[0]?.total)
        return res.status(200).json({data:result[0].data,currentPage:+page,totalPages:Math.ceil(result[0]?.metadata[0]?.total/limit)})
    } catch (error) {
        console.log(error)
        return res.status(400).json({error:"internal server error"})
    }




}

const getOrderDetail = async (req,res)=>{
    try {
        const orderId = req.params.id
        const order = await Order.findById(orderId).populate('userId addressId items.productId')
        console.log(order)
        res.render('admin-order-details',{order:order})
    } catch (error) {
        console.log(error)
        return res.status(400).json({message:"Internal server error "})
        
    }
}

const changeStatusForProduct = async (req,res)=>{
    try {
        
        console.log("inside change status of produt")
        const {productId,orderId} = req.params
        let {newStatus,userId} = req.body
        console.log(userId.length)
        const order = await Order.findById(orderId)

        if(!order){
            return res.status(400).json({error:"order not found"})
        }


        let amount = 0
        let itemDiscount = 0
        order.items.forEach((value) =>{
            if(value.productId.toString() == productId){
                
                value.status = newStatus
                itemDiscount = value.totalItemDiscount
                amount = value.totalItemPrice
            }
            

        })

        const statusArray = ["Cancelled","Returned"]
        
        if(statusArray.includes(newStatus)){
            // Reduce quantity for each product
            for (const item of order.items) {
                if(item.productId.toString() == productId){
                    await Product.findByIdAndUpdate(
                        item.productId,
                        { $inc: { quantity: item.quantity } }
                    );
                }
            }
            
            if(order.paymentMethod != "COD" ||newStatus == "Returned" ){
                // return the money to the wallet
                _returnMoneyToWallet(userId,orderId,amount)
            } 
        order.totalPrice -= amount
        console.log(order.refundedAmount)
        order.refundedAmount += amount
        order.discountAmount -= itemDiscount
    
        }

        order.status = _determineOrderStatusFromItem(order.items)

        await order.save()
        res.status(200).json({message:"product status change successfull"})
    } catch (error) {
        console.log(error)
        
    }




}

const changeOrderStatus = async (req,res)=>{
    const {orderId} = req.params
    const {newStatus,userId}  =req.body

    const order = await Order.findById(orderId)
    if(!order){
        return res.status(400).json({error:"order not found"})
    }

    order.status = newStatus

    const statusOption = {
        "Pending":["Pending","Shipped","Delivered","Cancelled"],
        "Shipped":["Shipped","Delivered","Cancelled"],
        "Return-pending":["Returned","Return-pending","Return-cancelled"],
        "Delivered":["Delivered"],
        "Cancelled":"Cancelled",
        "Returned":["Returned"],
        "Return-cancelled":["Return-cancelled"]
    }
    

    // let refundedAmount =0
    let refuntableAmount = 0
    if(newStatus == "Returned" || newStatus == "Cancelled"){
        // for return money to the wallet 
        for(const item of order.items){
            await Product.findOneAndUpdate(item.productId,{
                $inc: { quantity: item.quantity }
            })

            // if(item.status == "Returned" || item.status == "Cancelled" ){
            //     refundedAmount += item.quantity * item.price
            // }
            if(item.status == "Return-pending"){
                refuntableAmount += item.totalItemPrice
            }
            // item.status = newStatus;
            
        }
        order.refundedAmount += refuntableAmount
        order.totalPrice -= refuntableAmount
        order.paymentStatus = "Refunded"
        // return money here
        _returnMoneyToWallet(userId,orderId,refuntableAmount)
        
    }
    
    order.items.forEach(item =>{
        if(statusOption[item.status].includes(newStatus)){
            console.log(item.status , newStatus)
            item.status =newStatus
        }
    })

    await order.save()
    
    res.status(200).json({message:"change status successfully"})


}

function _determineOrderStatusFromItem(items){
    const statuses = items.map(item => item.status)
    console.log(statuses)
    const allCancelled = statuses.every(status => status == "Cancelled")
    const allShipped = statuses.every(status => status == "Shipped")
    const allDelivered = statuses.every(status => status == "Delivered")
    const allReturned = statuses.every(status => status == "Returned")
    const allReturnPending = statuses.every(status => status == "Return-pending")
    const allReturnCancelled = statuses.every(status => status == "Return-cancelled")

    const anydeliverd = statuses.includes("Delivered")
    const anyReturned = statuses.includes("Returned")
    const anyPendingOrShipped = statuses.some(status =>["Pending","Shipped"].includes(status))
    
    if(allCancelled){
        return "Cancelled"
    }
    else if(allShipped){
        return "Shipped"
    }
    else if(allDelivered || (anydeliverd && !anyPendingOrShipped)){
        return "Delivered"
    }
    else if(allReturned || (anyReturned && !anyPendingOrShipped)){
        return "Returned"
    }
    else if(allReturnPending){
        return "Return-pending"
    }
    else if(allReturnCancelled){
        return "Return-cancelled"
    }else{
        return "Pending"
    }

    

}

module.exports = { 
    addOrder,
    getUserOrders,
    getOrderById,
    cancelOrder,
    cancelSingleProduct,
    returnOrder,
    productReturn,
    renderOrderList,
    getOrderData,
    getOrderDetail,
    changeStatusForProduct,
    changeOrderStatus,
    payWithRazorpay,
    validateCoupon,
    downloadInvoice,

 };

