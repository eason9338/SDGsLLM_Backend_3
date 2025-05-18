// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  try {
    console.log('處理請求:', req.method, req.originalUrl);
    
    let token;
    
    // 檢查 Authorization 頭
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('找到 token');
    }
    
    // 如果沒有 token
    if (!token) {
      console.log('無 token，拒絕訪問');
      return res.status(401).json({
        success: false,
        message: '需要登入'
      });
    }
    
    // 驗證 token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('token 驗證成功，用戶 ID:', decoded.id);
    
    // 查找用戶
    const user = await User.findById(decoded.id);
    
    if (!user) {
      console.log('找不到用戶');
      return res.status(401).json({
        success: false,
        message: '用戶不存在'
      });
    }
    
    // 將用戶信息附加到請求對象
    req.user = user;
    console.log('用戶已認證:', user.email);
    
    next();
  } catch (error) {
    console.error('認證錯誤:', error);
    return res.status(401).json({
      success: false,
      message: '認證失敗'
    });
  }
};