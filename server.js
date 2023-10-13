const express = require("express");
const app = express();
const PORT = 4000;

var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// -----connection
require("./db/conn");

app.use("/", require("./Routes/UserRouter"));

app.listen(PORT, function () {
  console.log("listening on port " + PORT);
});
