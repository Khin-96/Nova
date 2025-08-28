const express = require("express");
const axios = require("axios");

const router = express.Router();

// --- Helper Function to Get Daraja API Token (Placeholder) ---
// In a real app, you should cache this token until it expires
async function getDarajaToken() {
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  const authUrl = process.env.MPESA_AUTH_URL || "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"; // Use sandbox by default

  if (!consumerKey || !consumerSecret) {
    console.error("MPESA_CONSUMER_KEY or MPESA_CONSUMER_SECRET not set in .env");
    throw new Error("M-Pesa API credentials missing.");
  }

  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

  try {
    const response = await axios.get(authUrl, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });
    return response.data.access_token;
  } catch (error) {
    console.error("Error getting Daraja token:", error.response ? error.response.data : error.message);
    console.error("Full error object:", error);
    throw new Error("Failed to authenticate with Daraja API.");
  }
}

// --- STK Push Endpoint ---
// @route   POST /api/mpesa/stkpush
// @desc    Initiate M-Pesa STK Push
// @access  Public (should be protected in a real app)
router.post("/stkpush", async (req, res) => {
  const { phone, amount } = req.body;

  // Basic validation
  if (!phone || !amount) {
    return res.status(400).json({ msg: "Phone number and amount are required." });
  }

  // Validate and format phone number (ensure it starts with 254)
  let formattedPhone = phone.replace(/\s+/g, ""); // Remove spaces
  if (formattedPhone.startsWith("07")) {
    formattedPhone = "254" + formattedPhone.substring(1);
  } else if (formattedPhone.startsWith("+254")) {
    formattedPhone = formattedPhone.substring(1);
  }
  if (!/^254\d{9}$/.test(formattedPhone)) {
    return res.status(400).json({ msg: "Invalid phone number format. Use 2547..." });
  }

  const parsedAmount = Math.round(parseFloat(amount)); // Use whole numbers for M-Pesa
  if (isNaN(parsedAmount) || parsedAmount < 1) {
    return res.status(400).json({ msg: "Invalid amount." });
  }

  // --- Daraja API Call --- 
  const stkPushUrl = process.env.MPESA_STKPUSH_URL || "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest"; // Sandbox URL
  const businessShortCode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  const callbackURL = process.env.MPESA_CALLBACK_URL; // IMPORTANT: Must be a publicly accessible HTTPS URL

  if (!businessShortCode || !passkey || !callbackURL) {
    console.error("MPESA_SHORTCODE, MPESA_PASSKEY, or MPESA_CALLBACK_URL not set in .env");
    return res.status(500).json({ msg: "M-Pesa configuration incomplete on server." });
  }

  const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, "").slice(0, 14);
  const password = Buffer.from(`${businessShortCode}${passkey}${timestamp}`).toString("base64");

  const payload = {
    BusinessShortCode: businessShortCode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline", // Or "CustomerBuyGoodsOnline"
    Amount: parsedAmount,
    PartyA: formattedPhone, // Customer phone number
    PartyB: businessShortCode, // Your Paybill or Till Number
    PhoneNumber: formattedPhone, // Customer phone number again
    CallBackURL: callbackURL,
    AccountReference: "NovaWearOrder", // Customize as needed (e.g., Order ID)
    TransactionDesc: "Payment for Nova Wear items", // Customize
  };

  try {
    const token = await getDarajaToken();

    const response = await axios.post(stkPushUrl, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    // Check Daraja response
    if (response.data && response.data.ResponseCode === "0") {
      // STK Push initiated successfully
      console.log("STK Push initiated:", response.data);
      res.json({ msg: "STK Push initiated. Please enter your M-Pesa PIN on your phone.", data: response.data });
    } else {
      // STK Push initiation failed
      console.error("STK Push failed:", response.data);
      res.status(500).json({ msg: response.data.ResponseDescription || "Failed to initiate M-Pesa payment." });
    }

  } catch (error) {
    console.error("Error initiating STK Push:", error.response ? error.response.data : error.message);
    res.status(500).json({ msg: error.message || "Server error during M-Pesa request." });
  }
});

// --- Callback Endpoint (Example) ---
// @route   POST /api/mpesa/callback
// @desc    Receive M-Pesa payment confirmation/result
// @access  Public (from Safaricom)
router.post("/callback", (req, res) => {
  console.log("--- M-Pesa Callback Received ---");
  console.log(JSON.stringify(req.body, null, 2));
  console.log("---------------------------------");

  // TODO: Process the callback data
  // 1. Check if ResultCode is 0 (success)
  // 2. Find the corresponding order in your database using MerchantRequestID or CheckoutRequestID
  // 3. Update the order status to \'paid\'
  // 4. Handle potential errors or cancellations (ResultCode != 0)

  // Respond to Safaricom to acknowledge receipt
  res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
});


module.exports = router;



