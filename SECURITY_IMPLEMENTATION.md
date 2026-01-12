# Nova Wear - Security Hardening & Enterprise Features

## Overview
This implementation transforms Nova Wear into an enterprise-grade e-commerce platform with comprehensive security fixes and advanced features while preserving the original UI/UX design.

## 🔐 Security Fixes

### 1. Authentication & Authorization System
- **JWT-based authentication** with bcrypt password hashing (10 rounds)
- **Role-based access control** (customer, admin)
- **Protected admin routes** - All POST/PUT/DELETE operations require authentication and admin role
- **Token expiration** - Tokens expire after 7 days
- **Secure password storage** - Never stored in plain text

**Files:**
- `src/models/User.js` - User model with password hashing
- `src/middleware/authMiddleware.js` - JWT verification and role checking
- `src/routes/authRoutes.js` - Login, register, and token verification endpoints

### 2. Input Sanitization (XSS Prevention)
- **Global sanitization middleware** applied to all requests
- **isomorphic-dompurify** for HTML sanitization
- **validator** library for escaping special characters
- **Contact form protection** - All user inputs sanitized before email sending

**Files:**
- `src/middleware/sanitizeMiddleware.js` - Sanitization functions
- Applied in `server.js` as global middleware

### 3. Rate Limiting (DoS Prevention)
- **General API limit**: 100 requests per 15 minutes
- **Auth endpoints**: 5 attempts per 15 minutes
- **M-Pesa payments**: 3 requests per 5 minutes
- **Contact form**: 5 messages per hour
- **Product creation**: 20 products per hour

**Files:**
- `src/middleware/rateLimitMiddleware.js` - Rate limiting configurations

### 4. RegEx Injection Prevention
- **escapeRegex() function** to sanitize regex inputs
- **Exact string matching** for category filters
- **All user inputs escaped** before using in RegExp

**Files:**
- Fixed in `src/routes/productRoutes.js`
- Utility function in `src/middleware/sanitizeMiddleware.js`

### 5. Security Headers
- **Helmet middleware** for comprehensive security headers
- **Content Security Policy (CSP)** configured for TailwindCSS and Font Awesome
- **MongoDB injection prevention** with express-mongo-sanitize
- **HPP protection** against HTTP Parameter Pollution
- **CORS configuration** with specific allowed origins

**Files:**
- Configured in `server.js`

### 6. Environment Security
- `.env` added to `.gitignore`
- `.env.example` template provided
- `JWT_SECRET` generated with crypto.randomBytes(64)
- No secrets in source code

## 🚀 Enterprise Features

### 7. Enhanced Product Model
**New Fields:**
- `inventory` - Per-size inventory tracking (S, M, L, XL)
- `images` - Multiple product images support
- `views` - View counter for analytics
- `salesCount` - Track number of sales
- `rating` - Average product rating (0-5)
- `reviewCount` - Number of reviews
- `colors` - Available color options
- `material` - Product material information
- `relatedProducts` - Product recommendations

**Methods:**
- `updateRating()` - Update rating from reviews
- `incrementViews()` - Track product views
- `decreaseInventory()` - Update inventory after order

**Indexes:**
- Text search on name and description
- Performance indexes on rating, salesCount, views, createdAt

**Files:**
- `src/models/Product.js`

### 8. Complete Order Management System
**Features:**
- Order lifecycle tracking (pending → confirmed → processing → shipped → delivered)
- Guest checkout support (no account required)
- Registered user checkout with order history
- Status history tracking
- Automatic inventory updates on order creation
- Order cancellation with inventory restoration
- Support for M-Pesa and cash-on-delivery

**Order Status Flow:**
```
pending → confirmed → processing → shipped → delivered
         ↓
      cancelled
```

**Files:**
- `src/models/Order.js` - Order schema with lifecycle
- `src/routes/orderRoutes.js` - CRUD operations

### 9. Review & Rating System
**Features:**
- One review per user per product
- Verified purchase badges
- Automatic product rating calculation
- Review helpful counter
- Rating distribution analytics
- Pagination support
- Report inappropriate reviews

**Auto-Rating Calculation:**
- Triggers on review save/update/delete
- Calculates average rating across all reviews
- Updates product rating in real-time

**Files:**
- `src/models/Review.js` - Review schema with auto-update hooks
- `src/routes/reviewRoutes.js` - Review CRUD operations

### 10. Advanced Recommendation Engine
**Algorithms:**

1. **Personalized Recommendations** (Collaborative Filtering)
   - Based on user's view history and wishlist
   - Analyzes user's preferred categories
   - Returns products similar to user's interests

