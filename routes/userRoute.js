const express = require('express');
const userRouter = express();
const path = require('path');
const userController = require('../controllers/userController');
const cartController = require('../controllers/cartController');
const checkoutController = require('../controllers/checkoutController');
const orderController = require('../controllers/orderController');
const wishlistController = require('../controllers/wishListController');
const bodyParser = require('body-parser');
const auth = require('../middleware/auth')



const session = require('express-session')
userRouter.use(session({
  secret: 'your-secret-keyamjadali',
  resave: false,
  saveUninitialized: true,
}));




userRouter.use(bodyParser.json());
userRouter.use(bodyParser.urlencoded({ extended: true }));

userRouter.set('view engine', 'ejs');
userRouter.set('views', path.join(__dirname, '..', 'views', 'users'));

userRouter.use(express.static(path.join(__dirname, '..', 'public')));
userRouter.use(express.static(path.join(__dirname, '..', 'public', 'styles')));
userRouter.use(
  express.static(path.join(__dirname, '..', 'public', 'assetsAdmin', 'imgs', 'products', 'resized')),
);
userRouter.use(
  express.static(path.join(__dirname, '..', 'public', 'assetsAdmin', 'imgs', 'banners')),
);


userRouter.get('/', auth.isLogout, userController.loadHome);
userRouter.get('/home', auth.isLogin, userController.loadHome);
userRouter.get('/userRegister', auth.isLogout, userController.loadRegister);
userRouter.post('/userRegister', userController.postRegister);
userRouter.get('/userSignIn', auth.isLogout, userController.loadLogin);
userRouter.post('/userSignIn', userController.verifyLogin)

userRouter.get('/authentication', auth.isLogout, userController.loadOtp);
userRouter.post('/authentication', userController.verifyOtp);


userRouter.get('/userLogout', auth.isLogin, userController.userLogout);
userRouter.get('/loginWithOtp', auth.isLogout, userController.loginWithOtp)
userRouter.post('/loginWithOtp', userController.verifyLoginWithOtp)
userRouter.get('/productList', userController.loadProductList)
userRouter.post('/productList', userController.loadProductList)

userRouter.get('/emailVerifyAfter', auth.isLogout, userController.loadEmailVerifyAfter)
userRouter.post('/emailVerifyAfter', userController.postEmailVerifyAfter)
userRouter.get('/productDetail', userController.loadProductDetail)
userRouter.get('/checkout', auth.isLogin, checkoutController.loadCheckout)
userRouter.get('/addNewAddress', auth.isLogin, checkoutController.loadAddNewAddress)
userRouter.post('/addNewAddress', checkoutController.postAddNewAddress)
userRouter.post('/addToCart', cartController.postAddToCart)
userRouter.get('/cart', auth.isLogin, cartController.loadCart)
userRouter.post('/deleteItems', cartController.postDeleteItems)
userRouter.post('/changeQuantity', cartController.postChangeQuantity)
userRouter.post('/placeOrder', checkoutController.postOrderPlaced)
userRouter.get('/order-placed/:id', auth.isLogin, checkoutController.loadOrderPlaced)
userRouter.get('/userProfile', auth.isLogin, userController.loadProfile)
userRouter.get('/editAddress', auth.isLogin, userController.loadEditProfileAddress)
userRouter.post('/editAddress', userController.postEditAddress)
userRouter.put('/deleteAddress', userController.deleteAddress)
userRouter.get('/profileNewAddress', auth.isLogin, userController.loadProfileNewAddress)
userRouter.post('/profileNewAddress', userController.postProfileNewAddress)
userRouter.post('/editProfile', userController.postEditProfile)
userRouter.get('/orders', auth.isLogin, orderController.loadOrders)
userRouter.patch('/cancelOrder', orderController.patchCancelOrder)
userRouter.get('/changePassword', auth.isLogin, userController.loadChangePassword)
userRouter.post('/changePassword', userController.postChangePasssword)
userRouter.get('/viewOrdered', auth.isLogin, orderController.loadViewOrdered)
userRouter.post('/resend-otp', userController.resendOtp);
userRouter.post('/verify-payment', userController.verifyPayment)
userRouter.get('/walletHistory', auth.isLogin, userController.loadWalletHistory)
userRouter.post('/applyCoupon', checkoutController.applyCoupon)
userRouter.patch('/returnOrder', orderController.patchReturnOrder)
userRouter.get('/forgetPassword', auth.isLogout, userController.loadForgetPassword)
userRouter.post('/forgetPassword', userController.postForgetPassword)
userRouter.get('/forget-password', auth.isLogout, userController.loadVerifyForgetPassword)
userRouter.post('/forget-password', userController.postResetPassword)
userRouter.get('/aboutUs', userController.loadAboutUs)
userRouter.get('/contactUs', userController.loadContactUs)
userRouter.get('/manageAddress', auth.isLogin, userController.loadManageAddress)
userRouter.get('/editProfile', auth.isLogin, userController.loadEditProfile)
userRouter.get('/invoice', userController.loadInvoice)
userRouter.get('/invoiceDownload', userController.loadInvoiceDownload)
userRouter.get('/wishlist', auth.isLogin, wishlistController.loadWishlist)
userRouter.put('/wishlist', wishlistController.putWishlist)
userRouter.post('/deleteWishlist', wishlistController.postDeleteWishlist)
userRouter.post('/deleteWallet', checkoutController.postDeleteWallet)
userRouter.post('/addMoneyToWallet', checkoutController.postAddMoneyToWallet)
userRouter.post('/walletVerifyPayment', checkoutController.postWalletVerifyPayment)
userRouter.get('/review', auth.isLogin, userController.loadReview)
userRouter.post('/review/:id', userController.postReview)
userRouter.get('/editReview', auth.isLogin, userController.loadEditReview)
userRouter.post('/editReview/:id', userController.postEditReview)
userRouter.post('/subscribe-newsletter', userController.postNewsLetter)

module.exports = userRouter;

