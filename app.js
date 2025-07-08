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

// 現有路由
app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/files', fileRoutes);

const PORT = process.env.PORT || 8000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`伺服器運行在端口 ${PORT}`);
});

module.exports = app;