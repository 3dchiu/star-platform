// public/js/profile-dashboard.js

const LEVEL_MAP = {
    1: 0, 2: 10, 3: 25, 4: 50, 5: 100,
    6: 200, 7: 300, 8: 500, 9: 750, 10: 1000
};

function getLevelInfo(exp) {
  if (exp >= 1000) return { level: 10, name: "星光領袖", color: "legendary" };
  if (exp >= 750)  return { level: 9,  name: "職涯任性代言人", color: "diamond" };
  if (exp >= 500)  return { level: 8,  name: "業界口碑典範", color: "trophy" };
  if (exp >= 300)  return { level: 7,  name: "影響力連結者", color: "globe" };
  if (exp >= 200)  return { level: 6,  name: "真誠推薦磁場", color: "sun" };
  if (exp >= 100)  return { level: 5,  name: "人脈之星", color: "gold" };
  if (exp >= 50)   return { level: 4,  name: "團隊領航者", color: "rocket" };
  if (exp >= 25)   return { level: 3,  name: "值得信賴的夥伴", color: "handshake" };
  if (exp >= 10)   return { level: 2,  name: "穩健合作者", color: "briefcase" };
  return             { level: 1,  name: "初心之光", color: "gray" };
}

function getNextLevelThreshold(level) {
    return LEVEL_MAP[level + 1] ?? Infinity;
}

// ✅ 【最終修正版】請完整複製並取代舊的 renderUserLevel 函式
function renderUserLevel(exp) {
    const container = document.getElementById("userLevelInfo");
    if (!container) return;

    const currentLevelInfo = getLevelInfo(exp);
    const currentLevel = currentLevelInfo.level;
    const currentLevelName = currentLevelInfo.name; // 等級稱號，例如 "初心之光"
    const currentLevelColor = currentLevelInfo.color;

    const currentLevelExp = LEVEL_MAP[currentLevel];
    const nextLevelExp = getNextLevelThreshold(currentLevel); 

    let progressPercentage = 0;
    if (nextLevelExp !== Infinity) {
        const expInCurrentLevel = exp - currentLevelExp;
        const expForNextLevel = nextLevelExp - currentLevelExp;
        progressPercentage = Math.max(0, Math.min(100, Math.floor((expInCurrentLevel / expForNextLevel) * 100)));
    } else {
        progressPercentage = 100;
    }

    const lang = localStorage.getItem("lang") || "zh-Hant";
    const t = (window.i18n && window.i18n[lang]?.recommendSummary) || {};
    const expToNextText = nextLevelExp !== Infinity 
        ? (t.upgradeHint ? t.upgradeHint(nextLevelExp - exp, currentLevel + 1) : `再 ${nextLevelExp - exp} EXP 可升至 Lv.${currentLevel + 1}`)
        : (t.maxLevelReached || '已達最高等級');

    // 這個版本包含了星星、等級稱號、進度條和 EXP 文字，內容更豐富
    container.innerHTML = `
        <div class="level-badge-dashboard level-${currentLevelColor}">
            <div class="star-icon">★</div>
            <span class="level-number">${currentLevel}</span>
        </div>
        <div class="level-details">
            <span class="level-name">${currentLevelName}</span>
            <div class="progress-bar">
                <div class="progress-bar-fill" style="width: ${progressPercentage}%;"></div>
            </div>
            <div class="exp-text">
                <span class="current-exp">EXP: ${exp} / ${nextLevelExp === Infinity ? 'MAX' : nextLevelExp}</span>
                <span class="exp-to-next">${expToNextText}</span>
            </div>
        </div>
    `;
}

// 渲染「基本資訊」卡片
function renderBasicInfo(profile) {
    const container = document.getElementById('basicInfo');
    if (!container) return;

    const lang = localStorage.getItem("lang") || "zh-Hant";
    const t = (window.i18n && window.i18n[lang]?.profileDashboard) || {};
    
    container.innerHTML = `
        <h1>${profile.name || ""}</h1>
        ${profile.englishName ? `<p class="english-name">${profile.englishName}</p>` : ""}
        <p class="experience-count">${(profile.workExperiences || []).length} ${t.workExperiences || 'Work Experiences'}</p>
    `;
}

// 🔧 修復：安全的 i18n 引用
const getSafeI18n = () => window.i18n || {};
const getSafeTranslation = (lang) => getSafeI18n()[lang] || getSafeI18n()["zh-Hant"] || {};

// 🔽 Firebase 相關變數
let app, auth, db;

// 🚀 ===== 智能開啟函數 - 放在這裡！ =====
/**
 * 智能開啟推薦連結 - 優先新分頁，失敗則降級到同視窗
 * @param {string} url - 要開啟的 URL
 * @param {string} linkType - 連結類型（用於日誌）
 * @returns {boolean} - 總是返回 false 來阻止預設行為
 */
function smartOpenRecommendation(url, linkType = 'recommendation') {
  //console.log(`🎯 ${linkType}: 嘗試開新分頁 -> ${url}`);
  
  // 理想方案：嘗試開新分頁
  const newWindow = window.open(url, '_blank');
  
  // 智能檢查和降級
  setTimeout(() => {
    if (!newWindow || newWindow.closed || newWindow.location.href === 'about:blank') {
      //console.log(`❌ ${linkType}: 新分頁被阻擋`);
      //console.log(`🔄 ${linkType}: 降級到同視窗開啟`);
      window.location.href = url;
    } else {
      //console.log(`✅ ${linkType}: 新分頁開啟成功`);
    }
  }, 150);
  
  return false;
}
// ===== 智能開啟函數結束 =====

// 🔽 等待 Firebase 初始化完成
function waitForFirebase() {
  return new Promise((resolve, reject) => {
    //console.log("🔍 檢查 Firebase 狀態...");
    //console.log("→ window.firebaseReady:", window.firebaseReady);
    //console.log("→ window.firebaseError:", window.firebaseError);
    //console.log("→ typeof firebase:", typeof firebase);
    
    // 檢查 firebase 全域物件是否存在
    if (typeof firebase === 'undefined') {
      console.error("❌ Firebase SDK 未載入");
      reject(new Error('Firebase SDK 未載入，請確認腳本載入順序'));
      return;
    }
    
    // 如果已經初始化完成
    if (window.firebaseReady) {
      try {
        app = window.firebaseApp || firebase.app();
        auth = firebase.auth();
        db = firebase.firestore();
        //console.log("✅ Firebase 已準備就緒");
        resolve();
      } catch (error) {
        console.error("❌ Firebase 服務初始化失敗:", error);
        reject(error);
      }
      return;
    }
    
    // 如果有錯誤
    if (window.firebaseError) {
      reject(window.firebaseError);
      return;
    }
    
    // 嘗試直接初始化（如果 firebase-init.js 沒有運行）
    try {
      app = firebase.app();
      auth = firebase.auth();
      db = firebase.firestore();
      //console.log("✅ 直接使用現有 Firebase 實例");
      resolve();
      return;
    } catch (directInitError) {
      //console.log("⚠️ 無法直接使用 Firebase，等待初始化事件...");
    }
    
    // 監聽 Firebase 準備就緒事件
    const onReady = (event) => {
      try {
        app = event.detail.app || firebase.app();
        auth = firebase.auth();
        db = firebase.firestore();
        //console.log("✅ Firebase 初始化完成事件收到");
        cleanup();
        resolve();
      } catch (error) {
        console.error("❌ 事件處理中的錯誤:", error);
        cleanup();
        reject(error);
      }
    };
    
    // 監聽 Firebase 錯誤事件
    const onError = (event) => {
      console.error("❌ Firebase 初始化失敗事件收到:", event.detail.error);
      cleanup();
      reject(event.detail.error);
    };
    
    // 清理事件監聽器
    const cleanup = () => {
      window.removeEventListener('firebaseReady', onReady);
      window.removeEventListener('firebaseError', onError);
      if (timeoutId) clearTimeout(timeoutId);
    };
    
    window.addEventListener('firebaseReady', onReady);
    window.addEventListener('firebaseError', onError);
    
    // 設定超時（15秒，增加時間）
    const timeoutId = setTimeout(() => {
      cleanup();
      
      // 最後嘗試：直接檢查是否可以使用 Firebase
      try {
        app = firebase.app();
        auth = firebase.auth();
        db = firebase.firestore();
        //console.log("✅ 超時後成功獲取 Firebase 實例");
        resolve();
      } catch (finalError) {
        console.error("❌ 最終嘗試失敗:", finalError);
        reject(new Error('Firebase 初始化超時，請檢查 firebase-init.js 是否正確載入'));
      }
    }, 15000);
  });
}

