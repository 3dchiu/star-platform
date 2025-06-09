// public/js/pages/summary-public.js
import { i18n, setLang } from "../i18n.js";
console.log("summary-public.js (公開版) 啟動");

// 全域變數
let onlyMode = false;

// 輔助函式 (保持不變)
function renderBadges(tags, tFn) {
  return (tags || [])
    .map(tag => {
      const translated = tFn(`highlight_${tag}`);
      const label = translated && translated !== `highlight_${tag}` ? translated : tag;
      return `<span class="badge">${label}</span>`;
    })
    .join("");
}

/**
 * 【重構版】初始化函式
 */
async function init() {
    const container = document.getElementById("summaryArea");
    container.innerHTML = `<div id="summaryLoading" class="loading-message">載入中...</div>`;

    try {
        const params = new URLSearchParams(location.search);
        const userId = params.get("userId");
        const highlightRecId = params.get("highlightRecId");
        const jobIdToExpand = params.get("jobId"); // 保留此功能

        if (!userId) throw new Error("缺少使用者 ID");
        
        // 1. 初始化 Firebase 和 i18n
        if (typeof firebase === 'undefined' || firebase.apps.length === 0) {
            throw new Error("Firebase 服務尚未準備就緒。");
        }
        const db = firebase.firestore();
        console.log("✅ Firebase 服務已連接");

        const lang = localStorage.getItem("lang") || "en";
        setLang(lang);
        const pack = i18n[lang]?.recommendSummary || {};
        const t = (key, ...args) => {
            const v = pack[key];
            if (typeof v === "function") return v(...args);
            return v || key;
        };
        
        // 2.【核心修改】只抓取已驗證的資料
        const userRef = db.collection("users").doc(userId);
        const [userSnap, recsSnap] = await Promise.all([
            userRef.get(),
            userRef.collection("recommendations").where("status", "==", "verified").get()
        ]);

        document.getElementById("summaryLoading").style.display = "none";
        if (!userSnap.exists) throw new Error("找不到使用者資料。");

        const profile = userSnap.data();

        // 3.【核心修改】信任後端統計
        profile._totalRecCount = profile.recommendationStats?.totalReceived || 0;
        
        // 4. 高效地將「已驗證」的推薦分組
        const jobMap = new Map();
        let workExperiencesArray = Array.isArray(profile.workExperiences) ? profile.workExperiences : Object.values(profile.workExperiences || {});

        workExperiencesArray.forEach(job => {
            if (job && job.id) {
                job.verifiedRecommendations = [];
                jobMap.set(job.id, job);
            }
        });

        recsSnap.forEach(docSnap => {
            const rec = { id: docSnap.id, ...docSnap.data() };
            if (jobMap.has(rec.jobId)) {
                jobMap.get(rec.jobId).verifiedRecommendations.push(rec);
            }
        });

        profile.workExperiences = Array.from(jobMap.values())
            .sort((a, b) => (b.startDate || "").localeCompare(a.startDate || ""));
        
        console.log("✅ 公開頁資料處理完成，準備渲染...");
        
        // 5. 渲染頁面所有內容
        renderPageContent(profile, t, { highlightRecId, jobIdToExpand });

    } catch (err) {
        console.error("❌ 初始化或載入失敗:", err);
        container.innerHTML = `<p style="color:red;">載入失敗: ${err.message}</p>`;
    }
}

/**
 * 【新函式】渲染頁面的所有靜態和動態內容
 */
function renderPageContent(profile, t, urlParams) {
    document.title = `${profile.name} | Galaxyz 推薦總覽`;
    const userNameEl = document.getElementById("userName");
    if (userNameEl) userNameEl.innerText = `${profile.name} ${t('publicProfileTitle') || '的推薦總覽'}`;

    const descEl = document.getElementById("description");
    if (descEl) {
        if (profile.bio) descEl.innerText = profile.bio;
        else descEl.style.display = "none";
    }
    
    const publicStars = document.getElementById("publicStars");
    if (publicStars) {
        publicStars.innerHTML = `...`; // 您的徽章 HTML
    }

    document.querySelector(".filters-toolbar")?.remove();
    document.getElementById("userLevelInfo")?.remove();
    document.getElementById("backBtn")?.remove();

    const toggleBtn = document.getElementById("toggleViewBtn");
    if (toggleBtn) {
        toggleBtn.textContent = t("onlyShowRecommendations");
        toggleBtn.onclick = () => {
            onlyMode = !onlyMode;
            toggleBtn.textContent = onlyMode ? t("showWithCompany") : t("onlyShowRecommendations");
            renderRecommendations(profile, t, urlParams); // 傳遞 urlParams
        };
    }
    
    renderRecommendations(profile, t, urlParams);
}

/**
 * 【功能還原最終版】渲染推薦列表
 */
