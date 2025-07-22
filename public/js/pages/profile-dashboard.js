// ========================================
// 1️⃣ 常數和全域變數定義
// ========================================
import { t } from '../i18n.js';

const LEVEL_MAP = {
    1: 0, 2: 10, 3: 25, 4: 50, 5: 100,
    6: 200, 7: 300, 8: 500, 9: 750, 10: 1000
};

// Firebase 相關變數
let app, auth, db;

// 全域使用者資料
window.profile = { userId:"", name:"", englishName:"", bio:"", workExperiences:[], recommendationStats: {} };

// 編輯狀態變數
let editIdx, currentJobIndex, currentCompany, currentDefaultMsg, currentInviteStyle;

// ========================================
// 2️⃣ 工具函式
// ========================================

// 🌍 統一的多語言獲取函數
function getSafeI18n() {
    return window.i18n || {};
}

function getSafeTranslation(lang) {
    return getSafeI18n()[lang] || getSafeI18n()["zh-Hant"] || {};
}

// 🌍 獲取當前語言的翻譯函數
function getCurrentTranslation() {
    const lang = localStorage.getItem("lang") || "zh-Hant";
    return getSafeTranslation(lang);
}

function getLevelInfo(exp, tFunc) {
    // 🔧 修復：等級名稱應該在頂層，不在 profileDashboard 下
    const i18nKey = (level) => `level${level}_name`;
    
    // 使用頂層翻譯鍵獲取等級名稱
    const getLevelName = (level) => {
        const currentLang = localStorage.getItem("lang") || "zh-Hant";
        const translations = getSafeTranslation(currentLang);
        const levelKey = `level${level}_name`;
        return translations[levelKey] || `Level ${level}`;
    };
    
    if (exp >= 1000) return { level: 10, name: getLevelName(10), color: "legendary" };
    if (exp >= 750)  return { level: 9,  name: getLevelName(9), color: "diamond" };
    if (exp >= 500)  return { level: 8,  name: getLevelName(8), color: "trophy" };
    if (exp >= 300)  return { level: 7,  name: getLevelName(7), color: "globe" };
    if (exp >= 200)  return { level: 6,  name: getLevelName(6), color: "sun" };
    if (exp >= 100)  return { level: 5,  name: getLevelName(5), color: "gold" };
    if (exp >= 50)   return { level: 4,  name: getLevelName(4), color: "rocket" };
    if (exp >= 25)   return { level: 3,  name: getLevelName(3), color: "handshake" };
    if (exp >= 10)   return { level: 2,  name: getLevelName(2), color: "briefcase" };
    return             { level: 1,  name: getLevelName(1), color: "gray" };
}

function getNextLevelThreshold(level) {
    return LEVEL_MAP[level + 1] ?? Infinity;
}

function getTranslationFunction() {
    const lang = localStorage.getItem("lang") || "en";
    return (key, ...args) => {
        try {
            const keys = key.split(".");
            let value = window.i18n?.[lang];

            for (const k of keys) {
                if (value && typeof value === 'object' && k in value) {
                    value = value[k];
                } else {
                    return key; 
                }
            }
            
            if (typeof value === 'function') {
                return value(...args);
            }
            
            // 👇【核心修正】: 如果 value 不是字串或函式 (例如是陣列或物件)，
            // 直接返回 value 本身，而不是返回 key。
            return value; 

        } catch (e) {
            console.warn("翻譯時發生錯誤:", key, e);
            return key;
        }
    };
}

// 🆕 統一的 Modal 翻譯刷新函數
function forceRefreshModalTranslations(modalId = null) {
    // 定義所有需要處理的彈窗
    const allModals = [
        'profileEditModal',    // 編輯個人檔案
        'expModal',           // 新增/編輯工作經歷
        'replyOptionsModal',  // 回覆選項
        'replyModal',         // 回覆彈窗
        'waitlistModal',      // 等候清單
        'inviteModal',        // 邀請彈窗
        'onboardingModal'     // 新手引導
    ];
    
    const modalIds = modalId ? [modalId] : allModals;
    
    modalIds.forEach(id => {
        const modal = document.getElementById(id);
        if (!modal) {
            console.log(`ℹ️ Modal ${id} 不存在，跳過`);
            return;
        }

        console.log(`🔄 [統一修復] 刷新 ${id} 翻譯`);
        
        // 確保翻譯函數可用
        const tFunc = window.t || ((key) => {
            console.warn(`❌ 翻譯函數不可用，鍵: ${key}`);
            return key;
        });

        try {
            // 1. 處理標題（多種選擇器）
            const titleSelectors = [
                'h3[data-i18n]',
                'h3#modalTitle', 
                '.modal-header h3',
                'h3',
                '[data-i18n*="Title"]'
            ];
            
            for (const selector of titleSelectors) {
                const titleEl = modal.querySelector(selector);
                if (titleEl) {
                    let titleKey = titleEl.getAttribute('data-i18n');
                    
                    if (!titleKey) {
                        const titleMapping = {
                            'profileEditModal': 'profileDashboard.editProfileTitle',
                            'expModal': 'profileDashboard.addExperienceTitle',
                            'replyOptionsModal': 'profileDashboard.replyOptions',
                            'replyModal': 'profileDashboard.selectColleagueToReply',
                            'waitlistModal': 'profileDashboard.waitlistTitle',
                            'inviteModal': 'profileDashboard.inviteModalTitle',
                            'onboardingModal': 'profileDashboard.onboardingModal.modalTitle'
                        };
                        titleKey = titleMapping[id];
                    }
                    
                    if (titleKey) {
                        const translation = tFunc(titleKey);
                        if (translation && translation !== titleKey) {
                            titleEl.textContent = translation;
                            console.log(`✅ ${id} 標題: ${translation}`);
                            break;
                        }
                    }
                }
            }

            // 2. 處理所有 data-i18n 元素
            modal.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.getAttribute('data-i18n');
                if (!key) return;
                
                const translation = tFunc(key);
                if (translation && translation !== key) {
                    el.textContent = translation;
                }
            });

            // 3. 處理 placeholder 屬性
            modal.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
                const key = el.getAttribute('data-i18n-placeholder');
                if (!key) return;
                
                const translation = tFunc(key);
                if (translation && translation !== key) {
                    el.placeholder = translation;
                }
            });

            // 4. 處理按鈕文字
            modal.querySelectorAll('button[data-i18n]').forEach(btn => {
                const key = btn.getAttribute('data-i18n');
                if (!key) return;
                
                const translation = tFunc(key);
                if (translation && translation !== key) {
                    btn.textContent = translation;
                }
            });

            console.log(`✅ [統一修復] ${id} 翻譯刷新完成`);

        } catch (error) {
            console.error(`❌ [統一修復] ${id} 翻譯刷新失敗:`, error);
        }
    });
}

function showToast(msg) {
    const d = document.createElement("div");
    d.className = "toast";
    d.textContent = msg;
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 3000);
}

// 🚀 智能開啟函數
function smartOpenRecommendation(url, linkType = 'recommendation') {
    console.log(`🎯 ${linkType}: ${t('profileDashboard.attemptingNewTab')} -> ${url}`);
    
    const newWindow = window.open(url, '_blank');
    
    setTimeout(() => {
        if (!newWindow || newWindow.closed || newWindow.location.href === 'about:blank') {
            console.log(`❌ ${linkType}: ${t('profileDashboard.newTabBlocked')}`);
            console.log(`🔄 ${linkType}: ${t('profileDashboard.fallbackToSameWindow')}`);
            window.location.href = url;
        } else {
            console.log(`✅ ${linkType}: ${t('profileDashboard.newTabSuccess')}`);
        }
    }, 150);
    
    return false;
}

// ========================================
// 3️⃣ UI 渲染函式
// ========================================

