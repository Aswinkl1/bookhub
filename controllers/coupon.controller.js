const Coupon = require("../models/coupon.schema")
const User = require("../models/user.schema")

// admin
const addCoupons = async (req,res)=>{
    try{
        console.log(req.body)
    const {name,code,discountPercentage,maxDiscountAmount,minCartAmount,expiryDate,status} = req.body
    if(!name || !code || !discountPercentage || !maxDiscountAmount || !minCartAmount || !expiryDate || !status){
        return res.status(400).json({message:"please input necesory details"})
    }

     // Check if coupon code already exists (to prevent duplicates)
     const existingCoupon = await Coupon.findOne({ code });
     if (existingCoupon) {
        return res.status(400).json({message: "Coupon code already exists." });
     }

    const coupon = new Coupon({
        name:name,
        code:code.trim(),
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

const renderCouponPage = async (req,res)=>{
    try {
        res.render("coupons2")
    } catch (error) {
        console.log(error)
    }
}


const loadCouponPage = async (req,res)=>{
    console.log("khd")
// 📌 Get Coupons with Search, Sort, Filter & Pagination
    try {
        let page = req.query.page 
        let { search, limit = 5 } = req.query;
        let filter = {};

        // Convert page & limit to numbers
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 10;
        const skip = (page - 1) * limit;

        // 🔍 Search by Name or Code
        if (search) {
            filter.$and = [
                { isDeleted: false },
                {
                  $or: [
                    { name: { $regex: search, $options: "i" } },
                    { code: { $regex: search, $options: "i" } }
                  ]
                }
              ];
        }else{
            filter.isDeleted = false
        }

        console.log(filter)
        
        // 📌 Fetch Coupons with Filters, Sorting & Pagination
        const totalCoupons = await Coupon.countDocuments(filter);
        const stats = await Coupon.aggregate([
            {
                $facet:{
                    total:[{$match:{isDeleted:false}},{$count:"count"}],
                    active:[{$match:{isDeleted:false,status:"1"}},{$count:"count"}],
                    inActive:[{$match:{isDeleted:false,status:"0"}},{$count:"count"}]
                }
            }
        ])
        const total = stats[0]?.total[0]?.count || 0
        const active = stats[0]?.active[0]?.count || 0
        const inActive = stats[0]?.inActive[0]?.count || 0
        
        const coupons = await Coupon.find(filter)
            .sort({updatedAt:-1})
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            totalCoupons,
            currentPage: page,
            totalPages: Math.ceil(totalCoupons / limit),
            coupons,
            totalCoupons:total,
            activeCoupon:active,
            inActiveCoupon:inActive
        });
        // res.render("coupons",{
        //     totalCoupons,
        //     currentPage:page,
        //     totalPages: Math.ceil(totalCoupons / limit),
        //     coupons
        // })

        

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
        coupon.isDeleted = true
        await coupon.save()

        return res.json({ success: true, message: "Coupon deleted successfully" });
    } catch (error) {
        console.error("Error deleting coupon:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}
module.exports={
    renderCouponPage,
    loadCouponPage,
    addCoupons,
    getEditCoupon,
    postEditCoupon,
    deleteCoupon

}