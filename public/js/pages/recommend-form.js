// public/js/recommend-form.js
import { i18n, setLang } from "../i18n.js";
import { firebaseConfig } from "../firebase-config.js";

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();  // ✅ 加這行
// 解析 URL 參數
const params = new URLSearchParams(window.location.search);
const userId = params.get("userId");
const jobId = params.get("jobId");
const urlMessage = params.get("message");
const style = params.get("style") || "direct";
// —— 新增：如果 URL 有带 lang，就强制套用此語系 ——
const forcedLang = params.get("lang");
const invitedBy = params.get("invitedBy");  // ✅ 新增：推薦來源 userId
const inviteId = params.get("inviteId");  // 新增

if (forcedLang) {
  // 1) 立即切換 i18n
  setLang(forcedLang);
  // 2) 同步覆寫 localStorage，供后续取用
  localStorage.setItem("lang", forcedLang);
}
// 控制邀請內容是否為預設公版
let userEdited = false;

// 暫存被推薦者與職缺資料
let profileData = null;
let jobData = null;

// 渲染函式：刷新整個表單的動態區塊
function renderPageByLang() {
  const langNow = localStorage.getItem("lang") || "en";
  const t = i18n[langNow] || i18n.en;
 //切語系時自動覆蓋邀請框 
 // const defaultInvite = t[`defaultInvite_${style}`] || t.defaultInvite_direct;
 // const inviteArea = document.getElementById("inviteContent");
 //   if (!userEdited) {inviteArea.value = defaultInvite;} 

  // 更新頁面標題
  document.title = t.pageTitle;
  document.getElementById("formTitle").innerText = t.formTitle;
  // 👉 插入表單最末提醒：Galaxyz 建立於真實與信任
  const finalEl = document.getElementById("finalReminder");
  if (finalEl) {
    finalEl.innerHTML = t.recommendForm?.identityReminder || t.identityReminder || "";
  }

  // 推薦說明：「您正在為 XXX 撰寫推薦」
  const noteEl = document.getElementById("recommendNote");
  const raw = t.recommendingTo;
  const name = profileData.name || profileData.name || "";
  const greeting = typeof raw === "function" ? raw(name) : raw.replace("{name}", name);
  if (noteEl) noteEl.innerHTML = greeting;

  // 更新職缺區塊
  const jobInfoDiv = document.getElementById("jobInfo");
  jobInfoDiv.innerHTML = `
    <p><strong>${t.company}:</strong> ${jobData.company || t.undefinedCompany}</p>
    <p><strong>${t.position}:</strong> ${jobData.position || t.undefinedPosition}</p>
    <p><strong>${t.period}:</strong> ${jobData.startDate || "--"} ～ ${jobData.endDate || t.currentlyWorking}</p>
  `;

  // 更新邀請區
  const inviteTitleEl = document.getElementById("inviteTitle");
  inviteTitleEl.innerText = t.inviteTitle;

  // 更新表單欄位
  document.getElementById("labelName").innerText = t.name;
  document.getElementById("labelEmail").innerText = t.email;
  document.getElementById("labelRelation").innerText = t.relation;
  document.getElementById("labelHighlights").innerText = t.highlightLabel;
  document.getElementById("hintHighlights").innerText = t.hintHighlights;
  document.getElementById("labelContent").innerText = t.contentLabel;
  document.getElementById("hintContent").innerText = t.hintContent;
  document.getElementById("submitBtn").innerText = t.submitRecommendation;

  // 更新 relation 下拉
  const relSel = document.getElementById("relation"); relSel.innerHTML = "";
  t.relationOptions.forEach(opt => {
    const o = document.createElement("option");
    o.value = opt.value;        // 傳送資料用 value（如 "directManager"）
    o.textContent = opt.label;  // 顯示文字用 label（如 "我是他的主管"）
    relSel.appendChild(o);
  });
  

  // 更新三個推薦亮點
  const hlContainer = document.getElementById("highlightsContainer"); hlContainer.innerHTML = "";
  // 把 className 改成 option-label 並使用 input + span 結構
  t.highlightOptions.forEach(key => {
    const lab = document.createElement("label");
    lab.className = "option-label";
    // 🔁 修改為 radio，name="highlight"
    lab.innerHTML = `
      <input type="radio" name="highlight" value="${key}">
      <span class="option-text">${t.highlightOptionLabels[key] || key}</span>
      `;
    hlContainer.appendChild(lab);
  });
}

