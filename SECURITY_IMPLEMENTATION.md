# Nova Wear Enterprise E-commerce Platform

## Security & Enterprise Features Implementation

This document outlines the security hardening and enterprise features added to transform Nova Wear into an enterprise-grade e-commerce platform.

---

## 🔒 Critical Security Fixes

### 1. Environment Variables Protection
- ✅ Created `.gitignore` to prevent `.env` exposure
- ⚠️ **ACTION REQUIRED**: The `.env` file was previously tracked in git. To fully secure:
  ```bash
  git rm --cached .env
  git rm --cached temp.env
  git commit -m "Remove .env from git tracking"
  git push
  ```
- ⚠️ **IMPORTANT**: After removing from git, regenerate all secrets and credentials in `.env`

### 2. Authentication & Authorization
- ✅ JWT-based authentication system
- ✅ Admin role-based access control
- ✅ Protected all admin routes (product management)
- ✅ Password hashing with bcryptjs

### 3. Security Middleware Stack
- ✅ **Helmet**: Security headers (XSS, CSP, HSTS)
- ✅ **Rate Limiting**: DDoS protection
  - General API: 100 requests/15 min
  - Auth endpoints: 5 requests/15 min
  - Contact form: 3 requests/hour
  - M-Pesa: 3 requests/5 min
- ✅ **Input Sanitization**: XSS and injection prevention
- ✅ **MongoDB Sanitization**: NoSQL injection protection
- ✅ **HPP**: HTTP Parameter Pollution protection

### 4. RegEx Vulnerability Fixes
- ✅ Fixed ReDoS vulnerability in product search
- ✅ Sanitized all user inputs for regex operations
- ✅ Limited search query length to prevent attacks

### 5. Sensitive Data Protection
- ✅ Removed sensitive logging from M-Pesa routes
- ✅ Password fields excluded from queries by default
- ✅ Sanitized error messages to prevent info leakage

---

## 🚀 New Enterprise Features

### User Management System

#### User Model Features:
- Profile management
- Wishlist functionality
- View history tracking
- Purchase history
- JWT authentication

#### Authentication Endpoints:

**Register User**
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Login**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

**Get Profile**
```http
GET /api/auth/me
Authorization: Bearer YOUR_JWT_TOKEN
```

### Order Management System

#### Features:
- Guest and authenticated checkout
- Order status tracking (pending → processing → confirmed → shipped → delivered)
- Payment status integration
- Status history with timestamps
- Admin order management

#### Order Endpoints:

**Create Order**
```http
POST /api/orders
Content-Type: application/json

{
  "items": [
    {
      "product": "product_id",
      "quantity": 2,
      "size": "M"
    }
  ],
  "deliveryLocation": "Nairobi",
  "phone": "254712345678",
  "guestEmail": "guest@example.com",  // For guest checkout
  "guestName": "Guest User"
}
```

**Update Order Status (Admin Only)**
```http
PUT /api/orders/:orderId/status
Authorization: Bearer ADMIN_JWT_TOKEN
Content-Type: application/json

{
  "status": "shipped",
  "note": "Package dispatched via DHL"
}
```

### Product Review System

#### Features:
- 5-star rating system
- Verified purchase badges
- Helpful votes
- Review management

#### Review Endpoints:

**Create Review**
```http
POST /api/reviews
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "product": "product_id",
  "rating": 5,
  "title": "Excellent Quality!",
  "comment": "This hoodie is amazing..."
}
```

**Get Product Reviews**
```http
GET /api/reviews/product/:productId?sort=-createdAt&limit=10&page=1
```

### Advanced Recommendation Engine

#### Algorithms Implemented:
1. **Collaborative Filtering**: Recommendations based on similar users
2. **Content-Based Filtering**: Based on product attributes
3. **Frequently Bought Together**: Co-purchase patterns
4. **Similar Products**: Category and price-based matching
5. **Trending Products**: High recent activity

#### Recommendation Endpoints:

```http
# Personalized for logged-in users
GET /api/recommendations/personalized
Authorization: Bearer YOUR_JWT_TOKEN

# Popular products
GET /api/recommendations/popular?limit=10

# Trending products
GET /api/recommendations/trending?days=7&limit=10

# Similar products
GET /api/recommendations/similar/:productId?limit=6

# Frequently bought together
GET /api/recommendations/frequently-bought-together/:productId?limit=4

# New arrivals
GET /api/recommendations/new-arrivals?limit=10

# Sale products
GET /api/recommendations/sale?limit=10
```

### Wishlist & View History

**Add to Wishlist**
```http
POST /api/users/wishlist/:productId
Authorization: Bearer YOUR_JWT_TOKEN
```

**Get Wishlist**
```http
GET /api/users/wishlist
Authorization: Bearer YOUR_JWT_TOKEN
```

**Track Product View**
```http
POST /api/users/view-history/:productId
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 🛠️ Setup Instructions

### 1. Environment Variables

Update your `.env` file with these new required variables:

```env
# Existing variables
MONGO_URI=your_mongodb_connection_string
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
MPESA_CONSUMER_KEY=your_mpesa_key
MPESA_CONSUMER_SECRET=your_mpesa_secret
MPESA_SHORTCODE=your_shortcode
MPESA_PASSKEY=your_passkey
MPESA_CALLBACK_URL=your_callback_url

# NEW: JWT Secret (REQUIRED)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-use-256-bit-random-string
```

**Generate a secure JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Install Dependencies

All dependencies are already installed, but if you need to reinstall:
```bash
npm install
```

### 3. Create Admin User

After starting the server, create an admin user:

```bash
# 1. Register a user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@novawear.com",
    "password": "SecureAdminPass123!"
  }'

# 2. Manually update the user role in MongoDB
# Connect to MongoDB and run:
db.users.updateOne(
  { email: "admin@novawear.com" },
  { $set: { role: "admin" } }
)
```

### 4. Frontend Integration

The admin panel now requires authentication:

1. Open `admin.html`
2. You'll need to obtain a JWT token via the `/api/auth/login` endpoint
3. Store the token in localStorage as `adminToken`
4. All admin API calls now automatically include the auth token

---

## 📊 Database Models

### User Schema
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (hashed, required),
  role: String (enum: ['user', 'admin'], default: 'user'),
  wishlist: [ProductId],
  viewHistory: [{
    product: ProductId,
    viewedAt: Date
  }],
  purchaseHistory: [{
    product: ProductId,
    purchasedAt: Date,
    quantity: Number
  }]
}
```

### Order Schema
```javascript
{
  user: UserId (optional for guest checkout),
  guestEmail: String,
  guestName: String,
  items: [{
    product: ProductId,
    name: String,
    price: Number,
    quantity: Number,
    size: String
  }],
  subtotal: Number,
  deliveryFee: Number,
  total: Number,
  deliveryLocation: String,
  phone: String,
  status: String (enum: ['pending', 'processing', 'confirmed', 'shipped', 'delivered', 'cancelled']),
  paymentStatus: String (enum: ['pending', 'paid', 'failed']),
  paymentMethod: String,
  mpesaTransactionId: String,
  statusHistory: [{
    status: String,
    timestamp: Date,
    note: String
  }]
}
```

### Review Schema
```javascript
{
  product: ProductId (required),
  user: UserId (required),
  rating: Number (1-5, required),
  title: String,
  comment: String (required),
  verified: Boolean (true if user purchased),
  helpful: Number (count),
  helpfulBy: [UserId]
}
```

### Enhanced Product Schema
```javascript
{
  // Existing fields
  name: String,
  category: String,
  price: Number,
  image: String,
  tags: [String],
  sizes: [String],
  
  // NEW fields
  description: String,
  inventory: Number (default: 100),
  averageRating: Number (0-5, default: 0),
  reviewCount: Number (default: 0),
  viewCount: Number (default: 0),
  purchaseCount: Number (default: 0)
}
```

---

## 🔐 Security Best Practices

### For Production Deployment:

1. **Environment Variables**
   - Never commit `.env` to git
   - Use strong, randomly generated secrets
   - Rotate credentials regularly

2. **JWT Secret**
   - Use a 256-bit random string
   - Keep it absolutely secret
   - Different secret for each environment

3. **HTTPS**
   - Always use HTTPS in production
   - Update CSP headers accordingly
   - Enable HSTS

4. **Rate Limiting**
   - Adjust limits based on your traffic
   - Consider IP whitelisting for admin
   - Monitor for abuse patterns

5. **Database**
   - Use MongoDB connection string with authentication
   - Restrict database user permissions
   - Enable MongoDB encryption at rest

6. **Logging**
   - Log all authentication attempts
   - Monitor failed login attempts
   - Set up alerts for suspicious activity

---

## 🧪 Testing the Implementation

### Test Authentication Flow
```bash
# 1. Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"test123"}'

# 2. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'

# 3. Use token for authenticated requests
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Test Rate Limiting
```bash
# Run this multiple times quickly
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' &
done
# Should see rate limit errors after 5 attempts
```

---

## 📈 Monitoring & Maintenance

### Key Metrics to Monitor:
1. Failed authentication attempts
2. Rate limit hits
3. Order conversion rates
4. Product view-to-purchase ratio
5. Average order value
6. Review submission rate

### Regular Maintenance:
1. Review and rotate JWT secrets quarterly
2. Audit user permissions monthly
3. Check for outdated dependencies weekly
4. Review rate limit logs for abuse
5. Clean up old view history data (keep last 100 per user)

---

## 🆘 Troubleshooting

### Common Issues:

**1. "Not authorized" errors**
- Ensure JWT token is valid and not expired
- Check Authorization header format: `Bearer TOKEN`
- Verify user role for admin routes

**2. Rate limit errors**
- Wait for the time window to reset
- Contact admin to whitelist IP if legitimate traffic

**3. MongoDB connection errors**
- Verify MONGO_URI in .env
- Check MongoDB Atlas network access
- Ensure database user has correct permissions

**4. Order creation fails**
- Check product inventory levels
- Verify all required fields are provided
- Check delivery location format

---

## 🎯 Next Steps & Recommendations

1. **Testing**: Set up automated tests for all endpoints
2. **Documentation**: Create API documentation with Swagger/OpenAPI
3. **Analytics**: Integrate analytics for user behavior tracking
4. **Notifications**: Add email notifications for orders
5. **Performance**: Add caching with Redis for recommendations
6. **Monitoring**: Set up APM tools (New Relic, Datadog)
7. **Backup**: Implement automated database backups
8. **CI/CD**: Set up continuous integration and deployment

---

## 📝 API Summary

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/register` | POST | Public | Register new user |
| `/api/auth/login` | POST | Public | Login user |
| `/api/auth/me` | GET | User | Get current user |
| `/api/products` | GET | Public | List products |
| `/api/products` | POST | Admin | Create product |
| `/api/products/:id` | PUT | Admin | Update product |
| `/api/products/:id` | DELETE | Admin | Delete product |
| `/api/orders` | POST | Optional | Create order |
| `/api/orders` | GET | User | List orders |
| `/api/orders/:id/status` | PUT | Admin | Update order status |
| `/api/reviews` | POST | User | Create review |
| `/api/reviews/product/:id` | GET | Public | Get product reviews |
| `/api/users/wishlist` | GET | User | Get wishlist |
| `/api/users/wishlist/:id` | POST | User | Add to wishlist |
| `/api/recommendations/personalized` | GET | User | Personalized recommendations |
| `/api/recommendations/popular` | GET | Public | Popular products |
| `/api/recommendations/similar/:id` | GET | Public | Similar products |

---

## 📄 License & Credits

This transformation maintains compatibility with the original Nova Wear design while adding enterprise-grade security and features.

**Security Libraries Used:**
- helmet
- express-rate-limit
- express-mongo-sanitize
- hpp
- bcryptjs
- jsonwebtoken
- validator

For questions or issues, please open a GitHub issue.
