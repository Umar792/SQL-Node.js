const express = require("express");
const router = express.Router();
const connection = require("../db/conn");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ------------ create user
router.post("/user/signup", async (req, res) => {
  try {
    const { username, email, password, city, profilepic } = req.body;
    if (!username || !password || !email) {
      return res.status(400).json({
        success: false,
        message: "Please enter all required fields",
      });
    }

    // Check if the user already exists in the database
    connection.query(
      "SELECT * FROM users WHERE email = ?",
      [email],
      async (error, data) => {
        if (error) {
          return res.status(400).json({
            success: false,
            message: "Internal Server Error",
          });
        }

        if (data.length > 0) {
          return res.status(400).json({
            success: false,
            message: "User already exists",
          });
        } else {
          // If the user doesn't exist, hash the password and proceed with registration
          const salt = bcrypt.genSaltSync(10);
          const hashedPassword = await bcrypt.hash(password, salt);

          connection.query(
            "INSERT INTO users (username, email, city, profilepic, password) VALUES (?, ?, ?, ?, ?)",
            [username, email, city, profilepic, hashedPassword],
            (error, data) => {
              if (error) {
                return res.status(400).json({
                  success: false,
                  message: error.message,
                });
              } else {
                res
                  .status(200)
                  .json({ success: true, message: "Registration Successful" });
              }
            }
          );
        }
      }
    );
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// =========== login user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Plaese Enter Email Or Password",
      });
    }
    connection.query(
      "SELECT * FROM users WHERE email = ?",
      [req.body.email],
      async (err, data) => {
        if (err) {
          return res.status(400).json({
            success: false,
            message: err.message,
          });
        }
        if (data.length === 0) {
          return res.status(400).json({
            success: false,
            message: "Plaese Enter Valid Information",
          });
        }
        const isMatch = await bcrypt.compare(
          req.body.password,
          data[0].password
        );
        if (!isMatch) {
          return res.status(400).json({
            success: false,
            message: "Plaese Enter Valid Password",
          });
        }

        const token = await jwt.sign({ id: data[0].id }, "umarali");
        res.status(200).json({
          success: true,
          token,
          data,
        });
      }
    );
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// ===== get all users
router.get("/allusers", async (req, res) => {
  try {
    await connection.query("SELECT * FROM users", (err, data) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      } else {
        res.status(200).json({
          success: true,
          data,
        });
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
