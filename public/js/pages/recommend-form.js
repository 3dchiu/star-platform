// public/js/pages/recommend-form.js
import { i18n, setLang } from "../i18n.js";

console.log("🚀 recommend-form.js 開始初始化");

// 🔽 Firebase 相關變數
let app, auth, db;

// 🔽 等待 Firebase 初始化完成（與 profile-dashboard.js 一致）
function waitForFirebase() {
  return new Promise((resolve, reject) => {
    console.log("🔍 [recommend-form] 檢查 Firebase 狀態...");
    
    // 檢查 firebase 全域物件是否存在
    if (typeof firebase === 'undefined') {
      console.error("❌ Firebase SDK 未載入");
      reject(new Error('Firebase SDK 未載入，請確認腳本載入順序'));
      return;
    }
    
    // 如果已經初始化完成
    if (window.firebaseReady) {
      try {
        app = window.firebaseApp || firebase.app();
        auth = firebase.auth();
        db = firebase.firestore();
        console.log("✅ [recommend-form] Firebase 已準備就緒");
        resolve();
      } catch (error) {
        console.error("❌ Firebase 服務初始化失敗:", error);
        reject(error);
      }
      return;
    }
    
    // 如果有錯誤
    if (window.firebaseError) {
      reject(window.firebaseError);
      return;
    }
    
    // 嘗試直接初始化
    try {
      app = firebase.app();
      auth = firebase.auth();
      db = firebase.firestore();
      console.log("✅ [recommend-form] 直接使用現有 Firebase 實例");
      resolve();
      return;
    } catch (directInitError) {
      console.log("⚠️ 無法直接使用 Firebase，等待初始化事件...");
    }
    
    // 監聽事件
    const onReady = (event) => {
      try {
        app = event.detail.app || firebase.app();
        auth = firebase.auth();
        db = firebase.firestore();
        console.log("✅ [recommend-form] Firebase 初始化完成事件收到");
        cleanup();
        resolve();
      } catch (error) {
        console.error("❌ 事件處理中的錯誤:", error);
        cleanup();
        reject(error);
      }
    };
    
    const onError = (event) => {
      console.error("❌ [recommend-form] Firebase 初始化失敗事件收到:", event.detail.error);
      cleanup();
      reject(event.detail.error);
    };
    
    const cleanup = () => {
      window.removeEventListener('firebaseReady', onReady);
      window.removeEventListener('firebaseError', onError);
      if (timeoutId) clearTimeout(timeoutId);
    };
    
    window.addEventListener('firebaseReady', onReady);
    window.addEventListener('firebaseError', onError);
    
    // 設定超時（15秒，比之前更長）
    const timeoutId = setTimeout(() => {
      cleanup();
      
      // 最後嘗試：直接檢查是否可以使用 Firebase
      try {
        app = firebase.app();
        auth = firebase.auth();
        db = firebase.firestore();
        console.log("✅ 超時後成功獲取 Firebase 實例");
        resolve();
      } catch (finalError) {
        console.error("❌ 最終嘗試失敗:", finalError);
        reject(new Error('Firebase 初始化超時，請檢查網路連線'));
      }
    }, 15000);
  });
}

// 解析 URL 參數
const params = new URLSearchParams(window.location.search);
let jobId = params.get("jobId");
let userId = params.get("userId");
let urlMessage = params.get("message");
const style = params.get("style") || "direct";
const forcedLang = params.get("lang");
let invitedBy = params.get("invitedBy");
const inviteId = params.get("inviteId");
const preview = params.get("preview"); // 🆕 檢查是否為預覽模式

console.log("📋 URL 參數詳細分析:");
console.log("→ jobId:", jobId);
console.log("→ userId:", userId);
console.log("→ urlMessage (原始):", urlMessage);
console.log("→ urlMessage (解碼):", urlMessage ? decodeURIComponent(urlMessage) : null);
console.log("→ style:", style);
console.log("→ forcedLang:", forcedLang);
console.log("→ invitedBy:", invitedBy);
console.log("→ inviteId:", inviteId);
console.log("→ preview:", preview);
console.log("→ 完整 URL:", window.location.href);

