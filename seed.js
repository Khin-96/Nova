require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./src/models/Product");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/nova-wear";

const sampleProducts = [
  {
    name: "Classic Hoodie",
    category: "Hoodies",
    price: 59.99,
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
  },
  {
    name: "Essential T-Shirt",
    category: "T-Shirts",
    price: 24.99,
    image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=764&q=80",
  },
  {
    name: "Urban Cargo Pants",
    category: "Pants",
    price: 74.99,
    image: "https://images.unsplash.com/photo-1604176354204-9268737828e4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80", // Placeholder image
  },
  {
    name: "Windbreaker Jacket",
    category: "Outerwear",
    price: 89.99,
    image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=736&q=80",
  },
  // Add more products if needed for other sections/testing
];

const seedDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB Connected for seeding...");

    // Clear existing products (optional, good for repeatable seeding)
    await Product.deleteMany({});
    console.log("Existing products cleared.");

    // Insert sample products
    await Product.insertMany(sampleProducts);
    console.log("Sample products inserted.");

  } catch (err) {
    console.error("Error seeding database:", err.message);
  } finally {
    // Disconnect Mongoose
    await mongoose.disconnect();
    console.log("MongoDB disconnected.");
  }
};

seedDB();
