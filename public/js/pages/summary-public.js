// public/js/pages/summary-public.js - 修正版（分享功能接收端）

console.log("summary-public.js 載入中...");

// 等級對應表
const LEVEL_MAP = {
    1: 0, 2: 10, 3: 25, 4: 50, 5: 100,
    6: 200, 7: 300, 8: 500, 9: 750, 10: 1000
};

// 獲取等級資訊
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

// 全域變數
let currentProfile = null;
let currentViewMode = 'withCompany'; // 'withCompany' 或 'onlyRecommendations'

// 主初始化函式
document.addEventListener("DOMContentLoaded", async () => {
    console.log("🚀 公開推薦頁初始化開始");
    
    const loadingElement = document.getElementById("summaryLoading");
    const container = document.getElementById("summaryArea");
    
    try {
        // 等待 Firebase 初始化
        await window.firebasePromise;
        const db = firebase.firestore();

        // 獲取 URL 參數
        const params = new URLSearchParams(location.search);
        const userId = params.get("userId");
        const highlightRecId = params.get("highlightRecId"); // ✅ 分享功能的核心參數
        
        console.log("📍 載入用戶 ID:", userId);
        console.log("🔗 需要亮點顯示的推薦 ID:", highlightRecId);
        
        if (!userId) {
            throw new Error("URL 中缺少 userId 參數");
        }

        // 從 publicProfiles 載入用戶資料
        const publicProfileRef = db.collection("publicProfiles").doc(userId);
        const profileSnap = await publicProfileRef.get();

        if (!profileSnap.exists) {
            throw new Error("找不到該用戶的公開檔案");
        }

        currentProfile = profileSnap.data();
        console.log("✅ 成功載入公開檔案:", currentProfile);
        
        // 渲染頁面
        renderPage(currentProfile);
        
        // 初始化事件監聽器
        initializeEventListeners();

        // ✅ 處理分享連結的亮點顯示（這是接收端的核心功能）
        if (highlightRecId) {
            handleHighlightFromSharedLink(highlightRecId);
        }

    } catch (err) {
        console.error("❌ 載入公開檔案失敗:", err);
        
        const t = getTranslationFunction();
        container.innerHTML = `
            <div class="public-error-container white-card p-6">
                <h2 class="text-red-600 mb-4">${t("publicSummary.errorLoading")}</h2>
                <p class="text-gray-600">${err.message}</p>
            </div>
        `;
    } finally {
        if (loadingElement) {
            loadingElement.style.display = "none";
        }
    }
});

// ✅ 處理分享連結的亮點顯示（接收端邏輯）
function handleHighlightFromSharedLink(highlightRecId) {
    console.log(`🔗 處理分享連結，亮點顯示推薦: ${highlightRecId}`);
    
    // 等待內容完全載入後再執行亮點
    setTimeout(() => {
        // 先嘗試找到目標推薦卡片
        let targetCard = document.querySelector(`#rec-${highlightRecId}`) || 
                        document.querySelector(`[data-rec-id="${highlightRecId}"]`);
        
        if (targetCard) {
            // ✅ 情況1：推薦已經可見（是第一筆推薦）
            console.log(`✅ 推薦已可見，直接亮點顯示: ${highlightRecId}`);
            highlightRecommendation(targetCard);
        } else {
            // ❌ 情況2：推薦被隱藏（不是第一筆推薦）
            console.log(`⚠️ 推薦被隱藏，需要先展開: ${highlightRecId}`);
            
            // 🔧 解決方案：找到包含該推薦的工作經歷，並展開它
            const expandedSuccessfully = expandJobContainingRecommendation(highlightRecId);
            
            if (expandedSuccessfully) {
                // 展開後再次嘗試找到推薦卡片
                setTimeout(() => {
                    targetCard = document.querySelector(`#rec-${highlightRecId}`) || 
                               document.querySelector(`[data-rec-id="${highlightRecId}"]`);
                    
                    if (targetCard) {
                        console.log(`✅ 展開後找到推薦，開始亮點顯示: ${highlightRecId}`);
                        highlightRecommendation(targetCard);
                    } else {
                        console.warn(`❌ 展開後仍找不到推薦: ${highlightRecId}`);
                    }
                }, 200); // 給一點時間讓DOM更新
            } else {
                console.warn(`❌ 無法展開包含推薦的工作經歷: ${highlightRecId}`);
            }
        }
    }, 1000);
}

