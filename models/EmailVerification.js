const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./User");
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

EmailVerificationSchema.methods.toJSON = function () {
  const emailVerification = this.toObject();
  delete emailVerification.__v;
  delete emailVerification.otp;

  return emailVerification;
};

EmailVerificationSchema.statics.activateAccount = async (id, otp, res) => {
  try {
    const emailToVerification = await EmailVerification.findById(id);
    if (!emailToVerification)
      res
        .status(404)
        .json({ status: "Not Found", message: "False id are not allowed" });

    const user = await User.findOne({ email: emailToVerification.email });
    if (user.verified) res.status(204).json();

    const isOtpValid = await bcrypt.compare(otp, emailToVerification.otp);
    if (!isOtpValid)
      res.status(404).json({
        status: "Not Found",
        message: "False otp code are not allowed",
      });

    if (emailToVerification.expiredAt < Date.now())
      res.status(410).json({
        status: "GONE",
        message: "Your otp code expired",
      });

    user.verified = true;
    const response = await EmailVerification.deleteMany({
      email: emailToVerification.email,
    });
    const data = {
      user,
      deleteCount: response.deletedCount,
    };
    return data;
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      error: error.message,
    });
  }
};

const EmailVerification = mongoose.model(
  "EmailVerification",
  EmailVerificationSchema
);

module.exports = EmailVerification;
