const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    desc: {
      type: String,
      maxLength: 500,
      required: true,
    },
    img: {
      type: String,
    },
    likes: {
      type: Array,
      default: [],
    },
  },
  { timestamps: true }
);

postSchema.methods.toJSON = function () {
  const post = this.toObject();

  delete post.__v;
  delete post.updatedAt;

  return post;
};

module.exports = mongoose.model("Post", postSchema);
