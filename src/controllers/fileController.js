const fs = require('fs');
const axios = require('axios');
const pdfParse = require('pdf-parse');
const { bucket } = require('../../config/firebase');
const ApiResponse = require('../utils/responseUtils');

// Python API 設定：可用環境變數覆蓋
// const PYTHON_API_BASE_URL = process.env.PYTHON_API_BASE_URL || 'http://localhost:5000';
const PYTHON_API_BASE_URL = 'http://203.145.216.182:58028';
/**
 * 呼叫 Python 模型服務處理檔案
 * @param {string} firebaseUrl - Firebase Storage 檔案 URL
 * @param {string} fileName - 原始檔案名稱
 * @returns {Promise<Object>} Python API 回應
 */
const callPythonModelService = async (firebaseUrl, fileName) => {
  try {
    // 準備發送給 Python API 的資料
    const requestData = {
      file_url: firebaseUrl,
      file_name: fileName
    };

    // 設定請求標頭
    const headers = {
      'Content-Type': 'application/json; charset=utf-8',
      'Accept': 'application/json',
      'Accept-Charset': 'utf-8'
    };

    console.log(`📤 正在發送檔案 URL 到 Python API: ${fileName}`);
    console.log(`🔗 Firebase URL: ${firebaseUrl}`);

    // 呼叫 Python API
    const response = await axios.post(
      `${PYTHON_API_BASE_URL}/upload_documents`,
      requestData,
      {
        headers,
        timeout: 300000, // 5分鐘超時（因為模型處理可能需要較長時間）
        responseType: 'json'
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
 * 從 Firebase URL 下載並解析 PDF 內容
 * @param {string} firebaseUrl - Firebase storage URL
 * @returns {Promise<Object>} 解析結果包含預覽內容
 */
const parsePDFFromFirebaseUrl = async (firebaseUrl) => {
  try {
    console.log(`📖 正在從 Firebase URL 讀取 PDF: ${firebaseUrl}`);
    
    // 從 Firebase URL 下載 PDF
    const response = await axios.get(firebaseUrl, {
      responseType: 'arraybuffer',
      timeout: 30000, // 30秒超時
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PDF-Parser/1.0)'
      }
    });

    // 解析 PDF 內容
    const pdfData = await pdfParse(Buffer.from(response.data));
    
    // 取得前幾行文本做預覽 (前500字元)
    const previewText = pdfData.text.substring(0, 500).trim();
    const lines = previewText.split('\n').filter(line => line.trim().length > 0);
    const firstFewLines = lines.slice(0, 5); // 前5行非空白行
    
    console.log('✅ PDF 解析成功');
    console.log('📄 內容預覽:', firstFewLines.join('\n'));
    
    return {
      success: true,
      totalPages: pdfData.numpages,
      totalText: pdfData.text.length,
      preview: firstFewLines,
      fullPreviewText: previewText
    };

  } catch (error) {
    console.error('❌ PDF 解析失敗:', error.message);
    return {
      success: false,
      error: `PDF 解析失敗: ${error.message}`,
      preview: []
    };
  }
};

/**
 * 上傳檔案並處理
 */
exports.uploadFile = async (req, res) => {
  try {
    const localFilePath = req.file.path;
    
    // 修復檔案名稱編碼問題（後備機制）
    let originalName = req.file.originalname;
    try {
      // 嘗試修復可能的編碼問題
      if (!/[\u4e00-\u9fa5]/.test(originalName)) {
        // 如果不包含中文字符，嘗試重新編碼
        const decodedName = Buffer.from(originalName, 'latin1').toString('utf8');
        if (/[\u4e00-\u9fa5]/.test(decodedName)) {
          originalName = decodedName;
          console.log(`✅ 修復檔案名稱編碼: ${originalName}`);
        }
      }
    } catch (error) {
      console.warn('檔案名稱編碼修復失敗，使用原檔名:', originalName);
    }
    
    const destination = `pdfs/${originalName}`;
    
    console.log(`🔄 開始處理檔案: ${originalName}`);

    // 先上傳到 Firebase Storage
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

    // 呼叫 Python 模型服務處理檔案（傳送 Firebase URL）
    let pythonResponse = null;
    try {
      pythonResponse = await callPythonModelService(url, originalName);
      console.log('✅ Python 模型處理完成');
    } catch (pythonError) {
      console.error('⚠️ Python 模型處理失敗:', pythonError.message);
      // 即使 Python 處理失敗也繼續回傳結果
    }

    // 從 Firebase URL 解析 PDF 內容並預覽
    console.log('📖 開始解析上傳的 PDF 內容...');
    const pdfAnalysis = await parsePDFFromFirebaseUrl(url);

    // 回傳完整結果
    const result = {
      message: '檔案上傳成功',
      filename: originalName,
      firebase_url: url,
      python_processing: pythonResponse ? {
        success: true,
        ...pythonResponse
      } : {
        success: false,
        error: 'Python 模型處理失敗'
      },
      pdf_content: pdfAnalysis
    };

    console.log('✅ 檔案處理完成:', originalName);
    return ApiResponse.success(res, result, '檔案上傳成功');

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

    return ApiResponse.serverError(res, '檔案上傳失敗', error);
  }
};