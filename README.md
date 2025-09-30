# Nova

Nova is a modular web application designed for product management, customer engagement, and subscription services. Built with a structured backend and a dynamic frontend, Nova is suitable for businesses or projects that require digital product listings, contact forms, subscription handling, and mobile payment integration.

## Features

- **Product Management**: Create, update, and manage products using defined models and RESTful routes.  
  - Model: [`Product.js`](https://github.com/Khin-96/Nova/blob/main/src/models/Product.js)
  - Route: [`productRoutes.js`](https://github.com/Khin-96/Nova/blob/main/src/routes/productRoutes.js)
- **Contact Handling**: Integrated contact model and routes to receive and store user inquiries.  
  - Model: [`Contact.js`](https://github.com/Khin-96/Nova/blob/main/src/models/Contact.js)
  - Route: [`contactRoutes.js`](https://github.com/Khin-96/Nova/blob/main/src/routes/contactRoutes.js)
- **Subscriptions**: Support for user subscriptions to services or products, with dedicated backend logic.  
  - Model: [`Subscription.js`](https://github.com/Khin-96/Nova/blob/main/src/models/Subscription.js)
  - Route: [`subscriptionRoutes.js`](https://github.com/Khin-96/Nova/blob/main/src/routes/subscriptionRoutes.js)
- **Mobile Payments (Mpesa Integration)**: Endpoints to handle mobile payments, suitable for East African markets.  
  - Route: [`mpesaRoutes.js`](https://github.com/Khin-96/Nova/blob/main/src/routes/mpesaRoutes.js)
- **Frontend Assets and Static Site**:  
  - Core HTML, CSS, and JavaScript for the landing pages and admin interface in the `public` folder:
    - Main site: [`index.html`](https://github.com/Khin-96/Nova/blob/main/public/index.html), [`styles.css`](https://github.com/Khin-96/Nova/blob/main/public/styles.css), [`script.js`](https://github.com/Khin-96/Nova/blob/main/public/script.js)
    - Admin panel: [`admin.html`](https://github.com/Khin-96/Nova/blob/main/public/admin.html), [`admin.js`](https://github.com/Khin-96/Nova/blob/main/public/admin.js)
    - Image and upload support: `/public/uploads`, `/public/*.jpg`, `/public/favicon.jpeg`
- **Extensibility**: Modular structure for further expansion (additional models, routes, and static assets).

## Project Structure

- `src/models/` — Data models for products, contacts, and subscriptions
- `src/routes/` — API and backend routes for RESTful operations and integrations
- `public/` — Static website files, images, uploads, and admin dashboard

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/Khin-96/Nova.git
   cd Nova
   ```
2. **Install dependencies**
   ```bash
   npm install
   # or yarn install
   ```
3. **Run the backend and frontend**
   - Set up your server to use the routes in `src/routes/`
   - Serve files in the `public/` directory for the frontend
4. **Configure environment variables** (for payments, database, etc.)

## Example Use Cases

- Product showcase sites with admin management
- Businesses needing customer contact and inquiry forms
- Digital services with subscription and payment capability
- Projects targeting markets using Mpesa for mobile payments

## License

This project is maintained by [Khin-96](https://github.com/Khin-96).

---
*Feel free to customize this README as you further develop Nova!*
