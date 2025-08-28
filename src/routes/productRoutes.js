const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const multer = require("multer");
const cloudinary = require("cloudinary").v2; // Import v2
const { CloudinaryStorage } = require("multer-storage-cloudinary"); // Import CloudinaryStorage

// Configure Cloudinary (reads from environment variables automatically if set on Render)
// Ensure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET are set in Render Env Vars
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer to use Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "novawear_products", // Optional: folder name in Cloudinary
    allowed_formats: ["jpg", "png", "jpeg", "gif"], // Specify allowed image formats
    // transformation: [{ width: 500, height: 500, crop: "limit" }] // Optional: transformations
  },
});

// Initialize Multer with Cloudinary storage
const upload = multer({ 
  storage: storage, 
  limits: { fileSize: 1024 * 1024 * 5 } // Limit file size to 5MB (optional)
}); 

// --- Product API Routes ---

// @route   GET /api/products/featured
// @desc    Get featured products (limit to 34 for the homepage)
// @access  Public
router.get("/products/featured", async (req, res) => {
  try {
    const products = await Product.find().limit(34);
    res.json(products);
  } catch (err) {
    console.error("Error fetching featured products:", err.message);
    res.status(500).json({ msg: "Server Error: Could not fetch products" });
  }
});

// @route   POST /api/products
// @desc    Create a new product with image upload to Cloudinary
// @access  Private (should be protected in a real app)
router.post("/products", upload.single("productImage"), async (req, res) => {
  try {
    // Check if file was uploaded by Multer/Cloudinary
    if (!req.file) {
      return res.status(400).json({ msg: "Product image is required." });
    }

    const { name, description, price, category, sizes, tags } = req.body;

    // Basic validation for required text fields
    if (!name || !category || !price) {
      // If upload succeeded but text fields missing, consider deleting uploaded image from Cloudinary
      // await cloudinary.uploader.destroy(req.file.filename); // filename might be public_id depending on config
      return res.status(400).json({ msg: "Please fill in all required fields (name, category, price)." });
    }

    // FIX: Construct productData carefully to allow Mongoose defaults and handle form data for description, tags, sizes
    const productData = {
      name,
      category,
      price: parseFloat(price),
      image: req.file.path, // From multer/Cloudinary
      imagePublicId: req.file.filename // From multer/Cloudinary
    };

    if (description !== undefined) {
      productData.description = description;
    }
    // For tags, FormData sends an array if multiple checkboxes are checked,
    // a single string if one is checked, or undefined if none are checked.
    if (tags !== undefined) {
      productData.tags = Array.isArray(tags) ? tags : [tags]; // Ensure tags is an array
    }
    // For sizes, similar logic. If undefined, Mongoose default will apply.
    if (sizes !== undefined) {
      productData.sizes = Array.isArray(sizes) ? sizes : [sizes]; // Ensure sizes is an array
    }

    const newProduct = new Product(productData);

    const product = await newProduct.save();
    res.status(201).json(product);

  } catch (err) {
    console.error("Error creating product:", err.message);
    // If error occurred after upload, attempt to delete from Cloudinary
    if (req.file && req.file.filename) {
        try {
            await cloudinary.uploader.destroy(req.file.filename);
            console.log("Cleaned up uploaded image from Cloudinary due to error.");
        } catch (cleanupErr) {
            console.error("Error cleaning up Cloudinary image:", cleanupErr);
        }
    }
    
    // Handle specific errors
    if (err.name === 'ValidationError') {
        let errors = {};
        Object.keys(err.errors).forEach((key) => {
            errors[key] = err.errors[key].message;
        });
        const firstError = Object.values(errors)[0];
        return res.status(400).json({ msg: firstError || "Validation failed. Please check your input." });
    }
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ msg: `File upload error: ${err.message}` });
    }
    // Handle Cloudinary errors (might need more specific checks based on Cloudinary SDK errors)
    if (err.message.includes("Cloudinary")) {
        return res.status(500).json({ msg: `Image upload failed: ${err.message}` });
    }
    res.status(500).json({ msg: "Server Error: Could not create product." });
  }
});

// @route   GET /api/products
// @desc    Get all products, optionally filtered by category or search term
// @access  Public
router.get("/products", async (req, res) => {
  const { category, search } = req.query; 
  let query = {};

  if (category && category !== 'all') {
    // FIX: Make category matching case-insensitive and use categories from the Product schema or a broader list
    // For now, we'll assume categories are stored as they are sent from frontend (lowercase)
    query.category = { $regex: new RegExp(`^${category}$`, 'i') };
  }

  if (search) {
    const searchRegex = { $regex: search, $options: 'i' }; 
    const searchConditions = { $or: [{ name: searchRegex }, { category: searchRegex }, { description: searchRegex }] }; // Search name, category, description
    
    if (Object.keys(query).length > 0) { // If category filter exists
        query = { $and: [query, searchConditions] };
    } else {
        query = searchConditions;
    }
  }

  try {
    const products = await Product.find(query).sort({ createdAt: -1 }); // Sort by newest first
    res.json(products);
  } catch (err) {
    console.error("Error fetching products:", err.message);
    res.status(500).json({ msg: "Server Error: Could not fetch products" });
  }
});

