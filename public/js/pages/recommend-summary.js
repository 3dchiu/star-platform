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

// 用戶資料載入函數
async function loadAndRender(userId, db, t, loadingEl, highlightRecId) {
  try {
    const userRef = db.collection("users").doc(userId);
    const [snap, recSn] = await Promise.all([
      userRef.get(),
      userRef.collection("recommendations").get()
    ]);
    
    if (!snap.exists) {
      const summaryArea = document.getElementById("summaryArea");
      if (summaryArea) {
        summaryArea.innerHTML = `<p>${t("noExperience")}</p>`;
      }
      if (loadingEl) loadingEl.style.display = "none";
      return;
    }
    
    const profile = snap.data();

// 🔧 兼容物件和陣列兩種工作經歷格式
const jobMap = {};
let workExperiencesArray = [];

if (Array.isArray(profile.workExperiences)) {
  // ✅ 標準陣列格式（其他用戶）
  workExperiencesArray = profile.workExperiences;
} else if (profile.workExperiences && typeof profile.workExperiences === 'object') {
  // 🔧 物件格式轉換（你的數據）
  workExperiencesArray = Object.values(profile.workExperiences);
} else {
  // 空值處理
  workExperiencesArray = [];
}

workExperiencesArray.forEach(job => {
  if (job && typeof job === 'object') {
    job.recommendations = [];
    jobMap[job.id] = job;
  }
});

// 統一使用陣列格式供後續邏輯使用
profile.workExperiences = workExperiencesArray;

    recSn.forEach(docSnap => {
      const rec = { id: docSnap.id, ...docSnap.data() };
      const job = jobMap[rec.jobId];
      if (job) {
        job.recommendations.push(rec);
      }
    });

    // 排序工作經歷
    profile.workExperiences.sort((a, b) =>
      (b.startDate || "").localeCompare(a.startDate || "")
    );
  
    // 🔧 計算推薦總數：優先使用統計數字，如果沒有才手動計算
    profile._totalRecCount = profile.recommendationStats?.totalReceived || 
      (profile.workExperiences || []).reduce((sum, job) => {
        return sum + (job.recommendations?.length || 0);
      }, 0);

    // 顯示等級資訊
    const userLevelBox = document.getElementById("userLevelInfo");
    if (userLevelBox) {
      const info = getLevelInfo(profile._totalRecCount);
      const nextLevelThreshold = getNextLevelThreshold(info.level + 1);
      const neededForNext = Math.max(0, nextLevelThreshold - profile._totalRecCount);
      const neededHint = neededForNext > 0
        ? t("upgradeHint", neededForNext, info.level + 1) || `再收到 ${neededForNext} 筆推薦可升 Lv.${info.level + 1}`
        : `已達最高等級門檻`;
      
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

    // 更新篩選器
    updateRelationFilter(t, currentLang);
    
    // 渲染推薦內容
    renderRecommendations(profile);
    
    // 設定頁面資訊
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
    
    // 處理特定推薦高亮
    if (highlightRecId) {
      setTimeout(() => {
        const el = document.getElementById(`rec-${highlightRecId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("highlight");
        }
      }, 100);
    }

    // 處理展開特定工作
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
    console.error("載入失敗:", err);
    const summaryArea = document.getElementById("summaryArea");
    if (summaryArea) {
      summaryArea.innerHTML = `<p style="color: red;">載入失敗: ${err.message}</p>`;
    }
    if (loadingEl) loadingEl.style.display = "none";
  }
}

// 推薦渲染函數
async function renderRecommendations(profile) {
  const { t, lang } = await getCurrentT();
  const summaryArea = document.getElementById("summaryArea");
  if (!summaryArea) return;

  const selectedRelation = window.relFilterEl?.value || "";
  const selectedHighlight = window.hiFilterEl?.value || "";
  const isFiltering = !!selectedRelation || !!selectedHighlight;

  // 轉換關係名稱
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

  // 按公司分組
  const grouped = {};
  exps.forEach(job => (grouped[job.company] ||= []).push(job));

  let hasMatch = false;

  Object.entries(grouped).forEach(([company, jobs]) => {
    let jobsToShow = jobs;
    
    // 篩選邏輯
    if (isFiltering) {
      jobsToShow = jobs.filter(job =>
        job.recommendations.some(r =>
          doesRecommendationMatch(r, selectedRelationValue, selectedHighlight)
        )
      );
    }
    
    // 只看推薦模式或一般模式都只顯示有推薦的工作
    jobsToShow = jobsToShow.filter(job => (job.recommendations || []).length > 0);
    
    if (jobsToShow.length === 0) return;

    const section = document.createElement("div");
    if (!onlyShowRecommendations) {
      section.className = "company-section";
      section.innerHTML = `<div class="company-name">${company}</div>`;
    }

    jobsToShow.forEach(job => {
      const shouldExpand = job.id === jobIdToExpand;

      // 只看推薦模式：直接顯示推薦卡片
      if (onlyShowRecommendations) {
        job.recommendations.forEach(r => {
          if (isFiltering && !doesRecommendationMatch(r, selectedRelationValue, selectedHighlight)) {
            return;
          }
          
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
        // 一般模式：顯示工作卡片
        const card = document.createElement("div");
        card.className = "job-card";
        card.dataset.jobid = job.id;
        
        let headerHtml = `
          <div class="job-title">${job.position}</div>
          <div class="job-date">
            ${job.startDate} ～ ${job.endDate || t("present")}
          </div>
        `;
        
        if (job.description) {
          const descHtml = job.description.replace(/\n/g, "<br>");
          headerHtml += `<div class="job-description">${descHtml}</div>`;
        }

        card.innerHTML = headerHtml;

        // 添加推薦內容
        if (job.recommendations && job.recommendations.length > 0) {
          const filteredRecs = isFiltering 
            ? job.recommendations.filter(r => doesRecommendationMatch(r, selectedRelationValue, selectedHighlight))
            : job.recommendations;

          if (filteredRecs.length > 0) {
            const recContainer = document.createElement('div');
            recContainer.className = 'rec-container';
            
            const first = filteredRecs[0];
            const fullText = first.content || "";
            const snippet = fullText.split('\n')[0].slice(0, 50) + (fullText.length > 50 ? '…' : '');
            const relLabel = t(`relation_${first.relation}`) || first.relation;
            const badgesHtml = renderBadges(first.highlights, t);

            if (shouldExpand || isFiltering) {
              // 展開所有推薦
              recContainer.innerHTML = filteredRecs.map(r => {
                const rel = t(`relation_${r.relation}`) || r.relation;
                const badges = renderBadges(r.highlights, t);
                return `
                <div class="rec-card" id="rec-${r.id}">
                  ${r.recommenderId
                    ? `<a class="name" href="recommend-summary.html?public=true&userId=${r.recommenderId}" target="_blank">${r.name}</a>`
                    : `<span class="name">${r.name}</span>`
                  }
                  <span class="meta">（${rel}）</span>
                  ${badges ? `<div class="badge-container">${badges}</div>` : ''}
                  <div>${r.content}</div>
                  <button class="share-rec-btn" data-rec-id="${r.id}">⬆️ 分享</button>
                </div>
              `;
              }).join('');
            } else {
              // 只顯示第一筆摘要
              recContainer.innerHTML = `
              <div class="rec-card" id="rec-${first.id}">
                ${first.recommenderId
                  ? `<a class="name" href="recommend-summary.html?public=true&userId=${first.recommenderId}" target="_blank">${first.name}</a>`
                  : `<span class="name">${first.name}</span>`
                }
                <span class="meta">（${relLabel}）</span>
                ${badgesHtml ? `<div class="badge-container">${badgesHtml}</div>` : ''}
                <div class="rec-snippet">${snippet}</div>
                <button class="share-rec-btn" data-rec-id="${first.id}">⬆️ 分享</button>
              </div>
              `;
            }

            // 展開/收合按鈕
            if (filteredRecs.length > 1 && !isFiltering) {
              const toggleBtn = document.createElement('button');
              toggleBtn.className = 'btn btn-link rec-toggle-btn';
              toggleBtn.dataset.expanded = shouldExpand ? 'true' : 'false';
              toggleBtn.innerText = shouldExpand
                ? t('showLess')
                : t('showAll').replace('{count}', filteredRecs.length);

              toggleBtn.addEventListener('click', () => {
                if (toggleBtn.dataset.expanded === 'false') {
                  // 展開
                  recContainer.innerHTML = filteredRecs.map(r => {
                    const rel = t(`relation_${r.relation}`) || r.relation;
                    const badges = renderBadges(r.highlights, t);
                    return `
                    <div class="rec-card" id="rec-${r.id}">
                      ${r.recommenderId
                        ? `<a class="name" href="recommend-summary.html?public=true&userId=${r.recommenderId}" target="_blank">${r.name}</a>`
                        : `<span class="name">${r.name}</span>`
                      }
                      <span class="meta">（${rel}）</span>
                      ${badges ? `<div class="badge-container">${badges}</div>` : ''}
                      <div>${r.content}</div>
                      <button class="share-rec-btn" data-rec-id="${r.id}">⬆️ 分享</button>
                    </div>
                  `;
                  }).join('');
                  toggleBtn.innerText = t('showLess');
                  toggleBtn.dataset.expanded = 'true';
                } else {
                  // 收合
                  recContainer.innerHTML = `
                  <div class="rec-card" id="rec-${first.id}">
                    ${first.recommenderId
                      ? `<a class="name" href="recommend-summary.html?public=true&userId=${first.recommenderId}" target="_blank">${first.name}</a>`
                      : `<span class="name">${first.name}</span>`
                    }
                    <span class="meta">（${relLabel}）</span>
                    ${badgesHtml ? `<div class="badge-container">${badgesHtml}</div>` : ''}
                    <div class="rec-snippet">${snippet}</div>
                    <button class="share-rec-btn" data-rec-id="${first.id}">⬆️ 分享</button>
                  </div>
                  `;
                  toggleBtn.innerText = t('showAll').replace('{count}', filteredRecs.length);
                  toggleBtn.dataset.expanded = 'false';
                }
              });

              card.appendChild(toggleBtn);
            }

            card.appendChild(recContainer);
          }
        }

        section.appendChild(card);
      }
    });

    if (section.children.length > 0) {
      summaryArea.appendChild(section);
      hasMatch = true;
    }
  });

  if (!hasMatch && isFiltering) {
    summaryArea.innerHTML = `<p>${t("noFilteredMatch")}</p>`;
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