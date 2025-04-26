// public/js/profile-dashboard.js
import { i18n } from "./i18n.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

document.addEventListener("DOMContentLoaded", () => {
  // 多語
  const lang = localStorage.getItem("lang") || "en";
  const t    = i18n[lang] || i18n.en;

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
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      if (t[key] != null) el.textContent = t[key];
    });
  }

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
    bioText.textContent = profile.bio || t.noBio;
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
    if (!user) return location.href = "/login.html";
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

    // 查看總覽按鈕
    if (addBtn) {
      const btn = document.createElement("a");
      btn.href   = `recommend-summary.html?userId=${profile.userId}&jobIndex=0`;
      btn.target = "_blank";
      btn.className = "cta-btn";
      btn.textContent = t.viewSummaryAll;
      addBtn.insertAdjacentElement("afterend", btn);
    }

    // 第一次 fill vs 無經歷都要開 Modal
    if (!snap.exists()) {
      openModalForAdd(true);
    } else if (!profile.workExperiences.length && !prefillUsed) {
    // 只有在沒有預填過姓名時，才開（填經歷）模式
      openModalForAdd(false);
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
      else if (e.target.matches(".link-btn")) {
        currentJobIndex = idx;
        currentCompany  = profile.workExperiences[idx].company;
        inviteStyleSelect.value = "warmth";
        currentInviteStyle = "warmth";
        currentDefaultMsg  = (t[`defaultInvite_warmth`]||"")
          .replace("{{company}}", currentCompany);
        inviteTextarea.value = currentDefaultMsg;
        inviteModal.showModal();
      }
    });

    // 邀請 Modal 按鈕
    inviteCancelBtn.onclick = ()=>inviteModal.close();
    inviteSaveBtn.onclick = ()=>{
      currentInviteStyle = inviteStyleSelect.value;
      const msg = inviteTextarea.value.trim()||currentDefaultMsg;
      const jobId = profile.workExperiences[currentJobIndex].id;
      const url = `${location.origin}/recommend-form.html`
               + `?userId=${profile.userId}`
               + `&jobId=${encodeURIComponent(jobId)}`
               + `&message=${encodeURIComponent(msg)}`
               + `&style=${currentInviteStyle}`;

      navigator.clipboard.writeText(url)
        .then(()=>showToast(t.linkCopied))
        .catch(()=>showToast(t.linkCopyFailed));
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
