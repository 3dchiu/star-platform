// summary-public.js
import { i18n, setLang } from "../i18n.js";
console.log("summary-public.js (公開版) 啟動");

// 全域變數
let jobIdToExpand = null;
let onlyMode = false;
let currentLang = "en";  // 預設語言

function getLevelInfo(count) {
  if (count >= 100) return { level: 10, name: "星光領袖" };
  if (count >= 80)  return { level: 9, name: "職涯任性代言人" };
  if (count >= 50)  return { level: 8, name: "業界口碑典範" };
  if (count >= 30)  return { level: 7, name: "影響力連結者" };
  if (count >= 20)  return { level: 6, name: "真誠推薦磁場" };
  if (count >= 15)  return { level: 5, name: "人脈之星" };
  if (count >= 10)  return { level: 4, name: "團隊領航者" };
  if (count >= 7)   return { level: 3, name: "值得信賴的夥伴" };
  if (count >= 4)   return { level: 2, name: "穩健合作者" };
  return                { level: 1, name: "初心之光" };
}

function renderBadges(tags, tFn) {
  return (tags || [])
    .map(tag => {
      const translated = tFn(`highlight_${tag}`);
      const label = translated && translated !== `highlight_${tag}` ? translated : tag;
      return `<span class="badge">${label}</span>`;
    })
    .join("");
}

