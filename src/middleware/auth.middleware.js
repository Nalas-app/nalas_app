const { verifyToken } = require("../utils/jwt");

exports.authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing or invalid authorization header" });
    }

    const token = authHeader.slice(7);
    const decoded = verifyToken(token);

    req.admin = decoded;
    req.token = token;
    next();
  } catch (error) {
    return res.status(403).json({ message: error.message || "Unauthorized" });
  }
};

exports.authorize = (requiredRoles = []) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (requiredRoles.length > 0 && !requiredRoles.includes(req.admin.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    next();
  };
};
