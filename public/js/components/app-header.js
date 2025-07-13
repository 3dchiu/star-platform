// public/js/components/app-header.js (修正版 - 解決重複載入和語言切換問題)

import { i18n, setLang } from "../i18n.js";
console.log("app-header.js (修正版) 啟動");

// 🔧 添加初始化標記防止重複載入
let headerInitialized = false;

// 主要初始化函數
document.addEventListener('DOMContentLoaded', async () => {
  if (headerInitialized) {
    console.log("⚠️ Header 已初始化，跳過重複載入");
    return;
  }
  
  console.log("🚀 Header 初始化開始");
  try {
    const headerContainer = document.getElementById("appHeader");
    if (!headerContainer) {
      console.warn("⚠️ 找不到 #appHeader 容器，Header 未載入。");
      return;
    }

    // 🔧 檢查並清空容器避免重複內容
    if (headerContainer.innerHTML.trim() !== '') {
      console.log("⚠️ Header 容器已有內容，清空後重新載入");
      headerContainer.innerHTML = '';
    }

    const response = await fetch("../partials/header.html");
    if (!response.ok) throw new Error(`無法載入 header.html: ${response.status}`);
    
    headerContainer.innerHTML = await response.text();
    console.log("✅ Header HTML 已成功插入。");

    // 🔧 標記已初始化
    headerInitialized = true;

    // 🔧 等待 DOM 元素完全創建後再獲取
    await new Promise(resolve => setTimeout(resolve, 50));

    // 步驟 2：一次性獲取所有 Header 內部元素
    const elements = {
        langButton: document.getElementById('langButton'),
        langMenu: document.getElementById('langMenu'),
        loginBtn: document.getElementById("loginBtn"),
        logoutBtn: document.getElementById("logoutBtn"),
        logoLink: document.querySelector('.brand-link'),
        headerSearchContainer: document.getElementById("headerSearchContainer"),
        headerSearchInput: document.getElementById("headerSearchInput"),
        headerSearchResults: document.getElementById("headerSearchResults")
    };

    // 🔧 檢查重複元素
    const duplicateLangButtons = document.querySelectorAll('#langButton');
    const duplicateLangMenus = document.querySelectorAll('#langMenu');
    
    if (duplicateLangButtons.length > 1) {
      console.warn(`⚠️ 發現 ${duplicateLangButtons.length} 個重複的語言按鈕，移除多餘的`);
      for (let i = 1; i < duplicateLangButtons.length; i++) {
        duplicateLangButtons[i].remove();
      }
    }
    
    if (duplicateLangMenus.length > 1) {
      console.warn(`⚠️ 發現 ${duplicateLangMenus.length} 個重複的語言選單，移除多餘的`);
      for (let i = 1; i < duplicateLangMenus.length; i++) {
        duplicateLangMenus[i].remove();
      }
    }

    console.log("✅ Header 內部所有元素已獲取。");

    // 步驟 3：設定語言功能
    const currentLang = localStorage.getItem("lang") || "zh-Hant";
    setLang(currentLang);
    setupLanguageButtons(elements, currentLang);

    // 步驟 4：等待 Firebase 並設定認證與搜尋
    const firebaseReady = await waitForFirebase();
    if (firebaseReady) {
      await setupAuthentication(elements);
    } else {
      updateButtonDisplay(null, elements);
    }
    console.log("🎉 Header 初始化完成");
  } catch (error) {
    console.error("❌ Header 初始化失敗:", error);
  }
});

// --- 輔助函式區 ---

