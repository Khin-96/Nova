const express = require("express");
const axios = require("axios");
const Order = require("../models/Order");

const router = express.Router();

// --- Helper Function to Get Daraja API Token (Placeholder) ---
// In a real app, you should cache this token until it expires
async function getDarajaToken() {
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  // Force Sandbox for debugging if .env fails
  const authUrl = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
  // const authUrl = process.env.MPESA_AUTH_URL || "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";

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
  const { phone, amount, orderId } = req.body;

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
      // Link Mpesa request to Order if orderId provided
      if (orderId) {
        await Order.findByIdAndUpdate(orderId, {
          checkoutRequestId: response.data.CheckoutRequestID,
          merchantRequestId: response.data.MerchantRequestID,
          status: 'pending' // Ensure it's pending
        });
      }

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
router.post("/callback", async (req, res) => {
  console.log("--- M-Pesa Callback Received ---");
  const callbackData = req.body.Body.stkCallback;
  console.log(JSON.stringify(callbackData, null, 2));

  const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = callbackData;

  try {
    // Find order by CheckoutRequestID
    const order = await Order.findOne({ checkoutRequestId: CheckoutRequestID });

    if (order) {
      if (ResultCode === 0) {
        // Success: Extract Receipt Number
        const metadata = CallbackMetadata.Item;
        const receiptItem = metadata.find(item => item.Name === 'MpesaReceiptNumber');
        const receiptNumber = receiptItem ? receiptItem.Value : 'N/A';

        order.status = 'processing'; // Mark as paid
        order.mpesaReceiptNumber = receiptNumber;
        console.log(`Order ${order.orderId} paid successfully. Receipt: ${receiptNumber}`);
      } else {
        // Failure or Cancellation
        order.status = 'cancelled';
        console.log(`Order ${order.orderId} payment failed/cancelled. Result: ${ResultCode} (${ResultDesc})`);
      }
      await order.save();
    } else {
      console.warn(`No order found for CheckoutRequestID: ${CheckoutRequestID}`);
    }
  } catch (error) {
    console.error("Error processing M-Pesa callback:", error);
  }

  // Respond to Safaricom to acknowledge receipt
  res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
});


// --- Dynamic QR Code Endpoint ---
// @route   POST /api/mpesa/qrcode
// @desc    Generate M-Pesa Dynamic QR Code
// @access  Public
router.post("/qrcode", async (req, res) => {
  const { amount, refNo } = req.body;

  if (!amount || !refNo) {
    return res.status(400).json({ msg: "Amount and Reference Number are required." });
  }

  const qrUrl = "https://sandbox.safaricom.co.ke/mpesa/qrcode/v1/generate"; // Verify if sandbox or prod
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  const businessShortCode = process.env.MPESA_SHORTCODE; // Or specific Merchant Name

  try {
    const token = await getDarajaToken();

    const payload = {
      MerchantName: "Nova Wear", // Customize
      RefNo: refNo,
      Amount: parseInt(amount),
      TrxCode: "BG", // Buy Goods
      CPI: businessShortCode, // Credit Party Identifier (Till/Paybill)
      Size: "300"
    };

    const response = await axios.post(qrUrl, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.data && response.data.ResponseCode === "00") { // Check Safaricom docs for exact code success, usually 00 or 0
      // Safaricom ResponseCode for QR often is alphanumeric, doc says "AG_..."
      // We return the payload if QRCode exists
      res.json(response.data);
    } else if (response.data.QRCode) {
      // Sometimes success code isn't 00 but QRCode is present
      res.json(response.data);
    } else {
      console.error("QR Code Gen failed:", response.data);
      res.status(500).json({ msg: "Failed to generate QR Code.", details: response.data });
    }

  } catch (error) {
    console.error("Error generating QR Code:", error.response ? error.response.data : error.message);
    res.status(500).json({ msg: "Server error during QR Code request." });
  }
});

module.exports = router;