// 語言設定
if (forcedLang) {
  setLang(forcedLang);
  localStorage.setItem("lang", forcedLang);
}

let userEdited = false;
let profileData = null;
let jobData = null;

// 🔽 主要初始化函數
async function initializeForm() {
  console.log("📱 開始初始化表單");
  
  try {
    // 等待 Firebase 準備就緒
    console.log("⏳ 等待 Firebase 初始化...");
    await waitForFirebase();
    console.log("✅ Firebase 服務初始化完成");
    
    // 設定載入狀態
    const loadingText = document.getElementById("loadingText");
    if (loadingText) loadingText.innerText = "正在載入...";

    // 🔍 處理不同的載入模式
    if (inviteId) {
      console.log("🔍 使用 inviteId 載入資料:", inviteId);
      await loadDataByInviteId(loadingText);
    } else if (userId && jobId) {
      console.log("🔍 使用 URL 參數載入資料");
      await loadDataByUrlParams(loadingText);
    } else {
      throw new Error("缺少必要參數");
    }

    // 渲染頁面
    if (loadingText) loadingText.innerText = "準備表單...";
    renderPage();
    
    // 綁定事件
    bindEvents();
    
    // 顯示表單
    hideLoading();
    console.log("✅ 初始化完成");

  } catch (error) {
    console.error("❌ 初始化失敗:", error);
    showError("載入失敗: " + error.message);
  }
}

// 🔽 使用 inviteId 載入資料
async function loadDataByInviteId(loadingText) {
  if (loadingText) loadingText.innerText = "載入邀請資料中...";
  
  // 🕒 設定超時保護
  const invitePromise = db.collection("invites").doc(inviteId).get();
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error("載入邀請資料超時")), 8000)
  );
  
  const inviteSnap = await Promise.race([invitePromise, timeoutPromise]);
  
  if (!inviteSnap.exists) {
    throw new Error("邀請不存在或已失效");
  }
  
  const inviteData = inviteSnap.data();
  console.log("📄 邀請資料:", inviteData);
  
  userId = inviteData.userId;
  jobId = inviteData.jobId;
  urlMessage = inviteData.message;
  invitedBy = inviteData.invitedBy || null;
  
  // 填入邀請語
  const inviteArea = document.getElementById("inviteContent");
  if (inviteArea && urlMessage) {
    inviteArea.value = decodeURIComponent(urlMessage);
    userEdited = true;
  }
  
  // 載入用戶資料
  await loadUserData(loadingText);
}

// 🔽 使用 URL 參數載入資料（預覽模式）
async function loadDataByUrlParams(loadingText) {
  console.log("🔍 loadDataByUrlParams 開始執行");
  console.log("→ userId:", userId);
  console.log("→ jobId:", jobId);
  console.log("→ preview:", preview);
  console.log("→ urlMessage:", urlMessage);
  
  // 🔍 檢查必要參數
  if (!userId || !jobId) {
    console.error("❌ 缺少必要參數:", { userId, jobId });
    throw new Error("缺少必要參數：userId 或 jobId");
  }
  
  // 🆕 預覽模式的特殊處理
  if (preview === "true" || preview === true) {
    console.log("👁️ 確認進入預覽模式");
    if (loadingText) loadingText.innerText = "載入預覽資料中...";
    
    // 🔍 解碼邀請語
    if (urlMessage) {
      try {
        const decodedMessage = decodeURIComponent(urlMessage);
        console.log("🔍 邀請語解碼:");
        console.log("→ 原始:", urlMessage);
        console.log("→ 解碼後:", decodedMessage);
        
        // 等待 DOM 元素載入
        setTimeout(() => {
          const inviteArea = document.getElementById("inviteContent");
          console.log("🔍 尋找 inviteContent 元素:", !!inviteArea);
          
          if (inviteArea) {
            inviteArea.value = decodedMessage;
            userEdited = true;
            console.log("✅ 邀請語已填入 textarea");
            console.log("→ textarea.value:", inviteArea.value);
          } else {
            console.error("❌ 找不到 inviteContent 元素");
            // 嘗試在頁面渲染後再次填入
            document.addEventListener('DOMContentLoaded', () => {
              const retryInviteArea = document.getElementById("inviteContent");
              if (retryInviteArea) {
                retryInviteArea.value = decodedMessage;
                console.log("✅ 延遲填入邀請語成功");
              }
            });
          }
        }, 500); // 延遲 500ms 確保 DOM 載入
        
      } catch (decodeError) {
        console.error("❌ 邀請語解碼失敗:", decodeError);
        console.log("→ 嘗試直接使用原始訊息:", urlMessage);
        
        // 嘗試直接使用原始訊息
        setTimeout(() => {
          const inviteArea = document.getElementById("inviteContent");
          if (inviteArea) {
            inviteArea.value = urlMessage;
            userEdited = true;
            console.log("✅ 使用原始邀請語填入");
          }
        }, 500);
      }
    } else {
      console.warn("⚠️ 預覽模式但沒有邀請語參數");
    }
  } else {
    console.log("ℹ️ 非預覽模式或預覽參數不正確");
  }
  
  // 載入用戶資料
  console.log("📥 開始載入用戶資料...");
  await loadUserData(loadingText);
}

