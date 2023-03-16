const express = require("express");
const User = require("../models/User");
const authentification = require("../middlewares/authentification");
const router = new express.Router();
const Checker = require("../utils/controlRequest");
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;
const Converter = require("../utils/convertToBase64");
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

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
      (user) =>
        !user.followers.includes(req.user._id.toString()) &&
        user.verified &&
        user._id.toString() !== req.user._id.toString()
    );
    const data = users;
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({
      message: "ERROR",
      error: error.message,
    });
  }
});

//UPDATE USER INFOS

router.patch(
  "/user/update",
  authentification,
  fileUpload(),
  async (req, res) => {
    try {
      const updateInfo = Object.keys(req.body);
      const { coverPicture, profilePicture } = req.files;
      if (
        !Checker.controlRequest(req.body, [
          "from",
          "city",
          "firstname",
          "lastname",
          "age",
        ])
      )
        res.status(400).json({
          status: "Bad Request",
          message: "Wrong format are not allowed",
        });

      if (updateInfo.length === 0 && !coverPicture && !profilePicture)
        res.status(400).json();
      else {
        if (updateInfo.length > 0)
          updateInfo.forEach((update) => (req.user[update] = req.body[update]));

        // Suppression de l'image existante dans Cloudinary
        if (coverPicture || profilePicture) {
          if (req.user.coverPicture) {
            await cloudinary.uploader.destroy(
              `facebook/users/${req.user._id}/cover/${req.user.firstname} - ${req.user._id}`
            );
            req.user.coverImage = undefined;
          }
          if (req.user.profileImage) {
            await cloudinary.uploader.destroy(
              `facebook/users/${req.user._id}/avatar/${req.user.firstname} - ${req.user._id}`
            );
            req.user.profileImage = undefined;
          }
        }

        // Upload de la nouvelle image dans Cloudinary
        if (coverPicture) {
          const coverUploadResult = await cloudinary.uploader.upload(
            Converter.convertToBase64(coverPicture),
            {
              folder: `facebook/users/${req.user._id}/cover`,
              public_id: `${req.user.firstname} - ${req.user._id}`,
            }
          );
          req.user.coverPicture = coverUploadResult.secure_url;
        }

        if (profilePicture) {
          const profileUploadResult = await cloudinary.uploader.upload(
            Converter.convertToBase64(profilePicture),
            {
              folder: `facebook/users/${req.user._id}/avatar`,
              public_id: `${req.user.firstname} - ${req.user._id}`,
            }
          );
          req.user.profilePicture = profileUploadResult.secure_url;
        }

        const data = await req.user.save();

        res.status(200).json(data);
      }
    } catch (error) {
      res.status(500).json({
        status: "ERROR",
        error: error,
      });
    }
  }
);

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
    //delete user picture
    await cloudinary.api.delete_resources_by_prefix(
      `facebook/users/${req.user._id}/avatar`
    );

    const avatarResources = await cloudinary.search
      .expression(`folder:facebook/users/${req.user._id}/avatar`)
      .execute();

    if (avatarResources.total_count === 1) {
      await cloudinary.api.delete_folder(
        `facebook/users/${req.user._id}/avatar`
      );
    }

    //delete all covers
    await cloudinary.api.delete_resources_by_prefix(
      `facebook/users/${req.user._id}/cover`
    );

    const coverResources = await cloudinary.search
      .expression(`folder:facebook/users/${req.user._id}/cover`)
      .execute();

    if (coverResources.total_count === 1) {
      await cloudinary.api.delete_folder(
        `facebook/users/${req.user._id}/cover`
      );
    }

    //delete all posts
    await cloudinary.api.delete_resources_by_prefix(
      `facebook/users/${req.user._id}/posts`
    );

    const postResources = await cloudinary.search
      .expression(`folder:facebook/users/${req.user._id}/posts`)
      .execute();

    if (postResources.total_count === 1)
      await cloudinary.api.delete_folder(
        `facebook/users/${req.user._id.toString()}/posts`
      );

    const userResources = await cloudinary.search
      .expression(`folder:facebook/users/${req.user._id}`)
      .execute();

    if (userResources.total_count === 0)
      await cloudinary.api.delete_folder(`facebook/users/${req.user._id}`);

    await req.user.remove();

    res.status(200).json({
      status: "SUCCEED",
      data: req.user,
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      error: error,
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
