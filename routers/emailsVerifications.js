const express = require("express");
const router = new express.Router();
const EmailVerification = require("../models/EmailVerification");
const User = require("../models/User");
const Email = require("../utils/otpVerificationEmail");

//ACTIVATE ACCOUNT

router.post("/otpVerification", async (req, res) => {
  try {
    const { otp, id } = req.body;
    if (!otp || !id)
      res.status(400).json({
        status: "Bad Request",
        message: "Empty field are not allowed",
      });
    const { user, deleteCount } = await EmailVerification.activateAccount(
      id,
      otp,
      res
    );
    await user.save();
    res.status(200).json({
      status: "SUCCEED",
      message: "Your email has been validate",
      data: {
        user,
        deleteCount,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      error: error.message,
    });
  }
});

//RESEND OTP FOR EMAIL VERIFICATION

router.post("/otpResend", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      res.status(400).json({
        status: "Bad Request",
        message: "Empty field are not allowed",
      });
    const user = await User.findOne({ email });
    if (!user)
      res.status(404).json({
        status: "Not Found",
        message: "User not found",
      });
    if (user.verified) res.status(204).json();
    await EmailVerification.deleteMany({ email });
    Email.sendOtpVerification(email, res);
  } catch (error) {
    res.status(500).json({
      message: "ERROR",
      error: error.message,
    });
  }
});

module.exports = router;
