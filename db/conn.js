const mysql = require("mysql");

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  //   password: "umar",
  database: "social",
});

connection.connect((error) => {
  if (error) {
    console.log(error.message);
  } else {
    console.log("Connection succeeded");
  }
});
module.exports = connection;