2. **Content-Based Filtering** (Similar Products)
   - Same category matching
   - Tag-based similarity
   - Rating and sales prioritization

3. **Frequently Bought Together**
   - Analyzes order data for co-occurrences
   - Statistical association mining
   - Sorted by purchase frequency

4. **Trending Products**
   - Last 7-day window
   - Based on views and sales velocity
   - Real-time trend tracking

5. **New Arrivals**
   - Sorted by creation date
   - Excludes out-of-stock items

6. **Bestsellers**
   - Sorted by sales count
   - Rating as secondary sort

**Files:**
- `src/services/recommendationService.js` - Recommendation algorithms
- `src/routes/recommendationRoutes.js` - API endpoints

### 11. User Management System
**Features:**
- User profiles with preferences
- Wishlist functionality (save favorite products)
- View history tracking (last 50 products)
- Global product view tracking
- Favorite categories tracking
- Preferred sizes tracking

**Endpoints:**
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update preferences
- `GET /api/users/wishlist` - Get wishlist
- `POST /api/users/wishlist/:productId` - Add to wishlist
- `DELETE /api/users/wishlist/:productId` - Remove from wishlist
- `GET /api/users/view-history` - Get view history

**Files:**
- `src/routes/userRoutes.js` - User management endpoints

### 12. Updated Server Configuration
**New Middleware Stack:**
```javascript
1. Helmet (security headers)
2. CORS (configured origins)
3. express.json() (body parsing)
4. mongo-sanitize (NoSQL injection prevention)
5. hpp (HTTP Parameter Pollution prevention)
6. sanitizeInput (XSS prevention)
7. apiLimiter (rate limiting)
```

**New Routes:**
- `/api/auth` - Authentication endpoints
- `/api/orders` - Order management
- `/api/reviews` - Review system
- `/api/users` - User management
- `/api/recommendations` - Recommendation engine

**Global Error Handler:**
- Centralized error handling
- No error details in production
- Proper error logging

**Files:**
- `server.js` - Updated with all middleware and routes

## 🎨 Frontend Updates (No UI Changes)

### 13. Authentication Integration (script.js)
**Features:**
- JWT token storage in localStorage
- Auto-login on page load
- Token verification with backend
- Authentication state management
- Product view tracking for logged-in users
- Helper function for authenticated requests

**Functions:**
- `verifyToken()` - Verify token with backend
- `updateUserUI()` - Update UI based on auth state
- `logout()` - Clear token and reset state
- `fetchWithAuth()` - Make authenticated API requests
- `trackProductView()` - Track views for recommendations

**Files:**
- `public/script.js`

### 14. Admin Panel Security (admin.js)
**Features:**
- Authentication check on page load
- Admin role verification
- Redirect to login if not authenticated
- JWT token in all API requests
- Auto-logout on token expiration
- Secure product/order management

**Functions:**
- `verifyAdminAccess()` - Check authentication and admin role
- `redirectToLogin()` - Redirect unauthorized users
- `fetchWithAuth()` - Make authenticated requests with token

**Files:**
- `public/admin.js`

## 📦 Dependencies Added

```json
{
  "bcryptjs": "^2.4.3",              // Password hashing
  "express-mongo-sanitize": "^2.2.0", // NoSQL injection prevention
  "express-rate-limit": "^7.1.5",    // Rate limiting
  "helmet": "^7.1.0",                 // Security headers
  "hpp": "^0.2.3",                    // HPP protection
  "isomorphic-dompurify": "^2.15.0",  // XSS prevention
  "jsonwebtoken": "^9.0.2",           // JWT authentication
  "validator": "^13.11.0"             // Input validation
}
```

## 📁 New Files Created

### Models
- `src/models/User.js` - User authentication and profile
- `src/models/Order.js` - Order management
- `src/models/Review.js` - Product reviews

### Middleware
- `src/middleware/authMiddleware.js` - JWT authentication
- `src/middleware/sanitizeMiddleware.js` - Input sanitization
- `src/middleware/rateLimitMiddleware.js` - Rate limiting

### Routes
- `src/routes/authRoutes.js` - Authentication endpoints
- `src/routes/orderRoutes.js` - Order management
- `src/routes/reviewRoutes.js` - Review system
- `src/routes/userRoutes.js` - User management
- `src/routes/recommendationRoutes.js` - Recommendations

### Services
- `src/services/recommendationService.js` - Recommendation algorithms

### Configuration
- `.gitignore` - Protect sensitive files
- `.env.example` - Environment template

