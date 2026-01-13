# Environment Variables Configuration Guide

## Backend (.env)
Copy this template and fill in your actual values:

```env
# Database
MONGO_URI=mongodb+srv://Nova-Admin:Nova%402025@nova.ga2yfjx.mongodb.net/?retryWrites=true&w=majority&appName=Nova

# Cloudinary
CLOUDINARY_CLOUD_NAME=db01nsxhq
CLOUDINARY_API_KEY=553852463273137
CLOUDINARY_API_SECRET=1Bl5TbWahy61qET4LgQM7xz0a1k
CLOUDINARY_URL=cloudinary://553852463273137:1Bl5TbWahy61qET4LgQM7xz0a1k@db01nsxhq

# M-Pesa (Sandbox)
MPESA_CONSUMER_KEY=sTcU76B8I6jtlBhyuBOcETej2SUGQ10UbMZ3seAEHJWGvmGI
MPESA_CONSUMER_SECRET=SSpRJXyYwKX7daEhICmnLhhsa1RtVgXgKxDK6uyK64SCNP6BDb5SOttA4KaXhg5Z
MPESA_SHORTCODE=174379
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
MPESA_AUTH_URL=https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials
MPESA_STKPUSH_URL=https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest
MPESA_CALLBACK_URL=https://novawears.tech/api/mpesa/callback

# Admin
ADMIN_API_KEY=nova_admin_secret_key_123

# Server
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://novawears.tech
```

## Render Deployment Steps

1. **Create Render Account**: Go to https://render.com and sign up
2. **Connect GitHub**: Link your GitHub repository
3. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Select your Nova repository
   - Configure:
     - Name: `nova-backend`
     - Environment: `Docker`
     - Region: Choose closest to Kenya (e.g., Frankfurt or Singapore)
     - Branch: `main`
4. **Add Environment Variables**:
   - Go to "Environment" tab
   - Add all variables from the template above
   - **IMPORTANT**: Use "Add from .env" feature or add manually
5. **Deploy**: Click "Create Web Service"
6. **Get Backend URL**: Copy the URL (e.g., `https://nova-backend.onrender.com`)

## Frontend (.env.local for Netlify)

Create this file in `client/` directory:

```env
NEXT_PUBLIC_API_URL=https://nova-backend.onrender.com
```

## Netlify Deployment Steps

1. **Create Netlify Account**: Go to https://netlify.com and sign up
2. **Connect GitHub**: Link your repository
3. **Create New Site**:
   - Click "Add new site" → "Import an existing project"
   - Select GitHub and choose your Nova repository
4. **Configure Build Settings**:
   - Base directory: `client`
   - Build command: `npm run build`
   - Publish directory: `client/.next`
5. **Add Environment Variables**:
   - Go to "Site settings" → "Environment variables"
   - Add: `NEXT_PUBLIC_API_URL` = `https://nova-backend.onrender.com`
6. **Deploy**: Click "Deploy site"
7. **Configure Custom Domain**:
   - Go to "Domain settings"
   - Click "Add custom domain"
   - Enter: `novawears.tech`
   - Follow DNS configuration instructions

## DNS Configuration for novawears.tech

Add these records in your .tech domain registrar:

### For Netlify:
1. **A Record**:
   - Type: `A`
   - Name: `@`
   - Value: `75.2.60.5` (Netlify's load balancer IP)
   
2. **CNAME Record**:
   - Type: `CNAME`
   - Name: `www`
   - Value: `your-site-name.netlify.app`

### SSL Certificate:
- Netlify will automatically provision SSL certificate
- Wait 24-48 hours for DNS propagation
- Verify HTTPS is working

## Post-Deployment Checklist

- [ ] Backend is live and responding at Render URL
- [ ] Frontend is live at novawears.tech
- [ ] HTTPS is enabled (green padlock)
- [ ] M-Pesa integration works in production
- [ ] Admin dashboard is accessible
- [ ] Products load correctly
- [ ] Checkout flow works end-to-end
- [ ] Google Search Console is configured
- [ ] Analytics is set up (optional)
