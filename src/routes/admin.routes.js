const express = require("express");
const router = express.Router();
const { loginAdmin, logoutAdmin, refreshTokenAdmin, getCurrentAdmin } = require("../controllers/admin.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");
const { validateRequest, loginSchema, refreshTokenSchema } = require("../validators/admin.validator");

// Public routes
router.post("/login", validateRequest(loginSchema, "body"), loginAdmin);
router.post("/refresh", validateRequest(refreshTokenSchema, "body"), refreshTokenAdmin);

// Protected routes - require authentication
router.post("/logout", authenticate, logoutAdmin);
router.get("/profile", authenticate, getCurrentAdmin);

// Admin-only routes (can add role check later)
router.get("/dashboard", authenticate, authorize(), (req, res) => {
  res.json({ message: "Dashboard data", admin: req.admin });
});

module.exports = router;