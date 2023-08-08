const express = require("express");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const Shop = require("../model/shop");
const Event = require("../model/event");
const ErrorHandler = require("../utils/ErrorHandler");
const { isSeller, isAdmin, isAuthenticated } = require("../middleware/auth");
const router = express.Router();
const cloudinary = require("cloudinary");

// create event
router.post(
  "/create-event",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const shopId = req.body.shopId;
      const shop = await Shop.findById(shopId);
      if (!shop) {
        return next(new ErrorHandler("Shop Id is invalid!", 400));
      } else {
        const { description , image /* other event data */ } = req.body;

        const maxDescriptionLength = 400; // Set your desired limit here
        // Check the length of the description
        if (description.length > maxDescriptionLength) {
          return next(new ErrorHandler("Description is too long!", 400));
        }
        let images = [];

        if (typeof req.body.images === "string") {
          images.push(req.body.images);
        } else {
          images = req.body.images;
        }

        const imagesLinks = [];

        for (let i = 0; i < images.length; i++) {
          const result = await cloudinary.v2.uploader.upload(images[i], {
            folder: "products",
          });

          imagesLinks.push({
            public_id: result.public_id,
            url: result.secure_url,
          });
        }

        const eventData = req.body;
        eventData.images = imagesLinks;
        eventData.shop = shop;

        const event = await Event.create(eventData);


        res.status(201).json({
          success: true,
          event,
        });
      }
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);

// get all events with more sold_out
router.get("/get-all-events", async (req, res, next) => {
  try {
    const events = await Event.find({ sold_out: { $gt: 0 } })
      .sort({ sold_out: -1 }) // Sort in descending order of sold_out count
      .limit(10); // You can adjust the limit as needed

    res.status(200).json({
      success: true,
      events,
    });
  } catch (error) {
    return next(new ErrorHandler(error, 400));
  }
});


// get all events of a shop
router.get(
  "/get-all-events/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const events = await Event.find({ shopId: req.params.id });

      res.status(201).json({
        success: true,
        events,
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);

// delete event of a shop
router.delete(
  "/delete-shop-event/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const event = await Event.findById(req.params.id);

      if (!event) {
        return next(new ErrorHandler("Product is not found with this id", 404));
      }

      for (let i = 0; 1 < event.images.length; i++) {
        const result = await cloudinary.v2.uploader.destroy(
          event.images[i].public_id
        );
      }

      await event.deleteOne({ _id: req.params.id });

      res.status(201).json({
        success: true,
        message: "Event Deleted successfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);

// all events --- for admin
router.get(
  "/admin-all-events",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const events = await Event.find().sort({
        createdAt: -1,
      });
      res.status(201).json({
        success: true,
        events,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

module.exports = router;
