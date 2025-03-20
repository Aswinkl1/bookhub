const mongoose = require('mongoose');
const {Schema} = mongoose
const addressSchema = new mongoose.Schema({
    userId: { 
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    streetAddress: {
        type: String,
        required: true
    },
    apartment: {
        type: String,
        default: null
    },
    landmark: {
        type: String,
        default: null
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    postalCode: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true
    },
    addressType: {
        type: String,
        enum: ["Home", "Office", "Other"],
        default: "Home"
    },
    deliveryInstructions: {
        type: String,
        default: null
    },
    isDefault: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });



addressSchema.pre("save",async function (next) {
    if(this.isDefault){
        await mongoose.model('Address').updateMany(
            {userId:this.userId,_id:{ $ne:this._id } },
            {$set:{ isDefault:false } }
        )
    }
    
});
const Address = mongoose.model('Address', addressSchema);

module.exports = Address;
