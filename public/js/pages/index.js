// js/pages/index.js - 【最終合併版】

import { setLang } from "../i18n.js";
//console.log("index.js (合併版) 啟動");

// 初始化語言
const lang = localStorage.getItem("lang") || "en";
setLang(lang);

// 當頁面載入完成
document.addEventListener("DOMContentLoaded", () => {
  // 檢查 Firebase 是否已初始化
  if (typeof firebase === 'undefined' || !firebase.functions) {
    console.error("❌ Firebase 服務尚未準備就緒。");
    return;
  }
  
  const auth = firebase.auth();
  //console.log("✅ Firebase 服務已連接");

  // 根據登入狀態，決定頁面行為
  auth.onAuthStateChanged(user => {
    if (user) {
      // --- 邏輯一：如果使用者已登入 ---
      //console.log("👤 使用者已登入，正在跳轉至儀表板...");
      window.location.href = "./pages/profile-dashboard.html";
    } else {
      // --- 邏輯二：如果使用者未登入，就初始化首頁的搜尋功能 ---
      //console.log("👋 訪客模式，初始化搜尋功能...");
      initializeSearch(firebase);
      loadAndDisplayFeaturedUsers();
    }
  });
});

/**
 * 🆕 新函式：初始化搜尋相關的所有功能
 * @param {object} firebaseInstance - 已初始化的 Firebase app instance
 */
function initializeSearch(firebaseInstance) {
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
  const searchProfiles = firebaseInstance.functions().httpsCallable('searchPublicProfiles');

  // 定義執行搜尋的函式
  const performSearch = () => {
    const keyword = searchInput.value.trim();
    if (!keyword) {
      resultsContainer.innerHTML = "";
      return;
    }

    resultsContainer.innerHTML = `<p>搜尋中...</p>`;

    searchProfiles({ keyword: keyword })
      .then(result => {
        const profiles = result.data;
        resultsContainer.innerHTML = "";

        if (!profiles || profiles.length === 0) {
          resultsContainer.innerHTML = `<p>找不到相關結果。</p>`;
          return;
        }

        profiles.forEach(profile => {
          const cardElement = createProfileCard(profile);
          resultsContainer.appendChild(cardElement);
        });
      })
      .catch(error => {
        console.error("搜尋時發生錯誤:", error);
        resultsContainer.innerHTML = `<p style="color:red;">搜尋失敗，請稍後再試。</p>`;
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

  cardLink.innerHTML = `
    <div class="result-info">
      <h4>${profile.name}</h4>
      <p>${profile.headline || '尚未提供標題'}</p>
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
      
      // 建立標題和卡片容器
      const title = document.createElement('h2');
      title.className = 'section-title'; // 你可以為這個 class 加上樣式
      title.textContent = '精選用戶'; // 或者使用 i18n
      
      const cardsContainer = document.createElement('div');
      cardsContainer.className = 'featured-users-grid'; // 你可以為這個 class 加上 grid 樣式

      featuredProfiles.forEach(profile => {
        // 直接複用我們已經寫好的 createProfileCard 函式！
        const cardElement = createProfileCard(profile); 
        cardsContainer.appendChild(cardElement);
      });
      
      // 清空容器並填入新內容
      container.innerHTML = '';
      container.appendChild(title);
      container.appendChild(cardsContainer);

    } else {
      //console.log("📝 在 system/featuredUsers 中找不到精選用戶資料。");
    }
  } catch (error) {
    console.error("❌ 載入精選用戶時發生錯誤:", error);
    container.innerHTML = `<p style="color:red;">載入精選用戶失敗。</p>`
  }
}