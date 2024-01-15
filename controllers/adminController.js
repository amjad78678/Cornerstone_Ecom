const User = require('../models/userModel')
const Category = require('../models/categoryModel')
const Product = require('../models/productModel')
const Order = require('../models/orderModel')
const Coupon = require('../models/couponModel')
const Offer = require('../models/offerModel')
const bcrypt = require('bcrypt')
const moment = require('moment')
const path = require('path')
const imageSize = require('image-size')
const sharp = require('sharp')
const mongoose = require('mongoose');
const fs = require("fs");
const { OrderedBulkOperation } = require('mongodb');
const { json } = require('body-parser')


const loadAdminLogin = async (req, res) => {
  try {
    res.render('adminLogin')
  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
}


const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const userData = await User.findOne({ email: email });
    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);
      if (passwordMatch) {
        if (userData.is_Admin === 0) {
          res.render('adminLogin', { message: 'Email and password is incorrect' });
        } else {
          req.session.user_id = userData._id;

          res.redirect('/admin/adminHome');
        }
      } else {
        res.render('adminLogin', { message: 'Email and password is incorrect' });
      }
    } else {
      res.render('adminLogin', { message: 'Email and password is incorrect' });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
};


const
  loadAdminHome = async (req, res) => {
    try {


      let currentSalesYear = new Date(new Date().getFullYear(), 0, 1);

      console.log(currentSalesYear);
      let usersByYear = await User.aggregate([{ $match: { createdAt: { $gte: currentSalesYear }, is_Blocked: { $ne: true }, is_Verified: { $ne: false } } }, { $group: { _id: { $dateToString: { format: "%m", date: '$createdAt' } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }])


      usersByYear = usersByYear.map(item => ({ _id: +item._id, count: item.count }));



      let usersData = [];

      for (i = 1; i <= 12; i++) {
        let result = true
        for (j = 0; j < usersByYear.length; j++) {
          result = false
          if (usersByYear[j]._id === i) {
            result = true
            usersData.push(usersByYear[j])
            break;


          } else {
            result = false
          }

        }

        if (result == false) {
          usersData.push({ _id: i, count: 0 })
        }

      }

      console.log(usersData);

      let userdataCount = []

      for (i = 0; i < usersData.length; i++) {
        userdataCount.push(usersData[i].count)
      }

      console.log(userdataCount);





      let userTotalYear = [];
      let userYear = await User.aggregate([
        { $match: { is_Blocked: { $ne: true }, is_Verified: { $ne: false } } },
        { $group: { _id: { $dateToString: { format: "%Y", date: '$createdAt' } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }
      ]);

      console.log('usersyear', userYear);
      for (i = 2023; i <= 2028; i++) {
        let result = true
        for (j = 0; j < userYear.length; j++) {
          result = false
          if (userYear[j]._id == i) {
            result = true
            i++;
            userTotalYear.push(userYear[j])

          } else {
            result = false
          }

        }

        if (result == false) {
          userTotalYear.push({ _id: i, count: 0 })
        }

      }



      userTotalYear = userTotalYear.map(items => ({
        _id: +items._id,
        count: items.count
      }));

      userTotalYear.sort((a, b) => a._id - b._id);
      console.log('userTotalFIDFIDr', userTotalYear)
      let userYearCount = []
      for (i = 0; i < userTotalYear.length; i++) {
        userYearCount.push(userTotalYear[i].count)
      }

      console.log('useriwuieucount', userYearCount);


      let sales = []

      let salesByYear = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: currentSalesYear },
            status: { $nin: ['cancelled', 'pending', 'returned'] }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%m', date: '$createdAt' } },
            total: { $sum: '$total_amount' },
            count: { $sum: 1 }
          }
        }
      ]);

      console.log('salesbyyeara', salesByYear);



      let salesTotalYear = [];
      let salesYear = await Order.aggregate([
        {
          $match: {
            status: { $nin: ['cancelled', 'pending', 'returned'] }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y', date: '$createdAt' }
            },
            total: { $sum: '$total_amount' },
            count: { $sum: 1 }
          }
        }
      ]);

      salesYear = salesYear.map(items => ({
        _id: +items._id,
        total: items.total,
        count: items.count
      }));

      // Sort the array by _id in ascending order
      salesYear.sort((a, b) => a._id - b._id);

      console.log('Sales By Year:', salesYear);



      for (i = 2023; i <= 2030; i++) {
        let result = false
        for (j = 0; j < salesYear.length; j++) {

          if (salesYear[j]._id == i) {
            result = true;
            i++;
            salesTotalYear.push(salesYear[j])
          } else {
            result = false
          }
        }
        if (result == false) {
          salesTotalYear.push({ _id: i, total: 0, count: 0 })
        }
      }

      console.log('salestotalyeargfgds', salesTotalYear);


      for (i = 1; i <= 12; i++) {
        let result = false
        for (j = 0; j < salesByYear.length; j++) {
          if (salesByYear[j]._id == i) {
            result = true
            sales.push(salesByYear[j])
          } else {
            result = false
          }
        }
        if (result == false) {
          sales.push({ _id: i, total: 0, count: 0 })
        }

      }

      let salesYearTotal = []
      for (i = 0; i < salesTotalYear.length; i++) {
        salesYearTotal.push(salesTotalYear[i].total)
      }

      console.log('salesyeartotalkldkf', salesTotalYear);

      console.log(sales);

      let salesdataCount = []
      for (i = 0; i < sales.length; i++) {
        salesdataCount.push(sales[i].total)
      }

      console.log(salesdataCount);


      const profitMargin = 0.5;
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      const latestOrders = await Order.find().sort({ createdAt: -1 }).populate("user_id").limit(10);
      const firstOrders = await Order.find()
        .sort({ createdAt: 1 })

      // console.log('firstOrders', firstOrders);
      let allYearsProfit = await Order.aggregate([
        {
          $match: { status: 'delivered' }
        },
        {
          $group: {
            _id: { $year: '$createdAt' },
            profit: {
              $sum: { $multiply: [profitMargin, '$total_amount'] }
            }
          }
        },
        {
          $sort: {
            _id: 1 // Sort by year in ascending order
          }
        }
      ]);

      console.log('allYearsProfit', allYearsProfit);





      let YearsProfit = [];
      for (i = 2023; i <= 2028; i++) {
        let result = false
        for (j = 0; j < allYearsProfit.length; j++) {

          if (allYearsProfit[j]._id == i) {
            result = true;
            i++;
            YearsProfit.push(allYearsProfit[j])
          } else {
            result = false
          }
        }
        if (result == false) {
          YearsProfit.push({ _id: i, profit: 0 })
        }
      }

      allYearsProfit.forEach(entry => {
        entry.profit = Math.round(entry.profit);
      });

      let allProfitYears = []
      for (i = 0; i < YearsProfit.length; i++) {
        allProfitYears.push(YearsProfit[i].profit)
      }




      console.log('allyearsprofit', YearsProfit);


      const revenue = await Order.aggregate([
        {
          $match: { status: { $ne: 'pending' } },
        },
        { $group: { _id: null, revenue: { $sum: "$total_amount" } } },
      ]);

      console.log(revenue);

      const monthlyEarning = await Order.aggregate([
        { $match: { status: 'delivered', $expr: { $eq: [{ $month: '$createdAt' }, currentMonth] } } },
        { $group: { _id: null, monthProfit: { $sum: '$total_amount' } } }
      ])

      console.log(monthlyEarning);

      const latestUsers = await User.find({}).sort({ createdAt: -1 }).limit(5)
      const pendingOrders = await Order.countDocuments({ status: { $in: ['pending', 'dispatched', 'out for delivery', 'placed'] } })
      const cancelledOrders = await Order.countDocuments({ status: 'cancelled' })
      const placedOrders = await Order.countDocuments({ status: 'placed' })
      const deliveredOrders = await Order.countDocuments({ status: 'delivered' })
      const countProduct = await Product.countDocuments({})
      const countCategory = await Category.countDocuments({})


      const userData = await User.findOne({ _id: req.session.user_id })


      const paymentData = await Order.aggregate([
        { $match: { status: 'delivered' } },
        { $group: { _id: "$payment", count: { $sum: 1 } } }
      ])

      console.log('paymentData', paymentData);

      let paymentMethods = [];
      let paymentCounts = [];

      paymentData.forEach((data) => {
        paymentMethods.push(data._id)
        paymentCounts.push(data.count)
      })


      res.render('adminHome', { admin: userData, userYearCount, allProfitYears, paymentMethods, paymentCounts, salesYearTotal, salesTotalYear, monthlyEarning, cancelledOrders, deliveredOrders, placedOrders, pendingOrders, latestOrders, latestUsers, countProduct, countCategory, salesdataCount, userdataCount, revenue, moment, })


    } catch (error) {
      console.log(error.message);
      res.status(500).render('serverError', { message: error.message });
    }
  }
