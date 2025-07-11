const Chat = require('../models/Chat');
const { getAIResponse } = require('../services/llmService'); // ✅ 引入呼叫 FastAPI 的服務

// 創建對話
exports.createChat = async (req, res) => {
  try {
    const { title } = req.body;
    const userId = req.user.id;

    const chat = await Chat.create({
      userId,
      title: title || '未命名對話',
      messages: []
    });

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

// 取得所有對話
exports.getUserChats = async (req, res) => {
  try {
    const userId = req.user.id;

    const chats = await Chat.find({ userId })
      .sort({ updatedAt: -1 })
      .select('title createdAt updatedAt');

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

// 取得單一對話
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

// 新增訊息
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

// 修改標題
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

// 發送訊息 + 取得 AI 回覆
exports.sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    let chat = await Chat.findOne({ _id: chatId, userId });

    if (!chat) {
      chat = await Chat.create({
        _id: chatId,
        userId,
        title: '新對話',
        messages: []
      });
    }

    chat.messages.push({ role: 'user', content: message });

    const aiResponse = await getAIResponse(message);

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
    console.error('❌ sendMessage 發生錯誤：', error);
    res.status(500).json({
      success: false,
      message: '發送消息失敗',
      error: error.message
    });
  }
};

