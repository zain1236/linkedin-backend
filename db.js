const mongoose = require("mongoose");

exports.ConnectDB = () => {
  mongoose
    .connect("mongodb+srv://zeeshan:zee786@taplio.thyegao.mongodb.net/?retryWrites=true&w=majority")
    .then(() => console.log("Database Connected"))
    .catch((err) => console.log(err.message));
};
