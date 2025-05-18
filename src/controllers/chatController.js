// controllers/chatController.js
const Chat = require('../models/Chat');

// controllers/chatController.js 中的 createChat 函數
exports.createChat = async (req, res) => {
  try {
    console.log('創建對話請求:', req.body);
    const { title } = req.body;
    const userId = req.user.id;
    
    console.log('用戶 ID:', userId);
    console.log('對話標題:', title);

    const chat = await Chat.create({
      userId,
      title: title || '未命名對話',
      messages: []
    });

    console.log('對話創建成功:', chat._id);
    
    return res.status(201).json({
      success: true,
      data: chat
    });
  } catch (error) {
    console.error('創建對話失敗:', error);
    return res.status(500).json({
      success: false,
      message: '創建對話失敗',
      error: error.message
    });
  }
};

// 獲取用戶的所有對話
exports.getUserChats = async (req, res) => {
  try {
    const userId = req.user.id;

    const chats = await Chat.find({ userId })
      .sort({ updatedAt: -1 }) // 按更新時間排序
      .select('title createdAt updatedAt'); // 只返回必要欄位

    res.status(200).json({
      success: true,
      data: chats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '獲取對話列表失敗',
      error: error.message
    });
  }
};

// 獲取特定對話的詳情
exports.getChatById = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    const chat = await Chat.findOne({ _id: chatId, userId });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: '對話不存在'
      });
    }

    res.status(200).json({
      success: true,
      data: chat
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '獲取對話失敗',
      error: error.message
    });
  }
};

// 添加消息到對話
exports.addMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { role, content } = req.body;
    const userId = req.user.id;

    const chat = await Chat.findOne({ _id: chatId, userId });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: '對話不存在'
      });
    }

    chat.messages.push({ role, content });
    await chat.save();

    res.status(200).json({
      success: true,
      data: chat
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '添加消息失敗',
      error: error.message
    });
  }
};

// 更新對話標題
exports.updateChatTitle = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { title } = req.body;
    const userId = req.user.id;

    const chat = await Chat.findOneAndUpdate(
      { _id: chatId, userId },
      { title },
      { new: true }
    );

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: '對話不存在'
      });
    }

    res.status(200).json({
      success: true,
      data: chat
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新標題失敗',
      error: error.message
    });
  }
};

// 刪除對話
exports.deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    const chat = await Chat.findOneAndDelete({ _id: chatId, userId });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: '對話不存在'
      });
    }

    res.status(200).json({
      success: true,
      message: '對話已刪除'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '刪除對話失敗',
      error: error.message
    });
  }
};

// 批量發送消息（用戶消息和助手回覆）
exports.sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    let chat = await Chat.findOne({ _id: chatId, userId });

    // 如果對話不存在，創建新對話
    if (!chat) {
      chat = await Chat.create({
        _id: chatId,
        userId,
        title: '新對話',
        messages: []
      });
    }

    // 添加用戶消息
    chat.messages.push({ role: 'user', content: message });

    // 這裡可以調用你的 AI API 獲取回覆
    // const aiResponse = await getAIResponse(message);
    const aiResponse = '這是 AI 的回覆'; // 暫時使用預設回覆

    // 添加助手回覆
    chat.messages.push({ role: 'assistant', content: aiResponse });

    await chat.save();

    res.status(200).json({
      success: true,
      data: {
        userMessage: chat.messages[chat.messages.length - 2],
        assistantMessage: chat.messages[chat.messages.length - 1]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '發送消息失敗',
      error: error.message
    });
  }
};