const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/User"); // create a User model in models/User.js
const router = express.Router();

// ======================= SIGNUP =======================
router.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body || {};

    if (!username || !email || !password) {
      return res.status(400).send("All fields are required.");
    }

    // check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send("Email already in use.");
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    // set session
    req.session.userId = newUser._id;
    req.session.username = newUser.username;

    res.redirect("/"); // after signup → homepage
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).send("Internal Server Error");
  }
});

// ======================= LOGIN =======================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).send("SignUp First");
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).send("Invalid email or password.");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).send("Invalid email or password.");
    }

    // set session
    req.session.userId = user._id;
    req.session.username = user.username;

    res.redirect("/");
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).send("Internal Server Error");
  }
});

// ======================= LOGOUT =======================
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

module.exports = router;
