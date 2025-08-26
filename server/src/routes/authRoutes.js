// const jwt = require('jsonwebtoken');
// require('dotenv').config();
// const { protect, adminOnly } = require("../middleware/authMiddleware");

// General Authentication Middleware
// const protect = (req, res, next) => {
//     const token = req.header("Authorization");
//     if (!token) return res.status(401).json({ message: "Unauthorized access" });

//     try {
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         req.user = decoded;
//         next();
//     } catch (error) {
//         res.status(401).json({ message: "Invalid token" });
//     }
// };

// // Admin Authorization Middleware
// const adminOnly = (req, res, next) => {
//     if (req.user.role !== "admin") return res.status(403).json({ message: "Access denied" });
//     next();
// };

// module.exports =  {protect, adminOnly} ;
const express = require("express");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { registerUser, loginUser, logoutUser } = require("../controller/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Register Route
router.post("/register", registerUser);

// Login Route
router.post("/login", loginUser);

// Logout Route
router.post("/logout", protect, logoutUser);

module.exports = router;
