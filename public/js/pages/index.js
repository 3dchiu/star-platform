import { setLang } from "../i18n.js";
import { firebaseConfig } from "../firebase-config.js";

// 初始化語言
const lang = localStorage.getItem("lang") || "en";
setLang(lang);

// 初始化 Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();

// 當頁面載入完成
document.addEventListener("DOMContentLoaded", () => {
  auth.onAuthStateChanged(user => {
    if (user) {
      // 如果已登入，直接跳轉到 profile-dashboard 頁面
      window.location.href = "./pages/profile-dashboard.html";
    }
    // 如果沒登入，就停留在首頁，讓使用者自己選擇登入
  });
});
