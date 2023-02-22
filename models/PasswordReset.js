const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const User = require("./User");

const passwordResetSchema = new mongoose.Schema({
  email: {
    type: String,
    lowercase: true,
    trim: true,
    minLength: 3,
    maxLength: 320,
    required: true,
    validate(v) {
      if (!validator.isEmail(v)) throw new Error("False email are not allowed");
    },
  },
  otp: {
    type: String,
    trim: true,
    required: true,
  },
  createdAt: {
    type: Date,
    trim: true,
    default: Date.now(),
    required: true,
  },
  expiredAt: {
    type: Date,
    trim: true,
    default: Date.now() + 3600000,
    required: true,
  },
});

passwordResetSchema.methods.toJSON = function () {
  const passwordReset = this.toObject();

  delete passwordReset.otp;
  delete passwordReset.__v;

  return passwordReset;
};

passwordResetSchema.statics.verifyOtpAndChangePassword = async (
  otp,
  id,
  password,
  confirmPassword,
  res
) => {
  if (confirmPassword !== password)
    throw new Error("Your passwords must be the same !");

  const passwordReset = await PasswordReset.findById(id);
  if (!passwordReset) throw new Error("This account does not exist");
  console.log("1");
  if (passwordReset.expiredAt < Date.now())
    throw new Error("Your otp have expired");
  console.log("2");

  const isOtpValid = await bcrypt.compare(otp, passwordReset.otp);
  if (!isOtpValid) throw new Error("Invalid otp are not allowed");
  console.log("3");

  const user = await User.findOne({ email: passwordReset.email });
  user.password = password;
  console.log("4");

  const error = user.validateSync();
  if (error)
    res.status(400).json({
      status: "Bad Request",
      message: error,
    });

  return user;
};

const PasswordReset = mongoose.model("PasswordReset", passwordResetSchema);
module.exports = PasswordReset;