// ✅ 新函數：找到並展開包含特定推薦的工作經歷
function expandJobContainingRecommendation(recommendationId) {
    console.log(`🔍 搜尋包含推薦 ${recommendationId} 的工作經歷...`);
    
    // 在 currentProfile 中搜尋包含該推薦的工作經歷
    if (!currentProfile || !currentProfile.workExperiences) {
        console.warn("❌ 無法取得工作經歷資料");
        return false;
    }
    
    let targetJobId = null;
    
    // 搜尋包含該推薦的工作經歷
    currentProfile.workExperiences.forEach(exp => {
        if (exp.recommendations && exp.recommendations.length > 0) {
            const hasRecommendation = exp.recommendations.some(rec => rec.id === recommendationId);
            if (hasRecommendation) {
                targetJobId = exp.id;
                console.log(`✅ 找到包含推薦的工作經歷: ${targetJobId}`);
            }
        }
    });
    
    if (!targetJobId) {
        console.warn(`❌ 找不到包含推薦 ${recommendationId} 的工作經歷`);
        return false;
    }
    
    // 找到對應的工作卡片和展開按鈕
    const jobCard = document.querySelector(`.job-card[data-jobid="${targetJobId}"]`);
    if (!jobCard) {
        console.warn(`❌ 找不到工作卡片: ${targetJobId}`);
        return false;
    }
    
    const toggleButton = jobCard.querySelector('.rec-toggle-btn');
    if (!toggleButton) {
        console.log(`ℹ️ 工作經歷 ${targetJobId} 沒有展開按鈕（可能只有一筆推薦）`);
        return true; // 沒有按鈕表示推薦已經顯示了
    }
    
    // 檢查是否需要展開
    if (toggleButton.dataset.expanded === 'false') {
        console.log(`🔧 展開工作經歷 ${targetJobId} 的推薦列表`);
        toggleButton.click(); // 模擬點擊展開按鈕
        return true;
    } else {
        console.log(`ℹ️ 工作經歷 ${targetJobId} 的推薦已經展開`);
        return true;
    }
}

// ✅ 執行亮點顯示的輔助函數
function highlightRecommendation(targetCard) {
    // 使用現有的 highlight 類別
    targetCard.classList.add('highlight');
    
    // 滾動到目標位置
    targetCard.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
    });
    
    console.log(`✨ 亮點顯示完成`);
}

// 獲取翻譯函數
function getTranslationFunction() {
    const lang = localStorage.getItem("lang") || "en";

    // 修正後的函式，可以接收額外的參數 (...args)
    return (key, ...args) => {
        try {
            const keys = key.split(".");
            let value = window.i18n?.[lang];

            // 尋找對應的翻譯內容
            for (const k of keys) {
                if (value && typeof value === 'object' && k in value) {
                    value = value[k];
                } else {
                    // 如果中途找不到，直接返回 key
                    return key;
                }
            }
            
            // 核心修正：檢查找到的 value 是否為一個函式
            if (typeof value === 'function') {
                // 如果是函式，就用傳入的參數 ...args 來呼叫它
                return value(...args);
            }
            
            // 如果是字串，直接返回
            if (typeof value === 'string') {
                return value;
            }

            // 其他情況（如 undefined 或 null），返回原始 key
            return key;

        } catch (e) {
            console.warn("翻譯時發生錯誤:", key, e);
            return key; // 發生錯誤時返回原始 key
        }
    };
}

// 渲染整個頁面
function renderPage(profile) {
    const t = getTranslationFunction();
    
    console.log("🎨 開始渲染頁面，profile:", profile);
    
    // 1. 更新頁面標題
    document.title = `${profile.name}${t("publicSummary.pageTitle")}`;
    
    // 2. 渲染用戶基本資訊
    renderUserBasicInfo(profile, t);
    
    // 3. 渲染生物簡介
    renderBioSection(profile, t);
    
    // 4. 顯示切換按鈕
    showToggleButton(t);
    
    // 5. 渲染推薦內容
    renderRecommendations(profile, t);
}

