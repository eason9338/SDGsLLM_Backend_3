// controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// 產生 JWT
const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// 將使用者資訊序列化（避免洩露敏感欄位）
const serializeUser = (user) => ({ id: user._id, name: user.name, email: user.email });

// 註冊
exports.register = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: '請填寫所有欄位' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: '密碼不匹配' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: '用戶已存在' });
    }

    const user = await User.create({ name, email, password });

    return res.status(201).json({
      message: '註冊成功',
      user: serializeUser(user),
      token: generateToken(user._id)
    });
  } catch (error) {
    return res.status(500).json({ message: '伺服器錯誤', error: error.message });
  }
};

// 登入
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: '請填寫所有欄位' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: '電子郵件或密碼錯誤' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: '電子郵件或密碼錯誤' });
    }

    return res.status(200).json({
      message: '登入成功',
      user: serializeUser(user),
      token: generateToken(user._id)
    });
  } catch (error) {
    return res.status(500).json({ message: '伺服器錯誤', error: error.message });
  }
};