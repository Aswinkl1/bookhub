const mongoose = require('mongoose')
const {Schema} = mongoose


const productSchema = new Schema({
    productTitle:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    category:{
        type:Schema.Types.ObjectId,
        ref:'Category',
        // required:true 
    },
    regularPrice:{
        type:Number,
        required:true
    },
    salePrice:{
        type:Number,
        // required:true
    },
    productOffer:{
        type:Number,
        default:0
    },
    quantity:{
        type:Number,

    },
    productImage:{
        type:[String],
        required:true,
    },
    isBlocked:{
        type:Boolean,
        default:false
    },
    status:{
        type:String,
        enum:["Available","out of stock"]
    },
    authorname:{
        type:String,
        required:true
    },
    language:{
        type:String,
        required:true
    },
    productOffer:{
        discountPercentage:{
            type:Number,
            default:0
        },
        isActive:{
            type:Boolean,
            default:false
        },
        offerName:{
            type:String,
            
        }
    }
},{timestamps:true});

productSchema.pre("save",function (next){
    if(this.productOffer?.isActive && this.productOffer.discountPercentage >0){
        const percentage = this.productOffer.discountPercentage
        this.salePrice = this.regularPrice * (1- (percentage/100))
    }else{
        this.salePrice = this.regularPrice
    }
    next()
});


const product = mongoose.model('Product',productSchema)

module.exports = product


