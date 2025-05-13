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
  
      // ✅ 加入這段 fallback：如果是 highlight_xxx，就用 highlightOptionLabels 裡的對照文字
      if (key.startsWith("highlight_")) {
        const actualKey = key.replace("highlight_", "");
        return i18n[lang]?.highlightOptionLabels?.[actualKey] || actualKey;
      }
  
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
  const userLevelBox = document.getElementById("userLevelInfo"); // ✅ 新增
  if (isPublic && userLevelBox) userLevelBox.style.display = "none";
    
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
      summaryArea.innerHTML = `<p>${t("noExperience")}</p>`;
      return;
    }

    const profile = snap.data();
     
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
    renderRecommendations(profile, t, lang);
    document.getElementById("relationFilter")
      .addEventListener("change", () => renderRecommendations(profile, t, lang));
    document.getElementById("highlightFilter")
      .addEventListener("change", () => renderRecommendations(profile, t, lang));
    document.getElementById("summaryLoading").style.display = "none";

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
    } 
    else {
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
        const label = tCurrent(`relation_${relation}`);
        if (label) return label;
      
        // fallback: 如果找不到，回傳原始字串
        const fallback = i18n[langCurrent]?.relationOptions?.find(opt => opt.value === relation);
        return fallback?.label || relation;
      }
      

    // 取得篩選值
    const selectedRelation  = document.getElementById("relationFilter").value;
    const selectedHighlight = document.getElementById("highlightFilter").value;
    const isFiltering       = !!selectedRelation || !!selectedHighlight;

    const grouped = {};
    exps.forEach(job => (grouped[job.company] ||= []).push(job));

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
          const matchRelation =
            !selectedRelation ||
            r.relation === selectedRelation ||
            i18n[langCurrent]?.relationOptions?.find(opt => opt.value === r.relation)?.label === selectedRelation;

          const matchHighlight = !selectedHighlight || (r.highlights || []).includes(selectedHighlight);
          if (!matchRelation || !matchHighlight) return;
      
          anyMatch = true;
          hasMatch = true;
      
          const recDiv = document.createElement("div");
          recDiv.className = "recommendation";
          let nameLine = "";
          if (isPublic) {
            nameLine = `<span class="recommender-name">★</span>`; // ⭐️ 隱藏推薦人名，用星星取代
          } else {
            if (r.recommenderId) {
              nameLine = `<a class="recommender-name link" href="recommend-summary.html?public=true&userId=${r.recommenderId}" target="_blank">${r.name}</a>`;
            } else {
              nameLine = `<span class="recommender-name">${r.name}</span>`;
            }
          }

          recDiv.innerHTML =` 
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
