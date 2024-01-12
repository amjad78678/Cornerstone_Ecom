const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const userOtpVerification = require('../models/userOtpVarification');
const Category = require('../models/categoryModel')
const Offer = require('../models/offerModel')
const Order = require('../models/orderModel')
const Banner = require('../models/bannerModel')
const Product = require('../models/productModel')
const nodemailer = require('nodemailer');
const referralCode = require('../utils/referral');
const puppeteer = require('puppeteer')
const path = require('path')
const querystring = require('querystring');
const dotenv = require('dotenv')
const randomstring = require('randomstring')
const mongoose = require('mongoose');
var easyinvoice = require('easyinvoice')
const Cart = require('../models/cartModel');
const fs = require('fs')
const { search } = require('../routes/userRoute');
const { name } = require('ejs');
dotenv.config();

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
};
const loadHome = async (req, res) => {
  try {


    const userData = await User.findOne({ _id: req.session.userId })
    const productFeatured = await Product
      .find({})
      .sort({ date: -1 })
      .limit(5)
      .populate({
        path: 'offer',
        match: { startingDate: { $lte: new Date() }, expiryDate: { $gte: new Date() } }
      })
      .populate({
        path: 'categoryId',
        populate: {
          path: 'offer',
          match: { startingDate: { $lte: new Date() }, expiryDate: { $gte: new Date() } }
        }
      });

    const featuredWithDiscount = calculateDiscount(productFeatured);

    const productSale = await Product
      .find({ stockQuantity: { $lt: 50 } })
      .sort({ date: 1 })
      .limit(8)
      .populate({
        path: 'offer',
        match: { startingDate: { $lte: new Date() }, expiryDate: { $gte: new Date() } }
      })
      .populate({
        path: 'categoryId',
        populate: {
          path: 'offer',
          match: { startingDate: { $lte: new Date() }, expiryDate: { $gte: new Date() } }
        }
      });

    const saleWithDiscount = calculateDiscount(productSale);

    const banner = await Banner.find({})
    const category = await Category.find({})
    const allTopSale = await Product.find({ stockQuantity: { $lt: 30 } }).populate({ path: 'offer', match: { startingDate: { $lte: new Date() }, expiryDate: { $gte: new Date() } } }).populate({ path: 'categoryId', populate: { path: 'offer', match: { startingDate: { $lte: new Date() }, expiryDate: { $gte: new Date() } } } })

    console.log(req.session.userId);
    res.render('userHome', { user: userData, productFeatured: featuredWithDiscount, productSale: saleWithDiscount, category, allTopSale, banner });

  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
};

const loadRegister = async (req, res) => {
  try {

    let userReferral = ''

    if (req.query.referral) {
      userReferral = req.query.referral
    }

    console.log('query referral', req.query.referral);
    console.log('iamuserferera;', userReferral);

    res.render('userRegister', { userReferral });
  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
};

const postRegister = async (req, res) => {
  try {



    const existingUser = await User.findOne({ email: req.body.email, is_Verified: { $eq: true } })

    console.log('iam exist user', existingUser);
    if (existingUser) {
      return res.json({ message: "User already exists." });
    } else {
      const bodyPassword = req.body.password
      let sPassword = await securePassword(bodyPassword);
      const newReferralCode = await referralCode()

      let userReferral = req.body.referral

      if (userReferral) {
        const isReferrerExist = await User.findOne({ referralCode: userReferral })

        if (isReferrerExist) {
          let referredUser = isReferrerExist.userName
          const walletHistory = {
            date: new Date(),
            amount: 500,
            description: "Joining Bonus",

          }

          const user = new User({
            userName: req.body.userName,
            email: req.body.email,
            mobileNumber: req.body.mobileNumber,
            password: sPassword,
            confirmPassword: req.body.confirmPassword,
            is_Admin: 0,
            is_Blocked: false,
            is_Verified: false,
            referralCode: newReferralCode,
            referredBy: referredUser,
            isReferred: true,
            wallet: 500,
            wallet_history: walletHistory
          });

          const userData = await user.save().then((result) => {
            sentOtpVerificationMail(result, res);
          });

          if (userData) {
            await sentOtpVerificationMail(userData.email, userData._id)
          }

        }

      } else {

        const user = new User({
          userName: req.body.userName,
          email: req.body.email,
          mobileNumber: req.body.mobileNumber,
          password: sPassword,
          confirmPassword: req.body.confirmPassword,
          is_Admin: 0,
          is_Blocked: false,
          is_Verified: false,
          referralCode: newReferralCode,
          isReferred: false
        });

        const userData = await user.save().then((result) => {
          sentOtpVerificationMail(result, res);
        });


      }



    }
  }
  catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
};


const sentOtpVerificationMail = async ({ _id, email }, res) => {


  console.log(_id + 'email' + email)    //-----------------------------------------------------------------------
  try {
    const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
    //---------------NODEMAILER TRANSPORT
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: true,
      auth: {
        user: process.env.AUTH_EMAIL,
        pass: 'gasd cdmy jhlt gnhf'
      },
    });
    //mail---options-
    console.log(email);
    const mailOptions = {
      from: process.env.AUTH_EMAIL,
      to: email,
      subject: 'Verify your email for Cornerstone',
      html: `     <div style="font-family: Helvetica, Arial, sans-serif; min-width: 1000px; overflow: auto; line-height: 2">
        <div style="margin: 50px auto; width: 70%; padding: 20px 0">
          <div style="border-bottom: 1px solid #eee">
            <a href="" style="font-size: 1.4em; color: #82AE46; text-decoration: none; font-weight: 600">
              Cornerstone
            </a>
          </div>
          <p style="font-size: 1.1em">Hi,</p>
          <p>Thank you for choosing Cornerstone . Use the following OTP to complete your Sign Up procedures. OTP is valid for a few minutes</p>
          <h2 style="background: #82AE46; margin: 0 auto; width: max-content; padding: 0 10px; color: white; border-radius: 4px;">
            ${otp}
          </h2>
          <p style="font-size: 0.9em;">Regards,<br />Cornerstone</p>
          <hr style="border: none; border-top: 1px solid #eee" />
          <div style="float: right; padding: 8px 0; color: #aaa; font-size: 0.8em; line-height: 1; font-weight: 300">
            <p>Cornerstone</p>
            <p>Ocean Of Heaven</p>
            <p>Omanoor</p>
          </div>
        </div>
      </div>`,
    };

    //----hash-the-otp
    const saltRounds = 10;
    let hashedOtp = await bcrypt.hash(otp, saltRounds);



    const filter = { userId: _id };
    const update = {
      userId: _id,
      otp: hashedOtp,
      createdDate: Date.now(),
      expiresAt: Date.now() + 60000,
    };

    // Use findOneAndUpdate with upsert option
    const result = await userOtpVerification.findOneAndUpdate(filter, update, {
      upsert: true,
      new: true, // If set to true, returns the modified document rather than the original
    });

    // If you want to access the saved or updated document, you can use 'result'
    console.log(result);

    await transporter.sendMail(mailOptions);

    console.log('iamidmwone', _id);


    res.send({ success: true, id: _id })



  } catch (error) {

    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
};


// for reset password send mail



const sentResetVerificationMail = async ({ email, userName }, res, token, req) => {



  try {

    //---------------NODEMAILER TRANSPORT
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: true,
      auth: {
        user: process.env.AUTH_EMAIL,
        pass: 'gasd cdmy jhlt gnhf'
      },
    });
    //mail---options-

    const resetPasswordLink = `${req.protocol}://${req.get("host")}/forget-password?token=${token}`;
    const mailOptions = {
      from: process.env.AUTH_EMAIL,
      to: email,
      subject: 'Reset Your Password',
      html: `
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
          }

          .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          }

          h2 {
            color: #333333;
          }

          p {
            color: #555555;
          }

          a {
            color: #007BFF;
            text-decoration: none;
            font-weight: bold;
          }

          a:hover {
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Hi ${userName},</h2>
          <p>Click the link below to reset your password. This link will expire in 5 minutes.</p>
          <p>
          <a href="${resetPasswordLink}" target="_blank">Reset Your Password</a>
          </p>
        </div>
      </body>
    </html>
  `,
    };

    await transporter.sendMail(mailOptions);


  } catch (error) {

    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
};



