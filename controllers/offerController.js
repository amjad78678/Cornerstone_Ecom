const User = require('../models/userModel')
const Category = require('../models/categoryModel')
const Product = require('../models/productModel')
const Order = require('../models/orderModel')
const Coupon = require('../models/couponModel')
const Offer = require('../models/offerModel')
const bcrypt = require('bcrypt')
const path = require('path')



const loadOffer = async (req, res, next) => {
  try {
    const offerData = await Offer.find({})
    res.render('offers', { offerData })
  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
}

const loadAddOffer = async (req, res, next) => {
  try {


    const { message } = req.session
    req.session.message = ''

    res.render('addOffer', { message })
  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
    next(error)
  }
}

const postAddOffer = async (req, res, next) => {
  try {


    console.log(req.body);
    const { name, startingDate, expiryDate, percentage } = req.body


    const exists = await Offer.findOne({ offer_name: name })
    if (exists) {
      req.session.message = 'The offer is already exists'
      res.redirect('/admin/addOffer')
    } else {
      const offer = new Offer({
        offer_name: name,
        startingDate: startingDate,
        expiryDate: expiryDate,
        percentage: percentage

      })
      const offerDate = await offer.save()

      req.session.message = 'Saved offer'

      console.log(req.body);
      res.redirect('/admin/addOffer')

    }





  } catch (error) {
    console.log(error);
    next(error)
  }
}



const postDeleteOffer = async (req, res, next) => {
  try {
    const { offerId } = req.body
    const dltData = await Offer.deleteOne({ _id: offerId })
    res.send({ success: true })
  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
    next(error)
  }
}




const patchApplyProductOffer = async (req, res, next) => {
  try {
    const { offerId, productId } = req.body

    await Product.updateOne({ _id: productId }, { $set: { offer: offerId } })

    res.json({ success: true })
  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
    next(error)
  }
}



const patchRemoveProductOffer = async (req, res, next) => {
  try {
    const { productId } = req.body
    await Product.updateOne({ _id: productId }, { $unset: { offer: '' } })
    res.json({ success: true })
  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
}

const patchApplyCategoryOffer = async (req, res, next) => {
  try {
    const { offerId, categoryId } = req.body
    await Category.updateOne({ _id: categoryId }, { $set: { offer: offerId } })
    res.json({ success: true })
  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
    next(error)
  }
}

const patchRemoveCategoryOffer = async (req, res, next) => {
  try {
    const { categoryId } = req.body
    await Category.updateOne({ _id: categoryId }, { $unset: { offer: '' } })
    res.json({ success: true })
  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
    next(error)
  }
}
module.exports = {
  loadAddOffer,
  postAddOffer,
  loadOffer,
  postDeleteOffer,
  patchApplyProductOffer,
  patchRemoveProductOffer,
  patchApplyCategoryOffer,
  patchRemoveCategoryOffer
}

// fklsjhfgkldsjhfrkgjeshkgf