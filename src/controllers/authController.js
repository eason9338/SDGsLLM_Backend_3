// controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// 創建 Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// 註冊
exports.register = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;
    
    // 基本驗證
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: '請填寫所有欄位' });
    }
    
    if (password !== confirmPassword) {
      return res.status(400).json({ message: '密碼不匹配' });
    }
    
    // 檢查用戶是否存在
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: '用戶已存在' });
    }
    
    // 創建用戶
    const user = await User.create({ name, email, password });
    
    res.status(201).json({
      message: '註冊成功',
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: '伺服器錯誤', error: error.message });
  }
};

// 登入
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 基本驗證
    if (!email || !password) {
      return res.status(400).json({ message: '請填寫所有欄位' });
    }
    
    // 查找用戶
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: '電子郵件或密碼錯誤' });
    }
    
    // 檢查密碼
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: '電子郵件或密碼錯誤' });
    }
    
    res.status(200).json({
      message: '登入成功',
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: '伺服器錯誤', error: error.message });
  }
};