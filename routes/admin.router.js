const express = require('express')
const router = express.Router()
const controller = require('../controllers/admin.controller')
const customerController = require('../controllers/customer.controller')
const categoryController = require('../controllers/category. controllers')
const {adminAuth }= require('../middleware/auth')
const multer = require('multer')
const storage = require('../helpers/multer')
const uploads = multer({storage:storage})
const productController = require('../controllers/product.controller')
const coupon = require("../controllers/coupon.controller")
const order = require('../controllers/order.controller')
const sales = require("../controllers/sales.controller")


router.get('/login',controller.loadLogin)

router.post('/login',controller.postLogin)

router.get('/',adminAuth,controller.loadHomepage)

router.get('/logout',controller.logout)

router.get('/users',adminAuth,customerController.getCustomerInfoPage)
router.get('/api/users',adminAuth,customerController.customerInfo)

router.patch('/blockCustomer',adminAuth,customerController.customerBlocked)

router.patch('/unBlockCustomer',adminAuth,customerController.customerUnBlocked)

//category
router.get('/category',adminAuth,categoryController.categoryPageRender)
router.get('/api/category',adminAuth,categoryController.CategoryInfo)
router.post("/addCategory",adminAuth,categoryController.addCategory)
router.patch('/api/listCategory',adminAuth,categoryController.getListCategory)
router.patch('/api/unListCategory',adminAuth,categoryController.getUnlistCategory)
router.get('/editCategory',adminAuth,categoryController.getEditCategory)
router.post('/editCategory/:id',adminAuth,categoryController.postEditcategory)

router.get("/addProducts",productController.getProductAddPage)
router.post("/addProducts",uploads.array("images",4),productController.addproducts)
router.get('/products',productController.getAllProducts)
router.get('/editProduct',productController.getEditProducts)
router.post('/editProduct/:id',uploads.array("images",4),productController.postEditProduct)
router.put('/products/delete',productController.deleteProduct)


// coupon
router.get("/coupon",adminAuth,coupon.loadCouponPage)
router.post("/coupon/editCoupons",adminAuth,coupon.getEditCoupon)
router.put("/coupon/editCoupons",adminAuth,coupon.postEditCoupon)
router.delete("/coupon/deleteCoupon/:id",adminAuth,coupon.deleteCoupon)

// Order
router.get("/order",order.renderOrderList)
router.get("/api/order",order.getOrderData)
router.get("/order/:id",order.getOrderDetail)
router.patch('/api/order/change-status/:orderId/:productId',order.changeStatusForProduct)
router.patch('/api/order/change-status/:orderId',order.changeOrderStatus)

// Product offer
router.get("/product-offer/:id",productController.getProductOffer)
router.post("/product/addOffer",productController.addProductOffer)
router.get("/edit-offer/:id",productController.getEditProductOffer)
router.put("/product/edit-offer",productController.putEditProduct)

//sales report
router.get("/sales-report",sales.salesReportRender)
router.get('/api/sales-report',sales.getSalesReport)
router.get('/api/sales-report/download/pdf',sales.getSalesReportPDF)
router.get('/api/sales-report/download/excel',sales.getSalesReportExcel)


module.exports = router