// ✨ 等級資訊渲染
function renderUserLevel(exp) {
    const container = document.getElementById("userLevelInfo");
    if (!container) return;

    const currentLevelInfo = getLevelInfo(exp, t);
    const currentLevel = currentLevelInfo.level;
    const currentLevelName = currentLevelInfo.name;
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

    const expToNextText = nextLevelExp !== Infinity 
        ? t('profileDashboard.upgradeHint', nextLevelExp - exp, currentLevel + 1)
        : t('profileDashboard.maxLevelReached');

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
                <span class="current-exp">EXP: ${exp} / ${nextLevelExp === Infinity ? t('profileDashboard.maxLevel') : nextLevelExp}</span>
                <span class="exp-to-next">${expToNextText}</span>
            </div>
        </div>
    `;
}

// ✨ 基本資訊渲染
function renderBasicInfo(profile) {
    const container = document.getElementById('basicInfo');
    if (!container) return;

    const stats = window.profile.recommendationStats || {};
    const totalReceived = stats.totalReceived || 0;
    const totalGiven = stats.totalGiven || 0;
    
    let recommendationsNote = "";
    if (totalReceived > 0 || totalGiven > 0) {
        recommendationsNote = `
            <p class="rec-summary mt-2 text-sm text-gray-500">
                ${t('profileDashboard.received')} <strong>${totalReceived}</strong> ${t('profileDashboard.recommendations')} | ${t('profileDashboard.totalRecommended')} <strong>${totalGiven}</strong> ${t('profileDashboard.people')}
            </p>
        `;
    }

    let displayName = profile.name || "";
    if (profile.englishName) {
        displayName += ` (${profile.englishName})`;
    }

    const headlineHTML = profile.headline ? `<p class="text-gray-600 mt-1">${profile.headline}</p>` : "";
    
    container.innerHTML = `
        <div class="flex justify-between items-start">
            <div>
                <h1 class="text-2xl font-bold">${displayName}</h1>
                ${headlineHTML}
            </div>
            <button id="open-edit-modal-btn" class="icon-btn" title="${t('profileDashboard.editProfileTitle')}">&#9999;&#65039;</button>
        </div>
        ${recommendationsNote}
    `;
}

// ✨ 個人簡介渲染
function renderBioSection(profile) {
    const bioTextEl = document.getElementById('bioText');
    if (bioTextEl) {
        bioTextEl.innerHTML = profile.bio ? profile.bio.replace(/\n/g, "<br>") : t("profileDashboard.noBio");
    }
}

// ✨ 工作經歷卡片渲染
function renderExperienceCardsWithReply(list, profile) { 
    list.innerHTML = "";
    const frag = document.createDocumentFragment();
    const grouped = {};
    
    const t = getTranslationFunction();

    profile.workExperiences.sort((a,b)=>b.startDate.localeCompare(a.startDate))
        .forEach(job=> (grouped[job.company] = grouped[job.company]||[]).push(job));

    Object.entries(grouped).forEach(([comp,jobs]) => {
        const wrap = document.createElement("div");
        wrap.className = "company-card";
        wrap.innerHTML = `<div class="company-title">${comp}</div>`;
        
        jobs.forEach(job => {
            const idx = profile.workExperiences.indexOf(job);
            
            const receivedCount = job.recCount || 0;
            const givenCount = job.givenCount || 0;
            const canReplyCount = job.canReplyCount || 0;
            const hasRec = receivedCount > 0;
            const pendingCount = job.pending || 0;
            const failedCount = job.failed || 0;

            const roleCard = document.createElement("div");
            roleCard.className = "role-card";

            roleCard.innerHTML = `
                <div class="role-header">
                    <div class="role-info">
                        <strong>${job.position}</strong>
                        <div class="work-period">${job.startDate} ～ ${job.endDate || t("profileDashboard.currentlyWorking")}</div>
                    </div>
                    <div class="manage-actions">
                        <button class="manage-btn edit-btn" data-idx="${idx}" title="${t('profileDashboard.edit')}">📝</button>
                        <button class="manage-btn del-btn" data-idx="${idx}" title="${t('profileDashboard.delete')}">🗑️</button>
                    </div>
                </div>
                ${job.description ? `<div class="work-description">${job.description.replace(/\n/g, "<br>")}</div>` : ""}
            `;

            const summaryDiv = document.createElement('div');
            summaryDiv.className = 'rec-summary-block';
            
            // ✨ --- 核心修改：第一部分 --- ✨
            // 我們將「統計文字」和「操作按鈕」的 HTML 分開產生。
            
            let summaryTextHTML = '';
            
            // 步驟 1: 只有在有收到推薦時，才產生統計文字區塊。
            if (hasRec || (job.allReceived && job.allReceived > 0)) {
                const lang = localStorage.getItem("lang") || "zh-Hant";
                const unit = (count) => (lang === "zh-Hant" ? "位" : (count === 1 ? "person" : "people"));
                
                let mainStatsText = hasRec ? `
                    <span class="stat-item">
                        ${t('profileDashboard.received')} <a href="/pages/recommend-summary.html?userId=${profile.userId}&jobId=${job.id}" onclick="return smartOpenRecommendation(this.href, '推薦總覽')">
                            <strong>${receivedCount}</strong> ${t('profileDashboard.recommendations')}
                        </a>
                    </span>` : `
                    <span class="stat-item">
                        <span class="emoji">📬</span> ${t('profileDashboard.noRecommendation')}
                    </span>`;
                
                const replyStatsText = canReplyCount > 0 ? `<span class="stat-separator">|</span><span class="stat-item">${t('profileDashboard.canReply')} <strong>${canReplyCount}</strong> ${unit(canReplyCount)}</span>` : '';
                const givenStatsText = `<span class="stat-separator">|</span><span class="stat-item">${t('profileDashboard.totalRecommended')} <strong>${givenCount}</strong> ${unit(givenCount)}</span>`;

                let pendingHint = "";
                if (pendingCount > 0 && failedCount > 0) {
                // 情境三：兩者都有
                    pendingHint = `<div class="pending-hint"><small>💡 ${t('profileDashboard.hintBoth', { pending: pendingCount, failed: failedCount })}</small></div>`;
                } else if (pendingCount > 0) {
                // 情境一：只有 pending
                    pendingHint = `<div class="pending-hint"><small>💡 ${t('profileDashboard.hintPendingOnly', { count: pendingCount })}</small></div>`;
                } else if (failedCount > 0) {
                // 情境二：只有 failed
                    pendingHint = `<div class="pending-hint"><small>💡 ${t('profileDashboard.hintFailedOnly', { count: failedCount })}</small></div>`;
                }
                
                const predefinedHighlights = new Set(['hardSkill', 'softSkill', 'character']);
                const highlightText = Object.entries(job.highlightCount || {}).map(([k, c]) => `${predefinedHighlights.has(k) ? t(`recommendSummary.highlight_${k}`) : k} ${c} ${unit(c)}`).join('、') || t('profileDashboard.noHighlights');
                
                const relOptions = t('recommendSummary.relationFilterOptions') || [];
                const relationText = Object.entries(job.relationCount || {}).map(([k, c]) => {
                    const match = relOptions.find(opt => opt.value === k);
                    return `${match ? match.label : k} ${c} ${unit(c)}`;
                }).join('、') || t('profileDashboard.noRelations');
                
                summaryTextHTML = `
                    <div class="summary-text">
                        <div class="recommendation-stats">${mainStatsText}${replyStatsText}${givenStatsText}</div>
                        ${pendingHint}
                        <p>${t('profileDashboard.highlights')}：${highlightText}</p>
                        <p>${t('profileDashboard.relations')}：${relationText}</p>
                    </div>
                `;

            } else {
                // 如果沒有收到任何推薦，顯示一段引導文字。
               summaryTextHTML = `
                <div class="summary-text no-recommendations-prompt">
                    <p>
                        <span class="emoji">💌</span>
                        <strong>${t('profileDashboard.noRecsTitle')}</strong>
                    </p>
                    <ul style="list-style-type: disc; padding-left: 20px; margin-top: 8px; color: #555;">
                        <li>${t('profileDashboard.noRecsAction1')}</li>
                        <li>${t('profileDashboard.noRecsAction2')}</li>
                    </ul>
                </div>
            `;
            }

            // ✨ --- 核心修改：第二部分 --- ✨
            // 步驟 2: 無論如何，都產生操作按鈕的區塊。
            const actionButtonsHTML = `
                <div class="recommendation-actions">
                    <button class="action-btn primary recommend-others-btn" data-idx="${idx}" title="${t('profileDashboard.recommendOthers')} (+10 EXP)">🤝 ${t('profileDashboard.recommendOthers')}</button>
                    ${canReplyCount > 0 ? `<button class="action-btn secondary reply-btn" data-idx="${idx}" title="${t('profileDashboard.replyRecommend')} (+3 EXP)">💬 ${t('profileDashboard.replyRecommend')} (${canReplyCount})</button>` : ''}
                    <button class="action-btn secondary link-btn" data-idx="${idx}" title="${t('profileDashboard.inviteRecommender')} (${t('profileDashboard.successfulRecommendation')} +5 EXP)">📨 ${t('profileDashboard.inviteRecommender')}</button>
                </div>
            `;

            // 步驟 3: 將統計文字和操作按鈕組合起來。
            summaryDiv.innerHTML = `
                <hr style="border: none; border-top: 1px solid #ddd; margin: 16px 0;" />
                <div class="summary-content">
                    ${summaryTextHTML}
                    ${actionButtonsHTML}
                </div>`;
            
            roleCard.appendChild(summaryDiv);
            wrap.appendChild(roleCard);
        });
        frag.appendChild(wrap);
    });
    list.appendChild(frag);
}

// ✨ 更新引導文字
function updateOnboardingText() {
    const onb = t('profileDashboard.onboarding') || { title: "快速開始 ✨", steps: [] };
    const titleEl = document.getElementById("onboardingTitle");
    const stepsEl = document.getElementById("onboardingSteps");
    if (titleEl) titleEl.innerText = onb.title;
    if (stepsEl) stepsEl.innerHTML = onb.steps.map(s => `<li>${s}</li>`).join("");
}

// ✨ 年月選項產生
function populateYearMonth() {
    const now = new Date(), thisYear = now.getFullYear();
    let yrs = ['<option value="">--</option>'], mos = ['<option value="">--</option>'];
    
    // 產生年份選項
    for (let y = thisYear; y >= thisYear - 40; y--) {
        yrs.push(`<option value="${y}">${y}</option>`);
    }
    
    // 產生月份選項
    for (let m = 1; m <= 12; m++) {
        const mm = String(m).padStart(2,"0");
        mos.push(`<option value="${mm}">${m}</option>`);
    }
    
    // 🔧 安全取得元素（修復重點）
    const startY = document.getElementById("startYear");
    const startM = document.getElementById("startMonth");
    const endY = document.getElementById("endYear");
    const endM = document.getElementById("endMonth");
    const stillChk = document.getElementById("stillWorking"); // ✅ 在使用前才宣告
    const endDateContainer = document.getElementById("endDateContainer");
    
    // 填入年份選項
    if (startY) startY.innerHTML = yrs.join("");
    if (endY) endY.innerHTML = yrs.join("");
    
    // 填入月份選項
    if (startM) startM.innerHTML = mos.join("");
    if (endM) endM.innerHTML = mos.join("");
    
    // 🔧 安全處理「目前在職」複選框事件
    if (stillChk && endDateContainer && endY && endM) {
        // 移除舊的事件監聽器（避免重複綁定）
        stillChk.removeEventListener("change", handleStillWorkingChange);
        
        // 定義事件處理函數
        function handleStillWorkingChange() {
            const isWorking = stillChk.checked;
            endDateContainer.classList.toggle("hidden", isWorking);
            
            // 設定 disabled 狀態
            if (endY) endY.disabled = isWorking;
            if (endM) endM.disabled = isWorking;
            
            // 如果選中「目前在職」，清空結束日期
            if (isWorking) {
                if (endY) endY.value = "";
                if (endM) endM.value = "";
            }
        }
        
        // 綁定新的事件監聽器
        stillChk.addEventListener("change", handleStillWorkingChange);
        
        console.log("✅ 年月下拉選單和目前在職功能初始化完成");
    } else {
        console.warn("⚠️ 部分 DOM 元素未找到，跳過目前在職功能設定");
        if (!stillChk) console.warn("   - stillWorking checkbox 未找到");
        if (!endDateContainer) console.warn("   - endDateContainer 未找到");
        if (!endY) console.warn("   - endYear select 未找到");
        if (!endM) console.warn("   - endMonth select 未找到");
    }
}

// 函式一：為新用戶引導彈窗的年月下拉選單填入選項
function populateOnboardingYearMonth() {
    const now = new Date(), thisYear = now.getFullYear();
    let yrs = ['<option value="">--</option>'], mos = ['<option value="">--</option>'];
    for (let y = thisYear; y >= thisYear - 40; y--) {
        yrs.push(`<option>${y}</option>`);
    }
    for (let m = 1; m <= 12; m++) {
        const mm = String(m).padStart(2,"0");
        mos.push(`<option value="${mm}">${m}</option>`);
    }

    const startY = document.getElementById("onboarding-startYear");
    const startM = document.getElementById("onboarding-startMonth");
    const endY = document.getElementById("onboarding-endYear");
    const endM = document.getElementById("onboarding-endMonth");
    const stillChk = document.getElementById("onboarding-stillWorking");
    const endDateContainer = document.getElementById("onboarding-endDateContainer");
    
    if (startY) startY.innerHTML = yrs.join("");
    if (endY) endY.innerHTML = yrs.join("");
    if (startM) startM.innerHTML = mos.join("");
    if (endM) endM.innerHTML = mos.join("");
    
    if (stillChk && endDateContainer) {
        stillChk.addEventListener("change", () => {
            endDateContainer.classList.toggle("hidden", stillChk.checked);
        });
    }
}

// ========================================
// 4️⃣ 業務邏輯函式
// ========================================

// ✨ 儲存使用者個人資料
async function saveProfile() {
    console.group("🔍 saveProfile()");
    console.log("→ profile.userId =", window.profile.userId);
    console.log("→ profile payload =", window.profile);
    if (!window.profile.userId) {
        console.warn("❌ saveProfile() 中断：profile.userId 为空");
        console.groupEnd();
        return;
    }

    try {
        const ref = db.collection("users").doc(window.profile.userId);

        const existingSnap = await ref.get();
        // 🔧 修復：兼容新舊版本的 exists 檢查
        const snapExists = typeof existingSnap.exists === 'function' ? existingSnap.exists() : existingSnap.exists;
        
        if (snapExists) {
            const existingData = existingSnap.data();
            if (!window.profile.name && existingData.name) {
                window.profile.name = existingData.name;
            }
            if (!window.profile.englishName && existingData.englishName) {
                window.profile.englishName = existingData.englishName;
            }
        }

        await ref.set(window.profile, { merge: true });
        console.log("✅ saveProfile() 写入成功");
    } catch (err) {
        console.error("❌ saveProfile() 写入失败：", err);
    }

    console.groupEnd();
}

// ✨ 載入使用者推薦資料
async function loadUserRecommendations(userId) {
    console.log("📥 載入用戶推薦數據...");
    
    try {
        const recommendations = [];
        
        const receivedRef = db.collection("users").doc(userId).collection("recommendations");
        const receivedSnapshot = await receivedRef.get();
        
        receivedSnapshot.forEach(doc => {
            recommendations.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        for (const job of window.profile.workExperiences) {
            if (job.recommendations && Array.isArray(job.recommendations)) {
                job.recommendations.forEach(rec => {
                    recommendations.push({
                        ...rec,
                        type: 'outgoing',
                        jobId: job.id
                    });
                });
            }
        }
        
        console.log(`✅ 載入推薦記錄總計: ${recommendations.length} 筆`);
        
        // 計算統計
        const newStats = calculateRecommendationStats(recommendations);
        
        // 👇 --- 這是最核心的修正 --- 👇
        // 使用 Object.assign 將新計算出的統計數據合併到現有的 recommendationStats 中，
        // 這樣既能更新 totalReceived 等數據，又能保留從資料庫讀來的 exp。
        window.profile.recommendationStats = Object.assign(window.profile.recommendationStats || {}, newStats);
        // 👆 --- 核心修正結束 --- 👆

        window.profile.recommendations = recommendations;

        // 將統計數據映射到工作經歷
        window.profile.workExperiences.forEach(job => {
            const jobStats = window.profile.recommendationStats.byJob[job.id] || {
                received: 0, given: 0, canReply: 0, allReceived: 0,
                verified: 0, pending: 0, failed: 0, highlights: {}, relations: {}
            };

            const originalGivenCount = job.givenCount;

            job.recCount = jobStats.received;
            job.canReplyCount = jobStats.canReply;
            job.allReceived = jobStats.allReceived;
            job.verified = jobStats.verified;
            job.pending = jobStats.pending;
            job.failed = jobStats.failed;
            
            if (typeof originalGivenCount === 'undefined' || originalGivenCount === null) {
                job.givenCount = 0;
            }

            job.highlightCount = typeof jobStats.highlights === 'object' ? jobStats.highlights : {};
            job.relationCount = typeof jobStats.relations === 'object' ? jobStats.relations : {};
        });

        console.log("✅ 推薦統計映射完成");
        
        // 觸發 UI 重新渲染
        const list = document.getElementById("experienceList");
        if (list && window.profile) {
            renderExperienceCardsWithReply(list, window.profile);
            console.log("✅ renderExperienceCardsWithReply 已調用");
        }
        
        return recommendations;
        
    } catch (error) {
        console.error("❌ 載入推薦數據失敗:", error);
        return [];
    }
}

// ✨ 計算推薦統計
function calculateRecommendationStats(recommendations) {
    const stats = {
        totalReceived: 0, totalGiven: 0, totalCanReply: 0, byJob: {}
    };

    if (!recommendations || recommendations.length === 0) {
        return stats;
    }

    // 預先建立已推薦對象的 Set
    const recommendedTargets = new Set();
    recommendations.forEach(rec => {
        if (rec.type === 'outgoing' || rec.type === 'reply') {
            if (rec.targetUserId) recommendedTargets.add(rec.targetUserId);
            if (rec.recommendeeEmail) recommendedTargets.add(rec.recommendeeEmail.toLowerCase());
            if (rec.targetEmail) recommendedTargets.add(rec.targetEmail.toLowerCase());
        }
    });

    // 遍歷所有推薦記錄進行計算
    recommendations.forEach(rec => {
        const jobId = rec.matchedJobId || rec.jobId;
        if (!jobId) return;

        if (!stats.byJob[jobId]) {
            stats.byJob[jobId] = {
                received: 0, given: 0, canReply: 0, allReceived: 0,
                verified: 0, pending: 0, failed: 0, highlights: {}, relations: {}
            };
        }
        const jobStats = stats.byJob[jobId];

        // 處理收到的推薦
        if (rec.type === 'received') {
            jobStats.allReceived++;

            const isVerified = rec.status === 'verified' && (rec.confidence || 0) > 0 && !rec.excludeFromStats;

            if (isVerified) {
                stats.totalReceived++;
                jobStats.received++;
                jobStats.verified++;

                (rec.highlights || []).forEach(h => {
                    jobStats.highlights[h] = (jobStats.highlights[h] || 0) + 1;
                });
                const relation = rec.relation || "unknown";
                jobStats.relations[relation] = (jobStats.relations[relation] || 0) + 1;
            } else {
                if (rec.status === 'verification_failed') {
                    jobStats.failed++;
                } else {
                    jobStats.pending++;
                }
            }

            // 判斷是否可回覆
            if (rec.status === 'verified' && !rec.hasReplied) {
                const alreadyRecommended = recommendedTargets.has(rec.recommenderId) || 
                                         recommendedTargets.has((rec.email || '').toLowerCase());
                
                // 只有在尚未回覆，且也尚未主動推薦過對方的情況下，才算可回覆
                if (!alreadyRecommended) {
                    stats.totalCanReply++;
                    jobStats.canReply++;
                }
            }
        }

        // 處理送出的推薦
        if (rec.type === 'outgoing' || rec.type === 'reply') {
            const isValidGiven = ['verified', 'delivered_and_verified', 'confirmed'].includes(rec.status);
            
            if (isValidGiven) {
                stats.totalGiven++;
                jobStats.given++;
            }
        }
    });

    return stats;
}

// ✨ 推薦他人功能
async function handleRecommendOthers(jobIndex) {
    const job = window.profile.workExperiences[jobIndex];
    
    try {
        if (!auth.currentUser) {
            showToast(t('common.loginRequired'));
            return;
        }

        console.log("🔍 嘗試建立推薦他人邀請...");
        
        const lang = localStorage.getItem("lang") || "zh-Hant";
        
        const inviteRef = await db.collection("invites").add({
            userId: window.profile.userId,
            jobId: job.id,
            type: "outgoing",
            company: job.company,
            position: job.position,
            recommenderName: window.profile.name,
            recommenderUserId: window.profile.userId,
            recommenderEmail: window.profile.email,
            recommenderJobId: job.id,
            lang: lang,
            createdAt: new Date(),
            status: "pending"
        });
        
        const inviteId = inviteRef.id;
        const targetUrl = `/pages/recommend-form.html?inviteId=${inviteId}&mode=outgoing`;
        
        showToast(t('profileDashboard.openingRecommendForm'));
        smartOpenRecommendation(targetUrl, t('profileDashboard.recommendFormTitle'));
        
    } catch (err) {
        console.error("❌ 建立推薦他人邀請失敗：", err);
        
        let errorMessage = t('profileDashboard.createInviteError');
        if (err.code === 'permission-denied') {
            errorMessage = t('profileDashboard.permissionDenied');
        } else if (err.code === 'unavailable') {
            errorMessage = t('profileDashboard.networkError');
        }
        
        showToast(errorMessage);
    }
}

// ✨ 回覆推薦功能
async function handleReplyRecommendation(jobIndex) {
    const job = window.profile.workExperiences[jobIndex];
    
    try {
        console.log("💬 載入回覆選項...");
        
        const availableRecommendations = window.profile.recommendations.filter(rec => {
            const matchesJob = (rec.matchedJobId || rec.jobId) === job.id;
            const isReceived = rec.type === 'received';
            const notReplied = !rec.hasReplied;
            const isVerified = rec.status === 'verified'; // <--- 根據文件新增的檢查
            const canReply = rec.canReply === true;       // <--- 根據文件新增的檢查
            
            return matchesJob && isReceived && isVerified && notReplied && canReply;
        });
        
        if (availableRecommendations.length === 0) {
            showToast(t('profileDashboard.noReplyAvailable'));
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
        showToast(t('profileDashboard.loadReplyOptionsError'));
    }
}

// ✨ 開始回推薦流程
async function startReplyProcess(originalRecId, recommenderId, recommenderName, recommenderEmail, isRegistered) {
    console.log("🚀 startReplyProcess 參數檢查:", {
        originalRecId, recommenderId, recommenderName, recommenderEmail, isRegistered
    });
    
    if (isRegistered && (!recommenderId || recommenderId === '' || recommenderId === 'null')) {
        console.error("❌ 已註冊用戶但 recommenderId 無效:", recommenderId);
        showToast(t('profileDashboard.recommenderDataError'));
        return;
    }
    
    try {
        const originalRec = window.profile.recommendations.find(rec => rec.id === originalRecId);
        if (!originalRec) {
            showToast(t('profileDashboard.originalRecommendationNotFound'));
            return;
        }
        
        const lang = localStorage.getItem("lang") || "zh-Hant";
        
        const inviteData = {
            userId: window.profile.userId,
            jobId: originalRec.jobId,
            type: "reply",
            mode: "reply",
            originalRecommendationId: originalRecId,
            targetName: recommenderName,
            targetEmail: recommenderEmail,
            recommenderName: window.profile.name,
            recommenderUserId: window.profile.userId,
            company: window.currentReplyContext?.job?.company || '',
            position: window.currentReplyContext?.job?.position || '',
            lang: lang,
            createdAt: new Date(),
            status: "pending"
        };
        
        if (isRegistered && recommenderId) {
            inviteData.targetUserId = recommenderId;
        }
        
        const replyInviteRef = await db.collection("invites").add(inviteData);
        const inviteId = replyInviteRef.id;

        let targetUrl = `/pages/recommend-form.html` +
            `?inviteId=${inviteId}` +
            `&mode=reply` +
            `&originalRecId=${originalRecId}` +
            `&prefillName=${encodeURIComponent(recommenderName)}` +
            `&prefillEmail=${encodeURIComponent(recommenderEmail)}` +
            `&jobId=${encodeURIComponent(window.currentReplyContext?.job?.id || '')}` +
            `&lang=${lang}`;
        
        if (isRegistered && recommenderId) {
            targetUrl += `&targetUserId=${recommenderId}`;
        } else {
            targetUrl += `&unregistered=true`;
        }
        
        // 關閉選擇 Modal
        document.getElementById("replyModal").close();
        
        const message = isRegistered ? t('profileDashboard.openingReplyForm') : t('profileDashboard.openingUnregisteredReplyForm');
        showToast(message);
        smartOpenRecommendation(targetUrl, t('profileDashboard.replyFormTitle'));
        
    } catch (error) {
        console.error("❌ 建立回推薦邀請失敗:", error);
        showToast(t('profileDashboard.createInviteError'));
    }
}

// ========================================
// 5️⃣ 事件處理函式
// ========================================

// ✨ 個人檔案編輯事件
function bindProfileEditEvents(userRef, profile) {
    const profileEditModal = document.getElementById('profileEditModal');
    const profileEditForm = document.getElementById('profileEditForm');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const saveChangesBtn = document.getElementById('save-changes-btn');

    function bindOpenModalButton() {
        const btn = document.getElementById('open-edit-modal-btn');
        if (btn) {
            btn.onclick = () => {
                // 填入現有資料
                document.getElementById('edit-english-name').value = profile.englishName || '';
                document.getElementById('edit-headline').value = profile.headline || '';
                document.getElementById('edit-bio').value = profile.bio || '';
                
                // 🆕 強制刷新 Modal 翻譯
                forceRefreshModalTranslations('profileEditModal');
                
                profileEditModal.showModal();
            };
        }
    }

    bindOpenModalButton();

    // 取消按鈕事件
    if (cancelEditBtn) {
        cancelEditBtn.onclick = () => profileEditModal.close();
    }

    // 表單提交事件（保持原有邏輯）
    if (profileEditForm) {
        profileEditForm.onsubmit = async (e) => {
            e.preventDefault();
            saveChangesBtn.disabled = true;
            
            const savingText = window.t ? window.t('profileDashboard.saving') : 'Saving...';
            saveChangesBtn.textContent = savingText;

            const dataToUpdate = {
                englishName: document.getElementById('edit-english-name').value.trim(),
                headline: document.getElementById('edit-headline').value.trim(),
                bio: document.getElementById('edit-bio').value.trim(),
            };

            try {
                await userRef.update(dataToUpdate);
                Object.assign(profile, dataToUpdate);

                renderBasicInfo(profile);
                renderBioSection(profile);
                bindOpenModalButton();

                const successMsg = window.t ? window.t('profileDashboard.updateSuccess') : '✅ Update successful!';
                showToast(successMsg);
                profileEditModal.close();

            } catch (error) {
                console.error("更新檔案失敗:", error);
                const errorMsg = window.t ? 
                    `${window.t('profileDashboard.updateFailed')} ${error.message}` : 
                    `❌ Update failed: ${error.message}`;
                showToast(errorMsg);
            } finally {
                saveChangesBtn.disabled = false;
                const saveText = window.t ? window.t('profileDashboard.saveChanges') : 'Save Changes';
                saveChangesBtn.textContent = saveText;
            }
        };
    }
}

// ✨ 回推薦Modal事件
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
                
                startReplyProcess(recId, recommenderId, recommenderName, recommenderEmail, isRegistered);
            }
        });
    }
}

// 函式二：處理新用戶引導彈窗的提交事件
async function handleOnboardingSubmit(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;

    // 1. 收集姓名資料
    window.profile.name = document.getElementById('onboarding-name').value.trim();
    window.profile.englishName = document.getElementById('onboarding-english-name').value.trim();

    // 2. 收集工作經歷資料
    const company = document.getElementById('onboarding-company').value.trim();
    const position = document.getElementById('onboarding-position').value.trim();
    const startYear = document.getElementById('onboarding-startYear').value;
    const startMonth = document.getElementById('onboarding-startMonth').value;
    const isStillWorking = document.getElementById('onboarding-stillWorking').checked;
    const endYear = isStillWorking ? "" : document.getElementById('onboarding-endYear').value;
    const endMonth = isStillWorking ? "" : document.getElementById('onboarding-endMonth').value;

    if (!window.profile.name || !company || !position || !startYear || !startMonth) {
        alert("請填寫所有必填欄位！");
        btn.disabled = false;
        return;
    }

    const jobData = {
        id: Date.now().toString(),
        company,
        position,
        startDate: `${startYear}-${startMonth}`,
        endDate: (endYear && endMonth) ? `${endYear}-${endMonth}` : "",
        description: "", // 首次引導可留空
    };

    window.profile.workExperiences.push(jobData);

    // 3. 儲存到 Firestore
    await saveProfile();
    
    // 4. 更新儀表板畫面並關閉彈窗
    renderBasicInfo(window.profile);
    const experienceListContainer = document.getElementById("experienceList");
    if (experienceListContainer) {
        renderExperienceCardsWithReply(experienceListContainer, window.profile);
    }
    document.getElementById('onboardingModal').close();
    showToast("歡迎！您的基本資料已儲存。");
    btn.disabled = false;
}

// ✨ 回覆選項Modal事件
function initializeReplyOptionsModal() {
    const replyOptionsCloseBtn = document.getElementById("replyOptionsCloseBtn");
    if (replyOptionsCloseBtn) {
        replyOptionsCloseBtn.onclick = () => {
            document.getElementById("replyOptionsModal").close();
        };
    }
    
    const replyOptionsModal = document.getElementById("replyOptionsModal");
    if (replyOptionsModal) {
        replyOptionsModal.addEventListener("click", (e) => {
            // 推薦回覆選項
            if (e.target.closest('[data-option="recommend"]')) {
                console.log("📝 用戶選擇推薦回覆");
                trackEvent('reply_option_selected', { type: 'recommend' });
                document.getElementById("replyOptionsModal").close();
                showTraditionalReplyModal();
            }
            // 咖啡感謝選項
            else if (e.target.closest('[data-option="coffee"]')) {
                console.log("☕ 用戶點擊咖啡感謝選項");
                trackEvent('coffee_option_clicked', { 
                    jobId: window.currentReplyContext?.job?.id,
                    availableCount: window.currentReplyContext?.availableRecommendations?.length
                });
                document.getElementById("replyOptionsModal").close();
                document.getElementById("waitlistModal").showModal();
            }
        });
    }
}

// ✨ 傳統回推薦Modal
function showTraditionalReplyModal() {
    const context = window.currentReplyContext;
    if (!context) return;
    
    const replyList = document.getElementById("replyList");
    replyList.innerHTML = "";
    
    const canReplyRecommendations = context.availableRecommendations.filter(rec => {
        const currentJobId = context.job.id;
        
        if (!window.profile.recommendations || !Array.isArray(window.profile.recommendations)) {
            return true;
        }
        
        // 檢查是否已在當前工作推薦過此人
        const alreadyRepliedInCurrentJob = window.profile.recommendations.some(myRec => 
            myRec.type === 'reply' &&
            (myRec.jobId === currentJobId || myRec.matchedJobId === currentJobId) &&
            (
                (rec.recommenderId && myRec.targetUserId === rec.recommenderId) ||
                (rec.email && myRec.targetEmail === rec.email.toLowerCase())
            )
        );
        
        const alreadyRecommendedInCurrentJob = window.profile.recommendations.some(myRec => 
            myRec.type === 'outgoing' &&
            (myRec.jobId === currentJobId || myRec.matchedJobId === currentJobId) &&
            (
                (rec.recommenderId && myRec.targetUserId === rec.recommenderId) ||
                (rec.email && myRec.recommendeeEmail === rec.email.toLowerCase())
            )
        );
        
        const alreadyInCurrentJobRecords = context.job.recommendations?.some(workRec => 
            (rec.recommenderId && workRec.targetUserId === rec.recommenderId) ||
            (rec.email && workRec.recommendeeEmail === rec.email.toLowerCase())
        ) || false;
        
        const alreadyProcessedInCurrentJob = alreadyRepliedInCurrentJob || 
                                            alreadyRecommendedInCurrentJob || 
                                            alreadyInCurrentJobRecords;
        
        return !alreadyProcessedInCurrentJob;
    });
    
    canReplyRecommendations.forEach(rec => {
        const listItem = document.createElement("div");
        listItem.className = "reply-item";
        
        const recommenderId = rec.recommenderId;
        const isRegistered = recommenderId !== null && recommenderId !== undefined && recommenderId !== '';
        
        const verificationBadge = getVerificationBadge(rec);
        const relationLabel = t(`relations.${rec.relation}`, rec.relation || "同事");
        const registrationBadge = isRegistered 
            ? `<span class="registered-badge">${t('profileDashboard.registeredBadgeText')}</span>`
            : `<span class="unregistered-badge">${t('profileDashboard.unregisteredBadgeText')}</span>`;
        
        const buttonHtml = `
            <button class="action-btn primary reply-to-person-btn" 
                    data-rec-id="${rec.id}" 
                    data-recommender-id="${recommenderId || ''}"
                    data-recommender-name="${rec.name}"
                    data-recommender-email="${rec.email || ''}"
                    data-is-registered="${isRegistered}">
                📝 ${t('profileDashboard.startReply')}
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
                <p>${t('profileDashboard.noReplyAvailable')}</p>
                <p>${t('profileDashboard.allReplied')}</p>
            </div>
        `;
    }
    
    document.getElementById("replyModal").showModal();
}

// ✨ 等候清單Modal
function initializeWaitlistModal() {
    const waitlistCloseBtn = document.getElementById("waitlistCloseBtn");
    if (waitlistCloseBtn) {
        waitlistCloseBtn.onclick = () => {
            document.getElementById("waitlistModal").close();
        };
    }
    
    const waitlistForm = document.getElementById("waitlistForm");
    if (waitlistForm) {
        waitlistForm.onsubmit = async (e) => {
            e.preventDefault();
            
            const email = document.getElementById("waitlistEmail").value;
            const preference = document.getElementById("coffeePreference").value;
            
            try {
                await db.collection("coffeeWaitlist").add({
                    email: email,
                    preference: preference,
                    createdAt: new Date(),
                    source: "reply_modal",
                    userId: window.profile.userId,
                    jobContext: window.currentReplyContext?.job?.company
                });
                
                trackEvent('waitlist_signup', { 
                    preference: preference,
                    source: 'reply_modal'
                });
                
                showToast(t('profileDashboard.waitlistSignupSuccess'));
                document.getElementById("waitlistModal").close();
                waitlistForm.reset();
                
            } catch (error) {
                console.error("❌ 加入等候清單失敗:", error);
                showToast(t('profileDashboard.waitlistSignupError'));
            }
        };
    }
}

// ✨ 新增工作經歷Modal
function openModalForAdd() {
    const modalTitle = document.getElementById("modalTitle");
    const expForm = document.getElementById("expForm");
    const expModal = document.getElementById("expModal");
    document.getElementById("editLockHint").classList.add("hidden");
    if (modalTitle) modalTitle.textContent = t('profileDashboard.addExperienceTitle');
    if (expForm) expForm.reset();
    editIdx = -1;
    lockCoreFields(false);
    
    // 🆕 強制刷新翻譯
    setTimeout(() => {
        forceRefreshModalTranslations('expModal');
    }, 0);
    
    if (expModal) expModal.showModal();
}

// ✨ 編輯工作經歷Modal
function openModalForEdit(idx) {
    const job = window.profile.workExperiences[idx];
    const modalTitle = document.getElementById("modalTitle");
    const expModal = document.getElementById("expModal");
    
    if (modalTitle) modalTitle.textContent = t('profileDashboard.editExperienceTitle');
    
    // --- 填入現有資料 (此部分邏輯不變) ---
    const companyInp = document.getElementById("companyInput");
    const positionInp = document.getElementById("positionInput");
    const startY = document.getElementById("startYear");
    const startM = document.getElementById("startMonth");
    const endY = document.getElementById("endYear");
    const endM = document.getElementById("endMonth");
    const stillChk = document.getElementById("stillWorking");
    const descInp = document.getElementById("descInput");
    
    if (companyInp) companyInp.value = job.company || "";
    if (positionInp) positionInp.value = job.position || "";
    if (descInp) descInp.value = job.description || "";
    
    if (job.startDate) {
        const [startYear, startMonth] = job.startDate.split("-");
        if (startY) startY.value = startYear;
        if (startM) startM.value = startMonth;
    }
    
    if (job.endDate) {
        const [endYear, endMonth] = job.endDate.split("-");
        if (endY) endY.value = endYear;
        if (endM) endM.value = endMonth;
        if (stillChk) stillChk.checked = false;
    } else {
        if (stillChk) stillChk.checked = true;
        if (endY) endY.value = "";
        if (endM) endM.value = "";
    }
    
    // ✨ --- 核心修改 --- ✨
    // 1. 檢查這份工作是否有已驗證的推薦 (job.verified > 0)。
    //    `job.verified` 的值是在 `loadUserRecommendations` 函式中計算並賦予的。
    const shouldLock = job.verified && job.verified > 0;
    const lockHint = document.getElementById("editLockHint");
    if (lockHint) {
        lockHint.classList.toggle("hidden", !shouldLock);
    }
    editIdx = idx;
    
    // 2. 將檢查結果 (true/false) 傳遞給 lockCoreFields 函式。
    lockCoreFields(shouldLock);
    setTimeout(() => {
        forceRefreshModalTranslations('expModal');
    }, 0);
    if (expModal) expModal.showModal();
}

// ✨ 鎖定核心欄位
function lockCoreFields(shouldLock) {
    const companyInp = document.getElementById("companyInput");
    const positionInp = document.getElementById("positionInput"); // 職位輸入欄
    const startY = document.getElementById("startYear");
    const startM = document.getElementById("startMonth");
    
    // ✨ --- 核心修改 --- ✨
    // 現在，公司、職位、開始日期都會根據 shouldLock 的值 (true/false) 來決定是否禁用。
    if (companyInp) companyInp.disabled = shouldLock;
    if (positionInp) positionInp.disabled = shouldLock; // <--- 已將此欄位加入鎖定 logique
    if (startY) startY.disabled = shouldLock;
    if (startM) startM.disabled = shouldLock;
}

// ✨ 解鎖所有欄位
function unlockAllFields() {
    const companyInp = document.getElementById("companyInput");
    const positionInp = document.getElementById("positionInput");
    const startY = document.getElementById("startYear");
    const startM = document.getElementById("startMonth");
    const endY = document.getElementById("endYear");
    const endM = document.getElementById("endMonth");
    
    if (companyInp) companyInp.disabled = false;
    if (positionInp) positionInp.disabled = false;
    if (startY) startY.disabled = false;
    if (startM) startM.disabled = false;
    if (endY) endY.disabled = false;
    if (endM) endM.disabled = false;
}

// ========================================
// 6️⃣ 輔助工具函式
// ========================================

// ✨ 驗證狀態徽章
function getVerificationBadge(rec) {
    if (rec.status === 'verified' && (rec.confidence || 0) > 0) {
        return `<span class="verified-badge">${t('profileDashboard.verifiedBadgeText')}</span>`;
    } else {
        return '';
    }
}

// ✨ 事件追蹤
function trackEvent(eventName, properties = {}) {
    console.log("📊 追蹤事件:", eventName, properties);
    
    const events = JSON.parse(localStorage.getItem("replyAnalytics") || "[]");
    events.push({
        event: eventName,
        properties: properties,
        timestamp: new Date().toISOString(),
        userId: window.profile.userId
    });
    
    if (events.length > 100) {
        events.splice(0, events.length - 100);
    }
    
    localStorage.setItem("replyAnalytics", JSON.stringify(events));
}

// ✨ 調試函數
function debugRecommendationData() {
    console.log("🔍 === 推薦數據調試 ===");
    console.log("Profile:", window.profile);
    console.log("推薦記錄總數:", window.profile.recommendations?.length || 0);
    console.log("工作經歷數:", window.profile.workExperiences?.length || 0);
    
    if (window.profile.recommendations) {
        console.log("📊 推薦記錄詳情:");
        window.profile.recommendations.forEach((rec, index) => {
            console.log(`${index + 1}. ${rec.name}:`, {
                id: rec.id,
                jobId: rec.jobId,
                type: rec.type,
                hasReplied: rec.hasReplied,
                recommenderId: rec.recommenderId,
                isRegistered: rec.recommenderId !== null
            });
        });
    }
}

// ✨ Firebase 等待函數
function waitForFirebase() {
    return new Promise((resolve, reject) => {
        console.log("🔍 檢查 Firebase 狀態...");
        
        if (typeof firebase === 'undefined') {
            console.error("❌ Firebase SDK 未載入");
            reject(new Error(t('profileDashboard.firebaseSDKNotLoaded')));
            return;
        }
        
        if (window.firebaseReady) {
            try {
                app = window.firebaseApp || firebase.app();
                auth = firebase.auth();
                db = firebase.firestore();
                console.log("✅ Firebase 已準備就緒");
                resolve();
            } catch (error) {
                console.error("❌ Firebase 服務初始化失敗:", error);
                reject(error);
            }
            return;
        }
        
        if (window.firebaseError) {
            reject(window.firebaseError);
            return;
        }
        
        try {
            app = firebase.app();
            auth = firebase.auth();
            db = firebase.firestore();
            console.log("✅ 直接使用現有 Firebase 實例");
            resolve();
            return;
        } catch (directInitError) {
            console.log("⚠️ 無法直接使用 Firebase，等待初始化事件...");
        }
        
        const onReady = (event) => {
            try {
                app = event.detail.app || firebase.app();
                auth = firebase.auth();
                db = firebase.firestore();
                console.log("✅ Firebase 初始化完成事件收到");
                cleanup();
                resolve();
            } catch (error) {
                console.error("❌ 事件處理中的錯誤:", error);
                cleanup();
                reject(error);
            }
        };
        
        const onError = (event) => {
            console.error("❌ Firebase 初始化失敗事件收到:", event.detail.error);
            cleanup();
            reject(event.detail.error);
        };
        
        const cleanup = () => {
            window.removeEventListener('firebaseReady', onReady);
            window.removeEventListener('firebaseError', onError);
            if (timeoutId) clearTimeout(timeoutId);
        };
        
        window.addEventListener('firebaseReady', onReady);
        window.addEventListener('firebaseError', onError);
        
        const timeoutId = setTimeout(() => {
            cleanup();
            
            try {
                app = firebase.app();
                auth = firebase.auth();
                db = firebase.firestore();
                console.log("✅ 超時後成功獲取 Firebase 實例");
                resolve();
            } catch (finalError) {
                console.error("❌ 最終嘗試失敗:", finalError);
                reject(new Error(t('profileDashboard.firebaseInitTimeout')));
            }
        }, 15000);
    });
}

// ========================================
// 7️⃣ 主要初始化流程（Gemini 優化版本）
// ========================================

document.addEventListener("DOMContentLoaded", async () => {
    console.log("🚀 DOMContentLoaded 觸發");
    
    try {
        // 🕒 顯示載入中遮罩
        document.getElementById("dashboardLoading").style.display = "flex";
        
        // 🔥 等待 Firebase 初始化完成（使用 Gemini 建議的方式）
        await window.firebasePromise;
        app = firebase.app();
        auth = firebase.auth();
        db = firebase.firestore();
        console.log("✅ Firebase 初始化完成");

        // 🌍 語言切換事件監聽
        window.addEventListener("langChanged", () => {
            // `setLang` 已經處理了所有 `data-i18n` 和 `data-i18n-placeholder`
            // 所以我們只需要處理動態和複雜的內容
            updateOnboardingText();

            // 🆕 刷新 Modal 翻譯
            setTimeout(() => {
                forceRefreshModalTranslations();
            }, 100);
            
            // 重新渲染動態內容
            const list = document.getElementById("experienceList");
            if (list && window.profile) {
                renderExperienceCardsWithReply(list, window.profile);
            }
            
            // 更新 placeholder
            const inviteTextarea = document.getElementById('inviteTextarea');
            if (inviteTextarea) {
                inviteTextarea.setAttribute("placeholder", t('profileDashboard.invitePlaceholder'));
            }
        });

        // 📋 初始化 UI 組件
        populateYearMonth();

        // 🔽 當使用者登入後的處理流程
        auth.onAuthStateChanged(async user => {
            try {
                if (!user) {
                    console.log("使用者未登入，正在導向登入頁...");
                    if (!window.location.pathname.includes('login.html')) {
                        window.location.href = "/pages/login.html";
                    }
                    return;
                }
                
                console.log("使用者已登入，ID:", user.uid);
                
                // 🔧 設定使用者 ID
                window.profile.userId = user.uid;
                
                // 📥 從 Firestore 讀取使用者資料
                const userRef = db.collection("users").doc(user.uid);
                const docSnap = await userRef.get();

                const docExists = typeof docSnap.exists === 'function' ? docSnap.exists() : docSnap.exists;

                if (docExists) { 
                    Object.assign(window.profile, docSnap.data());
                    console.log("成功從 Firestore 載入使用者資料");
                } else {
                    console.log("建立新的使用者資料");
                    const newProfileData = {
                        name: user.displayName || t("profileDashboard.newUser"),
                        email: user.email,
                        createdAt: new Date(),
                        isPublicProfile: true,
                        workExperiences: [],
                        recommendationStats: { exp: 0, totalReceived: 0, totalGiven: 0 },
                        settings: { showLevelOnPublicProfile: true }
                    };
                    await userRef.set(newProfileData);
                    Object.assign(window.profile, newProfileData);
                }

                if (!Array.isArray(window.profile.workExperiences)) {
                    window.profile.workExperiences = Object.values(window.profile.workExperiences || {});
                }

                const isNewUserSetupRequired = !window.profile.name || (window.profile.workExperiences || []).length === 0;

                if (isNewUserSetupRequired) {
                    console.log("ℹ️ 偵測到新用戶或資料不完整的用戶，開啟引導彈窗。");
                    populateOnboardingYearMonth(); 
                    forceRefreshModalTranslations('onboardingModal'); // 確保 modal 翻譯正確
                    document.getElementById('onboardingModal').showModal();
                }

                // --- 🎨 渲染所有 UI 組件 ---
                renderBasicInfo(window.profile);
                renderBioSection(window.profile);
                
                await loadUserRecommendations(window.profile.userId);
                const stats = window.profile.recommendationStats || {};
                const totalReceived = stats.totalReceived || 0;
                const totalGiven = stats.totalGiven || 0;

                const hasAnyVerifiedRec = totalReceived > 0 || totalGiven > 0;
                const quickStartCard = document.getElementById('quickStartCard');

                if (hasAnyVerifiedRec) {
                    // 如果有已驗證推薦，就隱藏卡片
                    quickStartCard.style.display = 'none';
                    quickStartCard.classList.remove('show'); // 同時移除 show class
                } else {
                    // 如果沒有，才顯示卡片
                    console.log("ℹ️ 使用者尚無推薦紀錄，準備顯示新手引導卡。");
                    updateOnboardingText();
                    // 為了讓 CSS 動畫更流暢，可以稍微延遲一下再加入 'show' class
                    setTimeout(() => {
                        quickStartCard.classList.add('show');
                    }, 100); // 延遲 100 毫秒
                }
                const experienceListContainer = document.getElementById("experienceList");
                if (experienceListContainer) {
                    renderExperienceCardsWithReply(experienceListContainer, window.profile);
                }

                const userExp = window.profile.recommendationStats?.exp || 0;
                renderUserLevel(userExp);
                
                bindProfileEditEvents(userRef, window.profile);
                
                const actionBtns = document.getElementById("actionBtns");
                if (actionBtns) {
                    actionBtns.innerHTML = '';
                    actionBtns.classList.add("btn-group");

                    const addBtn = document.createElement("button");
                    addBtn.id = "addBtn";
                    addBtn.type = "button";
                    addBtn.className = "btn cta-btn";
                    addBtn.setAttribute("data-i18n", "profileDashboard.addExperience");
                    addBtn.innerText = t('profileDashboard.addExperience');
                    addBtn.onclick = () => openModalForAdd();
                    actionBtns.appendChild(addBtn);

                    const summaryBtn = document.createElement("button");
                    summaryBtn.type = "button";
                    summaryBtn.className = "btn cta-btn";
                    summaryBtn.setAttribute("data-i18n", "profileDashboard.viewSummaryAll");
                    summaryBtn.innerText = t('profileDashboard.viewSummaryAll');
                    summaryBtn.addEventListener("click", () => {
                        const url = `/pages/recommend-summary.html?userId=${window.profile.userId}&jobIndex=0`;
                        smartOpenRecommendation(url, t('profileDashboard.recommendSummaryTitle'));
                    });
                    actionBtns.appendChild(summaryBtn);

                    const previewBtn = document.createElement("button");
                    previewBtn.type = "button";
                    previewBtn.className = "btn cta-btn";
                    previewBtn.setAttribute("data-i18n", "profileDashboard.viewPublicSummary");
                    previewBtn.innerText = t('profileDashboard.viewPublicSummary');
                    previewBtn.addEventListener("click", () => {
                        const url = `/pages/public-profile.html?userId=${window.profile.userId}`;
                        smartOpenRecommendation(url, t('profileDashboard.publicSummaryTitle'));
                    });
                    actionBtns.appendChild(previewBtn);
                }

                bindExperienceListEvents(t);
                bindExperienceFormEvents();
                bindModalCloseEvents();
                bindOnboardingEvents();

                const searchInput = document.getElementById('headerSearchInput');
                if (searchInput) {
                    searchInput.placeholder = window.t('header.searchPlaceholder');
                }
                
                // 由於 setLang 可能在 profile 物件完全載入前執行，這裡可以再手動調用一次確保所有內容更新
                if (window.setLang) {
                    window.setLang(localStorage.getItem("lang") || "zh-Hant");
                }
                
                document.getElementById("dashboardLoading").style.display = "none";
                console.log("✅ 儀表板初始化完成！");

            } catch (error) {
                console.error("❌ 在 onAuthStateChanged 流程中發生錯誤:", error);
                document.getElementById("dashboardLoading").innerHTML = `
                    <div style="padding: 2rem; text-align: center;">
                        <h2>${t('profileDashboard.loadingError')}</h2>
                        <p>${t('profileDashboard.loadingErrorDesc')}</p>
                        <p style="font-size: 0.8em; color: grey;">${t('profileDashboard.errorDetails')}: ${error.message}</p>
                        <button onclick="location.reload()" style="padding: 10px 20px; border-radius: 5px; cursor: pointer;">${t('profileDashboard.refreshPage')}</button>
                    </div>
                `;
            }
        });

        bindReplyModalEvents();
        initializeReplyOptionsModal();
        initializeWaitlistModal();

    } catch (error) {
        console.error("❌ 頁面初始化失敗:", error);
        document.getElementById("dashboardLoading").innerHTML = `
            <div style="padding: 2rem; text-align: center;">
                <h2>${t('profileDashboard.systemInitError')}</h2>
                <p>${error.message}</p>
                <button onclick="location.reload()" style="padding: 10px 20px; border-radius: 5px; cursor: pointer;">${t('profileDashboard.refreshPage')}</button>
            </div>
        `;
    }
});

// ========================================
// 🎯 事件綁定輔助函數
// ========================================

// 🎯 綁定工作經歷列表事件
function bindExperienceListEvents(t) {
    const experienceList = document.getElementById("experienceList");
    if (experienceList) {
        experienceList.addEventListener("click", (e) => {
            if (e.target.closest(".edit-btn")) {
                const idx = parseInt(e.target.closest(".edit-btn").dataset.idx);
                openModalForEdit(idx);
            }
            
            else if (e.target.closest(".del-btn")) {
                const idx = parseInt(e.target.closest(".del-btn").dataset.idx);
                if (confirm(t('profileDashboard.deleteConfirm'))) {
                    window.profile.workExperiences.splice(idx, 1);
                    saveProfile();
                    renderExperienceCardsWithReply(experienceList, window.profile);
                    showToast(t('profileDashboard.deleted'));
                }
            }
            
            else if (e.target.closest(".recommend-others-btn")) {
                const idx = parseInt(e.target.closest(".recommend-others-btn").dataset.idx);
                handleRecommendOthers(idx);
            }
            
            else if (e.target.closest(".reply-btn")) {
                const idx = parseInt(e.target.closest(".reply-btn").dataset.idx);
                handleReplyRecommendation(idx);
            }
            
else if (e.target.closest(".link-btn")) {
    const idx = parseInt(e.target.closest(".link-btn").dataset.idx);
    const job = window.profile.workExperiences[idx];
    const user = window.profile;
    const t = getTranslationFunction();

    const inviteModal = document.getElementById("inviteModal");
    const messageTextarea = document.getElementById("inviteTextarea");
    const templateButtonsContainer = document.getElementById("message-templates");
    const inviteCancelBtn = document.getElementById("inviteCancelBtn");
    const inviteSaveBtn = document.getElementById("inviteSaveBtn");
    const previewLinkEl = document.getElementById("invitePreviewLink");

    if (!inviteModal || !messageTextarea || !templateButtonsContainer || !inviteSaveBtn) {
        console.error("❌ 邀請 Modal 的部分關鍵元素不存在，無法開啟。");
        showToast("邀請功能暫時無法使用，請稍後再試");
        return;
    }

    const generatePreviewUrl = () => {
        const message = messageTextarea.value.trim();
        const jobId = encodeURIComponent(job.id);
        const encMsg = encodeURIComponent(message);
        const lang = localStorage.getItem("lang") || "zh-Hant";
        
        return `${location.origin}/pages/recommend-form.html` +
            `?userId=${window.profile.userId}` +
            `&jobId=${jobId}` +
            `&message=${encMsg}` +
            `&lang=${lang}` +
            `&invitedBy=${window.profile.userId}`;
    };

    const updatePreviewLink = () => {
        if (previewLinkEl) {
            const url = generatePreviewUrl();
            previewLinkEl.setAttribute("href", url);
            previewLinkEl.title = url;
            previewLinkEl.textContent = t('profileDashboard.previewLink') || '🔍 預覽推薦表單';
        }
    };
    
    const templates = [
        {
            name: t("profileDashboard.inviteTemplates.inviteSenior.name"),
            message: t("profileDashboard.inviteTemplates.inviteSenior.message", {
                company: job.company || t('profileDashboard.unknownCompany'),
                userName: user.name,
                "對方姓名": "{對方姓名}"
            })
        },
        {
            name: t("profileDashboard.inviteTemplates.invitePeer.name"),
            message: t("profileDashboard.inviteTemplates.invitePeer.message", {
                company: job.company || t('profileDashboard.unknownCompany'),
                userName: user.name,
                "對方姓名": "{對方姓名}"
            })
        },
        {
            name: t("profileDashboard.inviteTemplates.inviteJunior.name"),
            message: t("profileDashboard.inviteTemplates.inviteJunior.message", {
                company: job.company || t('profileDashboard.unknownCompany'),
                userName: user.name,
                "對方姓名": "{對方姓名}"
            })
        }
    ];

    templateButtonsContainer.innerHTML = '';
    templates.forEach(template => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'template-btn';
        button.textContent = template.name;
        button.onclick = () => {
            messageTextarea.value = template.message;
            updatePreviewLink();
        };
        templateButtonsContainer.appendChild(button);
    });
    
    if (inviteCancelBtn) {
        inviteCancelBtn.onclick = () => inviteModal.close();
    }
    
    messageTextarea.addEventListener("input", updatePreviewLink);
    
    if (inviteSaveBtn) {
        inviteSaveBtn.onclick = async () => {
            const message = messageTextarea.value.trim();
            if (!message) {
                showToast(t('profileDashboard.inviteEmpty'));
                return;
            }

            try {
                const inviteRef = await db.collection("invites").add({
                    userId: window.profile.userId,
                    jobId: job.id,
                    message: message,
                    lang: localStorage.getItem("lang") || "zh-Hant",
                    invitedBy: window.profile.userId,
                    createdAt: new Date()
                });

                const finalLink = `${location.origin}/pages/recommend-form.html?inviteId=${inviteRef.id}`;
                
                let copySuccess = false;
                if (navigator.clipboard && window.isSecureContext) {
                    try {
                        await navigator.clipboard.writeText(finalLink);
                        copySuccess = true;
                    } catch (err) { /* fallback */ }
                }
                
                if (!copySuccess) {
                    const tempInput = document.createElement('input');
                    tempInput.value = finalLink;
                    document.body.appendChild(tempInput);
                    tempInput.select();
                    copySuccess = document.execCommand('copy');
                    document.body.removeChild(tempInput);
                }
                
                if (copySuccess) {
                    showToast(t('profileDashboard.inviteLinkCopied') || '✅ 邀請連結已複製！');
                    inviteModal.close();
                } else {
                    showManualCopyModal(finalLink);
                }

            } catch (err) {
                console.error("❌ 建立邀請失敗:", err);
                showToast(t('profileDashboard.inviteCreateFailed') || '❌ 建立邀請失敗');
            }
        };
    }

    messageTextarea.value = "";
    updatePreviewLink();

    inviteModal.showModal();

}
});
    }
}
// 🎯 綁定工作經歷表單事件
function bindExperienceFormEvents() {
    const expForm = document.getElementById("expForm");
    const expCancelBtn = document.getElementById("expCancelBtn");
    if(expCancelBtn){
        expCancelBtn.onclick = () => {
            unlockAllFields();
            document.getElementById("expModal").close();
        }
    }
    if (expForm) {
        expForm.onsubmit = async (e) => {
            e.preventDefault();
            
            const companyInp = document.getElementById("companyInput");
            const positionInp = document.getElementById("positionInput");
            const startY = document.getElementById("startYear");
            const startM = document.getElementById("startMonth");
            const endY = document.getElementById("endYear");
            const endM = document.getElementById("endMonth");
            const stillChk = document.getElementById("stillWorking");
            const descInp = document.getElementById("descInput");
            
            const company = companyInp?.value.trim();
            const position = positionInp?.value.trim();
            const startYear = startY?.value;
            const startMonth = startM?.value;
            const endYear = stillChk?.checked ? "" : (endY?.value || "");
            const endMonth = stillChk?.checked ? "" : (endM?.value || "");
            const description = descInp?.value.trim();

            if (!company || !position || !startYear || !startMonth) {
                showToast(t('profileDashboard.requiredFieldsEmpty'));
                return;
            }

            const startDate = `${startYear}-${startMonth}`;
            const endDate = (endYear && endMonth) ? `${endYear}-${endMonth}` : "";

            const jobData = {
                id: editIdx === -1 ? Date.now().toString() : window.profile.workExperiences[editIdx].id,
                company,
                position,
                startDate,
                endDate,
                description,
                givenCount: editIdx === -1 ? 0 : (window.profile.workExperiences[editIdx].givenCount || 0),
                recommendations: editIdx === -1 ? [] : (window.profile.workExperiences[editIdx].recommendations || [])
            };

            if (editIdx === -1) {
                window.profile.workExperiences.push(jobData);
            } else {
                window.profile.workExperiences[editIdx] = jobData;
            }

            await saveProfile();
            await loadUserRecommendations(window.profile.userId);
            
            const experienceListContainer = document.getElementById("experienceList");
            if (experienceListContainer) {
                renderExperienceCardsWithReply(experienceListContainer, window.profile);
            }
            
            document.getElementById("expModal").close();
            showToast(editIdx === -1 ? t('profileDashboard.addSuccess') : t('profileDashboard.editSuccess'));
            unlockAllFields();
        };
    }
}

// 🎯 綁定 Modal 關閉事件
function bindModalCloseEvents() {
    const expCancelBtn = document.getElementById("expCancelBtn");
    if (expCancelBtn) {
        expCancelBtn.onclick = () => {
            document.getElementById("expModal").close();
            unlockAllFields();
        };
    }
}

// 函式三：綁定新用戶引導彈窗的事件
function bindOnboardingEvents() {
    const onboardingForm = document.getElementById('onboardingForm');
    if (onboardingForm) {
        // 確保只綁定一次
        onboardingForm.removeEventListener('submit', handleOnboardingSubmit);
        onboardingForm.addEventListener('submit', handleOnboardingSubmit);
    }
}

// 🆕 在檔案最後新增手動複製 Modal 函數
function showManualCopyModal(linkToCopy) {
    let copyModal = document.getElementById("manualCopyModal");
    
    if (!copyModal) {
        copyModal = document.createElement("dialog");
        copyModal.id = "manualCopyModal";
        copyModal.className = "modal";
        
        copyModal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <h3>${t('profileDashboard.manualCopyTitle') || '📋 手動複製連結'}</h3>
                <p style="margin-bottom: 1rem; color: #666;">
                    ${t('profileDashboard.manualCopyDesc') || '自動複製失敗，請手動複製以下連結：'}
                </p>
                <div style="display: flex; gap: 8px; margin-bottom: 1rem;">
                    <input 
                        type="text" 
                        id="manualCopyInput" 
                        readonly 
                        style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;"
                        value="${linkToCopy}"
                    />
                    <button 
                        type="button" 
                        id="manualCopyBtn" 
                        class="btn btn-primary"
                        style="white-space: nowrap;"
                    >
                        📋 ${t('profileDashboard.copyBtn') || '複製'}
                    </button>
                </div>
                <div style="display: flex; justify-content: flex-end; gap: 8px;">
                    <button type="button" id="manualCopyCloseBtn" class="btn btn-secondary">
                        ${t('profileDashboard.close') || '關閉'}
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(copyModal);
        
        copyModal.addEventListener('click', (e) => {
            if (e.target.id === 'manualCopyBtn') {
                const input = document.getElementById('manualCopyInput');
                input.select();
                input.setSelectionRange(0, 99999);
                
                try {
                    const successful = document.execCommand('copy');
                    if (successful) {
                        showToast('✅ 連結已複製！');
                        copyModal.close();
                    } else {
                        showToast('請使用 Ctrl+C (或 Cmd+C) 複製');
                    }
                } catch (err) {
                    showToast('請手動選取文字並複製 (Ctrl+C)');
                }
            }
            
            else if (e.target.id === 'manualCopyCloseBtn') {
                copyModal.close();
            }
        });
    } else {
        const input = copyModal.querySelector('#manualCopyInput');
        if (input) input.value = linkToCopy;
    }
    
    copyModal.showModal();
    
    setTimeout(() => {
        const input = document.getElementById('manualCopyInput');
        if (input) {
            input.focus();
            input.select();
        }
    }, 100);
}
// ========================================
// 8️⃣ 程式碼結束標記
// ========================================

console.log("✅ profile-dashboard.js 載入完成");
console.log("📋 可用函式:", {
    渲染函式: ['renderUserLevel', 'renderBasicInfo', 'renderBioSection', 'renderExperienceCardsWithReply'],
    業務邏輯: ['handleRecommendOthers', 'handleReplyRecommendation', 'loadUserRecommendations'],
    事件處理: ['bindProfileEditEvents', 'bindReplyModalEvents', 'initializeReplyOptionsModal'],
    工具函式: ['t', 'showToast', 'smartOpenRecommendation', 'debugRecommendationData']
});