const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const { protect } = require('../middleware/auth');
const multer = require('multer');

// 配置 multer 來正確處理 UTF-8 檔案名稱
const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    // 修復檔案名稱編碼問題
    try {
      file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    } catch (error) {
      // 如果轉換失敗，保持原檔名
      console.warn('檔案名稱編碼轉換失敗，使用原檔名:', file.originalname);
    }
    cb(null, true);
  }
});

// 檔案上傳需認證
router.post('/upload', protect, upload.single('file'), fileController.uploadFile);

module.exports = router;