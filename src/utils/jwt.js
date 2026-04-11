const jwt = require("jsonwebtoken");

const tokenBlacklist = new Set();

exports.generateToken = (payload, expiresIn = process.env.JWT_EXPIRE) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

exports.generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE,
  });
};

exports.verifyToken = (token) => {
  try {
    if (tokenBlacklist.has(token)) {
      throw new Error("Token has been revoked");
    }
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error(`Invalid token: ${error.message}`);
  }
};

exports.verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    throw new Error(`Invalid refresh token: ${error.message}`);
  }
};

exports.revokeToken = (token) => {
  tokenBlacklist.add(token);
};

exports.decodeToken = (token) => {
  return jwt.decode(token);
};
