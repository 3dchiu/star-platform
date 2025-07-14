// public/js/pages/recommend-summary.js -【最終、最正確的還原版】

console.log("recommend-summary.js (私人版) 啟動");

// --- 全域變數 ---
let _loadedProfile = null;

// --- 渲染輔助函式 (直接使用 window.t) ---

function renderBadges(tags) {
    if (!tags || !tags.length) return "";
    const t = window.t;
    const predefinedHighlights = new Set(['hardSkill', 'softSkill', 'character']);
    return tags.map(tag => {
        let label = tag;
        if (predefinedHighlights.has(tag)) {
            label = t(`recommendSummary.highlight_${tag}`) || tag;
        }
        return `<span class="badge">${label}</span>`;
    }).join("");
}

function createRecCardHTML(r) {
    const t = window.t;
    
    // 1. 取得關係的翻譯文字
    const relOptions = t('recommendSummary.relationFilterOptions') || [];
    const relMatch = relOptions.find(opt => opt.value === r.relation);
    const relLabel = relMatch ? relMatch.label : r.relation;

    // 2. 組合亮點標籤
    const badges = renderBadges(r.highlights);

    // 3. 產生推薦人姓名的超連結 (相容舊資料)
    const recommenderProfileId = r.recommenderId || r.recommenderUserId;
    const nameHTML = recommenderProfileId 
      ? `<a class="name" href="public-profile.html?userId=${recommenderProfileId}" target="_blank">${r.name}</a>`
      : `<span class="name">${r.name}</span>`;
    
    // 4. 組合最終的卡片 HTML
    return `
      <div class="rec-card" id="rec-${r.id}">
        <div class="rec-header">
            ${nameHTML}
            <span class="meta">（${relLabel}）</span>
        </div>
        ${badges ? `<div class="badge-container">${badges}</div>` : ''}
        <div class="rec-content">${r.content.replace(/\n/g, "<br>")}</div>
        <button class="share-rec-btn" data-rec-id="${r.id}" title="${t('recommendSummary.shareRecBtnTitle', '分享這則推薦')}">⬆️ 分享</button>
      </div>
    `;
}

function doesRecommendationMatch(r, selectedRelation, selectedHighlight) {
    return (!selectedRelation || r.relation === selectedRelation) && (!selectedHighlight || (r.highlights || []).includes(selectedHighlight));
}

// --- 核心渲染函式 ---

