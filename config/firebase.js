const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// 檢查本地檔案是否存在
const serviceAccountPath = path.join(__dirname, 'firebase-service-account.json');
const hasLocalFile = fs.existsSync(serviceAccountPath);

let serviceAccount;

if (hasLocalFile) {
  // 優先使用本地檔案（如果存在）
  serviceAccount = require(serviceAccountPath);
  console.log('📁 使用本地 Firebase service account 檔案');
  
} else {
  // 使用環境變數
  require('dotenv').config();
  
  const requiredEnvVars = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_PRIVATE_KEY_ID', 
    'FIREBASE_PRIVATE_KEY',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_CLIENT_ID',
    'FIREBASE_CLIENT_CERT_URL'
  ];

  // 檢查環境變數
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`缺少必要的環境變數: ${envVar}`);
    }
  }

  serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
    universe_domain: "googleapis.com"
  };
  
  console.log('☁️ 使用環境變數配置 Firebase');
}

// 初始化 Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'sdgsllm.firebasestorage.app'
});

console.log('✅ Firebase 初始化成功');

// 測試 bucket 連接
const bucket = admin.storage().bucket();

// 簡單的連接測試
bucket.getMetadata()
  .then(() => {
    console.log('✅ Firebase Storage bucket 連接成功');
  })
  .catch((error) => {
    console.error('❌ Firebase Storage bucket 連接失敗:', error.message);
    console.log('💡 請檢查以下項目：');
    console.log('   1. Firebase Console 中 Storage 是否已啟用');
    console.log('   2. bucket 名稱是否正確 (sdgsllm.appspot.com)');
    console.log('   3. service account 是否有 Storage 權限');
  });

module.exports = { bucket };