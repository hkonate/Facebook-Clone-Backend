const express = require("express");
const User = require("../models/User");
const authentification = require("../middlewares/authentification");
const router = new express.Router();
const Checker = require("../utils/controlRequest");

//GET USER

router.get("/user/:id", authentification, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user)
      res.status(404).json({
        status: "NOT FOUND",
        message: "This account does not exist",
      });
    res.status(200).json({
      message: "SUCCEED",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      status: "EROR",
      error: error.message,
    });
  }
});

//GET ALL USERS

router.get("/users", authentification, async (req, res) => {
  try {
    const users = (await User.find()).filter(
      (user) => user._id === req.user._id && !user.verified
    );
    res.status(200).json({
      status: "SUCCEED",
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      message: "ERROR",
      error: error.message,
    });
  }
});

//UPDATE USER INFOS

router.patch("/user/update", authentification, async (req, res) => {
  try {
    const updateInfo = Object.keys(req.body);
    if (
      !Checker.controlRequest(req.body, [
        "from",
        "city",
        "firstname",
        "lastname",
        "age",
        "profilePicture",
        "coverPicture",
      ])
    )
      res.status(400).json({
        status: "Bad Request",
        message: "Wrong format are not allowed",
      });
    if (updateInfo.length === 0) res.status(202).json();
    updateInfo.forEach((update) => (req.user[update] = req.body.update));
    await req.user.save();
    res.status(200).json({
      status: "SUCCEED",
      data: req.user,
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      error: error.message,
    });
  }
});

//FOLLOW OR UNFOLLOW AN USER

router.patch("/user/connections", authentification, async (req, res) => {
  try {
    if (!Checker.controlRequest(req.body, ["id", "action"]))
      res.status(400).json({
        status: "Bad Request",
        message: "Wrong format are not allowed",
      });
    const { id, action } = req.body;
    let user = req.user;
    if (!id || (action !== "follow" && action !== "unfollow"))
      res.status(400).json({
        status: "Bad Request",
        message: "Invalid requests are not allowed",
      });
    else if (id === user._id.toString())
      res.status(403).json({
        status: "FORBIDDEN",
        message: `User cannot ${action} himself`,
      });
    else {
      let otherUser = await User.findById(id);

      if (!otherUser)
        res
          .status(404)
          .json({ status: "Not Found", message: "False id are not allowed" });
      else if (!otherUser.verified)
        res.status(403).json({
          status: "FORBIDDEN",
          message: "Account not verify",
        });
      else if (
        ((user.followings.indexOf(id) !== -1 ||
          otherUser.followers.indexOf(user._id.toString()) !== -1) &&
          action === "follow") ||
        ((user.followings.indexOf(id) === -1 ||
          otherUser.followers.indexOf(user._id.toString()) === -1) &&
          action === "unfollow")
      )
        res.status(202).json();
      else {
        if (action === "follow") {
          user.followings.push(id);
          otherUser.followers.push(user._id.toString());
          await user.save();
          await otherUser.save();
        } else {
          user.followings = user.followings.filter(
            (following) => following !== id
          );
          otherUser.followers = otherUser.followers.filter(
            (follower) => follower !== user._id?.toString()
          );
        }
        await user.save();
        await otherUser.save();
      }
    }
    res.status(200).json({
      status: "SUCCEED",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      error: error.message,
    });
  }
});

//DELETE USER'S ACCOUNT

router.delete("/user/delete", authentification, async (req, res) => {
  try {
    await req.user.remove();
    res.status(200).json({
      status: "SUCCEED",
      data: req.user,
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      error: error.message,
    });
  }
});

//DELETE ALL USERS ACCOUNT

router.delete("/users/reset", authentification, async (req, res) => {
  try {
    if (!req.user.isAdmin)
      res.status(405).json({
        status: "Method Not Allowed",
        message: "You are not allow to delete any ressources",
      });

    const response = await User.deleteMany({ email: /@/ });
    res.status(200).json({
      status: "SUCCEED",
      deleteCount: response.deletedCount,
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      error: error.message,
    });
  }
});
module.exports = router;