// 🔽 載入用戶資料的共用函數
async function loadUserData(loadingText) {
  if (loadingText) loadingText.innerText = "載入用戶資料中...";
  
  // 🕒 設定超時保護
  const userPromise = db.collection("users").doc(userId).get();
  const userTimeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error("載入用戶資料超時")), 8000)
  );
  
  const userSnap = await Promise.race([userPromise, userTimeoutPromise]);
  
  if (!userSnap.exists) {
    throw new Error("找不到用戶資料");
  }

  profileData = userSnap.data();
  console.log("📄 用戶資料載入成功");

  // 處理工作經歷
  if (loadingText) loadingText.innerText = "處理工作經歷資料...";
  
  let exps = profileData.workExperiences;
  if (!Array.isArray(exps)) {
    exps = Object.values(exps || {});
  }
  exps.sort((a, b) => b.startDate.localeCompare(a.startDate));
  jobData = exps.find(j => j.id === jobId);
  
  if (!jobData) {
    throw new Error(`找不到工作經歷: ${jobId}`);
  }

  console.log("📄 工作經歷載入成功:", jobData);
}

// 🔽 渲染頁面
function renderPage() {
  console.log("🎨 渲染頁面開始");
  
  const lang = localStorage.getItem("lang") || "zh";
  const t = i18n[lang] || i18n.zh || {};

  // 設定標題
  document.title = t.recPageTitle || t.pageTitle || "推薦表單";
  const formTitle = document.getElementById("formTitle");
  if (formTitle) formTitle.innerText = t.formTitle || "推薦表單";

  // 設定推薦說明
  const noteEl = document.getElementById("recommendNote");
  if (noteEl && profileData) {
    const name = profileData.name || "";
    const greeting = t.recommendingTo ? 
      t.recommendingTo.replace("{name}", name).replace("<strong>", "").replace("</strong>", "") :
      `您正在為 ${name} 撰寫推薦`;
    noteEl.innerHTML = greeting;
  }

  // 🆕 處理邀請語顯示
  const inviteArea = document.getElementById("inviteContent");
  console.log("🔍 檢查邀請語處理:");
  console.log("→ inviteArea 元素:", !!inviteArea);
  console.log("→ urlMessage:", urlMessage);
  console.log("→ userEdited:", userEdited);
  
  if (inviteArea) {
    // 如果還沒有填入邀請語，現在嘗試填入
    if (!userEdited && urlMessage) {
      try {
        let messageToDisplay = urlMessage;
        
        // 嘗試解碼
        try {
          messageToDisplay = decodeURIComponent(urlMessage);
          console.log("✅ 邀請語解碼成功:", messageToDisplay);
        } catch (decodeError) {
          console.warn("⚠️ 解碼失敗，使用原始訊息:", urlMessage);
        }
        
        inviteArea.value = messageToDisplay;
        userEdited = true;
        console.log("✅ 在 renderPage 中成功填入邀請語");
        console.log("→ 最終顯示的邀請語:", inviteArea.value);
      } catch (error) {
        console.error("❌ 填入邀請語失敗:", error);
      }
    } else if (inviteArea.value) {
      console.log("ℹ️ 邀請語已存在:", inviteArea.value);
    } else {
      console.log("ℹ️ 沒有邀請語需要顯示");
    }
  } else {
    console.error("❌ 找不到 inviteContent 元素");
  }

  // 設定工作資訊
  const jobInfoDiv = document.getElementById("jobInfo");
  if (jobInfoDiv && jobData) {
    jobInfoDiv.innerHTML = `
      <p><strong>${t.company || "公司"}:</strong> ${jobData.company || "未指定"}</p>
      <p><strong>${t.position || "職位"}:</strong> ${jobData.position || "未指定"}</p>
      <p><strong>${t.period || "期間"}:</strong> ${jobData.startDate || "--"} ～ ${jobData.endDate || t.currentlyWorking || "至今"}</p>
      ${jobData.description ? `<p style="margin-top: 1em;"><strong>${t.jobDescriptionLabel || "工作描述"}:</strong> ${jobData.description}</p>` : ""}
    `;
  }

  // 設定表單標籤
  const labelMappings = [
    { id: "labelName", text: t.name || "姓名" },
    { id: "labelEmail", text: t.email || "Email" },
    { id: "labelRelation", text: t.relation || "關係" },
    { id: "labelHighlights", text: t.highlightLabel || "推薦項目" },
    { id: "labelContent", text: t.contentLabel || "推薦內容" },
    { id: "submitBtn", text: t.submitRecommendation || "送出推薦" }
  ];

  labelMappings.forEach(label => {
    const element = document.getElementById(label.id);
    if (element) element.innerText = label.text;
  });

  // 設定提示文字
  const hintMappings = [
    { id: "hintHighlights", text: t.hintHighlights || "請選擇一個你印象最深刻的亮點" },
    { id: "hintContent", text: t.hintContent || "最多 500 字，請聚焦亮點。" }
  ];

  hintMappings.forEach(hint => {
    const element = document.getElementById(hint.id);
    if (element) element.innerText = hint.text;
  });

  // 設定關係選項
  const relationSelect = document.getElementById("relation");
  if (relationSelect) {
    const relationOptions = t.relationOptions || [
      { value: "", label: "請選擇關係" },
      { value: "directManager", label: "我是他/她的直接主管" },
      { value: "crossDeptManager", label: "我是他/她的跨部門主管" },
      { value: "sameDeptColleague", label: "我是他/她的同部門同事" },
      { value: "crossDeptColleague", label: "我是他/她的跨部門同事" },
      { value: "subordinate", label: "他/她是我的下屬" },
      { value: "client", label: "我是他/她的客戶" },
      { value: "vendor", label: "我是他/她的廠商/合作夥伴" }
    ];
    
    relationSelect.innerHTML = "";
    
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = t.selectRelation || "請選擇關係";
    relationSelect.appendChild(defaultOption);
    
    relationOptions.forEach(opt => {
      const option = document.createElement("option");
      option.value = opt.value;
      option.textContent = opt.label;
      relationSelect.appendChild(option);
    });
  }

  // 設定亮點選項
  const highlightsContainer = document.getElementById("highlightsContainer");
  if (highlightsContainer) {
    console.log("🎯 設定亮點選項，當前語言:", lang);
    
    const defaultOptionKeys = ["hardSkill", "softSkill", "character"];
    const defaultLabels = {
      zh: { hardSkill: "硬實力", softSkill: "軟實力", character: "人品" },
      "zh-Hant": { hardSkill: "硬實力", softSkill: "軟實力", character: "人品" },
      en: { hardSkill: "Hard Skills", softSkill: "Soft Skills", character: "Character & Integrity" }
    };
    
    let labels;
    if (t.highlightOptionLabels && typeof t.highlightOptionLabels === 'object') {
      labels = t.highlightOptionLabels;
    } else {
      labels = defaultLabels[lang] || defaultLabels.zh;
    }
    
    highlightsContainer.innerHTML = "";
    
    defaultOptionKeys.forEach((key) => {
      const label = labels[key];
      
      if (label && label !== 'undefined') {
        const labelElement = document.createElement("label");
        labelElement.className = "option-label";
        
        const input = document.createElement("input");
        input.type = "radio";
        input.name = "highlight";
        input.value = key;
        input.required = true;
        
        const span = document.createElement("span");
        span.className = "option-text";
        span.textContent = label;
        
        labelElement.appendChild(input);
        labelElement.appendChild(span);
        highlightsContainer.appendChild(labelElement);
      } else {
        // 緊急備用
        const fallbackLabel = key === "hardSkill" ? "硬實力" : 
                             key === "softSkill" ? "軟實力" : "人品";
        
        const labelElement = document.createElement("label");
        labelElement.className = "option-label";
        labelElement.innerHTML = `
          <input type="radio" name="highlight" value="${key}" required>
          <span class="option-text">${fallbackLabel}</span>
        `;
        highlightsContainer.appendChild(labelElement);
      }
    });
  }

  // 設定最終提醒文字
  const finalReminder = document.getElementById("finalReminder");
  if (finalReminder) {
    const reminderText = t.finalReminder || t.identityReminder || `
      <p><strong>${t.importantNote || "重要提醒"}：</strong></p>
      <p>${t.recommendationReminder || "請確保推薦內容真實且基於實際工作經驗。提交後，系統將發送通知給被推薦人，並邀請您註冊以管理您的推薦記錄。"}</p>
      <p style="color: #666; font-size: 0.9em; margin-top: 10px;">
        <strong>${t.brandSlogan || "Galaxyz｜讓每個人因真實與信任被看見。"}</strong> - ${t.brandSubMessage || "我們致力打造最可信賴的專業推薦平台。"}
      </p>
    `;
    finalReminder.innerHTML = reminderText;
  }

  console.log("✅ 頁面渲染完成");
  
  // 🆕 渲染完成後再次檢查邀請語
  setTimeout(() => {
    const finalInviteArea = document.getElementById("inviteContent");
    if (finalInviteArea) {
      console.log("🔍 渲染完成後邀請語檢查:");
      console.log("→ textarea.value:", finalInviteArea.value);
      console.log("→ textarea 是否可見:", finalInviteArea.offsetParent !== null);
    }
  }, 100);
}

