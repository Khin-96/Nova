const axios = require('axios');

async function getDarajaToken() {
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    const authUrl = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";

    if (!consumerKey || !consumerSecret) {
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
        const status = error.response?.status;
        const data = error.response?.data;
        console.error("Daraja token request failed", {
            status,
            data,
            authUrl,
            hasConsumerKey: Boolean(consumerKey),
            hasConsumerSecret: Boolean(consumerSecret),
        });
        throw new Error("Failed to authenticate with Daraja API.");
    }
}

async function queryStkStatus(checkoutRequestId) {
    const queryUrl = "https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query";
    const businessShortCode = process.env.MPESA_SHORTCODE;
    const passkey = process.env.MPESA_PASSKEY;

    if (!businessShortCode || !passkey) {
        throw new Error("M-Pesa configuration incomplete.");
    }

    const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, "").slice(0, 14);
    const password = Buffer.from(`${businessShortCode}${passkey}${timestamp}`).toString("base64");

    const payload = {
        BusinessShortCode: businessShortCode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
    };

    const token = await getDarajaToken();

    const response = await axios.post(queryUrl, payload, {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });

    return response.data;
}

module.exports = {
    getDarajaToken,
    queryStkStatus
};
