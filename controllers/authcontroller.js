const bcrypt = require("bcrypt");
const { pool } = require("../config/db");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const { generateToken } = require("./jwtcontroller");
const User = require("../models/User");

// Registration handler
exports.register = async (req, res) => {
  let { firstname, lastname, emailOrPhone, password, password2 } = req.body;
  const isEmail = emailOrPhone.includes("@");

  let errors = [];

  if (!firstname || !lastname || !emailOrPhone || !password || !password2) {
    return res.status(400).json({ message: "Please fill all fields" });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Password should be at least 6 characters" });
  }

  if (password !== password2) {
    return res.status(400).json({ message: "Passwords should match" });
  }

  if (errors.length > 0) {
    return res.render("register", { errors });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const queryField = isEmail ? "email" : "phone";
       // Check if user already exists
        const checkUser = await pool.query(
          `SELECT * FROM users WHERE ${queryField} = $1`,
          [emailOrPhone]
        );

        const saveUser = User.
    
        if (checkUser.rows.length > 0) {
          // errors.push({ message: `${isEmail ? "Email" : "Phone number"} already exists` });
          // return res.render("register", { errors });

          return res.status(400).json({ message: `${isEmail ? "Email" : "Phone number"} already exists` })
        }
    
        // Insert user
        const insertQuery = isEmail
          ? `INSERT INTO users (firstname, lastname, email, password) VALUES ($1, $2, $3, $4)`
          : `INSERT INTO users (firstname, lastname, phone, password) VALUES ($1, $2, $3, $4)`;
    
          await pool.query(insertQuery, [firstname, lastname, emailOrPhone, hashedPassword]);
    
         const registeredUser = await pool.query(
          `SELECT * FROM users WHERE ${queryField} = $1`,
          [emailOrPhone]
        );

        req.flash("success_msg", "You are now registered, please log in");
        // res.redirect("/users/login");
        return res.status(201).json({
          message: "user register successfully",
          registeredUser: registeredUser.rows[0]
        })
    
      } catch (err) {
        console.error(err);
        res.send("An error occurred");
      }
    };

// Login handler with debug log
// exports.login = (req, res, next) => {
//   console.log("Login form data:", req.body);  // Debug log

//   passport.authenticate("local", {
//     successRedirect: "/users/dashboard",
//     failureRedirect: "/users/login",
//     failureFlash: true,
//   })(req, res, next);  
// };

exports.login = (req, res, next) => {
  console.log("Login form data:", req.body);  // Debug log

  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return res.status(500).json({message: "An error occurred.", error: err });
    }
    if (!user) {
      return res.status(401).json({message: info.message || "Authentication failed." });
    }

    

    req.logIn(user, (err) => {
      if (err) {
        return res.status(500).json({message: "Login failed.", error: err });
      }
      console.log("user",user)
const token= generateToken(user);

  
      return res.status(200).json({message: "Login successful.",token, user });
    });
  })(req, res, next);
};
