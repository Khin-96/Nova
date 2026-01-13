require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const verifyAdminKey = require("./src/middleware/auth");

// Import routes
const productRoutes = require("./src/routes/productRoutes");
const orderRoutes = require("./src/routes/orderRoutes"); // Ensure these paths are correct for your project structure
const contactRoutes = require("./src/routes/contactRoutes");
const subscriptionRoutes = require("./src/routes/subscriptionRoutes");
const mpesaRoutes = require("./src/routes/mpesaRoutes");
const careerRoutes = require("./src/routes/careerRoutes");
const analyticsRoutes = require("./src/routes/analyticsRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Tracking & Recommendations
const { trackUserAction, getRecommendations } = require("./src/services/recommendationService");
const { connectProducer } = require("./src/lib/kafka");

// Connect Kafka (fire and forget connectivity check)
connectProducer();

// Middleware

// Define allowed origins for CORS
const allowedOrigins = [
  "https://novawearkenya.netlify.app",
  "https://novawear.onrender.com",
  "http://localhost:3000",
  "http://127.0.0.1:3000"
];

// Configure CORS options
const corsOptions = {
  origin: allowedOrigins,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  optionsSuccessStatus: 204
};

// Custom CORS middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  } else if (!origin) {
    res.header("Access-Control-Allow-Origin", "*");
  }
  res.header("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, x-admin-api-key");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

// Security Headers
app.use(helmet());

// Data Sanitization against NoSQL Injection
app.use(mongoSanitize());

// Data Sanitization against XSS
app.use(xss());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later."
});
app.use("/api", limiter);

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
// API Routes
app.use("/api/products", (req, res, next) => {
  // Apply auth middleware only for mutation methods
  if (["POST", "PUT", "DELETE", "PATCH"].includes(req.method)) {
    return verifyAdminKey(req, res, next);
  }
  next();
}, productRoutes); // Mount product routes with conditional auth
app.use("/api/orders", (req, res, next) => {
  // Apply auth middleware only for mutation methods
  if (["POST", "PUT", "DELETE", "PATCH"].includes(req.method)) {
    // If it's a POST (create order), it might be public (customer checkout). 
    // Check if it's NOT the checkout route if checkout is different.
    // Actually, create order (POST /api/orders) is PUBLIC.
    // Update/Delete/Get ALL is ADMIN.
    if (req.method === 'POST') return next();
    return verifyAdminKey(req, res, next);
  }
  // GET /api/orders allows viewing all orders? That should be ADMIN only.
  // The route is router.get('/', ...).
  if (req.method === 'GET') return verifyAdminKey(req, res, next);

  next();
}, orderRoutes);
app.use("/api", contactRoutes);
app.use("/api", subscriptionRoutes);
app.use("/api/mpesa", mpesaRoutes);
app.use("/api/careers", careerRoutes);
app.use("/api/analytics", analyticsRoutes);

// --- Recommendation & Tracking Routes ---
app.post("/api/track", async (req, res) => {
  const { userId, action, metadata } = req.body;
  // Fire and forget - don't block response
  trackUserAction(userId || 'guest', action, metadata).catch(err => console.error("Tracking error:", err));
  res.status(200).json({ status: "tracked" });
});

app.get("/api/recommendations", async (req, res) => {
  const { userId } = req.query;
  try {
    const recommendations = await getRecommendations(userId || 'guest');
    res.json(recommendations);
  } catch (err) {
    console.error("Rec error:", err);
    res.status(500).json({ msg: "Error getting recommendations" });
  }
});

// Catch-all route for Single Page Applications (SPA)
// This serves index.html for any route not handled by static files or API routes.
// It should come AFTER static middleware and API routes.
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Internal Server Error',
    error: err.message, // Always show error message for debugging
    stack: err.stack
  });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

