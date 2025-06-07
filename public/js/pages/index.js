// index.js
import { setLang } from "../i18n.js";
console.log("index.js 啟動");

// 初始化語言
const lang = localStorage.getItem("lang") || "en";
setLang(lang);

// 當頁面載入完成
document.addEventListener("DOMContentLoaded", () => {
  // 🔧 檢查 Firebase 是否已初始化
  if (typeof firebase === 'undefined') {
    console.error("❌ Firebase 未載入");
    return;
  }

  if (firebase.apps.length === 0) {
    console.error("❌ Firebase 未初始化，請檢查 firebase-init.js");
    return;
  }

  const auth = firebase.auth();
  console.log("✅ Firebase 服務已連接");

  auth.onAuthStateChanged(user => {
    if (user) {
      // 如果已登入，直接跳轉到 profile-dashboard 頁面
      window.location.href = "./pages/profile-dashboard.html";
    }
    // 如果沒登入，就停留在首頁，讓使用者自己選擇登入
  });
});