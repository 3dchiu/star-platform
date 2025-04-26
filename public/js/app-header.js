/* ----------------------------------------------------
 *  共用 Header
 *  1. 動態插入 /partials/header.html
 *  2. 多語選單
 *  3. Firebase Auth：Login / Logout
 *  -------------------------------------------------- */

import { i18n, setLang } from "./i18n.js";

(async () => {
  /* ❶ 先把 header.html 插入到 <body> 最前面 ---------------- */
  const html = await fetch("./partials/header.html").then(r => r.text());
  document.body.insertAdjacentHTML("afterbegin", html);

  /* ❷ 語言下拉選單 --------------------------------------- */
  const langSel = document.getElementById("langSelector");
  const currentLang = localStorage.getItem("lang") || "en";
  langSel.value = currentLang;

  langSel.addEventListener("change", e => {
    setLang(e.target.value);
    location.reload(); // 重新整理讓頁面文字生效
  });

  /* ❸ 初始化 Firebase ------------------------------------ */
  // 將 firebaseConfig 移到前面
  const firebaseConfig = {
    apiKey: "AIzaSyBp_XEBrLGAtOkSL9re9K5P0WgPumueuOA",
    authDomain: "star-platform-bf3e7.firebaseapp.com",
    projectId: "star-platform-bf3e7",
    storageBucket: "star-platform-bf3e7.appspot.com",
    messagingSenderId: "965516728684",
    appId: "1:965516728684:web:8f8648cb424a4434a37b49",
    measurementId: "G-X54H7KXE5Y"
  };

  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();

  /* ❹ Login / Logout 按鈕 ------------------------------- */
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  // 檢查按鈕是否存在，避免 null 錯誤
  if (loginBtn && logoutBtn) {
    loginBtn.textContent = i18n[currentLang].login;
    logoutBtn.textContent = i18n[currentLang].logout;

    // 點 Login：帶 next=目前頁面，完成登入後自動返回
    loginBtn.addEventListener("click", () => {
      const next = encodeURIComponent(location.pathname + location.search);
      location.href = `login.html?next=${next}`;
    });

    // 點 Logout：Firebase signOut
    logoutBtn.addEventListener("click", () => {
      auth.signOut()
        .then(() => location.href = "/login.html")
        .catch(err => console.error(err));
    });

    auth.onAuthStateChanged(user => {
      loginBtn.style.display = user ? "none" : "inline-block";
      logoutBtn.style.display = user ? "inline-block" : "none";
    });
  } else {
    console.error("找不到 loginBtn 或 logoutBtn，請檢查 header.html");
  }
})();