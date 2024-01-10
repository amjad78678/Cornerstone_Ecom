
const mongoose = require( 'mongoose' ) 



const bannerSchema =new mongoose.Schema({
    image : {
        type : Array,
        required : true
    },

    title : {
        type : String,
        required : true
    },

    description : {
        type : String,
        required : true
    },
    event: {
        type: String,
        required:true
    },

    status : {
        type : Boolean, 
        default : true
    }

})

module.exports = mongoose.model("Banner",bannerSchema)