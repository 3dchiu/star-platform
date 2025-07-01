// public/js/pages/summary-public.js (V3 最終定稿)

// ▼▼▼ 【修正一】import 語句永遠在最前面 ▼▼▼
import { i18n, setLang } from "../i18n.js";

console.log("summary-public.js (V3 最終定稿) 啟動");

// ▼▼▼ 將所有輔助函式和規則，統一放在 import 之後、主邏輯之前 ▼▼▼
const getSafeI18n = () => window.i18n || {};
const getSafeTranslation = (lang) => getSafeI18n()[lang] || getSafeI18n()["zh-Hant"] || {};

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

let onlyMode = false;

function renderBadges(tags, tFn) {
    return (tags || []).map(tag => {
        const translated = tFn(`highlight_${tag}`);
        const label = translated && translated !== `highlight_${tag}` ? translated : tag;
        return `<span class="badge">${label}</span>`;
    }).join("");
}
// ▲▲▲ 輔助函式區塊結束 ▲▲▲


/**
 * 【V3 版】初始化函式
 */
async function init() {
    const container = document.getElementById("summaryArea");
    container.innerHTML = `<div id="summaryLoading" class="loading-message">載入中...</div>`;

    try {
        const params = new URLSearchParams(location.search);
        const userId = params.get("userId");
        if (!userId) throw new Error("缺少使用者 ID");

        if (typeof firebase === 'undefined' || firebase.apps.length === 0) throw new Error("Firebase 服務尚未準備就緒。");
        
        const db = firebase.firestore();
        const auth = firebase.auth();
        const lang = localStorage.getItem("lang") || "en";
        setLang(lang);
        const t = (key, ...args) => {
            const pack = i18n[lang]?.recommendSummary || {};
            const v = pack[key];
            if (typeof v === "function") return v(...args);
            return v || key;
        };

        const publicProfileRef = db.collection("publicProfiles").doc(userId);
        const profileSnap = await publicProfileRef.get();

        document.getElementById("summaryLoading").style.display = "none";
        if (!profileSnap.exists) throw new Error("找不到使用者資料或該用戶未公開檔案。");
        
        const profile = profileSnap.data();

        auth.onAuthStateChanged(user => {
            const isLoggedIn = !!user;
            const urlParams = {
                highlightRecId: params.get("highlightRecId"),
                jobIdToExpand: params.get("jobId")
            };
            renderPageContent(profile, t, urlParams, isLoggedIn);
        });

    } catch (err) {
        console.error("❌ 初始化或載入失敗:", err);
        container.innerHTML = `<p style="color:red;">載入失敗: ${err.message}</p>`;
    }
}

/**
 * 【V3 - 榮譽徽章版】渲染頁面的所有靜態和動態內容
 */
function renderPageContent(profile, t, urlParams, isLoggedIn) {
    document.title = `${profile.name} | Galaxyz 推薦總覽`;
    const userNameEl = document.getElementById("userName");
    
    // ▼▼▼ 【修正二】只將姓名放入 h1，讓徽章可以正確排在旁邊 ▼▼▼
    if (userNameEl) userNameEl.innerText = profile.name;

    const badgeContainer = document.getElementById("publicLevelBadge");
    if (badgeContainer && profile.settings?.showLevelOnPublicProfile) {
        // ▼▼▼ 【修正三】從 publicProfile 的 stats 物件中讀取 exp ▼▼▼
        const userExp = profile.stats?.exp || 0;
        const levelInfo = getLevelInfo(userExp);
        
        badgeContainer.className = `public-level-badge level-${levelInfo.color}`;
        badgeContainer.textContent = `Lv.${levelInfo.level} ${levelInfo.name}`;
    } else if (badgeContainer) {
        badgeContainer.remove();
    }

    const descEl = document.getElementById("description");
    if (descEl) {
        if (profile.bio) descEl.innerText = profile.bio;
        else descEl.style.display = "none";
    }
    
    const toggleBtn = document.getElementById("toggleViewBtn");
    if (toggleBtn) {
        toggleBtn.textContent = t("onlyShowRecommendations");
        toggleBtn.onclick = () => {
            onlyMode = !onlyMode;
            toggleBtn.textContent = onlyMode ? t("showWithCompany") : t("onlyShowRecommendations");
            renderRecommendations(profile, t, urlParams, isLoggedIn);
        };
    }
    
    renderRecommendations(profile, t, urlParams, isLoggedIn);
}

/**
 * 【V2 升級版】渲染推薦列表，包含訪客模式邏輯
 */
