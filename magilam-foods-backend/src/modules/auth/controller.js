const authService = require('./service');

class AuthController {
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);
      
      res.status(201).json({
        success: true,
        data: result,
        message: 'Registration successful'
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const result = await authService.login(req.body);
      
      res.json({
        success: true,
        data: result,
        message: 'Login successful'
      });
    } catch (error) {
      next(error);
    }
  }
  async logout(req, res, next) {
    try {
      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req, res, next) {
    try {
      // Return user info that was stored in token decoded payload
      res.json({
        success: true,
        data: req.user,
        message: 'Profile retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();