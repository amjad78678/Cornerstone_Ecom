const mongoose = require('mongoose');

const userOtpVerificationSchema = new mongoose.Schema({
  userId: {
    type: String,
  },
  otp: {
    type: String,
  },
  createdDate: {
    type: Date
    
  },
  expiresAt:{
    type:Date
  }
});

  

module.exports = mongoose.model(
  'userOtpVerification',
  userOtpVerificationSchema,
);

