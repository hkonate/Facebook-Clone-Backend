const express = require("express");
const router = new express.Router();
const validator = require("validator");
const EmailVerification = require("../models/EmailVerification");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const Email = require("../utils/otpVerificationEmail");

router.post("/otpVerification", async (req, res) => {
  try {
    const { otp, email } = req.body;
    if (!otp || !email) throw new Error("Empty fields are not allowed");

    const emailToVerification = await EmailVerification.findOne({ email });
    if (!emailToVerification) throw new Error("Wrong emails are not allowed");

    const isOtpValid = await bcrypt.compare(otp, emailToVerification.otp);
    if (!isOtpValid) throw new Error("False otp code is not allowed");

    if (emailToVerification.expiredAt < Date.now())
      throw new Error("Your otp code expired");

    const response = await EmailVerification.deleteMany({ email });

    const user = await User.findOne({ email: emailToVerification.email });

    user.verified = true;
    await user.save();
    res.status(200).json({
      status: "SUCCEED",
      message: "Your email has been validate",
      data: {
        user,
        deleteCount: response.deletedCount,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "ERROR",
      message: error.message,
    });
  }
});

router.post("/otpResend", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) throw new Error("Empty email are not allowed");
    const isAccount = await User.findOne({ email });
    if (!isAccount) throw new Error("False email are not allowed");
    await EmailVerification.deleteMany({ email });
    Email.sendOtpVerification(email, res);
  } catch (error) {
    res.status(401).json({
      message: "ERROR",
      error: error.message,
    });
  }
});

module.exports = router;
