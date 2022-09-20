const router = require("express").Router();
const { spawn } = require("child_process");

router.get("/py", (req, res) => {
  const py = spawn("python", [
    "../../AI LinkedIn/scrap (1).py",
    req.query.email,
    req.query.password,
    req.query.keyword,
    req.query.time,
  ]);

  py.stdout.on("data", (data) => {
    console.log(data.toString());
  });

//   py.on("close", (data) => {
//     console.log('Close code :', data);
//   });

  // res.status(200).send({ msg: "Everything went well!" });
});

module.exports = router;