// 🔽 當頁面載入完成後，等待 Firebase 然後初始化所有元件與邏輯
document.addEventListener("DOMContentLoaded", async () => {
  //console.log("🚀 DOMContentLoaded 觸發");
  //console.log("→ 當前時間:", new Date().toISOString());
  //console.log("→ document.readyState:", document.readyState);
  
  try {
    // 🕒 顯示載入中遮罩
    document.getElementById("dashboardLoading").style.display = "flex";
    
    // 🔥 等待 Firebase 初始化完成
    //console.log("⏳ 開始等待 Firebase 初始化...");
    const startTime = Date.now();
    
    await waitForFirebase();
    
    const endTime = Date.now();
    //console.log(`✅ Firebase 初始化完成，耗時: ${endTime - startTime}ms`);
    //console.log("→ app:", !!app);
    //console.log("→ auth:", !!auth); 
    //console.log("→ db:", !!db);

    // 🆕 添加全域錯誤處理
    window.addEventListener('error', (e) => {
      if (e.message.includes('gapi') || e.filename?.includes('api.js')) {
        console.warn('⚠️ Google API 載入錯誤，但不影響主要功能:', e.message);
        // 不中斷主要流程
        return;
      }
      console.error('其他 JavaScript 錯誤:', e);
    });

    // 🆕 捕獲未處理的 Promise 拒絕
    window.addEventListener('unhandledrejection', (e) => {
      if (e.reason?.message?.includes('gapi')) {
        console.warn('⚠️ Google API Promise 錯誤，但不影響主要功能:', e.reason);
        e.preventDefault(); // 防止錯誤顯示在 console
        return;
      }
      console.error('未處理的 Promise 拒絕:', e.reason);
    });

    // 多語
    const lang = localStorage.getItem("lang") || "zh-Hant";
    // 🔽 當語系變更時，自動更新畫面上的所有文字（含 bio 與經歷卡片）
    window.addEventListener("langChanged", () => {
      renderStaticText();    // 更新所有 data-i18n 文字
      renderBio();          // 再重新把 bio 內容塞回去
      updateOnboardingText(); // （如果有這個小卡多語也一起跑）
      renderExperienceCardsWithReply();   // ✅ 改成新函數名
      const tNow = getSafeTranslation(localStorage.getItem("lang") || "zh-Hant");
      if (typeof inviteTextarea !== 'undefined' && inviteTextarea) {
        inviteTextarea.setAttribute("placeholder", tNow.invitePlaceholder || "");
      }  
    });  
    const t = getSafeTranslation(lang);
    const loadingText = document.getElementById("loadingDashboardText");
    if (loadingText) {
      loadingText.innerText = t.loadingDashboardMessage || "正在載入您的個人資料…";
    }

    // 📋 抓取所有要用到的 HTML 元件（輸入欄位與按鈕）
    const nameSection      = document.getElementById("nameSection");
    const nameInput = document.getElementById("nameInput");
    const englishNameInput = document.getElementById("englishNameInput");
    const basicInfo        = document.getElementById("basicInfo");
    const bioText          = document.getElementById("bioText");
    const editBioBtn       = document.getElementById("editBioBtn");
    const bioModal         = document.getElementById("bioModal");
    const bioForm          = document.getElementById("bioForm");
    const bioTextarea      = document.getElementById("bioTextarea");

    const list             = document.getElementById("experienceList");
    const addBtn           = document.getElementById("addBtn");
    const expModal         = document.getElementById("expModal");
    const expForm          = document.getElementById("expForm");
    const modalTitle       = document.getElementById("modalTitle");

    const companyInp       = document.getElementById("companyInput");
    const positionInp      = document.getElementById("positionInput");
    const startY           = document.getElementById("startYear");
    const startM           = document.getElementById("startMonth");
    const endY             = document.getElementById("endYear");
    const endM             = document.getElementById("endMonth");
    const stillChk         = document.getElementById("stillWorking");
    const endDateContainer = document.getElementById("endDateContainer");
    const descInp          = document.getElementById("descInput");

    const inviteModal       = document.getElementById("inviteModal");
    const inviteTextarea    = document.getElementById("inviteTextarea");
    const inviteCancelBtn   = document.getElementById("inviteCancelBtn");
    const inviteSaveBtn     = document.getElementById("inviteSaveBtn");

    // 📦 初始化暫存使用者資料與狀態變數
    window.profile = { userId:"", name:"", englishName:"", bio:"", workExperiences:[] };
    let profile = window.profile;
    let editIdx, currentJobIndex, currentCompany, currentDefaultMsg, currentInviteStyle;
 
    // 🔽 更新 Onboarding 區塊的多語文字內容
    function updateOnboardingText() {
      const langNow = localStorage.getItem("lang") || "zh-Hant";
      const onb = getSafeTranslation(langNow).onboarding || { title: "快速開始 ✨", steps: [] };
      const titleEl = document.getElementById("onboardingTitle");
      const stepsEl = document.getElementById("onboardingSteps");
      if (titleEl) titleEl.innerText = onb.title;
      if (stepsEl) stepsEl.innerHTML = onb.steps.map(s => `<li>${s}</li>`).join("");
    }

    // 🔽 工具函式：產生起始與結束年月的選單選項
    function populateYearMonth() {
      const now = new Date(), thisYear = now.getFullYear();
      let yrs = ['<option value="">--</option>'], mos = ['<option value="">--</option>'];
      for (let y = thisYear; y >= thisYear - 40; y--) {
        yrs.push(`<option>${y}</option>`);
      }
      for (let m = 1; m <= 12; m++) {
        const mm = String(m).padStart(2,"0");
        mos.push(`<option value="${mm}">${m}</option>`);
      }
      startY.innerHTML = endY.innerHTML = yrs.join("");
      startM.innerHTML = endM.innerHTML = mos.join("");
      stillChk.addEventListener("change", () => {
        const isWorking = stillChk.checked;
        // 隱藏／顯示「結束日期」整組欄位
        endDateContainer.classList.toggle("hidden", isWorking);
        // 停用／啟用下拉
        endY.disabled = endM.disabled = isWorking;
        // 勾選時清空選項
        if (isWorking) endY.value = endM.value = "";
      });
    }

    function renderStaticText() {
      // 每次都抓最新語系
      const langNow = localStorage.getItem("lang") || "zh-Hant";
      const currentT = getSafeTranslation(langNow);
      document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        if (currentT[key] != null) el.textContent = currentT[key];
      });
    }

    // ===== 新增：當 header.js dispatch langChanged 時，自動重跑小卡文字 =====
    window.addEventListener("langChanged", updateOnboardingText);
    // ===== 結束新增 =====

    // 🔽 儲存使用者個人資料（姓名、簡介、經歷等），寫入 Firestore
    async function saveProfile() {
      console.group("🔍 saveProfile()");
      //console.log("→ profile.userId =", profile.userId);
      //console.log("→ profile payload =", profile);
      if (!profile.userId) {
        console.warn("❌ saveProfile() 中断：profile.userId 为空");
        console.groupEnd();
        return;
      }
    
      try {
        const ref = db.collection("users").doc(profile.userId);
    
        // 🔒 補強：如果 name 是空的，就保留資料庫原值
        const existingSnap = await ref.get();
        if (existingSnap.exists) {
          const existingData = existingSnap.data();
          if (!profile.name && existingData.name) {
            profile.name = existingData.name;
          }
          if (!profile.englishName && existingData.englishName) {
            profile.englishName = existingData.englishName;
          }
        }
    
        await ref.set(profile, { merge: true });
        //console.log("✅ saveProfile() 写入成功");
      } catch (err) {
        console.error("❌ saveProfile() 写入失败：", err);
      }
    
      console.groupEnd();
    }

    // 🔽 渲染個人簡介區塊（換行符處理為 <br>）
    function renderBio() {
      // 取出存库的文字（可能包含 \n）
      const raw = profile.bio || "";
      // 把换行符 ("\n") 全部换成 <br>，再放进 innerHTML
      bioText.innerHTML = raw
        ? raw.replace(/\n/g, "<br>")
        : t.noBio || "（尚未填寫個人簡介）";
    }
    
    //console.log("合併後的 experiences:", profile.workExperiences);

    // 🔽 顯示 3 秒後自動消失的提示訊息（toast）
function showToast(msg) {
  const d = document.createElement("div");
  d.className = "toast";
  d.textContent = msg;
  document.body.appendChild(d);
  setTimeout(()=>d.remove(),3000);
}

// 🆕 【在這裡添加所有回推薦函數】
// ==================== 回推薦功能函數 ====================
// 🆕 在 loadUserRecommendations 中添加更完整的統計同步
async function loadUserRecommendations(userId) {
  //console.log("📥 載入用戶推薦數據...");
  
  try {
    const recommendations = [];
    
    // 1. 載入收到的推薦
    const receivedRef = db.collection("users").doc(userId).collection("recommendations");
    const receivedSnapshot = await receivedRef.get();
    
    receivedSnapshot.forEach(doc => {
      recommendations.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // ✅ 2. 載入推薦他人的記錄（從工作經歷中）
    for (const job of profile.workExperiences) {
      if (job.recommendations && Array.isArray(job.recommendations)) {
        job.recommendations.forEach(rec => {
          recommendations.push({
            ...rec,
            type: 'outgoing',  // 標記為推薦他人
            jobId: job.id
          });
        });
      }
    }
    
    //console.log(`✅ 載入推薦記錄總計: ${recommendations.length} 筆`);
    //console.log("📊 推薦類型分布:", {
      received: recommendations.filter(r => r.type === 'received').length,
      outgoing: recommendations.filter(r => r.type === 'outgoing').length
    });
    
    //console.log(`✅ 載入 ${recommendations.length} 筆推薦記錄`);
    
    // 2. 計算統計
    const stats = calculateRecommendationStats(recommendations);
    
    // 3. 🔧 從現有的 recommendationStats 讀取 totalGiven
    stats.totalGiven = profile.recommendationStats?.totalGiven || 0;
    
    profile.recommendations = recommendations;
    profile.recommendationStats = stats;

    // 4. 🔧 將統計數據映射到工作經歷，確保 givenCount 正確
    profile.workExperiences.forEach(job => {
  const jobStats = stats.byJob[job.id] || {
    received: 0,
    given: 0,
    canReply: 0,
    allReceived: 0,    // 🆕 新增
    verified: 0,       // 🆕 新增
    pending: 0,        // 🆕 新增
    failed: 0,         // 🆕 新增
    highlights: {},
    relations: {}
  };

  // 🔥 關鍵修復：保存原有的 givenCount
  const originalGivenCount = job.givenCount;

  //console.log(`📊 工作經歷 ${job.company} 映射:`, {
    id: job.id,
    驗證通過收到: jobStats.received,
    總收到: jobStats.allReceived,
    可回覆: jobStats.canReply,
    原始推薦數: originalGivenCount,
    計算推薦數: jobStats.given
  });

  // 設定統計數據
  job.recCount = jobStats.received;           // 只有驗證通過的
  job.canReplyCount = jobStats.canReply;      // 所有可回覆的
  job.allReceived = jobStats.allReceived;     // 🆕 所有收到的
  job.verified = jobStats.verified;           // 🆕 驗證通過數
  job.pending = jobStats.pending;             // 🆕 驗證中數
  job.failed = jobStats.failed;               // 🆕 驗證失敗數
  
  // 🎯 核心修復：絕對保留原始 givenCount
if (typeof originalGivenCount !== 'undefined' && originalGivenCount !== null) {
  // 完全保持原值不變
  //console.log(`✅ 保留原始 givenCount: ${originalGivenCount}`);
} else {
  // 只有當原本沒有值時才設定為 0
  job.givenCount = 0;
  //console.log(`🆕 設定初始 givenCount: 0`);
}

  // 亮點和關係統計
  if (typeof jobStats.highlights === 'object' && jobStats.highlights !== null) {
    job.highlightCount = jobStats.highlights;
  } else {
    job.highlightCount = {};
  }
  
  if (typeof jobStats.relations === 'object' && jobStats.relations !== null) {
    job.relationCount = jobStats.relations;
  } else {
    job.relationCount = {};
  }
});


    //console.log("✅ 推薦統計映射完成，givenCount 已正確保留");
    // 🚀 新增：在數據更新完成後立即調用渲染函數
//console.log("🔄 觸發 UI 重新渲染...");

try {
  // 確保渲染函數存在且可調用
  if (typeof renderBasicWithReplyStats === 'function') {
    renderBasicWithReplyStats();
    //console.log("✅ renderBasicWithReplyStats 已調用");
  } else {
    console.warn("⚠️ renderBasicWithReplyStats 函數不存在");
  }
  
  if (typeof renderExperienceCardsWithReply === 'function') {
    renderExperienceCardsWithReply();
    //console.log("✅ renderExperienceCardsWithReply 已調用");
  } else {
    console.warn("⚠️ renderExperienceCardsWithReply 函數不存在");
  }
  
  //console.log("✅ UI 重新渲染完成");
  
  debugRecommendationData();
  
} catch (renderError) {
  console.error("❌ UI 渲染失敗:", renderError);
  // 不中斷主流程
}
    return recommendations;
    
  } catch (error) {
    console.error("❌ 載入推薦數據失敗:", error);
    return [];
  }
}
/**
 * 計算推薦統計的核心函式
 * @param {Array} recommendations - 包含所有推薦記錄的陣列
 * @returns {Object} - 結構化的統計物件
 */
