const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: [true, "Email is required"], 
    unique: true, // Ensure email is unique
    match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"]
  },
  subscribedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Subscription", subscriptionSchema);
