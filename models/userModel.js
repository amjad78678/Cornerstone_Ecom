const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  mobileNumber: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  is_Admin: {
    type: Number,
    required: true,
  },
  is_Verified: {
    type: Boolean,
  },
  is_Blocked:{
    type:Boolean,
  },
  token:{
       type:String,
       default:''
  },
  tokenExpiration: { type: Date, default: null },
    address: [
    {
      name: {
        type: String,
      },

      street_address: {
        type: String,
      },
      city: {
        type: String,
      },
      state: {
        type: String,
      },
      phone: {
        type: Number,
      },
      pincode: {
        type: Number,
      },
      email:{
        type:{
          type: String
        }
      }
    },
  ],
      wallet: {
      type: Number,
      default: 0,
    },
    wallet_history: [
      {
        date: {
          type: Date,
        },
        amount: {
          type: Number,
        },
        description: {
          type: String,
        },
      },
    ],

       referralCode: {
        type: String,
        required: true,
        unique: true
    },
    referredBy: {
        type: String
    },
    isReferred: {
        type: Boolean
    },

     wishlist: [
      {
        product_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        
        productPrice:{
          type:Number,
        },
        date: {
          type: Date,
        },
      },
    ],

    

},
  {timestamps:true},
  
  );

module.exports = mongoose.model('User', userSchema);