function calculateRecommendationStats(recommendations) {
  // 1. 初始化統計物件結構
  const stats = {
    totalReceived: 0,     // 總收到（僅計驗證通過）
    totalGiven: 0,        // 總送出（僅計驗證通過）
    totalCanReply: 0,     // 總可回覆數（不論驗證狀態）
    byJob: {}             // 按工作經歷分類的詳細統計
  };

  if (!recommendations || recommendations.length === 0) {
    return stats;
  }

  // 2.【效能優化】預先建立一個 Set，存放所有「我已推薦過」的對象 ID 或 Email
  const recommendedTargets = new Set();
  recommendations.forEach(rec => {
    if (rec.type === 'outgoing' || rec.type === 'reply') {
      if (rec.targetUserId) recommendedTargets.add(rec.targetUserId);
      if (rec.recommendeeEmail) recommendedTargets.add(rec.recommendeeEmail.toLowerCase());
      if (rec.targetEmail) recommendedTargets.add(rec.targetEmail.toLowerCase());
    }
  });

  // 3. 遍歷所有推薦記錄，進行計算
  recommendations.forEach(rec => {
    const jobId = rec.matchedJobId || rec.jobId;
    if (!jobId) return; // 忽略沒有 jobId 的記錄

    // 初始化該工作的統計物件
    if (!stats.byJob[jobId]) {
      stats.byJob[jobId] = {
        received: 0,          // 收到（僅計驗證通過）
        given: 0,             // 送出（僅計驗證通過）
        canReply: 0,          // 可回覆（不論驗證狀態）
        allReceived: 0,       // 所有收到的推薦數（含未驗證）
        verified: 0,          // 細分：驗證通過數
        pending: 0,           // 細分：驗證中數
        failed: 0,            // 細分：驗證失敗數
        highlights: {},
        relations: {}
      };
    }
    const jobStats = stats.byJob[jobId];

    // 4. 處理【收到的推薦】
    if (rec.type === 'received') {
      jobStats.allReceived++; // 無論狀態如何，總收到數+1

      // 4a.【邏輯一】判斷是否「驗證通過」
      const isVerified = rec.status === 'verified' && (rec.confidence || 0) > 0 && !rec.excludeFromStats;

      if (isVerified) {
        // 計入「驗證通過」的統計
        stats.totalReceived++;
        jobStats.received++;
        jobStats.verified++;

        // 僅計算驗證通過的亮點與關係
        (rec.highlights || []).forEach(h => {
          jobStats.highlights[h] = (jobStats.highlights[h] || 0) + 1;
        });
        const relation = rec.relation || "unknown";
        jobStats.relations[relation] = (jobStats.relations[relation] || 0) + 1;
      } else {
        // 歸類到未驗證的細項
        if (rec.status === 'verification_failed') {
          jobStats.failed++;
        } else {
          jobStats.pending++;
        }
      }

      // 4b.【邏輯二】判斷是否「可回覆」
      // 條件：尚未回覆過，且我方未曾推薦過此人
      if (!rec.hasReplied) {
        const alreadyRecommended = recommendedTargets.has(rec.recommenderId) || recommendedTargets.has((rec.email || '').toLowerCase());
        
        if (!alreadyRecommended) {
          stats.totalCanReply++;
          jobStats.canReply++;
        }
      }
    }

    // 5. 處理【送出的推薦】(包含推薦他人和回覆推薦)
    if (rec.type === 'outgoing' || rec.type === 'reply') {
      //【邏輯一】判斷是否「驗證通過」
      const isValidGiven = ['verified', 'delivered_and_verified', 'confirmed'].includes(rec.status);
      
      if (isValidGiven) {
        stats.totalGiven++;
        jobStats.given++;
      }
    }
  });

  return stats;
}

// 3. 更新後的 renderBasic 函數
function renderBasicWithReplyStats() {
  // 🔒 安全檢查：確保 profile 和 workExperiences 已載入
  if (!profile || !profile.workExperiences) {
    //console.log("⏳ Profile 尚未載入完成，跳過渲染");
    return;
  }
  // 計算總的可回推薦人數
  const totalCanReply = profile.recommendationStats?.canReply || 0;
  const totalReceived = profile.recommendationStats?.totalReceived || 0;
  const totalGiven = profile.recommendationStats?.totalGiven || 0;

  let recommendationsNote = "";
  if (totalReceived > 0 || totalGiven > 0 || totalCanReply > 0) {
    const langNow = localStorage.getItem("lang") || "zh-Hant";
    const tNow = getSafeTranslation(langNow);
    
    recommendationsNote = `
      <p class="rec-summary">
        ${tNow.received || '收到'} <strong>${totalReceived}</strong> ${tNow.recommendations || '則推薦'} | ${tNow.totalRecommended || '共推薦'} <strong>${totalGiven}</strong> ${tNow.people || '人'}
      </p>
    `;
  }

  basicInfo.innerHTML = `
    <h1>${profile.name || ""}</h1>
    ${profile.englishName ? `<p>${profile.englishName}</p>` : ""}
    <p>${profile.workExperiences.length} ${t.workExperiences || "工作經歷"}</p>
    ${recommendationsNote}
  `;
}

// 4. 更新後的 renderExperienceCards 函數
function renderExperienceCardsWithReply() {
  const langNow = localStorage.getItem("lang") || "zh-Hant";
  const tNow = getSafeTranslation(langNow);

  list.innerHTML = "";
  const frag = document.createDocumentFragment();
  const grouped = {};
  
  profile.workExperiences.sort((a,b)=>b.startDate.localeCompare(a.startDate))
    .forEach(job=> (grouped[job.company] = grouped[job.company]||[]).push(job));

  Object.entries(grouped).forEach(([comp,jobs]) => {
    const wrap = document.createElement("div");
    wrap.className = "company-card";
    wrap.innerHTML = `<div class="company-title">${comp}</div>`;
    
    jobs.forEach(job => {
      const idx = profile.workExperiences.indexOf(job);
      
      // 🔧 修改統計數據取用邏輯
      const receivedCount = job.recCount || 0;         // 只有驗證通過的
      const givenCount = job.givenCount || 0;          // 只有驗證通過的
      const canReplyCount = job.canReplyCount || 0;    // 🔧 所有可回覆的（含未驗證）
      const allReceivedCount = job.allReceived || 0;   // 🆕 所有收到的
      const verifiedCount = job.verified || 0;         // 🆕 驗證通過數
      const pendingCount = job.pending || 0;           // 🆕 驗證中數
      const failedCount = job.failed || 0;             // 🆕 驗證失敗數
      
      const hasRec = receivedCount > 0;  // 基於驗證通過的推薦
      const hasAnyRec = allReceivedCount > 0;  // 🆕 是否有任何推薦（含未驗證）

      const roleCard = document.createElement("div");
      roleCard.className = "role-card";

      roleCard.innerHTML = `
        <div class="role-header">
          <div class="role-info">
            <strong>${job.position}</strong>
            <div class="work-period">${job.startDate} ～ ${job.endDate || tNow.currentlyWorking || "目前在職"}</div>
          </div>
          <div class="manage-actions">
            <button class="manage-btn edit-btn" data-idx="${idx}" title="${tNow.edit || '編輯'}">📝</button>
            <button class="manage-btn del-btn" data-idx="${idx}" title="${tNow.delete || '刪除'}">🗑️</button>
          </div>
        </div>
        ${job.description ? `<div class="work-description">${job.description.replace(/\n/g, "<br>")}</div>` : ""}
      `;

      // 🔧 修改推薦統計區塊
      const summaryDiv = document.createElement('div');
      summaryDiv.className = 'rec-summary-block';
      
      if (hasRec || hasAnyRec) {
        const unit = langNow === "zh-Hant" ? "位" : (count => count === 1 ? "person" : "people");

        // 🎯 主統計：只顯示驗證通過的推薦
        let mainStatsText = "";
        if (hasRec) {
          // 有驗證通過的推薦
          mainStatsText = `
            <span class="stat-item">
              ${tNow.received || '收到'}
              <a href="/pages/recommend-summary.html?userId=${profile.userId}&jobId=${job.id}" 
                onclick="return smartOpenRecommendation(this.href, '推薦總覽')">
                <strong>${receivedCount}</strong> ${tNow.recommendations || '則推薦'}
              </a>
            </span>
          `;
        } else {
          // 沒有驗證通過的推薦
          mainStatsText = `
            <span class="stat-item">
              <span class="emoji">📬</span> ${tNow.recommendSummary?.noRecommendation || '尚未收到推薦'}
            </span>
          `;
        }
        
        // 🆕 回覆統計：顯示所有可回覆數（含未驗證）
        const replyStatsText = canReplyCount > 0 ? `
          <span class="stat-separator">|</span>
          <span class="stat-item">
            ${tNow.canReply || '可回覆'} <strong>${canReplyCount}</strong> ${tNow.people || '人'}
          </span>
        ` : '';
        
        // 推薦他人統計
        const givenStatsText = `
          <span class="stat-separator">|</span>
          <span class="stat-item">
            ${tNow.totalRecommended || '共推薦'} <strong>${givenCount}</strong> ${tNow.people || '人'}
          </span>
        `;

        // 🆕 如果有未驗證推薦，顯示提示
        let pendingHint = "";
        if (pendingCount > 0 || failedCount > 0) {
          const pendingText = pendingCount > 0 ? `${pendingCount} 則驗證中` : '';
          const failedText = failedCount > 0 ? `${failedCount} 則驗證失敗` : '';
          const hintParts = [pendingText, failedText].filter(Boolean);
          
          pendingHint = `
            <div class="pending-hint">
              <small>💡 另有 ${hintParts.join('、')}，可在回覆時查看詳情</small>
            </div>
          `;
        }
        
        // 亮點和關係統計（只用驗證通過的數據）
        const highlightText = hasRec ? 
          Object.entries(job.highlightCount || {})
            .map(([key, count]) => {
              const label = tNow.recommendSummary?.[`highlight_${key}`] || 
                          tNow[`highlight_${key}`] || 
                          tNow.highlights?.[key] ||
                          key;
              return `${label} ${count} ${typeof unit === "function" ? unit(count) : unit}`;
            })
            .join('、') || `${tNow.recommendSummary?.noHighlights || '暫無亮點統計'}` :
          `${tNow.recommendSummary?.noHighlights || '暫無亮點統計'}`;

        const relationText = hasRec ?
          Object.entries(job.relationCount || {})
            .map(([key, count]) => {
              const match = tNow.recommendSummary?.relationFilterOptions?.find(r => r.value === key);
              const label = match?.label || 
                          tNow.relations?.[key] ||
                          tNow[`relation_${key}`] ||
                          key;
              return `${label} ${count} ${typeof unit === "function" ? unit(count) : unit}`;
            })
            .join('、') || `${tNow.recommendSummary?.noRelations || '暫無關係統計'}` :
          `${tNow.recommendSummary?.noRelations || '暫無關係統計'}`;

        summaryDiv.innerHTML = `
          <hr style="border: none; border-top: 1px solid #ddd; margin: 16px 0;" />
          <div class="summary-content">
            <div class="summary-text">
              <div class="recommendation-stats">${mainStatsText}${replyStatsText}${givenStatsText}</div>
              ${pendingHint}
              ${hasRec ? `
                <p>${tNow.recommendSummary?.highlights || '亮點'}：${highlightText}</p>
                <p>${tNow.recommendSummary?.relations || '關係'}：${relationText}</p>
              ` : `
                <p><span class="emoji">🧡</span> ${(tNow.noRecommendationsHint || '邀請同事為你推薦吧！').split('\n')[1] || '邀請同事為你推薦吧！'}</p>
              `}
            </div>
            <div class="recommendation-actions">
              <button class="action-btn primary recommend-others-btn" data-idx="${idx}" title="${tNow.recommendOthers || '推薦好夥伴'} (+10 EXP)">
                🤝 ${tNow.recommendOthers || '推薦好夥伴'}
              </button>
              ${canReplyCount > 0 ? `
                <button class="action-btn secondary reply-btn" data-idx="${idx}" title="${tNow.replyRecommend || '回覆'} (+3 EXP)">
                  💬 ${tNow.replyRecommend || '回覆'} (${canReplyCount})
                </button>
              ` : ''}
              <button class="action-btn secondary link-btn" data-idx="${idx}" title="${tNow.inviteRecommender || '請夥伴推薦'} (成功收到推薦 +5 EXP)">
                📨 ${tNow.inviteRecommender || '請夥伴推薦'}
              </button>
            </div>
          </div>
        `;
      } else {
        // 完全沒有推薦時的顯示
        summaryDiv.innerHTML = `
          <hr style="border: none; border-top: 1px solid #ddd; margin: 16px 0;" />
          <div class="summary-content">
            <div class="summary-text">
              <div class="recommendation-stats">
                <span class="stat-item">
                  <span class="emoji">📬</span> ${tNow.recommendSummary?.noRecommendation || '尚未收到推薦'}
                </span>
                <span class="stat-separator">|</span>
                <span class="stat-item">
                  ${tNow.totalRecommended || '共推薦'} <strong>${givenCount}</strong> ${tNow.people || '人'}
                </span>
              </div>
              <p><span class="emoji">🧡</span> ${(tNow.noRecommendationsHint || '邀請同事為你推薦吧！').split('\n')[1] || '邀請同事為你推薦吧！'}</p>
            </div>
            <div class="recommendation-actions">
              <button class="action-btn primary recommend-others-btn" data-idx="${idx}" title="${tNow.recommendOthers || '推薦好夥伴'}">
                🤝 ${tNow.recommendOthers || '推薦好夥伴'}
              </button>
              <button class="action-btn secondary link-btn" data-idx="${idx}" title="${tNow.inviteRecommender || '請夥伴推薦'}">
                📨 ${tNow.inviteRecommender || '請夥伴推薦'}
              </button>
            </div>
          </div>
        `;
      }
      
      roleCard.appendChild(summaryDiv);
      wrap.appendChild(roleCard);
    });

    frag.appendChild(wrap);
  });
  list.appendChild(frag);
}


