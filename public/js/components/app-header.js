import { i18n, setLang } from "../i18n.js";

document.addEventListener('DOMContentLoaded', async () => {
  /* ❶ 插入 header.html */
  const html = await fetch("../partials/header.html").then(r => r.text());
  document.body.insertAdjacentHTML("afterbegin", html);

  /* ❷ 初始化語言 */
  const currentLang = localStorage.getItem("lang") || "en";
  setLang(currentLang);

  // ❷-1: 定義語言按鈕相關 DOM（放在 setLang 後面、最上面）
  const langButton = document.getElementById('langButton');
  const langMenu = document.getElementById('langMenu');

  // ❷-2: 加入更新語言按鈕文字的 function
  function updateLangButtonText(lang) {
    const map = { en: "EN", "zh-Hant": "繁中 ⌄" };
    if (langButton) langButton.innerText = map[lang] || "EN";
  }

  // ❷-3: 初始顯示
  updateLangButtonText(currentLang);

  // ❷-4: 當語言切換時更新
  window.addEventListener("langChanged", e => {
    updateLangButtonText(e.detail);
  });

  // ❷-5: 通知語系已設定（這行保持不變）
  window.dispatchEvent(new CustomEvent("langChanged", { detail: currentLang }));


  /* ❸ 抓取 Login / Logout 按鈕 */
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  if (!(loginBtn && logoutBtn)) {
    console.error("找不到 loginBtn 或 logoutBtn，請檢查 header.html");
    return; // 找不到按鈕就直接中止
  }

  /* ❹ 定義更新登入登出按鈕狀態的 function */
  function updateLoginButtonState(user) {
    if (user) {
      loginBtn.style.display = "none";
      logoutBtn.style.display = "inline-block";
    } else {
      loginBtn.style.display = "inline-block";
      logoutBtn.style.display = "none";
    }
  }

  /* ❺ 初始化 Firebase */
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

  /* ❻ 登入登出功能 */
  loginBtn.textContent = i18n[currentLang].header.login;
  logoutBtn.textContent = i18n[currentLang].header.logout;

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
    updateLoginButtonState(user);
  });

  if (langButton && langMenu) {
    langButton.addEventListener('click', (e) => {
      e.stopPropagation(); // 防止冒泡，避免觸發 document click
      langMenu.classList.toggle('show');
      langMenu.classList.toggle('hidden'); // 同時 toggle hidden
    });

    document.querySelectorAll('.lang-option').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const selectedLang = e.target.dataset.lang;
        localStorage.setItem('lang', selectedLang);
        setLang(selectedLang);

        // 更新登入登出按鈕文字
        loginBtn.textContent = i18n[selectedLang].header.login;
        logoutBtn.textContent = i18n[selectedLang].header.logout;


        // ★ 通知全站語系已變更
        window.dispatchEvent(new CustomEvent("langChanged", { detail: selectedLang }));

        // 確保 login/logout 按鈕顯示正確
        updateLoginButtonState(auth.currentUser);

        // 關閉語言選單
        langMenu.classList.remove('show');
        langMenu.classList.add('hidden');
      });
    });

    // 點擊地球以外的地方，自動關閉語言選單
    document.addEventListener('click', (e) => {
      if (!langButton.contains(e.target) && !langMenu.contains(e.target)) {
        langMenu.classList.remove('show');
        langMenu.classList.add('hidden');
      }
    });
  } else {
    console.error("找不到 langButton 或 langMenu，請檢查 header.html");
  }
});
