const optVerification = require("../models/EmailVerification");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");

module.exports.sendOtpVerification = async (email, res) => {
  try {
    const otp = Math.floor(100000 + Math.random() * 900000);

    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
    const mailOptions = {
      from: process.env.AUTH_EMAIL,
      to: email,
      subject: "Verify Your Email",
      html: `<p>Enter ${otp} in the app to verify your email address and complete the signup<p>
                <p>this code expires in 1 hours<p>`,
    };
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otp.toString(), salt);

    const newOtp = await new optVerification({
      email,
      otp: hashedOtp,
      createdAt: Date.now(),
    });
    await newOtp.save();

    await transporter.sendMail(mailOptions);

    res.status(202).json({
      status: "PENDING",
      message: "Verification otp email sent",
      data: newOtp,
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      message: error.message,
    });
  }
};
