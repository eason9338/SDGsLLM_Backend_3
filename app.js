const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cors = require('cors');

const authRoutes = require('./src/routes/authRoutes');
const chatRoutes = require('./src/routes/chatRoutes');
const fileRoutes = require('./src/routes/fileRoutes');

dotenv.config();

const app = express();

// 連接資料庫
connectDB();

// 診斷中間件
app.use((req, res, next) => {
  console.log(`收到請求: ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  next();
});

// CORS
app.use(cors());

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 健康檢查
app.get('/healthz', (req, res) => res.status(200).json({ ok: true }));

// API 前綴，集中管理
const API_PREFIX = process.env.API_PREFIX || 'sdgsllmfrontend-production.up.railway.app/api';

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/chats`, chatRoutes);
app.use(`${API_PREFIX}/files`, fileRoutes);

// 404 處理
app.use((req, res, next) => {
  if (req.path.startsWith(API_PREFIX)) {
    return res.status(404).json({ success: false, message: 'API 路由不存在' });
  }
  next();
});

// 全域錯誤處理
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('全域錯誤:', err);
  res.status(err.status || 500).json({ success: false, message: err.message || '伺服器錯誤' });
});

const PORT = process.env.PORT || 8000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`伺服器運行在端口 ${PORT}`);
});

module.exports = app;