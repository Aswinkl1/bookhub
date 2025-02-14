const express = require('express')
const router = express.Router()
const controller = require('../controllers/user.controler')


router.get('/',controller.HomePageLoad)

router.get('/pageNotFound',controller.pageNotFound)











module.exports = router