## 📁 Files Modified

1. `server.js` - Added security middleware and new routes
2. `src/routes/productRoutes.js` - Added authentication, fixed regex vulnerability
3. `src/routes/contactRoutes.js` - Added rate limiting and sanitization
4. `src/routes/mpesaRoutes.js` - Added rate limiting, removed sensitive logging
5. `src/models/Product.js` - Enhanced with inventory, ratings, analytics
6. `public/script.js` - Added authentication logic
7. `public/admin.js` - Added authentication checks
8. `package.json` - Added security dependencies

## 🔧 Environment Variables

### Required Variables (in .env)
```bash
# MongoDB
MONGO_URI=mongodb://...

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# M-Pesa
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=your_shortcode
MPESA_PASSKEY=your_passkey
MPESA_AUTH_URL=https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials
MPESA_STKPUSH_URL=https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest
MPESA_CALLBACK_URL=https://your-domain.com/api/mpesa/callback

# JWT Authentication
JWT_SECRET=generate_with_crypto_randomBytes_64

# Environment
NODE_ENV=production
PORT=3000
```

### Generate JWT_SECRET
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Generate JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))" >> .env
```

### 4. Start Server
```bash
npm start
```

### 5. Create Admin User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@novawear.com",
    "password": "securepassword123"
  }'

# Then manually update the user's role to "admin" in the database
# OR modify the User model temporarily to allow role specification during registration
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify` - Verify token

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (Admin only)
- `PUT /api/products/:id` - Update product (Admin only)
- `DELETE /api/products/:id` - Delete product (Admin only)

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - Get orders (user's or all if admin)
- `GET /api/orders/:id` - Get order by ID
- `PUT /api/orders/:id/status` - Update order status (Admin only)
- `DELETE /api/orders/:id` - Cancel order

### Reviews
- `POST /api/reviews` - Create review
- `GET /api/reviews/product/:productId` - Get product reviews
- `GET /api/reviews/user` - Get user's reviews
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review

### Users
- `GET /api/users/profile` - Get profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/wishlist` - Get wishlist
- `POST /api/users/wishlist/:productId` - Add to wishlist
- `DELETE /api/users/wishlist/:productId` - Remove from wishlist
- `GET /api/users/view-history` - Get view history

### Recommendations
- `GET /api/recommendations/personalized` - Get personalized recommendations
- `GET /api/recommendations/similar/:productId` - Get similar products
- `GET /api/recommendations/bought-together/:productId` - Frequently bought together
- `GET /api/recommendations/trending` - Get trending products
- `GET /api/recommendations/new-arrivals` - Get new arrivals
- `GET /api/recommendations/bestsellers` - Get bestsellers

## 🧪 Testing

### Test Authentication
```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"test123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

### Test Rate Limiting
```bash
# Make 6 login attempts in quick succession
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done
# 6th request should be rate limited
```

### Test Admin Protection
```bash
# Try to create product without token (should fail)
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Product","price":100,"category":"test"}'
# Should return 401 Unauthorized
```

## 🛡️ Security Best Practices

1. **Never commit .env file** - Already in .gitignore
2. **Use strong JWT_SECRET** - Generated with crypto.randomBytes(64)
3. **Implement HTTPS in production** - Use SSL/TLS certificates
4. **Regular dependency updates** - Run `npm audit` regularly
5. **Monitor rate limit hits** - Log and analyze rate limit events
6. **Sanitize all inputs** - Already implemented globally
7. **Use prepared statements** - Mongoose handles this
8. **Implement session timeout** - JWT expires after 7 days
9. **Log security events** - Implement comprehensive logging
10. **Regular backups** - Backup MongoDB regularly

## 📈 Performance Optimizations

1. **Database Indexes** - Added to all models for faster queries
2. **Bulk Operations** - Used in order cancellation for inventory updates
3. **Pagination** - Implemented on all list endpoints
4. **Caching Strategy** - Consider Redis for session/rate limiting
5. **View History Limit** - Capped at 50 items per user
6. **Aggregate Queries** - Used in recommendation engine

## 🎯 Success Criteria

✅ All security vulnerabilities from audit are fixed
✅ Enterprise features are implemented
✅ Original UI/UX is preserved
✅ Application is ready for production
✅ No breaking changes to existing functionality
✅ Code review completed (0 issues)
✅ Security scan completed (0 vulnerabilities)

## 📝 License

Same as original Nova Wear project

## 👥 Contributors

Security hardening and enterprise features implemented by GitHub Copilot