function renderRecommendations(profile, t, urlParams = {}, isLoggedIn = false) {
    const { highlightRecId, jobIdToExpand } = urlParams;
    const summaryArea = document.getElementById("summaryArea");
    summaryArea.innerHTML = "";

    const jobsWithRecs = (profile.workExperiences || []).filter(job => (job.recommendations || []).length > 0);
    
    if (jobsWithRecs.length === 0) {
        summaryArea.innerHTML = `<p>${t("noVerifiedRecommendations")}</p>`;
        return;
    }

    if (onlyMode) {
        const flatRecs = jobsWithRecs.flatMap(job => job.recommendations);
        flatRecs.forEach(r => summaryArea.appendChild(createRecCardElement(r, t)));
        return;
    }

    Object.entries(profile.workExperiences.reduce((acc, job) => {
        (acc[job.company] ||= []).push(job);
        return acc;
    }, {})).forEach(([company, jobs]) => {
        const section = document.createElement("div");
        section.className = "company-section";
        section.innerHTML = `<div class="company-name">${company}</div>`;

        jobs.forEach(job => {
            if ((job.recommendations || []).length === 0) return; // 如果這個工作沒推薦，就跳過不渲染

            const card = document.createElement("div");
            card.className = "job-card";
            card.innerHTML = `<div class="job-title">${job.position}</div><div class="job-date">${job.startDate} ～ ${job.endDate || t("present")}</div>`;
            
            const recsInJob = job.recommendations || [];
            const recContainer = document.createElement('div');
            recContainer.className = 'rec-container';

            if (isLoggedIn) {
                // --- 已登入使用者邏輯 ---
                const isExpandedByDefault = jobIdToExpand ? job.id === jobIdToExpand : true;
                if (recsInJob.length > 1) {
                    const toggleBtn = document.createElement('button');
                    toggleBtn.className = 'btn btn-link rec-toggle-btn';
                    toggleBtn.dataset.expanded = isExpandedByDefault.toString();
                    toggleBtn.textContent = isExpandedByDefault ? t('showLess') : t('showAll', recsInJob.length);
                    toggleBtn.addEventListener('click', (e) => { /* ...展開收合邏輯... */ });
                    card.appendChild(toggleBtn);
                }
                recsInJob.forEach((r, index) => {
                    const recCard = createRecCardElement(r, t);
                    if (index > 0 && !isExpandedByDefault) recCard.style.display = 'none';
                    recContainer.appendChild(recCard);
                });
            } else {
                // --- ▼▼▼【核心修正：未登入訪客邏輯】▼▼▼ ---
                recsInJob.forEach((r, index) => {
                    const isHighlightedByLink = highlightRecId && highlightRecId === r.id;

                    if (index === 0 || isHighlightedByLink) {
                        // 清晰顯示第一則，或被分享的那一則
                        const recCard = createRecCardElement(r, t);
                        recContainer.appendChild(recCard);
                    } else {
                        // 其他的推薦，建立一個包含「模糊卡片」+「清晰按鈕」的容器
                        const teaserWrapper = document.createElement('div');
                        teaserWrapper.className = 'rec-teaser-wrapper'; // 新的 class，只用來定位

                        const recCard = createRecCardElement(r, t);
                        recCard.classList.add('blurred-content'); // 只負責模糊內容

                        const ctaOverlay = document.createElement('a');
                        ctaOverlay.href = '/pages/login.html';
                        ctaOverlay.className = 'teaser-cta';
                        ctaOverlay.innerHTML = `<span>🌟</span> ${t('registerToView') || 'Register to view all'}`;
                        
                        // 將模糊卡片和清晰按鈕，同時放入 wrapper 中
                        teaserWrapper.appendChild(recCard);
                        teaserWrapper.appendChild(ctaOverlay);
                        
                        recContainer.appendChild(teaserWrapper);
                    }
                });
            }
            card.appendChild(recContainer);
            section.appendChild(card);
        });
        summaryArea.appendChild(section);
    });

    if (highlightRecId) {
        setTimeout(() => {
            const el = document.getElementById(`rec-${highlightRecId}`);
            if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
                el.classList.add("highlight");
            }
        }, 50);
    }
}

/**
 * 建立單張推薦卡的 HTML 元素 (保持不變)
 */
function createRecCardElement(r, t) {
    const recCard = document.createElement('div');
    recCard.className = 'rec-card public-rec-card';
    recCard.id = `rec-${r.id}`;

    const relOptions = i18n[localStorage.getItem("lang") || "en"]?.recommendSummary?.relationFilterOptions || [];
    const relMatch = relOptions.find(opt => opt.value === r.relation);
    const relLabel = relMatch?.label || r.relation;

    const badges = renderBadges(r.highlights, (key) => t(key));
    
    recCard.innerHTML = `
      <div class="rec-header">
        <span class="name privacy-protected">
            <span class="star-icon" style="color: #0d6efd;">★</span>
            ${t('anonymousRecommender')}
        </span>
        <span class="rec-relation">（${relLabel}）</span>
      </div>
      ${badges ? `<div class="badge-container">${badges}</div>` : ''}
      <div class="rec-content">${r.content.replace(/\n/g, "<br>")}</div>
    `;

    return recCard;
}

// 初始化
init();