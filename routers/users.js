const express = require("express");
const User = require("../models/User");
const authentification = require("../middlewares/authenfication");
const router = new express.Router();
const Email = require("../utils/otpVerificationEmail");
const validator = require("validator");

router.post("/user", async (req, res) => {
  try {
    if (!validator.equals(req.body.confirmPassword, req.body.password))
      throw new Error("Your passwords must be the same !");
    delete req.body.confirmPassword;
    const user = new User(req.body);
    let error = user.validateSync();
    if (error) {
      res.status(400).json({
        status: "ERROR",
        message: error,
      });
    } else {
      user.verified = false;
      await user.save();
      Email.sendOtpVerification(user.email, res);
    }
  } catch (error) {
    res.status(400).json({
      status: "ERROR",
      message: error.message,
    });
  }
});

router.post("/user/login", async (req, res) => {
  try {
    const user = await User.findUser(req.body.email, req.body.password);
    const authToken = user.generateAuthTokenAndSaveUser();
    res.status(200).json({
      status: "SUCCEED",
      data: { user, authToken },
    });
  } catch (error) {
    res.status(400).json({
      status: "ERROR",
      message: error.message,
    });
  }
});

router.patch("/user/update", authentification, async (req, res) => {
  const uptadeInfo = Object.keys(req.body);
  try {
    uptadeInfo.forEach((update) => (req.user[update] = req.body.update));
    await req.user.save();
    res.status(200).json({
      status: "SUCCEED",
      data: req.user,
    });
  } catch (error) {
    res.status(400).json({
      status: "ERROR",
      message: error.message,
    });
  }
});

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
    res.status(400).json({
      status: "ERROR",
      message: error.message,
    });
  }
});

router.post("/user/logout/all", authentification, async (req, res) => {
  try {
    req.user.authTokens = [];
    req.user.save();
    res.status(200).json({
      message: "SUCCEED",
      data: req.user,
    });
  } catch (error) {
    res.status(400).json({
      status: "ERROR",
      message: error.message,
    });
  }
});

router.delete("/user/delete", authentification, async (req, res) => {
  try {
    await req.user.remove();
    res.status(400).json({
      status: "SUCCEED",
      data: req.user,
    });
  } catch (error) {
    res.status(400).json({
      status: "ERROR",
      message: error.message,
    });
  }
});

router.delete("/users/reset", async (req, res) => {
  try {
    const response = await User.deleteMany({ email: /@/ });

    res.status(200).json({
      message: "SUCCEED",
      deleteCount: response.deletedCount,
    });
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
  res.status;
});
module.exports = router;
