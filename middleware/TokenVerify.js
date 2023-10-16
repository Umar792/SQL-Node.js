const jwt = require("jsonwebtoken");
const connection = require("../db/conn");

const TokenVerify = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token Not Found Please Login",
      });
    }

    const decoded = await jwt.verify(token, "umarali");

    // Use a promise to query the database and set req.user
    const user = await getUserFromDatabase(decoded.id);

    // Now you can access the user in your route handlers using req.user
    req.user = user;

    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Function to get user data from the database
const getUserFromDatabase = (userId) => {
  return new Promise((resolve, reject) => {
    connection.query(
      "SELECT * FROM users WHERE id = ?",
      [userId],
      (err, results) => {
        if (err) {
          reject(err);
        } else {
          if (results.length > 0) {
            resolve(results[0]); // Assuming there's only one matching user
          } else {
            reject(new Error("User not found"));
          }
        }
      }
    );
  });
};

module.exports = TokenVerify;
