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
function renderBadges(tags) {
  const lang = localStorage.getItem("lang") || "en";
  const pack = (i18n[lang] && i18n[lang].recommendSummary) || {};
  return (tags || [])
    .map(tag => {
      const label = pack[`highlight_${tag}`] || tag;
      return `<span class="badge">${label}</span>`;
    })
    .join("");
}

// 進入點
window.addEventListener("DOMContentLoaded", async () => {
  // ————— 支持 公共/私有 模式 —————
  const params      = new URLSearchParams(location.search);
  const isPublic    = params.get("public") === "true";
  const publicUserId= params.get("userId");
  // ————————————————————————————————

  // 0) 多語 & 設定 i18n
  const lang = localStorage.getItem("lang") || "en";
  setLang(lang);
  const pack = (i18n[lang] && i18n[lang].recommendSummary) || {};
  const t = (key, ...args) => {
    const v = pack[key];
    return typeof v === "function" ? v(...args) : v || "";
  };

  // 1) 初始化 Firebase + Firestore + Auth
  const app  = initializeApp(firebaseConfig);
  const db   = getFirestore(app);
  const auth = getAuth(app);

  // 2) 替換所有 data-i18n
  document
    .querySelectorAll("[data-i18n]")
    .forEach(el => {
      const key = el.getAttribute("data-i18n");
      const txt = t(key);
      if (txt) el.innerText = txt;
    });

  // 3) 取得主要元素
  const summaryArea = document.getElementById("summaryArea");
  const userNameEl  = document.getElementById("userName");
  const descEl      = document.getElementById("description");
  const backBtn     = document.getElementById("backBtn");
  const filters   = document.getElementById("filters");
  const exportBtn = document.getElementById("export-pdf");

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

    // 渲染列表
     renderRecommendations(profile);
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
      .addEventListener("change", () => renderRecommendations(profile));
    document.getElementById("highlightFilter")
      .addEventListener("change", () => renderRecommendations(profile));
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
      const dn = profile.chineseName || profile.name || "";
      userNameEl.innerText = t("summaryFor", dn);
      backBtn.classList.remove("hidden");
      backBtn.innerText = t("backToProfile");
      backBtn.onclick    = () => (location.href = "profile-dashboard.html");
    } else {
      userNameEl.innerText = "";      
      backBtn.classList.add("hidden");
    }
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

  function renderRecommendations(profile) {
    summaryArea.innerHTML = "";
    const exps = profile.workExperiences || [];
    if (exps.length === 0) {
      summaryArea.innerHTML = `<p>${t("noExperience")}</p>`;
      return;
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
      section.className = "company-section";
      section.innerHTML = `<div class="company-name">${company}</div>`;

      let hasCard = false;

      jobs.forEach(job => {
        const card = document.createElement("div");
        card.className = "job-card";
        card.innerHTML = `
          <div class="job-title">${job.position}</div>
          <div class="job-date">
            ${job.startDate} ～ ${job.endDate || (lang === "zh-Hant" ? "目前在職" : "Present")}
          </div>
        `;

        let anyMatch = false;

        // 逐筆推薦過濾
        (job.recommendations || []).forEach(r => {
          const matchRelation  = !selectedRelation  || r.relation === selectedRelation;
          const matchHighlight = !selectedHighlight || (r.highlights || []).includes(selectedHighlight);
          if (!matchRelation || !matchHighlight) return;

          anyMatch = true;
          hasMatch = true;

          const recDiv = document.createElement("div");
          recDiv.className = "recommendation";
          recDiv.innerHTML = `
            🧑‍🤝‍🧑 ${
              isPublic ? "" : `<span class="recommender">${r.name}</span>`
            } (${r.relation}):
            <div class="badge-container">${renderBadges(r.highlights)}</div>
            <p>${r.content}</p>
          `;
          card.appendChild(recDiv);
        });

        // 無篩選時顯示所有；有篩選時僅顯示有 anyMatch 的
        if (!isFiltering || anyMatch) {
          section.appendChild(card);
          hasCard = true;
        }
      });

      if (hasCard) {
        summaryArea.appendChild(section);
      }
    });

    if (!hasMatch && isFiltering) {
      summaryArea.innerHTML = `<p>${t("noFilteredMatch")}</p>`;
    }
  }
});
