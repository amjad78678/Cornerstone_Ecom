const express = require('express')
const adminRoute = express()
const path = require('path');
const userController = require('../controllers/adminController');
const bodyParser = require('body-parser');
const auth = require('../middleware/adminAuth')
const adminController = require('../controllers/adminController')
const couponController = require('../controllers/couponController')
const offerController = require('../controllers/offerController')
const bannerController = require('../controllers/bannerController')
const upload = require('../middleware/uploadImages')
const session = require('express-session')


adminRoute.set('view engine', 'ejs');
adminRoute.set('views', path.join(__dirname, '..', 'views', 'admin'));
adminRoute.use(bodyParser.json());
adminRoute.use(bodyParser.urlencoded({ extended: true }));



adminRoute.use(express.static(path.join(__dirname, '..', 'public')));
adminRoute.use(express.static(path.join(__dirname, '..', 'public', 'styles')));
adminRoute.use(
  express.static(path.join(__dirname, '..', 'public', 'assetsAdmin', 'imgs', 'products', 'resized')),
);


adminRoute.use(session({
  secret: 'your-secret-keyamjadali',
  resave: false,
  saveUninitialized: true,
}));




adminRoute.get('/', auth.isLogout, adminController.loadAdminLogin)
adminRoute.post('/', userController.verifyLogin)
adminRoute.get('/adminHome', auth.isLogin, adminController.loadAdminHome)
adminRoute.get('/users', auth.isLogin, adminController.loadUsers)
adminRoute.get('/category', auth.isLogin, adminController.loadCategory)
adminRoute.get('/addCategory', auth.isLogin, adminController.loadAddCategory)
adminRoute.post('/addCategory', adminController.postAddCategory)
adminRoute.get('/editCategory', auth.isLogin, adminController.loadEditCategory)
adminRoute.post('/editCategory', adminController.postEditCategory)
adminRoute.post('/category/list/:id', adminController.listingCategory)
adminRoute.post('/category/unlist/:id', adminController.unlistingCategory),
  adminRoute.post('/category/deleteCategory/:id', adminController.deleteCategory)
adminRoute.get('/products', auth.isLogin, adminController.loadProducts)
adminRoute.get('/addProduct', auth.isLogin, adminController.loadAddProduct)
adminRoute.post('/addProduct', upload.upload.array('image', 5), adminController.postAddProduct)
adminRoute.post('/products/list/:id', adminController.listingProduct)
adminRoute.post('/products/unlist/:id', adminController.unlistingProduct)
adminRoute.get('/editProduct', auth.isLogin, adminController.loadEditProduct)
adminRoute.post('/editProduct', upload.upload.array('image', 5), adminController.postEditProduct)
adminRoute.post('/products/deleteProducts/:id', adminController.deleteProducts)
adminRoute.get('/logout', auth.isLogin, adminController.loadLogout)
adminRoute.get('/orders', auth.isLogin, adminController.loadOrders)
adminRoute.patch('/updatedStatus', adminController.updatedStatus)
adminRoute.get('/orderDetails', auth.isLogin, adminController.loadOrderDetails)
adminRoute.put('/deleteImg', adminController.postDeleteImg)
adminRoute.get('/coupon', auth.isLogin, couponController.loadCoupon)
adminRoute.get('/addCoupon', auth.isLogin, couponController.loadAddCoupon)
adminRoute.post('/addCoupon', couponController.postAddCoupon)
adminRoute.post('/deleteCoupon', couponController.deleteCoupon)
adminRoute.get('/logout', auth.isLogin, adminController.loadLogout)
adminRoute.post('/order-status', adminController.postOrderStatus)
adminRoute.post('/cancel-order', adminController.postCancelOrder)
adminRoute.post('/approveReturn', adminController.postApproveReturn)
adminRoute.get('/addOffer', auth.isLogin, offerController.loadAddOffer)
adminRoute.post('/addOffer', offerController.postAddOffer)
adminRoute.get('/offer', auth.isLogin, offerController.loadOffer)
adminRoute.post('/deleteOffer', offerController.postDeleteOffer)
adminRoute.patch('/applyProductOffer', offerController.patchApplyProductOffer)
adminRoute.patch('/removeProductOffer', offerController.patchRemoveProductOffer)
adminRoute.patch('/applyCategoryOffer', offerController.patchApplyCategoryOffer)
adminRoute.patch('/removeCategoryOffer', offerController.patchRemoveCategoryOffer)
adminRoute.get('/salesReport', auth.isLogin, adminController.loadSalesReport)
adminRoute.post('/salesReport', adminController.postSalesReport)
adminRoute.post('/changeUserStatus', adminController.postChangeUserStatus)
adminRoute.post('/unblockUser', adminController.postUnblockUser)
adminRoute.get('/addBanner', auth.isLogin, bannerController.loadAddBanner)
adminRoute.post('/addBanner', upload.upload.array("bannerImage", 1), bannerController.postAddBanner)
adminRoute.get('/banners', auth.isLogin, bannerController.loadBanner)
adminRoute.get('/editBanner', auth.isLogin, bannerController.loadEditBanner)
adminRoute.post('/editBanner', upload.upload.array("bannerImage", 1), bannerController.postEditBanner)
adminRoute.patch('/deleteBanner', bannerController.patchDeleteBanner)


module.exports = adminRoute