// 渲染用戶基本資訊
function renderUserBasicInfo(profile, t) {
    // 用戶姓名
    const userNameEl = document.getElementById("userName");
    if (userNameEl) {
        userNameEl.textContent = profile.name || t("publicSummary.defaultUserName");
    }

    // 個人標題
    const headlineEl = document.getElementById("profile-headline");
    if (headlineEl) {
        headlineEl.textContent = profile.headline || "";
    }

    // 等級徽章
    const badgeContainer = document.getElementById("publicLevelBadge");
    if (badgeContainer) {
        const userExp = profile.stats?.exp || 0;
        const levelInfo = getLevelInfo(userExp, t);
        
        badgeContainer.className = `public-level-badge level-${levelInfo.color}`;
        badgeContainer.textContent = `Lv.${levelInfo.level} ${levelInfo.name}`;
        badgeContainer.style.display = 'inline-block';
    }
}

// 渲染生物簡介區塊
function renderBioSection(profile, t) {
    const bioEl = document.getElementById("profile-bio");
    if (bioEl) {
        if (profile.bio && profile.bio.trim()) {
            bioEl.innerHTML = profile.bio.replace(/\n/g, "<br>");
        } else {
            bioEl.innerHTML = `<span class="text-gray-400">${t("publicSummary.noBio") || "尚未填寫個人簡介"}</span>`;
        }
    }
}

// 顯示切換按鈕
function showToggleButton(t) {
    const toggleBtn = document.getElementById("toggleViewBtn");
    if (toggleBtn) {
        toggleBtn.style.display = 'block';
        updateToggleButtonText(t);
    }
}

// 更新切換按鈕文字
function updateToggleButtonText(t) {
    const toggleBtn = document.getElementById("toggleViewBtn");
    if (toggleBtn) {
        if (currentViewMode === 'withCompany') {
            toggleBtn.textContent = t("publicSummary.onlyShowRecommendations") || "只顯示推薦內容";
        } else {
            toggleBtn.textContent = t("publicSummary.showWithCompany") || "顯示工作經歷";
        }
    }
}

// 渲染推薦內容
function renderRecommendations(profile, t) {
    const summaryArea = document.getElementById("summaryArea");
    if (!summaryArea) return;

    console.log("📝 開始渲染推薦內容，workExperiences:", profile.workExperiences);

    // 檢查是否有工作經歷和推薦
    if (!profile.workExperiences || profile.workExperiences.length === 0) {
        summaryArea.innerHTML = `
            <div class="no-content white-card p-6 text-center">
                <p class="text-gray-500">${t("publicSummary.noVerifiedRecommendations")}</p>
            </div>
        `;
        return;
    }

    // 收集所有推薦
    let allRecommendations = [];
    profile.workExperiences.forEach(exp => {
        if (exp.recommendations && exp.recommendations.length > 0) {
            exp.recommendations.forEach(rec => {
                allRecommendations.push({
                    ...rec,
                    experience: exp
                });
            });
        }
    });

    if (allRecommendations.length === 0) {
        summaryArea.innerHTML = `
            <div class="no-content white-card p-6 text-center">
                <p class="text-gray-500">${t("publicSummary.noVerifiedRecommendations")}</p>
            </div>
        `;
        return;
    }

    // 根據顯示模式渲染
    if (currentViewMode === 'withCompany') {
        renderWithCompanyMode(profile.workExperiences, t);
    } else {
        renderOnlyRecommendationsMode(allRecommendations, t);
    }
}

