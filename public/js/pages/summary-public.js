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
        // 尋找對應的推薦卡片（使用 rec- 前綴，與私人頁面保持一致）
        const targetCard = document.querySelector(`#rec-${highlightRecId}`) || 
                          document.querySelector(`[data-rec-id="${highlightRecId}"]`);
        
        if (targetCard) {
            // 使用現有的 highlight 類別（與私人頁面一致）
            targetCard.classList.add('highlight');
            
            // 滾動到目標位置
            targetCard.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
            
            // 3秒後移除亮點效果
            setTimeout(() => {
                targetCard.classList.remove('highlight');
            }, 3000);
            
            console.log(`✅ 已亮點顯示推薦: ${highlightRecId}`);
        } else {
            console.warn(`⚠️ 找不到推薦卡片: ${highlightRecId}`);
        }
    }, 1000); // 給足夠時間讓內容載入
}

// 獲取翻譯函數
function getTranslationFunction() {
    const lang = localStorage.getItem("lang") || "en";
    return (key) => {
        try {
            const keys = key.split(".");
            let value = window.i18n?.[lang];
            
            for (const k of keys) {
                if (value && typeof value === 'object' && k in value) {
                    value = value[k];
                } else {
                    return key; // 找不到翻譯時返回原 key
                }
            }
            
            return typeof value === 'string' ? value : key;
        } catch (e) {
            console.warn("翻譯錯誤:", key, e);
            return key;
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
            <div class="public-no-content white-card p-6 text-center">
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
            <div class="public-no-content white-card p-6 text-center">
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
    let html = '';

    workExperiences.forEach(exp => {
        if (!exp.recommendations || exp.recommendations.length === 0) {
            return; // 跳過沒有推薦的經歷
        }

        html += `
            <div class="experience-block white-card p-6 mb-6">
                <div class="experience-header mb-4">
                    <h3 class="text-xl font-semibold text-gray-900">${exp.position}</h3>
                    <p class="text-lg text-gray-700">${exp.company}</p>
                    <p class="text-sm text-gray-500">
                        ${formatDateRange(exp.startDate, exp.endDate, t)}
                    </p>
                    ${exp.description ? `<p class="text-gray-600 mt-2">${exp.description}</p>` : ''}
                </div>
                
                <div class="recommendations-list">
                    <h4 class="text-lg font-medium mb-3">${t("publicSummary.recommendations") || "推薦"}</h4>
                    ${exp.recommendations.map(rec => renderRecommendationCard(rec, t)).join('')}
                </div>
            </div>
        `;
    });

    if (html === '') {
        html = `
            <div class="public-no-content white-card p-6 text-center">
                <p class="text-gray-500">${t("publicSummary.noVerifiedRecommendations")}</p>
            </div>
        `;
    }

    summaryArea.innerHTML = html;
}

// 僅推薦模式渲染
function renderOnlyRecommendationsMode(recommendations, t) {
    const summaryArea = document.getElementById("summaryArea");
    
    if (recommendations.length === 0) {
        summaryArea.innerHTML = `
            <div class="public-no-content white-card p-6 text-center">
                <p class="text-gray-500">${t("publicSummary.noVerifiedRecommendations")}</p>
            </div>
        `;
        return;
    }

    const html = `
        <div class="public-recommendations-only white-card p-6">
            <h3 class="text-xl font-semibold mb-4">${t("publicSummary.verifiedRecommendations") || "已驗證推薦"}</h3>
            <div class="recommendations-list">
                ${recommendations.map(rec => renderRecommendationCard(rec, t)).join('')}
            </div>
        </div>
    `;

    summaryArea.innerHTML = html;
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