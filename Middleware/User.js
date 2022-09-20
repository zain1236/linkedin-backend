const { StatusCodes } = require("http-status-codes");
const User = require("../models/user");
const ErrorHandler = require("../Utils/ErrorHandler");

module.exports.validateUser = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      next();
    } else {
      throw new ErrorHandler("User Already Exists", StatusCodes.CONFLICT);
    }
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ msg: "INTERNAL SERVER ERROR", error: error.message });
  }
};
