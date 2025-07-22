console.log("🔥 Firebase 初始化開始");

if (typeof firebase === 'undefined') {
  console.error("❌ Firebase SDK 未載入，請檢查腳本引用");
  throw new Error("Firebase SDK 未載入");
}

console.log("✅ Firebase SDK 已載入");

const firebaseConfig = {
    apiKey: "AIzaSyBp_XEBrLGAtOkSL9re9K5P0WgPumueuOA",
    authDomain: "star-platform-bf3e7.firebaseapp.com",
    projectId: "star-platform-bf3e7",
    storageBucket: "star-platform-bf3e7.appspot.com",
    messagingSenderId: "965516728684",
    appId: "1:965516728684:web:8f8648cb424a4434a37b49",
    measurementId: "G-X54H7KXE5Y"
};
try {
  let app;
  
  // 檢查是否已經初始化
  try {
    app = firebase.app();
    console.log("✅ Firebase App 已存在:", app.name);
  } catch (e) {
    console.log("🚀 初始化新的 Firebase App...");
    app = firebase.initializeApp(firebaseConfig);
    console.log("✅ Firebase App 初始化完成:", app.name);
  }

  /* <-- 從這裡開始註解
  // 偵測是否在本地開發環境 (localhost)*/  // <-- 在這裡結束註解
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    console.log("🚀 偵測到本地開發環境，正在連接到 Firebase 模擬器...");
    
    try {
      // 🔧 修正：確保模擬器按正確順序連接
      
      // 1. 先連接 Auth 模擬器
      const auth = firebase.auth();
      auth.useEmulator("http://localhost:9099");
      console.log("✅ Auth 模擬器已連接");
      
      // 2. 再連接 Firestore 模擬器
      const firestore = firebase.firestore();
      firestore.useEmulator("localhost", 8080);
      console.log("✅ Firestore 模擬器已連接");
      
      // 3. 最後連接 Functions 模擬器
      const functions = firebase.functions();
      functions.useEmulator("localhost", 5001);
      console.log("✅ Functions 模擬器已連接");
      
      console.log("✅ 已成功連接至所有本地模擬器！");
      
    } catch (emulatorError) {
      console.error("❌ 模擬器連接失敗:", emulatorError);
      // 不要拋出錯誤，繼續執行
    }
  } 

  // 🔧 新增：創建 Promise 供 profile-dashboard.js 使用
  window.firebasePromise = Promise.resolve(app);
  
  // 設定全域標記
  window.firebaseReady = true;
  window.firebaseApp = app;
  
  // 觸發準備就緒事件
  const readyEvent = new CustomEvent('firebaseReady', { detail: { app } });
  window.dispatchEvent(readyEvent);
  
  console.log("🎉 Firebase 完全初始化成功");

} catch (error) {
  console.error("❌ Firebase 初始化失敗:", error);
  
  // 設定錯誤標記
  window.firebaseError = error;
  window.firebaseReady = false;
  window.firebasePromise = Promise.reject(error);
  
  // 觸發錯誤事件
  const errorEvent = new CustomEvent('firebaseError', { detail: { error } });
  window.dispatchEvent(errorEvent);
  
  // 顯示用戶友好的錯誤訊息
  showFirebaseError(error);
  
  throw error;
}

// 顯示 Firebase 錯誤
function showFirebaseError(error) {
  if (!document.body) return;
  
  const errorDiv = document.createElement('div');
  errorDiv.id = 'firebase-error';
  errorDiv.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #f8d7da;
    color: #721c24;
    padding: 15px 20px;
    border-radius: 5px;
    border: 1px solid #f5c6cb;
    z-index: 9999;
    max-width: 90%;
    text-align: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  `;
  
  errorDiv.innerHTML = `
    <div style="margin-bottom: 10px;">
      <strong>🔥 Firebase 初始化失敗</strong>
    </div>
    <div style="font-size: 14px; margin-bottom: 10px;">
      ${error.message}
    </div>
    <button onclick="location.reload()" style="
      background: #721c24;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    ">重新載入頁面</button>
  `;
  
  document.body.appendChild(errorDiv);
  
  // 10 秒後自動隱藏
  setTimeout(() => {
    if (errorDiv.parentNode) {
      errorDiv.parentNode.removeChild(errorDiv);
    }
  }, 10000);
}