// 5. 回覆處理函數
async function handleReplyRecommendation(jobIndex) {
  const langNow = localStorage.getItem("lang") || "zh-Hant";
  const tNow = getSafeTranslation(langNow);
  const job = profile.workExperiences[jobIndex];
  
  try {
    //console.log("💬 載入回覆選項（新邏輯：包含所有推薦）...");
    //console.log("🔍 工作經歷:", job.company, job.position);
    
    // 🔧 關鍵修改：顯示所有收到的推薦，不管驗證狀態
    const availableRecommendations = profile.recommendations.filter(rec => {
      const matchesJob = (rec.matchedJobId || rec.jobId) === job.id;
      const isReceived = rec.type === 'received';
      const notReplied = !rec.hasReplied;
      
      //console.log(`🔍 推薦記錄 ${rec.name}:`, {
        jobId: rec.jobId,
        targetJobId: job.id,
        matchesJob: matchesJob,
        type: rec.type,
        isReceived: isReceived,
        hasReplied: rec.hasReplied,
        notReplied: notReplied,
        status: rec.status, // 🆕 記錄驗證狀態
        confidence: rec.confidence,
        shouldInclude: matchesJob && isReceived && notReplied
      });
      
      // 🔧 修改：包含所有未回覆的推薦（不管驗證狀態）
      return matchesJob && isReceived && notReplied;
    });
    
    //console.log("📋 新邏輯過濾結果:", {
      總推薦數: profile.recommendations.length,
      該工作推薦數: profile.recommendations.filter(rec => rec.jobId === job.id).length,
      可回覆推薦數: availableRecommendations.length,
      詳細列表: availableRecommendations.map(rec => ({
        name: rec.name,
        status: rec.status,
        confidence: rec.confidence,
        hasReplied: rec.hasReplied,
        isRegistered: rec.recommenderId !== null
      }))
    });
    
    if (availableRecommendations.length === 0) {
      showToast(tNow.noReplyAvailable);
      return;
    }
    
    // 保存當前上下文
    window.currentReplyContext = {
      jobIndex: jobIndex,
      job: job,
      availableRecommendations: availableRecommendations
    };
    
    // 顯示回覆選項 Modal
    document.getElementById("replyOptionsModal").showModal();
    
  } catch (error) {
    console.error("❌ 載入回覆選項失敗:", error);
    showToast(tNow.loadReplyOptionsError || "載入回覆選項失敗，請稍後再試");
  }
}

// 6. 開始回推薦流程
async function startReplyProcess(originalRecId, recommenderId, recommenderName, recommenderEmail, isRegistered) {
  const langNow = localStorage.getItem("lang") || "zh-Hant";
  
  // 🔍 詳細的參數檢查
  //console.log("🚀 startReplyProcess 參數檢查:", {
    originalRecId: originalRecId,
    recommenderId: recommenderId,
    recommenderName: recommenderName,
    recommenderEmail: recommenderEmail,
    isRegistered: isRegistered,
    recommenderIdType: typeof recommenderId
  });
  
  // 🎯 關鍵驗證：對於已註冊用戶，recommenderId 不能為空
  if (isRegistered && (!recommenderId || recommenderId === '' || recommenderId === 'null')) {
    console.error("❌ 已註冊用戶但 recommenderId 無效:", recommenderId);
    showToast(t.recommenderDataError);
    return;
  }
  
  try {
    const originalRec = profile.recommendations.find(rec => rec.id === originalRecId);
    if (!originalRec) {
      showToast("找不到原始推薦記錄");
      return;
    }
    
    //console.log("🔍 回覆推薦 Debug:", {
      currentReplyContext: window.currentReplyContext,
      job: window.currentReplyContext?.job,
      company: window.currentReplyContext?.job?.company,
      position: window.currentReplyContext?.job?.position
    });
    // 創建統一的回推薦邀請記錄
    const inviteData = {
      userId: profile.userId,
      jobId: originalRec.jobId,
      type: "reply",
      mode: "reply",
      originalRecommendationId: originalRecId,
      targetName: recommenderName,
      targetEmail: recommenderEmail,
      recommenderName: profile.name,
      recommenderUserId: profile.userId,
      company: window.currentReplyContext?.job?.company || '',
      position: window.currentReplyContext?.job?.position || '',
      lang: langNow,
      createdAt: new Date(),
      status: "pending"
    };
    
    // 🎯 關鍵差異：已註冊用戶添加 targetUserId
    if (isRegistered && recommenderId) {
      inviteData.targetUserId = recommenderId;
      //console.log("✅ 已註冊用戶，添加 targetUserId:", recommenderId);
    } else {
      //console.log("✅ 未註冊用戶，不添加 targetUserId");
    }
    
    const replyInviteRef = await db.collection("invites").add(inviteData);
    const inviteId = replyInviteRef.id;

    // 🎯 生成統一的表單 URL
    let targetUrl = `/pages/recommend-form.html` +
      `?inviteId=${inviteId}` +
      `&mode=reply` +
      `&originalRecId=${originalRecId}` +
      `&prefillName=${encodeURIComponent(recommenderName)}` +
      `&prefillEmail=${encodeURIComponent(recommenderEmail)}` +
      `&jobId=${encodeURIComponent(window.currentReplyContext?.job?.id || '')}` +
      `&lang=${langNow}`;
    
    // 🎯 根據註冊狀態添加不同參數
    if (isRegistered && recommenderId) {
      targetUrl += `&targetUserId=${recommenderId}`;
      //console.log("✅ 已註冊用戶 URL，包含 targetUserId");
    } else {
      targetUrl += `&unregistered=true`;
      //console.log("✅ 未註冊用戶 URL，包含 unregistered=true");
    }
    
    //console.log("🔗 生成的回推薦表單 URL:", targetUrl);
    //console.log("📋 關鍵 URL 參數:", {
      inviteId: inviteId,
      mode: "reply",
      targetUserId: isRegistered ? recommenderId : "未設置",
      unregistered: !isRegistered ? "true" : "未設置",
      prefillName: recommenderName,
      prefillEmail: recommenderEmail
    });
    
    // 關閉選擇 Modal
    document.getElementById("replyModal").close();
    
    // 🎯 成功提示並開啟表單
    const tNow = getSafeTranslation(langNow);
    const message = isRegistered ? tNow.openingReplyForm : tNow.openingUnregisteredReplyForm;
    
    showToast(message);
    smartOpenRecommendation(targetUrl, '回推薦表單');
    
  } catch (error) {
    console.error("❌ 建立回推薦邀請失敗:", error);
    const tNow = getSafeTranslation(langNow);
    showToast(t.createInviteError);
  }
}


// 7. 綁定回推薦Modal事件
function bindReplyModalEvents() {
  const replyCloseBtn = document.getElementById("replyCloseBtn");
  if (replyCloseBtn) {
    replyCloseBtn.onclick = () => {
      document.getElementById("replyModal").close();
    };
  }
  
  const replyList = document.getElementById("replyList");
  if (replyList) {
    replyList.addEventListener("click", (e) => {
      if (e.target.closest(".reply-to-person-btn")) {
        const btn = e.target.closest(".reply-to-person-btn");
        const recId = btn.dataset.recId;
        const recommenderId = btn.dataset.recommenderId;
        const recommenderName = btn.dataset.recommenderName;
        const recommenderEmail = btn.dataset.recommenderEmail;
        const isRegistered = btn.dataset.isRegistered === 'true';
        
        //console.log("🚀 開始回推薦流程:", {
          recId,
          recommenderId,
          recommenderName,
          recommenderEmail,
          isRegistered
        });
        
        // 🎯 統一處理：都是開啟推薦表單，但 URL 參數不同
        startReplyProcess(recId, recommenderId, recommenderName, recommenderEmail, isRegistered);
      }
    });
  }
}

