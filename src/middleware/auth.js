const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

function verifyAdminKey(req, res, next) {
    if (!ADMIN_API_KEY) {
        console.error("ADMIN_API_KEY is not set in environment variables.");
        return res.status(500).json({ msg: "Server configuration error." });
    }

    const apiKey = req.headers['x-admin-api-key'] || req.query.adminKey;

    if (!apiKey || apiKey !== ADMIN_API_KEY) {
        return res.status(401).json({ msg: "Unauthorized. Invalid or missing API Key." });
    }

    next();
}

module.exports = verifyAdminKey;
