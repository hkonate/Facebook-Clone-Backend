const router = require("express").Router();
const Post = require("../models/Post");
const authentification = require("../middlewares/authentification");
const Checker = require("../utils/controlRequest");

//create a post

router.post("/post/create", authentification, async (req, res) => {
  try {
    if (!req.body.desc)
      res.status(400).json({
        status: "Bad Request",
        message: "Empty fields are not allowed",
      });
    else if (!Checker.controlRequest(req.body, ["desc"]))
      res.status(400).json({
        status: "Bad Request",
        message: "Wrong format are not allowed",
      });
    const newPost = new Post({ ...req.body, userId: req.user._id.toString() });
    const error = newPost.validateSync();
    if (error)
      res.status(400).json({
        status: "Bad Request",
        message: "Wrong format are not allowed",
      });
    await newPost.save();
    res.status(200).json({
      status: "SUCCEED",
      data: newPost,
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      error,
    });
  }
});

//get a post

router.get("/post/:id", authentification, async (req, res) => {
  try {
    if (!req.params.id)
      res.status(400).json({
        status: "Bad Request",
        message: "Empty fields are not allowed",
      });
    const post = await Post.findById(req.params.id);
    if (post)
      res.status(200).json({
        status: "SUCCEED",
        data: post,
      });
    else
      res.status(404).json({
        status: "Not Found",
        message: "This user does not have post yet",
      });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      error,
    });
  }
});

//update a post

router.patch("/post/update/:id", authentification, async (req, res) => {
  try {
    if (!req.body.desc && !req.body.img)
      res.status(400).json({
        status: "Bad Request",
        message: "Empty fields are not allowed",
      });
    //checking if the user trying to update unauthorize fields
    else if (!Checker.controlRequest(req.body, ["desc", "img"]))
      res.status(400).json({
        status: "Bad Request",
        message: "Wrong format are not allowed",
      });
    let post = await Post.findById(req.params.id);
    if (!post)
      res.status(404).json({
        status: "Not Found",
        message: "False id are not allowed",
      });
    //the user can only update his post
    if (post.userId === req.user._id.toString()) {
      const keysToUpdate = Object.keys(req.body);
      keysToUpdate.forEach((key) => {
        post[key] = req.body[key];
      });
      await post.save();
      res.status(200).json({
        status: "SUCCEED",
        data: post,
      });
    } else {
      res.status(403).json({
        status: "FORBIDDEN",
        message: "You can update only your post",
      });
    }
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      error: error.message,
    });
  }
});

//delete a post

router.delete("/post/delete/:id", authentification, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post)
      res.status(404).json({
        status: "NOT FOUND",
        message: "False id are not allowed",
      });
    //The user can only delete his post
    if (post.userId === req.user._id.toString()) {
      const data = await post.deleteOne();
      res.status(200).json({
        status: "SUCCEED",
        message: "The post has been deleted",
        data: data,
      });
    } else {
      res.status(403).json({
        status: "FORBIDDEN",
        error: "You can delete only your post",
      });
    }
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      error: error.message,
    });
  }
});

//like or dislike a post

router.patch("/post/affinities/:id", authentification, async (req, res) => {
  try {
    const { action } = req.body;
    if (!action)
      res.status(400).json({
        status: "Bad Request",
        message: "Empty fields are not allowed",
      });
    else if (!Checker.controlRequest(req.body, ["action"]))
      res.status(400).json({
        status: "Bad Request",
        message: "Wrong format are not allowed",
      });
    const post = await Post.findById(req.params.id);
    if (action === "like") {
      if (post.likes.includes(req.user._id)) res.status(202).json();
      else {
        post.likes.push(req.user._id.toString());
        await post.save();
        res.status(200).json({
          status: "SUCCEED",
          message: "The post has been liked",
          data: post,
        });
      }
    } else if (action === "unlike") {
      if (!post.likes.includes(req.user._id)) res.status(202).json();
      else {
        post.likes = post.likes.filter((likeId) => likeId === req.user._id);
        await post.save();
        res.status(200).json({
          status: "SUCCEED",
          message: "The post has been disliked",
          data: post,
        });
      }
    } else
      res.status(400).json({
        status: "BAD REQUEST",
        message: "You are only allow to like or unlike a post",
      });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      error: error.message,
    });
  }
});

//get timeline posts

router.get("/feed", authentification, async (req, res) => {
  try {
    const userPosts = await Post.find({ userId: req.user._id });
    const friendPosts = await Promise.all(
      req.user.followings.map((friendId) => {
        return Post.find({ userId: friendId });
      })
    );
    res.status(200).json({
      status: "SUCCEED",
      data: userPosts.concat(...friendPosts),
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      error: error.message,
    });
  }
});

module.exports = router;
