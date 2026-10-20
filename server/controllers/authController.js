const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');
const { JWT_SECRET } = require('../middleware/auth');

class AuthController {
  static async register(req, res, next) {
    try {
      const { username, email, password, fullName, avatarColor } = req.body;

      if (!username || !email || !password || !fullName) {
        return res.status(400).json({
          success: false,
          message: 'Please provide all required fields: username, email, password, and fullName.'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long.'
        });
      }

      const existingEmail = UserModel.findByEmail(email);
      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email address already exists.'
        });
      }

      const existingUser = UserModel.findByUsername(username);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'This username is already taken. Please choose another.'
        });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const newUser = UserModel.create({
        username,
        email,
        passwordHash,
        fullName,
        avatarColor: avatarColor || '#6366f1'
      });

      const token = jwt.sign(
        { id: newUser.id, email: newUser.email, username: newUser.username },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        success: true,
        message: 'Registration successful! Welcome to TaskFlow.',
        token,
        user: newUser
      });
    } catch (err) {
      next(err);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Please enter both email and password.'
        });
      }

      const user = UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password credentials.'
        });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password credentials.'
        });
      }

      const safeUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        avatar_color: user.avatar_color,
        role: user.role,
        created_at: user.created_at
      };

      const token = jwt.sign(
        { id: safeUser.id, email: safeUser.email, username: safeUser.username },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        message: 'Login successful!',
        token,
        user: safeUser
      });
    } catch (err) {
      next(err);
    }
  }

  static async getMe(req, res, next) {
    try {
      res.json({
        success: true,
        user: req.user
      });
    } catch (err) {
      next(err);
    }
  }

  static async getAllUsers(req, res, next) {
    try {
      const users = UserModel.getAllUsers();
      res.json({
        success: true,
        users
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AuthController;
