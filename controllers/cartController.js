const User = require('../models/userModel')
const Category = require('../models/categoryModel')
const Product = require('../models/productModel')
const bcrypt = require('bcrypt')
const Cart = require('../models/cartModel')
const Offer = require('../models/offerModel')
const { ObjectId } = require('mongodb')





// Add this function to your server-side code
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


const loadCart = async (req, res) => {
  try {
    const userId = req.session.userId;

    if (!req.session.outOfStock) {
      req.session.outOfStock = null
    }


    if (!userId) {
      res.redirect('/userSignIn');
    } else {
      // Fetch cart details
      const cartDetails = await Cart.findOne({ user_id: userId }).populate({
        path: 'items.product_id',
        populate: [
          { path: 'offer' },
          {
            path: 'categoryId',
            populate: { path: 'offer' } // Populate the offer field in the Category model
          }
        ]
      });

      const userData = await User.findOne({ _id: userId });


      // Check if cartDetails is truthy before accessing its properties
      const cartItems = cartDetails ? cartDetails.items : [];
      var inStock = ''

      for (const cartItem of cartItems) {
        if (cartItem.quantity > cartItem.product_id.stockQuantity) {
          inStock = 'outOfStock';
          break; // Exit the loop if any item is out of stock
        }
      }

      req.session.outOfStock = inStock
      let sessionStock = req.session.outOfStock

      let originalAmts = 0;

      if (cartDetails) {
        cartDetails.items.forEach((cartItem) => {
          let itemPrice = cartItem.price;  // Adjust the property based on your data model
          originalAmts += itemPrice * cartItem.quantity;
        });
      }


      console.log('iamcartdetails', cartDetails,);




      res.render('cart', { user: userData, cartDetails, subTotal: originalAmts, sessionStock, calculateItemPrice });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};





const postAddToCart = async (req, res) => {
  try {

    const userId = req.session.userId;

    if (userId) {
      const productId = req.body.productId;
      const quantity = req.body.quantity || 1;
      console.log('iam quantity' + quantity);
      console.log('productid', productId);




      const product = await Product.findOne({ _id: productId })
        .populate({
          path: 'offer',
          match: { startingDate: { $lte: new Date() }, expiryDate: { $gte: new Date() } }
        }).populate({
          path: 'categoryId',
          populate: {
            path: 'offer',
            match: { startingDate: { $lte: new Date() }, expiryDate: { $gte: new Date() } }
          }
        })

      console.log('products:', product);

      const cartData = await Cart.findOne({
        user_id: userId,
        'items.product_id': productId
      }, { 'items.$': 1 })  // Projection to only retrieve the matching item

      console.log('cartdata' + cartData);

      if (cartData && cartData.items[0].quantity >= product.stockQuantity) {
        console.log('Product stock exceeded');
        return res.json({ limited: true, message: 'Product stock exceeded' });
      } else {


        let itemPrice = product.price;
        // Check if there's an offer on the product
        console.log('lillllllli');
        if (product.offer) {
          console.log('hahhahhahaha');
          const { percentage } = product.offer;
          console.log('percent', percentage);
          itemPrice -= (itemPrice * percentage) / 100;
        } else if (product.categoryId.offer) {
          const { percentage } = product.categoryId.offer;

          console.log('percentage', percentage);

          itemPrice -= (itemPrice * percentage) / 100;
        }


        console.log('eureuwituritTotalprice', itemPrice);


        const cart = await Cart.findOneAndUpdate(


          {
            user_id: userId,
            'items.product_id': productId
          },
          {
            $inc: { 'items.$.quantity': quantity, 'items.$.total_price': quantity * itemPrice }

          },
          { new: true }
        );

        if (!cart) {

          let itemPrice = product.price;
          // Check if there's an offer on the product
          console.log('lillllllli');
          if (product.offer) {
            console.log('hahhahhahaha');
            const { percentage } = product.offer;
            console.log('percent', percentage);
            itemPrice -= (itemPrice * percentage) / 100;
          } else if (product.categoryId.offer) {
            const { percentage } = product.categoryId.offer;

            console.log('percentage', percentage);

            itemPrice -= (itemPrice * percentage) / 100;
          }


          console.log('eureuwituritTotalprice', itemPrice);
          // If the product doesn't exist in the cart, add a new item
          await Cart.findOneAndUpdate(
            { user_id: userId },
            {
              $push: {
                items: {
                  product_id: productId,
                  quantity: quantity,
                  price: itemPrice,
                  total_price: quantity * itemPrice,
                  ...(product.offer || (product.categoryId && product.categoryId.offer) ? { offerPercentage: (product.offer || product.categoryId.offer).percentage } : {}),
                }
              }
            },
            { upsert: true, new: true }
          );

        }

        return res.json({ success: true });

      }



    } else {
      return res.json({ success: false });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};



const postDeleteItems = async (req, res) => {
  try {
    const productOgId = req.body.productOgId
    const userId = req.session.userId

    const cartUser = await Cart.findOne({ user_id: userId })
    if (cartUser.items.length == 1) {
      await Cart.deleteOne({ user_id: userId })
    } else {
      await Cart.updateOne({ user_id: userId }, { $pull: { items: { _id: productOgId } } })
    }

    res.json({ success: true })


  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
}







const postChangeQuantity = async (req, res) => {
  try {
    const userId = req.session.userId;
    const productId = req.body.productId;
    const count = req.body.count;

    // Find the user's cart
    const cart = await Cart.findOne({ user_id: req.session.userId });
    if (!cart) {
      return res.json({ success: false, message: 'Cart not found.' });
    }

    // Find the product in the cart
    const cartProduct = cart.items.find((item) => item.product_id.toString() === productId);
    if (!cartProduct) {
      return res.json({ success: false, message: 'Product not found in the cart.' });
    }

    // Find the product in the database
    const product = await Product.findById(productId);
    if (!product) {
      console.log('Product not found in the database.');
      return res.json({ success: false, message: 'Product not found in the database.' });
    }



    if (count == 1) {
      // Increase quantity logic
      if (cartProduct.quantity < product.stockQuantity) {
        await Cart.updateOne(
          { user_id: userId, 'items.product_id': productId },
          { $inc: { 'items.$.quantity': 1, 'items.$.total_price': product.price } }
        );

        return res.json({ success: true });
      } else {

        return res.json({
          success: false,
          message: `The maximum quantity available for this product is ${product.stockQuantity}. Please adjust your quantity.`,
        });
      }
    } else if (count == -1) {
      // Decrease quantity logic
      if (cartProduct.quantity > 1) {
        await Cart.updateOne(
          { user_id: userId, 'items.product_id': productId },
          { $inc: { 'items.$.quantity': -1, 'items.$.total_price': -product.price } }
        );

        return res.json({ success: true });
      } else {

        return res.json({ success: false, message: 'Quantity cannot be less than 1.' });
      }
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};






module.exports = {
  postAddToCart,
  loadCart,
  postDeleteItems,
  postChangeQuantity,
  calculateItemPrice
}
