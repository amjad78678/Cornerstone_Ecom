const User = require("../models/userModel");
const Category = require("../models/categoryModel");
const Product = require("../models/productModel");
const Order = require("../models/orderModel");
const Banner = require("../models/bannerModel");
const Coupon = require("../models/couponModel");
const Offer = require("../models/offerModel");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const { default: mongoose } = require("mongoose");

const loadBanner = async (req, res, next) => {
  try {
    const bannerData = await Banner.find({});

    res.render("banner", { banner: bannerData });
  } catch (error) {
    console.log(error.message);
    res.status(500).render("serverError", { message: error.message });
    next(error);
  }
};
const loadAddBanner = async (req, res, next) => {
  try {
    const { message } = req.session;
    req.session.message = null;
    res.render("addBanner", { message });
  } catch (error) {
    console.log(error.message);
    res.status(500).render("serverError", { message: error.message });
    next(error);
  }
};

const postAddBanner = async (req, res, next) => {
  try {
    const { title, bannerDescription, bannerEvent } = req.body;
    console.log(req.files);
    console.log(req.body);
    const existingBanner = await Banner.findOne({ title: title });

    if (existingBanner) {
      req.session.message = "Banner already exist";
      res.redirect("/admin/addBanner");
    } else {
      const imageArr = [];

      if (req.files && req.files.length > 0) {
        for (i = 0; i < req.files.length; i++) {
          const filePath = path.join(
            __dirname,
            "../public/resizedImages",
            req.files[i].filename
          );
          await sharp(req.files[i].path)
            .resize({ width: 1920, height: 500 })
            .toFile(filePath);
          imageArr.push(req.files[i].filename);
          fs.unlinkSync(req.files[i].path);
        }
      }

      console.log("imgArr", imageArr);

      function capitalizeFirstLetter(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
      }
      const newBanner = new Banner({
        title: title.toUpperCase(),
        description: capitalizeFirstLetter(bannerDescription).trim(),
        event: capitalizeFirstLetter(bannerEvent),
        image: imageArr,
        status: true,
      });

      await newBanner.save();
      res.redirect("/admin/banners");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).render("serverError", { message: error.message });
    next(error);
  }
};

const loadEditBanner = async (req, res, next) => {
  try {
    const bannerId = req.query.id;
    const bannerData = await Banner.findOne({ _id: bannerId });
    console.log("its bannerData", bannerData);
    res.render("editBanner", { banner: bannerData });
  } catch (error) {
    console.log(error.message);
    res.status(500).render("serverError", { message: error.message });
    next(error);
  }
};

const patchDeleteBanner = async (req, res, next) => {
  try {
    const bannerId = req.body.bannerId;

    // Step 1: Retrieve the banner data
    const bannerData = await Banner.findById(bannerId);

    // Step 2: Delete the document from the database
    await Banner.deleteOne({ _id: bannerId });

    // Step 3: Unlink associated image files
    const imageFilenames = bannerData.image;
    console.log("filenames", imageFilenames);

    // Assuming your images are in the "public/assetsAdmin/imgs/banners" directory
    const imageFolderPath = path.join(
      __dirname,
      "../public/assetsAdmin/imgs/banners"
    );

    for (const filename of imageFilenames) {
      const imagePath = path.join(imageFolderPath, filename);
      await fs.promises.unlink(imagePath);
      console.log(`Image ${filename} deleted successfully.`);
    }

    // Assuming your images are in the "public/assetsAdmin/imgs/banners" directory
    const resizedFolder = path.join(
      __dirname,
      "../public/assetsAdmin/imgs/products"
    );

    for (const filename of imageFilenames) {
      const imagePath = path.join(resizedFolder, filename);
      await fs.promises.unlink(imagePath);
      console.log(`Image ${filename} deleted successfully.`);
    }

    res.json({ success: true });
  } catch (error) {
    console.log(error.message);
    res.status(500).render("serverError", { message: error.message });
    next(error);
  }
};

const postEditBanner = async (req, res, next) => {
  try {
    const { banner_id, banner_title, banner_description, banner_event } =
      req.body;

    const existingBanner = await Banner.findById(banner_id);
    if (!existingBanner) {
      return res
        .status(404)
        .json({ success: false, message: "Banner not found" });
    }

    if (req.files && req.files.length > 0) {
      const oldImageFilenames = existingBanner.image;
      const bannerImageFolderPath = path.join(
        __dirname,
        "../public/resizedImages"
      );
      const productImageFolderPath = path.join(
        __dirname,
        "../public/resizedImages"
      );

      for (const filename of oldImageFilenames) {
        const bannerImagePath = path.join(bannerImageFolderPath, filename);
        const productImagePath = path.join(productImageFolderPath, filename);

        try {
          await fs.promises.access(bannerImagePath);
          await fs.promises.unlink(bannerImagePath);
          console.log(`Old banner image ${filename} deleted successfully.`);
        } catch (err) {
          if (err.code !== "ENOENT") {
            console.error(`Error deleting banner image ${filename}:`, err);
          }
        }

        try {
          await fs.promises.access(productImagePath);
          await fs.promises.unlink(productImagePath);
          console.log(`Old product image ${filename} deleted successfully.`);
        } catch (err) {
          if (err.code !== "ENOENT") {
            console.error(`Error deleting product image ${filename}:`, err);
          }
        }
      }
    }

    const imageArr = [];
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const filePath = path.join(
          __dirname,
          "../public/resizedImages",
          req.files[i].filename
        );
        await sharp(req.files[i].path)
          .resize({ width: 1920, height: 500 })
          .toFile(filePath);
        imageArr.push(req.files[i].filename);
        fs.unlinkSync(req.files[i].path);
      }
    }

    function capitalizeFirstLetter(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    }

    console.log("imageArr", imageArr);
    if (req.files && req.files.length > 0) {
      console.log("inside reqfiles");
      await Banner.updateOne(
        { _id: banner_id },
        {
          $set: {
            title: banner_title.toUpperCase(),
            description: capitalizeFirstLetter(banner_description).trim(),
            event: capitalizeFirstLetter(banner_event),
            image: imageArr,
          },
        }
      );
      res.redirect("/admin/banners");
    } else {
      await Banner.updateOne(
        { _id: banner_id },
        {
          $set: {
            title: banner_title.toUpperCase(),
            description: capitalizeFirstLetter(banner_description).trim(),
            event: capitalizeFirstLetter(banner_event),
          },
        }
      );
      res.redirect("/admin/banners");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).render("serverError", { message: error.message });
    next(error);
  }
};

module.exports = {
  loadBanner,
  loadAddBanner,
  postAddBanner,
  loadEditBanner,
  patchDeleteBanner,
  postEditBanner,
};
