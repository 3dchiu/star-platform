// public/js/recommend-summary.js
import { i18n, setLang } from "../i18n.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs,
  enableIndexedDbPersistence
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { firebaseConfig } from "../firebase-config.js";
// ─── 全域變數，一次宣告 ───
let onlyShowRecommendations = false;
let jobIdToExpand           = null;

// 🔽 根據推薦數量回傳對應的等級、名稱與顏色
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

// 把 highlights 陣列轉成 <span class="badge">...</span>
function renderBadges(tags, tFn) {
  return (tags||[])
    .map(tag => {
       // 用反引号包住 key
       const label = tFn(`highlight_${tag}`) || tag;
       // 用反引号把整段 HTML 当字符串
       return `<span class="badge">${label}</span>`;
    })
    .join("");
}

// ✅ 新增：更新篩選器的 option 內容（切換語言時會呼叫）
function updateRelationFilter(t, lang) {
  const relSel = document.getElementById("relationFilter");
  if (!relSel) return;

  const relOptions = i18n[lang]?.recommendSummary?.relationFilterOptions || [];
  relSel.innerHTML = `<option value="">${t("allRelations")}</option>`;
  relOptions.forEach(opt => {
    const o = document.createElement("option");
    o.value = opt.value;
    o.textContent = opt.label;
    relSel.appendChild(o);
  });
}
// ✅ 修改：推薦內容的比對中加入篩選條件運算，避免永遠不成立
function doesRecommendationMatch(r, selectedRelationValue, selectedHighlight) {
  return (
    (!selectedRelationValue || r.relation === selectedRelationValue) &&
    (!selectedHighlight   || (r.highlights||[]).includes(selectedHighlight))
  );
}

