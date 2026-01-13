# Nova Wear - E-Commerce Platform

A modern, full-stack e-commerce platform for contemporary fashion, built with Next.js and Express.

## 🚀 Features

- **Modern UI/UX**: Glassmorphism design, smooth animations with Framer Motion
- **Product Management**: Full CRUD operations with Cloudinary image hosting
- **Shopping Cart**: Real-time cart with smooth slide-in animations
- **Checkout Flow**: Dedicated checkout page with M-Pesa integration
- **M-Pesa Payments**: STK Push and QR Code payment options
- **Admin Dashboard**: Product, order, and career management with analytics
- **SEO Optimized**: Dynamic sitemap, robots.txt, Open Graph tags
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Security**: Rate limiting, input sanitization, CORS protection

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **State Management**: React Context API
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **File Upload**: Cloudinary
- **Payment**: Safaricom M-Pesa API
- **Security**: Helmet, express-rate-limit, xss-clean

## 📦 Project Structure

```
Nova/
├── client/                 # Next.js frontend
│   ├── app/
│   │   ├── components/    # React components
│   │   ├── context/       # Context providers
│   │   ├── admin/         # Admin dashboard
│   │   ├── checkout/      # Checkout page
│   │   └── shop/          # Shop page
│   └── public/            # Static assets
├── src/
│   ├── models/            # Mongoose models
│   ├── routes/            # Express routes
│   └── middleware/        # Custom middleware
├── Dockerfile             # Docker configuration
├── render.yaml            # Render deployment config
└── netlify.toml           # Netlify deployment config
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Cloudinary account
- M-Pesa Sandbox credentials

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd Nova
```

2. **Install backend dependencies**
```bash
npm install
```

3. **Install frontend dependencies**
```bash
cd client
npm install
cd ..
```

4. **Configure environment variables**

Create `.env` in root directory:
```env
MONGO_URI=your_mongodb_uri
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your_passkey
ADMIN_API_KEY=your_admin_key
PORT=5000
```

Create `client/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

5. **Run development servers**

Backend:
```bash
npm run dev
# or
node server.js
```

Frontend (in new terminal):
```bash
cd client
npm run dev
```

Visit:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Admin Dashboard: http://localhost:3000/admin

## 🌐 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy

**Backend (Render)**:
1. Push to GitHub
2. Connect repository to Render
3. Select Docker environment
4. Add environment variables
5. Deploy

**Frontend (Netlify)**:
1. Connect repository to Netlify
2. Set base directory to `client`
3. Add `NEXT_PUBLIC_API_URL` environment variable
4. Deploy

## 🔐 Admin Access

Access the admin dashboard at `/admin` with the configured `ADMIN_API_KEY` in the `x-admin-api-key` header.

## 📱 M-Pesa Integration

The platform supports two M-Pesa payment methods:
1. **STK Push**: Direct phone payment prompt
2. **QR Code**: Scannable QR code for payment

Currently configured for Sandbox environment. Update URLs in `.env` for production.

## 🎨 Design Features

- Glassmorphism effects
- Smooth page transitions
- Hover animations
- Responsive grid layouts
- Dark mode support (coming soon)

## 📊 Analytics

Admin dashboard includes:
- Revenue tracking
- Top products analysis
- Order statistics
- Customer insights

## 🔒 Security

- Rate limiting on all routes
- Input sanitization
- XSS protection
- CORS configuration
- Helmet security headers
- MongoDB injection prevention

## 📄 License

MIT License - feel free to use this project for your own purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

For support or inquiries, visit [novawears.tech](https://novawears.tech)