function renderRecommendations() {
    const t = window.t;
    const summaryArea = document.getElementById("summaryArea");
    if (!summaryArea || !_loadedProfile) return;

    const selectedRelation = document.getElementById("relationFilter")?.value || "";
    const selectedHighlight = document.getElementById("highlightFilter")?.value || "";
    const isFiltering = !!selectedRelation || !!selectedHighlight;

    summaryArea.innerHTML = "";
    const exps = _loadedProfile.workExperiences || [];
    const grouped = {};
    exps.forEach(job => (grouped[job.company] ||= []).push(job));
    let hasMatch = false;

    Object.entries(grouped).forEach(([company, jobs]) => {
        let jobsToShow = jobs.filter(job => (job.verifiedRecommendations || []).some(r => doesRecommendationMatch(r, selectedRelation, selectedHighlight)));
        if (jobsToShow.length === 0) return;
        hasMatch = true;

        const companySection = document.createElement("div");
        companySection.className = "company-section";
        companySection.innerHTML = `<div class="company-name">${company}</div>`;

        jobsToShow.forEach(job => {
            const recsInJob = (job.verifiedRecommendations || []).filter(r => doesRecommendationMatch(r, selectedRelation, selectedHighlight));
            if (recsInJob.length === 0) return;

            const card = document.createElement("div");
            card.className = "job-card";
            card.dataset.jobid = job.id;
            card.innerHTML = `<div class="job-title">${job.position}</div><div class="job-date">${job.startDate} ～ ${job.endDate || t("recommendSummary.present")}</div>${job.description ? `<div class="job-description">${job.description.replace(/\n/g, "<br>")}</div>` : ""}`;
            
            const recSectionWrapper = document.createElement('div');
            recSectionWrapper.className = 'rec-section-wrapper';

            if (recsInJob.length > 1 && !isFiltering) {
                const toggleBtn = document.createElement('button');
                toggleBtn.className = 'btn btn-link rec-toggle-btn';
                toggleBtn.dataset.expanded = 'false';
                toggleBtn.textContent = t('recommendSummary.showAll', recsInJob.length);
                toggleBtn.addEventListener('click', (e) => {
                    const recContainer = e.target.closest('.rec-section-wrapper').querySelector('.rec-container');
                    const isExpanded = e.target.dataset.expanded === 'true';
                    if (isExpanded) {
                        recContainer.innerHTML = createRecCardHTML(recsInJob[0]);
                        e.target.textContent = t('recommendSummary.showAll', recsInJob.length);
                    } else {
                        recContainer.innerHTML = recsInJob.map(r => createRecCardHTML(r)).join('');
                        e.target.textContent = t('recommendSummary.showLess');
                    }
                    e.target.dataset.expanded = !isExpanded;
                });
                recSectionWrapper.appendChild(toggleBtn);
            }
            
            const recContainer = document.createElement('div');
            recContainer.className = 'rec-container';
            recContainer.innerHTML = createRecCardHTML(recsInJob[0]);
            recSectionWrapper.appendChild(recContainer);
            card.appendChild(recSectionWrapper);
            companySection.appendChild(card);
        });
        if (companySection.children.length > 1) summaryArea.appendChild(companySection);
    });
    if (!hasMatch) summaryArea.innerHTML = `<p>${isFiltering ? t("recommendSummary.noFilteredMatch") : t("recommendSummary.noVerifiedRecommendations")}</p>`;
}

async function loadAndRender(userId, db, highlightRecId) {
    const loadingEl = document.getElementById("summaryLoading");
    const summaryArea = document.getElementById("summaryArea");
    try {
        const userRef = db.collection("users").doc(userId);
        const [userSnap, recsSnap] = await Promise.all([ userRef.get(), userRef.collection("recommendations").where("status", "==", "verified").get() ]);
        if (!userSnap.exists) throw new Error("找不到使用者資料");
        
        const profile = userSnap.data();
        profile.userId = userId;
        _loadedProfile = profile;
        
        const jobMap = new Map();
        (Array.isArray(profile.workExperiences) ? profile.workExperiences : []).forEach(job => {
            if (job && job.id) { job.verifiedRecommendations = []; jobMap.set(job.id, job); }
        });
        recsSnap.forEach(docSnap => {
            const rec = { id: docSnap.id, ...docSnap.data() };
            if (jobMap.has(rec.jobId)) jobMap.get(rec.jobId).verifiedRecommendations.push(rec);
        });
        profile.workExperiences = Array.from(jobMap.values()).sort((a, b) => (b.startDate || "").localeCompare(a.startDate || ""));
        
        console.log("[Summary] ✅ 資料處理完成，準備渲染");
        
        const t = window.t;
        document.title = t("recommendSummary.pageTitle");
        document.getElementById("userName").innerText = t("recommendSummary.summaryFor", profile.name || "");
        if (profile.bio?.trim()) document.getElementById("description").innerText = profile.bio.trim();
        else document.getElementById("description").style.display = "none";
        
        const backBtn = document.getElementById("backBtn");
        if (backBtn) {
            backBtn.classList.remove("hidden");
            backBtn.innerText = t("recommendSummary.backToProfile");
            backBtn.onclick = () => location.href = "profile-dashboard.html";
        }

        await updateFilterOptions();
        await renderRecommendations();

        if (highlightRecId) {
            setTimeout(() => {
                const el = document.getElementById(`rec-${highlightRecId}`);
                if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); el.classList.add("highlight"); }
            }, 500);
        }
    } catch (err) {
        console.error("載入或渲染失敗:", err);
        if (summaryArea) summaryArea.innerHTML = `<p style="color: red;">載入失敗: ${err.message}</p>`;
    } finally {
        if (loadingEl) loadingEl.style.display = "none";
    }
}

