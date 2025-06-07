// js/components/app-header.js - 統一修復版本
import { i18n, setLang } from "../i18n.js";
console.log("app-header.js 啟動");

// 全域變數
let auth;
let isAuthSetup = false;

// 更新登入/登出按鈕文字
function updateLoginLogoutButtonText(lang) {
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  
  if (loginBtn) {
    const loginText = i18n[lang]?.header?.login || "登入";
    loginBtn.innerText = loginText;
  }
  
  if (logoutBtn) {
    const logoutText = i18n[lang]?.header?.logout || "登出";
    logoutBtn.innerText = logoutText;
  }
}

// 設定語言按鈕
function setupLanguageButtons(currentLang) {
  const langButton = document.getElementById('langButton');
  const langMenu = document.getElementById('langMenu');
  
  console.log("🔍 語言按鈕設定:", { langButton: !!langButton, langMenu: !!langMenu });

  // 更新語言按鈕文字
  function updateLangButtonText(lang) {
    const map = { en: "EN", "zh-Hant": "繁中 ⌄" };
    if (langButton) langButton.innerText = map[lang] || "EN";
  }

  // 初始顯示
  updateLangButtonText(currentLang);

  // 當語言切換時更新
  window.addEventListener("langChanged", e => {
    updateLangButtonText(e.detail);
    updateLoginLogoutButtonText(e.detail);
  });

  // 語言選單功能
  if (langButton && langMenu) {
    langButton.addEventListener('click', (e) => {
      e.stopPropagation();
      langMenu.classList.toggle('show');
      langMenu.classList.toggle('hidden');
    });

    document.querySelectorAll('.lang-option').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const selectedLang = e.target.dataset.lang;
        localStorage.setItem('lang', selectedLang);
        setLang(selectedLang);

        // 通知全站語系已變更
        window.dispatchEvent(new CustomEvent("langChanged", { detail: selectedLang }));

        // 關閉語言選單
        langMenu.classList.remove('show');
        langMenu.classList.add('hidden');
      });
    });

    // 點擊其他地方關閉語言選單
    document.addEventListener('click', (e) => {
      if (!langButton.contains(e.target) && !langMenu.contains(e.target)) {
        langMenu.classList.remove('show');
        langMenu.classList.add('hidden');
      }
    });
  }
}

// 更新按鈕顯示狀態
function updateButtonDisplay(user) {
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  
  console.log("🔄 更新按鈕顯示:", {
    hasUser: !!user,
    userEmail: user?.email,
    loginBtn: !!loginBtn,
    logoutBtn: !!logoutBtn
  });
  
  if (user) {
    // 用戶已登入：顯示登出按鈕，隱藏登入按鈕
    if (loginBtn) {
      loginBtn.style.display = "none";
      console.log("✅ 隱藏登入按鈕");
    }
    if (logoutBtn) {
      logoutBtn.style.display = "inline-block";
      console.log("✅ 顯示登出按鈕");
    }
  } else {
    // 用戶未登入：顯示登入按鈕，隱藏登出按鈕
    if (loginBtn) {
      loginBtn.style.display = "inline-block";
      console.log("✅ 顯示登入按鈕");
    }
    if (logoutBtn) {
      logoutBtn.style.display = "none";
      console.log("✅ 隱藏登出按鈕");
    }
  }
}

// 設定按鈕事件
function setupButtonEvents() {
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  
  if (!loginBtn || !logoutBtn) {
    console.error("❌ 找不到登入/登出按鈕");
    return false;
  }
  
  // 登入按鈕事件
  loginBtn.onclick = function(e) {
    e.preventDefault();
    const next = encodeURIComponent(location.pathname + location.search);
    location.href = `/pages/login.html?next=${next}`;
  };
  
  // 登出按鈕事件
  logoutBtn.onclick = function(e) {
    e.preventDefault();
    console.log("🚪 用戶點擊登出");
    
    if (auth) {
      auth.signOut()
        .then(() => {
          console.log("✅ 登出成功");
          location.href = "/pages/login.html";
        })
        .catch(err => {
          console.error("❌ 登出失敗:", err);
          location.href = "/pages/login.html";
        });
    } else {
      console.log("⚠️ Auth 未初始化，直接跳轉登入頁");
      location.href = "/pages/login.html";
    }
  };
  
  console.log("✅ 按鈕事件設定完成");
  return true;
}

