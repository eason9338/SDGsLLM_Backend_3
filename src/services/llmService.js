const axios = require('axios');

// API 配置
const API_BASE_URL = 'http://203.145.216.194:54863';

/**
 * 基本聊天功能
 */
async function getAIResponse(message) {
  try {
    const response = await axios.post(`${API_BASE_URL}/chat`, { 
      message: message 
    });
    return response.data.reply;
  } catch (error) {
    console.error('❌ 基本聊天失敗:', error.message);
    return 'AI 回覆失敗，請稍後再試';
  }
}

/**
 * RAG聊天功能（使用文件檢索）
 */
async function getRAGResponse(message) {
  try {
    const response = await axios.post(`${API_BASE_URL}/rag_chat`, { 
      message: message 
    });
    return response.data.reply;
  } catch (error) {
    console.error('❌ RAG聊天失敗:', error.message);
    // RAG失敗時降級到基本聊天
    console.log('🔄 降級使用基本聊天');
    return await getAIResponse(message);
  }
}

module.exports = { 
  getAIResponse,    // 基本聊天
  getRAGResponse    // RAG聊天
};