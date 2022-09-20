const passport = require("passport");
const { PostCradentials, GetCradentials } = require("../Controller/LinkedIn");

const router = require("express").Router();

router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  PostCradentials
);

router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  GetCradentials
);

module.exports = router;
