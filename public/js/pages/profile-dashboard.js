// public/js/profile-dashboard.js
import { i18n, setLang } from "../i18n.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { firebaseConfig } from "../firebase-config.js";

// 🔽 初始化 Firebase 與 Firestore/Authentication
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);
// 🔽 當頁面載入完成後，初始化所有元件與邏輯
document.addEventListener("DOMContentLoaded", () => {
// 🕒 顯示載入中遮罩（等待 Firebase 資料完成）
document.getElementById("dashboardLoading").style.display = "flex";

  // 多語
  const lang = localStorage.getItem("lang") || "en";
  // 🔽 當語系變更時，自動更新畫面上的所有文字（含 bio 與經歷卡片）
  window.addEventListener("langChanged", () => {
    renderStaticText();    // 更新所有 data-i18n 文字
    renderBio();          // 再重新把 bio 內容塞回去
    updateOnboardingText(); // （如果有這個小卡多語也一起跑）
    renderExperienceCards();   // ✅ 新增這行，讓卡片內容（含提示）也依語言切換
    const tNow = i18n[localStorage.getItem("lang")] || i18n.en;
    if (inviteTextarea) {
      inviteTextarea.setAttribute("placeholder", tNow.invitePlaceholder || "");
    }  
  });  
  const t    = i18n[lang] || i18n.en;
  document.getElementById("loadingDashboardText").innerText = t.loadingDashboardMessage;

  // 📋 抓取所有要用到的 HTML 元件（輸入欄位與按鈕）
  const nameSection      = document.getElementById("nameSection");
  const nameInput = document.getElementById("nameInput");
  const englishNameInput = document.getElementById("englishNameInput");
  const basicInfo        = document.getElementById("basicInfo");
  const bioText          = document.getElementById("bioText");
  const editBioBtn       = document.getElementById("editBioBtn");
  const bioModal         = document.getElementById("bioModal");
  const bioForm          = document.getElementById("bioForm");
  const bioTextarea      = document.getElementById("bioTextarea");

  const list             = document.getElementById("experienceList");
  const addBtn           = document.getElementById("addBtn");
  const expModal         = document.getElementById("expModal");
  const expForm          = document.getElementById("expForm");
  const modalTitle       = document.getElementById("modalTitle");

  const companyInp       = document.getElementById("companyInput");
  const positionInp      = document.getElementById("positionInput");
  const startY           = document.getElementById("startYear");
  const startM           = document.getElementById("startMonth");
  const endY             = document.getElementById("endYear");
  const endM             = document.getElementById("endMonth");
  const stillChk         = document.getElementById("stillWorking");
  const endDateContainer = document.getElementById("endDateContainer");
  const descInp          = document.getElementById("descInput");

  const inviteModal       = document.getElementById("inviteModal");
  const inviteTextarea    = document.getElementById("inviteTextarea");
  //const inviteStyleSelect = document.getElementById("inviteStyleSelect");
  const inviteCancelBtn   = document.getElementById("inviteCancelBtn");
  const inviteSaveBtn     = document.getElementById("inviteSaveBtn");

  // 📦 初始化暫存使用者資料與狀態變數
  let profile = { userId:"", name:"", englishName:"", bio:"", workExperiences:[] };
  let editIdx, currentJobIndex, currentCompany, currentDefaultMsg, currentInviteStyle;
 
  // 🔽 更新 Onboarding 區塊的多語文字內容
  function updateOnboardingText() {
    const langNow = localStorage.getItem("lang") || "en";
    const onb = i18n[langNow]?.onboarding || i18n.en.onboarding;
    document.getElementById("onboardingTitle").innerText = onb.title;
    document.getElementById("onboardingSteps").innerHTML =
      onb.steps.map(s => `<li>${s}</li>`).join("");
  }
  // 🔽 工具函式：產生起始與結束年月的選單選項
  function populateYearMonth() {
    const now = new Date(), thisYear = now.getFullYear();
    let yrs = ['<option value="">--</option>'], mos = ['<option value="">--</option>'];
    for (let y = thisYear-40; y <= thisYear; y++) yrs.push(`<option>${y}</option>`);
    for (let m = 1; m <= 12; m++) {
      const mm = String(m).padStart(2,"0");
      mos.push(`<option value="${mm}">${m}</option>`);
    }
    startY.innerHTML = endY.innerHTML = yrs.join("");
    startM.innerHTML = endM.innerHTML = mos.join("");
    stillChk.addEventListener("change", () => {
      const isWorking = stillChk.checked;
      // 隱藏／顯示「結束日期」整組欄位
      endDateContainer.classList.toggle("hidden", isWorking);
      // 停用／啟用下拉
      endY.disabled = endM.disabled = isWorking;
      // 勾選時清空選項
      if (isWorking) endY.value = endM.value = "";
    });
  }

  function renderStaticText() {
       // 每次都抓最新語系
      const langNow = localStorage.getItem("lang") || "en";
      const currentT = i18n[langNow] || i18n.en;
      document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        if (currentT[key] != null) el.textContent = currentT[key];
    });
  }
  // ===== 新增：當 header.js dispatch langChanged 時，自動重跑小卡文字 =====
  window.addEventListener("langChanged", updateOnboardingText);
  // ===== 結束新增 =====
  // 🔽 儲存使用者個人資料（姓名、簡介、經歷等），寫入 Firestore
  async function saveProfile() {
    console.group("🔍 saveProfile()");
    console.log("→ profile.userId =", profile.userId);
    console.log("→ profile payload =", profile);
    if (!profile.userId) {
      console.warn("❌ saveProfile() 中断：profile.userId 为空");
      console.groupEnd();
      return;
    }
  
    try {
      const ref = doc(db, "users", profile.userId);
  
      // 🔒 補強：如果 name 是空的，就保留資料庫原值
      const existingSnap = await getDoc(ref);
      if (existingSnap.exists()) {
        const existingData = existingSnap.data();
        if (!profile.name && existingData.name) {
          profile.name = existingData.name;
        }
        if (!profile.englishName && existingData.englishName) {
          profile.englishName = existingData.englishName;
        }
      }
  
      await setDoc(ref, profile, { merge: true });
      console.log("✅ saveProfile() 写入成功");
    } catch (err) {
      console.error("❌ saveProfile() 写入失败：", err);
    }
  
    console.groupEnd();
  }  
  // 🔽 渲染個人檔案基本資料（姓名、英文名、推薦數量）
  function renderBasic() {
    const totalRecommendations = profile.workExperiences.reduce((sum, job) => {
      return sum + (job.recommendations?.length || 0);
    }, 0);
  
    let recommendationsNote = "";
    if (totalRecommendations > 0) {
      recommendationsNote = `<p class="rec-summary">✨ 你已收到 <strong>${totalRecommendations}</strong> 則推薦</p>`;
    }
  
    basicInfo.innerHTML = `
      <h1>${profile.name || ""}</h1>
      ${profile.englishName ? `<p>${profile.englishName}</p>` : ""}
      <p>${profile.workExperiences.length} ${t.workExperiences}</p>
      ${recommendationsNote}
    `;
  }  
  // 🔽 渲染個人簡介區塊（換行符處理為 <br>）
  function renderBio() {
    // 取出存库的文字（可能包含 \n）
    const raw = profile.bio || "";
    // 把换行符 ("\n") 全部换成 <br>，再放进 innerHTML
    bioText.innerHTML = raw
      ? raw.replace(/\n/g, "<br>")
      : t.noBio;
  }
  
  console.log("合併後的 experiences:", profile.workExperiences);
  // 🔽 根據使用者經歷與推薦內容，渲染出每間公司下的經歷卡片區塊
  function renderExperienceCards() {
    const langNow = localStorage.getItem("lang") || "en";
    const tNow = i18n[langNow] || i18n.en;
  
    list.innerHTML = "";
    const grouped = {};
    profile.workExperiences.sort((a,b)=>b.startDate.localeCompare(a.startDate))
      .forEach(job=> (grouped[job.company] = grouped[job.company]||[]).push(job));
  
    Object.entries(grouped).forEach(([comp,jobs]) => {
      const wrap = document.createElement("div");
      wrap.className = "company-card";
      wrap.innerHTML = `<div class="company-title">${comp}</div>`;
      
      jobs.forEach(job => {
        const idx = profile.workExperiences.indexOf(job);
        const hasRec = !!job.recommendations?.length;
  
        const roleCard = document.createElement("div");
        roleCard.className = "role-card";
  
        roleCard.innerHTML = `
          <strong>${job.position}</strong>
          ${hasRec ? `<span class="lock-tip">🔒</span>` : ""}
          <button class="link-btn" data-idx="${idx}">🔗</button>
          <button class="edit-btn" data-idx="${idx}">📝</button>
          <button class="del-btn" data-idx="${idx}">🗑️</button>
          <div>${job.startDate} ～ ${job.endDate || tNow.currentlyWorking}</div>
          ${job.description ? `<div>${job.description}</div>` : ""}
        `;
  
        if (hasRec) {
          const recHTML = job.recommendations.map(r => `
            <div class="rec-card">
              <span class="name">${r.name}</span>
              <span class="meta">（${r.relation}）</span><br>${r.content}
            </div>`).join("");
          roleCard.insertAdjacentHTML("beforeend", recHTML);
        } else {
          const hint = document.createElement("div");
          hint.className = "no-recommend-hint";
          hint.innerText = tNow.noRecommendationsHint;
          roleCard.appendChild(hint);
        }
  
        wrap.appendChild(roleCard);
      });
  
      list.appendChild(wrap);
    });
  }
  // 🔽 顯示 3 秒後自動消失的提示訊息（toast）
  function showToast(msg) {
    const d = document.createElement("div");
    d.className = "toast";
    d.textContent = msg;
    document.body.appendChild(d);
    setTimeout(()=>d.remove(),3000);
  }

  // 🔽 當使用者登入後，讀取其 profile 與推薦資料並初始化畫面
  onAuthStateChanged(auth, async user => {
    // 🔍 如果尚未登入，導回登入頁
    if (!user) return location.href = "/pages/login.html";
    profile.userId = user.uid;
    // 🏷️ 是否用過 sessionStorage 的預填功能
    let prefillUsed = false;
  // 📤 從 Firestore 讀取使用者的個人資料（users/{userId}）
  const ref = doc(db, "users", user.uid);
  let snap;
  try {
    snap = await getDoc(ref);
  } catch (err) {
    // ❌ Firestore 讀取失敗（可能是離線）
    console.error("❌ 無法連接 Firestore，可能是離線狀態：", err);
    alert("目前無法連接資料庫，請確認網路後再試一次。");
    return; // 中斷流程
  }

  if (snap.exists()) {
    profile = {
      userId: user.uid,
      ...snap.data()
    };

    // 🔥 防呆：若 workExperiences 是 object（舊版），自動轉成陣列
    if (!Array.isArray(profile.workExperiences)) {
      const values = Object.values(profile.workExperiences || {});
      console.warn(`⚠️ [${profile.userId}] workExperiences 非陣列，自動轉換為陣列：`, values);
      profile.workExperiences = values;
    }
  } else {
    localStorage.removeItem("profile");
    // 🆕 若 user 資料尚未建立，建立初始空白檔案
    profile = {
      userId: user.uid,
      name: "",
      englishName: "",
      bio: "",
      workExperiences: []
    };
    try {
      await setDoc(ref, {
        ...profile,
        createdAt: new Date()
      });
    } catch (err) {
      // ❌ 建立預設使用者資料時失敗
      console.error("❌ 建立預設 user 資料失敗：", err);
      alert("初始化使用者資料時出現錯誤。請稍後再試。");
      return;
    }
  }

    // 🏷️ 若 sessionStorage 有預填姓名（多來自分享連結），自動帶入
    const prefillName = sessionStorage.getItem("prefillName");
    if (prefillName) {
      // 填入「中文姓名」輸入框
      const nameInput = document.getElementById("nameInput");
      if (nameInput) {
        nameInput.value = prefillName;
        prefillUsed = true;
      }
      // 清掉，避免下次又自動帶入
      sessionStorage.removeItem("prefillName");
      // 直接開啟「第一次填檔案」的 Modal
      openModalForAdd(true);
    }
// —————————————————————————————————————————————

    // … 讀取 profile 並 normalize 之後，先把 recommendations 清空，避免重複 …
    profile.workExperiences = profile.workExperiences || [];
    profile.workExperiences.forEach(j => {
      if (!j.endDate) j.endDate = "";
    });
    // ✅ 清空每段經歷的 recommendations，避免與 Firestore 資料重複
    profile.workExperiences.forEach(j => j.recommendations = []);

    // 📤 從 Firestore 抓取該使用者所有推薦內容（users/{userId}/recommendations）
    const recSnap = await getDocs(collection(db, "users", profile.userId, "recommendations"));
for (const docSnap of recSnap.docs) {
  const rec = docSnap.data();
  const targetJob = profile.workExperiences.find(j => j.id === rec.jobId);
  if (targetJob) {
    // 📥 將推薦內容加入對應的工作經歷物件中
    targetJob.recommendations.push(rec);
  }
}
    // 🔽 初始化畫面顯示（年月下拉、靜態文字、卡片內容）
    populateYearMonth();
    renderStaticText();
    renderBasic();
    renderBio();
    renderExperienceCards();
    updateOnboardingText();

    // 🕒 所有資料初始化完成後，關閉遮罩畫面
    document.getElementById("dashboardLoading").style.display = "none";

    // 3. 顯示小卡（由 toggleQuickStartCard 決定 display）並觸發淡入
    const card = document.getElementById("quickStartCard");
    // 注意：toggleQuickStartCard 已幫你做 display:block/none
    setTimeout(() => card.classList.add("show"), 300);
    // ===== 結束 Onboarding 小卡多語＆淡入動畫 =====
    // 🔽 判斷是否顯示 QuickStart 小卡（無經歷或無推薦才顯示）
    function toggleQuickStartCard() {
      const card = document.getElementById("quickStartCard");
      if (!card) return;

      const hasExp = profile.workExperiences.length > 0;
      const hasReco = profile.workExperiences.some(job =>
        Array.isArray(job.recommendations) && job.recommendations.length > 0
      );
    // 如果「完全沒經歷」或「有經歷但一則推薦都沒有」，就顯示小卡，否則隱藏
      card.style.display = (!hasExp || !hasReco) ? "block" : "none";
    }
    // 立刻執行一次
    toggleQuickStartCard();
    // —— 正確綁定：點卡片就開啟「第一次填姓名 + 新增經歷」 ——
    const quickCard = document.getElementById("quickStartCard");
    if (quickCard) {
      quickCard.style.cursor = "pointer";       // 滑鼠變手指
      quickCard.addEventListener("click", e => {
        e.preventDefault();
        openModalForAdd(true);  // 傳 true → 顯示姓名欄位
      });
    }
    // 插入到新容器裡
  const actionBtns = document.getElementById("actionBtns");
  actionBtns.classList.add("btn-group");

  // ➕ 產生「新增工作經歷」按鈕並加到畫面上
  const addBtn = document.createElement("button");
  addBtn.id = "addBtn";
  addBtn.type = "button";
  addBtn.classList.add("btn", "cta-btn");
  addBtn.setAttribute("data-i18n", "addExperience");
  addBtn.innerText = t.addExperience;
  actionBtns.appendChild(addBtn);

  // 📄 產生「推薦總覽」按鈕（連到推薦 summary 頁面）
  const summaryBtn = document.createElement("button");
  summaryBtn.type = "button";
  summaryBtn.classList.add("btn", "cta-btn");
  summaryBtn.setAttribute("data-i18n", "viewSummaryAll");
  summaryBtn.innerText = t.viewSummaryAll;
  actionBtns.appendChild(summaryBtn);

  // 🌐 產生「公開推薦頁」按鈕（可分享給他人查看）
  const previewBtn = document.createElement("button");
  previewBtn.type = "button";
  previewBtn.classList.add("btn", "cta-btn");
  previewBtn.setAttribute("data-i18n", "viewPublicSummary");
  previewBtn.innerText = t.viewPublicSummary;
  actionBtns.appendChild(previewBtn);

  // 綁定點擊事件
  summaryBtn.addEventListener("click", () => {
    window.open(`/pages/recommend-summary.html?userId=${profile.userId}&jobIndex=0`, "_blank");
  });
  previewBtn.addEventListener("click", () => {
    window.open(`/pages/recommend-summary.html?public=true&userId=${profile.userId}`, "_blank");
  });

  // 將 addBtn 的 onclick 保留原本：
  addBtn.onclick = () => openModalForAdd(false);

    // 第一次 fill vs 無經歷都要開 Modal
    if (!snap.exists()) {
      openModalForAdd(true);
    } else if (!profile.workExperiences.length && !prefillUsed) {
      openModalForAdd(true);   // 改成 true → 顯示姓名欄位
    }

    // ===== 所有事件綁定放在這裡 =====

    // 編輯 Bio
    editBioBtn.onclick = () => {
      bioTextarea.value = profile.bio||"";
      bioModal.showModal();
    };
    bioForm.onsubmit = async e => {
      e.preventDefault();
      profile.bio = bioTextarea.value.trim();
      await saveProfile();
      renderBio();
      bioModal.close();
    };

    // 新增 / 編輯 Experience
    addBtn.onclick = () => openModalForAdd(false);
    // 🔽 使用者按下送出經歷表單時，進行資料驗證並儲存至 profile
    expForm.onsubmit = async e => {
      e.preventDefault();
      
      if (!nameSection.hidden) {
        const nameVal = nameInput.value.trim();
        // 🔍 若為首次填寫，驗證使用者必須輸入姓名
        if (!nameVal) {
          showToast(t.enterName || "請填寫姓名");
          nameInput.focus();
          return;
        }
      }
      
      // ★ 初次填姓名
      profile.name = nameInput.value.trim();
      profile.englishName = englishNameInput.value.trim();
      renderBasic();
      
    
      const pad = v => v.padStart(2, "0");
      // 📦 將開始年月組合為 YYYY-MM 格式
      const startDate = `${startY.value}-${pad(startM.value)}`;
    
      // 驗證結束日期：只有「未勾選仍在職」才需要檢查
      let endDate = "";
      // 🔍 若使用者「未勾選仍在職」，必須進行結束日期的完整驗證
      if (!stillChk.checked) {
        // 1. 確認有選年/月
        if (!endY.value || !endM.value) {
          showToast(t.selectEnd);
          return;
        }
        // 2. 轉成 Date 物件再比大小
        const startObj = new Date(`${startY.value}-${pad(startM.value)}-01`);
        const endObj   = new Date(`${endY.value}-${pad(endM.value)}-01`);
        const today    = new Date();
    
        // ❌ 錯誤：結束日期不能早於開始日期
        if (endObj < startObj) {
          showToast(t.errEndBeforeStart);
          return;
        }
        // ❌ 錯誤：結束日期不能超過今天
        if (endObj > today) {
          showToast(t.errEndAfterToday);
          return;
        }
        // 5. 合法才組回字串
        endDate = `${endY.value}-${pad(endM.value)}`;
      }
    
      // 📦 組合經歷內容 payload（含編輯與新增共用欄位）
      const payload = {
      id: editIdx===null ? crypto.randomUUID() : profile.workExperiences[editIdx].id,
      company:     companyInp.value.trim(),
      position:    positionInp.value.trim(),
      startDate,
      endDate,
      description: descInp.value.trim(),
      recommendations: profile.workExperiences[editIdx]?.recommendations || []
  };
      // 🔁 根據 editIdx 是 null 判斷是「新增」還是「編輯」
      if (editIdx==null) {
        // 新增模式：推入整個 payload
        profile.workExperiences.push(payload);
      } else {
        const job = profile.workExperiences[editIdx];
        if (job.recommendations?.length) {
          // 有推薦：只更新描述和結束日期，其他欄位不動
          job.description = payload.description;
          job.endDate     = payload.endDate;
        } else {
          // 無推薦：整筆更新
          Object.assign(job, payload);
        }
      }
      // ✅ 儲存成功後更新畫面內容與卡片樣式
      await saveProfile();
      renderExperienceCards();
      renderBasic();
      // 🆕 顯示新推薦通知（用 localStorage 比對未讀）
      const totalRec = profile.workExperiences.reduce((sum, job) => sum + (job.recommendations?.length || 0), 0);
      const lastRead = parseInt(localStorage.getItem("lastReadCount") || "0");
      // 🆕 若有新推薦內容，顯示提示訊息，並記錄已讀數
      if (totalRec > lastRead) {
        const tNow = i18n[localStorage.getItem("lang")] || i18n.en;
        showToast(tNow.newRecommendation || `🛎️ 你收到了一則新推薦！`);
        localStorage.setItem("lastReadCount", totalRec); // 更新已讀數
      }
      expModal.close();
    };

    // 刪除 / 編輯 / 複製推薦
    list.addEventListener("click", e => {
      const idx = +e.target.dataset.idx;
      if (e.target.matches(".del-btn")) {
        if (confirm(t.deleteConfirm)) {
          profile.workExperiences.splice(idx,1);
          saveProfile().then(renderExperienceCards);
          showToast(t.deleteToast);
        }
      }
      else if (e.target.matches(".edit-btn")) openModalForEdit(idx);
      // 🔗 使用者點擊「複製推薦連結」按鈕，開啟邀請 Modal 並初始化內容
      else if (e.target.matches(".link-btn")) {
        currentJobIndex = idx;
        currentCompany  = profile.workExperiences[idx].company;
        // 📋 根據選擇的邀請風格，自動填入對應預設文案
        function updateDefaultMessage() {
          const style = currentInviteStyle || "warmth";
          currentInviteStyle = style;
          const tNow = i18n[localStorage.getItem("lang")] || i18n.en;
          currentDefaultMsg = (tNow[`defaultInvite_${style}`] || "")
            .replace("{{company}}", currentCompany);
          inviteTextarea.value = currentDefaultMsg;
        }
        // ➌ 第一次打开时填入文案
        updateDefaultMessage();

       // —— 新增：計算並顯示預覽用的 URL —— 
        const langNow = localStorage.getItem("lang") || "en";
        const previewText = (i18n[langNow] || i18n.en).previewLinkText || "🔍 Preview";
        const previewLinkEl = document.getElementById("invitePreviewLink");

        // 🔍 根據使用者輸入內容，產出預覽推薦連結 URL
        function generatePreviewUrl() {
          const message = inviteTextarea.value.trim();
          const jobId   = encodeURIComponent(profile.workExperiences[currentJobIndex].id);
          const style = currentInviteStyle || "warmth";
          const encMsg  = encodeURIComponent(message);
          return `${location.origin}/pages/recommend-form.html`
            + `?userId=${profile.userId}`
            + `&jobId=${jobId}`
            + `&message=${encMsg}`
            + `&style=${style}`
            + `&lang=${langNow}`
            + `&invitedBy=${profile.userId}`;
        }

      // ➋ 初次打開 Modal 時，先填入預設 inviteTextarea（已在你現有 updateDefaultMessage 中）
      // 再把第一次的預覽連結放入
        inviteTextarea.value = "";
        previewLinkEl.setAttribute("href", generatePreviewUrl());
        previewLinkEl.textContent = previewText;
        previewLinkEl.title       = generatePreviewUrl();
        previewLinkEl.classList.add("preview-link");

      // 🆕 點擊「直接風格」按鈕，插入範本並更新預覽連結
      document.getElementById("insertDirect")?.addEventListener("click", () => {
        const tNow = i18n[localStorage.getItem("lang")] || i18n.en;
        const text = (tNow["defaultInvite_direct"] || "").replace("{{company}}", currentCompany);
        inviteTextarea.value = text;
        previewLinkEl.setAttribute("href", generatePreviewUrl());
        previewLinkEl.title = generatePreviewUrl();
      });
      // 🆕 點擊「溫暖風格」按鈕，插入範本並更新預覽連結
      document.getElementById("insertWarmth")?.addEventListener("click", () => {
        const tNow = i18n[localStorage.getItem("lang")] || i18n.en;
        const text = (tNow["defaultInvite_warmth"] || "").replace("{{company}}", currentCompany);
        inviteTextarea.value = text;
        previewLinkEl.setAttribute("href", generatePreviewUrl());
        previewLinkEl.title = generatePreviewUrl();
      });

        // 🆕 使用者手動輸入推薦文字時，自動即時更新預覽連結
        inviteTextarea.addEventListener("input", () => {
          const url = generatePreviewUrl();
          previewLinkEl.setAttribute("href", url);
          previewLinkEl.title = url;
        });

        inviteModal.showModal();
        } 
    });

    // 邀請 Modal 按鈕
    inviteCancelBtn.onclick = () => inviteModal.close();
    // 🔽 儲存推薦邀請，產生 inviteId 並複製分享連結
    inviteSaveBtn.onclick = async () => {
      const langNow = localStorage.getItem("lang") || "en";
      const message = inviteTextarea.value.trim();
      if (!message) {
        showToast(t.inviteEmpty || "請先輸入邀請內容");
        return; // ❌ 中止流程
      }
      const style   = currentInviteStyle || "warmth";
      const job     = profile.workExperiences[currentJobIndex];
      
      let inviteRef; // ✅ 這行是關鍵！提前宣告

      try {
        // 📥 寫入邀請內容至 Firestore 的 invites collection
        inviteRef = await addDoc(collection(db, "invites"), {
          userId: profile.userId,
          jobId: job.id,
          message,
          style,
          lang: langNow,
          invitedBy: profile.userId,
          createdAt: new Date()
        });
        const inviteId = inviteRef.id;
    
        // 2️⃣ 產出最終分享連結
        const finalLink = `${location.origin}/pages/recommend-form.html?inviteId=${inviteId}`;
    
        // 📤 將產生的連結複製到剪貼簿
        await navigator.clipboard.writeText(finalLink);
        showToast(t.linkCopied); // ✅ 成功提示
      } 
      catch (err) {
        console.error("❌ 複製失敗：", err);
      
        // 👉 後備備案：顯示 prompt 讓使用者手動複製
        const fallbackLink = `${location.origin}/pages/recommend-form.html?inviteId=${inviteRef?.id || "unknown"}`;
        prompt(t.linkCopyFailed + "\n\n👇請手動複製這個連結：", fallbackLink);
      
        showToast(t.linkCopyFailed); // 也可以保留原本的 toast 提示
      }
          
      // 4️⃣ 關閉 Modal
      inviteModal.close();
    };    
    
  // 🔽 開啟「新增／編輯經歷」的 Modal，根據是否首次填寫決定是否顯示姓名欄位
  function openModalForAdd(isFirst = false) {
  editIdx = null;
  // 顯示「姓名」欄位只在首次填檔案時
  nameSection.hidden = !isFirst;

  // 如果是「新增經歷」流程，才重置表單
  if (!isFirst) {
    expForm.reset();
  }

 // 🔍 如果是第一次填檔案，顯示對應語系文字（姓名欄位／標題等）
  if (isFirst) {
    renderStaticText();
  }

  // 標題
  modalTitle.textContent = isFirst
    ? t.addProfileTitle
    : t.addExperienceTitle;

  // 期間欄位重置
  stillChk.checked = false;
  endY.disabled = endM.disabled = false;

  // 🕒 填入年月選單，並初始化結束日期是否啟用
  populateYearMonth();
  stillChk.dispatchEvent(new Event("change"));

  // 開啟 Modal
  unlockCore();
  expModal.showModal();
}
    // 🔽 編輯指定 index 的工作經歷，填入對應欄位值與狀態
    function openModalForEdit(idx) {
      editIdx = idx;
      const job = profile.workExperiences[idx];
      // 🔐 若該經歷已有推薦，限制部分欄位不可修改
      const locked = !!job.recommendations?.length;
      nameSection.hidden = true;
      modalTitle.textContent = locked
        ? t.editDescriptionTitle
        : t.editExperienceTitle;
      companyInp.value  = job.company;
      positionInp.value = job.position;
      startY.value      = job.startDate.slice(0,4);
      startM.value      = job.startDate.slice(5,7);
      if (job.endDate) {
        stillChk.checked = false;
        endY.disabled = endM.disabled = false;
        endY.value = job.endDate.slice(0,4);
        endM.value = job.endDate.slice(5,7);
      } else {
        stillChk.checked = true;
        endY.disabled = endM.disabled = true;
      }
      stillChk.dispatchEvent(new Event("change"));
      descInp.value = job.description||"";
      if (locked) lockCore(); else unlockCore();
      expModal.showModal();
    }

    function lockCore() {
      [nameSection, nameInput, englishNameInput,
      companyInp, positionInp, startY, startM]
      .forEach(el => el.disabled = true);
    
      // 放行結束日期下拉
      endY.disabled = endM.disabled = false;
      // 如果之前被隱藏，也把它顯示出來
      endDateContainer.classList.remove("hidden");
    }
    function unlockCore() {
      [nameSection,nameInput,englishNameInput,
       companyInp,positionInp,startY,startM,endY,endM,stillChk]
      .forEach(el=>el.disabled=false);
    }
  });
});