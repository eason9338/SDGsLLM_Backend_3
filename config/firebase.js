// config/firebase.js
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json'); // 根據實際路徑調整

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'sdgsllm.firebasestorage.app' // ✅ 用 appspot.com，不是 firebasestorage.app
});

const bucket = admin.storage().bucket();
module.exports = { bucket };