// 8. 新增回覆選項處理函數
function initializeReplyOptionsModal() {
  // 關閉 Modal
  const replyOptionsCloseBtn = document.getElementById("replyOptionsCloseBtn");
  if (replyOptionsCloseBtn) {
    replyOptionsCloseBtn.onclick = () => {
      document.getElementById("replyOptionsModal").close();
    };
  }
  
  // 處理選項點擊
  const replyOptionsModal = document.getElementById("replyOptionsModal");
  if (replyOptionsModal) {
    replyOptionsModal.addEventListener("click", (e) => {
      
      // 推薦回覆選項
      if (e.target.closest('[data-option="recommend"]')) {
        //console.log("📝 用戶選擇推薦回覆");
        
        // 分析事件
        trackEvent('reply_option_selected', { type: 'recommend' });
        
        // 關閉選項 Modal
        document.getElementById("replyOptionsModal").close();
        
        // 開啟原有的推薦列表 Modal
        showTraditionalReplyModal();
      }
      
      // 咖啡感謝選項
      else if (e.target.closest('[data-option="coffee"]')) {
        //console.log("☕ 用戶點擊咖啡感謝選項");
        
        // 分析事件
        trackEvent('coffee_option_clicked', { 
          jobId: window.currentReplyContext?.job?.id,
          availableCount: window.currentReplyContext?.availableRecommendations?.length
        });
        
        // 關閉選項 Modal
        document.getElementById("replyOptionsModal").close();
        
        // 開啟等候清單 Modal
        document.getElementById("waitlistModal").showModal();
      }
    });
  }
}

// 1. 簡化推薦人選單邏輯
function showTraditionalReplyModal() {
  const context = window.currentReplyContext;
  if (!context) return;
  
  const langNow = localStorage.getItem("lang") || "zh-Hant";
  const tNow = getSafeTranslation(langNow);
  
  const replyList = document.getElementById("replyList");
  replyList.innerHTML = "";
  
  const canReplyRecommendations = context.availableRecommendations.filter(rec => {
    // 🎯 正確邏輯：只檢查「當前工作經歷」是否已推薦過「同一個人」
    
    const currentJobId = context.job.id; // 當前工作經歷ID
    
    //console.log(`🔍 檢查推薦人 ${rec.name} 在工作「${context.job.company}」的推薦狀態`);
    
    // 安全檢查：確保 profile.recommendations 存在
    if (!profile.recommendations || !Array.isArray(profile.recommendations)) {
      console.warn('⚠️ profile.recommendations 不存在或不是陣列');
      return true; // 預設允許回覆
    }
    
    // 1. 檢查推薦記錄中的回覆推薦：同工作 + 同人
    const alreadyRepliedInCurrentJob = profile.recommendations.some(myRec => 
      myRec.type === 'reply' &&
      (myRec.jobId === currentJobId || myRec.matchedJobId === currentJobId) &&
      (
        (rec.recommenderId && myRec.targetUserId === rec.recommenderId) ||
        (rec.email && myRec.targetEmail === rec.email.toLowerCase())
      )
    );
    
    // 2. 檢查推薦記錄中的推薦他人：同工作 + 同人  
    const alreadyRecommendedInCurrentJob = profile.recommendations.some(myRec => 
      myRec.type === 'outgoing' &&
      (myRec.jobId === currentJobId || myRec.matchedJobId === currentJobId) &&
      (
        (rec.recommenderId && myRec.targetUserId === rec.recommenderId) ||
        (rec.email && myRec.recommendeeEmail === rec.email.toLowerCase())
      )
    );
    
    // 3. 檢查當前工作經歷的推薦記錄：同工作 + 同人
    const alreadyInCurrentJobRecords = context.job.recommendations?.some(workRec => 
      (rec.recommenderId && workRec.targetUserId === rec.recommenderId) ||
      (rec.email && workRec.recommendeeEmail === rec.email.toLowerCase())
    ) || false;
    
    // 綜合判斷：在當前工作是否已處理過此人
    const alreadyProcessedInCurrentJob = alreadyRepliedInCurrentJob || 
                                        alreadyRecommendedInCurrentJob || 
                                        alreadyInCurrentJobRecords;
    
    if (alreadyProcessedInCurrentJob) {
      //console.log(`⏭️ 在工作「${context.job.company}」已推薦過: ${rec.name}`);
    } else {
      //console.log(`✅ 在工作「${context.job.company}」可推薦: ${rec.name}`);
    }
    
    return !alreadyProcessedInCurrentJob;
  });
  
  canReplyRecommendations.forEach(rec => {
    const listItem = document.createElement("div");
    listItem.className = "reply-item";
    
    const recommenderId = rec.recommenderId;
    const isRegistered = recommenderId !== null && recommenderId !== undefined && recommenderId !== '';
    
    // 🔧 簡化：只顯示已驗證的徽章
    const verificationBadge = getVerificationBadge(rec);
    const statusExplanation = ""; // 暫時移除狀態說明
    
    // 關係標籤
    const relationLabel = tNow.recommendSummary?.relationFilterOptions?.find(
      r => r.value === rec.relation
    )?.label || rec.relation || "同事";
    
    // 🆕 註冊狀態徽章（保留，因為這影響回覆流程）
    const registrationBadge = isRegistered 
      ? '<span class="registered-badge">已註冊</span>'
      : '<span class="unregistered-badge">未註冊</span>';
    
    const buttonHtml = `
      <button class="action-btn primary reply-to-person-btn" 
              data-rec-id="${rec.id}" 
              data-recommender-id="${recommenderId || ''}"
              data-recommender-name="${rec.name}"
              data-recommender-email="${rec.email || ''}"
              data-is-registered="${isRegistered}">
        📝 ${tNow.startReply || '用推薦回覆'}
      </button>
    `;
    
    listItem.innerHTML = `
      <div class="reply-item-info">
        <div class="recommender-name">
          ${rec.name}
          ${verificationBadge}
          ${registrationBadge}
        </div>
        <div class="recommender-details">
          <span class="relation-tag">${relationLabel}</span>
          <span class="email-tag">${rec.email}</span>
        </div>
        <div class="recommendation-preview">
          "${(rec.content || '').substring(0, 100)}${rec.content && rec.content.length > 100 ? '...' : ''}"
        </div>
        ${statusExplanation ? `<div class="status-explanation">${statusExplanation}</div>` : ''}
      </div>
      <div class="reply-item-actions">
        ${buttonHtml}
      </div>
    `;
    
    replyList.appendChild(listItem);
  });
  
  if (canReplyRecommendations.length === 0) {
    replyList.innerHTML = `
      <div class="no-reply-available">
        <p>${tNow.noReplyAvailable || '目前沒有可回覆的推薦'}</p>
        <p>${tNow.allReplied || '你已經回覆過所有推薦人了 ✅'}</p>
      </div>
    `;
  }
  
  document.getElementById("replyModal").showModal();
}


// 10. 等候清單處理
function initializeWaitlistModal() {
  // 關閉按鈕
  const waitlistCloseBtn = document.getElementById("waitlistCloseBtn");
  if (waitlistCloseBtn) {
    waitlistCloseBtn.onclick = () => {
      document.getElementById("waitlistModal").close();
    };
  }
  
  // 表單提交
  const waitlistForm = document.getElementById("waitlistForm");
  if (waitlistForm) {
    waitlistForm.onsubmit = async (e) => {
      e.preventDefault();
      
      const email = document.getElementById("waitlistEmail").value;
      const preference = document.getElementById("coffeePreference").value;
      
      try {
        // 保存到 Firestore
        await db.collection("coffeeWaitlist").add({
          email: email,
          preference: preference,
          createdAt: new Date(),
          source: "reply_modal",
          userId: profile.userId,
          jobContext: window.currentReplyContext?.job?.company
        });
        
        // 分析事件
        trackEvent('waitlist_signup', { 
          preference: preference,
          source: 'reply_modal'
        });
        
        // 成功提示
        showToast("✅ 成功加入等候清單！我們會在功能上線時通知你");
        
        // 關閉 Modal
        document.getElementById("waitlistModal").close();
        
        // 重置表單
        waitlistForm.reset();
        
      } catch (error) {
        console.error("❌ 加入等候清單失敗:", error);
        showToast("❌ 加入等候清單失敗，請稍後再試");
      }
    };
  }
}

// 11. 分析事件追蹤
function trackEvent(eventName, properties = {}) {
  //console.log("📊 追蹤事件:", eventName, properties);
  
  // 簡單的本地存儲追蹤
  const events = JSON.parse(localStorage.getItem("replyAnalytics") || "[]");
  events.push({
    event: eventName,
    properties: properties,
    timestamp: new Date().toISOString(),
    userId: profile.userId
  });
  
  // 只保留最近 100 個事件
  if (events.length > 100) {
    events.splice(0, events.length - 100);
  }
  
  localStorage.setItem("replyAnalytics", JSON.stringify(events));
}

// 🆕 12. 添加調試函數，幫助檢查數據狀態
function debugRecommendationData() {
  //console.log("🔍 === 推薦數據調試 ===");
  //console.log("Profile:", profile);
  //console.log("推薦記錄總數:", profile.recommendations?.length || 0);
  //console.log("工作經歷數:", profile.workExperiences?.length || 0);
  
  if (profile.recommendations) {
    //console.log("📊 推薦記錄詳情:");
    profile.recommendations.forEach((rec, index) => {
      //console.log(`${index + 1}. ${rec.name}:`, {
        id: rec.id,
        jobId: rec.jobId,
        type: rec.type,
        hasReplied: rec.hasReplied,
        recommenderId: rec.recommenderId,
        isRegistered: rec.recommenderId !== null
      });
    });
  }
  
  if (profile.workExperiences) {
    //console.log("📊 工作經歷詳情:");
    profile.workExperiences.forEach((job, index) => {
      const jobRecs = profile.recommendations?.filter(rec => rec.jobId === job.id) || [];
      const canReplyRecs = jobRecs.filter(rec => rec.type === 'received' && !rec.hasReplied);
      
      //console.log(`${index + 1}. ${job.company} - ${job.position}:`, {
        id: job.id,
        推薦總數: jobRecs.length,
        可回覆數: canReplyRecs.length,
        canReplyCount: job.canReplyCount
      });
    });
  }
}

