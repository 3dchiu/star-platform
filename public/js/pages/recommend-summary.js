console.log("recommend-summary.js (私人版) 啟動");

// 全域變數
let onlyShowRecommendations = false;
let jobIdToExpand = null;
let currentLang = "zh-Hant";
let i18nModule = null;

// 取得翻譯函式
async function getCurrentT() {
  if (!i18nModule) {
    try {
      i18nModule = await import("../i18n.js");
    } catch (error) {
      console.error("載入 i18n 模組失敗:", error);
      return {
        t: (key) => key,
        lang: "zh-Hant"
      };
    }
  }

  const currentLang = localStorage.getItem("lang") || "zh-Hant";
  const pack = i18nModule.i18n[currentLang]?.recommendSummary || {};
  
  const t = (key, ...args) => {
    const v = pack[key];
    if (typeof v === "function") return v(...args);
    if (typeof v === "string") return v;

    if (key.startsWith("relation_")) {
      const actualKey = key.replace("relation_", "");
      return pack.relationFilterOptions?.find(opt => opt.value === actualKey)?.label || actualKey;
    }

    return key;
  };
  
  return { t, lang: currentLang };
}

// 渲染標籤
function renderBadges(tags, tFn) {
  return (tags||[])
    .map(tag => {
       const label = tFn(`highlight_${tag}`) || tag;
       return `<span class="badge">${label}</span>`;
    })
    .join("");
}

// 更新篩選器
function updateRelationFilter(t, lang) {
  const relSel = document.getElementById("relationFilter");
  if (!relSel) return;

  const relOptions = i18nModule?.i18n[lang]?.recommendSummary?.relationFilterOptions || [];
  relSel.innerHTML = `<option value="">${t("allRelations")}</option>`;
  relOptions.forEach(opt => {
    const o = document.createElement("option");
    o.value = opt.value;
    o.textContent = opt.label;
    relSel.appendChild(o);
  });
}

// 篩選條件檢查
function doesRecommendationMatch(r, selectedRelationValue, selectedHighlight) {
  return (
    (!selectedRelationValue || r.relation === selectedRelationValue) &&
    (!selectedHighlight   || (r.highlights||[]).includes(selectedHighlight))
  );
}

// 主要初始化函數
async function initializeApp() {
  console.log("開始初始化應用程式");
  
  try {
    const loadingEl = document.getElementById("summaryLoading");
    if (loadingEl) {
      loadingEl.style.display = "flex";
    }

    // URL 參數處理
    const params = new URLSearchParams(location.search);
    jobIdToExpand = params.get("jobId");
    const highlightRecId = params.get("highlightRecId");

    // 語言設定
    const { t } = await getCurrentT();

    // Firebase 檢查
    if (typeof firebase === 'undefined') {
      throw new Error("Firebase 未載入");
    }

    // 🔧 Firebase 已經在 HTML 中初始化，直接使用
    let db, auth;

    try {
    // 檢查 Firebase 是否已初始化
      if (firebase.apps.length === 0) {
        console.error("Firebase 未初始化");
        throw new Error("Firebase 未初始化，請檢查 firebase-init.js");
      }
  
    // 使用已初始化的 Firebase 實例
      db = firebase.firestore();
      auth = firebase.auth();
      console.log("✅ Firebase 服務已連接");
    } catch (firebaseError) {
      console.error("Firebase 連接失敗:", firebaseError);
      const summaryArea = document.getElementById("summaryArea");
      if (summaryArea) {
        summaryArea.innerHTML = `<div style="color: red; padding: 20px;">Firebase 連接失敗</div>`;
      }
      if (loadingEl) loadingEl.style.display = "none";
      return;
    }

    // 替換所有 data-i18n
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      const txt = t(key);
      if (txt && txt !== key) {
        if (el.tagName === "OPTION") {
          el.textContent = txt;
        } else {
          el.innerText = txt;
        }
      }
    });

    // 設定篩選器事件監聽
    const relFilterEl = document.getElementById("relationFilter");
    const hiFilterEl = document.getElementById("highlightFilter");
    window.relFilterEl = relFilterEl;
    window.hiFilterEl = hiFilterEl;

    if (relFilterEl && hiFilterEl) {
      relFilterEl.addEventListener("change", () => {
        if (window._loadedProfile) {
          renderRecommendations(window._loadedProfile);
        }
      });
      hiFilterEl.addEventListener("change", () => {
        if (window._loadedProfile) {
          renderRecommendations(window._loadedProfile);
        }
      });
    }

    // 設定切換視圖按鈕
    const toggleViewBtn = document.getElementById("toggleViewBtn");
    if (toggleViewBtn) {
      toggleViewBtn.innerText = t("onlyShowRecommendations");
      toggleViewBtn.addEventListener("click", () => {
        onlyShowRecommendations = !onlyShowRecommendations;
        toggleViewBtn.innerText = t(
          onlyShowRecommendations ? "showWithCompany" : "onlyShowRecommendations"
        );
        if (window._loadedProfile) {
          renderRecommendations(window._loadedProfile);
        }
      });
    }

    // Auth 監聽
    auth.onAuthStateChanged(async user => {
      if (!user) {
        setTimeout(() => {
          location.href = "/pages/login.html";
        }, 1000);
        return;
      }
      
      try {
        await loadAndRender(user.uid, db, t, loadingEl, highlightRecId);
      } catch (err) {
        console.error("loadAndRender 失敗:", err);
        if (loadingEl) loadingEl.style.display = "none";
      }
    });

  } catch (error) {
    console.error("初始化過程發生錯誤:", error);
    const summaryArea = document.getElementById("summaryArea");
    if (summaryArea) {
      summaryArea.innerHTML = `<p style="color: red;">初始化失敗: ${error.message}</p>`;
    }
    const loadingEl = document.getElementById("summaryLoading");
    if (loadingEl) loadingEl.style.display = "none";
  }
}

