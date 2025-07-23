const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const { protect } = require('../middleware/auth');  // 加這行
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });

router.post('/upload', protect, upload.single('file'), fileController.uploadFile);  // 加 protect

module.exports = router;