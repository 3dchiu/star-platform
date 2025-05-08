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
    renderExperienceCards();   // ✅ 新增這行，讓卡片內容（含提示）也依語言切換
  });  
  const t    = i18n[lang] || i18n.en;
  document.getElementById("loadingDashboardText").innerText = t.loadingDashboardMessage;

  // 元件對應
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
  const inviteStyleSelect = document.getElementById("inviteStyleSelect");
  const inviteCancelBtn   = document.getElementById("inviteCancelBtn");
  const inviteSaveBtn     = document.getElementById("inviteSaveBtn");

  // 暫存
  let profile = { userId:"", name:"", englishName:"", bio:"", workExperiences:[] };
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
      await setDoc(
        doc(db, "users", profile.userId),
        profile,
        { merge: true }
      );
      console.log("✅ saveProfile() 写入成功");
    } catch (err) {
      console.error("❌ saveProfile() 写入失败：", err);
    }
    console.groupEnd();
  }
  
  

  function renderBasic() {
    basicInfo.innerHTML = `
      <h1>${profile.name || ""}</h1>
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
      profile = {
        userId: user.uid,
        ...snap.data()
      };
  
      // === 🔥 修正 workExperiences 不是陣列的情況 ===
      if (!Array.isArray(profile.workExperiences)) {
        const values = Object.values(profile.workExperiences || {});
        console.warn(`⚠️ [${profile.userId}] workExperiences 非陣列，自動轉換為陣列：`, values);
        profile.workExperiences = values;
      }
    } else {
      localStorage.removeItem("profile");
      profile = {
        userId: user.uid, name:"", englishName:"", bio:"", workExperiences:[]
      };
      await setDoc(ref, {
        ...profile,
        createdAt: new Date()
      });      
    }
    // —— 不論文件存不存在，都先檢查 sessionStorage 裡的 prefillName —— 
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

    // … 讀取 profile 並 normalize 之後 …
    profile.workExperiences = profile.workExperiences||[];
    profile.workExperiences.forEach(j=>{ if (!j.endDate) j.endDate=""; });
    // … 讀取 profile 並 normalize 之後，先把 recommendations 清空，避免重複 …
    profile.workExperiences = profile.workExperiences || [];
    profile.workExperiences.forEach(j => {
      if (!j.endDate) j.endDate = "";
    });
    // ✅ 清空每筆經歷的 recommendations，避免重複 push
    profile.workExperiences.forEach(j => j.recommendations = []);

    // ✅ 自 Firestore 抓取推薦資料並套入對應 job
    const recSnap = await getDocs(collection(db, "users", profile.userId, "recommendations"));
for (const docSnap of recSnap.docs) {
  const rec = docSnap.data();
  const targetJob = profile.workExperiences.find(j => j.id === rec.jobId);
  if (targetJob) {
    // 👉 嘗試從 pendingUsers 中找到此推薦者是否已註冊成正式帳號
    if (rec.invitedBy) {
      const recommenderSnap = await getDoc(doc(db, "users", rec.invitedBy));
      if (recommenderSnap.exists()) {
        // ⚠️ 暫時移除這段寫入 recommenderId 的程式碼，改由 Cloud Function 處理
        // if (!rec.recommenderId) {
        //   await setDoc(
        //     doc(db, "users", profile.userId, "recommendations", docSnap.id),
        //     { recommenderId: rec.invitedBy },
        //     { merge: true }
        //   );
        //   rec.recommenderId = rec.invitedBy;
        // }
      }
    }

    targetJob.recommendations.push(rec);
  }
}

    let nodesMap = {};
    let links    = [];
    let userMap  = {};
    const allUsers = await getDocs(collection(db, "users"));
    for (const userDoc of allUsers.docs) {
      const targetId = userDoc.id;

      const recSnap = await getDocs(
        collection(db, "users", targetId, "recommendations")
      );

      recSnap.forEach(recDoc => {
        const rec = recDoc.data();
        const fromId = rec.invitedBy;

        if (!nodesMap[fromId]) {
          nodesMap[fromId] = {
            id: fromId,
            label: userMap[fromId] || rec.name || fromId,
          };
        }
        if (!nodesMap[targetId]) {
          nodesMap[targetId] = {
            id: targetId,
            label: userMap[targetId] || targetId,
          };
        }
        links.push({ from: fromId, to: targetId });
      });
    }
    
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
   // 插入到新容器裡
    const actionBtns = document.getElementById("actionBtns");

   // ✅ 新增「新增工作經歷」按鈕
    const addBtn = document.createElement("button");
    addBtn.id = "addBtn";
    addBtn.type = "button";
    addBtn.className = "cta-btn";
    addBtn.innerHTML = "➕ <span data-i18n='addExperience'>新增工作經歷</span>";
    actionBtns.appendChild(addBtn);

    // 新增「推薦總覽」按鈕
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = addBtn.className;
    btn.setAttribute("data-i18n", "viewSummaryAll");
    actionBtns.appendChild(btn);

    // 新增「公開推薦頁」按鈕
    const previewBtn = document.createElement("button");
    previewBtn.type = "button";
    previewBtn.className = addBtn.className;
    previewBtn.setAttribute("data-i18n", "viewPublicSummary");
    actionBtns.appendChild(previewBtn);

    actionBtns.appendChild(btn);
    actionBtns.appendChild(previewBtn);

    // 點擊動作
    btn.addEventListener("click", () => {
      window.open(
        `/pages/recommend-summary.html?userId=${profile.userId}&jobIndex=0`,
        "_blank"
      );
    });
    previewBtn.addEventListener("click", () => {
      window.open(
        `/pages/recommend-summary.html?public=true&userId=${profile.userId}`,
        "_blank"
      );
    });

    // 最後記得渲染語系
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
      if (!profile.name && nameInput.value.trim()) {
        profile.name = nameInput.value.trim();
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
        const previewText = (i18n[langNow] || i18n.en).previewLinkText || "🔍 Preview";
        const previewLinkEl = document.getElementById("invitePreviewLink");

      // ➊ 把產生 URL 的邏輯包成一個函式
        function generatePreviewUrl() {
          const message = inviteTextarea.value.trim();
          const jobId   = encodeURIComponent(profile.workExperiences[currentJobIndex].id);
          const style   = inviteStyleSelect.value;
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
        inviteTextarea.value = currentDefaultMsg;
        previewLinkEl.setAttribute("href", generatePreviewUrl());
        previewLinkEl.textContent = previewText;
        previewLinkEl.title       = generatePreviewUrl();
        previewLinkEl.classList.add("preview-link");

      // ➌ 監聽「textarea 輸入」事件，動態更新 previewLink
        inviteTextarea.addEventListener("input", () => {
          const url = generatePreviewUrl();
          previewLinkEl.setAttribute("href", url);
          previewLinkEl.title = url;
        });

      // ➍ 監聽「風格切換」時，也要更新 inviteTextarea 及 previewLink
        inviteStyleSelect.addEventListener("change", () => {
          updateDefaultMessage();           // 會更新 inviteTextarea.value
          const url = generatePreviewUrl();
          previewLinkEl.setAttribute("href", url);
          previewLinkEl.title = url;
        });
        inviteModal.showModal();
        } 
    });

    // 邀請 Modal 按鈕
    inviteCancelBtn.onclick = () => inviteModal.close();

    inviteSaveBtn.onclick = () => {
      const langNow = localStorage.getItem("lang") || "en";
      const message = inviteTextarea.value.trim(); // 動態讀取使用者輸入
      const jobId   = encodeURIComponent(profile.workExperiences[currentJobIndex].id);
      const style   = inviteStyleSelect.value;

      const finalLink = `${location.origin}/pages/recommend-form.html`
        + `?userId=${profile.userId}`
        + `&jobId=${jobId}`
        + `&message=${encodeURIComponent(message)}`
        + `&style=${style}`
        + `&lang=${langNow}`
        + `&invitedBy=${profile.userId}`;

      navigator.clipboard.writeText(finalLink)
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
  stillChk.dispatchEvent(new Event("change"));

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