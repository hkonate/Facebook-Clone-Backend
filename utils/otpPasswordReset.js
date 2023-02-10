const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const PasswordReset = require("../models/PasswordReset");

const User = require("../models/User");

module.exports.sendOtpPasswordReset = async (email, res) => {
  try {
    const user = await User.findOne({ email });
    if (!user) throw new Error("This account does not exist");

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

    const otp = Math.floor(100000 + Math.random() * 900000);

    const mailOptions = {
      from: process.env.AUTH_USER,
      to: email,
      subject: "Password reset",
      html: `<p>Enter ${otp} in the app in order to reset your password</p>
        <p>this code expires in 1 hour</p>`,
    };

    const hashedOtp = await bcrypt.hash(otp.toString(), 10);
    const passwordReset = await new PasswordReset({
      email,
      otp: hashedOtp,
    });
    await passwordReset.save();

    await transporter.sendMail(mailOptions);
    res.status(202).json({
      status: "PENDING",
      message: "Reset otp password sent",
      data: passwordReset,
    });
  } catch (error) {
    res.status(400).json({
      status: "ERROR",
      message: error.message,
    });
  }
};
