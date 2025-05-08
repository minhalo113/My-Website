const {Schema, model} = require("mongoose");

const sellerCustomerSchema = new Schema({
    myId: {
        type: String,
        required : true
    },
    myFriends: {
        type: Array,
        default : []
    } 
}, {timestamps: true})

export default model("sellerCustomer", sellerCustomerSchema)