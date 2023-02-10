const mongoose = require("mongoose");
const validator = require("validator");

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
  return passwordReset;
};

const PasswordReset = mongoose.model("PasswordReset", passwordResetSchema);
module.exports = PasswordReset;
