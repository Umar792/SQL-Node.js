const express = require("express");
const router = express.Router();
const connection = require("../db/conn");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookie = require("cookie-parser");
const upload = require("../multer/multer");
const TokenVerify = require("../middleware/TokenVerify");

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
        res.cookie("token", token).status(200).json({
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
// ===== logout
router.post("/logout", async (req, res) => {
  try {
    res
      .clearCookie("token", {
        expires: 0,
        secure: true, // Match the 'secure' flag used when setting the cookie
        httpOnly: true,
      })
      .status(200)
      .json({
        success: true,
        message: "Logout Successfuly",
      });
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
// ========== create post

router.post(
  "/addPost",
  TokenVerify,
  upload.single("image"),
  async (req, res) => {
    try {
      const { des } = req.body;
      const image = req.file;
      console.log(req.user.id);
      if (!des || !image) {
        return res.status(400).json({
          success: false,
          message: "Please Enter All Fields",
        });
      }

      connection.query(
        "INSERT INTO post (des, image, userId) VALUES (?, ?, ?)",
        [des, image.filename, req.user.id], // Use image.filename to insert the file name or file path
        (err, data) => {
          if (err) {
            return res.status(400).json({
              success: false,
              message: err.message,
            });
          } else {
            res.status(200).json({
              success: true,
              message: "Post Created Successfully",
            });
          }
        }
      );
    } catch (error) {
      res.status(200).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ======== get post of login users
router.get("/getpost", TokenVerify, async (req, res) => {
  try {
    connection.query(
      "SELECT * FROM post AS p WHERE p.userId = ?",
      [req.user.id],
      (err, data) => {
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
      }
    );
  } catch (error) {}
});

// ======== delet post
router.delete("/deletePost/:id", TokenVerify, async (req, res) => {
  connection.query(
    "DELETE FROM post WHERE id=?",
    [req.params.id],
    (err, data) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      } else {
        if (data.affectedRows === 0) {
          return res.status(400).json({
            success: false,
            message: "No Post Found Please Enter Valid Post Id",
          });
        }
        res.status(200).json({
          success: true,
          message: "Post Delete Successfully",
        });
      }
    }
  );
});
// ========

module.exports = router;
