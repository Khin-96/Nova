require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

// Import routes
const productRoutes = require("./src/routes/productRoutes"); // Ensure these paths are correct for your project structure
const contactRoutes = require("./src/routes/contactRoutes");
const subscriptionRoutes = require("./src/routes/subscriptionRoutes");
const mpesaRoutes = require("./src/routes/mpesaRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware

// Define allowed origins for CORS
const allowedOrigins = [
  "https://novawearke.netlify.app",
  "https://novawear.onrender.com",
  "http://localhost:3000", 
  "http://127.0.0.1:3000"
];

// Configure CORS options
const corsOptions = {
  origin: function (origin, callback ) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = "The CORS policy for this site does not allow access from the specified Origin.";
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true, // Allow cookies to be sent
  optionsSuccessStatus: 204 // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

// Apply CORS middleware
app.use(cors(corsOptions));

app.use(express.json());

// Serve static files (HTML, CSS, JS) from the \'public\' directory
// This will serve index.html for \'/', admin.html for \'/admin.html\', etc.
// Make sure your admin.html, index.html, script.js, and styles.css are in a \'public\' folder.
app.use(express.static(path.join(__dirname, "public")));

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/nova-wear";

mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB Connected..."))
  .catch(err => {
    console.error("MongoDB Connection Error:", err.message);
    process.exit(1);
  });

// API Routes
app.use("/api", productRoutes);
app.use("/api", contactRoutes);
app.use("/api", subscriptionRoutes);
app.use("/api/mpesa", mpesaRoutes);

// Catch-all route for Single Page Applications (SPA)
// This serves index.html for any route not handled by static files or API routes.
// It should come AFTER static middleware and API routes.
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

