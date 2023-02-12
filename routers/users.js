const express = require("express");
const User = require("../models/User");
const authentification = require("../middlewares/authenfication");
const router = new express.Router();

//GET USER

router.get("/user", authentification, (req, res) => {
  try {
    res.status(200).json({
      message: "SUCCEED",
      data: req.user,
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
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
  const uptadeInfo = Object.keys(req.body);
  try {
    uptadeInfo.forEach((update) => (req.user[update] = req.body.update));
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
    const { id, action } = req.body;
    const user = req.user;
    if (!id || (action !== "follow" && action !== "unfollow"))
      res.status(400).json({
        status: "Bad Request",
        message: "Invalid requests are not allowed",
      });
    else if (id === user._id.toString())
      res.status(405).json({
        status: "Method Not Allowed",
        message: `User cannot ${action} himself`,
      });
    else {
      const otherUser = await User.findById(id);
      if (!otherUser)
        res
          .status(404)
          .json({ status: "Not Found", message: "False id are not allowed" });
      else if (!otherUser.verified)
        res.status(405).json({
          status: "Method Not Allowed",
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
        res.status(405).json({
          status: "Method Not Allowed",
          message: `You cannot ${action} twice`,
        });
      else {
        if (action === "follow") {
          await user.followings.push(id);
          await otherUser.followers.push(user._id);
        } else {
          await user.followings.filter((following) => following === id);
          await otherUser.followers.filter((follower) => follower === user._id);
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

router.delete("/users/reset", async (req, res) => {
  try {
    const response = await User.deleteMany({ email: /@/ });

    res.status(200).json({
      message: "SUCCEED",
      deleteCount: response.deletedCount,
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      error: error.message,
    });
  }
  res.status;
});
module.exports = router;
