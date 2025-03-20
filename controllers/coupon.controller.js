const Coupon = require("../models/coupon.schema")
const User = require("../models/user.schema")

// admin
const addCoupons = async (req,res)=>{
    try{

    const {name,code,discountPercentage,maxDiscountAmount,minCartAmount,expiryDate,status} = req.body
    if(!name || !code || !discountPercentage || !maxDiscountAmount || !minCartAmount || !expiryDate || !status){
        res.status(400).json({message:"please input necesory details"})
    }

     // Check if coupon code already exists (to prevent duplicates)
     const existingCoupon = await Coupon.findOne({ code });
     if (existingCoupon) {
        return res.status(400).json({message: "Coupon code already exists." });
     }

    const coupon = new Coupon({
        name:name,
        code:code,
        discountPercentage:discountPercentage,
        maxDiscountAmount:maxDiscountAmount,
        minCartAmount:minCartAmount,
        expiryDate:expiryDate,
        status:status

    });

    coupon.save()
    res.status(200).json({message:"coupon added successfull"})

    } catch (error){
        res.status(400).json({message:"internal server error"})
    }

}


const loadCouponPage = async (req,res)=>{
    console.log("khd")
// 📌 Get Coupons with Search, Sort, Filter & Pagination
    try {
        let page = req.query.page 
        let { search, sort, status,  limit = 5 } = req.query;
        let filter = {};

        // Convert page & limit to numbers
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 10;
        const skip = (page - 1) * limit;

        // 🔍 Search by Name or Code
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { code: { $regex: search, $options: "i" } }
            ];
        }

        // 🔄 Filter by Status (active / non-active)
        if (status) {
            filter.status = status;
        }

        // 🗂 Sorting Options (Newest or Expiry Date)
        let sortOption = {};
        if (sort === "newest") {
            sortOption.createdAt = -1; // Newest first
        } else if (sort === "expiry") {
            sortOption.expiryDate = 1; // Expiry date ascending
        }

        // 📌 Fetch Coupons with Filters, Sorting & Pagination
        const totalCoupons = await Coupon.countDocuments(filter);
        const coupons = await Coupon.find(filter)
            .sort(sortOption)
            .skip(skip)
            .limit(limit);

        // res.status(200).json({
        //     totalCoupons,
        //     currentPage: page,
        //     totalPages: Math.ceil(totalCoupons / limit),
        //     coupons
        // });
        res.render("coupons",{
            totalCoupons,
            currentPage:page,
            totalPages: Math.ceil(totalCoupons / limit),
            coupons

        })

        console.log(coupons)

    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }


    
}

const getEditCoupon = async (req,res)=>{
    try {
        // Validate the request body
        const { id } = req.body;
        if (!id) {
            return res.status(400).json({ message: "Coupon ID is required" });
        }

        // Check if the coupon exists
        const coupon = await Coupon.findById(id);
        if (!coupon) {
            return res.status(404).json({ message: "Coupon not found" });
        }

        // Send response
        res.status(200).json({ data: coupon });
    } catch (error) {
        console.error("Error fetching coupon:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }

}


const postEditCoupon = async (req,res)=>{
    try {
        // const { id } = req.params; // Get coupon ID from request params
        const { id ,name, code, discountPercentage, minCartAmount, maxDiscountAmount, expiryDate, status } = req.body;

        // **Find the existing coupon**
        const coupon = await Coupon.findById(id);
        if (!coupon) {
            return res.status(404).json({ success: false, message: "Coupon not found" });
        }

        // **Manual Validation for Each Field**
        if (!name || typeof name !== "string" || name.trim().length === 0) {
            return res.status(400).json({ success: false, message: "Invalid coupon name" });
        }

        if (!code || typeof code !== "string" || code.trim().length === 0) {
            return res.status(400).json({ success: false, message: "Invalid coupon code" });
        }

        if (!discountPercentage || isNaN(discountPercentage) || discountPercentage < 0 || discountPercentage > 100) {
            return res.status(400).json({ success: false, message: "Invalid discount percentage (0-100 allowed)" });
        }

        if (!minCartAmount || isNaN(minCartAmount) || minCartAmount < 0) {
            return res.status(400).json({ success: false, message: "Invalid minimum cart amount" });
        }

        if (!maxDiscountAmount || isNaN(maxDiscountAmount) || maxDiscountAmount < 0) {
            return res.status(400).json({ success: false, message: "Invalid max discount amount" });
        }

        if (!expiryDate || isNaN(new Date(expiryDate).getTime()) || new Date(expiryDate) <= new Date()) {
            return res.status(400).json({ success: false, message: "Invalid expiry date (must be in the future)" });
        }

        

        // **Update fields**
        coupon.name = name;
        coupon.code = code.toUpperCase();
        coupon.discountPercentage = discountPercentage;
        coupon.minCartAmount = minCartAmount;
        coupon.maxDiscountAmount = maxDiscountAmount;
        coupon.expiryDate = expiryDate;
        coupon.status = status;

        // **Save the updated document**
        await coupon.save();

        return res.status(200).json({ success: true, message: "Coupon updated successfully", data: coupon });

    } catch (error) {

        return res.status(500).json({ success: false, message: error.message });

    }
}


const deleteCoupon = async (req,res)=>{
    try {
        const couponId = req.params.id;

        // Check if the coupon exists
        const coupon = await Coupon.findById(couponId);
        if (!coupon) {
            return res.status(404).json({ success: false, message: "Coupon not found" });
        }

        // Delete the coupon
        await Coupon.findByIdAndDelete(couponId);

        return res.json({ success: true, message: "Coupon deleted successfully" });
    } catch (error) {
        console.error("Error deleting coupon:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}
module.exports={
    loadCouponPage,
    addCoupons,
    getEditCoupon,
    postEditCoupon,
    deleteCoupon

}