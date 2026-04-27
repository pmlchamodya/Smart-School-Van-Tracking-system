// backend/utils/sendEmail.js
const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  try {
    // 1. Create a Transporter - This is the service that will send the email (e.g., Gmail, Outlook)
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // 2. Define the Email Options
    const mailOptions = {
      from: `Smart School Van <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      html: options.html, // We use HTML to make the receipt look beautiful!
    };

    // 3. Actually Send the Email
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully to:", options.email);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

module.exports = sendEmail;