// recommend-summary.js

/**
 * 【重構版】載入並渲染使用者資料的核心函式
 * - 直接抓取已驗證的推薦
 * - 完全信任後端提供的 recommendationStats 統計資料
 */
async function loadAndRender(userId, db, t, loadingEl, highlightRecId) {
  try {
    const userRef = db.collection("users").doc(userId);
    
    // 步驟 1: 精準抓取資料
    // - userSnap: 使用者主文件 (包含 workExperiences 和 recommendationStats)
    // - recsSnap: 【核心修改】只抓取 status 為 "verified" 的推薦，減輕前端負擔
    const [userSnap, recsSnap] = await Promise.all([
      userRef.get(),
      userRef.collection("recommendations").where("status", "==", "verified").get()
    ]);
    
    if (!userSnap.exists) {
      const summaryArea = document.getElementById("summaryArea");
      if (summaryArea) {
        summaryArea.innerHTML = `<p>${t("noExperience")}</p>`;
      }
      if (loadingEl) loadingEl.style.display = "none";
      return;
    }
    
    const profile = userSnap.data();

    // 步驟 2:【核心修改】信任並使用後端統計資料
    // 直接使用 recommendationStats.totalReceived，不再手動從頭計算
    profile._totalRecCount = profile.recommendationStats?.totalReceived || 0;
    console.log(`[Summary] 信任後端統計，已驗證總推薦數: ${profile._totalRecCount}`);

    // 步驟 3: 高效地將「已驗證」的推薦分組到對應的工作經歷中
    const jobMap = new Map();
    let workExperiencesArray = Array.isArray(profile.workExperiences) ? profile.workExperiences : Object.values(profile.workExperiences || {});

    workExperiencesArray.forEach(job => {
      if (job && job.id) {
        job.verifiedRecommendations = []; // 初始化一個新陣列，專門存放已驗證的推薦
        jobMap.set(job.id, job);
      }
    });

    recsSnap.forEach(docSnap => {
      const rec = { id: docSnap.id, ...docSnap.data() };
      // 因為我們已經在查詢時過濾了 status，這裡可以直接加入
      if (jobMap.has(rec.jobId)) {
        jobMap.get(rec.jobId).verifiedRecommendations.push(rec);
      }
    });
    
    // 從 Map 轉回陣列，並排序
    profile.workExperiences = Array.from(jobMap.values())
      .sort((a, b) => (b.startDate || "").localeCompare(a.startDate || ""));
    
    console.log("[Summary] ✅ 資料處理完成，準備渲染", profile);

    updateRelationFilter(t, currentLang);
    renderRecommendations(profile); // 呼叫已修改的渲染函式
    
    // --- 後續的頁面資訊設定和高亮邏輯保持不變 ---
    document.title = t("pageTitle");
    const pageTitle = document.getElementById("pageTitle");
    if (pageTitle) pageTitle.innerText = t("pageTitle");
    
    const userNameEl = document.getElementById("userName");
    const descEl = document.getElementById("description");
    const backBtn = document.getElementById("backBtn");
    
    if (profile.bio?.trim()) {
      descEl.innerText = profile.bio.trim();
    } else {
      descEl.style.display = "none";
    }
    
    const dn = profile.name || "";
    if (userNameEl) userNameEl.innerText = t("summaryFor", dn);
    
    if (backBtn) {
      backBtn.classList.remove("hidden");
      backBtn.innerText = t("backToProfile");
      backBtn.onclick = () => location.href = "profile-dashboard.html";
    }
    
    if (highlightRecId) {
      setTimeout(() => {
        const el = document.getElementById(`rec-${highlightRecId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("highlight");
        }
      }, 100);
    }

    if (jobIdToExpand) {
      setTimeout(() => {
        const card = document.querySelector(`.job-card[data-jobid="${jobIdToExpand}"]`);
        if (card) {
          const toggle = card.querySelector('.rec-toggle-btn');
          if (toggle && toggle.dataset.expanded === 'false') {
            toggle.click();
          }
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
    
    window._loadedProfile = profile;
    if (loadingEl) loadingEl.style.display = "none";
    
  } catch (err) {
    console.error("載入或渲染失敗:", err);
    const summaryArea = document.getElementById("summaryArea");
    if (summaryArea) {
      summaryArea.innerHTML = `<p style="color: red;">載入失敗: ${err.message}</p>`;
    }
    if (loadingEl) loadingEl.style.display = "none";
  }
}

/**
 * 【按鈕位置修正版】渲染推薦內容的函式
 * - 將「展開/收合」按鈕移動到推薦內容的上方。
 */
async function renderRecommendations(profile) {
  const { t, lang } = await getCurrentT();
  const summaryArea = document.getElementById("summaryArea");
  if (!summaryArea) return;

  const selectedRelation = window.relFilterEl?.value || "";
  const selectedHighlight = window.hiFilterEl?.value || "";
  const isFiltering = !!selectedRelation || !!selectedHighlight;

  summaryArea.innerHTML = "";
  const exps = profile.workExperiences || [];
  
  const grouped = {};
  exps.forEach(job => (grouped[job.company] ||= []).push(job));

  let hasMatch = false;

  Object.entries(grouped).forEach(([company, jobs]) => {
    let jobsToShow = jobs.filter(job => (job.verifiedRecommendations || []).length > 0);
    if (jobsToShow.length === 0) return;

    const section = document.createElement("div");
    section.className = "company-section";
    section.innerHTML = `<div class="company-name">${company}</div>`;

    jobsToShow.forEach(job => {
      hasMatch = true;
      const card = document.createElement("div");
      card.className = "job-card";
      card.dataset.jobid = job.id;
      
      // 1. 先產生工作資訊的 HTML
      card.innerHTML = `
        <div class="job-title">${job.position}</div>
        <div class="job-date">${job.startDate} ～ ${job.endDate || t("present")}</div>
        ${job.description ? `<div class="job-description">${job.description.replace(/\n/g, "<br>")}</div>` : ""}
      `;

      const recsInJob = job.verifiedRecommendations || [];
      
      if (recsInJob.length > 0) {
        
        // --- ▼▼▼ 【位置調整核心】 ▼▼▼ ---

        // 2. 建立一個總容器來包裹按鈕和推薦內容
        const recSectionWrapper = document.createElement('div');
        recSectionWrapper.className = 'rec-section-wrapper';

        // 3. 如果需要按鈕，就「先」建立按鈕並放入總容器
        if (recsInJob.length > 1 && !isFiltering) {
            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'btn btn-link rec-toggle-btn'; // 您可以沿用現有 class
            toggleBtn.dataset.expanded = 'false';
            toggleBtn.textContent = t('showAll', recsInJob.length);

            toggleBtn.addEventListener('click', (e) => {
                // 為了找到正確的 recContainer，我們從按鈕往上層找
                const wrapper = e.target.closest('.rec-section-wrapper');
                const recContainer = wrapper.querySelector('.rec-container');
                if (!recContainer) return;

                const isExpanded = e.target.dataset.expanded === 'true';
                if (isExpanded) {
                    // 收合
                    recContainer.innerHTML = createRecCardHTML(recsInJob[0]);
                    e.target.textContent = t('showAll', recsInJob.length);
                    e.target.dataset.expanded = 'false';
                } else {
                    // 展開
                    recContainer.innerHTML = recsInJob.map(r => createRecCardHTML(r)).join('');
                    e.target.textContent = t('showLess');
                    e.target.dataset.expanded = 'true';
                }
            });
            recSectionWrapper.appendChild(toggleBtn);
        }

        // 4. 「後」建立推薦內容的容器
        const recContainer = document.createElement('div');
        recContainer.className = 'rec-container';
        // 預設只顯示第一筆
        recContainer.innerHTML = createRecCardHTML(recsInJob[0]);
        
        // 5. 將推薦內容容器也放入總容器
        recSectionWrapper.appendChild(recContainer);
        
        // 6. 最後將整個總容器（按鈕+內容）加入到卡片中
        card.appendChild(recSectionWrapper);
        
        // --- ▲▲▲ 【位置調整結束】 ▲▲▲ ---
      }
      section.appendChild(card);
    });
    
    if (section.children.length > 0) {
        summaryArea.appendChild(section);
    }
  });

  if (!hasMatch) {
    summaryArea.innerHTML = `<p>${isFiltering ? t("noFilteredMatch") : t("noVerifiedRecommendations")}</p>`;
  }
}

/**
 * 【最終修正版】建立單張推薦卡的 HTML 字串
 * - 兼容 recommenderId 和 recommenderUserId 兩種欄位，確保超連結能正確產生。
 */
function createRecCardHTML(r) {
    const t = (key) => (i18n[localStorage.getItem("lang") || "en"]?.recommendSummary || {})[key] || key;
    
    const relOptions = i18n[localStorage.getItem("lang") || "en"]?.recommendSummary?.relationFilterOptions || [];
    const relMatch = relOptions.find(opt => opt.value === r.relation);
    const relLabel = relMatch?.label || r.relation;

    const badges = renderBadges(r.highlights, t);

    // ▼▼▼ 【核心修正】 ▼▼▼
    // 優先使用 recommenderId，如果沒有，則使用 recommenderUserId
    const recommenderProfileId = r.recommenderId || r.recommenderUserId;

    // 根據 ID 是否存在，決定要產生超連結還是純文字
    const nameHTML = recommenderProfileId 
      ? `<a class="name" href="recommend-summary.html?public=true&userId=${recommenderProfileId}" target="_blank">${r.name}</a>`
      : `<span class="name">${r.name}</span>`;
    // ▲▲▲ 【核心修正結束】 ▲▲▲
    
    return `
      <div class="rec-card" id="rec-${r.id}">
        <div class="rec-header">
            ${nameHTML}
            <span class="meta">（${relLabel}）</span>
        </div>
        ${badges ? `<div class="badge-container">${badges}</div>` : ''}
        <div class="rec-content">${r.content.replace(/\n/g, "<br>")}</div>
        <button class="share-rec-btn" data-rec-id="${r.id}" title="分享這則推薦">⬆️ 分享</button>
      </div>
    `;
}

// 檢查 DOM 狀態並初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// 分享按鈕全域事件委派
document.addEventListener('click', e => {
  const btn = e.target.closest('.share-rec-btn');
  if (!btn) return;
  
  const recId = btn.dataset.recId;
  const userId = window._loadedProfile?.userId;
  if (!userId) return;
  
  const shareUrl = `${location.origin}/pages/recommend-summary.html?public=true&userId=${userId}&highlightRecId=${recId}`;
  const message = `謝謝你的推薦與支持，這是我們一起共事的紀錄 💬\n👉 ${shareUrl}`;
  
  navigator.clipboard.writeText(message)
    .then(() => alert('分享連結已複製！'))
    .catch(() => alert('複製失敗，請手動複製：' + shareUrl));
});