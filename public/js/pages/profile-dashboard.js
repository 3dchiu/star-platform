// public/js/profile-dashboard.js
import { i18n, setLang } from "../i18n.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { firebaseConfig } from "../firebase-config.js";

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

document.addEventListener("DOMContentLoaded", () => {
  // 一進來先隱藏整個主內容、顯示遮罩
document.getElementById("dashboardLoading").style.display = "flex";

  // 多語
  const lang = localStorage.getItem("lang") || "en";
  // 切換語系時，自動更新所有 [data-i18n] 文案（含動態按鈕）
  window.addEventListener("langChanged", () => {
    renderStaticText();    // 更新所有 data-i18n 文字
    renderBio();          // 再重新把 bio 內容塞回去
    updateOnboardingText(); // （如果有這個小卡多語也一起跑）
  });  
  const t    = i18n[lang] || i18n.en;
  document.getElementById("loadingDashboardText").innerText = t.loadingDashboardMessage;

  // 元件對應
  const nameSection      = document.getElementById("nameSection");
  const chineseNameInput = document.getElementById("chineseNameInput");
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
  const descInp          = document.getElementById("descInput");

  const inviteModal       = document.getElementById("inviteModal");
  const inviteTextarea    = document.getElementById("inviteTextarea");
  const inviteStyleSelect = document.getElementById("inviteStyleSelect");
  const inviteCancelBtn   = document.getElementById("inviteCancelBtn");
  const inviteSaveBtn     = document.getElementById("inviteSaveBtn");

  // 暫存
  let profile = { userId:"", chineseName:"", englishName:"", bio:"", workExperiences:[] };
  let editIdx, currentJobIndex, currentCompany, currentDefaultMsg, currentInviteStyle;
  // ===== 新增這段 =====
  // 1. 把更新小卡文字的邏輯包成函式
  function updateOnboardingText() {
    const langNow = localStorage.getItem("lang") || "en";
    const onb = i18n[langNow]?.onboarding || i18n.en.onboarding;
    document.getElementById("onboardingTitle").innerText = onb.title;
    document.getElementById("onboardingSteps").innerHTML =
      onb.steps.map(s => `<li>${s}</li>`).join("");
  }
  // ===== 結束新增 =====
  // ===== 工具函式 =====
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
      endY.disabled = endM.disabled = stillChk.checked;
      if (stillChk.checked) endY.value = endM.value = "";
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

  async function saveProfile() {
    if (!profile.userId) return;
    await setDoc(doc(db, "users", profile.userId), profile);
  }

  function renderBasic() {
    basicInfo.innerHTML = `
      <h1>${profile.chineseName || ""}</h1>
      ${profile.englishName ? `<p>${profile.englishName}</p>` : ""}
      <p>${profile.workExperiences.length} ${t.workExperiences}</p>`;
  }

  function renderBio() {
    // 取出存库的文字（可能包含 \n）
    const raw = profile.bio || "";
    // 把换行符 ("\n") 全部换成 <br>，再放进 innerHTML
    bioText.innerHTML = raw
      ? raw.replace(/\n/g, "<br>")
      : t.noBio;
  }
  
  console.log("合併後的 experiences:", profile.workExperiences);
  function renderExperienceCards() {
    list.innerHTML = "";
    const grouped = {};
    profile.workExperiences.sort((a,b)=>b.startDate.localeCompare(a.startDate))
      .forEach(job=> (grouped[job.company] = grouped[job.company]||[]).push(job));
    Object.entries(grouped).forEach(([comp,jobs])=>{
      const wrap = document.createElement("div");
      wrap.className = "company-card";
      wrap.innerHTML = `<div class="company-title">${comp}</div>`;
      jobs.forEach(job=>{
        const idx = profile.workExperiences.indexOf(job);
        const hasRec = !!job.recommendations?.length;
        const recHTML = hasRec 
          ? job.recommendations.map(r=>`
            <div class="rec-card">
              <span class="name">${r.name}</span>
              <span class="meta">（${r.relation}）</span><br>${r.content}
            </div>`).join("")
          : "";
        wrap.insertAdjacentHTML("beforeend", `
          <div class="role-card">
            <strong>${job.position}</strong>
            ${hasRec?`<span class="lock-tip">🔒</span>`:""}
            <button class="link-btn" data-idx="${idx}">🔗</button>
            <button class="edit-btn" data-idx="${idx}">📝</button>
            <button class="del-btn" data-idx="${idx}">🗑️</button>
            <div>${job.startDate} ～ ${job.endDate||t.currentlyWorking}</div>
            ${job.description?`<div>${job.description}</div>`:""}
            ${recHTML}
          </div>`);
      });
      list.appendChild(wrap);
    });
  }

  function showToast(msg) {
    const d = document.createElement("div");
    d.className = "toast";
    d.textContent = msg;
    document.body.appendChild(d);
    setTimeout(()=>d.remove(),3000);
  }

  // ===== 監聽登入狀態 & 初始渲染 =====
  onAuthStateChanged(auth, async user => {
    if (!user) return location.href = "/pages/login.html";
    profile.userId = user.uid;
    // 🏷️ 是否用過 sessionStorage 的預填功能
    let prefillUsed = false;


    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
    profile = snap.data();
    // —— 不論 profile 是否存在，都先檢查 sessionStorage 裡的 prefillName ——

  
      // === 🔥 修正 workExperiences 不是陣列的情況 ===
      if (!Array.isArray(profile.workExperiences)) {
        const values = Object.values(profile.workExperiences || {});
        console.warn(`⚠️ [${profile.userId}] workExperiences 非陣列，自動轉換為陣列：`, values);
        profile.workExperiences = values;
      }
    } else {
      localStorage.removeItem("profile");
      profile = {
        userId: user.uid, chineseName:"", englishName:"", bio:"", workExperiences:[]
      };
      await setDoc(ref, profile);
    }
    // —— 不論文件存不存在，都先檢查 sessionStorage 裡的 prefillName —— 
    const prefillName = sessionStorage.getItem("prefillName");
    if (prefillName) {
      // 填入「中文姓名」輸入框
      const nameInput = document.getElementById("chineseNameInput");
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

    // … 讀取 profile 並 normalize 之後 …
    profile.workExperiences = profile.workExperiences||[];
    profile.workExperiences.forEach(j=>{ if (!j.endDate) j.endDate=""; });
    // … 讀取 profile 並 normalize 之後，先把 recommendations 清空，避免重複 …
    profile.workExperiences = profile.workExperiences||[];
    profile.workExperiences.forEach(j => {
      // 1. 統一 endDate
      if (!j.endDate) j.endDate = "";
      // 2. 清空上一輪合併的 recommendations
      j.recommendations = [];
    });

    // 🔥 讀取 recommendations 子集合，並用 jobId 合併到對應工作
    const recColRef   = collection(db, "users", user.uid, "recommendations");
    const recSnapshot = await getDocs(recColRef);
    recSnapshot.forEach(docSnap => {
      const rec = docSnap.data();
      // 找到 id 符合的那筆工作
      const job = (profile.workExperiences || []).find(j => j.id === rec.jobId);
      if (job) {
        job.recommendations = job.recommendations || [];
        job.recommendations.push(rec);
      }
    });    
    // 再呼叫 renderExperienceCards()
    populateYearMonth();
    renderStaticText();
    renderBasic();
    renderBio();
    renderExperienceCards();
    updateOnboardingText();

    // ===== 在這裡插入隱藏遮罩 =====
    document.getElementById("dashboardLoading").style.display = "none";

    // 3. 顯示小卡（由 toggleQuickStartCard 決定 display）並觸發淡入
    const card = document.getElementById("quickStartCard");
    // 注意：toggleQuickStartCard 已幫你做 display:block/none
    setTimeout(() => card.classList.add("show"), 300);
    // ===== 結束 Onboarding 小卡多語＆淡入動畫 =====
    // ===== 新增：快速開始小卡的顯示邏輯 =====
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
    // 1. 用 <button> 取代 <a>，並保留原本 addBtn 的 class 以保持樣式一致
    const btn = document.createElement("button");
    btn.type      = "button";
    btn.className = addBtn.className;
    btn.setAttribute("data-i18n", "viewSummaryAll");

    // 2. 點擊時打開新分頁
    btn.addEventListener("click", () => {
      window.open(
        `/pages/recommend-summary.html?userId=${profile.userId}&jobIndex=0`,
        "_blank"
      );
    });

    // 3. 插入並立即渲染文字
    addBtn.insertAdjacentElement("afterend", btn);
    renderStaticText();
    

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
    expForm.onsubmit = async e => {
      e.preventDefault();
    
      // ★ 初次填姓名
      if (!profile.chineseName && chineseNameInput.value.trim()) {
        profile.chineseName = chineseNameInput.value.trim();
        profile.englishName = englishNameInput.value.trim();
        renderBasic();
      }
    
      const pad = v => v.padStart(2, "0");
      const startDate = `${startY.value}-${pad(startM.value)}`;
    
      // 驗證結束日期：只有「未勾選仍在職」才需要檢查
      let endDate = "";
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
    
        // 3. 結束不能早於開始
        if (endObj < startObj) {
          showToast(t.errEndBeforeStart);
          return;
        }
        // 4. 結束不能超過今天
        if (endObj > today) {
          showToast(t.errEndAfterToday);
          return;
        }
        // 5. 合法才組回字串
        endDate = `${endY.value}-${pad(endM.value)}`;
      }
    
      // 組 payload
      const payload = {
      id: editIdx===null ? crypto.randomUUID() : profile.workExperiences[editIdx].id,
      company:     companyInp.value.trim(),
      position:    positionInp.value.trim(),
      startDate,
      endDate,
      description: descInp.value.trim(),
      recommendations: profile.workExperiences[editIdx]?.recommendations || []
  };

      if (editIdx==null) profile.workExperiences.push(payload);
      else {
        const job = profile.workExperiences[editIdx];
        if (job.recommendations?.length) job.description = payload.description;
        else Object.assign(job, payload);
      }

      await saveProfile();
      renderExperienceCards();
      renderBasic();
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
      // 在 list.addEventListener(... link-btn) 里面
      else if (e.target.matches(".link-btn")) {
        currentJobIndex = idx;
        currentCompany  = profile.workExperiences[idx].company;
      // ➊ 先定义更新预设文案的函数
        function updateDefaultMessage() {
          const style = inviteStyleSelect.value;  // direct or warmth
          currentInviteStyle = style;
          const tNow = i18n[localStorage.getItem("lang")] || i18n.en;
          currentDefaultMsg = (tNow[`defaultInvite_${style}`] || "")
            .replace("{{company}}", currentCompany);
          inviteTextarea.value = currentDefaultMsg;
        }
        // ➋ 设定下拉选单默认值（如有需要可改成用户上次选择的样式）
        inviteStyleSelect.value = "warmth";
        // ➌ 第一次打开时填入文案
        updateDefaultMessage();

        // —— 新增：計算並顯示預覽用的 URL —— 
      const langNow = localStorage.getItem("lang") || "en";
      // —— 用「原始中文」組 URL 字串，不做 encodeURIComponent —— 
      const previewUrlRaw = `${location.origin}/pages/recommend-form.html`
        + `?userId=${profile.userId}`
        + `&jobId=${encodeURIComponent(profile.workExperiences[currentJobIndex].id)}`
        + `&message=${currentDefaultMsg}`        // **直接插入原文**
        + `&style=${currentInviteStyle}`
        + `&lang=${langNow}`;

      const previewLinkEl = document.getElementById("invitePreviewLink");
      // 用 setAttribute 保留你写进去的中文，不自动编码
      previewLinkEl.setAttribute("href", previewUrlRaw);

      previewLinkEl.textContent = previewText;    // 顯示短標籤
      previewLinkEl.title       = previewUrl;     // 滑鼠移上可見完整連結
      previewLinkEl.classList.add("preview-link");

        // ➍ 监听用户切换样式
        inviteStyleSelect.addEventListener("change", updateDefaultMessage);
        inviteModal.showModal();
      } 
    });

    // 邀請 Modal 按鈕
    inviteCancelBtn.onclick = () => inviteModal.close();
    inviteSaveBtn.onclick = () => {
      const previewLinkEl = document.getElementById("invitePreviewLink");
      // 「預覽按鈕」的 href 已經是那條帶中文的完整鏈結
      // 直接複製它
      navigator.clipboard.writeText(previewLinkEl.getAttribute("href"))
        .then(() => showToast(t.linkCopied))
        .catch(() => showToast(t.linkCopyFailed));
      inviteModal.close();
    };

    // 打開 Add/Edit Modal
  function openModalForAdd(isFirst = false) {
  editIdx = null;
  // 顯示「姓名」欄位只在首次填檔案時
  nameSection.hidden = !isFirst;

  // 如果是「新增經歷」流程，才重置表單
  if (!isFirst) {
    expForm.reset();
  }

  // 首次填檔案模式下，渲染語系文字
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

  // 年月下拉選單
  populateYearMonth();

  // 開啟 Modal
  expModal.showModal();
}


    function openModalForEdit(idx) {
      editIdx = idx;
      const job = profile.workExperiences[idx];
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
      descInp.value = job.description||"";
      if (locked) lockCore(); else unlockCore();
      expModal.showModal();
    }

    function lockCore() {
      [nameSection,chineseNameInput,englishNameInput,
       companyInp,positionInp,startY,startM,endY,endM,stillChk]
      .forEach(el=>el.disabled=true);
    }
    function unlockCore() {
      [nameSection,chineseNameInput,englishNameInput,
       companyInp,positionInp,startY,startM,endY,endM,stillChk]
      .forEach(el=>el.disabled=false);
    }
  });
});