const loadLogin = async (req, res) => {
  try {
    res.render('userSignIn');
  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
};
const loadOtp = async (req, res) => {
  try {


    await User.findOne({ is_Verified: false })
    const id = req.query.id
    const resendLink = `/resend-otp?id=${id}`;
    // req.session.userId=req.query.id
    // console.log(`this is session${req.session.userId}`);
    res.render('userOtpRegister', { id: id, resendLink: resendLink });

  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
};
const verifyOtp = async (req, res) => {
  try {
    const Otp = req.body.Otp
    const userId = req.body.id
    const email = req.body.email

    const { referral } = req.session
    console.log('queryid' + req.query.id);
    console.log('bodyid' + req.body.id);

    console.log('lastOtp' + Otp);


    console.log(`this is session ${userId}`);
    const userOtpVerificationRecords = await userOtpVerification.findOne({ userId: userId })

    console.log('iamverificqtionrecords' + userOtpVerificationRecords);

    if (!userOtpVerificationRecords) {
      // Handle the case where no matching record is found
      return res.json({ message: "User not found or verification record does not exist." });
    } else {

      const { otp: hashedOtp } = userOtpVerificationRecords;

      //user otp record exists

      // console.log(expiryDate);

      const expiresAt = userOtpVerificationRecords.expiresAt
      if (expiresAt < Date.now()) {

        //otp expired so
        return res.json({ message: "Otp expired resent otp" });
      }
      const enteredOtp = Otp
      //compare the entered otp
      console.log(enteredOtp);
      console.log(hashedOtp);
      const validOtp = await bcrypt.compare(enteredOtp, hashedOtp);

      if (validOtp) {

        // Delete all users with is_Verified: false, excluding the user with userId
        await User.deleteMany({ is_Verified: false, _id: { $ne: userId } });

        await User.updateOne({ _id: userId }, { $set: { is_Verified: true } })
        req.session.userId = userId
        return res.json({ success: true });
        //delete the used otp of otp database 

      } else {

        //case otp invalid

        return res.json({ message: "Otp doesnt match" });

      }



    }
  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
}

const verifyLogin = async (req, res) => {
  try {

    const password = req.body.password
    const email = req.body.email
    let userData = await User.findOne({ email: email })
    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password)
      //checking is verify or not ----------------------------------------
      if (passwordMatch) {
        if (userData.is_Verified === true) {

          if (!userData.is_Blocked == true) {
            req.session.userId = userData._id
            req.session.email = userData.email
            res.redirect('/')
          } else {
            res.render('userSignIn', { message: 'Your account is temporarily blocked by the admin. We apologize for any inconvenience and appreciate your patience during this review process."' })
          }



        } else {
          await User.deleteOne({ _id: userData._id })
          //---------------data query kittaaaaan-----------

          res.render('userSignIn', { message: 'Account not verified ,please register now <a href="/userRegister">Register Now</a>' })
        }


      } else {
        res.render('userSignIn', { message: 'Email and password is incorrect' })
      }
    } else {
      res.render('userSignIn', { message: 'Email and password is incorrect' })
    }


  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
}
const userLogout = async (req, res) => {
  try {
    req.session.destroy()
    res.redirect('/')
  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
}
const loginWithOtp = async (req, res) => {
  try {

    res.render('loginWithOtp')
  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
}

const verifyLoginWithOtp = async (req, res) => {
  try {

    const userData = await User.findOne({ email: req.body.email });
    if (!userData) {
      res.render(loginWithOtp, { message: 'You havent signed up or verified your account yet.' })
    } else {
      if (userData.is_Verified === true) {
        // req.session.userId=userData._id
        sentOtpVerificationMail(userData, res)
      }

    }
  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
}

// Your backend controller function
const calculateDiscount = (products) => {
  return products.map(product => {
    let discount = 0;

    if (product.offer && product.offer.expiryDate && new Date(product.offer.expiryDate) >= new Date()) {
      discount = (product.price * product.offer.percentage / 100).toFixed(0);
      return { ...product.toObject(), discountedPrice: product.price - discount, discount };
    } else if (product.categoryId && product.categoryId.offer && product.categoryId.offer.expiryDate && new Date(product.categoryId.offer.expiryDate) >= new Date()) {
      discount = (product.price * product.categoryId.offer.percentage / 100).toFixed(0);
      return { ...product.toObject(), discountedPrice: product.price - discount, discount };
    } else {
      return { ...product.toObject(), discountedPrice: product.price, discount };
    }
  });
};
function isNewProduct(product) {
  const updatedAtDate = new Date(product.updatedAt);
  const currentDate = new Date();
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(currentDate.getDate() - 2);

  return updatedAtDate >= threeDaysAgo && updatedAtDate <= currentDate;
}

const loadProductList = async (req, res) => {
  try {
    const { userId } = req.session
    let { searchInput, minPrice, maxPrice, selectedCateg, pageno, sortValue } = req.body;

    console.log(req.body)
    console.log('iam sortvalue', sortValue)

    if (searchInput || minPrice || maxPrice || selectedCateg || pageno || sortValue) {

      console.log('minimum', minPrice);
      console.log('maximum', maxPrice)



      if (selectedCateg) {
        req.session.selectedCategory = selectedCateg
      }

      console.log('selectedcategiry', selectedCateg);


      if (searchInput) {
        let isSearch = await Product.find({
          name: { $regex: searchInput, $options: 'i' },
        });

        console.log('isSEarcch', isSearch);

        if (isSearch) {
          req.session.searchInput = searchInput;
        }

      }





      if (minPrice && maxPrice) {
        let productsInRange = await Product.find({
          price: { $gte: minPrice, $lte: maxPrice },
        });


        if (productsInRange) {
          req.session.minPrice = minPrice;
          req.session.maxPrice = maxPrice;
        }
      }


      if (pageno) {
        req.session.pageno = pageno
      }

      if (sortValue) {
        req.session.sortValue = sortValue
      }


      return res.json({ success: true });

    } else {

      let condition = { is_Listed: true };
      let sortCriteria = {};

      let skip = 0

      if (req.session) {

        const { searchInput, selectedCategory, minPrice, maxPrice, pageno, sortValue } = req.session



        if (searchInput) {
          condition.name = {
            $regex: searchInput,
            $options: 'i',
          };
          delete req.session.searchInput;
        }

        if (sortValue) {
          if (sortValue == 3) {
            sortCriteria = { updatedAt: -1 };
          } else if (sortValue == 2) {
            sortCriteria = { price: 1 }
          } else {
            sortCriteria = { price: -1 }
          }
          delete req.session.selectedCategory
        }
        if (selectedCategory) {

          if (selectedCategory == 'All') {
            condition.category
          } else {
            condition.category = selectedCategory
          }

          delete req.session.selectedCategory
        }

        if (minPrice && maxPrice) {
          condition.price = {
            $gte: parseInt(minPrice, 10),
            $lte: parseInt(maxPrice, 10)
          };

          // Remove minPrice and maxPrice from session
          delete req.session.minPrice;
          delete req.session.maxPrice;
        }



        if (pageno) {
          let page = (pageno == undefined || pageno === 1) ? 1 : pageno
          skip = (page === 1) ? 0 : (page - 1) * 6;
          console.log('Page:', page);
          console.log('Calculated skip:', skip);

        }
        delete req.session.pageno;

      }


      const { userId } = req.session

      const user = await User.findOne({ _id: userId })


      const product = await Product.find(condition).sort(sortCriteria).populate({ path: 'offer', match: { startingDate: { $lte: new Date() }, expiryDate: { $gte: new Date() } } }).populate({ path: 'categoryId', populate: { path: 'offer', match: { startingDate: { $lte: new Date() }, expiryDate: { $gte: new Date() } } } }).skip(skip).limit(6)
      console.log('iamblodyCONDITION', condition);


      const productsWithDiscount = calculateDiscount(product);




      let grandTotal = 0;

      // Iterate through each product and find the maximum price
      productsWithDiscount.forEach((product) => {
        grandTotal = Math.max(grandTotal, product.price);
      });


      const productsCount = await Product.find(condition).sort(sortCriteria).populate({ path: 'offer', match: { startingDate: { $lte: new Date() }, expiryDate: { $gte: new Date() } } }).populate({ path: 'categoryId', populate: { path: 'offer', match: { startingDate: { $lte: new Date() }, expiryDate: { $gte: new Date() } } } }).countDocuments()

      console.log('productsCount', productsCount);

      let totalPages = Math.ceil(productsCount / 6)

      console.log('totalpgaes', totalPages)

      const categories = await Category.find({ is_Listed: true })

      console.log('category', categories);

      const count = await Product.find(condition).populate('categoryId').count()
      const currentPage = 'productList'



      let userData = await User.findOne({ _id: req.session.userId })
      res.render('productList', { grandTotal, isNewProduct, product: productsWithDiscount, userId, user: userData, category: categories, userId, currentPage, count, productsCount, totalPages })

    }


  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
}


const loadEmailVerifyAfter = async (req, res) => {
  try {

    res.render('emailVerifyAfter')
  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
}

const postEmailVerifyAfter = async (req, res) => {
  try {

    const userData = await User.findOne({ email: req.body.email });
    if (userData) {
      sentOtpVerificationMail(userData, res)
    } else {
      res.render('emailVerifyAfter', { message: 'You havent signed up or verified your account yet.' })


    }
  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
}

const calculateDiscountOne = (product) => {
  let discount = 0;

  if (product.offer && product.offer.expiryDate && new Date(product.offer.expiryDate) >= new Date()) {
    discount = (product.price * product.offer.percentage / 100).toFixed(0);
    return { discountedPrice: product.price - discount, discount };
  } else if (product.categoryId && product.categoryId.offer && product.categoryId.offer.expiryDate && new Date(product.categoryId.offer.expiryDate) >= new Date()) {
    discount = (product.price * product.categoryId.offer.percentage / 100).toFixed(0);
    return { discountedPrice: product.price - discount, discount };
  } else {
    return { discountedPrice: product.price, discount };
  }
};

const loadProductDetail = async (req, res) => {
  try {
    const id = req.query.id
    const { userId } = req.session
    console.log('hellobruda' + id);
    const userData = await User.findOne({ _id: req.session.userId })
    const productAll = await Product.find({}).populate({ path: 'offer', match: { startingDate: { $lte: new Date() }, expiryDate: { $gte: new Date() } } }).populate({ path: 'categoryId', populate: { path: 'offer', match: { startingDate: { $lte: new Date() }, expiryDate: { $gte: new Date() } } } }).populate({ path: 'reviews.user_id' })

    const productOne = await Product.findOne({ _id: id }).populate({ path: 'offer', match: { startingDate: { $lte: new Date() }, expiryDate: { $gte: new Date() } } }).populate({ path: 'categoryId', populate: { path: 'offer', match: { startingDate: { $lte: new Date() }, expiryDate: { $gte: new Date() } } } }).populate({ path: 'reviews.user_id' })

    const productOneWithDiscount = calculateDiscountOne(productOne);

    console.log('produvt onr discoutn', productOneWithDiscount);

    const productAllWithDiscount = calculateDiscount(productAll);

    const reviewData = await Product.findOne({ _id: id, 'reviews.user_id': userId })
    let userReviewed = 0;


    if (reviewData) {
      userReviewed = 1
    }


    res.render('productDetail', { reviewData, userReviewed, product: productOne, productOneWithDiscount, productAll: productAllWithDiscount, user: userData })
  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
}

const loadProfile = async (req, res) => {
  try {
    const userId = req.session.userId

    if (userId) {
      const user = await User.findOne({ _id: userId })
      const addresses = user.address
      console.log(addresses);
      res.render('profile', { user, addresses, protocol: req.protocol, host: req.get('host') })
    } else {
      res.redirect('/userSignIn')
    }


  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
}

const loadEditProfileAddress = async (req, res) => {
  try {
    const { userId, addressId } = req.query;
    const addAddressDetails = await User.findOne(
      { _id: userId, "address._id": addressId },
      { "address.$": 1 } // Use  to get the matched address in the array
    );


    console.log('iam addaddress', addAddressDetails);

    res.render("editProfileAddress", { addAddressDetails });
  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
};
const postEditAddress = async (req, res) => {
  try {

    //  const userId= req.query.userId
    //  const addressId=req.query.addressId

    const { name, phone, streetAddress, city, state, pincode, email, userId, addressId } = req.body

    await User.updateOne({ _id: userId, 'address._id': addressId }, {
      $set: {
        'address.$.name': name,
        'address.$.phone': phone,
        'address.$.street_address': streetAddress,
        'address.$.city': city,
        'address.$.state': state,
        'address.$.pincode': pincode,
        'address.$.email': email

      }
    })
    res.redirect('/userProfile')

  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
}


const deleteAddress = async (req, res) => {
  try {

    const userId = req.session.userId
    const { addressId } = req.body
    await User.updateOne({ _id: userId }, { $pull: { address: { _id: addressId } } })
    res.send({ success: true });
  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
    res.status(500).send({ success: false }); // Send an error response if deletion fails
  }
}

const loadProfileNewAddress = async (req, res) => {
  try {
    res.render('profileNewAddress')
  } catch (error) {
    console.log(err.message);
  }
}

const postProfileNewAddress = async (req, res) => {
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
      res.redirect('/userProfile')
    } else {
      res.redirect('/userSignIn')
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
}


const postEditProfile = async (req, res) => {
  try {

    const { profileUserId, profileName, profileMobile } = req.body
    await User.updateOne({ _id: profileUserId }, { $set: { userName: profileName, mobileNumber: profileMobile } })
    res.redirect('/userProfile')

  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
}

const loadChangePassword = async (req, res) => {
  try {
    const userId = req.session.userId
    const message = req.session.message
    req.session.message = ''
    const user = await User.findOne({ _id: userId })


    res.render('changePassword', { user, message })
  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
}


const postChangePasssword = async (req, res) => {
  try {
    const { userId, currentPassword, newPassword, confirmNewPassword } = req.body

    const userData = await User.findOne({ _id: userId })
    const passwordMatch = await bcrypt.compare(currentPassword, userData.password)

    if (passwordMatch) {
      if (newPassword === confirmNewPassword) {
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        await User.updateOne({ _id: userId }, { $set: { password: hashedPassword } })
        res.redirect('/userProfile')
      } else {
        req.session.message = 'Password doesnt match'
        res.redirect('/changePassword')
      }


    } else {
      req.session.message = 'Password doesnt match'
      res.redirect('/changePassword')
    }

  } catch (error) {
    console.log(error.message)
  }
}



const resendOtp = async (req, res) => {
  try {
    const id = req.body.id;
    console.log('dsofiodiouseId' + id);
    const user = await User.findOne({ _id: id });
    console.log('euryuriam user' + user);
    // Fetch user details based on the userId

    // Resend OTP verification email
    await sentOtpVerificationMail(user, res);


  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
}






const verifyPayment = async (req, res) => {
  try {

    const cartData = await Cart.findOne({ user_id: req.session.userId })
    const cartProducts = cartData.items
    const details = req.body
    let walletDeduction = 0;
    if (req.body.walletDeduction) {
      walletDeduction = parseInt(req.body.walletDeduction)
    }
    console.log('walletDeduction', walletDeduction);
    console.log(details);

    const crypto = require('crypto');

    // Your secret key from the environment variable
    const secretKey = process.env.RAZ_KEYSECRET;

    // Creating an HMAC with SHA-256
    const hmac = crypto.createHmac('sha256', secretKey);
    console.log(hmac);

    // Updating the HMAC with the data
    hmac.update(details.payment.razorpay_order_id + '|' + details.payment.razorpay_payment_id);

    // Getting the hexadecimal representation of the HMAC
    const hmacFormat = hmac.digest('hex');

    console.log(hmacFormat);
    console.log(details.payment.razorpay_signature);
    if (hmacFormat == details.payment.razorpay_signature) {
      await Order.findByIdAndUpdate({ _id: details.order.receipt }, { $set: { paymentId: details.payment.razorpay_payment_id } })


      for (let i = 0; i < cartProducts.length; i++) {
        let count = cartProducts[i].quantity
        await Product.findByIdAndUpdate({ _id: cartProducts[i].product_id }, { $inc: { stockQuantity: -count } })
      }

      await Order.findByIdAndUpdate({ _id: details.order.receipt }, { $set: { status: 'placed' } })

      await Order.deleteMany({ status: 'pending', _id: { $ne: details.order.receipt } });


      const userData = await User.findOne({ _id: req.session.userId })
      await Cart.deleteOne({ user_id: userData._id })

      res.json({ success: true, params: details.order.receipt, walletDeduction: walletDeduction })

    } else {
      await Order.findByIdAndDelete({ _id: details.order.receipt })
      res.json({ success: false });
    }


  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
}


const loadWalletHistory = async (req, res) => {
  try {
    const { userId } = req.session
    const userData = await User.findOne({ _id: req.session.userId })

    console.log(req.session.userId);
    const walletHistory = await User.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(userId) } },
      { $project: { wallet_history: 1 } },
      { $unwind: "$wallet_history" },
      { $sort: { "wallet_history.date": -1 } },
    ]);
    console.log('walletHistorires' + walletHistory);
    res.render('wallet', { user: userData, walletHistory })
  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
}

const loadForgetPassword = async (req, res) => {
  try {
    res.render('forgetPassword')
  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
}

const postForgetPassword = async (req, res) => {
  try {

    const userData = await User.findOne({ email: req.body.email })

    const email = req.body.email


    if (userData !== null) {

      if (userData.is_Verified == false) {
        res.render('forgetPassword', { message: 'Please verify your mail' })
        return
      } else {
        const randomString = randomstring.generate();


        const tokenExpiration = new Date();
        tokenExpiration.setMinutes(tokenExpiration.getMinutes() + 5); // Set expiry to 5 minutes from now


        const updatedData = await User.updateOne({ email: email }, { $set: { token: randomString, tokenExpiration: tokenExpiration } })
        sentResetVerificationMail(userData, res, randomString, req)
        res.render('forgetPassword', { message: "Please check your mail to reset your password" })
        return

      }

    } else {
      res.render('forgetPassword', { message: 'User email is incorrect' })
      return
    }



  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
}


const loadVerifyForgetPassword = async (req, res) => {
  try {
    const token = req.query.token
    const tokenData = await User.findOne({ token: token })




    res.render('forget-password', { userId: tokenData._id })

  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
}

const postResetPassword = async (req, res) => {
  try {
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    const userId = req.body.userId;

    if (password === confirmPassword) {
      const user = await User.findById(userId);

      if (user) {
        const passwordMatch = password;

        if (passwordMatch) {
          const secure_password = await securePassword(passwordMatch);

          if (user.tokenExpiration > new Date()) {
            const updatedData = await User.findByIdAndUpdate(
              { _id: userId },
              { $set: { password: secure_password, token: '' } }
            );

            // Example cleanup (remove tokens that are expired)
            const result = await User.updateMany(
              { tokenExpiration: { $lt: new Date() } },
              { $set: { token: '', tokenExpiration: null } }
            );

            res.redirect('/userSignIn');
            return
          } else {
            res.render('forget-password', { message: 'Invalid or expired token', userId });
            return
          }
        } else {
          res.render('forget-password', { message: 'Password doesnt match', userId });
          return
        }
      } else {
        res.render('forget-password', { message: 'User not found', userId });
        return
      }
    } else {
      res.render('forget-password', { message: 'Passwords do not match', userId });
      return

    }
  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
};
const loadAboutUs = async (req, res, next) => {
  try {
    const userId = req.session.userId
    const userData = await User.findOne({ _id: userId })
    res.render('aboutUs', { user: userData })
  } catch (error) {
    console.log(error);
    next(error)
  }
}

const loadContactUs = async (req, res, next) => {
  try {
    const userId = req.session.userId
    const userData = await User.findOne({ _id: userId })
    res.render('contactUs', { user: userData })
  } catch (error) {
    console.log(err);
    next(error)
  }
}

const loadManageAddress = async (req, res, next) => {
  try {
    const userId = req.session.userId

    if (userId) {
      const user = await User.findOne({ _id: userId })
      const addresses = user.address
      console.log(addresses);
      res.render('manageAddress', { user, addresses })
    } else {
      res.redirect('/userSignIn')
    }


  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
}


const loadEditProfile = async (req, res, next) => {
  try {
    const userId = req.session.userId
    if (userId) {
      const user = await User.findOne({ _id: userId })
      res.render('editProfile', { user })
    }

  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
    next(error)
  }
}

const loadInvoice = async (req, res, next) => {
  try {
    const userId = req.query.userId
    const orderId = req.query.orderId

    let sumTotal = 0;
    const order = await Order.findById({ _id: orderId }).populate('items.product_id')
    console.log('orders', order);
    const user = await User.findById({ _id: userId })
    console.log('user', user);
    for (i = 0; i < order.items.length; i++) {
      sumTotal = sumTotal + order.items[i].total_price
    }


    const date = new Date()
    res.render('invoice', { order, user, date, sumTotal })

  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
    next(error)
  }
}

const loadInvoiceDownload = async (req, res, next) => {
  try {
    const orderId = req.query.orderId
    const userId = req.query.userId
    console.log('isdujfijsiorderid', orderId);
    const browser = await puppeteer.launch({ headless: true })
    const page = await browser.newPage()
    await page.goto(`${req.protocol}://${req.get('host')}` + `/invoice?orderId=${orderId}&userId=${userId}`, {
      waitUntil: "networkidle2"
    });

    await page.setViewport({ width: 1680, height: 1050 })
    const todayDate = new Date
    const pdfPath = `${path.join(__dirname, '../public/assets/files', todayDate.getTime() + ".pdf")}`;
    const pdfBuffer = await page.pdf({
      path: pdfPath,
      printBackground: true,
      format: "A4"
    });

    await browser.close()

    const pdfUrl = path.join(__dirname, '../public/assets/files', todayDate.getTime() + ".pdf");

    res.set({
      "Content-Type": "application/pdf",
      "Content-Length": pdfBuffer.length
    })

    res.sendFile(pdfUrl, {}, (err) => {
      if (err) {
        console.log(err);
      } else {
        // Remove the file after sending it
        fs.unlink(pdfPath, (unlinkErr) => {
          if (unlinkErr) {
            console.error(`Error deleting PDF file: ${unlinkErr.message}`);
          } else {
            console.log(`PDF file deleted successfully: ${pdfPath}`);
          }
        });
      }
    });

    // res.download(pdfUrl,function(err){
    //  if(err){
    //   console.log(err);
    //  }
    // })

  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
    next(error)
  }
}


const loadReview = async (req, res, next) => {
  try {


    const productId = req.query.id
    const { userId } = req.session


    const user = await User.findOne({ _id: userId })

    //  const productData=await Product.findOne({_id:productId,'reviews.user_id':{$ne:userId}})
    const orderData = await Order.find({ user_id: userId, 'items.product_id': productId })

    console.log('orderData', orderData);

    let productPurchased = 0

    orderData.forEach((items) => {
      if (items.status == 'delivered') {
        productPurchased = 1
      }

    })


    console.log(productPurchased);

    res.render('review', { user, orderData, productPurchased, productId })

  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
    next(error)
  }
}

const postReview = async (req, res, next) => {
  try {

    // Assuming req.body.verifyData is the URL-encoded string
    const verifyData = querystring.parse(req.body.verifyData);

    // Now you can access the properties
    const { title, description, rate } = verifyData;

    console.log('title', title);
    console.log('description', description);
    console.log('rate', rate);


    const { userId } = req.session
    const productId = req.params.id

    await Product.updateOne({ _id: productId }, { $push: { reviews: { user_id: userId, title: title, description: description, rating: rate, createdAt: new Date() } } })



    res.json({ success: true })

  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
    next(error)
  }
}

const loadEditReview = async (req, res, next) => {
  try {
    const productId = req.query.id
    const { userId } = req.session

    const productsData = await Product.findOne({ _id: productId, 'reviews.user_id': userId })

    const reviewData = productsData.reviews
    console.log('prodata', productsData);
    console.log('reviewData', reviewData);


    const reviewIdData = await Product.findOne(
      { _id: productId, 'reviews.user_id': userId },
      {
        reviews: {
          $elemMatch: { user_id: userId }
        }
      }
    );


    let reviewId;

    if (reviewIdData && reviewIdData.reviews && reviewIdData.reviews.length > 0) {
      reviewId = reviewIdData.reviews[0]._id
    }
    console.log('reviews', reviewId);



    res.render('editReview', { productId, reviewData, reviewId })

  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
    next(error)
  }
}


const postEditReview = async (req, res, next) => {

  try {

    const productId = req.params.id


    console.log('proid', productId);

    const verifyData = querystring.parse(req.body.verifyData)
    const { title, description, rate, reviewId } = verifyData

    console.log('title', title);
    console.log('description', description);
    console.log('rate', rate);
    console.log('revid', reviewId);

    await Product.updateOne(
      { _id: productId, 'reviews._id': reviewId },
      {
        $set: {
          'reviews.$.rating': rate,
          'reviews.$.title': title,
          'reviews.$.description': description
        }
      }
    );



    res.json({ success: true })


  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
    next(error)
  }
}


const postNewsLetter = async (req, res, next) => {
  try {
    console.log('Subscribe');
    let email = req.body.email;
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.AUTH_EMAIL,
        pass: 'gasd cdmy jhlt gnhf'
      },
    });
    const mailDetails = {
      from: process.env.AUTH_EMAIL,
      to: email, // The recipient's email address
      subject: 'Subscription Confirmation', // The subject of the email
      html: `
    <h1>Thank You for Subscribing!</h1>
    <p>Dear ${email},</p>
    <p>We are delighted to have you as part of our community. You will now receive exclusive offers and stay informed about the latest deals and trends for a delightful shopping experience.</p>
    <p>Should you have any questions or concerns, feel free to reach out to us.</p>
    <p>Best regards,<br>Your Shopping Team</p>
  `,
    };
    transporter.sendMail(mailDetails, function (error, info) {
      if (error) {
        next(error);
        res.json({ status: false })
      } else {
        console.log("Subscription Form Email sent successfully", info.response);

        const home = '/';
        return res.redirect(home);
      }
    });


  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
    next(error)
  }
}
module.exports = {
  loadHome,
  loadRegister,
  postRegister,
  loadLogin,
  loadOtp,
  verifyOtp,
  verifyLogin,
  userLogout,
  loginWithOtp,
  verifyLoginWithOtp,
  loadProductList,
  loadEmailVerifyAfter,
  postEmailVerifyAfter,
  loadProductDetail,
  loadProfile,
  loadEditProfileAddress,
  postEditAddress,
  deleteAddress,
  loadProfileNewAddress,
  postProfileNewAddress,
  postEditProfile,
  loadChangePassword,
  postChangePasssword,
  resendOtp,
  verifyPayment,
  loadWalletHistory,
  loadForgetPassword,
  postForgetPassword,
  loadVerifyForgetPassword,
  postResetPassword,
  loadAboutUs,
  loadContactUs,
  loadManageAddress,
  loadEditProfile,
  loadInvoice,
  loadInvoiceDownload,
  loadReview,
  postReview,
  loadEditReview,
  postEditReview,
  postNewsLetter,
  calculateDiscount,
  isNewProduct
};