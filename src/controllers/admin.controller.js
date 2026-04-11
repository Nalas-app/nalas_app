const pool = require("../config/db");
const bcrypt = require("bcrypt");
const { generateToken, generateRefreshToken, verifyRefreshToken, revokeToken } = require("../utils/jwt");

exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const result = await pool.query(
      "SELECT id, email, password, role, status FROM admins WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const admin = result.rows[0];

    // Checking if admin is active
    if (admin.status !== "active") {
      return res.status(403).json({ message: "Admin account is inactive" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const payload = { id: admin.id, email: admin.email, role: admin.role };

    const token = generateToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.json({
      token,
      refreshToken,
      admin: {
        id: admin.id,
        email: admin.email,
        role: admin.role
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.logoutAdmin = (req, res) => {
  try {
    const token = req.token;

    if (!token) {
      return res.status(400).json({ message: "No token to revoke" });
    }

    revokeToken(token);

    res.json({ message: "Logout successful" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Logout failed" });
  }
};

exports.refreshTokenAdmin = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" });
    }

    const decoded = verifyRefreshToken(refreshToken);

    const result = await pool.query(
      "SELECT id, email, role FROM admins WHERE id = $1 AND status = $2",
      [decoded.id, "active"]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ message: "Admin not found or inactive" });
    }

    const admin = result.rows[0];
    const payload = { id: admin.id, email: admin.email, role: admin.role };

    const newToken = generateToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    res.json({
      token: newToken,
      refreshToken: newRefreshToken
    });

  } catch (error) {
    console.error(error);
    res.status(403).json({ message: "Invalid refresh token" });
  }
};

exports.getCurrentAdmin = (req, res) => {
  try {
    res.json({
      admin: req.admin
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch admin profile" });
  }
};