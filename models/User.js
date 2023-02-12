const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
    firstname: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      minLength: 1,
    },
    lastname: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      minLength: 1,
    },
    age: {
      type: Number,
      required: true,
      trim: true,
      validate(v) {
        if (v < 13 || v > 150 || !Number.isInteger(v))
          throw new Error(
            " Age must be a integer, and be between 12 and 151, not include"
          );
      },
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      minLength: 3,
      maxLength: 320,
      trim: true,
      unique: true,
      validate(v) {
        if (!validator.isEmail(v)) throw new Error("This email is not valid !");
      },
    },
    password: {
      type: String,
      required: true,
      trim: true,
      validate(v) {
        if (!validator.isStrongPassword(v))
          throw new Error("Password is not valid !");
      },
    },
    profilePicture: {
      type: String,
      default: "",
    },
    coverPicture: {
      type: String,
      default: "",
    },
    followers: {
      type: Array,
      default: [],
    },
    followings: {
      type: Array,
      default: [],
    },
    desc: {
      type: String,
      maxLength: 50,
    },
    city: {
      type: String,
      maxLength: 50,
    },
    from: {
      type: String,
      maxLength: 50,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    verified: {
      type: Boolean,
      default: false,
      required: true,
    },
    authTokens: [
      {
        type: Array,
        require: true,
        default: [],
        authtoken: {
          type: String,
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

userSchema.methods.toJSON = function () {
  //filter and secure response that are sent to the user
  const user = this.toObject();

  delete user.password;
  delete user.email;
  delete user.updatedAt;
  delete user.authTokens;
  delete user.__v;

  return user;
};

userSchema.pre("save", async function () {
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

userSchema.methods.generateAuthTokenAndSaveUser = async function () {
  const authToken = jwt.sign(
    { _id: this._id.toString() },
    process.env.SECRET_KEY
  );

  this.authTokens.push({ authToken });
  await this.save();
  return authToken;
};

userSchema.statics.findUser = async (email, password) => {
  // Try to find using email

  const user = await User.findOne({ email });

  // If not throw error

  if (!user) throw new Error("This account does not exist !");

  // Compare password with hashed password

  const isPasswordValid = await bcrypt.compare(password, user.password);

  // If not the same throw error

  if (!isPasswordValid) throw new Error("This password is not valid !");

  return user;
};

userSchema.post("save", function (error, doc, next) {
  if (error.name === "MongoServerError" && error.code === 11000) {
    // catch unique email error
    next(new Error("Email must be unique"));
  } else {
    next();
  }
});

const User = mongoose.model("User", userSchema);
module.exports = User;
