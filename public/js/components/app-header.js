// public/js/components/app-header.js (最終穩固版，可直接覆蓋)

import { i18n, setLang } from "../i18n.js";
console.log("app-header.js (V3 - 最終穩固版) 啟動");

// 主要初始化函數
document.addEventListener('DOMContentLoaded', async () => {
  console.log("🚀 Header 初始化開始");
  try {
    const headerContainer = document.getElementById("appHeader");
    if (!headerContainer) {
      console.warn("⚠️ 找不到 #appHeader 容器，Header 未載入。");
      return;
    }
    const response = await fetch("../partials/header.html");
    if (!response.ok) throw new Error(`無法載入 header.html: ${response.status}`);
    headerContainer.innerHTML = await response.text();
    console.log("✅ Header HTML 已成功插入。");

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
  if (!langButton || !langMenu) return;

  const updateLangButtonText = (lang) => {
    const map = { en: "EN", "zh-Hant": "繁中 ⌄" };
    langButton.innerText = map[lang] || "EN";
  };
  
  const updateLoginLogoutButtonText = (lang) => {
    if(elements.loginBtn) elements.loginBtn.innerText = i18n[lang]?.header?.login || "登入";
    if(elements.logoutBtn) elements.logoutBtn.innerText = i18n[lang]?.header?.logout || "登出";
  };

  updateLangButtonText(currentLang);
  updateLoginLogoutButtonText(currentLang);

  window.addEventListener("langChanged", e => {
    updateLangButtonText(e.detail);
    updateLoginLogoutButtonText(e.detail);
  });

  langButton.addEventListener('click', e => {
    e.stopPropagation();
    langMenu.classList.toggle('hidden');
  });

  document.querySelectorAll('.lang-option').forEach(btn => {
    btn.addEventListener('click', e => {
      const selectedLang = e.target.dataset.lang;
      localStorage.setItem('lang', selectedLang);
      setLang(selectedLang);
      langMenu.classList.add('hidden');
    });
  });

  document.addEventListener('click', e => {
    if (!langButton.contains(e.target) && !langMenu.contains(e.target)) {
      langMenu.classList.add('hidden');
    }
  });
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

    loginBtn.onclick = (e) => { e.preventDefault(); location.href = `/pages/login.html?next=${encodeURIComponent(location.pathname + location.search)}`; };
    logoutBtn.onclick = (e) => { e.preventDefault(); auth.signOut().then(() => location.href = "/"); };

    auth.onAuthStateChanged(user => {
      updateButtonDisplay(user, elements);
      if(logoLink) logoLink.href = user ? '/pages/profile-dashboard.html' : '/';

      if (user && headerSearchContainer && headerSearchInput && headerSearchResults) {
        headerSearchContainer.style.display = 'block';
        headerSearchInput.addEventListener('input', () => {
          const keyword = headerSearchInput.value.trim();
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
  return false;
}

function createSimpleProfileCard(profile) {
  const cardLink = document.createElement('a');
  cardLink.href = `/pages/public-profile.html?userId=${profile.userId}`;
  // 我們可以使用一個更簡潔的 class 名稱，對應新的單行樣式
  cardLink.className = 'header-search-result-item';

  // 將姓名和頭銜組合成一行文字
  const displayText = profile.headline 
    ? `${profile.name} (${profile.headline})` 
    : profile.name;
  
  // 直接設定文字內容，不再需要複雜的 innerHTML
  cardLink.textContent = displayText;
  
  return cardLink;
}