async function init() {
  const params         = new URLSearchParams(location.search);
  const userId         = params.get("userId");
  jobIdToExpand        = params.get("jobId");
  const highlightRecId = params.get("highlightRecId");
  setLang(localStorage.getItem("lang") || "en");
  const { t, lang } = (() => {
    const lang = localStorage.getItem("lang") || "en";
    const pack = i18n[lang]?.recommendSummary || {};
    const t = (key) => pack[key] || key;
    return { t, lang };
  })();
  currentLang = lang;

  // 🔧 使用 Compat 版本的 Firebase
  if (typeof firebase === 'undefined') {
    console.error("❌ Firebase 未載入");
    document.getElementById("summaryLoading").style.display = "none";
    const summaryArea = document.getElementById("summaryArea");
    if (summaryArea) {
      summaryArea.innerHTML = `<p style="color: red;">Firebase 未載入，請檢查頁面配置</p>`;
    }
    return;
  }

  if (firebase.apps.length === 0) {
    console.error("❌ Firebase 未初始化");
    document.getElementById("summaryLoading").style.display = "none";
    const summaryArea = document.getElementById("summaryArea");
    if (summaryArea) {
      summaryArea.innerHTML = `<p style="color: red;">Firebase 未初始化</p>`;
    }
    return;
  }

  const db = firebase.firestore();
  console.log("✅ Firebase 服務已連接");

  const summaryArea = document.getElementById("summaryArea");
  // 一進來先顯示 loading Spinner
  const spinner = document.getElementById("summaryLoading");
  if (spinner) {
    spinner.style.display = "flex";
  }

  let userSnap, recSnaps;
  try {
    userSnap = await db.collection("users").doc(userId).get();
    recSnaps = await db.collection("users").doc(userId).collection("recommendations").get();
  } catch (e) {
    console.error("❌ Firestore 讀取失敗：", e);
    if (spinner) {
      spinner.style.display = "none";
    }
    if (summaryArea) {
      summaryArea.innerHTML = `<p style="color:#c00">載入失敗：${e.code||e.message}</p>`;
    }
    return;
  }
  // 請求成功後再關閉 spinner
  if (spinner) {
    spinner.style.display = "none";
  }

  if (!userSnap.exists) {
    if (summaryArea) {
      summaryArea.innerHTML = `<p>${t("noExperience")}</p>`;
    }
    return;
  }

  const profile = userSnap.data();

// 🔧 兼容物件和陣列兩種工作經歷格式
if (!Array.isArray(profile.workExperiences)) {
  if (profile.workExperiences && typeof profile.workExperiences === 'object') {
    console.log('🔄 公開版：轉換物件格式為陣列格式');
    profile.workExperiences = Object.values(profile.workExperiences);
  } else {
    profile.workExperiences = [];
  }
}

// 現在可以安全使用陣列方法
profile.workExperiences = profile.workExperiences.filter(job => job);
profile.workExperiences.forEach(job => job.recommendations = []);
  const jobMap = Object.fromEntries(
    profile.workExperiences.map(job => [job.id, job])
  );
  recSnaps.forEach(docSnap => {
    const rec = { id: docSnap.id, ...docSnap.data() };
    if (jobMap[rec.jobId]) jobMap[rec.jobId].recommendations.push(rec);
  });
  profile.workExperiences.sort((a, b) =>
    (b.startDate || "").localeCompare(a.startDate || "")
  );
  console.log("✅ 公開頁：工作經歷已排序");
  
  // 🔧 優先使用統計數字，如果沒有才手動計算
  profile._totalRecCount = profile.recommendationStats?.totalReceived || 
    profile.workExperiences.reduce((sum, job) => sum + (job.recommendations?.length || 0), 0);

  const publicStars = document.getElementById("publicStars");
  if (publicStars) {
    publicStars.innerHTML = `
    <div class="summary-badge-group">
      <span class="prefix-text">${t("received")}</span>
      <span class="star-badge">
        <span class="star">★</span>
        <span class="count">${profile._totalRecCount}</span>
      </span>
      <span>${t("recommendations")}</span>
    </div>`;
  }

  // 1. 顯示姓名 & document.title
  const userNameEl = document.getElementById("userName");
  if (userNameEl) {
    userNameEl.textContent = profile.name || "";
    userNameEl.innerText = `${profile.name} 的推薦總表`;
  }

  // 3. 顯示自我介紹（若有）
  const descEl = document.getElementById("description");
  if (descEl) {
    if (profile.bio) {
      descEl.textContent = profile.bio;
    } else {
      descEl.style.display = "none";
    }
  }

  // 4. 「只看推薦內容」按鈕
  const toggleBtn = document.getElementById("toggleViewBtn");
  if (toggleBtn) {
    toggleBtn.textContent = t("onlyShowRecommendations");
    toggleBtn.dataset.mode = "full"; 
    toggleBtn.addEventListener("click", () => {
      onlyMode = !onlyMode;
      toggleBtn.dataset.mode = onlyMode ? "only" : "full";
      toggleBtn.textContent = onlyMode
        ? t("showWithCompany")
        : t("onlyShowRecommendations");
      renderRecommendations(profile);
    });
  }

  // ==== 【新增】公開版隱藏不需要的元件 ====
  if (params.get("public") === "true") {
    document.querySelector(".filters-toolbar")?.remove();     // 隱藏篩選器區
    document.getElementById("userLevelInfo")?.remove();       // 隱藏等級
    document.getElementById("backBtn")?.remove();             // 隱藏返回按鈕
    document.getElementById("export-pdf")?.remove();          // 隱藏匯出 PDF
  }

  // 最後再一次呼叫 renderRecommendations(profile)
  renderRecommendations(profile);

  if (highlightRecId) {
    setTimeout(() => {
      const el = document.getElementById(`rec-${highlightRecId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("highlight");
      }
    }, 100);
  }
}

function getRelationLabel(relationValue) {
  const options = i18n[currentLang]?.recommendSummary?.relationFilterOptions || [];
  const match = options.find(opt => opt.value === relationValue);
  if (match) return match.label;

  const key = `relation_${relationValue}`;
  const fallback = i18n[currentLang]?.recommendSummary?.[key];
  if (fallback && !fallback.startsWith("relation_")) return fallback;

  return relationValue;
}

function renderRecommendations(profile) {
  const renderedJobIds = new Set(); // ✅ 防止重複 render
  const summaryArea = document.getElementById("summaryArea");
  const pack = i18n[currentLang]?.recommendSummary || {};
  const t = (key) => pack[key] || key;

  if (!summaryArea) return;

  summaryArea.innerHTML = "";
  if (onlyMode) {
    profile.workExperiences.forEach(job => {
      job.recommendations.forEach(r => {
        const rel = getRelationLabel(r.relation);
        const badgeHTML = renderBadges(r.highlights, t);

        const rec = document.createElement("div");
        rec.className = "rec-card";
        rec.innerHTML = `
          <span class="public-icon">★</span>
          <span class="meta">（${rel}）</span>
          ${badgeHTML ? `<div class="badge-container">${badgeHTML}</div>` : ""}
          <div>${r.content}</div>
        `;
        summaryArea.appendChild(rec);
      });
    });
    return; // ✅ 不再執行下方 grouped 的卡片巢狀邏輯
  }

  const jobsWithRecs = profile.workExperiences.filter(job => (job.recommendations || []).length > 0);
  if (jobsWithRecs.length === 0) {
    summaryArea.innerHTML = `<p>${t("noExperience")}</p>`;
    return;
  }

  const grouped = {};
  jobsWithRecs.forEach(job => {
    if (!grouped[job.company]) grouped[job.company] = [];
    grouped[job.company].push(job);
  });

  Object.entries(grouped).forEach(([company, jobs]) => {
    const section = document.createElement("div");
    section.className = "company-section";
    section.innerHTML = `<div class="company-name">${company}</div>`; 

    jobs.forEach(job => {
      if (renderedJobIds.has(job.id)) return;
      renderedJobIds.add(job.id);

      const card = document.createElement("div");
      card.className = "job-card";

      let html = "";

      // ✅ 只在非 onlyMode 時顯示職稱與日期
      if (!onlyMode) {
        html += `
          <div class="job-title">${job.position}</div>
          <div class="job-date">${job.startDate} ～ ${job.endDate || t("present")}</div>
        `;
        if (job.description) {
          const jobDesc = job.description.replace(/\n/g, "<br>");
          html += `<div class="job-description">${jobDesc}</div>`;
        }
      }

      // ✅ 不管模式都顯示推薦群組區塊
      const first = job.recommendations[0];
      const relLabel = getRelationLabel(first.relation);
      const badges = renderBadges(first.highlights, t);

      html += `
        <div class="rec-card-group">
          <div class="rec-toggle-tabs">
            ${!onlyMode && job.recommendations.length > 1
            ? `<div class="rec-toggle-tabs">
                 <button class="rec-toggle-btn" id="toggle-${job.id}" data-expanded="true">${t("showLess")}</button>
              </div>`
            : ""}
          </div>
          <div class="rec-card-wrapper" id="group-${job.id}">
            <div class="rec-container" data-job-id="${job.id}">
              ${job.recommendations.map((r, index) => {
                const rel = getRelationLabel(r.relation);
                const badgeHTML = renderBadges(r.highlights, t);
                return `
                  <div class="rec-card" id="rec-${r.id}">
                    <span class="public-icon">★</span>
                    <span class="meta">（${rel}）</span>
                    ${badgeHTML ? `<div class="badge-container">${badgeHTML}</div>` : ""}
                    <div>${r.content}</div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      `;

      card.innerHTML = html;
      section.appendChild(card);

      // ✅ 正確的展開／收合按鈕綁定（每張卡片各自獨立）
      const toggleBtn = card.querySelector(`#toggle-${job.id}`);
      if (toggleBtn) {
        toggleBtn.addEventListener("click", () => {
          const container = card.querySelector(".rec-container");
          if (!container) return;

          const allCards = container.querySelectorAll(".rec-card");
          const expanded = toggleBtn.dataset.expanded === "true";

          allCards.forEach((card, index) => {
            card.style.display = (index === 0 || !expanded) ? "block" : "none";
          });

          toggleBtn.textContent = expanded
            ? t("showAll").replace("{count}", job.recommendations.length)
            : t("showLess");
          toggleBtn.dataset.expanded = (!expanded).toString();
        });
      }
    });
    summaryArea.appendChild(section);
  });
}

// 初始化
init();