async function updateFilterOptions() {
    const t = window.t;
    const relSel = document.getElementById("relationFilter");
    if (relSel) {
        const relOptions = t('recommendSummary.relationFilterOptions') || [];
        relSel.innerHTML = `<option value="">${t("recommendSummary.allRelations")}</option>`;
        relOptions.forEach(opt => {
            const o = document.createElement("option");
            o.value = opt.value;
            o.textContent = opt.label;
            relSel.appendChild(o);
        });
    }
}

// --- 事件監聽與初始化 ---
// ✅ 【最終、最正確的版本】
document.addEventListener('DOMContentLoaded', async () => {
    console.log("🚀 DOM 已載入，等待 Firebase...");
    document.getElementById("relationFilter")?.addEventListener("change", renderRecommendations);
    document.getElementById("highlightFilter")?.addEventListener("change", renderRecommendations);

    // --- 分享按鈕的事件監聽器 ---
    document.addEventListener('click', async (e) => {
        const btn = e.target.closest('.share-rec-btn');
        if (!btn) return;

        const t = window.t;
        const recId = btn.dataset.recId;
        const userId = _loadedProfile?.userId;
        if (!userId || !_loadedProfile?.workExperiences) return;

        let targetCompany = '', targetRelation = '', targetHighlights = [];

        for (const job of _loadedProfile.workExperiences) {
            const recommendation = job.verifiedRecommendations?.find(r => r.id === recId);
            if (recommendation) {
                targetCompany = job.company;
                targetHighlights = recommendation.highlights || [];
                const relOptions = t('recommendSummary.relationFilterOptions') || [];
                const relMatch = relOptions.find(opt => opt.value === recommendation.relation);
                targetRelation = relMatch ? relMatch.label : recommendation.relation;
                break;
            }
        }

        // --- 👇 這是最核心的修正邏輯 👇 ---

        const predefinedHighlights = new Set(['hardSkill', 'softSkill', 'character']);
        const lang = localStorage.getItem("lang") || "zh-Hant";
        const highlightSeparator = (lang === 'en') ? ', ' : '、';

        const translatedHighlights = targetHighlights.map(h => {
            // 如果是系統預設的亮點，就用完整的翻譯索引鍵去翻譯
            if (predefinedHighlights.has(h)) {
                return t(`recommendSummary.highlight_${h}`);
            }
            // 如果是使用者自訂的亮點，就直接使用它
            return h;
        }).join(highlightSeparator);
        
        // --- 👆 核心修正邏輯結束 👆 ---

        const shareUrl = `${location.origin}/pages/public-profile.html?userId=${userId}&highlightRecId=${recId}`;
        
        // 使用我們之前定義好的三段式文案
        const part1 = t('recommendSummary.shareMessage_part1')
                          .replace('{{company}}', targetCompany)
                          .replace('{{relation}}', targetRelation)
                          .replace('{{highlights}}', translatedHighlights);
    
        const part2 = t('recommendSummary.shareMessage_part2');
        const part3 = t('recommendSummary.shareMessage_part3');
        
        const message = `${part1}\n\n${part2}\n\n${part3}\n${shareUrl}`;

        navigator.clipboard.writeText(message)
          .then(() => alert(t('recommendSummary.copySuccess')))
          .catch(() => alert(t('recommendSummary.copyFailed') + shareUrl));
    });

    // --- 後續的 Firebase 初始化邏輯保持不變 ---
    try {
        await window.firebasePromise;
        const auth = firebase.auth();
        console.log("✅ Firebase 就緒，監聽 Auth 狀態");
        auth.onAuthStateChanged(user => {
            if (user) {
                const params = new URLSearchParams(location.search);
                loadAndRender(user.uid, firebase.firestore(), params.get("highlightRecId"));
            } else {
                window.location.href = "/pages/login.html";
            }
        });
    } catch (error) {
        console.error("❌ Firebase 初始化失敗:", error);
        document.getElementById("summaryArea").innerHTML = `<p style="color: red;">Firebase 初始化失敗。</p>`;
        document.getElementById("summaryLoading").style.display = "none";
    }
});