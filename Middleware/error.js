module.exports = (err, req, res, next) => {
  err.message = err.message || "INTERNAL SERVER ERROR";
  err.statusCode = err.statusCode || 500;

  //   if ((err.name = "CastError")) {
  //     err.message = `Invalid Resource ${err.path}`;
  //   }

  res.status(err.statusCode).send({ error: err.message });
};
// module.exports.AddCORS = (req, res, next) => {
//   res.header("Access-Control-Allow-Origin", "*");
//   next();
// };