// @route   GET /api/products/:id
// @desc    Get a single product by ID
// @access  Public
router.get("/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ msg: "Product not found" });
    }
    res.json(product);
  } catch (err) {
    console.error("Error fetching product by ID:", err.message);
    if (err.kind === 'ObjectId') {
        return res.status(400).json({ msg: "Invalid Product ID format" });
    }
    res.status(500).json({ msg: "Server Error: Could not fetch product" });
  }
});

// @route   PUT /api/products/:id
// @desc    Update a product (including image)
// @access  Private (should be protected)
router.put("/products/:id", upload.single("productImage"), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ msg: "Product not found" });
    }

    const { name, description, price, category, sizes, tags } = req.body;
    const updateData = {};

    // Update text fields if provided
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (price) updateData.price = parseFloat(price);
    if (category) updateData.category = category;
    // Update sizes/tags if provided (handle string/array)
    if (sizes) updateData.sizes = typeof sizes === 'string' ? sizes.split(',').map(s => s.trim()).filter(s => s) : (Array.isArray(sizes) ? sizes : product.sizes);
    if (tags) updateData.tags = typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(t => t) : (Array.isArray(tags) ? tags : product.tags);

    let oldImagePublicId = product.imagePublicId; // Store old image ID for potential deletion

    // Check if a new image file was uploaded
    if (req.file) {
      updateData.image = req.file.path; // New Cloudinary URL
      updateData.imagePublicId = req.file.filename; // New public_id
    } else {
      // If no new file, keep existing image fields (no change needed in updateData for image)
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0 && !req.file) {
        return res.status(400).json({ msg: "No update data or new image provided." });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true } // Return updated doc, run schema validators
    );

    // If update was successful AND a new image was uploaded AND there was an old image, delete old image from Cloudinary
    if (updatedProduct && req.file && oldImagePublicId) {
        try {
            await cloudinary.uploader.destroy(oldImagePublicId);
            console.log("Successfully deleted old image from Cloudinary:", oldImagePublicId);
        } catch (deleteErr) {
            console.error("Error deleting old image from Cloudinary:", deleteErr);
            // Don't fail the request, but log the error
        }
    }

    res.json(updatedProduct);

  } catch (err) {
    console.error("Error updating product:", err.message);
    // If error occurred after new upload, attempt to delete newly uploaded image
    if (req.file && req.file.filename) {
        try {
            await cloudinary.uploader.destroy(req.file.filename);
            console.log("Cleaned up newly uploaded image from Cloudinary due to update error.");
        } catch (cleanupErr) {
            console.error("Error cleaning up new Cloudinary image after update failure:", cleanupErr);
        }
    }
    
    if (err.kind === 'ObjectId') {
        return res.status(400).json({ msg: "Invalid Product ID format" });
    }
    if (err.name === 'ValidationError') {
        let errors = {};
        Object.keys(err.errors).forEach((key) => {
            errors[key] = err.errors[key].message;
        });
        const firstError = Object.values(errors)[0];
        return res.status(400).json({ msg: firstError || "Validation failed. Please check your input." });
    }
    res.status(500).json({ msg: "Server Error: Could not update product" });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete a product
// @access  Private (should be protected)
router.delete("/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ msg: "Product not found" });
    }

    // Get the public_id for Cloudinary deletion before deleting the product from DB
    const imagePublicId = product.imagePublicId;

    await Product.findByIdAndDelete(req.params.id);

    // If deletion from DB was successful and there was an imagePublicId, delete from Cloudinary
    if (imagePublicId) {
        try {
            await cloudinary.uploader.destroy(imagePublicId);
            console.log("Successfully deleted image from Cloudinary:", imagePublicId);
        } catch (deleteErr) {
            console.error("Error deleting image from Cloudinary:", deleteErr);
            // Don't fail the request, but log the error
        }
    }

    res.json({ msg: "Product removed successfully" });

  } catch (err) {
    console.error("Error deleting product:", err.message);
    if (err.kind === 'ObjectId') {
        return res.status(400).json({ msg: "Invalid Product ID format" });
    }
    res.status(500).json({ msg: "Server Error: Could not delete product" });
  }
});

module.exports = router;

