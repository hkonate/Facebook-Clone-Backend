const express = require("express");
const router = express.Router();
const Password = require("../utils/otpPasswordReset");
const PasswordReset = require("../models/PasswordReset");
const Checker = require("../utils/controlRequest");

//RESET PASSWORD

router.post("/password/Reset", (req, res) => {
  try {
    if (!Checker.controlRequest(req.body, ["email"]))
      res.status(400).json({
        status: "Bad Request",
        message: "Wrong format are not allowed",
      });
    const { email } = req.body;
    if (!email)
      res.status(400).json({
        status: "Bad Request",
        message: "Empty email are not allowed",
      });

    Password.sendOtpPasswordReset(email, res);
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      message: error.message,
    });
  }
});

//ADD NEW PASSWORD

router.post("/newPassword", async (req, res) => {
  try {
    if (
      !Checker.controlRequest(req.body, [
        "otp",
        "id",
        "password",
        "confirmPassword",
      ])
    )
      res.status(400).json({
        status: "Bad Request",
        message: "Wrong format are not allowed",
      });
    const { otp, id, password, confirmPassword } = req.body;
    if (!otp || !id || !password || !confirmPassword)
      res.status(400).json({
        status: "Bad Request",
        message: "Empty field are not allowed",
      });

    const user = await PasswordReset.verifyOtpAndChangePassword(
      otp,
      id,
      password,
      confirmPassword,
      res
    );
    await user.save();

    await PasswordReset.deleteMany({ email: user.email });

    res.status(200).json({
      status: "SUCCEED",
      message: "Password updated",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      message: error.message,
    });
  }
});

//RESEND OTP FOR PASSWORD

router.post("/password/otpResend", async (req, res) => {
  try {
    if (!Checker.controlRequest(req.body, ["email"]))
      res.status(400).json({
        status: "Bad Request",
        message: "Wrong format are not allowed",
      });
    const { email } = req.body;
    if (!email)
      res.status(400).json({
        status: "Bad Request",
        message: "Empty field are not allowed",
      });
    await PasswordReset.deleteMany({ email });
    Password.sendOtpPasswordReset(email, res);
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      message: error.message,
    });
  }
});

module.exports = router;
