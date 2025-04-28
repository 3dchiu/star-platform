// public/js/recommend-form.js
import { i18n, setLang } from "../i18n.js";
import { firebaseConfig } from "../firebase-config.js";

// 解析 URL 參數
const params = new URLSearchParams(window.location.search);
const userId = params.get("userId");
const jobId = params.get("jobId");
const urlMessage = params.get("message");
const style = params.get("style") || "direct";

// 控制邀請內容是否為預設公版
let userEdited = false;
let isUsingDefaultInvite = false;

// 暫存被推薦者與職缺資料
let profileData = null;
let jobData = null;

// 渲染函式：刷新整個表單的動態區塊
function renderPageByLang() {
  const langNow = localStorage.getItem("lang") || "en";
  const t = i18n[langNow] || i18n.en;
  const defaultInvite = t[`defaultInvite_${style}`] || t.defaultInvite_direct;

  // 更新頁面標題
  document.title = t.pageTitle;
  document.getElementById("formTitle").innerText = t.formTitle;

  // 更新推薦對象小標
  const titleEl = document.getElementById("formTitle");
  const raw = t.recommendingTo;
  const name = profileData.chineseName || profileData.name || "";
  const greeting = typeof raw === "function" ? raw(name) : raw.replace("{name}", name);
  const oldSub = titleEl.querySelector(".sub-title");
  if (oldSub) oldSub.remove();
  titleEl.insertAdjacentHTML("beforeend", `<div class=\"sub-title text-lg text-gray-600 mt-1\">${greeting}</div>`);

  // 更新職缺區塊
  const jobInfoDiv = document.getElementById("jobInfo");
  jobInfoDiv.innerHTML = `
    <p><strong>${t.company}:</strong> ${jobData.company || t.undefinedCompany}</p>
    <p><strong>${t.position}:</strong> ${jobData.position || t.undefinedPosition}</p>
    <p><strong>${t.period}:</strong> ${jobData.startDate || "--"} ～ ${jobData.endDate || t.currentlyWorking}</p>
  `;

  // 更新邀請區
  const inviteTitleEl = document.getElementById("inviteTitle");
  const inviteArea = document.getElementById("inviteContent");
  inviteTitleEl.innerText = t.inviteTitle;
  if (isUsingDefaultInvite && !userEdited) {
    inviteArea.value = defaultInvite;
  }

  // 更新表單欄位
  document.getElementById("labelName").innerText = t.name;
  document.getElementById("labelEmail").innerText = t.email;
  document.getElementById("labelRelation").innerText = t.relation;
  document.getElementById("labelHighlights").innerText = t.highlightLabel;
  document.getElementById("labelContent").innerText = t.contentLabel;
  document.getElementById("hintContent").innerText = t.hintContent;
  document.getElementById("submitBtn").innerText = t.submitRecommendation;

  // 更新 relation 下拉
  const relSel = document.getElementById("relation"); relSel.innerHTML = "";
  t.relationOptions.forEach(opt => {
    const o = document.createElement("option"); o.textContent = opt; relSel.appendChild(o);
  });

  // 更新四個推薦亮點
  const hlContainer = document.getElementById("highlightsContainer"); hlContainer.innerHTML = "";
  t.highlightOptions.forEach(key => {
    const lab = document.createElement("label"); lab.className = "checkbox-label";
    lab.innerHTML = `<input type=\"checkbox\" name=\"highlight\" value=\"${key}\"> <span>${t.highlightOptionLabels[key] || key}</span>`;
    hlContainer.appendChild(lab);
  });
}

window.addEventListener("DOMContentLoaded", async () => {
  // 延遲確保 DOM 可用
  await new Promise(r => setTimeout(r, 200));

  // 初始語系設定並更新所有 data-i18n 靜態文字
  const initLang = localStorage.getItem("lang") || "en";
  setLang(initLang);

  // 取得初始預設邀請文字
  const tInit = i18n[initLang] || i18n.en;
  const defaultInviteInit = tInit[`defaultInvite_${style}`] || tInit.defaultInvite_direct;

  // 初始邀請內容
  const inviteArea = document.getElementById("inviteContent");
  if (urlMessage) {
    inviteArea.value = decodeURIComponent(urlMessage);
    isUsingDefaultInvite = true;
  } else {
    inviteArea.value = defaultInviteInit;
    isUsingDefaultInvite = true;
  }
  inviteArea.addEventListener("input", () => { userEdited = true; });

  // 監聽 header.js 發出的語系變更事件，立即重繪
  window.addEventListener("langChanged", () => {
    renderPageByLang();
  });

  // 初始化 Firebase, 讀取使用者 profile & 職缺
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  const snap = await db.doc(`users/${userId}`).get();
  if (!snap.exists) return document.getElementById("recommendForm").style.display = "none";
  profileData = snap.data();
  let exps = profileData.workExperiences;
  if (!Array.isArray(exps)) exps = Object.values(exps || {});
  exps.sort((a,b) => b.startDate.localeCompare(a.startDate));
  jobData = exps.find(j => j.id === jobId);
  if (!jobData) return document.getElementById("recommendForm").style.display = "none";

  // 首次渲染
  renderPageByLang();

  // 表單送出邏輯
  const form = document.getElementById("recommendForm");
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const btn = document.getElementById("submitBtn"); btn.disabled = true;
    btn.innerText = (localStorage.getItem("lang") === "zh-Hant") ? "送出中..." : "Submitting...";

    const rec = {
      name: document.getElementById("name").value.trim(),
      email: document.getElementById("email").value.trim(),
      relation: document.getElementById("relation").value,
      highlights: Array.from(document.querySelectorAll('input[name="highlight"]:checked')).map(cb => cb.value)
                   .concat(document.getElementById("customHighlight").value.trim() || []),
      content: document.getElementById("content").value.trim(),
      inviteMessage: document.getElementById("inviteContent").value.trim(),
      jobId
    };
    await db.collection("users").doc(userId).collection("recommendations").add(rec);
    window.location.href = `thank-you.html?userId=${profileData.userId}&style=${style}`
      + `&recommenderName=${encodeURIComponent(rec.name)}`
      + `&recommenderEmail=${encodeURIComponent(rec.email)}`;
  });
});
