const router = require("express").Router();
const UserRoute = require("./User");
const ScriptRoute = require("./Script");
const LinkedRoute = require('./LinkedIn')

router.use("/user", UserRoute);
router.use("/script", ScriptRoute);
router.use("/linkedIn", LinkedRoute);

module.exports = router;
