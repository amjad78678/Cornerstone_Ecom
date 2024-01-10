const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
  },
  is_Listed:{
    type:Boolean,
    required:true
  },
  offer : {
    type : mongoose.Schema.Types.ObjectId,
    ref : 'Offer'
}
});


module.exports= mongoose.model('Category', categorySchema);


