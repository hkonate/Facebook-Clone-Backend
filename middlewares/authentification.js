const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authentification = async (req, res, next) => {
  try {
    const authToken = req.headers.authorization
      ? req.headers.authorization.replace("Bearer ", "")
      : req.body.headers.Authorization.replace("Bearer ", "");

    const decodeToken = jwt.verify(authToken, process.env.SECRET_KEY);
    const user = await User.findOne({
      _id: decodeToken._id,
    });
    if (!user) throw new Error();
    else {
      req.user = user;

      next();
    }
  } catch (error) {
    res
      .status(401)
      .json({ status: "Error", error: "Please authenticate yourself!" });
  }
};

module.exports = authentification;