// ==================== 回推薦功能函數結束 ====================

    // 🆕 新增：處理「我要推薦他人」功能
    async function handleRecommendOthers(jobIndex) {
      const langNow = localStorage.getItem("lang") || "zh-Hant";
      const job = profile.workExperiences[jobIndex];
      
      try {
        // 🔍 先檢查使用者是否已登入
        if (!auth.currentUser) {
          showToast(commonT.loginRequired);
          return;
        }

        //console.log("🔍 嘗試建立推薦他人邀請...");
        //console.log("→ 使用者 ID:", profile.userId);
        //console.log("→ 工作 ID:", job.id);
        
        // 📥 建立 outgoing 類型的邀請記錄
        const inviteRef = await db.collection("invites").add({
          userId: profile.userId,
          jobId: job.id,
          type: "outgoing", // 🆕 標記為主動推薦他人
          company: job.company,
          position: job.position,
          recommenderName: profile.name,
          recommenderUserId: profile.userId,
          recommenderJobId: job.id, // 🆕 記錄推薦人的工作經歷ID
          lang: langNow,
          createdAt: new Date(),
          status: "pending" // 🆕 添加狀態欄位
        });
        
        const inviteId = inviteRef.id;
        //console.log("✅ 成功建立邀請，ID:", inviteId);
        
        // 🔄 導向推薦表單頁面，使用 outgoing 模式
        const targetUrl = `/pages/recommend-form.html?inviteId=${inviteId}&mode=outgoing`;
        
        // 顯示成功訊息
        const tNow = getSafeTranslation(langNow);
        showToast(t.openingRecommendForm);
        
        // 🆕 可以選擇在新視窗開啟或在當前頁面導向
        smartOpenRecommendation(targetUrl, '推薦他人表單');
        // 或者使用 window.location.href = targetUrl; 在當前頁面導向
        
      } catch (err) {
        console.error("❌ 建立推薦他人邀請失敗：", err);
        console.error("→ 錯誤代碼:", err.code);
        console.error("→ 錯誤訊息:", err.message);
        
        const tNow = getSafeTranslation(langNow);
        
        // 🔍 根據不同錯誤類型顯示對應訊息
        let errorMessage = t.createInviteError;
        
        if (err.code === 'permission-denied') {
          errorMessage = commonT.permissionDenied;
        } else if (err.code === 'unavailable') {
          errorMessage = commonT.networkError;
        }
        
        showToast(errorMessage);
      }
    }

    // 🔽 當使用者登入後，讀取其 profile 與推薦資料並初始化畫面
    auth.onAuthStateChanged(async user => {
      try {
        // 🔍 如果尚未登入，導回登入頁
        if (!user) {
          //console.log("🔍 使用者未登入，導向登入頁");
          return location.href = "/pages/login.html";
        }
        
        //console.log("✅ 使用者已登入:", user.uid);
        profile.userId = user.uid;
        
        // 🏷️ 是否用過 sessionStorage 的預填功能
        let prefillUsed = false;
        
        // 📤 從 Firestore 讀取使用者的個人資料（users/{userId}）
        const ref = db.collection("users").doc(user.uid);

        //console.log("🔍 開始載入使用者資料...");
        
        // 🔍 優化：分別載入，避免同時大量查詢
        const snap = await ref.get();
        //console.log("✅ 使用者基本資料載入完成");
        
        // 🔍 延遲載入推薦統計，避免阻塞主要資料
        let recStats = {};
        
        try {
          const recSnap = await db.collection("users").doc(profile.userId).collection("recommendations").get();
          //console.log("✅ 推薦資料載入完成，數量:", recSnap.size);
          
          // 現有的統計邏輯
        recSnap.forEach(doc => {
          const r = doc.data();
          const jobId = r.jobId;
          if (!recStats[jobId]) {
            recStats[jobId] = { count: 0, highlights: {}, relations: {} };
          }
          recStats[jobId].count++;
          (r.highlights || []).forEach(h => {
            recStats[jobId].highlights[h] = (recStats[jobId].highlights[h] || 0) + 1;
          });
          const rel = r.relation || "unknown";
          recStats[jobId].relations[rel] = (recStats[jobId].relations[rel] || 0) + 1;
        });

          //console.log("✅ 推薦統計載入完成");
          // 🆕 檢查是否有推薦但沒有對應的工作經歷
        const recommendationsWithoutJobs = [];
        recSnap.forEach(doc => {
          const r = doc.data();
          const jobId = r.jobId;
  
        // 檢查是否有對應的工作經歷
          const hasMatchingJob = profile.workExperiences.some(job => job.id === jobId);
  
          if (!hasMatchingJob && r.type === 'outgoing') {
        // 這是推薦他人的推薦，但沒有對應的工作經歷
            recommendationsWithoutJobs.push({
              id: doc.id,
              ...r
            });
          }
        });

        //console.log("🔍 找到無對應工作的推薦:", recommendationsWithoutJobs);

        // 🆕 為沒有工作經歷的推薦創建建議的工作經歷
        if (recommendationsWithoutJobs.length > 0) {
          recommendationsWithoutJobs.forEach(rec => {
            const suggestedJob = {
              id: rec.jobId || crypto.randomUUID(),
              company: rec.recommenderCompany || "",
              position: rec.recommenderPosition || "",
              startDate: "", // 需要用戶填寫
              endDate: "",   // 需要用戶填寫
              description: ""
            };
    
    // 暫存建議的工作經歷，供用戶確認
    sessionStorage.setItem(`suggestedJob_${rec.id}`, JSON.stringify({
      job: suggestedJob,
      recommendation: rec
    }));
  });
  
  //console.log("💡 已準備建議的工作經歷供用戶確認");
}
          
        } catch (recError) {
          console.warn("⚠️ 載入推薦資料時發生錯誤，將使用空資料:", recError);
          // 繼續執行，不中斷主流程
        }

        if (snap.exists) {
          profile = {
            userId: user.uid,
            ...snap.data()
          };

          // 🔥 防呆：若 workExperiences 是 object（舊版），自動轉成陣列
          if (!Array.isArray(profile.workExperiences)) {
            const values = Object.values(profile.workExperiences || {});
            console.warn(`⚠️ [${profile.userId}] workExperiences 非陣列，自動轉換為陣列：`, values);
            profile.workExperiences = values;
          }
        } else {
          localStorage.removeItem("profile");
          // 🆕 若 user 資料尚未建立，建立初始空白檔案
          profile = {
            userId: user.uid,
            name: "",
            englishName: "",
            bio: "",
            workExperiences: []
          };
          // 🆕 確保 recommendationStats 結構存在
          if (!profile.recommendationStats) {
            profile.recommendationStats = {
              totalReceived: 0,
              totalGiven: 0,
              byJob: {}
            };
          }
          try {
            await ref.set({
              ...profile,
              createdAt: new Date()
            });
          } catch (err) {
            // ❌ 建立預設使用者資料時失敗
            console.error("❌ 建立預設 user 資料失敗：", err);
            alert("初始化使用者資料時出現錯誤。請稍後再試。");
          }
        }

        // 🏷️ 若 sessionStorage 有預填姓名（多來自分享連結），自動帶入
        const prefillName = sessionStorage.getItem("prefillName");
        if (prefillName) {
          // 填入「中文姓名」輸入框
          const nameInput = document.getElementById("nameInput");
          if (nameInput) {
            nameInput.value = prefillName;
            prefillUsed = true;
          }
          // 清掉，避免下次又自動帶入
          sessionStorage.removeItem("prefillName");
          // 直接開啟「第一次填檔案」的 Modal
          openModalForAdd(true);
        }

        // … 讀取 profile 並 normalize 之後，先把 recommendations 清空，避免重複 …
        profile.workExperiences = profile.workExperiences || [];
        profile.workExperiences.forEach(j => {
          if (!j.endDate) j.endDate = "";
        });
        // ✅ 將推薦統計資料加到每段工作經歷中
        profile.workExperiences.forEach(j => {
          const stats = recStats[j.id];
          j.recCount = stats?.count || 0;
          j.highlightCount = stats?.highlights || {};
          j.relationCount = stats?.relations || {};
          
          // 🔧 修改：從總統計讀取推薦他人數量
          const jobStats = profile.recommendationStats?.byJob?.[j.id];
          });
        
        // 🔽 初始化畫面顯示（年月下拉、靜態文字、卡片內容）
        populateYearMonth();
        renderStaticText();

        // 🆕 安全檢查：確保 profile 數據完整後才載入推薦統計
        //console.log("🔍 Profile 數據檢查:", {
          userId: profile.userId,
          workExperiencesCount: profile.workExperiences.length,
          hasRecommendationStats: !!profile.recommendationStats
        });

        // 🚀 正確位置：載入推薦統計數據
        //console.log("🔄 開始載入推薦統計數據...");
        try {
          await loadUserRecommendations(profile.userId);
          //console.log("✅ 推薦統計載入完成");
        } catch (loadError) {
          console.warn("⚠️ 載入推薦統計失敗，繼續使用基本數據:", loadError);
          // 不中斷主流程，確保頁面仍可正常使用
        }

        // 🆕 載入推薦數據並更新UI
        const userExp = profile.recommendationStats?.exp || 0;
        renderUserLevel(userExp);

        //renderBasicWithReplyStats();  // 替換 renderBasic()
        renderBio();
        //renderExperienceCardsWithReply();  // 替換 renderExperienceCards()
        updateOnboardingText();

        // 🆕 綁定回推薦事件
        bindReplyModalEvents();
        initializeReplyOptionsModal();  // 🆕 新增這行
        initializeWaitlistModal();      // 🆕 新增這行

        // 🕒 所有資料初始化完成後，關閉遮罩畫面
        document.getElementById("dashboardLoading").style.display = "none";

        // 3. 顯示小卡（由 toggleQuickStartCard 決定 display）並觸發淡入
        const card = document.getElementById("quickStartCard");
        // 注意：toggleQuickStartCard 已幫你做 display:block/none
        setTimeout(() => card.classList.add("show"), 300);

        // 🔽 修正版本：判斷是否顯示 QuickStart 小卡
function toggleQuickStartCard() {
  const card = document.getElementById("quickStartCard");
  if (!card) return;

  const hasExp = profile.workExperiences.length > 0;
  
  // 🔧 修正：檢查 recCount 而不是 recommendations 陣列
  const hasReco = profile.workExperiences.some(job => 
    (job.recCount || 0) > 0  // ✅ 使用 recCount 統計數字
  );
  
  // 💡 更清楚的邏輯：只有在「沒有經歷」或「沒有任何推薦」時才顯示
  const shouldShow = !hasExp || !hasReco;
  
  card.style.display = shouldShow ? "block" : "none";
  
  // 🔍 Debug 訊息（可選，正式環境可移除）
  //console.log("📋 QuickStart 小卡狀態:", {
    hasExp: hasExp,
    hasReco: hasReco,
    shouldShow: shouldShow,
    experienceCount: profile.workExperiences.length,
    recommendationCounts: profile.workExperiences.map(job => ({
      company: job.company,
      recCount: job.recCount || 0
    }))
  });
}

