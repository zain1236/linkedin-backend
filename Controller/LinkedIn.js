const { StatusCodes } = require("http-status-codes");
const catchAsyncError = require("../Middleware/catchAsyncError");
const User = require("../models/user");
const ErrorHandler = require("../Utils/ErrorHandler");

module.exports.PostCradentials = catchAsyncError(async (req, res) => {
  const { LinkedInemail, LinkedInPassword } = req.body;

  const user = await User.findOne({ _id: req.user._id });

  console.log(user);

  user.cradentials = {
    LinkedInemail,
    LinkedInPassword,
  };

  await user.save({ validateBeforeSave: false });

  res.status(StatusCodes.OK).send({ msg: "Added to Database" });
});

module.exports.GetCradentials = catchAsyncError(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user.cradentials) {
    return res.status(StatusCodes.OK).send({
      msg: "Success!",
      data: {
        LinkedInemail: user.cradentials.LinkedInemail,
        LinkedInPassword: user.cradentials.LinkedInPassword,
      },
      found: true,
    });
  } else {
    return res.status(StatusCodes.OK).send({
      msg: "No Cradentials found!",
      found: false,
    });
  }
});
