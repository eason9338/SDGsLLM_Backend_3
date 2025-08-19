// controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const ApiResponse = require('../utils/responseUtils');

// 產生 JWT
const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// 將使用者資訊序列化（避免洩露敏感欄位）
const serializeUser = (user) => ({ id: user._id, name: user.name, email: user.email });

// 註冊
exports.register = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return ApiResponse.badRequest(res, '請填寫所有欄位');
    }
    if (password !== confirmPassword) {
      return ApiResponse.badRequest(res, '密碼不匹配');
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return ApiResponse.badRequest(res, '用戶已存在');
    }

    const user = await User.create({ name, email, password });

    return ApiResponse.created(res, {
      user: serializeUser(user),
      token: generateToken(user._id)
    }, '註冊成功');
  } catch (error) {
    return ApiResponse.serverError(res, '註冊失敗', error);
  }
};

// 登入
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return ApiResponse.badRequest(res, '請填寫所有欄位');
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return ApiResponse.unauthorized(res, '電子郵件或密碼錯誤');
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return ApiResponse.unauthorized(res, '電子郵件或密碼錯誤');
    }

    return ApiResponse.success(res, {
      user: serializeUser(user),
      token: generateToken(user._id)
    }, '登入成功');
  } catch (error) {
    return ApiResponse.serverError(res, '登入失敗', error);
  }
};