window.addEventListener("DOMContentLoaded", async () => {
  let userId = params.get("userId");
  let jobId  = params.get("jobId");
  let urlMessage = params.get("message");

  if (inviteId) {
    try {
      const inviteSnap = await db.collection("invites").doc(inviteId).get();
      if (inviteSnap.exists) {
        const inviteData = inviteSnap.data();
        userId = inviteData.userId;
        jobId  = inviteData.jobId;
        urlMessage = inviteData.message;
      } else {
        throw new Error("Invite not found");
      }
    } catch (err) {
      document.getElementById("loadingMessage").style.display = "none";
      document.getElementById("errorMessage").innerText = "Invalid or expired invite link.";
      document.getElementById("errorMessage").style.display = "block";
      return;
    }
  }

  if (forcedLang) {
    document.documentElement.lang = forcedLang;
  }
  document.getElementById("formContainer").style.display = "none";
  document.getElementById("loadingMessage").style.display = "block";
  // 延遲確保 DOM 可用
  await new Promise(r => setTimeout(r, 200));

  // 初始語系設定並更新所有 data-i18n 靜態文字
  const initLang = localStorage.getItem("lang") || "en";
  setLang(initLang);

  // 取得初始預設邀請文字
  const tInit = i18n[initLang] || i18n.en;
  const defaultInviteInit = tInit[`defaultInvite_${style}`] || tInit.defaultInvite_direct;
  document.getElementById("loadingText").innerText = tInit.loadingMessage;

  // 初始邀請內容
  const inviteArea = document.getElementById("inviteContent");
if (urlMessage) {
  // URL 帶入的文字視為「自訂」，標記已編輯
  inviteArea.value = decodeURIComponent(urlMessage);
  userEdited = true;
} else {
  // 否則用預設
  inviteArea.value = defaultInviteInit;
}
// 保留：使用者打字就視為「自訂」
inviteArea.addEventListener("input", () => { userEdited = true; });


  // 監聽 header.js 發出的語系變更事件，立即重繪
  window.addEventListener("langChanged", () => {
    renderPageByLang();
  
    // —— 新增：初始化時也更新 Open Graph Meta ——  
  const langNow2 = localStorage.getItem("lang") || "en";
  const t2 = i18n[langNow2] || i18n.en;
  document.getElementById("ogTitleMeta").setAttribute("content", t2.ogTitle);
  document.getElementById("ogDescMeta").setAttribute("content", t2.ogDescription);
  document.getElementById("ogUrlMeta").setAttribute("content", window.location.href);

  });

  // 初始化 Firebase, 讀取使用者 profile & 職缺
  const snap = await db.doc(`users/${userId}`).get();
  if (!snap.exists) { 
    document.getElementById("formContainer").style.display = "none";
    document.getElementById("loadingMessage").style.display = "none";
    const err = document.getElementById("errorMessage");
    err.innerText = "User not found.";
    err.style.display = "block";
    return;
  }
  profileData = snap.data();
  let exps = profileData.workExperiences;
  if (!Array.isArray(exps)) exps = Object.values(exps || {});
  exps.sort((a,b) => b.startDate.localeCompare(a.startDate));
  jobData = exps.find(j => j.id === jobId);
  if (!jobData) {
    document.getElementById("formContainer").style.display = "none";
    document.getElementById("loadingMessage").style.display = "none";
    const err = document.getElementById("errorMessage");
    err.innerText = "Job not found or link is invalid.";
    err.style.display = "block";
    return;
  }  
  // 首次渲染
  renderPageByLang();
  // 資料載入成功：關掉 Loading，開啟表單
  document.getElementById("loadingMessage").style.display = "none";
  document.getElementById("formContainer").style.display = "block";

  const form = document.getElementById("recommendForm");
  form.addEventListener("submit", async e => {
    e.preventDefault();
  
    const btn = document.getElementById("submitBtn");
    btn.disabled = true;
    btn.innerText = (localStorage.getItem("lang") === "zh-Hant") ? "送出中..." : "Submitting...";
  
    const customHighlight = document.getElementById("customHighlight").value.trim();
    const highlights = Array.from(document.querySelectorAll('input[name="highlight"]:checked'))
      .map(cb => cb.value);
    if (customHighlight) highlights.push(customHighlight);

    // 🔍 用 email 查 Firestore 是否已經註冊為正式使用者
    const checkIfRegistered = async (email) => {
      const snapshot = await db.collection("users").where("email", "==", email).limit(1).get();
      return !snapshot.empty;
    };

    const rec = {
      name: document.getElementById("name").value.trim(),
      email: document.getElementById("email").value.trim(),
      relation: document.getElementById("relation").value,
      highlights,
      content: document.getElementById("content").value.trim(),
      inviteMessage: document.getElementById("inviteContent").value.trim(),
      jobId,
      invitedBy: invitedBy || null,
      recommenderId: auth.currentUser?.uid || null,   // ✅ 新增這行
      claimedBy: null,            // 🆕 預留：目前尚未歸戶
      claimMethod: null,           // 🆕 預留：未來可標示為 "manual" 或 "auto"
      inviteId: inviteId || null,   // ✅ 新增這一行
    };
  
    const recCollection = db.collection("users").doc(userId).collection("recommendations");
    const existing = await recCollection
      .where("email", "==", rec.email)
      .where("jobId", "==", rec.jobId)
      .get();
  
    if (!existing.empty) {
      const lang = localStorage.getItem("lang") || "en";
      const msg = (lang === "zh-Hant")
        ? "您已經提交過這段推薦囉，無需重複填寫！"
        : "You've already submitted a recommendation for this experience!";
      alert(msg);
      btn.disabled = false;
      btn.innerText = (lang === "zh-Hant") ? "送出推薦" : "Submit Recommendation";
      return;
    }
  
    // ✅ 儲存推薦內容
    await recCollection.add(rec);
  
    // ✅ 檢查 email 是否已經註冊
    const alreadyRegistered = await checkIfRegistered(rec.email);

    if (!alreadyRegistered) {
      const existingPending = await db.collection("pendingUsers")
        .where("email", "==", rec.email)
        .limit(1)
        .get();

      if (existingPending.empty) {
        await db.collection("pendingUsers").add({
          name: rec.name,
          email: rec.email,
          invitedBy: rec.invitedBy,
          fromRecommendation: true,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
    }
    // ✅ 導向 thank-you 頁
    sessionStorage.setItem("prefillEmail", rec.email);
    sessionStorage.setItem("prefillName", rec.name);
    window.location.href = `thank-you.html?userId=${profileData.userId}&style=${style}`
      + `&recommenderName=${encodeURIComponent(rec.name)}`
      + `&recommenderEmail=${encodeURIComponent(rec.email)}`
      + (inviteId ? `&inviteId=${inviteId}` : "");
  });  
});