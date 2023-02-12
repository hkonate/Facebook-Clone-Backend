const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authentification = async (req, res, next) => {
  try {
    console.log("step", req.headers);
    const authToken = req.headers.authorization.replace("Bearer ", "");
    const decodeToken = jwt.verify(authToken, process.env.SECRET_KEY);

    const user = await User.findOne({
      _id: decodeToken._id,
    });

    if (!user) throw new Error();
    req.user = user;
    next();
  } catch (error) {
    res
      .status(401)
      .json({ status: "Error", error: "Please authenticate yourself!" });
  }
};

module.exports = authentification;
