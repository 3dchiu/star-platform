// public/js/recommend-form.js
import { i18n, setLang } from "./i18n.js";
import { firebaseConfig } from "./firebase-config.js";

window.addEventListener("DOMContentLoaded", async () => {
  const lang = localStorage.getItem("lang") || "en";
  setLang(lang);
  const t = i18n[lang] || i18n.en;

  document.title = t.pageTitle;
  document.getElementById("formTitle").innerText = t.formTitle;
  document.getElementById("labelName").innerText = t.name;
  document.getElementById("labelEmail").innerText = t.email;
  document.getElementById("labelRelation").innerText = t.relation;
  document.getElementById("labelContent").innerText = t.contentLabel;
  document.getElementById("submitBtn").innerText = t.submitRecommendation;

  const relSelect = document.getElementById("relation");
  t.relationOptions.forEach(opt => {
    const o = document.createElement("option");
    o.textContent = opt;
    relSelect.appendChild(o);
  });

  document.getElementById("labelHighlights").innerText = t.highlightLabel;
  const hlContainer = document.getElementById("highlightsContainer");
  hlContainer.innerHTML = "";
  const keys = i18n[lang].highlightOptions;
  const labels = i18n[lang].highlightOptionLabels;
  keys.forEach(key => {
    const lab = document.createElement("label");
    lab.className = "checkbox-label";
    lab.innerHTML = `
      <input type="checkbox" name="highlight" value="${key}" />
      ${labels[key] || key}
    `;
    hlContainer.appendChild(lab);
  });

  const params = new URLSearchParams(window.location.search);
  const userId = params.get("userId");
  const jobId = params.get("jobId");
  const inviteMsg = params.get("message");
  const style = params.get("style") || "direct";

  const jobInfoDiv = document.getElementById("jobInfo");
  const inviteDiv = document.getElementById("inviteMessage");
  const form = document.getElementById("recommendForm");

  // ✅ 初始化 firebase（compat）
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  const userRef = db.doc(`users/${userId}`);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    // 使用者不存在
    jobInfoDiv.innerHTML = `<p>${t.notFound}</p>`;
    form.style.display   = "none";
    return;
  }  

  const profile = userSnap.data();
  // 🔥 確保 workExperiences 一定是陣列
  if (!Array.isArray(profile.workExperiences)) {
    profile.workExperiences = Object.values(profile.workExperiences || {});
  }
  const userName = profile.chineseName || profile.name || "";
  // ◆ 正確處理 recommendingTo 可能是 function 或字串
  const titleEl = document.getElementById("formTitle");
  const raw     = t.recommendingTo;
  const text    = typeof raw === "function"
    ? raw(userName)
    : (raw || "").replace("{name}", userName);
   titleEl.insertAdjacentHTML(
    "beforeend",
     `<div class="text-lg text-gray-600 mt-1">${text}</div>`
   );
  const sorted = [...(profile.workExperiences || [])].sort((a, b) =>
    b.startDate.localeCompare(a.startDate)
  );
  const job = sorted.find(j => j.id === jobId);
  if (!job) {
    jobInfoDiv.innerHTML = `<p>${t.notFoundJob}</p>`;
    form.style.display = "none";
    return;
  }

  jobInfoDiv.innerHTML = `
    <p><strong>${t.company}:</strong> ${job.company || t.undefinedCompany}</p>
    <p><strong>${t.position}:</strong> ${job.position || t.undefinedPosition}</p>
    <p><strong>${t.period}:</strong> ${job.startDate || "--"} ～ ${job.endDate || t.currentlyWorking}</p>
  `;


  const finalMsg = inviteMsg
    ? decodeURIComponent(inviteMsg)
    : (t[`defaultInvite_${style}`] || t.defaultInvite_direct);

  inviteDiv.innerHTML = `
    <strong>${t.inviteTitle}:</strong><br>
    ${finalMsg}
  `;

  form.addEventListener("submit", async e => {
    e.preventDefault();
    // 禁止重複點擊
    const submitBtn = document.getElementById("submitBtn");
    submitBtn.disabled = true;
    submitBtn.innerText = lang === "zh-Hant" ? "送出中..." : "Submitting...";
  
    // 1) 讀取表單欄位
    const recommenderName = document.getElementById("name").value.trim();
    const recommenderEmail = document.getElementById("email").value.trim();
    const relation = document.getElementById("relation").value;
    const content  = document.getElementById("content").value.trim();
    const selected = Array.from(
      document.querySelectorAll('input[name="highlight"]:checked')
    ).map(cb => cb.value);
    const custom   = document.getElementById("customHighlight").value.trim();
    const highlights = custom ? [...selected, custom] : selected;
  
    // 2) 構造推薦物件，記得帶上 jobIndex
    const rec = {
      name: recommenderName,
      email: recommenderEmail,
      relation,
      highlights,
      content,
      jobId 
    };
    
  
    // 3) 新增到子集合 recommendations
    //    相較於 update() 整筆文件，add() 只在 child path 裡新增一筆 doc
    const recCol = firebase
      .firestore()
      .collection("users")
      .doc(userId)
      .collection("recommendations");
    
    console.log("📤 send rec:", rec);
    await recCol.add(rec);
  
   // 4) 跳到 Thank You 頁面（帶出推薦人姓名與 Email）
  window.location.href =
  `thank-you.html?`
    + `userId=${profile.userId}`
    + `&style=${style}`
    + `&recommenderName=${encodeURIComponent(recommenderName)}`
    + `&recommenderEmail=${encodeURIComponent(recommenderEmail)}`;

 });
});  
