const User = require('../models/userModel')
const Category = require('../models/categoryModel')
const Product = require('../models/productModel')
const bcrypt = require('bcrypt')
const Cart = require('../models/cartModel')
const Coupon = require('../models/couponModel')
const orderIdMake = require('../utils/orderId');
const Order = require('../models/orderModel')

const { v4: uuidv4 } = require('uuid');

const crypto = require('crypto');
const Razorpay = require('razorpay');
const { default: mongoose } = require('mongoose')

var instance = new Razorpay({
  key_id: process.env.RAZ_KEYID,
  key_secret: process.env.RAZ_KEYSECRET,
});




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


const loadCheckout = async (req, res) => {
  try {

    const userId = req.session.userId
    req.session.coupon = null
    const cart = await Cart.findOne({ user_id: userId }).populate({
      path: 'items.product_id',
      populate: [
        { path: 'offer' },
        {
          path: 'categoryId',
          populate: { path: 'offer' } // Populate the offer field in the Category model
        }
      ]
    });
    req.session.couponApplied = false
    const availableCoupons = await Coupon.aggregate([{ $match: { $and: [{ status: true }, { 'userUsed.user_id': { $nin: [new mongoose.Types.ObjectId(userId)] } }] } }])
    if (userId && cart) {


      let originalAmts = 0;

      if (cart && cart.items) {
        cart.items.forEach((cartItem) => {
          let itemPrice = cartItem.price;  // Adjust the property based on your data model
          originalAmts += itemPrice * cartItem.quantity;
        });
      }

      const user = await User.findOne({ _id: req.session.userId })
      const wallet = user.wallet

      res.render('checkout', { cart, subTotal: originalAmts, user: [user], wallet, availableCoupons, calculateItemPrice })
    } else {
      res.redirect('/')
    }

  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
}


const loadAddNewAddress = async (req, res) => {
  try {
    res.render('addNewAddress')
  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
}


const postAddNewAddress = async (req, res) => {
  try {
    const { name, phone, streetAddress, city, state, pincode, email } = req.body

    const user = await User.findOne({ _id: req.session.userId })
    if (user) {
      await User.updateOne({ _id: req.session.userId }, {
        $push: {
          address: {
            name: name,
            phone: phone,
            street_address: streetAddress,
            city: city,
            state: state,
            pincode: pincode,
            email: email,


          }
        }
      })
      res.redirect('/checkout')
    } else {
      res.redirect('/userSignIn')
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
}










const postOrderPlaced = async (req, res) => {
  try {
    const { selectedAddress, selectedPayment } = req.body;

    const userId = req.session.userId;

    const cart = await Cart.findOne({ user_id: userId }).populate({
      path: 'items.product_id',
      populate: [
        { path: 'offer' },
        {
          path: 'categoryId',
          populate: { path: 'offer' } // Populate the offer field in the Category model
        }
      ]
    });

    let subTotal = 0
    cart.items.forEach((product) => {

      subTotal += calculateItemPrice(product.product_id, product.quantity);

    })


    const userData = await User.findOne({ _id: userId });
    console.log('iam userdatajshfjasdyujfhdsjhjf', userData);
    const cartData = await Cart.findOne({ user_id: userId });
    const cartProducts = cartData.items;

    let status = '';
    if (selectedPayment === 'cod') {
      status = 'placed';
    } else if (selectedPayment === 'razorpay') {
      status = 'pending';
    } else if (selectedPayment === 'walletPayment') {
      // Check if the wallet balance is sufficient for a 'placed' status
      status = userData.wallet >= subTotal ? 'placed' : 'pending';
    } else {
      // Handle unexpected or unknown payment methods
      status = 'pending';
    }


    let walletDeduction = Math.min(userData.wallet, subTotal);

    console.log('walletDeduction', walletDeduction);
    let remainingAmount = subTotal - walletDeduction;

    console.log('iam cart products', cartProducts);

    const date = new Date();
    const orderDate = date.toLocaleDateString();

    const delivery = new Date(date.getTime() + 10 * 24 * 60 * 60 * 1000);
    const deliveryDate = delivery
      .toLocaleString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })
      .replace(/\//g, '-');

    var couponName = '';
    var couponDiscount = 0;
    if (req.session.coupon != null) {
      couponName = req.session.coupon.couponName;
      couponDiscount = req.session.coupon.discountAmount;
    }

    let OrderId = await orderIdMake()
    const randomOrderId = 'CORN' + OrderId;



    const order = new Order({
      user_id: userId,
      order_id: randomOrderId,
      delivery_address: selectedAddress,
      user_name: userData.userName,
      total_amount: subTotal,
      status: status,
      date: orderDate,
      expected_delivery: deliveryDate,
      payment: selectedPayment,
      items: cartProducts,
      couponName: couponName,
      couponDiscount: couponDiscount,
    });

    let orderData = await order.save();

    const orderId = orderData._id; // Declare orderId at the beginning

    if (orderData.status == 'placed') {
      if (selectedPayment === 'walletPayment') {
        if (userData.wallet >= subTotal) {


          await User.updateOne(
            {
              _id: userId,
            },
            {
              $inc: {
                wallet: -subTotal,
              },
              $push: {
                wallet_history: {
                  date: new Date(),
                  amount: -subTotal,
                  description: 'Order Payment using Wallet Amount',
                },
              },
            }
          );
        }

        await Cart.deleteOne({
          user_id: userId,
        });

        for (let i = 0; i < cartData.items.length; i++) {
          const productId = cartProducts[i].product_id;
          const count = cartProducts[i].quantity;

          await Product.updateOne(
            {
              _id: productId,
            },
            {
              $inc: {
                stockQuantity: -count,
              },
            }
          );
        }

        res.json({
          success: true,
          params: orderId,
        });
      } else if (selectedPayment == 'cod') {
        await Cart.deleteOne({ user_id: userId })

        for (i = 0; i < cartData.items.length; i++) {
          const productId = cartProducts[i].product_id

          const count = cartProducts[i].quantity
          console.log('iamcountsis' + count);

          await Product.updateOne({ _id: productId }, { $inc: { stockQuantity: -count } })
        }
        res.json({ success: true, params: orderId })
      }

    } else {


      if (selectedPayment === 'walletPayment' && userData.wallet < subTotal) {


        console.log('walletdeduct', walletDeduction);
        console.log('remain', remainingAmount);
        console.log('Walletis', userData.wallet, 'ddd', subTotal);


        const options = {
          amount: remainingAmount.toFixed(0) * 100,
          currency: 'INR',
          receipt: '' + orderId,
        };

        instance.orders.create(options, async function (err, order) {
          if (err) {
            console.log(err);
            res.json({
              success: false,
              order: order,
            });

          } else {
            console.log('newOrders', JSON.stringify(order));
            res.json({
              success: false,
              order: order,
              walletDeduction: walletDeduction.toFixed(0),
            });


          }
        });
      } else {
        const totalAmount = orderData.total_amount;

        var options = {
          amount: totalAmount * 100,  // Ensure amount is an integer
          currency: 'INR',
          receipt: '' + orderId,
        };

        instance.orders.create(options, function (err, order) {
          if (err) {
            console.log(err);
          } else {
            console.log('newOrders', JSON.stringify(order));
            return res.json({ success: false, order: order });
          }
        });
      }
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
};




const loadOrderPlaced = async (req, res) => {
  try {

    const orderId = req.params.id
    const userId = req.session.userId
    const order = await Order.findOne({ _id: orderId })



    res.render('orderPlaced', { orderId: orderId, user: userId, orderId, order })

  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
}

const applyCoupon = async (req, res) => {
  try {
    const { couponCode, cartTotal } = req.body
    const { userId } = req.session
    const couponData = await Coupon.findOne({ couponCode: couponCode })

    req.session.coupon = couponData
    let discountedTotal = 0;
    if (couponData) {
      let currentDate = new Date()
      console.log('currnewdate', currentDate);

      let minAmount = couponData.minAmount
      if (cartTotal > couponData.minAmount) {


        if (currentDate <= couponData.expiryDate && couponData.status !== false) {

          const id = couponData._id
          const couponUsed = await Coupon.findOne({ _id: id, 'userUsed.user_id': userId })
          if (couponUsed) {
            console.log("this coupon is already used");
            res.send({ usedCoupon: true })
          } else {
            if (req.session.couponApplied === false) {
              const updateCouponUsed = await Coupon.updateOne({ _id: id }, { $push: { userUsed: { user_id: userId } } })
              await Coupon.updateOne({ _id: id }, { $inc: { Availability: -1 } })
              discountedTotal = cartTotal - couponData.discountAmount
              let discountAmount = couponData.discountAmount
              req.session.couponApplied = true
              res.send({ couponApplied: true, discountedTotal, discountAmount })
            } else {
              res.send({ onlyOneTime: true })
            }
          }
        } else {
          console.log('Coupon expired');
          res.send({ expired: true })
        }
      } else {
        console.log(`you should purchase atleast ${cartTotal}`);
        res.send({ shouldMinAmount: true, minAmount })
      }
    } else {
      console.log('Wrong Coupon');
      res.send({ wrongCoupon: true })
    }

    console.log('coupondata', couponData);


  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
}

const postDeleteWallet = async (req, res) => {
  try {
    const { userId } = req.session
    const { walletDeduction } = req.body
    console.log('walletdeductfdgdgdgion', walletDeduction);
    if (walletDeduction > 0) {

      const deleteData = await User.updateOne(
        {
          _id: userId,
        },
        {
          $inc: {
            wallet: -walletDeduction,
          },
          $push: {
            wallet_history: {
              date: new Date(),
              amount: -walletDeduction,
              description: 'Transaction using Wallet and Razorpay for Order Payment',
            },
          },
        }
      );



    }
    res.json({ success: true })

  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
}


const postAddMoneyToWallet = async (req, res, next) => {
  try {
    const { userId } = req.session
    const { amount } = req.body
    const id = crypto.randomBytes(8).toString('hex')

    const options = {
      amount: amount * 100,
      currency: 'INR',
      receipt: '' + id,
    };

    instance.orders.create(options, async function (err, order) {
      if (err) {
        console.log(err);
        res.json({ success: false })

      } else {
        console.log('newOrders', (order));
        res.json({
          success: true,
          payment: order,
        });


      }
    })


  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
    next(error)
  }
}


const postWalletVerifyPayment = async (req, res, next) => {
  try {
    const { userId } = req.session
    const details = req.body
    const amount = parseInt(details.payment.amount) / 100

    let hmac = crypto.createHmac('sha256', process.env.RAZ_KEYSECRET)

    console.log('hmacddg', hmac);
    // Updating the HMAC with the data
    hmac.update(details.razorpay.razorpay_order_id + '|' + details.razorpay.razorpay_payment_id);

    // Getting the hexadecimal representation of the HMAC
    const hmacFormat = hmac.digest('hex');

    console.log('hmacformatjskfj', hmacFormat);
    console.log('signature', details.razorpay.razorpay_signature);
    if (hmacFormat == details.razorpay.razorpay_signature) {
      await User.findByIdAndUpdate({ _id: userId }, { $inc: { wallet: amount }, $push: { wallet_history: { date: new Date(), amount: amount, description: 'Deposited via Razorpay' } } })

      res.json({ success: true })
    } else {
      res.json({ success: false })
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
    next(error)
  }
}

module.exports = {
  loadCheckout,
  loadAddNewAddress,
  postAddNewAddress,
  loadOrderPlaced,
  postOrderPlaced,
  applyCoupon,
  postDeleteWallet,
  postAddMoneyToWallet,
  postWalletVerifyPayment,
  calculateItemPrice

}