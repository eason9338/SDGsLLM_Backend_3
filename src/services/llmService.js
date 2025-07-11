const axios = require('axios');

const LLM_API_URL = 'https://2d3dc560501a.ngrok-free.app/chat'; // ✅ 換成 ngrok URL

async function getAIResponse(message) {
  try {
    const response = await axios.post(LLM_API_URL, { message });
    return response.data.reply;
  } catch (error) {
    console.error('❌ 無法取得 LLM 回覆：', error.message);
    return 'AI 回覆失敗，請稍後再試';
  }
}

module.exports = { getAIResponse };

