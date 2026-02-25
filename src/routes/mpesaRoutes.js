const express = require("express");
const axios = require("axios");
const Order = require("../models/Order");

const router = express.Router();

const { getDarajaToken, queryStkStatus } = require("../services/mpesaService");

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
    console.log("STK push request init", {
      orderId: orderId || null,
      amount: parsedAmount,
      phonePrefix: formattedPhone.slice(0, 6),
      stkPushUrl,
      callbackURL,
      hasShortCode: Boolean(businessShortCode),
      hasPasskey: Boolean(passkey),
    });

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
        try {
          console.log(`Linking STK Push to Order Record: ${orderId}`);
          // Force orderId to string explicitly to prevent Mongoose cast issues
          const order = await Order.findOne({ orderId: { $eq: String(orderId) } });
          if (order) {
            order.checkoutRequestId = response.data.CheckoutRequestID;
            order.merchantRequestId = response.data.MerchantRequestID;
            order.status = 'pending';
            await order.save();
            console.log(`Order record updated for: ${orderId}`);
          } else {
            console.warn(`Warning: Order ${orderId} not found for linking.`);
          }
        } catch (error) {
          console.error("Non-fatal error updating order record:", error);
          // Log the error but do not prevent the STK push success response to the client
          // as the Daraja API call itself was successful.
        } finally {
          // We don't throw here so the user still gets the STK push if Daraja succeeded
        }
      }

      console.log("STK Push initiated:", response.data);
      res.json({ msg: "STK Push initiated. Please enter your M-Pesa PIN on your phone.", data: response.data });
    } else {
      // STK Push initiation failed
      console.error("STK Push failed:", response.data);
      res.status(500).json({ msg: response.data.ResponseDescription || "Failed to initiate M-Pesa payment." });
    }

  } catch (error) {
    const status = error.response?.status;
    const data = error.response?.data;
    console.error("Error initiating STK Push", {
      status,
      data,
      message: error.message,
      stkPushUrl,
    });
    res.status(500).json({ msg: "Payment failed. Please try again." });
  }
});

// --- Query Status Endpoint ---
// @route   POST /api/mpesa/query
// @desc    Check the status of an M-Pesa STK Push
// @access  Public
router.post("/query", async (req, res) => {
  const { checkoutRequestId } = req.body;

  if (!checkoutRequestId) {
    return res.status(400).json({ msg: "CheckoutRequestID is required." });
  }

  try {
    const data = await queryStkStatus(checkoutRequestId);
    console.log("M-Pesa Query Status", {
      checkoutRequestId,
      responseCode: data?.ResponseCode,
      responseDescription: data?.ResponseDescription,
      resultCode: data?.ResultCode,
      resultDesc: data?.ResultDesc,
    });

    // Update order status if query was successful (ResponseCode === "0")
    if (data && String(data.ResponseCode) === "0") {
      const { ResultCode, ResultDesc } = data;

      const order = await Order.findOne({ checkoutRequestId });
      if (order) {
        order.paymentResult = ResultDesc; // Store feedback from Safaricom
        if (String(ResultCode) === "0") {
          // Success
          order.status = 'processing';
          console.log(`Order ${order.orderId} status updated to 'processing' via query.`);
        } else {
          // Any non-zero code is a failure (cancelled, insufficient funds, etc.)
          order.status = 'cancelled';
          console.log(`Order ${order.orderId} status updated to 'cancelled' (ResultCode: ${ResultCode}) via query.`);
        }
        await order.save();
      }
    }

    res.json(data);
  } catch (error) {
    console.error("Error querying M-Pesa status:", error.message);
    res.status(500).json({
      msg: "Failed to query status from M-Pesa.",
      error: error.message
    });
  }
});

// --- Callback Endpoint (Example) ---
// @route   POST /api/mpesa/callback
// @desc    Receive M-Pesa payment confirmation/result
// @access  Public (from Safaricom)
router.post("/callback", async (req, res) => {
  console.log("--- M-Pesa Callback Received ---");
  const callbackData = req.body && req.body.Body && req.body.Body.stkCallback;

  if (!callbackData) {
    console.error("Invalid callback data received");
    return res.status(400).json({ ResultCode: 1, ResultDesc: "Invalid payload" });
  }

  console.log(JSON.stringify(callbackData, null, 2));

  const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = callbackData;

  try {
    // Find order by CheckoutRequestID
    const order = await Order.findOne({ checkoutRequestId: CheckoutRequestID });

    if (order) {
      order.paymentResult = ResultDesc; // Store feedback
      if (String(ResultCode) === "0") {
        // Success: Extract Receipt Number
        let receiptNumber = 'N/A';
        if (CallbackMetadata && CallbackMetadata.Item) {
          const metadata = CallbackMetadata.Item;
          const receiptItem = metadata.find(item => item.Name === 'MpesaReceiptNumber');
          receiptNumber = receiptItem ? receiptItem.Value : 'N/A';
        }

        order.status = 'processing'; // Mark as paid
        order.mpesaReceiptNumber = receiptNumber;
        console.log(`Order ${order.orderId} paid successfully via callback. Receipt: ${receiptNumber}`);
      } else {
        // Failure or Cancellation
        order.status = 'cancelled';
        console.log(`Order ${order.orderId} payment failed/cancelled via callback. Result: ${ResultCode} (${ResultDesc})`);
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