const logout = async (req, res) => {
  try {
    req.session.destroy();
    res.redirect('/admin');
  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
};



loadUsers = async (req, res) => {
  try {
    // var search = '';

    // if (req.query.Search) {
    //   search = req.query.Search;
    // }

    // const page=parseInt(req.query.userPage)||1;
    // const pageSize=10

    // const regex=new RegExp(search,'i')


    // const count = await User.find({
    //   is_Admin: 0,
    //   $or: [
    //     { userName: { $regex: regex } },
    //     { email: { $regex: regex } },
    //     { mobileNumber: { $regex: regex } },
    //   ],
    // }).countDocuments()


    // const totalPages = Math.ceil(count / pageSize);
    // const skip = (page - 1) * pageSize;



    // const usersData = await User.find({
    //   is_Admin: 0,
    //   $or: [
    //     { userName: { $regex: regex } },
    //     { email: { $regex: regex } },
    //     { mobileNumber: { $regex: regex } },
    //   ],
    // }).skip(skip).limit(pageSize)


    // res.render('users', { users : usersData,totalPages,currentPage:page });

    const usersData = await User.find({ is_Admin: 0 }).sort({ createdAt: -1 })
    if (usersData) {
      res.render('users', { users: usersData });
    }


  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
}



const loadCategory = async (req, res) => {
  try {
    var search = ''
    if (req.query.Search) {
      search = req.query.Search
    }

    const regex = new RegExp(search, 'i')

    const cateData = await Category.find({
      $or: [
        { name: { $regex: regex } },
        { description: { $regex: regex } },
      ],
    });

    const availableOffers = await Offer.find({ expiryDate: { $gte: Date.now() } })


    res.render('category', { categ: cateData, availableOffers, moment })


  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
}



const loadAddCategory = async (req, res) => {
  try {
    res.render('addCategory')
  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
}
const postAddCategory = async (req, res) => {
  try {
    const name = req.body.name
    const description = req.body.description

    if (!name || !description) {
      return res.render('addCategory', { message: 'Invalid data provided' });
    }
    const cateData = await Category.find({ name: { $regex: new RegExp(name, 'i') } })
    if (cateData.length > 0) {
      res.render('addCategory', { message: 'The category already exists' })
    } else {
      const cate = new Category({
        name: name,
        description: description,
        is_Listed: true

      })

      let cateData = await cate.save()
      if (cateData) {

        res.redirect('/admin/category')
      }

    }


  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
}
const loadEditCategory = async (req, res) => {
  try {
    const id = req.query.id
    const cateData = await Category.findOne({ _id: id })
    console.log(cateData);

    if (!cateData) {
      res.render('editCategory', { message: 'Data Not Found' })
    } else {
      res.render('editCategory', { categ: cateData })
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
}

const postEditCategory = async (req, res) => {
  try {

    let existData = await Category.findOne({ name: { $regex: new RegExp(req.body.name, 'i') }, _id: { $ne: req.body.id } })
    console.log(existData);
    if (!existData) {
      await Category.findByIdAndUpdate({ _id: req.body.id }, { name: req.body.name, description: req.body.description })
      res.redirect('/admin/category')
    } else {
      const cateData = await Category.findOne({ _id: req.body.id })

      res.render('editCategory', { message: 'Already exists category', categ: cateData || null })
    }



  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
}
const listingCategory = async (req, res) => {
  try {
    const id = req.params.id;
    const updateUser = await Category.findByIdAndUpdate(id, { is_Listed: true }, { new: true });
    if (!updateUser) {
      return res.status(404).send('Category not found');
    }
    res.status(200).json(updateUser);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Internal Server Error');
  }
};

const unlistingCategory = async (req, res) => {
  try {
    const id = req.params.id;
    const updateUser = await Category.findByIdAndUpdate(id, { is_Listed: false }, { new: true });
    if (!updateUser) {
      return res.status(404).send('Category not found');
    }
    res.status(200).json(updateUser);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Internal Server Error');
  }
};

const deleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;

    // Step 1: Find the category to get its name
    const category = await Category.findOne({ _id: categoryId });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Step 2: Delete the category document
    await Category.deleteOne({ _id: categoryId });

    // Step 3: Find and delete all products associated with the category
    const products = await Product.find({ category: category.name });
    console.log('products', products);
    // Loop through products to get image filenames
    const imageFilenames = products.map((product) => product.imageUrl).flat();

    console.log('imagefilename', imageFilenames);

    // Delete all products associated with the category
    await Product.deleteMany({ category: category.name });

    // Step 4: Loop through the list of image filenames and unlink each file
    for (const filename of imageFilenames) {
      const imagePath = path.join(__dirname, '..', 'public', 'assetsAdmin', 'imgs', 'products', 'resized', filename);

      // Check if the file exists before attempting to unlink
      try {
        await fs.unlink(imagePath, () => { });
        console.log(`Image ${filename} deleted successfully.`);
      } catch (err) {
        console.error(`Error deleting image ${filename}: ${err.message}`);
      }
    }
    for (const filename of imageFilenames) {
      const imagePath = path.join(__dirname, '..', 'public', 'assetsAdmin', 'imgs', 'products', filename);

      // Check if the file exists before attempting to unlink
      try {
        await fs.unlink(imagePath, () => { });
        console.log(`Image ${filename} deleted successfully.`);
      } catch (err) {
        console.error(`Error deleting image ${filename}: ${err.message}`);
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};



const loadProducts = async (req, res) => {
  try {
    const product = await Product.find({}).sort({ createdAt: -1 })
    const availableOffers = await Offer.find({ expiryDate: { $gte: new Date() } })
    res.render('products', { product: product, availableOffers, moment })
  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
}

const loadAddProduct = async (req, res) => {
  try {

    const category = await Category.find({})
    const message = req.session.message
    req.session.message = ''
    res.render('addProduct', { category: category, message })
  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
}


const postAddProduct = async (req, res) => {
  try {

    console.log('iambodysdhsudhsuhdh', req.body)

    console.log('reqfiles', req.files)

    console.log('iamcategory', req.body.category)


    const categoryData = await Category.findOne({ name: req.body.category })

    const name = req.body.name
    const description = req.body.description

    const resizedImages = [];
    for (let i = 0; i < req.files.length; i++) {
      const originalPath = req.files[i].path;
      const resizedPath = path.join(__dirname, "../public/assetsAdmin/imgs/products/resized", req.files[i].filename);

      console.log('Original path:', originalPath);
      await sharp(originalPath).resize(840, 840, { fit: "fill" }).toFile(resizedPath);
      console.log('Resized path:', resizedPath);

      resizedImages[i] = req.files[i].filename;

    }



    console.log('resizedimage', resizedImages);

    const price = req.body.price
    const wood = req.body.wood
    const quantity = req.body.quantity
    const category = req.body.category


    if (req.files.length !== 5 || req.files.length > 5) {

      req.session.message = 'only 5 images allowed'
      res.redirect('/admin/addProduct')



    } else {
      const product = new Product({
        name: name,
        description: description,
        imageUrl: resizedImages,
        price: price,
        wood: wood,
        stockQuantity: quantity,
        category: category,
        categoryId: categoryData._id,
        date: formatDate(Date.now()), // Format the date
        is_Listed: true

      })


      //format our date
      function formatDate(timestamp) {
        const date = new Date(timestamp);

        // Extracting date, month, and year
        const day = date.getDate();
        const month = date.getMonth() + 1; // Months are zero-based
        const year = date.getFullYear();

        // Formatting as "dd/mm/yyyy" (you can adjust the format as needed)
        const formattedDate = `${day}/${month}/${year}`;

        return formattedDate;
      }



      let productData = await product.save()

      if (!productData) {
        res.render('addProduct', { message: 'Invalid input' })
      } else {
        res.json({ success: true })
      }


    }




  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
}


const listingProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const updateProduct = await Product.findByIdAndUpdate(id, { is_Listed: true }, { new: true });
    if (!updateProduct) {
      return res.status(404).send('Category not found');
    }
    res.status(200).json(updateProduct);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Internal Server Error');
  }
}


const unlistingProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const updateProduct = await Product.findByIdAndUpdate(id, { is_Listed: false }, { new: true });
    if (!updateProduct) {
      return res.status(404).send('Category not found');
    }
    res.status(200).json(updateProduct);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Internal Server Error');
  }
}

const loadEditProduct = async (req, res) => {
  try {
    const id = req.query.id
    const productData = await Product.findOne({ _id: id })
    const category = await Category.find({})
    res.render('editProduct', { product: productData, categ: category })
  } catch (error) {

  }
}


const postEditProduct = async (req, res) => {
  try {


    const product = await Product.findOne({ _id: req.body.id })
    const categ = await Product.find({ is_Listed: 1 })


    console.log('files', req.files.length);



    if (req.files) {
      const existingCount = (await Product.findById(req.body.id)).imageUrl.length
      console.log('existCount' + existingCount);
      if (existingCount + req.files.length !== 5 || existingCount + req.files.length > 5) {
        res.json({ limited: true, message: 'Only 5 images allowed' })
      } else {



        const resizedImages = [];
        for (let i = 0; i < req.files.length; i++) {
          const originalPath = req.files[i].path;
          const resizedPath = path.join(__dirname, "../public/assetsAdmin/imgs/products/resized", req.files[i].filename);

          console.log('Original path:', originalPath);
          await sharp(originalPath).resize(840, 840, { fit: "fill" }).toFile(resizedPath);
          console.log('Resized path:', resizedPath);

          resizedImages[i] = req.files[i].filename;
        }



        console.log('resizedimage', resizedImages);



        await Product.findByIdAndUpdate(
          { _id: req.body.id },
          {
            $push: { imageUrl: { $each: resizedImages } },
            name: req.body.name,
            description: req.body.description,
            price: req.body.price,
            category: req.body.category,
            stockQuantity: req.body.quantity,
            wood: req.body.wood
          }
        );

        res.json({ success: true })


      }
    }


  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
}

const deleteProducts = async (req, res) => {
  try {
    console.log(req.params);
    const productId = req.params.id


    // Step 1: Retrieve the list of image filenames
    const product = await Product.findById(productId);
    const imageFilenames = product.imageUrl || [];

    console.log('iamgefilenames' + imageFilenames);

    // Step 2: Delete the product document from the database
    await Product.deleteOne({ _id: productId });

    // Step 3: Loop through the list of image filenames and unlink each file
    for (const filename of imageFilenames) {
      const imagePath = path.join(__dirname, '..', 'public', 'assetsAdmin', 'imgs', 'products', 'resized', filename);

      // Check if the file exists before attempting to unlink
      try {
        await fs.unlink(imagePath, () => { });
        console.log(`Image ${filename} deleted successfully.`);
      } catch (err) {
        console.error(`Error deleting image ${filename}: ${err.message}`);
      }
    }
    for (const filename of imageFilenames) {
      const imagePath = path.join(__dirname, '..', 'public', 'assetsAdmin', 'imgs', 'products', filename);

      // Check if the file exists before attempting to unlink
      try {
        await fs.unlink(imagePath, () => { });
        console.log(`Image ${filename} deleted successfully.`);
      } catch (err) {
        console.error(`Error deleting image ${filename}: ${err.message}`);
      }
    }


  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
}

const loadLogout = async (req, res) => {
  try {
    req.session.destroy()
    res.redirect('/admin/')
  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
}

const loadOrders = async (req, res) => {
  try {
    const user_id = req.session.user_id
    const orderData = await Order.aggregate([{ $match: { status: { $ne: 'pending' } } }, { $sort: { createdAt: -1 } }, {
      $lookup: {
        from: 'products',  // Replace with the actual name of the collection to populate from
        localField: 'items.product_id',
        foreignField: '_id',
        as: 'amjad',
      },
    },])

    console.log(orderData);
    res.render('orders', { orderData })
  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
}

const updatedStatus = async (req, res) => {
  try {
    const { status, orderId } = req.body;
    await Order.updateOne({ _id: orderId }, { $set: { status: status } });

    if (status === 'cancelled' || 'returned') {
      const orderData = await Order.findOne({ _id: orderId }).populate('items.product_id');
      for (let i = 0; i < orderData.items.length; i++) {
        const productId = orderData.items[i].product_id._id;
        const productQuantity = orderData.items[i].quantity;
        await Product.updateOne({ _id: productId }, { $inc: { stockQuantity: -productQuantity } });
      }
    }

    res.send({ success: true });
  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
    res.status(500).send({ success: false, message: 'Internal server error.' });
  }
};



const loadOrderDetails = async (req, res) => {
  try {


    const orderId = req.query.id

    const orderData = await Order.findOne({ _id: orderId }).populate('items.product_id').populate('user_id')
    await Coupon.findOne()
    console.log('orderData' + orderData);
    res.render('orderDetails', { orderData })
  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
}

const postDeleteImg = async (req, res) => {
  try {
    const { productId, img, index } = req.body
    console.log(productId + img + index);

    fs.unlink(path.join(__dirname, '..', 'public', 'assetsAdmin', 'imgs', 'products', 'resized', img), () => { })
    await Product.updateOne({ _id: productId }, { $pull: { imageUrl: img } })
    fs.unlink(path.join(__dirname, '..', 'public', 'assetsAdmin', 'imgs', 'products', img), () => { })
    await Product.updateOne({ _id: productId }, { $pull: { imageUrl: img } })
    res.send({ success: true })
  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
}

const postOrderStatus = async (req, res) => {
  try {
    console.log('boduyiam', req.body);
    const orderId = req.body.orderId

    const status = req.body.status

    await Order.updateOne({ _id: orderId }, { $set: { status: status } })
    res.send({ success: true })

  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
}

const postCancelOrder = async (req, res) => {
  try {
    const orderId = req.body.orderId
    const status = 'cancelled'
    await Order.updateOne({ _id: orderId }, { $set: { status: status } })
    res.send({ success: true })

  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
}


const postApproveReturn = async (req, res) => {
  try {
    const { orderId } = req.body
    const orderData = await Order.findById({ _id: orderId })
    const status = 'returned'
    const userId = orderData.user_id
    const userData = await User.findById({ _id: userId })

    let orderTotal = Math.round(orderData.total_amount)

    await User.findByIdAndUpdate(
      { _id: userId },
      {
        $inc: { wallet: orderTotal },
        $push: {
          wallet_history: {
            date: new Date(),
            amount: orderTotal,
            description: 'Order return refund'
          }
        }
      },
    );


    await Order.findByIdAndUpdate({ _id: orderId }, { $set: { status: status } })

    res.send({ success: true })
  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
}


const loadSalesReport = async (req, res, next) => {
  try {

    const firstOrder = await Order.findOne({}).sort({ createdAt: 1 })
    const lastOrder = await Order.findOne({}).sort({ createdAt: -1 })
    console.log(firstOrder);
    console.log(lastOrder);
    const salesReport = await Order.find({ status: 'delivered' }).populate('user_id').sort({ createdAt: -1 })

    res.render('salesReport', { moment, firstOrderDate: moment(firstOrder.createdAt).format('YYYY-MM-DD'), lastOrderDate: moment(lastOrder.createdAt).format('YYYY-MM-DD'), salesReport })
  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
}

const postSalesReport = async (req, res) => {
  try {

    console.log(req.body);
    const { startDate, endDate } = req.body
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    startDateObj.setHours(0, 0, 0, 0);
    endDateObj.setHours(23, 59, 59, 999);

    const selectedOrder = await Order.find({ status: 'delivered', createdAt: { $gte: startDateObj, $lte: endDateObj } }).populate({ path: 'user_id' })
    console.log('selecteddate', selectedOrder);

    res.json({ success: true, selectedOrder })
  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
  }
}


const postChangeUserStatus = async (req, res, next) => {
  try {

    const { userId } = req.body
    await User.updateOne({ _id: userId }, { $set: { is_Blocked: true } })
    res.json({ success: true })

  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
    next(error)
  }
}
const postUnblockUser = async (req, res, next) => {
  try {
    const { userId } = req.body
    await User.updateOne({ _id: userId }, { $set: { is_Blocked: false } })
    res.json({ unblocked: true })

  } catch (error) {
    console.log(error.message);
    res.status(500).render('serverError', { message: error.message });
    next(error)
  }
}

module.exports = {
  loadAdminHome,
  loadAdminLogin,
  verifyLogin,
  logout,
  loadProducts,
  loadUsers,
  loadCategory,
  loadAddCategory,
  postAddCategory,
  loadEditCategory,
  postEditCategory,
  listingCategory,
  unlistingCategory,
  deleteCategory,
  loadAddProduct,
  postAddProduct,
  listingProduct,
  unlistingProduct,
  loadEditProduct,
  postEditProduct,
  deleteProducts,
  loadLogout,
  loadOrders,
  updatedStatus,
  loadOrderDetails,
  postDeleteImg,
  postOrderStatus,
  postCancelOrder,
  postApproveReturn,
  loadSalesReport,
  postSalesReport,
  postChangeUserStatus,
  postUnblockUser
}