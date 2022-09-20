const User = require("../models/user");
const { StatusCodes } = require("http-status-codes");
const { hashSync, compare } = require("bcrypt");
const catchAsyncError = require("../Middleware/catchAsyncError");
const jwt = require("jsonwebtoken");
const ErrorHandler = require("../Utils/ErrorHandler");
const sendEmail = require("../Utils/SendEmail");
const crypto = require("crypto");

module.exports.CreateUser = catchAsyncError(async (req, res) => {
  const user = new User({
    email: req.body.email,
    password: req.body.password,
  });

  if (user) {
    const payload = {
      email: user.email,
      _id: user._id,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    await user.save();
    console.log(user);
    const { email, _id } = user;
    return res.status(StatusCodes.CREATED).send({
      data: { email, _id, token: token },
      msg: "Successfully Created",
    });
  }
  return res.status(400).send("Something Went wrong!");
});

module.exports.LoginUser = catchAsyncError(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (user) {
    const isLoggedin = await compare(req.body.password, user.password);
    if (isLoggedin) {
      const payload = {
        email: user.email,
        _id: user._id,
      };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });
      return res.status(StatusCodes.OK).send({
        msg: "Successfully Logged In",
        data: { user: payload, token: token },
      });
    }
    throw new ErrorHandler(
      "Incorrect email or Password!",
      StatusCodes.UNAUTHORIZED
    );
  }
  throw new ErrorHandler("User not Found!", StatusCodes.NOT_FOUND);
});

module.exports.Profile = (req, res) => {
  try {
    const { email, _id } = req.user;
    res.status(StatusCodes.OK).send({ msg: "Success", data: { email, _id } });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ error: error.message, msg: "INTERNAL SERVER ERROR" });
  }
};

module.exports.forgotPassword = catchAsyncError(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    throw new ErrorHandler("User not found!", StatusCodes.NOT_FOUND);
  }

  const resetToken = user.generateResetToken();
  await user.save({ validateBeforeSave: false });
  console.log(resetToken);
  const resetPasswordUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/user/password/reset/${resetToken}`;
  const message = `Your password reset url is ${resetPasswordUrl},\n\n If you haven't requested this please ignore this message.`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Password reset",
      message: message,
    });

    res.status(StatusCodes.OK).send({
      msg: `Email Sent to ${user.email} Successfully!`,
      data: message,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpiry = undefined;

    await user.save({ validateBeforeSave: false });

    throw new ErrorHandler(error.message, StatusCodes.INTERNAL_SERVER_ERROR);
  }
});

module.exports.ResetPassword = catchAsyncError(async (req, res) => {
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordTokenExpiry: { $gt: Date.now() },
  });

  if (!user) {
    throw new ErrorHandler(
      "Reset Password token is Invalid or the token has expired",
      StatusCodes.BAD_REQUEST
    );
  }
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordTokenExpiry = undefined;

  await user.save();

  res.status(StatusCodes.OK).send({ msg: "Successsly Changed Password" });
});