// 🆕 額外安全檢查：確保統計數據載入後重新檢查小卡顯示
function recheckQuickStartCard() {
  // 在載入推薦統計後，重新執行小卡顯示邏輯
  if (typeof toggleQuickStartCard === 'function') {
    toggleQuickStartCard();
  }
}
        // 插入到新容器裡
        const actionBtns = document.getElementById("actionBtns");
        actionBtns.classList.add("btn-group");

        // ➕ 產生「新增工作經歷」按鈕並加到畫面上
        const addBtn = document.createElement("button");
        addBtn.id = "addBtn";
        addBtn.type = "button";
        addBtn.classList.add("btn", "cta-btn");
        addBtn.setAttribute("data-i18n", "addExperience");
        addBtn.innerText = t.addExperience || "新增工作經歷";
        actionBtns.appendChild(addBtn);

        // 📄 產生「推薦總覽」按鈕（連到推薦 summary 頁面）
        const summaryBtn = document.createElement("button");
        summaryBtn.type = "button";
        summaryBtn.classList.add("btn", "cta-btn");
        summaryBtn.setAttribute("data-i18n", "viewSummaryAll");
        summaryBtn.innerText = t.viewSummaryAll || "查看推薦總覽";
        actionBtns.appendChild(summaryBtn);

        // 🌐 產生「公開推薦頁」按鈕（可分享給他人查看）
        const previewBtn = document.createElement("button");
        previewBtn.type = "button";
        previewBtn.classList.add("btn", "cta-btn");
        previewBtn.setAttribute("data-i18n", "viewPublicSummary");
        previewBtn.innerText = t.viewPublicSummary || "🌟 查看公開推薦頁";
        actionBtns.appendChild(previewBtn);

        // 綁定點擊事件
        summaryBtn.addEventListener("click", () => {
          const url = `/pages/recommend-summary.html?userId=${profile.userId}&jobIndex=0`;
          smartOpenRecommendation(url, '推薦總覽');
        });

        previewBtn.addEventListener("click", () => {
          const url = `/pages/public-profile.html?userId=${profile.userId}`;

          smartOpenRecommendation(url, '公開推薦頁');
        });

        // 將 addBtn 的 onclick 保留原本：
        addBtn.onclick = () => openModalForAdd(false);
        
        // 🔽 判斷是否為新用戶需要填寫基本資料
        const isNewUser = !profile.name || profile.workExperiences.length === 0;
        const shouldShowModal = !snap.exists || isNewUser;

        //console.log("🔍 新用戶判斷:", {
          snapExists: snap.exists,
          profileName: profile.name,
          workExpLength: profile.workExperiences.length,
          prefillUsed: prefillUsed,
          isNewUser: isNewUser,
          shouldShowModal: shouldShowModal
        });

        // 第一次 fill vs 無經歷都要開 Modal
        if (!snap.exists) {
          //console.log("🆕 全新用戶，開啟填寫 Modal");
          openModalForAdd(true);
        } else if ((!profile.name || profile.workExperiences.length === 0) && !prefillUsed) {
          //console.log("🆕 用戶資料不完整，開啟填寫 Modal");
          openModalForAdd(true);
        }

        // ===== 所有事件綁定放在這裡 =====

        // 編輯 Bio
        editBioBtn.onclick = () => {
          bioTextarea.value = profile.bio||"";
          bioModal.showModal();
        };
        bioForm.onsubmit = async e => {
          e.preventDefault();
          profile.bio = bioTextarea.value.trim();
          await saveProfile();
          renderExperienceCardsWithReply();  // ✅ 確保有括號
          renderBasicWithReplyStats();       // ✅ 確保有括號
          bioModal.close();                  // ✅ 記得關閉 Modal
        };

        // 新增 / 編輯 Experience
        addBtn.onclick = () => openModalForAdd(false);
        // 🔽 使用者按下送出經歷表單時，進行資料驗證並儲存至 profile
        expForm.onsubmit = async e => {
          e.preventDefault();
          // ─── 新增：檢查開始年月必填 ─────────────────────────────
          if (!startY.value || !startM.value) {
            showToast(t.selectStart);
            return;
          }
          if (!nameSection.hidden) {
            const nameVal = nameInput.value.trim();
            // 🔍 若為首次填寫，驗證使用者必須輸入姓名
            if (!nameVal) {
              showToast(t.enterName);
              nameInput.focus();
              return;
            }
          }
          
          // ★ 初次填姓名
          profile.name = nameInput.value.trim();
          profile.englishName = englishNameInput.value.trim();
          renderBasicWithReplyStats()
          
        
          const pad = v => v.padStart(2, "0");
          // 📦 將開始年月組合為 YYYY-MM 格式
          const startDate = `${startY.value}-${pad(startM.value)}`;
        
          // 驗證結束日期：只有「未勾選仍在職」才需要檢查
          let endDate = "";
          // 🔍 若使用者「未勾選仍在職」，必須進行結束日期的完整驗證
          if (!stillChk.checked) {
            // 1. 確認有選年/月
            if (!endY.value || !endM.value) {
              showToast(t.selectEnd);
              return;
            }
            // 2. 轉成 Date 物件再比大小
            const startObj = new Date(`${startY.value}-${pad(startM.value)}-01`);
            const endObj   = new Date(`${endY.value}-${pad(endM.value)}-01`);
            const today    = new Date();
        
            // ❌ 錯誤：結束日期不能早於開始日期
            if (endObj < startObj) {
              showToast(t.errEndBeforeStart);
              return;
            }
            // ❌ 錯誤：結束日期不能超過今天
            if (endObj > today) {
              showToast(t.errEndAfterToday);
              return;
            }
            // 5. 合法才組回字串
            endDate = `${endY.value}-${pad(endM.value)}`;
          }
        
          // 📦 組合經歷內容 payload（含編輯與新增共用欄位）
          const payload = {
            id: editIdx===null ? crypto.randomUUID() : profile.workExperiences[editIdx].id,
            company:     companyInp.value.trim(),
            position:    positionInp.value.trim(),
            startDate,
            endDate,
            description: descInp.value.trim(),
            recommendations: profile.workExperiences[editIdx]?.recommendations || []
          };
          // 🔁 根據 editIdx 是 null 判斷是「新增」還是「編輯」
          if (editIdx==null) {
            // 新增模式：推入整個 payload
            profile.workExperiences.push(payload);
          } else {
            const job = profile.workExperiences[editIdx];
            const hasRecommendations = job.recCount > 0; // 🆕 使用 recCount 判斷
            
            if (hasRecommendations) {
              // 🔒 有推薦：只更新允許編輯的欄位（描述、結束日期）
              job.description = payload.description;
              job.endDate = payload.endDate;
              //console.log(`✅ 已有推薦的工作經歷，僅更新描述和結束日期`);
            } else {
              // 🔓 無推薦：整筆更新
              Object.assign(job, payload);
              //console.log(`✅ 無推薦的工作經歷，完整更新`);
            }
          }
          // ✅ 儲存成功後更新畫面內容與卡片樣式
          await saveProfile();
          renderExperienceCardsWithReply()
          renderBasicWithReplyStats()
          // 🆕 顯示新推薦通知（用 localStorage 比對未讀）
          const totalRec = profile.workExperiences.reduce((sum, job) => sum + (job.recommendations?.length || 0), 0);
          const lastRead = parseInt(localStorage.getItem("lastReadCount") || "0");
          // 🆕 若有新推薦內容，顯示提示訊息，並記錄已讀數
          if (totalRec > lastRead) {
            const tNow = getSafeTranslation(localStorage.getItem("lang") || "zh-Hant");
            showToast(tNow.newRecommendation || `🛎️ 你收到了一則新推薦！`);
            localStorage.setItem("lastReadCount", totalRec); // 更新已讀數
          }
          expModal.close();
        };

        // 刪除 / 編輯 / 複製推薦 / 推薦他人
        list.addEventListener("click", e => {
          const idx = +e.target.closest('button')?.dataset.idx;
          if (idx === undefined || (idx !== 0 && !idx)) return;
          
          if (e.target.closest(".del-btn")) {
            if (confirm(t.deleteConfirm)) {
              profile.workExperiences.splice(idx,1);
              saveProfile().then(() => {
                renderExperienceCardsWithReply();  // ✅ 加上括號
                renderBasicWithReplyStats();       // ✅ 同時更新統計
              });
              showToast(commonT.deleted);
            }
          }
          else if (e.target.closest(".edit-btn")) openModalForEdit(idx);
          // 🆕 新增：處理「我要推薦他人」按鈕點擊
          else if (e.target.closest(".recommend-others-btn")) {
            handleRecommendOthers(idx);
          }
          // 🆕 新增：處理回推薦按鈕點擊
          else if (e.target.closest(".reply-btn")) {
            handleReplyRecommendation(idx);
          }
          // 🔗 使用者點擊「邀請推薦」按鈕，開啟邀請 Modal 並初始化內容
          else if (e.target.closest(".link-btn")) {
            currentJobIndex = idx;
            currentCompany  = profile.workExperiences[idx].company;
            // 📋 根據選擇的邀請風格，自動填入對應預設文案
            function updateDefaultMessage() {
              const style = currentInviteStyle || "warmth";
              currentInviteStyle = style;
              const tNow = getSafeTranslation(localStorage.getItem("lang") || "zh-Hant");
              currentDefaultMsg = (tNow[`defaultInvite_${style}`] || "")
                .replace("{{company}}", currentCompany);
              inviteTextarea.value = currentDefaultMsg;
            }
            // ➌ 第一次打开时填入文案
            updateDefaultMessage();

           // —— 新增：計算並顯示預覽用的 URL —— 
            const langNow = localStorage.getItem("lang") || "zh-Hant";
            const previewText = getSafeTranslation(langNow).previewLinkText || "🔍 Preview";
            const previewLinkEl = document.getElementById("invitePreviewLink");

            // 🔍 根據使用者輸入內容，產出預覽推薦連結 URL
            function generatePreviewUrl() {
              const message = inviteTextarea.value.trim();
              const jobId   = encodeURIComponent(profile.workExperiences[currentJobIndex].id);
              const style = currentInviteStyle || "warmth";
              const encMsg  = encodeURIComponent(message);
              return `${location.origin}/pages/recommend-form.html`
                + `?userId=${profile.userId}`
                + `&jobId=${jobId}`
                + `&message=${encMsg}`
                + `&style=${style}`
                + `&lang=${langNow}`
                + `&invitedBy=${profile.userId}`;
            }

          // ➋ 初次打開 Modal 時，先填入預設 inviteTextarea（已在你現有 updateDefaultMessage 中）
          // 再把第一次的預覽連結放入
            inviteTextarea.value = "";
            if (previewLinkEl) {
              previewLinkEl.setAttribute("href", generatePreviewUrl());
              previewLinkEl.textContent = previewText;
              previewLinkEl.title       = generatePreviewUrl();
              previewLinkEl.classList.add("preview-link");
            }

          // 🆕 點擊「直接風格」按鈕，插入範本並更新預覽連結
          const directBtn = document.getElementById("insertDirect");
          if (directBtn) {
            directBtn.addEventListener("click", () => {
              const tNow = getSafeTranslation(localStorage.getItem("lang") || "zh-Hant");
              const text = (tNow["defaultInvite_direct"] || "").replace("{{company}}", currentCompany);
              inviteTextarea.value = text;
              if (previewLinkEl) {
                previewLinkEl.setAttribute("href", generatePreviewUrl());
                previewLinkEl.title = generatePreviewUrl();
              }
            });
          }

          // 🆕 點擊「溫暖風格」按鈕，插入範本並更新預覽連結
          const warmthBtn = document.getElementById("insertWarmth");
          if (warmthBtn) {
            warmthBtn.addEventListener("click", () => {
              const tNow = getSafeTranslation(localStorage.getItem("lang") || "zh-Hant");
              const text = (tNow["defaultInvite_warmth"] || "").replace("{{company}}", currentCompany);
              inviteTextarea.value = text;
              if (previewLinkEl) {
                previewLinkEl.setAttribute("href", generatePreviewUrl());
                previewLinkEl.title = generatePreviewUrl();
              }
            });
          }

            // 🆕 使用者手動輸入推薦文字時，自動即時更新預覽連結
            inviteTextarea.addEventListener("input", () => {
              const url = generatePreviewUrl();
              if (previewLinkEl) {
                previewLinkEl.setAttribute("href", url);
                previewLinkEl.title = url;
              }
            });

            inviteModal.showModal();
          } 
        });

        // 邀請 Modal 按鈕
        inviteCancelBtn.onclick = () => inviteModal.close();
        // 🔽 儲存推薦邀請，產生 inviteId 並複製分享連結
        inviteSaveBtn.onclick = async () => {
          const langNow = localStorage.getItem("lang") || "zh-Hant";
          const message = inviteTextarea.value.trim();
          if (!message) {
            showToast(t.inviteEmpty);
            return; // ❌ 中止流程
          }
          const style   = currentInviteStyle || "warmth";
          const job     = profile.workExperiences[currentJobIndex];
          
          let inviteRef; // ✅ 這行是關鍵！提前宣告

          try {
            // 📥 寫入邀請內容至 Firestore 的 invites collection
            inviteRef = await db.collection("invites").add({
              userId: profile.userId,
              jobId: job.id,
              message,
              style,
              lang: langNow,
              invitedBy: profile.userId,
              createdAt: new Date()
            });
            const inviteId = inviteRef.id;
        
            // 2️⃣ 產出最終分享連結
            const finalLink = `${location.origin}/pages/recommend-form.html?inviteId=${inviteId}`;
        
            // 📤 將產生的連結複製到剪貼簿
            await navigator.clipboard.writeText(finalLink);
            showToast(commonT.linkCopied); // ✅ 成功提示
          } 
          catch (err) {
            console.error("❌ 複製失敗：", err);
          
            // 👉 後備備案：prompt fallback 改成 copyModal
            const fallbackLink = `${location.origin}/pages/recommend-form.html?inviteId=${inviteRef?.id || "unknown"}`;
            const copyModal   = document.getElementById("copyModal");
            const copyInput   = document.getElementById("copyLinkInput");
            const btnCopy     = document.getElementById("copyConfirmBtn");
            const btnCancel   = document.getElementById("copyCancelBtn");

            if (copyModal && copyInput) {
              copyInput.value = fallbackLink;
              copyModal.showModal();

              btnCopy.onclick = async () => {
                try {
                  await navigator.clipboard.writeText(copyInput.value);
                  showToast(commonT.linkCopied);
                } catch {
                  showToast(commonT.linkCopyFailed);
                }
                copyModal.close();
              };
              btnCancel.onclick = () => copyModal.close();
            }
          }
          inviteModal.close();
        }; 

        // 🔽 開啟「新增／編輯經歷」的 Modal，根據是否首次填寫決定是否顯示姓名欄位
        function openModalForAdd(isFirst = false) {
          editIdx = null;
          // 顯示「姓名」欄位只在首次填檔案時
          nameSection.hidden = !isFirst;
          //console.log("🎯 openModalForAdd 被調用:", { isFirst, editIdx });
          //console.log("🎯 nameSection.hidden =", nameSection.hidden);

          // 🆕 檢查是否有建議的工作經歷
          const suggestedKeys = Object.keys(sessionStorage).filter(key => key.startsWith('suggestedJob_'));

          if (suggestedKeys.length > 0 && isFirst) {
            const firstSuggested = JSON.parse(sessionStorage.getItem(suggestedKeys[0]));
            const job = firstSuggested.job;
            const rec = firstSuggested.recommendation;
            
            //console.log("💡 使用建議的工作經歷:", job);
            
            // 不重置表單，直接預填
            companyInp.value = job.company || "";
            positionInp.value = job.position || "";
            
            // 清除建議（避免重複使用）
            sessionStorage.removeItem(suggestedKeys[0]);
            
            //console.log("✅ 已預填建議的公司和職位");
          } else if (!isFirst) {
            // 如果是「新增經歷」流程，才重置表單
            expForm.reset();
          }
          const hintBox = document.getElementById("onboardingHint");
          // 只有在「首次建立檔案」時，才顯示這個提示
          if (isFirst && hintBox) {
          // 這裡可以寫入我們之前設計好的提示文字
            hintBox.innerHTML = `💡 請優先填寫與推薦人共事時期的工作經歷，這樣系統能自動將推薦顯示在該經歷中，幫助你快速完成檔案建立。`;
            hintBox.style.display = 'block'; // 顯示提示區塊
          } else if (hintBox) {
          // 確保在其他情況下 (例如點擊「新增經歷」)，提示是隱藏的
            hintBox.style.display = 'none';
          }
         // 🔍 如果是第一次填檔案，顯示對應語系文字（姓名欄位／標題等）
          if (isFirst) {
            renderStaticText();
          }

          // 標題
          modalTitle.textContent = isFirst
            ? (t.addProfileTitle || "建立個人檔案")
            : (t.addExperienceTitle || "新增工作經歷");

          // 期間欄位重置
          stillChk.checked = false;
          endY.disabled = endM.disabled = false;

          // 🕒 填入年月選單，並初始化結束日期是否啟用
          populateYearMonth();
          stillChk.dispatchEvent(new Event("change"));

          // 開啟 Modal
          expModal.showModal();
        }

        // 🔽 編輯指定 index 的工作經歷，填入對應欄位值與狀態
        function openModalForEdit(idx) {
          editIdx = idx;
          const job = profile.workExperiences[idx];
          // 🔐 若該經歷已有推薦，限制部分欄位不可修改
          const locked = job.recCount > 0; // 🆕 改用 recCount 判斷
          
          nameSection.hidden = true;
          modalTitle.textContent = locked
            ? (t.editDescriptionTitle || "編輯工作描述")
            : (t.editExperienceTitle || "編輯工作經歷");
            
          // 填入現有數據
          companyInp.value  = job.company;
          positionInp.value = job.position;
          startY.value      = job.startDate.slice(0,4);
          startM.value      = job.startDate.slice(5,7);
          
          if (job.endDate) {
            stillChk.checked = false;
            endY.disabled = endM.disabled = false;
            endY.value = job.endDate.slice(0,4);
            endM.value = job.endDate.slice(5,7);
          } else {
            stillChk.checked = true;
            endY.disabled = endM.disabled = true;
          }
          stillChk.dispatchEvent(new Event("change"));
          descInp.value = job.description||"";
          
          // 🔒 根據是否有推薦來決定欄位是否可編輯
          if (locked) {
            lockCoreFields();
          } else {
            unlockAllFields();
          }
          
          expModal.showModal();
        }

        // 🔒 鎖定核心欄位（有推薦時）
        function lockCoreFields() {
          // 鎖定：公司名稱、職位、開始年月
          [companyInp, positionInp, startY, startM].forEach(el => {
            el.disabled = true;
            el.style.backgroundColor = '#f5f5f5';
            el.style.color = '#666';
          });
          
          // 解鎖：結束年月（因為可能換工作）、描述、仍在職勾選
          [endY, endM, stillChk, descInp].forEach(el => {
            el.disabled = false;
            el.style.backgroundColor = '';
            el.style.color = '';
          });
          
          // 確保結束日期容器顯示
          endDateContainer.classList.remove("hidden");
        }

        // 🔓 解鎖所有欄位（無推薦時）
        function unlockAllFields() {
          [companyInp, positionInp, startY, startM, endY, endM, stillChk, descInp].forEach(el => {
            el.disabled = false;
            el.style.backgroundColor = '';
            el.style.color = '';
          });
        }

      } catch (authError) {
        console.error("❌ 認證或初始化過程發生錯誤:", authError);
        const loadingEl = document.getElementById("dashboardLoading");
    if (loadingEl) {
      // 直接在載入畫面中顯示錯誤訊息和重試按鈕
      loadingEl.innerHTML = `
        <div style="text-align: center; color: #dc3545; padding: 20px;">
          <h2 style="margin-bottom: 1rem;">載入失敗</h2>
          <p style="margin-bottom: 1.5rem;">無法順利載入您的個人資料，請檢查您的網路連線後再試。</p>
          <p style="font-size: 0.8rem; color: #6c757d; margin-bottom: 2rem;">錯誤訊息: ${authError.message}</p>
          <button onclick="location.reload()" class="btn btn-primary">重新整理頁面</button>
        </div>
      `;
      // 確保載入畫面是可見的
      loadingEl.style.display = "flex";
      }
      }
    });

  } catch (mainError) {
    console.error("❌ Firebase 等待或主要初始化過程發生錯誤:", mainError);
    const loadingText = document.getElementById("loadingDashboardText");
    if (loadingText) {
      loadingText.innerText = mainError.message || "系統初始化失敗，請重新整理頁面";
    }
    
    // 如果是 Firebase 相關錯誤，顯示更友善的訊息
    if (mainError.message.includes('Firebase')) {
      const loadingText = document.getElementById("loadingDashboardText");
      if (loadingText) {
        loadingText.innerText = "Firebase 連接失敗，請檢查網路連線後重新整理頁面";
      }
    }
  }
});

// 🔧 驗證狀態徽章（只顯示通過的）
function getVerificationBadge(rec) {
  if (rec.status === 'verified' && (rec.confidence || 0) > 0) {
    return '<span class="verified-badge">✅ 已確認工作關係</span>';
  } else {
    // 🎯 關鍵：未驗證通過不顯示任何徽章
    return '';
  }
}

