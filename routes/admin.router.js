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
router.get('/login',controller.loadLogin)

router.post('/login',controller.postLogin)

router.get('/',adminAuth,controller.loadHomepage)

router.get('/logout',controller.logout)

router.get('/users',adminAuth,customerController.customerInfo)

router.get('/blockCustomer',adminAuth,customerController.customerBlocked)

router.get('/unBlockCustomer',adminAuth,customerController.customerUnBlocked)

router.get('/category',adminAuth,categoryController.CategoryInfo)

router.post("/addCategory",adminAuth,categoryController.addCategory)
router.get('/listCategory',adminAuth,categoryController.getListCategory)
router.get('/unListCategory',adminAuth,categoryController.getUnlistCategory)
router.get('/editCategory',adminAuth,categoryController.getEditCategory)
router.post('/editCategory/:id',adminAuth,categoryController.postEditcategory)

router.get("/addProducts",productController.getProductAddPage)
router.post("/addProducts",uploads.array("images",4),productController.addproducts)
router.get('/products',productController.getAllProducts)
router.get('/editProduct',productController.getEditProducts)
router.post('/editProduct/:id',uploads.array("images",4),productController.postEditProduct)


module.exports = router