// 🔽 綁定事件
function bindEvents() {
  console.log("🔗 綁定事件");
  
  const form = document.getElementById("recommendForm");
  if (form) {
    form.addEventListener("submit", handleSubmit);
  }

  const inviteArea = document.getElementById("inviteContent");
  if (inviteArea) {
    inviteArea.addEventListener("input", () => { userEdited = true; });
  }

  window.addEventListener("langChanged", () => {
    console.log("🌐 語言已變更，重新渲染頁面");
    renderPage();
  });
}

// 🔽 處理表單提交
async function handleSubmit(e) {
  e.preventDefault();
  console.log("📤 處理表單提交...");

  const btn = document.getElementById("submitBtn");
  if (btn) btn.disabled = true;

  // 步驟 1: 無論是否登入，都先從表單收集當前資料
  const formData = {
    name: document.getElementById("name")?.value.trim() || "",
    email: document.getElementById("email")?.value.trim() || "",
    relation: document.getElementById("relation")?.value || "",
    content: document.getElementById("content")?.value.trim() || "",
    highlights: Array.from(document.querySelectorAll('input[name="highlight"]:checked')).map(cb => cb.value)
  };

  // 步驟 2: 驗證表單基本內容是否填寫
  const lang = localStorage.getItem("lang") || "zh";
  const t = i18n[lang] || i18n.zh || {};
  if (!formData.name || !formData.email || !formData.content || formData.highlights.length === 0) {
    alert(t.fillAllFields);
    if (btn) btn.disabled = false;
    return;
  }
  
  try {
    // =======================================================
    // 步驟 3: 檢查使用者登入狀態 (這是我們新增的核心邏輯)
    // =======================================================
    if (!auth.currentUser) {
      console.log("🔐 使用者未登入。");
      
      // 3a. 暫存資料到 sessionStorage
      sessionStorage.setItem('pendingRecommendation', JSON.stringify(formData));
      console.log("✅ 表單資料已暫存，準備引導登入...");
      
      // 3b. 組合帶有特殊參數的 URL 以啟用「輕量化註冊」
      const loginUrl = `/pages/login.html?flow=lite_reg&email=${encodeURIComponent(formData.email)}`;
      
      // 3c. 提示使用者，並在新分頁開啟登入頁
      alert(t.loginToSubmit);
      window.open(loginUrl, '_blank');
      
      if (btn) btn.disabled = false; // 解鎖按鈕讓使用者可以回來繼續操作
      return; // 中斷本次提交，等待使用者登入後回來再次點擊
    }

    // =======================================================
    // 步驟 4: 如果使用者已登入，執行安全提交流程
    // =======================================================
    console.log(`✅ 使用者已登入: ${auth.currentUser.uid}`);
    console.log(`   - 表單填寫Email: ${formData.email}`);
    console.log(`   - 實際登入Email: ${auth.currentUser.email}`);

    // 4a. 執行重複提交檢查 (使用登入者的真實Email)
    const recCollection = db.collection("users").doc(userId).collection("recommendations");
    const existing = await recCollection
      .where("email", "==", auth.currentUser.email) // 【安全】用登入者的 Email 檢查
      .where("jobId", "==", jobId)
      .get();

    if (!existing.empty) {
      alert(t.alreadyRecommended);
      if (btn) btn.disabled = false;
      return;
    }

    // 4b. 組合最終要儲存的資料
    // 【安全關鍵】推薦人的姓名和Email，強制使用登入後的 auth.currentUser
    const dataToSave = {
      name: auth.currentUser.displayName || formData.name,
      email: auth.currentUser.email,
      recommenderId: auth.currentUser.uid,
      recommenderRegistered: true,
      relation: formData.relation,
      content: formData.content,
      highlights: formData.highlights,
      jobId: jobId,
      invitedBy: invitedBy || null,
      inviteId: inviteId || null,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      status: "pending"
    };

    console.log("💾 準備儲存的最終資料:", dataToSave);
    await recCollection.add(dataToSave);

    console.log("✅ 推薦儲存成功！");
    // 導向感謝頁面
    window.location.href = `thank-you.html?userId=${userId}&recommenderName=${encodeURIComponent(dataToSave.name)}`;

  } catch (error) {
    console.error("❌ 提交過程中發生錯誤:", error);
    alert(t.submitError || "提交失敗，請檢查網路連線後再試。");
    if (btn) btn.disabled = false;
  }
}

