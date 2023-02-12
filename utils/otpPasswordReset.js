const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const PasswordReset = require("../models/PasswordReset");

const User = require("../models/User");

module.exports.sendOtpPasswordReset = async (email, res) => {
  try {
    if (!email)
      res.status(400).json({
        status: "Bad Request",
        message: "Empty fields are not allowed",
      });

    const user = await User.findOne({ email });
    if (!user)
      res.status(404).json({
        status: "Not Found",
        message: "This account does not exist",
      });

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
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otp.toString(), salt);
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
    res.status(500).json({
      status: "ERROR",
      message: error.message,
    });
  }
};
