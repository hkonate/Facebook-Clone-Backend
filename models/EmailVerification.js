const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const EmailVerificationSchema = new mongoose.Schema({
  email: {
    type: String,
    trim: true,
    required: true,
    minLength: 3,
    maxLength: 320,
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

const EmailVerification = mongoose.model(
  "EmailVerification",
  EmailVerificationSchema
);

module.exports = EmailVerification;
