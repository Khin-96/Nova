const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
  name: { type: String, required: [true, "Name is required"] },
  email: { 
    type: String, 
    required: [true, "Email is required"], 
    match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"]
  },
  message: { type: String, required: [true, "Message is required"] },
  submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Contact", contactSchema);
