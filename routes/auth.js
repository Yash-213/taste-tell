// routes/auth.js
const express = require("express");
const User = require("../models/User"); // already hashes password inside User.js
const router = express.Router();

// --- RENDER LOGIN/SIGNUP ---
router.get("/login",  (req, res) => res.render("loginPage", { mode: "login" }));
router.get("/signup", (req, res) => res.render("loginPage", { mode: "signup" }));

// --- SIGNUP ---
router.post("/signup", async (req, res) => {
  try {
    let { username, email, password } = req.body || {};
    username = (username || "").trim();
    email    = (email || "").trim().toLowerCase();
    password = (password || "").trim();

    if (!username || !email || !password) {
      return res.redirect("/signup?error=" + encodeURIComponent("All fields are required."));
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.redirect("/signup?error=" + encodeURIComponent("Email already in use."));
    }

    // 🔹 Password will be hashed automatically via pre('save')
    const newUser = await User.create({ username, email, password });

    // Ensure session is available
    if (!req.session) {
      return res.redirect("/login?error=" + encodeURIComponent("Session not initialized. Check session middleware."));
    }

    req.session.userId = newUser._id;
    req.session.username = newUser.username;

    return res.redirect("/?success=" + encodeURIComponent(`Welcome, ${newUser.username}!`));
  } catch (err) {
    console.error("Signup error:", err);
    return res.redirect("/signup?error=" + encodeURIComponent("Internal server error. Please try again."));
  }
});

// --- LOGIN ---
router.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body || {};
    email    = (email || "").trim().toLowerCase();
    password = (password || "").trim();

    if (!email || !password) {
      return res.redirect("/login?error=" + encodeURIComponent("Email and password are required."));
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.redirect("/login?error=" + encodeURIComponent("Invalid email or password."));
    }

    const ok = await user.comparePassword(password); // 🔹 use schema method
    if (!ok) {
      return res.redirect("/login?error=" + encodeURIComponent("Invalid email or password."));
    }

    if (!req.session) {
      return res.redirect("/login?error=" + encodeURIComponent("Session not initialized. Check session middleware."));
    }

    req.session.userId = user._id;
    req.session.username = user.username;

    return res.redirect("/?success=" + encodeURIComponent(`Welcome back, ${user.username}!`));
  } catch (err) {
    console.error("Login error:", err);
    return res.redirect("/login?error=" + encodeURIComponent("Internal server error. Please try again."));
  }
});

// --- LOGOUT ---
router.get("/logout", (req, res) => {
  if (!req.session) {
    return res.redirect("/login?success=" + encodeURIComponent("Logged out."));
  }
  req.session.destroy(() => {
    res.redirect("/login?success=" + encodeURIComponent("Logged out."));
  });
});

module.exports = router;