const express = require("express");
const router = express.Router();
const Password = require("../utils/otpPasswordReset");
const PasswordReset = require("../models/PasswordReset");
const validator = require("validator");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

router.post("/password/Reset", (req, res) => {
  try {
    const { email } = req.body;
    if (!email) throw new Error("Empty email are not allowed");

    Password.sendOtpPasswordReset(email, res);
  } catch (error) {
    res.status(400).json({
      status: "ERROR",
      message: error.message,
    });
  }
});

router.post("/newPassword", async (req, res) => {
  try {
    const { otp, email, password, confirmPassword } = req.body;
    if (!otp || !email || !password || !confirmPassword)
      throw new Error("Empty field are not allowed");
    if (!validator.equals(confirmPassword, password))
      throw new Error("Your passwords must be the same !");
    const passwordReset = await PasswordReset.findOne({ email });
    if (!passwordReset) throw new Error("This account does not exist");
    if (passwordReset.expiredAt < Date.now())
      throw new Error("Your otp have expired");
    const isOtpValid = await bcrypt.compare(otp, passwordReset.otp);
    if (!isOtpValid) throw new Error("Invalid otp are not allowed");
    const user = await User.findOne({ email });
    user.password = password;
    const error = user.validateSync();
    if (error) {
      res.status(400).json({
        status: "ERROR",
        message: error,
      });
    } else {
      await PasswordReset.deleteOne({ email: user.email });
      await user.save();
      res.status(200).json({
        status: "SUCCEED",
        message: "Password updated",
        data: user,
      });
    }
  } catch (error) {
    res.status(400).json({
      status: "ERROR",
      message: error.message,
    });
  }
});

router.post("/password/otpResend", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) throw new Error("Empty email is not allowed");
    await PasswordReset.deleteMany({ email });
    Password.sendOtpPasswordReset(email, res);
  } catch (error) {
    res.status(400).json({
      status: "ERROR",
      message: error.message,
    });
  }
});

module.exports = router;
