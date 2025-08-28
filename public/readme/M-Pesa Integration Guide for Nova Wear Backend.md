# M-Pesa Integration Guide for Nova Wear Backend

This guide explains the steps required to fully integrate the M-Pesa STK Push functionality into the Nova Wear backend application.

## Prerequisites

1.  **Safaricom Daraja Account:** You need an active developer account on the Safaricom Daraja portal ([https://developer.safaricom.co.ke/](https://developer.safaricom.co.ke/)).
2.  **Daraja App:** Create an application on the Daraja portal. Choose the appropriate APIs (e.g., "Lipa Na M-Pesa Sandbox") and note down the **Consumer Key** and **Consumer Secret** for your app.
3.  **Test Credentials:** Obtain test credentials (Shortcode, Passkey, etc.) from the Daraja portal for testing in the sandbox environment.
4.  **Publicly Accessible Callback URL:** You need a publicly accessible HTTPS URL where Safaricom can send the payment confirmation results. Services like Ngrok can be used for local testing, but a deployed server with HTTPS is required for production.

## Backend Configuration (.env file)

Add the following variables to your `.env` file in the project root, replacing the placeholder values with your actual credentials from the Daraja portal:

```dotenv
# --- M-Pesa Daraja API Credentials ---

# Your Daraja App Consumer Key
MPESA_CONSUMER_KEY="YOUR_DARAJA_APP_CONSUMER_KEY"

# Your Daraja App Consumer Secret
MPESA_CONSUMER_SECRET="YOUR_DARAJA_APP_CONSUMER_SECRET"

# Your Lipa Na M-Pesa Online Shortcode (Paybill or Till Number)
MPESA_SHORTCODE="YOUR_BUSINESS_SHORTCODE"

# Your Lipa Na M-Pesa Online Passkey (from Daraja portal)
MPESA_PASSKEY="YOUR_ONLINE_PASSKEY"

# The publicly accessible HTTPS URL for receiving payment callbacks
MPESA_CALLBACK_URL="YOUR_PUBLIC_HTTPS_CALLBACK_URL/api/mpesa/callback"

# Daraja API Environment URLs (Use Sandbox for testing, Production for live)
# Sandbox URLs (Defaults in code)
# MPESA_AUTH_URL="https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
# MPESA_STKPUSH_URL="https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest"

# Production URLs (Uncomment and use when going live)
# MPESA_AUTH_URL="https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
# MPESA_STKPUSH_URL="https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest"

# --- Email Configuration (for Contact Form) ---
# Your email service provider's SMTP host (e.g., smtp.gmail.com)
EMAIL_HOST="smtp.gmail.com"

# SMTP Port (e.g., 587 for TLS, 465 for SSL)
EMAIL_PORT="587"

# Your email address used for sending notifications
EMAIL_USER="your_email@example.com"

# Your email password or App Password (Recommended for Gmail)
EMAIL_PASS="your_email_password_or_app_password"

# --- MongoDB Connection ---
MONGO_URI="mongodb+srv://<db_username>:<db_password>@your_cluster_url/..."

# --- Server Port (Optional) ---
# PORT=3000
```

**Important Notes:**

*   **Callback URL:** Ensure `MPESA_CALLBACK_URL` points to the correct path (`/api/mpesa/callback`) on your deployed server and is accessible via HTTPS.
*   **Security:** Keep your `.env` file secure and **never** commit it to version control (add `.env` to your `.gitignore` file).
*   **Gmail App Password:** If using Gmail for `EMAIL_USER`, it's highly recommended to enable 2-Step Verification and generate an "App Password" for Nodemailer instead of using your main Gmail password.

## Backend Callback Processing (`src/routes/mpesaRoutes.js`)

The `/api/mpesa/callback` endpoint in `src/routes/mpesaRoutes.js` currently just logs the incoming data from Safaricom. You need to enhance this endpoint to:

1.  **Verify the Data:** Check the `Body.stkCallback.ResultCode`. A value of `0` indicates success.
2.  **Identify the Transaction:** Use `Body.stkCallback.MerchantRequestID` or `Body.stkCallback.CheckoutRequestID` to find the corresponding order or transaction attempt in your system (you might need to store these IDs when initiating the STK push).
3.  **Update Order Status:** If the payment was successful (`ResultCode: 0`), update the status of the corresponding order in your database to 'paid'.
4.  **Handle Failures:** If `ResultCode` is not `0`, log the error and potentially update the order status to 'failed'.
5.  **Respond to Safaricom:** Always respond with `res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });` to acknowledge receipt, regardless of whether your internal processing succeeded or failed.

## Frontend (`public/script.js`)

The frontend currently simulates the success message after a delay. For a real-time update:

1.  **Store Transaction ID:** When initiating the STK push, the backend should ideally return the `CheckoutRequestID` to the frontend.
2.  **Polling or WebSockets:**
    *   **Polling:** The frontend could periodically check a backend endpoint (e.g., `/api/orders/status/:checkoutRequestId`) to see if the payment status has been updated by the callback.
    *   **WebSockets:** A more efficient approach involves setting up a WebSocket connection. When the backend callback receives a success notification, it pushes a message via the WebSocket to the specific user's browser, triggering the success message and cart update.

## Going Live

1.  **Switch to Production Credentials:** Update your `.env` file with your production Daraja Consumer Key, Secret, Shortcode, Passkey, and uncomment/set the production API URLs (`MPESA_AUTH_URL`, `MPESA_STKPUSH_URL`).
2.  **Deploy:** Deploy your backend application to a server with a public HTTPS URL.
3.  **Register Production Callback URL:** Update the callback URL in your Daraja app settings to point to your live server's HTTPS callback endpoint.
4.  **Thorough Testing:** Perform thorough testing in the production environment.

This guide provides the necessary steps to integrate M-Pesa. Remember that handling payments requires careful implementation and security considerations.

