

const HomePageLoad = async (req,res)=>{
    try{
        res.render('home')
    }catch (e){
        console.log("Home doesnt load ")
        // res.status(500).
    }
}

const pageNotFound = async (req,res)=>{
    try {
        res.render('page-404')
    } catch (error) {
        console.log(error);
        res.redirect('/pageNotFound')
        
    }
}


module.exports = {
    HomePageLoad,
    pageNotFound,


}