// 🔽 顯示錯誤
function showError(message) {
  console.error("❌ 錯誤:", message);
  
  const loadingMessage = document.getElementById("loadingMessage");
  const errorMessage = document.getElementById("errorMessage");
  
  if (loadingMessage) loadingMessage.style.display = "none";
  if (errorMessage) {
    errorMessage.innerText = message;
    errorMessage.style.display = "block";
  } else {
    alert(message);
  }
}

// 🔽 隱藏載入畫面
function hideLoading() {
  console.log("👁️ 隱藏載入畫面");
  
  const loadingMessage = document.getElementById("loadingMessage");
  const formContainer = document.getElementById("formContainer");
  
  if (loadingMessage) loadingMessage.style.display = "none";
  if (formContainer) formContainer.style.display = "block";
}

// 🔽 多重初始化觸發機制
console.log("🔧 設定初始化觸發器");

let initialized = false;

async function safeInitialize() {
  if (initialized) {
    console.log("⚠️ 已初始化，跳過");
    return;
  }
  initialized = true;
  
  // 等待 DOM 和所有資源載入
  await new Promise(resolve => setTimeout(resolve, 300));
  
  await initializeForm();
}

// 方式 1: DOMContentLoaded
if (document.readyState === 'loading') {
  console.log("⏳ 等待 DOM 載入完成");
  document.addEventListener("DOMContentLoaded", safeInitialize);
} else {
  console.log("✅ DOM 已載入，延遲初始化");
  setTimeout(safeInitialize, 100);
}

// 方式 2: 備用初始化（10秒後）
setTimeout(function() {
  if (!initialized) {
    console.log("🔄 備用初始化觸發");
    safeInitialize();
  }
}, 10000);

console.log("✅ recommend-form.js 載入完成");