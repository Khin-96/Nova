const express = require("express");
const Subscription = require("../models/Subscription");

const router = express.Router();

// @route   POST /api/subscribe
// @desc    Subscribe to newsletter
// @access  Public
router.post("/subscribe", async (req, res) => {
  const { email } = req.body;

  try {
    // Basic validation (Mongoose schema handles more specific validation)
    if (!email) {
      return res.status(400).json({ msg: "Please provide an email address." });
    }

    // Check if email already exists (handled by unique index, but good to check)
    const existingSubscription = await Subscription.findOne({ email });
    if (existingSubscription) {
      return res.status(400).json({ msg: "This email is already subscribed." });
    }

    const newSubscription = new Subscription({ email });
    await newSubscription.save();

    res.status(201).json({ msg: "Successfully subscribed to the newsletter!" });

  } catch (err) {
    console.error("Error saving subscription:", err.message);
    // Handle validation errors specifically
    if (err.name === 'ValidationError') {
        let errors = {};
        Object.keys(err.errors).forEach((key) => {
            errors[key] = err.errors[key].message;
        });
        const firstError = Object.values(errors)[0];
        return res.status(400).json({ msg: firstError || "Validation failed. Please provide a valid email." });
    } 
    // Handle duplicate key error (though checked above, this is a safety net)
    if (err.code === 11000) {
        return res.status(400).json({ msg: "This email is already subscribed." });
    }
    res.status(500).json({ msg: "Server Error: Could not subscribe." });
  }
});

module.exports = router;
