const express = require("express");
const router = new express.Router();
const User = require("../models/User");
const Email = require("../utils/otpVerificationEmail");
const validator = require("validator");
const authentification = require("../middlewares/authenfication");

//REGISTER ACCOUNT

router.post("/register", async (req, res) => {
  try {
    if (!validator.equals(req.body.confirmPassword, req.body.password))
      throw new Error("Your passwords must be the same !");
    delete req.body.confirmPassword;
    const user = new User(req.body);
    let error = user.validateSync();
    if (error) {
      res.status(400).json({
        status: "Bad Request",
        message: error,
      });
    } else {
      user.verified = false;
      await user.save();
      Email.sendOtpVerification(user.email, res);
    }
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      message: error.message,
    });
  }
});

//LOGIN ACCOUNT

router.post("/login", async (req, res) => {
  try {
    const user = await User.findUser(req.body.email, req.body.password);
    const authToken = user.generateAuthTokenAndSaveUser();
    res.status(200).json({
      status: "SUCCEED",
      data: { user, authToken },
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      message: error.message,
    });
  }
});

//LOGOUT ACCOUNT

router.post("/user/logout", authentification, async (req, res) => {
  try {
    req.user.authTokens = req.user.authTokens.filter(
      (authToken) => authToken.authToken !== req.authToken
    );
    req.user.save();
    res.status(200).json({
      message: "SUCCEED",
      data: req.user,
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      message: error.message,
    });
  }
});

//LOGOUT ALL USER'S DEVICES

router.post("/user/logout/all", authentification, async (req, res) => {
  try {
    req.user.authTokens = [];
    req.user.save();
    res.status(200).json({
      message: "SUCCEED",
      data: req.user,
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      message: error.message,
    });
  }
});

module.exports = router;
