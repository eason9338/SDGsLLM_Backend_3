const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const { bucket } = require('../../config/firebase');

// Python API 設定
const PYTHON_API_BASE_URL = 'http://203.145.216.208:54898'; // 根據你的 Python API 位址修改

/**
 * 呼叫 Python 模型服務處理檔案
 * @param {string} localFilePath - 本地檔案路徑
 * @returns {Promise<Object>} Python API 回應
 */
const callPythonModelService = async (localFilePath) => {
  try {
    // 檢查檔案是否存在
    if (!fs.existsSync(localFilePath)) {
      throw new Error(`檔案不存在: ${localFilePath}`);
    }

    // 建立 FormData 物件
    const formData = new FormData();
    formData.append('file', fs.createReadStream(localFilePath));

    // 設定請求標頭
    const headers = {
      ...formData.getHeaders(),
      'Content-Type': 'multipart/form-data'
    };

    console.log(`📤 正在上傳檔案到 Python API: ${localFilePath}`);

    // 呼叫 Python API
    const response = await axios.post(
      `${PYTHON_API_BASE_URL}/upload-document`,
      formData,
      {
        headers,
        timeout: 300000, // 5分鐘超時（因為模型處理可能需要較長時間）
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    console.log('✅ Python API 回應成功:', response.data);
    return response.data;

  } catch (error) {
    console.error('❌ Python API 呼叫失敗:', error.message);
    
    // 詳細錯誤處理
    if (error.response) {
      // Python API 有回應但是錯誤狀態
      console.error('錯誤狀態:', error.response.status);
      console.error('錯誤內容:', error.response.data);
      throw new Error(`Python API 錯誤 (${error.response.status}): ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      // 請求發送了但沒有收到回應
      console.error('無法連接到 Python API');
      throw new Error('無法連接到 Python API，請確認服務是否運行');
    } else {
      // 其他錯誤
      throw new Error(`請求設定錯誤: ${error.message}`);
    }
  }
};

/**
 * 上傳檔案並處理
 */
exports.uploadFile = async (req, res) => {
  try {
    const localFilePath = req.file.path;
    const destination = `pdfs/${req.file.originalname}`;
    
    console.log(`🔄 開始處理檔案: ${req.file.originalname}`);

    // 呼叫 Python 模型服務處理檔案
    let pythonResponse = null;
    try {
      pythonResponse = await callPythonModelService(localFilePath);
      console.log('✅ Python 模型處理完成');
    } catch (pythonError) {
      console.error('⚠️ Python 模型處理失敗，但繼續上傳到 Firebase:', pythonError.message);
      // 你可以選擇在這裡直接返回錯誤，或者繼續上傳到 Firebase
      // 目前的設計是即使 Python 處理失敗也會繼續上傳
    }

    // 上傳到 Firebase Storage
    console.log('📤 上傳檔案到 Firebase Storage');
    await bucket.upload(localFilePath, {
      destination,
      metadata: {
        contentType: req.file.mimetype || 'application/pdf',
      },
    });

    // 清理本地檔案
    fs.unlinkSync(localFilePath);
    console.log('🗑️ 本地暫存檔案已清理');

    // 產生可存取的 URL
    const file = bucket.file(destination);
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: '03-09-2030',
    });

    // 回傳完整結果
    const result = {
      message: '檔案上傳成功',
      filename: req.file.originalname,
      firebase_url: url,
      python_processing: pythonResponse ? {
        success: true,
        ...pythonResponse
      } : {
        success: false,
        error: 'Python 模型處理失敗'
      }
    };

    console.log('✅ 檔案處理完成:', req.file.originalname);
    res.json(result);

  } catch (error) {
    console.error('❌ 檔案上傳失敗:', error);
    
    // 如果有暫存檔案，清理它
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
        console.log('🗑️ 清理失敗的暫存檔案');
      } catch (cleanupError) {
        console.error('清理暫存檔案失敗:', cleanupError);
      }
    }

    res.status(500).json({ 
      error: '檔案上傳失敗',
      details: error.message 
    });
  }
};