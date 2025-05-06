// public/js/recommend-summary.js
import { i18n, setLang } from "../i18n.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { firebaseConfig } from "../firebase-config.js";
// html2canvas、jsPDF 現在都已經從 CDN 掛到全域 window 上
  const html2canvas = window.html2canvas;
  const { jsPDF }  = window.jspdf;

// 把 highlights 陣列轉成 <span class="badge">...</span>
function renderBadges(tags, tFn) {
  return (tags||[])
  .map(tag => {
     const label = tFn(`highlight_${tag}`) || tag;
     return `<span class="badge">${label}</span>`;
  })
  .join("");
}

// 進入點
window.addEventListener("DOMContentLoaded", async () => {
document.getElementById("summaryLoading").style.display = "flex";

let onlyShowRecommendations = false; // ➕ 新增一個切換狀態（預設 false）

  // ————— 支持 公共/私有 模式 —————
  const params      = new URLSearchParams(location.search);
  const isPublic    = params.get("public") === "true";
  const publicUserId= params.get("userId");
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
      return "";
    };    
    return { t, lang };
  }

  // 1) 初始化 Firebase + Firestore + Auth
  const app  = initializeApp(firebaseConfig);
  const db   = getFirestore(app);
  const auth = getAuth(app);

  // 2) 替換所有 data-i18n
  const { t } = getCurrentT();  // ✅ 新增這行
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
  const backBtn     = document.getElementById("backBtn");
  const filters   = document.getElementById("filters");
  const exportBtn = document.getElementById("export-pdf");
  if (isPublic && exportBtn) exportBtn.style.display = "none";

  // 4) 核心加载函数
  async function loadAndRender(userId, loggedIn) {
    // 讀 profile
    const userRef = doc(db, "users", userId);
    const snap    = await getDoc(userRef);
    if (!snap.exists()) {
      summaryArea.innerHTML = `<p>${t("noProfile")}</p>`;
      return;
    }

    const profile = snap.data();
    // ▶️ 【清空舊資料】先把每個 job.recommendations 歸零  
    (profile.workExperiences || [])
     .forEach(j => j.recommendations = []);
    // 讀並以 jobId 合併 recommendations
    const recSn  = await getDocs(collection(db, "users", userId, "recommendations"));
    recSn.forEach(docSnap => {
      const rec = docSnap.data();
      const job = (profile.workExperiences || []).find(j => j.id === rec.jobId);
      if (job) {
        job.recommendations = job.recommendations || [];
        job.recommendations.push(rec);
      }
    });
        // ➕ 加入推薦總數，供顯示星星用
    profile._totalRecCount = recSn.size;

    // 渲染列表
    const { t, lang } = getCurrentT();
    renderRecommendations(profile, t, lang);    
    document.getElementById("summaryLoading").style.display = "none";

     exportBtn.addEventListener('click', () => {
      // 隱藏篩選和匯出按鈕
      filters.style.display   = 'none';
      exportBtn.style.display = 'none';
    
      // 叫出瀏覽器列印視窗（選「存成 PDF」即可）
      window.print();
    
      // 印完或取消後，還原
      window.onafterprint = () => {
        filters.style.display   = '';
        exportBtn.style.display = 'inline-block';
      };
    });
    
      
    // ⚙️ 綁定篩選器：改變時重新渲染
    document.getElementById("relationFilter")
      .addEventListener("change", () => renderRecommendations(profile, t, lang));
    document.getElementById("highlightFilter")
      .addEventListener("change", () => renderRecommendations(profile, t, lang));
    // 標題 & Bio
    document.title = t("pageTitle");
    document.getElementById("pageTitle").innerText = t("pageTitle");
    if (profile.bio?.trim()) {
      descEl.innerText = profile.bio.trim();
    } else {
      descEl.style.display = "none";
    }

    // 顯示或隱藏使用者姓名 & 返回按鈕（私有模式才顯示）
    if (loggedIn) {
      const dn = profile.name || "";
      userNameEl.innerText = t("summaryFor", dn);
      backBtn.classList.remove("hidden");
      backBtn.innerText = t("backToProfile");
      backBtn.onclick    = () => (location.href = "profile-dashboard.html");
    } else {
      const dn = profile.name || "";
      userNameEl.innerText = t("summaryFor", dn);
      backBtn.classList.add("hidden");
    }
    // ✨ 保存 profile 到 window
    window._loadedProfile = profile;
    // ➕ 綁定切換按鈕
  const toggleViewBtn = document.getElementById("toggleViewBtn");
  toggleViewBtn.addEventListener("click", () => {
    onlyShowRecommendations = !onlyShowRecommendations;
    const { t, lang } = getCurrentT(); // ✅ 新增這行
  
    const key = onlyShowRecommendations ? "showWithCompany" : "onlyShowRecommendations";
    toggleViewBtn.setAttribute("data-i18n", key);
    toggleViewBtn.innerText = t(key);
    renderRecommendations(window._loadedProfile, t, lang);
  });
  
    // ─────── 新增全域切語言後廣播的監聽 ───────
    window.addEventListener("langChanged", () => {
      const { t: tNow, lang: langNow } = getCurrentT(); // ✅ 改這裡
    
    
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
        renderRecommendations(window._loadedProfile, tNow, langNow);
      }
    });
    
  // ────────────────────────────────────────
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

  function renderRecommendations(profile, tCurrent, langCurrent) {
      summaryArea.innerHTML = "";
      const exps = profile.workExperiences || [];
      if (exps.length === 0) {
        summaryArea.innerHTML = `<p>${tCurrent("noExperience")}</p>`;
        return;
      }      
      function tRelation(relation) {
        return tCurrent(`relation_${relation}`) || relation;
      }

    // 取得篩選值
    const selectedRelation  = document.getElementById("relationFilter").value;
    const selectedHighlight = document.getElementById("highlightFilter").value;
    const isFiltering       = !!selectedRelation || !!selectedHighlight;

    const sorted = [...exps].sort((a, b) =>
      (b.startDate || "").localeCompare(a.startDate || "")
    );
    const grouped = {};
    sorted.forEach(job => (grouped[job.company] ||= []).push(job));

    let hasMatch = false;

    Object.entries(grouped).forEach(([company, jobs]) => {
      const section = document.createElement("div");
      if (!onlyShowRecommendations) {
        section.className = "company-section";
        section.innerHTML = `<div class="company-name">${company}</div>`;
      }

      let hasCard = false;

      jobs.forEach(job => {
        let card;
        if (!onlyShowRecommendations) {
          card = document.createElement("div");
          card.className = "job-card";
          card.innerHTML = `
            <div class="job-title">${job.position}</div>
            <div class="job-date">
              ${job.startDate} ～ ${job.endDate || (langCurrent === "zh-Hant" ? "目前在職" : "Present")}
            </div>
          `;
        }
      
        let anyMatch = false;
      
        (job.recommendations || []).forEach(r => {
          const matchRelation  = !selectedRelation  || r.relation === selectedRelation;
          const matchHighlight = !selectedHighlight || (r.highlights || []).includes(selectedHighlight);
          if (!matchRelation || !matchHighlight) return;
      
          anyMatch = true;
          hasMatch = true;
      
          const recDiv = document.createElement("div");
          recDiv.className = "recommendation";
          let nameLine = "";
          if (isPublic) {
            const recCount = profile._totalRecCount || 0;
            nameLine = `
              <span class="recommender-name">
                (${t("anonymousRecommender")})
                <span class="level-badge">🌟<span class="level-number">${recCount}</span></span>
              </span>`;
          } else {
            nameLine = r.recommenderId
              ? `<a class="recommender-name link" href="recommend-summary.html?public=true&userId=${r.recommenderId}" target="_blank">${r.name}</a>`
              : `<span class="recommender-name">${r.name}</span>`;
          }

          recDiv.innerHTML = `
            <div class="recommender-line">
              ${nameLine}
              <span class="recommender-relation">（${tRelation(r.relation, tCurrent)}）</span>
            </div>
            <div class="badge-container">
              ${renderBadges(r.highlights, tCurrent)}
            </div>
          `;
      
          if (r.content?.trim()) {
            const contentDiv = document.createElement("div");
            contentDiv.className = "recommend-content";
            contentDiv.innerText = r.content.trim();
            recDiv.appendChild(contentDiv);
          }
      
          if (onlyShowRecommendations) {
            section.appendChild(recDiv); // 👉 只看推薦時，直接 append
          } else {
            card.appendChild(recDiv); // 👉 否則 append 到卡片中
          }
        });
      
        if (!onlyShowRecommendations && (!isFiltering || anyMatch)) {
          section.appendChild(card);
          hasCard = true;
        } else if (onlyShowRecommendations && anyMatch) {
          hasCard = true;
        }
      });
      

      if (hasCard) {
        summaryArea.appendChild(section);
      }
    });

    if (!hasMatch && isFiltering) {
      summaryArea.innerHTML = `<p>${tCurrent("noFilteredMatch")}</p>`;
    }    
  }
});
  