// 設定 Firebase 認證
async function setupAuthentication() {
  if (isAuthSetup) {
    console.log("⚠️ 認證已經設定過，跳過");
    return;
  }

  console.log("🔍 開始設定 Firebase 認證");
  
  // 檢查 Firebase 是否可用
  if (typeof firebase === 'undefined') {
    console.error("❌ Firebase 未載入");
    return;
  }

  if (firebase.apps.length === 0) {
    console.error("❌ Firebase 未初始化");
    return;
  }

  try {
    auth = firebase.auth();
    console.log("✅ Firebase Auth 已連接");
    
    // 設定按鈕事件
    if (!setupButtonEvents()) {
      console.error("❌ 按鈕事件設定失敗");
      return;
    }

    // 🔥 關鍵：先檢查當前用戶狀態
    const currentUser = auth.currentUser;
    console.log("🔍 當前用戶狀態:", currentUser ? `已登入(${currentUser.email})` : "未登入");
    
    // 立即更新按鈕狀態
    updateButtonDisplay(currentUser);
    
    // 監聽認證狀態變化
    auth.onAuthStateChanged(user => {
      console.log("🔄 認證狀態變化:", user ? `已登入(${user.email})` : "已登出");
      updateButtonDisplay(user);
    });
    
    isAuthSetup = true;
    console.log("✅ 認證設定完成");
    
  } catch (error) {
    console.error("❌ 設定認證功能失敗:", error);
  }
}

// 顯示登入按鈕（錯誤處理時使用）
function showLoginButton() {
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  
  if (loginBtn) {
    loginBtn.style.display = "inline-block";
    loginBtn.onclick = function() {
      const next = encodeURIComponent(location.pathname + location.search);
      location.href = `/pages/login.html?next=${next}`;
    };
  }
  if (logoutBtn) {
    logoutBtn.style.display = "none";
  }
  
  console.log("✅ 錯誤處理：顯示登入按鈕");
}

// 等待 Firebase 準備就緒
async function waitForFirebase(maxWaitTime = 10000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitTime) {
    if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
      console.log("✅ Firebase 已準備就緒");
      return true;
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log("⏰ Firebase 等待超時");
  return false;
}

// 主要初始化函數
document.addEventListener('DOMContentLoaded', async () => {
  console.log("🚀 Header 初始化開始");
  
  try {
    // ❶ 載入 header.html
    console.log("📤 載入 header.html");
    const response = await fetch("../../partials/header.html");
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    const headerContainer = document.getElementById("appHeader");
    
    if (headerContainer) {
      headerContainer.innerHTML = html;
      console.log("✅ Header 已插入到 appHeader 容器");
    } else {
      document.body.insertAdjacentHTML("afterbegin", html);
      console.log("✅ Header 已插入到 body 開頭");
    }

    // 等待 DOM 更新
    await new Promise(resolve => setTimeout(resolve, 50));

    // ❷ 設定語言功能
    const currentLang = localStorage.getItem("lang") || "en";
    setLang(currentLang);
    setupLanguageButtons(currentLang);
    updateLoginLogoutButtonText(currentLang);

    // ❸ 等待 Firebase 並設定認證
    console.log("⏳ 等待 Firebase 載入...");
    const firebaseReady = await waitForFirebase();
    
    if (firebaseReady) {
      await setupAuthentication();
    } else {
      console.log("⚠️ Firebase 未就緒，使用簡化模式");
      showLoginButton();
    }
    
    console.log("🎉 Header 初始化完成");
    
  } catch (error) {
    console.error("❌ Header 初始化失敗:", error);
    showLoginButton();
  }
});