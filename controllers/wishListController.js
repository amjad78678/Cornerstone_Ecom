const User = require('../models/userModel')
const Category = require('../models/categoryModel')
const Product = require('../models/productModel')
const bcrypt = require('bcrypt')
const Cart = require('../models/cartModel')
const Order = require('../models/orderModel')

function calculateItemPrice(product, quantity, offerPercentage) {
   let itemPrice = product.price;
   console.log('itwe,mpice', itemPrice);
   // Check if there's an offer on the product
   if (product.offer) {
      const percentage = product.offer.percentage
      console.log('percent', percentage);
      itemPrice -= (itemPrice * percentage) / 100;
      console.log('itemo', itemPrice);
   } else if (product.categoryId.offer) {
      const percentage = product.categoryId.offer.percentage;
      itemPrice -= (itemPrice * percentage) / 100;
   }

   return quantity * itemPrice;

}

const loadWishlist = async (req, res, next) => {
   try {
      const { userId } = req.session
      if (req.session.userId) {

         const userData = await User.findOne({ _id: userId }).populate({
            path: 'wishlist.product_id',
            populate: [
               { path: 'offer' },
               {
                  path: 'categoryId',
                  populate: { path: 'offer' } // Populate the offer field in the Category model
               }
            ]
         });

         console.log('data', userData)
         const wishlist = userData.wishlist
         res.render('wishlist', { user: userData, wishlist, calculateItemPrice })
      }

   } catch (error) {
      console.log(error.message);
      res.status(500).render('serverError', { message: error.message });
      next(error)
   }
}

const putWishlist = async (req, res, next) => {
   try {
      const { userId } = req.session
      if (userId) {
         const { productId } = req.body
         const date = new Date()
            .toLocaleDateString("en-us", {
               weekday: "short",
               day: "numeric",
               year: "numeric",
               month: "short",
            }).replace(",", "");



         const existingProduct = await User.findOne({ _id: userId, "wishlist.product_id": productId })

         if (!existingProduct) {

            const userWishlist = await User.findByIdAndUpdate({ _id: userId }, { $push: { wishlist: { product_id: productId, date: date } } }, { new: true })

            console.log('nokkeda ithu wishlist', userWishlist);

            const count = userWishlist.length
            console.log('count', count);
            res.status(200).json({ success: true, count });

         } else {
            res.status(200).json({ success: false });
         }

      } else {
         res.json({ login: true })
      }



   } catch (error) {
      console.log(error.message);
      res.status(500).render('serverError', { message: error.message });
      next(error)
   }
}


const postDeleteWishlist = async (req, res, next) => {

   try {

      const { wishlistId } = req.body
      const { userId } = req.session

      console.log('iamwishlistid', wishlistId);
      await User.findOneAndUpdate({ _id: userId }, { $pull: { wishlist: { _id: wishlistId } } }, { new: true })

      res.json({ success: true })

   } catch (error) {
      console.log(error.message);
      res.status(500).render('serverError', { message: error.message });
      next(error)
   }
}




module.exports = {
   loadWishlist,
   putWishlist,
   postDeleteWishlist,
   calculateItemPrice
}