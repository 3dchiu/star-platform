// public/js/pages/summary-public.js - i18n 完整版

// 輔助函式 (修改為從 i18n 讀取等級名稱)
const LEVEL_MAP = {
    1: 0, 2: 10, 3: 25, 4: 50, 5: 100,
    6: 200, 7: 300, 8: 500, 9: 750, 10: 1000
};

// ✨ 修改 getLevelInfo，讓它可以接收 i18n 翻譯函式
function getLevelInfo(exp, t) {
  const i18nKey = (level) => `level${level}_name`;
  if (exp >= 1000) return { level: 10, name: t(i18nKey(10)), color: "legendary" };
  if (exp >= 750)  return { level: 9,  name: t(i18nKey(9)), color: "diamond" };
  if (exp >= 500)  return { level: 8,  name: t(i18nKey(8)), color: "trophy" };
  if (exp >= 300)  return { level: 7,  name: t(i18nKey(7)), color: "globe" };
  if (exp >= 200)  return { level: 6,  name: t(i18nKey(6)), color: "sun" };
  if (exp >= 100)  return { level: 5,  name: t(i18nKey(5)), color: "gold" };
  if (exp >= 50)   return { level: 4,  name: t(i18nKey(4)), color: "rocket" };
  if (exp >= 25)   return { level: 3,  name: t(i18nKey(3)), color: "handshake" };
  if (exp >= 10)   return { level: 2,  name: t(i18nKey(2)), color: "briefcase" };
  return             { level: 1,  name: t(i18nKey(1)), color: "gray" };
}

// 主初始化函式
document.addEventListener("DOMContentLoaded", async () => {
    const loadingElement = document.getElementById("summaryLoading");
    const container = document.getElementById("summaryArea");
    
    // ✨ 取得當前語言和翻譯函式
    const lang = localStorage.getItem("lang") || "en";
    const t = (key) => window.i18n?.[lang]?.publicSummary?.[key] || key;

    try {
        await window.firebasePromise;
        const db = firebase.firestore();

        const params = new URLSearchParams(location.search);
        const userId = params.get("userId");
        if (!userId) {
            throw new Error(t("errorMissingId")); // ✨ 使用 i18n
        }

        const publicProfileRef = db.collection("publicProfiles").doc(userId);
        const profileSnap = await publicProfileRef.get();

        if (!profileSnap.exists) {
            throw new Error(t("errorProfileNotFound")); // ✨ 使用 i18n
        }

        const profile = profileSnap.data();
        renderPage(profile, t); // ✨ 將翻譯函式傳入

    } catch (err) {
        console.error("❌ 載入公開檔案失敗:", err);
        container.innerHTML = `<p class="error-message">${t("errorLoading")}: ${err.message}</p>`; // ✨ 使用 i18n
    } finally {
        if (loadingElement) {
            loadingElement.style.display = "none";
        }
    }
});

// 負責渲染整個頁面的函式
function renderPage(profile, t) { // ✨ 接收翻譯函式
    // 1. 渲染基本資料
    document.title = `${profile.name}${t("pageTitle")}`; // ✨ 使用 i18n
    
    const userNameEl = document.getElementById("userName");
    if (userNameEl) {
        userNameEl.textContent = profile.name || t("defaultUserName"); // ✨ 使用 i18n
    }

    const headlineEl = document.getElementById("profile-headline");
    if (headlineEl) {
        headlineEl.textContent = profile.headline || "";
    }

    const bioEl = document.getElementById("profile-bio");
    if (bioEl) {
        bioEl.innerHTML = profile.bio ? profile.bio.replace(/\n/g, "<br>") : "";
    }

    // 2. 渲染等級徽章
    const badgeContainer = document.getElementById("publicLevelBadge");
    if (badgeContainer && profile.settings?.showLevelOnPublicProfile) {
        const userExp = profile.stats?.exp || 0;
        const levelInfo = getLevelInfo(userExp, t); // ✨ 將翻譯函式傳入
        
        badgeContainer.className = `public-level-badge level-${levelInfo.color}`;
        badgeContainer.textContent = `Lv.${levelInfo.level} ${levelInfo.name}`;
    } else if (badgeContainer) {
        badgeContainer.style.display = 'none';
    }

    // 3. 渲染推薦內容區塊
    const summaryArea = document.getElementById("summaryArea");
    summaryArea.innerHTML = `<p>${t("noVerifiedRecommendations")}</p>`; // ✨ 使用 i18n
    
    const toggleBtn = document.getElementById("toggleViewBtn");
    if (toggleBtn) {
        toggleBtn.style.display = 'none';
    }
}