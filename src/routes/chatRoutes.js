// routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

// 所有路由都需要認證
router.use(protect);

// 移除前面的 '/chats' 路徑前綴
router.post('/', chatController.createChat);
router.get('/', chatController.getUserChats);
router.get('/:chatId', chatController.getChatById);
router.post('/:chatId/messages', chatController.addMessage);
router.put('/:chatId/title', chatController.updateChatTitle);
router.delete('/:chatId', chatController.deleteChat);
router.post('/:chatId/send', chatController.sendMessage);

module.exports = router;