const User = require('../models/user.schema')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const loadLogin = async (req,res)=>{
    if(req.session.adminId){
        return res.redirect("/dashboard")
    }
    res.render('admin-login')
}

const postLogin = async (req,res)=>{
    try {
        const {email,password}= req.body

    const admin = await User.findOne({email:email,isAdmin:true})
        // console.log(admin);
        
    if(admin){
        const passwordMatch = await bcrypt.compare(password,admin.password)
        console.log(passwordMatch)
        if(passwordMatch){
            req.session.admin = true
            res.redirect('/admin')
        }else{
            console.log("password miss");
            
            res.redirect('login')
        }
    }else{
        res.redirect("login")
    }
        
    } catch (error) {
        console.error("admin login error",error)
        
        }
    
}


const loadHomepage = async (req,res)=>{
    try {
        // if(req.session.admin){
           return res.render("dashboard")
        // }
    } catch (error) {
        
    }
}


const logout = async (req,res)=>{
    try {
        req.session.destroy(err=>{
            if(err){
                console.log("error destroyin session",err);
                // return res.redirect("")
            }
            res.redirect('/admin/login')
        })
        
    } catch (error) {
        console.log("unexpected error during logout",error)
        // res.redirect("")
    }
}
module.exports = {
    loadLogin,
    postLogin,
    loadHomepage,
    logout,
    
}