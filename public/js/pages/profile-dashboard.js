// ========================================
// 1️⃣ 常數和全域變數定義
// ========================================

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

// 🌍 簡化的翻譯函數
function t(key, ...args) {
    const translation = getCurrentTranslation();
    
    // 支援巢狀 key，如 "profileDashboard.upgradeHint"
    const keys = key.split('.');
    let value = translation;
    
    for (const k of keys) {
        if (value && typeof value === 'object') {
            value = value[k];
        } else {
            value = undefined;
            break;
        }
    }
    
    // 如果找不到翻譯，返回 key 本身
    if (value === undefined) {
        console.warn(`🌍 Missing translation for key: ${key}`);
        return key;
    }
    
    // 如果是函數（如 upgradeHint），調用它
    if (typeof value === 'function') {
        return value(...args);
    }
    
    return value;
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
            <button id="open-edit-modal-btn" class="icon-btn" title="${t('profileDashboard.editProfileTitle')}">✏️</button>
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
                if (pendingCount > 0 || failedCount > 0) {
                    const hintParts = [
                        pendingCount > 0 ? t('profileDashboard.pending', pendingCount) : '',
                        failedCount > 0 ? t('profileDashboard.failed', failedCount) : ''
                    ].filter(Boolean);
                    pendingHint = `<div class="pending-hint"><small>${t('profileDashboard.pendingHint', hintParts)}</small></div>`;
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
    for (let y = thisYear; y >= thisYear - 40; y--) {
        yrs.push(`<option>${y}</option>`);
    }
    for (let m = 1; m <= 12; m++) {
        const mm = String(m).padStart(2,"0");
        mos.push(`<option value="${mm}">${m}</option>`);
    }
    const startY = document.getElementById("startYear");
    const startM = document.getElementById("startMonth");
    const endY = document.getElementById("endYear");
    const endM = document.getElementById("endMonth");
    const stillChk = document.getElementById("stillWorking");
    const endDateContainer = document.getElementById("endDateContainer");
    
    if (startY) startY.innerHTML = yrs.join("");
    if (endY) endY.innerHTML = yrs.join("");
    if (startM) startM.innerHTML = mos.join("");
    if (endM) endM.innerHTML = mos.join("");
    
    if (stillChk && endDateContainer && endY && endM) {
        stillChk.addEventListener("change", () => {
            const isWorking = stillChk.checked;
            endDateContainer.classList.toggle("hidden", isWorking);
            endY.disabled = endM.disabled = isWorking;
            if (isWorking) endY.value = endM.value = "";
        });
    }
}

// ✨ 靜態文字渲染
function renderStaticText() {
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        const translation = t(`profileDashboard.${key}`);
        if (translation !== key) el.textContent = translation;
    });
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
            
            return matchesJob && isReceived && notReplied;
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
                document.getElementById('edit-english-name').value = profile.englishName || '';
                document.getElementById('edit-headline').value = profile.headline || '';
                document.getElementById('edit-bio').value = profile.bio || '';
                profileEditModal.showModal();
            };
        }
    }

    bindOpenModalButton();

    if (cancelEditBtn) {
        cancelEditBtn.onclick = () => profileEditModal.close();
    }

    if (profileEditForm) {
        profileEditForm.onsubmit = async (e) => {
            e.preventDefault();
            saveChangesBtn.disabled = true;
            saveChangesBtn.textContent = t('profileDashboard.saving');

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

                showToast(t('profileDashboard.updateSuccess'));
                profileEditModal.close();

            } catch (error) {
                console.error("更新檔案失敗:", error);
                showToast(`${t('profileDashboard.updateFailed')} ${error.message}`);
            } finally {
                saveChangesBtn.disabled = false;
                saveChangesBtn.textContent = t('profileDashboard.saveChanges');
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
    
    if (modalTitle) modalTitle.textContent = t('profileDashboard.addExperience');
    if (expForm) expForm.reset();
    editIdx = -1;
    lockCoreFields(false);
    if (expModal) expModal.showModal();
}

// ✨ 編輯工作經歷Modal
function openModalForEdit(idx) {
    const job = window.profile.workExperiences[idx];
    const modalTitle = document.getElementById("modalTitle");
    const expModal = document.getElementById("expModal");
    
    if (modalTitle) modalTitle.textContent = t('profileDashboard.editExperience');
    
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
    
    editIdx = idx;
    
    // 2. 將檢查結果 (true/false) 傳遞給 lockCoreFields 函式。
    lockCoreFields(shouldLock);
    
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
    if (positionInp) positionInp.disabled = shouldLock; // <--- 已將此欄位加入鎖定邏輯
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

        // 🌍 統一的靜態文字渲染函數
        const renderAllStaticText = () => {
            // 處理 data-i18n 屬性
            document.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.getAttribute('data-i18n');
                const translation = t(`profileDashboard.${key}`);
                if (translation !== key) el.textContent = translation;
            });
            
            // 處理 placeholder 屬性
            document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
                const key = el.getAttribute('data-i18n-placeholder');
                const translation = t(`profileDashboard.${key}`);
                if (translation !== key) el.placeholder = translation;
            });
        };

        // 🌍 初始化靜態文字和語言切換
        renderAllStaticText();
        
        // 🌍 語言切換事件監聽
        window.addEventListener("langChanged", () => {
            renderAllStaticText();
            updateOnboardingText();
            
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

                // 🔧 修復：兼容新舊版本的 exists 檢查
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

                // 🔧 確保 workExperiences 是陣列
                if (!Array.isArray(window.profile.workExperiences)) {
                    window.profile.workExperiences = Object.values(window.profile.workExperiences || {});
                }

                // --- 🎨 渲染所有 UI 組件 ---
                renderBasicInfo(window.profile);
                renderBioSection(window.profile);
                
                // 📊 載入推薦資料並渲染
                await loadUserRecommendations(window.profile.userId);
                const stats = window.profile.recommendationStats || {};
                const totalReceived = stats.totalReceived || 0;
                const totalGiven = stats.totalGiven || 0;

                // 條件：只要收到過 或 送出過 任何一筆已驗證的推薦
                const hasAnyVerifiedRec = totalReceived > 0 || totalGiven > 0;
                const quickStartCard = document.getElementById('quickStartCard');

                if (quickStartCard) {
                    if (hasAnyVerifiedRec) {
                // 如果有推薦紀錄，就隱藏卡片
                    quickStartCard.style.display = 'none';
                    } else {
                // 如果沒有推薦紀錄，才顯示卡片
                    console.log("ℹ️ 使用者尚無推薦紀錄，準備顯示新手引導卡。");

                // ✨ 核心修正：在顯示卡片容器前，先呼叫函式填入最新的文字內容
                    updateOnboardingText(); 
        
                // 接著才顯示整個區塊
                    quickStartCard.style.display = 'block'; 
                    }
                }
                const experienceListContainer = document.getElementById("experienceList");
                if (experienceListContainer) {
                    renderExperienceCardsWithReply(experienceListContainer, window.profile);
                }

                // 🏆 渲染等級資訊
                const userExp = window.profile.recommendationStats?.exp || 0;
                renderUserLevel(userExp);
                
                // 🔗 綁定個人檔案編輯事件
                bindProfileEditEvents(userRef, window.profile);
                
                // ✨ 建立主要操作按鈕
                const actionBtns = document.getElementById("actionBtns");
                if (actionBtns) {
                    actionBtns.innerHTML = '';
                    actionBtns.classList.add("btn-group");

                    // ➕ 新增工作經歷按鈕
                    const addBtn = document.createElement("button");
                    addBtn.id = "addBtn";
                    addBtn.type = "button";
                    addBtn.className = "btn cta-btn";
                    addBtn.setAttribute("data-i18n", "addExperience");
                    addBtn.innerText = t('profileDashboard.addExperience');
                    addBtn.onclick = () => openModalForAdd();
                    actionBtns.appendChild(addBtn);

                    // 📄 推薦總覽按鈕
                    const summaryBtn = document.createElement("button");
                    summaryBtn.type = "button";
                    summaryBtn.className = "btn cta-btn";
                    summaryBtn.setAttribute("data-i18n", "viewSummaryAll");
                    summaryBtn.innerText = t('profileDashboard.viewSummaryAll');
                    summaryBtn.addEventListener("click", () => {
                        const url = `/pages/recommend-summary.html?userId=${window.profile.userId}&jobIndex=0`;
                        smartOpenRecommendation(url, t('profileDashboard.recommendSummaryTitle'));
                    });
                    actionBtns.appendChild(summaryBtn);

                    // 🌐 公開推薦頁按鈕
                    const previewBtn = document.createElement("button");
                    previewBtn.type = "button";
                    previewBtn.className = "btn cta-btn";
                    previewBtn.setAttribute("data-i18n", "viewPublicSummary");
                    previewBtn.innerText = t('profileDashboard.viewPublicSummary');
                    previewBtn.addEventListener("click", () => {
                        const url = `/pages/public-profile.html?userId=${window.profile.userId}`;
                        smartOpenRecommendation(url, t('profileDashboard.publicSummaryTitle'));
                    });
                    actionBtns.appendChild(previewBtn);
                }

                // 🎯 綁定工作經歷相關事件
                bindExperienceListEvents(t);
                
                // 🎯 綁定工作經歷表單事件
                bindExperienceFormEvents();

                // 🎯 綁定 Modal 關閉事件
                bindModalCloseEvents();

                // 在所有儀表板內容渲染完成後，強制校準 Header 搜尋欄的 placeholder
                const searchInput = document.getElementById('headerSearchInput');
                if (searchInput) {
                    searchInput.placeholder = window.t('header.searchPlaceholder');
                }
                // 🔄 隱藏載入遮罩
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

        // 🌍 初始化各種 Modal 事件（在 auth 流程外）
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
            // 編輯按鈕
            if (e.target.closest(".edit-btn")) {
                const idx = parseInt(e.target.closest(".edit-btn").dataset.idx);
                openModalForEdit(idx);
            }
            
            // 刪除按鈕
            else if (e.target.closest(".del-btn")) {
                const idx = parseInt(e.target.closest(".del-btn").dataset.idx);
                if (confirm(t('profileDashboard.deleteConfirm'))) {
                    window.profile.workExperiences.splice(idx, 1);
                    saveProfile();
                    renderExperienceCardsWithReply(experienceList, window.profile);
                    showToast(t('profileDashboard.deleted'));
                }
            }
            
            // 推薦他人按鈕
            else if (e.target.closest(".recommend-others-btn")) {
                const idx = parseInt(e.target.closest(".recommend-others-btn").dataset.idx);
                handleRecommendOthers(idx);
            }
            
            // 回推薦按鈕
            else if (e.target.closest(".reply-btn")) {
                const idx = parseInt(e.target.closest(".reply-btn").dataset.idx);
                handleReplyRecommendation(idx);
            }
            
            // 🔧 在新版 profile-dashboard.js 中的 bindExperienceListEvents 函數裡
// 找到 "邀請夥伴推薦功能" 這個 else if 區塊，完全替換成：

// 🔽 邀請夥伴推薦功能 - 完整版
else if (e.target.closest(".link-btn")) {
    const idx = parseInt(e.target.closest(".link-btn").dataset.idx);
    currentJobIndex = idx;
    
    const job = window.profile.workExperiences[idx];
    currentCompany = job.company;
    
    // --- 抓取彈窗和所有內部元素 ---
    const inviteModal = document.getElementById("inviteModal");
    const inviteTextarea = document.getElementById("inviteTextarea");
    const insertDirectBtn = document.getElementById("insertDirect");
    const insertWarmthBtn = document.getElementById("insertWarmth");
    const inviteCancelBtn = document.getElementById("inviteCancelBtn");
    const inviteSaveBtn = document.getElementById("inviteSaveBtn");
    const previewLinkEl = document.getElementById("invitePreviewLink");

    if (!inviteModal || !inviteTextarea) {
        console.error("❌ 邀請 Modal 元素不存在");
        showToast("邀請功能暫時無法使用，請稍後再試");
        return;
    }

    // ✨ --- 核心功能與事件綁定 --- ✨

    // 1. 更新預設邀請文案的函式
    const updateDefaultMessage = (style) => {
        currentInviteStyle = style || "warmth";
        const defaultMsg = t(`profileDashboard.defaultInvite_${currentInviteStyle}`);
        const finalMsg = defaultMsg.replace("{{company}}", currentCompany || t('profileDashboard.unknownCompany'));
        inviteTextarea.value = finalMsg;
        
        // 🆕 更新預覽連結
        updatePreviewLink();
    };

    // 🆕 2. 預覽連結更新函式
    const generatePreviewUrl = () => {
        const message = inviteTextarea.value.trim();
        const jobId = encodeURIComponent(job.id);
        const style = currentInviteStyle || "custom";
        const encMsg = encodeURIComponent(message);
        const lang = localStorage.getItem("lang") || "zh-Hant";
        
        return `${location.origin}/pages/recommend-form.html` +
            `?userId=${window.profile.userId}` +
            `&jobId=${jobId}` +
            `&message=${encMsg}` +
            `&style=${style}` +
            `&lang=${lang}` +
            `&invitedBy=${window.profile.userId}`;
    };

    const updatePreviewLink = () => {
    if (previewLinkEl) {
        const url = generatePreviewUrl();
        previewLinkEl.setAttribute("href", url);
        previewLinkEl.title = url;
        
        // 🆕 使用 i18n 翻譯設定文字
        previewLinkEl.textContent = t('profileDashboard.previewLink') || '🔍 預覽推薦表單';
    }
};

    // 3. 點擊「插入中性版」按鈕
    if (insertDirectBtn) {
        insertDirectBtn.onclick = () => updateDefaultMessage("direct");
    }

    // 4. 點擊「插入溫暖版」按鈕
    if (insertWarmthBtn) {
        insertWarmthBtn.onclick = () => updateDefaultMessage("warmth");
    }
    
    // 5. 點擊「取消」按鈕
    if (inviteCancelBtn) {
        inviteCancelBtn.onclick = () => inviteModal.close();
    }
    
    // 🆕 6. 即時預覽更新（使用者手動輸入時）
    inviteTextarea.addEventListener("input", updatePreviewLink);
    
    // 7. 點擊「儲存並複製」按鈕 - 增強版
    if (inviteSaveBtn) {
        inviteSaveBtn.onclick = async () => {
            const message = inviteTextarea.value.trim();
            if (!message) {
                showToast(t('profileDashboard.inviteEmpty'));
                return;
            }

            try {
                // 先建立邀請記錄
                const inviteRef = await db.collection("invites").add({
                    userId: window.profile.userId,
                    jobId: job.id,
                    message: message,
                    style: currentInviteStyle || "custom",
                    lang: localStorage.getItem("lang") || "zh-Hant",
                    invitedBy: window.profile.userId,
                    createdAt: new Date()
                });

                const finalLink = `${location.origin}/pages/recommend-form.html?inviteId=${inviteRef.id}`;
                
                // 🎯 多重後備複製方案
                let copySuccess = false;
                
                // 方案 1: 現代 Clipboard API
                if (navigator.clipboard && window.isSecureContext) {
                    try {
                        await navigator.clipboard.writeText(finalLink);
                        copySuccess = true;
                        console.log("✅ Clipboard API 複製成功");
                    } catch (clipboardError) {
                        console.warn("❌ Clipboard API 失敗:", clipboardError.message);
                    }
                }
                
                // 方案 2: 傳統 execCommand
                if (!copySuccess) {
                    try {
                        const tempInput = document.createElement('input');
                        tempInput.style.position = 'fixed';
                        tempInput.style.opacity = '0';
                        tempInput.style.left = '-999999px';
                        tempInput.value = finalLink;
                        
                        document.body.appendChild(tempInput);
                        tempInput.select();
                        tempInput.setSelectionRange(0, 99999);
                        
                        const successful = document.execCommand('copy');
                        document.body.removeChild(tempInput);
                        
                        if (successful) {
                            copySuccess = true;
                            console.log("✅ execCommand 複製成功");
                        }
                    } catch (execError) {
                        console.warn("❌ execCommand 失敗:", execError.message);
                    }
                }
                
                // 方案 3: 手動複製 Modal
                if (!copySuccess) {
                    console.log("📋 開啟手動複製 Modal");
                    showManualCopyModal(finalLink);
                } else {
                    showToast(t('profileDashboard.inviteLinkCopied') || '✅ 邀請連結已複製！');
                    inviteModal.close();
                }

            } catch (err) {
                console.error("❌ 建立邀請失敗:", err);
                showToast(t('profileDashboard.inviteCreateFailed') || '❌ 建立邀請失敗，請稍後再試');
            }
        };
    }

    // --- 🔧 初始化彈窗（修正：不自動填入內容）---
    inviteTextarea.value = ""; // ✅ 清空內容，顯示 placeholder
    currentInviteStyle = null;  // ✅ 重置風格
    
    // 初始化預覽連結
    updatePreviewLink();
    
    if (inviteModal) {
        inviteModal.showModal(); // 最後才顯示彈窗
    }
}
});
    }
}
// 🎯 綁定工作經歷表單事件
function bindExperienceFormEvents() {
    const expForm = document.getElementById("expForm");
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

// 🆕 在檔案最後新增手動複製 Modal 函數
function showManualCopyModal(linkToCopy) {
    // 檢查是否已有 Modal
    let copyModal = document.getElementById("manualCopyModal");
    
    if (!copyModal) {
        // 動態建立 Modal
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
        
        // 綁定事件
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
        // 更新現有 Modal 的連結
        const input = copyModal.querySelector('#manualCopyInput');
        if (input) input.value = linkToCopy;
    }
    
    // 顯示 Modal
    copyModal.showModal();
    
    // 自動選取文字
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
});t('common.loginRequired');