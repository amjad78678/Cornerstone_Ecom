const Coupon = require('../models/couponModel')
const User = require('../models/userModel')



const loadCoupon = async (req, res) => {
  try {
    const couponData = await Coupon.find({})
    res.render('coupon', { couponData })
  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
}

const loadAddCoupon = async (req, res) => {
  try {
    res.render('addCoupon')
  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
}

const postAddCoupon = async (req, res) => {
  try {
    console.log(req.body);
    const { name, couponCode, couponDescription, couponAvailability, discountAmount, minAmount, expiryDate } = req.body


    const existCoupon = await Coupon.findOne({
      couponCode: { $regex: new RegExp(couponCode), $options: 'i' }
    });

    if (existCoupon) {
      res.send({ success: false, message: 'Coupon code already exists' })
    } else {
      const coupon = new Coupon({
        couponName: name,
        couponCode: couponCode.toUpperCase(),
        discountAmount: discountAmount,
        minAmount: minAmount,
        couponDescription: couponDescription,
        Availability: couponAvailability,
        expiryDate: expiryDate,
        status: true

      })



      const couponData = await coupon.save()


      return res.send({ success: true, message: 'Saved the coupon' })

    }

  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
}


const deleteCoupon = async (req, res) => {
  try {

    const { couponId } = req.body

    await Coupon.deleteOne({ _id: couponId })

    res.send({ success: true })

  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
}


module.exports = {
  loadCoupon,
  loadAddCoupon,
  postAddCoupon,
  deleteCoupon,

}