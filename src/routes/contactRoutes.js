const express = require("express");
const nodemailer = require("nodemailer");
const Contact = require("../models/Contact");

const router = express.Router();

// @route   POST /api/contact
// @desc    Save contact form submission and send email
// @access  Public
router.post("/", async (req, res) => {
  const { name, email, message } = req.body;

  // Basic validation
  if (!name || !email || !message) {
    return res.status(400).json({ msg: "Please fill in all fields." });
  }

  try {
    // 1. Save submission to database
    const newContact = new Contact({
      name,
      email,
      message,
    });
    await newContact.save();

    // 2. Send email notification
    try {
      // Configure Nodemailer transporter using environment variables
      // Ensure EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS are in .env
      let transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || "smtp.gmail.com", // Default to Gmail SMTP
        port: parseInt(process.env.EMAIL_PORT) || 587, // Default to 587 (TLS)
        secure: (process.env.EMAIL_PORT === "465"), // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER, // Your email address (e.g., from Gmail)
          pass: process.env.EMAIL_PASS, // Your email password or App Password
        },
        // Optional: Add TLS options if needed, e.g., for self-signed certs
        // tls: {
        //   rejectUnauthorized: false
        // }
      });

      // Email options
      let mailOptions = {
        from: `"Nova Wear Contact Form" <${process.env.EMAIL_USER}>`, // Sender address (must be your authenticated email)
        to: "novawearke@gmail.com", // Receiver address (your specified email)
        replyTo: email, // Set reply-to to the user's email
        subject: `New Contact Form Submission from ${name}`, // Subject line
        text: `You have received a new message from your website contact form.\n\nName: ${name}\nEmail: ${email}\nMessage:\n${message}`,
        html: `<p>You have received a new message from your website contact form.</p>
               <h3>Contact Details</h3>
               <ul>
                 <li><strong>Name:</strong> ${name}</li>
                 <li><strong>Email:</strong> ${email}</li>
               </ul>
               <h3>Message</h3>
               <p>${message.replace(/\n/g, 
'<br>')}</p>` // Format message with line breaks
      };

      // Send mail
      await transporter.sendMail(mailOptions);
      console.log("Contact form email sent successfully.");
      res.status(201).json({ msg: "Message received! We will get back to you soon." });

    } catch (emailError) {
      console.error("Error sending contact form email:", emailError);
      // Still return success to user as DB save worked, but log the email error
      // In a production scenario, you might want a more robust error handling/notification system here
      res.status(201).json({ msg: "Message received (email notification failed internally)." });
    }

  } catch (dbError) {
    console.error("Error saving contact submission:", dbError.message);
    if (dbError.name === 'ValidationError') {
        let errors = {};
        Object.keys(dbError.errors).forEach((key) => {
            errors[key] = dbError.errors[key].message;
        });
        const firstError = Object.values(errors)[0];
        return res.status(400).json({ msg: firstError || "Validation failed." });
    }
    res.status(500).json({ msg: "Server Error: Could not save message." });
  }
});

module.exports = router;