function renderRecommendations(profile, t, urlParams = {}) {
    const { highlightRecId, jobIdToExpand } = urlParams;
    const summaryArea = document.getElementById("summaryArea");
    summaryArea.innerHTML = "";

    const jobsWithRecs = profile.workExperiences.filter(job => (job.verifiedRecommendations || []).length > 0);
    
    if (jobsWithRecs.length === 0) {
        summaryArea.innerHTML = `<p>${t("noVerifiedRecommendations") || "尚未收到任何已驗證的推薦。"}</p>`;
        return;
    }

    // 「只看推薦」模式
    if (onlyMode) {
        const flatRecs = jobsWithRecs.flatMap(job => job.verifiedRecommendations);
        flatRecs.forEach(r => summaryArea.appendChild(createRecCardElement(r, t)));
        return;
    }

    // 「包含公司」的預設模式
    const grouped = {};
    jobsWithRecs.forEach(job => (grouped[job.company] ||= []).push(job));

    Object.entries(grouped).forEach(([company, jobs]) => {
        const section = document.createElement("div");
        section.className = "company-section";
        section.innerHTML = `<div class="company-name">${company}</div>`; 

        jobs.forEach(job => {
            const card = document.createElement("div");
            card.className = "job-card";
            card.innerHTML = `
                <div class="job-title">${job.position}</div>
                <div class="job-date">${job.startDate} ～ ${job.endDate || t("present")}</div>
                ${job.description ? `<div class="job-description">${job.description.replace(/\n/g, "<br>")}</div>` : ""}
            `;

            const recsInJob = job.verifiedRecommendations || [];
            if (recsInJob.length > 0) {
                const recSectionWrapper = document.createElement('div');
                recSectionWrapper.className = 'rec-section-wrapper';
                const recContainer = document.createElement('div');
                recContainer.className = 'rec-container';

                // 【需求】判斷是否由 URL 指定展開，否則預設全部展開
                const isExpandedByDefault = jobIdToExpand ? job.id === jobIdToExpand : true;

                if (recsInJob.length > 1) {
                    const toggleBtn = document.createElement('button');
                    toggleBtn.className = 'btn btn-link rec-toggle-btn';
                    toggleBtn.dataset.expanded = isExpandedByDefault.toString(); // 初始狀態
                    toggleBtn.textContent = isExpandedByDefault ? t('showLess') : t('showAll', recsInJob.length);

                    toggleBtn.addEventListener('click', (e) => {
                        const isCurrentlyExpanded = e.target.dataset.expanded === 'true';
                        const cards = recContainer.querySelectorAll('.rec-card');
                        cards.forEach((recCard, index) => {
                            if (index > 0) {
                                recCard.style.display = isCurrentlyExpanded ? 'none' : 'block';
                            }
                        });
                        e.target.dataset.expanded = (!isCurrentlyExpanded).toString();
                        e.target.textContent = isCurrentlyExpanded ? t('showAll', recsInJob.length) : t('showLess');
                    });
                    recSectionWrapper.appendChild(toggleBtn);
                }

                recsInJob.forEach((r, index) => {
                    const recCard = createRecCardElement(r, t);
                    // 【需求】根據預設狀態決定是否顯示
                    if (index > 0 && !isExpandedByDefault) {
                        recCard.style.display = 'none';
                    }
                    recContainer.appendChild(recCard);
                });
                
                recSectionWrapper.appendChild(recContainer);
                card.appendChild(recSectionWrapper);
            }
            section.appendChild(card);
        });
        summaryArea.appendChild(section);
    });

    // 處理高亮
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
 * 【隱私保護更新版】建立單張推薦卡的 HTML 元素
 * - 在公開頁面中，將推薦人姓名替換為匿名星星，保護隱私。
 */
function createRecCardElement(r, t) {
    const recCard = document.createElement('div');
    recCard.className = 'rec-card public-rec-card';
    recCard.id = `rec-${r.id}`;

    const relOptions = i18n[localStorage.getItem("lang") || "en"]?.recommendSummary?.relationFilterOptions || [];
    const relMatch = relOptions.find(opt => opt.value === r.relation);
    const relLabel = relMatch?.label || r.relation;

    const badges = renderBadges(r.highlights, (key) => t(key));
    
    // --- ▼▼▼ 【核心修改區域】▼▼▼ ---
    recCard.innerHTML = `
      <div class="rec-header">
        
        <span class="name privacy-protected">
            <span class="star-icon" style="color: #0d6efd;">★</span>
            ${t('anonymousRecommender') || '一位夥伴'}
        </span>

        <span class="rec-relation">（${relLabel}）</span>
      </div>
      ${badges ? `<div class="badge-container">${badges}</div>` : ''}
      <div class="rec-content">${r.content.replace(/\n/g, "<br>")}</div>
    `;
    // --- ▲▲▲ 【核心修改結束】▲▲▲ ---

    return recCard;
}

// 初始化
init();