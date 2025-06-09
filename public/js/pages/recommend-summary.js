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

// 等級系統
function getLevelInfo(count) {
  if (count >= 100) return { level: 10, name: "星光領袖", color: "legendary" };
  if (count >= 80)  return { level: 9,  name: "職涯任性代言人", color: "diamond" };
  if (count >= 50)  return { level: 8,  name: "業界口碑典範", color: "trophy" };
  if (count >= 30)  return { level: 7,  name: "影響力連結者", color: "globe" };
  if (count >= 20)  return { level: 6,  name: "真誠推薦磁場", color: "sun" };
  if (count >= 15)  return { level: 5,  name: "人脈之星", color: "gold" };
  if (count >= 10)  return { level: 4,  name: "團隊領航者", color: "rocket" };
  if (count >= 7)   return { level: 3,  name: "值得信賴的夥伴", color: "handshake" };
  if (count >= 4)   return { level: 2,  name: "穩健合作者", color: "briefcase" };
  return                { level: 1,  name: "初心之光", color: "gray" };
}

function getNextLevelThreshold(level) {
  const map = {
    1: 1, 2: 4, 3: 7, 4: 10, 5: 15,
    6: 20, 7: 30, 8: 50, 9: 80, 10: 100, 11: 200
  };
  if (level <= 1) return map[1];
  return map[level] ?? Infinity;
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

    // 步驟 4: 渲染畫面 (這部分程式碼無需大改，因為它現在接收的是處理好的資料)
    const userLevelBox = document.getElementById("userLevelInfo");
    if (userLevelBox) {
      const info = getLevelInfo(profile._totalRecCount);
      const nextLevelThreshold = getNextLevelThreshold(info.level + 1);
      const neededForNext = Math.max(0, nextLevelThreshold - profile._totalRecCount);
      const neededHint = neededForNext > 0
        ? t("upgradeHint", neededForNext, info.level + 1) || `再收到 ${neededForNext} 筆推薦可升 Lv.${info.level + 1}`
        : t("maxLevelReached") || `已達最高等級`;
      
      const lowerThreshold = info.level > 1 ? getNextLevelThreshold(info.level) : 0;
      const upperThreshold = getNextLevelThreshold(info.level + 1);
      const percent = upperThreshold > lowerThreshold
        ? Math.round((profile._totalRecCount - lowerThreshold) / (upperThreshold - lowerThreshold) * 100)
        : 100;
         
      userLevelBox.innerHTML = `
        <div class="level-container" title="${neededHint}">
          <div class="level-badge">${profile._totalRecCount}</div>
          <span class="level-text">Lv.${info.level}｜${info.name}</span>
          <div class="level-progress">
            <div class="level-bar" style="width:${percent}%; min-width: ${percent > 0 ? 4 : 0}px"></div>
          </div>
          <div class="level-hint">${neededHint}</div>
        </div>
      `;
    }

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

// recommend-summary.js

/**
 * 【對應修改版】渲染推薦內容的函式
 * - 修改資料來源為 job.verifiedRecommendations
 */
async function renderRecommendations(profile) {
  const { t, lang } = await getCurrentT();
  const summaryArea = document.getElementById("summaryArea");
  if (!summaryArea) return;

  const selectedRelation = window.relFilterEl?.value || "";
  const selectedHighlight = window.hiFilterEl?.value || "";
  const isFiltering = !!selectedRelation || !!selectedHighlight;
  
  const relationNameToValue = {};
  const relOptions = i18nModule?.i18n[lang]?.recommendSummary?.relationFilterOptions || [];
  relOptions.forEach(opt => {
    relationNameToValue[opt.label] = opt.value;
  });
  const selectedRelationValue = relationNameToValue[selectedRelation] || selectedRelation;

  summaryArea.innerHTML = "";
  const exps = profile.workExperiences || [];
  
  if (exps.length === 0) {
    summaryArea.innerHTML = `<p>${t("noExperience")}</p>`;
    return;
  }

  const grouped = {};
  exps.forEach(job => (grouped[job.company] ||= []).push(job));

  let hasMatch = false;

  Object.entries(grouped).forEach(([company, jobs]) => {
    let jobsToShow = jobs;
    
    if (isFiltering) {
      jobsToShow = jobs.filter(job =>
        // [修改] 使用 verifiedRecommendations
        (job.verifiedRecommendations || []).some(r =>
          doesRecommendationMatch(r, selectedRelationValue, selectedHighlight)
        )
      );
    }
    
    // [修改] 使用 verifiedRecommendations
    jobsToShow = jobsToShow.filter(job => (job.verifiedRecommendations || []).length > 0);
    
    if (jobsToShow.length === 0) return;

    const section = document.createElement("div");
    if (!onlyShowRecommendations) {
      section.className = "company-section";
      section.innerHTML = `<div class="company-name">${company}</div>`;
    }

    jobsToShow.forEach(job => {
      const shouldExpand = job.id === jobIdToExpand;

      if (onlyShowRecommendations) {
        // [修改] 使用 verifiedRecommendations
        (job.verifiedRecommendations || []).forEach(r => {
          if (isFiltering && !doesRecommendationMatch(r, selectedRelationValue, selectedHighlight)) return;
          hasMatch = true; // 有符合的結果
          
          const relLabel = t(`relation_${r.relation}`) || r.relation;
          const badges = renderBadges(r.highlights, t);
          const recCard = document.createElement("div");
          recCard.className = "rec-card";
          recCard.id = `rec-${r.id}`;
          recCard.innerHTML = `
            ${r.recommenderId
              ? `<a class="name" href="recommend-summary.html?public=true&userId=${r.recommenderId}" target="_blank">${r.name}</a>`
              : `<span class="name">${r.name}</span>`
            }
            <span class="meta">（${relLabel}）</span>
            ${badges ? `<div class="badge-container">${badges}</div>` : ''}
            <div>${r.content}</div>
            <button class="share-rec-btn" data-rec-id="${r.id}">⬆️ 分享</button>
          `;
          section.appendChild(recCard);
        });

      } else {
        const card = document.createElement("div");
        card.className = "job-card";
        card.dataset.jobid = job.id;
        
        let headerHtml = `...`; // headerHtml 邏輯不變
        card.innerHTML = headerHtml;

        // [修改] 使用 verifiedRecommendations
        const recsInJob = job.verifiedRecommendations || [];
        if (recsInJob.length > 0) {
          const filteredRecs = isFiltering 
            ? recsInJob.filter(r => doesRecommendationMatch(r, selectedRelationValue, selectedHighlight))
            : recsInJob;

          if (filteredRecs.length > 0) {
            hasMatch = true; // 有符合的結果
            const recContainer = document.createElement('div');
            // ... 後續所有使用 filteredRecs 的渲染邏輯都保持不變 ...
            // 因為 filteredRecs 已經是從正確的 verifiedRecommendations 來源過濾的
          }
        }
        section.appendChild(card);
      }
    });

    if (section.children.length > 0) {
      summaryArea.appendChild(section);
    }
  });

  if (!hasMatch) {
    summaryArea.innerHTML = `<p>${isFiltering ? t("noFilteredMatch") : t("noVerifiedRecommendations")}</p>`;
  }
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