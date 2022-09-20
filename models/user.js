const { default: mongoose } = require("mongoose");
const crypto = require("crypto");
const validator = require("validator");
const { hashSync } = require("bcrypt");

const Schema = require("mongoose").Schema;

const LinkedInCradentials = new Schema({
  LinkedInemail: String,
  LinkedInPassword: String,
});

const UserSchema = new Schema({
  email: {
    type: String,
    unique: true,
    required: true,
    validate: [validator.isEmail, "Please enter a Valid Email!"],
  },

  password: {
    type: String,
    required: true,
  },
  cradentials: LinkedInCradentials,
  resetPasswordToken: String,
  resetPasswordTokenExpiry: Date,
});

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  this.password = await hashSync(this.password, 10);
  next();
});

UserSchema.method("generateResetToken", function () {
  // 20 length randomnly generated string
  const resetToken = crypto.randomBytes(20).toString("hex");

  // hashing reset password token and then it will be stored in the instance.resetPasswordToken
  // of the UserSchema
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  //it will be stored in the instance.resetPasswordTokenExpiry
  // of the UserSchema
  this.resetPasswordTokenExpiry = Date.now() + 15 * 60 * 60 * 1000;

  return resetToken;
});

module.exports = new mongoose.model("user", UserSchema);
