const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      "SELECT id, email, password_hash, role FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];

    // Ensure only admins can access the backendadmin
    if (user.role !== "admin" && user.role !== "super_admin") {
       return res.status(403).json({ message: "Access denied: Admins only" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "default_secret_key", // Fallback for dev if not set
      { expiresIn: "1d" }
    );

    res.json({
       success: true,
       token,
       user: { id: user.id, email: user.email, role: user.role }
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.logoutAdmin = (req, res) => {
  // Since we use JWTs and localStorage on the frontend, signing out 
  // is just removing the token from the client.
  // We can just return a 200 OK. If using cookies, we would clear them here.
  res.json({ success: true, message: "Logged out successfully" });
};

exports.getAdminProfile = async (req, res) => {
  try {
    // req.user is set by the verifyAdmin middleware
    const result = await pool.query(
      "SELECT id, email, role, phone, created_at FROM users WHERE id = $1",
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error("Profile Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};