const express = require("express");
const router = express.Router();
const { loginAdmin, logoutAdmin, getAdminProfile } = require("../controllers/admin.controller");
const { verifyAdmin } = require("../middleware/auth.middleware");

// Public routes
router.post("/login", loginAdmin);

// Protected routes (Admin / Super Admin only)
router.post("/logout", verifyAdmin, logoutAdmin);
router.get("/profile", verifyAdmin, getAdminProfile);

module.exports = router;