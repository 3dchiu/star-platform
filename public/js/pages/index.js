// js/pages/index.js - 【修正語言切換版】

console.log("index.js (修正版) 啟動");

// 🔧 修正：等待所有腳本載入完成後再初始化語言
let isLanguageInitialized = false;

// 語言初始化函數
function initializeLanguage() {
  if (isLanguageInitialized) return;
  
  console.log("🌍 開始初始化語言系統");
  
  // 檢查 i18n 函數是否可用
  if (typeof window.setLang === 'function' && typeof window.getCurrentLang === 'function') {
    const savedLang = localStorage.getItem("lang") || "en";
    console.log("📍 設定語言為:", savedLang);
    
    // 設定語言
    window.setLang(savedLang);
    isLanguageInitialized = true;
    console.log("✅ 語言初始化成功");
  } else {
    console.warn("⚠️ i18n 函數尚未載入，延遲重試...");
    // 延遲重試
    setTimeout(initializeLanguage, 100);
  }
}

// 🔧 修正：先初始化語言，再等待 DOM
initializeLanguage();

// 當頁面載入完成
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 DOM 載入完成，開始初始化頁面");
  
  // 確保語言已初始化
  if (!isLanguageInitialized) {
    console.log("🔄 語言尚未初始化，強制重新初始化");
    initializeLanguage();
  }
  
  // 檢查 Firebase 是否已初始化
  if (typeof firebase === 'undefined' || !firebase.functions) {
    console.error("❌ Firebase 服務尚未準備就緒。");
    return;
  }
  
  const auth = firebase.auth();
  console.log("✅ Firebase 服務已連接");

  // 根據登入狀態，決定頁面行為
  auth.onAuthStateChanged(user => {
    if (user) {
      // --- 邏輯一：如果使用者已登入 ---
      console.log("👤 使用者已登入，正在跳轉至儀表板...");
      window.location.href = "./pages/profile-dashboard.html";
    } else {
      // --- 邏輯二：如果使用者未登入，就初始化首頁的搜尋功能 ---
      console.log("👋 訪客模式，初始化搜尋功能...");
      initializeSearch();
      loadAndDisplayFeaturedUsers();
    }
  });
});

// 🔧 修正：監聽語言變更事件
window.addEventListener("langChanged", function(event) {
  console.log("🌍 語言已變更至:", event.detail.lang);
  updateDynamicContent(event.detail.lang);
});

// 🔧 新增：更新動態內容函數
function updateDynamicContent(lang) {
  console.log("🔄 更新動態內容，語言:", lang);
  
  // 更新搜尋框 placeholder
  const searchInput = document.getElementById("mainSearchInput");
  if (searchInput && typeof window.t === 'function') {
    searchInput.placeholder = window.t('home.searchPlaceholder');
  }
  
  // 重新載入精選用戶（使用正確的語言）
  loadAndDisplayFeaturedUsers();
}

/**
 * 🆕 新函式：初始化搜尋相關的所有功能
 */
function initializeSearch() {
  // 獲取頁面上的 HTML 元素
  const searchInput = document.getElementById("mainSearchInput");
  const searchButton = document.getElementById("mainSearchButton");
  const resultsContainer = document.getElementById("searchResultsContainer");

  // 如果找不到必要的元素，就提前終止，避免錯誤
  if (!searchInput || !searchButton || !resultsContainer) {
    console.warn("⚠️ 在首頁上找不到搜尋相關的 HTML 元素。");
    return;
  }

  // 初始化後端建立的 Cloud Function
  const searchProfiles = firebase.functions().httpsCallable('searchPublicProfiles');

  // 定義執行搜尋的函式
  const performSearch = () => {
    const keyword = searchInput.value.trim();
    if (!keyword) {
      resultsContainer.innerHTML = "";
      return;
    }

    // 🔧 修正：使用 i18n 翻譯
    const loadingText = typeof window.t === 'function' ? window.t('common.loading') : '搜尋中...';
    resultsContainer.innerHTML = `<p>${loadingText}</p>`;

    searchProfiles({ keyword: keyword })
      .then(result => {
        const profiles = result.data;
        resultsContainer.innerHTML = "";

        if (!profiles || profiles.length === 0) {
          const noResultText = typeof window.t === 'function' ? 
            window.t('home.noSearchResults') || '找不到相關結果。' : '找不到相關結果。';
          resultsContainer.innerHTML = `<p>${noResultText}</p>`;
          return;
        }

        profiles.forEach(profile => {
          const cardElement = createProfileCard(profile);
          resultsContainer.appendChild(cardElement);
        });
      })
      .catch(error => {
        console.error("搜尋時發生錯誤:", error);
        const errorText = typeof window.t === 'function' ? 
          window.t('common.networkError') || '搜尋失敗，請稍後再試。' : '搜尋失敗，請稍後再試。';
        resultsContainer.innerHTML = `<p style="color:red;">${errorText}</p>`;
      });
  };

  // 綁定事件
  searchButton.addEventListener("click", performSearch);
  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      performSearch();
    }
  });
}

/**
 * 輔助函式：根據使用者資料，建立一個結果卡片的 HTML 元素
 * @param {object} profile - { userId, name, headline, photoURL }
 * @returns {HTMLElement}
 */
function createProfileCard(profile) {
  const cardLink = document.createElement('a');
  cardLink.href = `/pages/public-profile.html?userId=${profile.userId}`;
  cardLink.className = 'result-card no-avatar'; // 加上一個新 class 方便調整樣式

  // 🔧 修正：使用 i18n 翻譯預設文字
  const defaultHeadline = typeof window.t === 'function' ? 
    window.t('publicSummary.defaultUserName') || '尚未提供標題' : '尚未提供標題';

  cardLink.innerHTML = `
    <div class="result-info">
      <h4>${profile.name}</h4>
      <p>${profile.headline || defaultHeadline}</p>
    </div>
  `;
  return cardLink;
}

async function loadAndDisplayFeaturedUsers() {
  const container = document.getElementById("featuredUsersSection");
  if (!container) return; // 如果頁面上沒有這個區塊，就直接返回

  try {
    const db = firebase.firestore();
    const docRef = db.collection("system").doc("featuredUsers");
    const docSnap = await docRef.get();

    if (docSnap.exists && docSnap.data().users?.length > 0) {
      const featuredProfiles = docSnap.data().users;
      
      // 🔧 修正：使用 i18n 翻譯標題
      const title = document.createElement('h2');
      title.className = 'section-title';
      const titleText = typeof window.t === 'function' ? 
        window.t('home.featuredUsers') || '精選用戶' : '精選用戶';
      title.textContent = titleText;
      
      const cardsContainer = document.createElement('div');
      cardsContainer.className = 'featured-users-grid';

      featuredProfiles.forEach(profile => {
        const cardElement = createProfileCard(profile); 
        cardsContainer.appendChild(cardElement);
      });
      
      // 清空容器並填入新內容
      container.innerHTML = '';
      container.appendChild(title);
      container.appendChild(cardsContainer);

    } else {
      console.log("📝 在 system/featuredUsers 中找不到精選用戶資料。");
    }
  } catch (error) {
    console.error("❌ 載入精選用戶時發生錯誤:", error);
    const errorText = typeof window.t === 'function' ? 
      window.t('common.loadingError') || '載入精選用戶失敗。' : '載入精選用戶失敗。';
    container.innerHTML = `<p style="color:red;">${errorText}</p>`
  }
}