// 進入點
window.addEventListener("DOMContentLoaded", async () => {
document.getElementById("summaryLoading").style.display = "flex";


  // ————— 支持 公共/私有 模式 —————
  const params          = new URLSearchParams(location.search);
  jobIdToExpand         = params.get("jobId");
  const highlightRecId  = params.get("highlightRecId");
  const isPublic        = params.get("public") === "true";
  const publicUserId    = params.get("userId");
  // ————————————————————————————————

  setLang(localStorage.getItem("lang") || "en");
  // 💡 用來取得目前語系與翻譯函式
  function getCurrentT() {
    const lang = localStorage.getItem("lang") || "en";
    const pack = (i18n[lang] && i18n[lang].recommendSummary) || {};
    const t = (key, ...args) => {
      const v = pack?.[key];
      if (typeof v === "function") return v(...args);
      if (typeof v === "string") return v;
  
      // ✅ 如果是 relation_xxx，找 relationOptions 中的對應 label
      if (key.startsWith("relation_")) {
        const actualKey = key.replace("relation_", "");
        return i18n[lang]?.recommendSummary?.relationFilterOptions?.find(opt => opt.value === actualKey)?.label || actualKey;
      }
  
      return "";
    };
    return { t, lang };
  }
  
  const { t } = getCurrentT();  // ✅ 新增這行
  // 1) 初始化 Firebase + Firestore + Auth
  const app  = initializeApp(firebaseConfig);
  const db = getFirestore(app);
    enableIndexedDbPersistence(db).catch(err => {
      // 若同時開了多個 tab 或其他原因失敗，忽略即可
      console.warn("IndexedDB persistence error:", err.code);
  });
  const auth = getAuth(app);

  // 2) 替換所有 data-i18n
  document
  .querySelectorAll("[data-i18n]")
  .forEach(el => {
    const key = el.getAttribute("data-i18n");
    const txt = t(key);
    if (txt) {
      if (el.tagName === "OPTION") {
        el.textContent = txt; // 針對 option 特別用 textContent
      } else {
        el.innerText = txt; // 其他元素用 innerText
      }
    }
  });

  // 3) 取得主要元素
  const summaryArea = document.getElementById("summaryArea");
  const userNameEl  = document.getElementById("userName");
  const descEl      = document.getElementById("description");
  const userLevelBox = document.getElementById("userLevelInfo"); // ✅ 新增
  if (isPublic && userLevelBox) userLevelBox.style.display = "none";
    
  const backBtn     = document.getElementById("backBtn");
  const filters   = document.getElementById("filters");
  const exportBtn = document.getElementById("export-pdf");
  if (isPublic && exportBtn) exportBtn.style.display = "none";

  // 4) 核心加载函数
  async function loadAndRender(userId, loggedIn) {
    // —— 載入前先顯示 Skeleton
    const skeleton = document.createElement("div");
    skeleton.id = "skeletonLoader";
    skeleton.className = "skeleton-loader";
    skeleton.innerText = "載入中…";
    summaryArea.appendChild(skeleton);
    try {
    // 🔧 同時拿 profile 與 recommendations（並行）
    const userRef = doc(db, "users", userId);
    const [snap, recSn] = await Promise.all([
      getDoc(userRef),
      getDocs(collection(db, "users", userId, "recommendations"))
    ]);
    if (!snap.exists()) {
      summaryArea.innerHTML = `<p>${t("noExperience")}</p>`;
      return;
    }
    const profile = snap.data();
     
    // —— 優化：用 jobMap 快速索引
    const jobMap = {};
    (profile.workExperiences || []).forEach(job => {
      job.recommendations = [];
      jobMap[job.id] = job;
    });

    recSn.forEach(docSnap => {
      const rec = { id: docSnap.id, ...docSnap.data() };
      const job = jobMap[rec.jobId];
      if (job) {
        job.recommendations.push(rec);
      }
    });

    // 🔧 提前排序一次，避免 renderRecommendations 裡重複排序
    profile.workExperiences.sort((a, b) =>
      (b.startDate || "").localeCompare(a.startDate || "")
    );

        // ➕ 加入推薦總數，供顯示星星用
    profile._totalRecCount = (profile.workExperiences || []).reduce((sum, job) => {
      return sum + (job.recommendations?.length || 0);
    }, 0);
    if (isPublic) {
      const count = profile._totalRecCount || 0;
      const publicStars = document.getElementById("publicStars");
      if (publicStars) {
        publicStars.innerHTML = `
          <div class="summary-badge-group">
          <span class="prefix-text">收到</span>
            <span class="star-badge">
              <span class="star">★</span>
              <span class="count">${count}</span>
            </span>
            <span>則推薦</span>
          </div>
        `;
      }
    }
    // 🔽 新增：公開模式下隱藏上方篩選器
    const filtersDiv = document.querySelector(".filters-toolbar");
    if (isPublic && filtersDiv) filtersDiv.style.display = "none";
    
    // 🔽 新增：公開模式下，只保留那些有推薦的工作經歷
    if (isPublic) {
      profile.workExperiences = (profile.workExperiences || [])
        .filter(job => (job.recommendations || []).length > 0);
      }

    // ⭐ 插入星星等級區塊
    if (userLevelBox && !isPublic) {
      const info = getLevelInfo(profile._totalRecCount);
      const nextLevel = getLevelInfo(profile._totalRecCount + 1);
      const nextLevelThreshold = getNextLevelThreshold(info.level + 1);
      const neededForNext = Math.max(0, nextLevelThreshold - profile._totalRecCount);
      const neededHint = neededForNext > 0
        ? `再收到 ${neededForNext} 筆推薦可升 Lv.${info.level + 1}`
        : `已達最高等級門檻`;
      
      // 重新計算「本級門檻」與「下一級門檻」
      const lowerThreshold = info.level > 1
        ? getNextLevelThreshold(info.level)
        : 0;
      const upperThreshold = getNextLevelThreshold(info.level + 1);
      const percent = upperThreshold > lowerThreshold
        ? Math.round(
            (profile._totalRecCount - lowerThreshold) 
            / (upperThreshold - lowerThreshold) * 100
          )
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
    const toggleViewBtn = document.getElementById("toggleViewBtn");
if (toggleViewBtn) {
  toggleViewBtn.addEventListener("click", () => {
    onlyShowRecommendations = !onlyShowRecommendations;
    // 使用 loadAndRender 作用域內的 t, lang
    toggleViewBtn.innerText = t(
      onlyShowRecommendations ? "showWithCompany" : "onlyShowRecommendations"
    );
    renderRecommendations(profile, t, lang, isPublic);
  });
}
    // 🔽 根據等級數字，取得升級所需的推薦數門檻（靜態對照表）
    function getNextLevelThreshold(level) {
      const map = {
        1: 1,  2: 4,  3: 7,  4: 10,  5: 15,
        6: 20, 7: 30, 8: 50, 9: 80, 10: 100, 11: 200
      };
      if (level <= 1) return map[1];
      return map[level] ?? Infinity;
    }   

    // 渲染列表
    const { t, lang } = getCurrentT();
    updateRelationFilter(t, lang);
    renderRecommendations(profile, t, lang, isPublic);
    const sk = document.getElementById("skeletonLoader");
    if (sk) sk.remove();
    document.getElementById("summaryLoading").style.display = "none";
    if (isPublic && highlightRecId) {
      const el = document.getElementById(`rec-${highlightRecId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("highlight");  // <- （可選）加個 CSS 高亮
      }
    }
    if (!isPublic && jobIdToExpand) {
    // 1⃣ 用正確的模板字串插值
      const card = document.querySelector(`.job-card[data-jobid="${jobIdToExpand}"]`);
      if (card) {
        const toggle = card.querySelector('.rec-toggle-btn');
        // 2⃣ 只有在還沒展開的時候觸發一次 click
        if (toggle && toggle.dataset.expanded === 'false') {
          toggle.click();
        }
    // 3⃣ 捲動到卡片中央
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    // —— 資料渲染完後，移除 Skeleton
    document.getElementById("relationFilter")
      .addEventListener("change", () => renderRecommendations(profile, t, lang));
    document.getElementById("highlightFilter")
      .addEventListener("change", () => renderRecommendations(profile, t, lang));
    // 🌟 【移到 try 裡】標題 ＆ 個人簡介 ＆ 使用者名稱
    document.title = t("pageTitle");
    document.getElementById("pageTitle").innerText = t("pageTitle");
    // bio
    if (profile.bio?.trim()) {
      descEl.innerText = profile.bio.trim();
    } else {
      descEl.style.display = "none";
    }
    // 名字 & 返回按鈕
    const dn = profile.name || "";
    userNameEl.innerText = t("summaryFor", dn);
    if (loggedIn) {
      backBtn.classList.remove("hidden");
      backBtn.innerText = t("backToProfile");
      backBtn.onclick = () => location.href = "profile-dashboard.html";
    } else {
      backBtn.classList.add("hidden");
    }
    // ✨ **就在這裡** 保存 profile 到全域
    window._loadedProfile = profile;
    // ——— 分享按鈕全域事件委派 ———
    document.body.addEventListener('click', e => {
    const btn = e.target.closest('.share-rec-btn');
    if (!btn) return;                // 沒按在按鈕或其子元素就略過
    const recId = btn.dataset.recId;  // 從找到的按鈕上讀取
    const userId = window._loadedProfile.userId;
    const shareUrl =
      `${location.origin}/pages/recommend-summary.html?public=true&userId=${userId}&highlightRecId=${recId}`;
    const message = `謝謝你的推薦與支持，這是我們一起共事的紀錄 💬\n👉 ${shareUrl}`;
    navigator.clipboard.writeText(message)
      .then(() => alert('分享連結已複製！'))
      .catch(() => alert('複製失敗，請手動複製：' + shareUrl));
    });
    } 
    catch (err) {
    console.error("載入失敗：", err);
    summaryArea.innerHTML = `<p>載入失敗，請稍後再試</p>`;
    document.getElementById("summaryLoading").style.display = "none";
    return;
  }
    exportBtn.addEventListener('click', async () => {
      // Lazy load html2canvas & jsPDF
      if (!window.html2canvas || !window.jspdf) {
        await Promise.all([
          loadScript("https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"),
          loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js")
        ]);  
      }
    
      const html2canvas = window.html2canvas;
      const { jsPDF } = window.jspdf;
    
      // 隱藏篩選和匯出按鈕
      filters.style.display = 'none';
      exportBtn.style.display = 'none';
    
      const target = document.querySelector("#summaryArea");
    
      const canvas = await html2canvas(target, {
        scale: 2,
        useCORS: true
      });
    
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
    
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
    
      const imgWidth = pageWidth;
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
    
      let heightLeft = imgHeight;
      let position = 0;
    
      // 第一頁
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    
      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
    
      pdf.save("recommendation-summary.pdf");
    
      // 還原畫面
      filters.style.display = '';
      exportBtn.style.display = 'inline-block';
    });
    
  // ─────── 新增全域切語言後廣播的監聽 ───────
    window.addEventListener("langChanged", () => {
      const { t: tNow, lang: langNow } = getCurrentT(); // ✅ 改這裡
      updateRelationFilter(tNow, langNow);
      //「展開／收起」按鈕：
      document.querySelectorAll(".toggle-job-btn").forEach(btn => {
        const isOpen = btn.getAttribute("data-open") === "true";
        btn.innerText = tNow("toggleRecommenders");
      });

      // 🔁 更新所有 data-i18n 的文字（包含 <option> 與一般元素）
      document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        const txt = tNow(key);
        if (txt) {
          if (el.tagName === "OPTION") el.textContent = txt;
          else el.innerText = txt;
        }
      });
    
      // 🔁 更新匯出按鈕
      const exportBtnNow = document.getElementById("export-pdf");
      if (exportBtnNow) exportBtnNow.innerText = tNow("exportPDF");
    
      // 🔁 更新切換推薦視圖按鈕
      const toggleBtnNow = document.getElementById("toggleViewBtn");
      if (toggleBtnNow) {
        const keyNow = onlyShowRecommendations ? "showWithCompany" : "onlyShowRecommendations";
        toggleBtnNow.setAttribute("data-i18n", keyNow);
        toggleBtnNow.innerText = tNow(keyNow);
      }
    
      // 🔁 更新標題與返回按鈕
      document.title = tNow("pageTitle");
      const backBtn = document.getElementById("backBtn");
      if (backBtn) backBtn.innerText = tNow("backToProfile");
    
      // 🔁 重新渲染推薦內容（使用新的翻譯函式 tNow 和語言 langNow）
      if (window._loadedProfile) {
        renderRecommendations(window._loadedProfile, tNow, langNow, isPublic);
      }
    });
  }
  // 5) 根據模式呼叫 loadAndRender
  if (isPublic) {
    // 公共：不用登入，直接載入
    await loadAndRender(publicUserId, false);
  } else {
    // 私有：先等 auth，再載入
    onAuthStateChanged(auth, async user => {
      if (!user) {
        return (location.href = "/pages/login.html");
      }
      await loadAndRender(user.uid, true);
    });
  }

}); // ← 這是關閉 DOMContentLoaded 的
  function renderRecommendations(profile, tCurrent, langCurrent, isPublic) {
  // —— 新增：先讀取「關係」「亮點」篩選器的值，以及三種顯示模式
  const selectedRelation  = document.getElementById("relationFilter").value;
  const selectedHighlight = document.getElementById("highlightFilter").value;
  const isFiltering       = !!selectedRelation || !!selectedHighlight;
  const isRecOnly         = onlyShowRecommendations;

    // 🔁 轉換中文關係名稱 → 英文代碼（給篩選器用）
    const relationNameToValue = {};
      // —— 新增：先讀入使用者在「關係」和「亮點」篩選器裡選的值
      (i18n[langCurrent]?.recommendSummary?.relationFilterOptions || []).forEach(opt => {
        relationNameToValue[opt.label] = opt.value;
      });
      // —— 新增：讀入使用者選的篩選
      const selectedRelationValue = relationNameToValue[selectedRelation] || selectedRelation;
      // 清空旧内容
      summaryArea.innerHTML = "";
      // 用 DocumentFragment 批量构建
      const frag = document.createDocumentFragment();
      const exps = profile.workExperiences || [];
      if (exps.length === 0) {
        summaryArea.innerHTML = `<p>${tCurrent("noExperience")}</p>`;
        return;
      }      
      function tRelation(relation) {
        const label = tCurrent(`relation_${relation}`);
        if (label) return label;
      
        // fallback: 如果找不到，回傳原始字串
        const fallback = i18n[langCurrent]?.relationOptions?.find(opt => opt.value === relation);
        return fallback?.label || relation;
      }
    
    const grouped = {};
    exps.forEach(job => (grouped[job.company] ||= []).push(job));

    let hasMatch = false;

    Object.entries(grouped).forEach(([company, jobs]) => {
      // —— 新增：当在「篩選模式」或「只看推薦內容」时，只保留那些底下有匹配推薦的工作
  let jobsToShow = jobs;
  // 公開頁：只顯示有推薦的工作
  if (isFiltering) {
    jobsToShow = jobs.filter(job =>
      job.recommendations.some(r =>
        doesRecommendationMatch(r, selectedRelationValue, selectedHighlight)
      )
    );
  }
  // —— 如果只有看推薦內容，也只要有任何推薦就显示
  if (isRecOnly) {
    jobsToShow = jobs.filter(job => (job.recommendations || []).length > 0);
  }
  // —— 没有任何要显示的 job，就跳过整家
  if (jobsToShow.length === 0) return;

      const section = document.createElement("div");
      if (!onlyShowRecommendations) {
        section.className = "company-section";
        section.innerHTML = `<div class="company-name">${company}</div>`;
      }

      let hasCard = false;
       jobsToShow.forEach(job => {
        const shouldExpand = job.id === jobIdToExpand;
  // 先找出此工作底下符合篩選的推薦
  const matchingRecs = job.recommendations.filter(r =>
    doesRecommendationMatch(r, selectedRelationValue, selectedHighlight)
  );

  // 1️⃣ 一般模式：沒篩選，也沒只看推薦
  if (!isFiltering && !isRecOnly) {
    // 一般模式：job 卡片＋折疊第一則推薦
  // ➕ 先判斷此 job 底下有沒有任一推薦
  const anyMatch = (job.recommendations || []).length > 0;

  // 建立 job-card
  const card = document.createElement("div");
  card.className = "job-card";
  card.dataset.jobid = job.id;
  // headerHtml 只包含職稱與日期（和 description，如果有）
  let headerHtml = `
    <div class="job-title">${job.position}</div>
    <div class="job-date">
      ${job.startDate} ～ ${job.endDate || (langCurrent === "zh-Hant" ? "目前在職" : "Present")}
    </div>
  `;
  if (job.description) {
    const descHtml = job.description.replace(/\n/g, "<br>");
    headerHtml += `<div class="job-description">${descHtml}</div>`;
  }

  // **這行必須在此**，把 headerHtml 寫入 card
  card.innerHTML = headerHtml;

  // 只有當有推薦才把折疊區塊塞進去
  if (anyMatch) {
    // 取第一筆推薦做摘要
    const first = job.recommendations[0];
    const fullText = first.content || "";
    const snippet = fullText.split('\n')[0].slice(0, 50) + (fullText.length > 50 ? '…' : '');

    // 建立 recContainer
    const recContainer = document.createElement('div');
    recContainer.className = 'rec-container';
    // 關係與 badges 同你原本的寫法
    const relLabel = tCurrent(`relation_${first.relation}`) || first.relation;
    const badgesHtml = renderBadges(first.highlights, tCurrent)
      ? `<div class="badge-container">${renderBadges(first.highlights, tCurrent)}</div>`
      : '';

    // 建立 recContainer 之後，替換 innerHTML 這段：
if (isPublic || shouldExpand) {
  // 公開頁一進來就全部「攤開」
  recContainer.innerHTML = job.recommendations.map(r => {
    const rel = tCurrent(`relation_${r.relation}`) || r.relation;
    const bdg = renderBadges(r.highlights, tCurrent);
    return `
    <div class="rec-card" id="rec-${r.id}">
      ${isPublic
        ? `<span class="public-icon">★</span>`
        : ( r.recommenderId
            ? `<a class="name" href="recommend-summary.html?public=true&userId=${r.recommenderId}" target="_blank">${r.name}</a>`
            : `<span class="name">${r.name}</span>`
          )
      }
      <span class="meta">（${tCurrent(`relation_${r.relation}`)}）</span>
      ${renderBadges(r.highlights, tCurrent) ? `<div class="badge-container">${renderBadges(r.highlights, tCurrent)}</div>` : ''}
      <div>${r.content}</div>
      ${!isPublic
       ? `<button class="share-rec-btn" data-rec-id="${r.id}">⬆️ 分享</button>`
       : ''
     }
    </div>
  `;
}).join('');
} else {
  // 私有頁維持只顯示「第一筆摘要」
  recContainer.innerHTML = `
  <div class="rec-card" id="rec-${first.id}">
    ${ first.recommenderId
        ? `<a class="name" href="recommend-summary.html?public=true&userId=${first.recommenderId}" target="_blank">${first.name}</a>`
        : `<span class="name">${first.name}</span>`
      }
    <span class="meta">（${relLabel}）</span>
    ${badgesHtml}
    <div class="rec-snippet">${snippet}</div>
      ${!isPublic
        ? `<button class="share-rec-btn" data-rec-id="${first.id}">⬆️ 分享</button>`
        : ''
      }
    </div>
  `;
}

    // 如果第一筆之後還有多筆，就加上「展開／收合」按鈕
    if (job.recommendations.length > 0) {
      const toggleBtn = document.createElement('button');
      toggleBtn.className = 'btn btn-link rec-toggle-btn';
      // ③ 初始時，如果是公開頁 or shouldExpand，就預設展開；否則收合
      toggleBtn.dataset.expanded = (isPublic || shouldExpand) ? 'true' : 'false';
      toggleBtn.innerText       = (isPublic || shouldExpand)
        ? tCurrent('showLess')
        : tCurrent('showAll').replace('{count}', job.recommendations.length);

      toggleBtn.addEventListener('click', () => {
        if (toggleBtn.dataset.expanded === 'false') {
          // 展開所有推薦...
          recContainer.innerHTML = job.recommendations.map(r => {
            const rel = tCurrent(`relation_${r.relation}`) || r.relation;
            const bdg = renderBadges(r.highlights, tCurrent);
            return `
    <div class="rec-card" id="rec-${r.id}">
      ${isPublic
        ? `<span class="public-icon">★</span>`
        : ( r.recommenderId
            ? `<a class="name" href="recommend-summary.html?public=true&userId=${r.recommenderId}" target="_blank">${r.name}</a>`
            : `<span class="name">${r.name}</span>`
          )
      }
      <span class="meta">（${tCurrent(`relation_${r.relation}`)}）</span>
      ${renderBadges(r.highlights, tCurrent) ? `<div class="badge-container">${renderBadges(r.highlights, tCurrent)}</div>` : ''}
      <div>${r.content}</div>
      ${!isPublic
       ? `<button class="share-rec-btn" data-rec-id="${r.id}">⬆️ 分享</button>`
       : ''
     }
    </div>
  `;
}).join('');
          toggleBtn.innerText = tCurrent('showLess');
          toggleBtn.dataset.expanded = 'true';
        } else {
          // 收合回第一筆摘要...
          recContainer.innerHTML = `
          <div class="rec-card" id="rec-${first.id}">
            ${isPublic
              ? `<span class="public-icon">★</span>`
              : ( first.recommenderId
                  ? `<a class="name" href="recommend-summary.html?public=true&userId=${first.recommenderId}" target="_blank">${first.name}</a>`
                  : `<span class="name">${first.name}</span>`
                )
              }
            <span class="meta">（${relLabel}）</span>
            ${badgesHtml}
            <div class="rec-snippet">${snippet}</div>
            ${!isPublic
              ? `<button class="share-rec-btn" data-rec-id="${first.id}">⬆️ 分享</button>`
              : ''
            }
          </div>
          `;
          toggleBtn.innerText = tCurrent('showAll').replace('{count}', job.recommendations.length);
          toggleBtn.dataset.expanded = 'false';
        }
      });

      card.appendChild(toggleBtn);
    }

    card.appendChild(recContainer);
  }

  // 最後把整個卡片 section 加回去
  section.appendChild(card);
 
  }
  // 2️⃣ 篩選模式：有篩選，強制攤開所有符合條件的推薦
  else if (isFiltering) {
      // b) 直接把所有 matchingRecs 印出來
      matchingRecs.forEach(r => {
        const iconOrName = isPublic
          ? `<span class="public-icon">★</span>`
          : (r.recommenderId
              ? `<a class="name" href="recommend-summary.html?public=true&userId=${r.recommenderId}" target="_blank">${r.name}</a>`
              : `<span class="name">${r.name}</span>`);
        const relLabel = tCurrent(`relation_${r.relation}`) || r.relation;
        const badges   = renderBadges(r.highlights, tCurrent);
        const recCard  = document.createElement("div");
        recCard.className = "rec-card";
        recCard.innerHTML = `
          ${iconOrName}<span class="meta">（${relLabel}）</span>
          ${badges ? `<div class="badge-container">${badges}</div>` : ""}
          <div>${r.content}</div>
        `;
        section.appendChild(recCard);
      });
    }

  // 3️⃣ 只看推薦內容：不顯示 job 卡片，直接攤開全部推薦
  else if (isRecOnly) {
    job.recommendations.forEach(r => {
      const iconOrName = isPublic
        ? `<span class="public-icon">★</span>`
        : (r.recommenderId
            ? `<a class="name" href="recommend-summary.html?public=true&userId=${r.recommenderId}" target="_blank">${r.name}</a>`
            : `<span class="name">${r.name}</span>`);
        const relLabel = tCurrent(`relation_${r.relation}`) || r.relation;
        const badges   = renderBadges(r.highlights, tCurrent);
        const recCard  = document.createElement("div");
        recCard.className = "rec-card";
        recCard.innerHTML = `
          ${iconOrName}<span class="meta">（${relLabel}）</span>
          ${badges ? `<div class="badge-container">${badges}</div>` : ""}
          <div>${r.content}</div>
        `;
        section.appendChild(recCard);
      });
    }

    // 如果任何分支有資料，就把 section 推到 summaryArea
    if (section.children.length > 0) {
      frag.appendChild(section);
      hasMatch = true;
    }
  });

});
    summaryArea.appendChild(frag);
    
    if (!hasMatch && isFiltering) {
      summaryArea.innerHTML = `<p>${tCurrent("noFilteredMatch")}</p>`;
    }    
  }  
// 🔽 動態載入外部 script（html2canvas / jsPDF）避免初始頁面變慢
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}



