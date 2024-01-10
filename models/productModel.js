const { Timestamp } = require('mongodb');
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },

  offer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Offer',
  },
  reviews: [{
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    title: {
      type: String
    },
    description: {
      type: String
    },
    rating: {
      type: Number
    },
    createdAt: {
      type: Date
    }
  }],
  imageUrl: [{
    type: String,
    required: true


  }],
  stockQuantity: {
    type: Number,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  is_Listed: {
    type: Boolean,
    required: true,
  },
  wood: {
    type: String,
    required: true
  }
},
  { timestamps: true });

module.exports = mongoose.model('Product', productSchema);