// 以工作經歷模式渲染
function renderWithCompanyMode(workExperiences, t) {
    const summaryArea = document.getElementById("summaryArea");
    summaryArea.innerHTML = "";

    // 按公司分組（與私人頁面邏輯一致）
    const grouped = {};
    workExperiences.forEach(exp => {
        if (exp.recommendations && exp.recommendations.length > 0) {
            (grouped[exp.company] ||= []).push(exp);
        }
    });

    let hasContent = false;

    Object.entries(grouped).forEach(([company, jobs]) => {
        if (jobs.length === 0) return;

        hasContent = true;

        // ✅ 使用與私人頁面相同的樣式類別
        const companySection = document.createElement("div");
        companySection.className = "company-section";
        companySection.innerHTML = `<div class="company-name">${company}</div>`;

        jobs.forEach(exp => {
            // ✅ 使用 job-card 而非 experience-block
            const jobCard = document.createElement("div");
            jobCard.className = "job-card";
            jobCard.dataset.jobid = exp.id;

            // ✅ 使用與私人頁面一致的結構和類別
            jobCard.innerHTML = `
                <div class="job-title">${exp.position}</div>
                <div class="job-date">${formatDateRange(exp.startDate, exp.endDate, t)}</div>
                ${exp.description ? `<div class="job-description">${exp.description.replace(/\n/g, "<br>")}</div>` : ""}
            `;

            const recommendations = exp.recommendations || [];
            
            if (recommendations.length > 0) {
                // ✅ 如果有多個推薦，添加展開/收合按鈕（與私人頁面邏輯一致）
                const recSectionWrapper = document.createElement('div');
                recSectionWrapper.className = 'rec-section-wrapper';

                if (recommendations.length > 1) {
                    const toggleBtn = document.createElement('button');
                    toggleBtn.className = 'btn btn-link rec-toggle-btn';
                    toggleBtn.dataset.expanded = 'false';
                    toggleBtn.textContent = t('recommendSummary.showAll', recommendations.length) || `顯示全部 ${recommendations.length} 則推薦`;

                    toggleBtn.addEventListener('click', (e) => {
                        const wrapper = e.target.closest('.rec-section-wrapper');
                        const recContainer = wrapper.querySelector('.rec-container');
                        if (!recContainer) return;

                        const isExpanded = e.target.dataset.expanded === 'true';
                        if (isExpanded) {
                            // 收合 - 只顯示第一筆
                            recContainer.innerHTML = createRecommendationHTML(recommendations[0], t);
                            e.target.textContent = t('recommendSummary.showAll', recommendations.length) || `顯示全部 ${recommendations.length} 則推薦`;
                            e.target.dataset.expanded = 'false';
                        } else {
                            // 展開 - 顯示全部
                            recContainer.innerHTML = recommendations.map(rec => createRecommendationHTML(rec, t)).join('');
                            e.target.textContent = t('recommendSummary.showLess') || '收合推薦';
                            e.target.dataset.expanded = 'true';
                        }
                    });
                    recSectionWrapper.appendChild(toggleBtn);
                }

                // ✅ 使用 rec-container 類別
                const recContainer = document.createElement('div');
                recContainer.className = 'rec-container';
                // 預設只顯示第一筆推薦
                recContainer.innerHTML = createRecommendationHTML(recommendations[0], t);
                
                recSectionWrapper.appendChild(recContainer);
                jobCard.appendChild(recSectionWrapper);
            }

            companySection.appendChild(jobCard);
        });

        summaryArea.appendChild(companySection);
    });

    if (!hasContent) {
        summaryArea.innerHTML = `
            <div class="no-content white-card p-6 text-center">
                <p class="text-gray-500">${t("publicSummary.noVerifiedRecommendations")}</p>
            </div>
        `;
    }
}

function renderOnlyRecommendationsMode(allRecommendations, t) {
    const summaryArea = document.getElementById("summaryArea");
    
    if (allRecommendations.length === 0) {
        summaryArea.innerHTML = `
            <div class="no-content white-card p-6 text-center">
                <p class="text-gray-500">${t("publicSummary.noVerifiedRecommendations")}</p>
            </div>
        `;
        return;
    }

    // ✅ 使用與私人頁面類似的結構
    const html = `
        <div class="recommendations-only white-card p-6">
            <h3 class="text-xl font-semibold mb-4">${t("publicSummary.verifiedRecommendations") || "已驗證推薦"}</h3>
            <div class="rec-container">
                ${allRecommendations.map(rec => createRecommendationHTML(rec, t)).join('')}
            </div>
        </div>
    `;

    summaryArea.innerHTML = html;
}