function setupLanguageButtons(elements, currentLang) {
  const { langButton, langMenu } = elements;
  
  if (!langButton || !langMenu) {
    console.error("❌ 語言按鈕或選單不存在");
    console.log("langButton:", langButton);
    console.log("langMenu:", langMenu);
    return;
  }

  console.log("✅ 開始設定語言按鈕功能");

  const updateLangButtonText = (lang) => {
    const map = { en: "EN", "zh-Hant": "繁中 ⌄" };
    langButton.innerText = map[lang] || "EN";
    console.log("🌍 語言按鈕文字已更新:", map[lang]);
  };
  
  const updateLoginLogoutButtonText = (lang) => {
    if(elements.loginBtn) {
      elements.loginBtn.innerText = i18n[lang]?.header?.login || (lang === 'en' ? 'Login' : '登入');
    }
    if(elements.logoutBtn) {
      elements.logoutBtn.innerText = i18n[lang]?.header?.logout || (lang === 'en' ? 'Logout' : '登出');
    }
  };

  // 初始化按鈕文字
  updateLangButtonText(currentLang);
  updateLoginLogoutButtonText(currentLang);

  // 🔧 語言變更事件監聽
  window.addEventListener("langChanged", e => {
    const newLang = e.detail?.lang || e.detail;
    console.log("🔄 收到語言變更事件:", newLang);
    updateLangButtonText(newLang);
    updateLoginLogoutButtonText(newLang);
  });

  // 🔧 移除可能存在的舊事件監聽器
  const newLangButton = langButton.cloneNode(true);
  langButton.parentNode.replaceChild(newLangButton, langButton);
  elements.langButton = newLangButton; // 更新引用

  // 🔧 語言按鈕點擊事件
  newLangButton.addEventListener('click', e => {
    console.log("🖱️ 語言按鈕被點擊");
    e.stopPropagation();
    langMenu.classList.toggle('hidden');
    console.log("選單狀態:", langMenu.classList.contains('hidden') ? '隱藏' : '顯示');
  });

  // 🔧 語言選項點擊事件
  const langOptions = document.querySelectorAll('.lang-option');
  console.log("找到語言選項:", langOptions.length);
  
  langOptions.forEach((btn, index) => {
    console.log(`設定語言選項 ${index}:`, btn.dataset.lang);
    
    // 🔧 移除舊事件監聽器
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    
    newBtn.addEventListener('click', e => {
      const selectedLang = e.target.dataset.lang;
      console.log("🌍 用戶選擇語言:", selectedLang);
      
      try {
        localStorage.setItem('lang', selectedLang);
        setLang(selectedLang);
        langMenu.classList.add('hidden');
        console.log("✅ 語言切換成功");
      } catch (error) {
        console.error("❌ 語言切換失敗:", error);
      }
    });
  });

  // 點擊外部關閉選單
  document.addEventListener('click', e => {
    if (!newLangButton.contains(e.target) && !langMenu.contains(e.target)) {
      langMenu.classList.add('hidden');
    }
  });
  
  console.log("✅ 語言功能設定完成");
}

function updateButtonDisplay(user, elements) {
  const { loginBtn, logoutBtn } = elements;
  if (!loginBtn || !logoutBtn) return;
  if (user) {
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
  } else {
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
  }
}

async function setupAuthentication(elements) {
  try {
    const auth = firebase.auth();
    const functions = firebase.functions();
    const searchProfiles = functions.httpsCallable('searchPublicProfiles');
    const { headerSearchContainer, headerSearchInput, headerSearchResults, loginBtn, logoutBtn, logoLink } = elements;

    if (loginBtn) {
      loginBtn.onclick = (e) => { 
        e.preventDefault(); 
        location.href = `/pages/login.html?next=${encodeURIComponent(location.pathname + location.search)}`; 
      };
    }
    
    if (logoutBtn) {
      logoutBtn.onclick = (e) => { 
        e.preventDefault(); 
        auth.signOut().then(() => location.href = "/"); 
      };
    }

    auth.onAuthStateChanged(user => {
      updateButtonDisplay(user, elements);
      if(logoLink) logoLink.href = user ? '/pages/profile-dashboard.html' : '/';

      if (user && headerSearchContainer && headerSearchInput && headerSearchResults) {
        headerSearchContainer.style.display = 'block';
        
        // 🔧 移除可能存在的舊事件監聽器
        const newSearchInput = headerSearchInput.cloneNode(true);
        headerSearchInput.parentNode.replaceChild(newSearchInput, headerSearchInput);
        
        newSearchInput.addEventListener('input', () => {
          const keyword = newSearchInput.value.trim();
          if (keyword.length < 1) {
            headerSearchResults.classList.add('hidden');
            return;
          }
          
          searchProfiles({ keyword }).then(result => {
            headerSearchResults.innerHTML = '';
            const profiles = result.data;
            if (profiles && profiles.length > 0) {
              profiles.forEach(p => headerSearchResults.appendChild(createSimpleProfileCard(p)));
              headerSearchResults.classList.remove('hidden');
            } else {
              headerSearchResults.classList.add('hidden');
            }
          }).catch(error => {
            console.error("❌ 搜尋失敗:", error);
            headerSearchResults.classList.add('hidden');
          });
        });
        
        document.addEventListener('click', e => {
          if (!headerSearchContainer.contains(e.target)) {
            headerSearchResults.classList.add('hidden');
          }
        });
      } else if (headerSearchContainer) {
        headerSearchContainer.style.display = 'none';
      }
    });
  } catch (error) {
    console.error("❌ 設定認證/搜尋功能失敗:", error);
  }
}

async function waitForFirebase(maxWaitTime = 10000) {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitTime) {
    if (typeof firebase !== 'undefined' && firebase.apps?.length > 0) return true;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  console.warn("⚠️ Firebase 等待超時");
  return false;
}

function createSimpleProfileCard(profile) {
  const cardLink = document.createElement('a');
  cardLink.href = `/pages/public-profile.html?userId=${profile.userId}`;
  cardLink.className = 'header-search-result-item';

  const displayText = profile.headline 
    ? `${profile.name} (${profile.headline})` 
    : profile.name;
  
  cardLink.textContent = displayText;
  
  return cardLink;
}