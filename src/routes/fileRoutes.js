const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const { protect } = require('../middleware/auth');
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });

// 檔案上傳需認證
router.post('/upload', protect, upload.single('file'), fileController.uploadFile);

module.exports = router;