// ✅ 新函數：創建推薦 HTML - 使用與私人頁面完全一致的樣式類別
function createRecommendationHTML(rec, t) {
    // 處理亮點標籤 - 使用私人頁面的 badge 類別
    const badges = rec.highlights && rec.highlights.length > 0 
        ? rec.highlights.map(h => `<span class="badge">${translateHighlight(h, t)}</span>`).join('')
        : '';

    // 處理關係顯示
    const relationText = translateRelation(rec.relation, t);
    
    // 推薦人姓名處理（在公開頁面通常不顯示推薦人姓名）
    const recommenderName = rec.recommenderName || "推薦人";

    // ✅ 使用與私人頁面完全相同的結構和類別
    return `
        <div class="rec-card" id="rec-${rec.id}" data-rec-id="${rec.id}">
            <div class="rec-header">
                <span class="name">${recommenderName}</span>
                <span class="meta">（${relationText}）</span>
            </div>
            ${badges ? `<div class="badge-container">${badges}</div>` : ''}
            <div class="rec-content">${rec.content.replace(/\n/g, "<br>")}</div>
        </div>
    `;
}


// ✅ 渲染單個推薦卡片（關鍵：要與私人頁面的 ID 格式保持一致）
function renderRecommendationCard(rec, t) {
    // 處理亮點顯示
    const highlightsHtml = rec.highlights && rec.highlights.length > 0 
        ? rec.highlights.map(h => `<span class="public-highlight-tag">${translateHighlight(h, t)}</span>`).join('')
        : '';

    // 處理關係顯示
    const relationText = translateRelation(rec.relation, t);

    // ✅ 關鍵：使用與私人頁面相同的 ID 格式 rec-${rec.id}
    return `
        <div class="public-recommendation-card" id="rec-${rec.id}" data-rec-id="${rec.id}">
            <div class="public-rec-header">
                <div class="public-rec-meta">
                    <p class="text-sm text-gray-600">
                        ${relationText}
                    </p>
                </div>
                ${highlightsHtml ? `<div class="public-highlights">${highlightsHtml}</div>` : ''}
            </div>
            
            <div class="public-rec-content">
                <p class="text-gray-800 leading-relaxed">${rec.content}</p>
            </div>
        </div>
    `;
}

// 翻譯亮點
function translateHighlight(highlight, t) {
    const highlightMap = {
        'hardSkill': t("publicSummary.highlight_hardSkill") || "硬實力",
        'softSkill': t("publicSummary.highlight_softSkill") || "軟實力", 
        'character': t("publicSummary.highlight_character") || "人品"
    };
    
    return highlightMap[highlight] || highlight;
}

// 翻譯關係
function translateRelation(relation, t) {
    const relationMap = {
        'directManager': t("publicSummary.relation_directManager") || "直屬主管",
        'crossDeptManager': t("publicSummary.relation_crossDeptManager") || "跨部門主管",
        'sameDeptColleague': t("publicSummary.relation_sameDeptColleague") || "同部門同事",
        'crossDeptColleague': t("publicSummary.relation_crossDeptColleague") || "跨部門同事",
        'subordinate': t("publicSummary.relation_subordinate") || "部屬",
        'client': t("publicSummary.relation_client") || "客戶",
        'vendor': t("publicSummary.relation_vendor") || "供應商或外部合作夥伴"
    };
    
    return relationMap[relation] || relation;
}

// 格式化日期範圍
function formatDateRange(startDate, endDate, t) {
    if (!startDate) return '';
    
    const start = startDate;
    const end = endDate || t("publicSummary.present") || "目前在職";
    
    return `${start} - ${end}`;
}

// 初始化事件監聽器
function initializeEventListeners() {
    const t = getTranslationFunction();
    
    // 切換顯示模式按鈕
    const toggleBtn = document.getElementById("toggleViewBtn");
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            currentViewMode = currentViewMode === 'withCompany' ? 'onlyRecommendations' : 'withCompany';
            updateToggleButtonText(t);
            renderRecommendations(currentProfile, t);
        });
    }

    console.log("✅ 事件監聽器初始化完成");
}