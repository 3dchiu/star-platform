import { i18n, setLang } from "../i18n.js";

document.addEventListener('DOMContentLoaded', async () => {
  /* ❶ 插入 header.html */
  const html = await fetch("../partials/header.html").then(r => r.text());
  document.body.insertAdjacentHTML("afterbegin", html);

  /* ❷ 語言選單 */
  const langSel = document.getElementById("langSelector");
  const currentLang = localStorage.getItem("lang") || "en";
  langSel.value = currentLang;
  setLang(currentLang);

  /* ❸ 初始化 Firebase */
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

  /* ❹ Login / Logout 按鈕 */
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  if (loginBtn && logoutBtn) {
    loginBtn.textContent = i18n[currentLang].login;
    logoutBtn.textContent = i18n[currentLang].logout;

    loginBtn.addEventListener("click", () => {
      const next = encodeURIComponent(location.pathname + location.search);
      location.href = `/pages/login.html?next=${next}`;
    });

    logoutBtn.addEventListener("click", () => {
      auth.signOut()
        .then(() => location.href = "/pages/login.html")
        .catch(err => console.error(err));
    });

    auth.onAuthStateChanged(user => {
      loginBtn.style.display = user ? "none" : "inline-block";
      logoutBtn.style.display = user ? "inline-block" : "none";
    });

    // 【⭐加在這裡：語言切換時更新 login/logout 按鈕】
    langSel.addEventListener("change", e => {
      const selectedLang = e.target.value;
      setLang(selectedLang);

      loginBtn.textContent = i18n[selectedLang].login;
      logoutBtn.textContent = i18n[selectedLang].logout;
    });

  } else {
    console.error("找不到 loginBtn 或 logoutBtn，請檢查 header.html");
  }
});
