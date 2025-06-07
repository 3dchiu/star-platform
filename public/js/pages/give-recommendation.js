// js/pages/give-recommendation.js - 修復版本
import { i18n } from "../i18n.js";

// 使用 compat 版本的 Firebase
let db, auth;

// 修改初始化邏輯，確保 Firebase 完全載入
function waitForFirebaseReady() {
  return new Promise((resolve, reject) => {
    const maxAttempts = 20; // 最多等待 10 秒
    let attempts = 0;
    
    const checkFirebase = () => {
      attempts++;
      
      // 檢查 Firebase 是否載入
      if (typeof firebase === 'undefined') {
        if (attempts >= maxAttempts) {
          reject(new Error("Firebase 載入超時"));
          return;
        }
        setTimeout(checkFirebase, 500);
        return;
      }
      
      // 檢查 Firebase 是否已初始化
      try {
        const apps = firebase.apps;
        if (!apps || apps.length === 0) {
          if (attempts >= maxAttempts) {
            reject(new Error("Firebase App 未初始化"));
            return;
          }
          setTimeout(checkFirebase, 500);
          return;
        }
        
        // Firebase 準備就緒
        console.log("✅ Firebase 準備就緒，apps:", apps.length);
        resolve();
        
      } catch (error) {
        if (attempts >= maxAttempts) {
          reject(error);
          return;
        }
        setTimeout(checkFirebase, 500);
      }
    };
    
    checkFirebase();
  });
}

// 延遲執行，等待所有腳本載入
setTimeout(function() {
  if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", initializeRecommendationPage);
  } else {
    // 延長等待時間，確保 Firebase 完全載入
    setTimeout(initializeRecommendationPage, 1000);
  }
}, 500);

async function initializeRecommendationPage() {
  console.log("🚀 推薦合作夥伴頁面初始化");

  try {
    // 等待 Firebase 準備就緒
    console.log("⏳ 等待 Firebase 準備就緒...");
    await waitForFirebaseReady();
    
    // 初始化 Firebase 服務
    db = firebase.firestore();
    auth = firebase.auth();
    console.log("✅ Firebase 服務初始化完成");

    // 多語系設定
    const lang = localStorage.getItem("lang") || "zh";
    const t = i18n[lang] || i18n.zh || {};
    console.log("✅ 多語系設定完成:", lang);

    // 獲取 URL 參數
    const urlParams = new URLSearchParams(window.location.search);
    const inviteId = urlParams.get("inviteId");
    const jobId = urlParams.get("jobId");
    const mode = urlParams.get("mode");
    const originalRecId = urlParams.get("originalRecId");
    const targetUserId = urlParams.get("targetUserId");

    console.log("📋 URL 參數:", { inviteId, jobId, mode, originalRecId, targetUserId });

    // 等待用戶認證 - 增加更長的等待時間
    console.log("🔐 檢查用戶認證...");
    const user = await waitForAuth();
    if (!user) {
      console.log("❌ 用戶未登入，重定向");
      window.location.href = '/auth.html';
      return;
    }
    console.log("✅ 用戶已登入:", user.uid);

    let inviteData;

    // 🆕 處理回推薦模式
if (mode === "reply" && inviteId && originalRecId) {
  console.log("🎯 回推薦模式");
  
  // 載入邀請資料
  inviteData = await loadInviteData(inviteId);
  
  if (inviteData) {
    // 載入原始推薦記錄以獲取推薦人資訊
    const originalRecData = await loadOriginalRecommendation(originalRecId, user.uid);
    
    if (originalRecData) {
      // 🆕 載入正確的工作經歷資料
      const jobInfo = await loadJobInfo(user.uid, originalRecData.jobId);
      
      if (jobInfo) {
        // 使用真實的工作資料
        inviteData.company = jobInfo.company;
        inviteData.position = jobInfo.position;
        inviteData.jobDescription = jobInfo.description;
        inviteData.startDate = jobInfo.startDate;
        inviteData.endDate = jobInfo.endDate;
        console.log("✅ 工作經歷資料載入完成:", jobInfo);
      } else {
        console.warn("⚠️ 無法載入工作經歷，使用邀請中的基本資料");
      }
      
      // 設定回推薦模式
      inviteData.isReplyMode = true;
      inviteData.isGivingRecommendation = true;
      inviteData.originalRecId = originalRecId;
      
      // 🎯 關鍵：決定目標用戶資料的優先級
      const urlParams = new URLSearchParams(window.location.search);
      const prefillName = urlParams.get('prefillName');
      const prefillEmail = urlParams.get('prefillEmail');
      
      // 使用 URL 預填參數或原始記錄資料
      inviteData.targetName = prefillName || originalRecData.name;
      inviteData.targetEmail = prefillEmail || originalRecData.email;
      inviteData.targetUserId = targetUserId || originalRecData.recommenderId;
      
      // 🆕 確保推薦人資訊正確
      if (!inviteData.recommenderName) {
        // 從用戶資料中獲取推薦人姓名
        const userRef = db.collection("users").doc(user.uid);
        const userSnap = await userRef.get();
        if (userSnap.exists) {
          const userData = userSnap.data();
          inviteData.recommenderName = userData.name || user.displayName || user.email;
        }
      }
      
      console.log("✅ 回推薦模式設定完成，目標:", {
        name: inviteData.targetName,
        email: inviteData.targetEmail,
        userId: inviteData.targetUserId,
        company: inviteData.company,
        position: inviteData.position,
        recommenderName: inviteData.recommenderName
      });
    } else {
      showError("找不到原始推薦記錄，無法進行回推薦");
      return;
    }
  } else {
    showError("找不到邀請記錄，無法進行回推薦");
    return;
  }
      
    } else if (inviteId) {
      // 其他邀請模式...
      console.log("🎯 使用邀請模式，邀請ID:", inviteId);
      inviteData = await loadInviteData(inviteId);
      
      if (inviteData) {
        if (mode === "outgoing" || (inviteData.type && inviteData.type === "outgoing")) {
          inviteData.isGivingRecommendation = true;
          console.log("📝 設定為推薦他人模式");
        } else {
          inviteData.isGivingRecommendation = false;
          console.log("📝 設定為邀請推薦模式");
        }
      }
      
    } else if (mode === "outgoing" && jobId) {
      // 直接推薦模式...
      console.log("🎯 使用直接推薦模式，工作ID:", jobId);
      inviteData = await createDirectInviteData(user, jobId);
      if (inviteData) {
        inviteData.isGivingRecommendation = true;
        console.log("📝 設定為推薦他人模式");
      }
      
    } else {
      console.error("❌ 參數不完整");
      showError("缺少必要參數");
      return;
    }

    if (!inviteData) {
      showError("無法載入推薦資料，請檢查邀請是否有效");
      return;
    }

    console.log("✅ 推薦資料載入成功:", inviteData);

    // 初始化頁面
    console.log("🎨 初始化頁面內容...");
    setupPageContent(inviteData, t);
    setupFormOptions(t);
    setupFormSubmission(inviteData, t, user);

    // 🆕 回推薦模式：預填表單
    if (inviteData.isReplyMode) {
      prefillReplyForm(inviteData);
    }

    // 顯示表單
    hideLoading();
    console.log("✅ 頁面初始化完成");

  } catch (error) {
    console.error("❌ 初始化失敗:", error);
    showError("頁面載入失敗：" + error.message);
    hideLoading();
  }
}

// 🆕 新增：載入原始推薦記錄
async function loadOriginalRecommendation(originalRecId, userId) {
  try {
    console.log("📥 載入原始推薦記錄:", originalRecId, "用戶:", userId);
    
    // 在用戶的推薦集合中查找
    const recRef = db.collection("users").doc(userId).collection("recommendations").doc(originalRecId);
    const recSnap = await recRef.get();
    
    if (!recSnap.exists) {
      console.error("❌ 原始推薦記錄不存在");
      return null;
    }
    
    const recData = recSnap.data();
    console.log("📄 原始推薦記錄:", recData);
    
    // 🔍 驗證必要欄位
    if (!recData.name || !recData.email) {
      console.error("❌ 推薦記錄缺少必要欄位:", {
        hasName: !!recData.name,
        hasEmail: !!recData.email
      });
      return null;
    }
    
    return recData;
    
  } catch (error) {
    console.error("❌ 載入原始推薦記錄失敗:", error);
    return null;
  }
}

async function loadJobInfo(userId, jobId) {
  try {
    console.log("📥 載入工作經歷資料:", { userId, jobId });
    
    // 先從 users/{userId} 下的 workExperiences 陣列中尋找
    const userRef = db.collection("users").doc(userId);
    const userSnap = await userRef.get();
    
    if (userSnap.exists) {
      const userData = userSnap.data();
      const workExperiences = userData.workExperiences || [];
      
      // 在陣列中找到對應的工作經歷
      const jobData = workExperiences.find(job => job.id === jobId);
      
      if (jobData) {
        console.log("✅ 從 workExperiences 陣列找到工作資料:", jobData);
        return {
          company: jobData.company,
          position: jobData.position,
          description: jobData.description,
          startDate: jobData.startDate,
          endDate: jobData.endDate
        };
      }
    }
    
    // 如果在陣列中找不到，嘗試從子集合中尋找（舊版結構）
    const jobRef = db.collection("users").doc(userId).collection("jobs").doc(jobId);
    const jobSnap = await jobRef.get();
    
    if (jobSnap.exists) {
      const jobData = jobSnap.data();
      console.log("✅ 從 jobs 子集合找到工作資料:", jobData);
      return jobData;
    }
    
    console.warn("⚠️ 找不到工作經歷資料");
    return null;
    
  } catch (error) {
    console.error("❌ 載入工作經歷資料失敗:", error);
    return null;
  }
}

// 🆕 新增：預填回推薦表單
function prefillReplyForm(inviteData) {
  console.log("📝 預填回推薦表單:", inviteData);
  
  // 🔧 使用 MutationObserver 確保 DOM 元素存在
  function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }
      
      const observer = new MutationObserver((mutations) => {
        const element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      }, timeout);
    });
  }
  
  // 使用 Promise 確保元素存在後再預填
  Promise.all([
    waitForElement('#name'),
    waitForElement('#email')
  ]).then(([nameInput, emailInput]) => {
    
    // 預填姓名
    if (inviteData.targetName) {
      nameInput.value = inviteData.targetName;
      nameInput.readOnly = true;
      nameInput.style.backgroundColor = '#f5f5f5';
      console.log("✅ 預填姓名:", inviteData.targetName);
    }
    
    // 預填Email
    if (inviteData.targetEmail) {
      emailInput.value = inviteData.targetEmail;
      emailInput.readOnly = true;
      emailInput.style.backgroundColor = '#f5f5f5';
      console.log("✅ 預填Email:", inviteData.targetEmail);
    }
    
    // 🆕 添加視覺提示
    const nameLabel = document.querySelector('label[for="name"]');
    const emailLabel = document.querySelector('label[for="email"]');
    
    if (nameLabel) {
      nameLabel.innerHTML += ' <span style="color: #28a745;">✓ 已自動填入</span>';
    }
    
    if (emailLabel) {
      emailLabel.innerHTML += ' <span style="color: #28a745;">✓ 已自動填入</span>';
    }
    
  }).catch(error => {
    console.error("❌ 等待表單元素失敗:", error);
    
    // 備用方案：延遲預填
    setTimeout(() => {
      const nameInput = document.getElementById("name");
      const emailInput = document.getElementById("email");
      
      if (nameInput && inviteData.targetName) {
        nameInput.value = inviteData.targetName;
        nameInput.readOnly = true;
      }
      
      if (emailInput && inviteData.targetEmail) {
        emailInput.value = inviteData.targetEmail;
        emailInput.readOnly = true;
      }
    }, 1000);
  });
}

// 等待用戶認證 - 增加更長的超時時間
function waitForAuth() {
  return new Promise((resolve) => {
    // 增加超時時間到 15 秒
    const timeout = setTimeout(() => {
      console.log("⏰ 認證檢查超時");
      resolve(null);
    }, 15000);

    // 檢查 auth 是否可用
    if (!auth) {
      console.error("❌ Firebase Auth 未初始化");
      clearTimeout(timeout);
      resolve(null);
      return;
    }

    const unsubscribe = auth.onAuthStateChanged((user) => {
      clearTimeout(timeout);
      unsubscribe();
      resolve(user);
    });
  });
}

// 其餘函數保持不變...
// [載入邀請資料、創建直接邀請資料等函數保持原樣]

// 載入邀請資料
async function loadInviteData(inviteId) {
  try {
    console.log("📥 載入邀請資料:", inviteId);
    
    const inviteRef = db.collection("invites").doc(inviteId);
    const inviteSnap = await inviteRef.get();
    
    if (!inviteSnap.exists) {
      console.error("❌ 邀請不存在");
      return null;
    }
    
    const inviteData = inviteSnap.data();
    console.log("📄 邀請資料:", inviteData);
    
    // 🔧 修復：允許多種邀請類型
    const allowedTypes = ["outgoing", "reply", undefined]; // 🆕 允許 reply 類型
    if (inviteData.type && !allowedTypes.includes(inviteData.type)) {
      console.error("❌ 邀請類型錯誤:", inviteData.type);
      return null;
    }
    
    return {
      id: inviteId,
      ...inviteData
    };
    
  } catch (error) {
    console.error("❌ 載入邀請資料失敗:", error);
    return null;
  }
}

// 創建直接邀請資料
async function createDirectInviteData(user, jobId) {
  try {
    console.log("🏗️ 創建直接邀請資料:", { userId: user.uid, jobId });
    
    // 載入工作經歷
    const jobRef = db.collection("users").doc(user.uid).collection("jobs").doc(jobId);
    const jobSnap = await jobRef.get();
    
    if (!jobSnap.exists) {
      console.error("❌ 工作經歷不存在");
      return null;
    }
    
    const jobData = jobSnap.data();
    console.log("📄 工作經歷資料:", jobData);
    
    // 載入用戶資料
    const userRef = db.collection("users").doc(user.uid);
    const userSnap = await userRef.get();
    const userData = userSnap.exists ? userSnap.data() : {};
    
    return {
      id: 'direct_' + jobId,
      type: 'direct',
      jobId: jobId,
      company: jobData.company || '',
      position: jobData.position || '',
      recommenderName: userData.name || user.displayName || user.email,
      recommenderUserId: user.uid
    };
    
  } catch (error) {
    console.error("❌ 創建直接邀請資料失敗:", error);
    return null;
  }
}

// 設定頁面內容
// 🆕 修改 setupPageContent 函數
function setupPageContent(inviteData, t) {
  console.log("🎨 設定頁面內容");
  console.log("📋 邀請資料:", inviteData);
  
  const isGivingRecommendation = inviteData.isGivingRecommendation;
  const isReplyMode = inviteData.isReplyMode;
  
  console.log("🔍 是否為推薦他人模式:", isGivingRecommendation);
  console.log("🔍 是否為回推薦模式:", isReplyMode);
  
  // 🎯 關鍵修復：回推薦模式強制使用推薦他人的標題
  const formTitle = document.getElementById("formTitle");
  const recommendNote = document.getElementById("recommendNote");
  
  if (formTitle) {
    if (isReplyMode) {
      // 回推薦模式使用「推薦合作夥伴」標題
      formTitle.textContent = "推薦合作夥伴";
    } else if (isGivingRecommendation) {
      formTitle.textContent = t.recommendPartnerTitle || "推薦合作夥伴";
    } else {
      formTitle.textContent = t.formTitle || "推薦表單";
    }
  }
  
  if (recommendNote) {
    if (isReplyMode) {
      // 回推薦模式的特殊說明
      recommendNote.textContent = "感謝對方為你寫推薦，現在為此工作期間合作的夥伴寫下推薦";
    } else if (isGivingRecommendation) {
      recommendNote.textContent = t.recommendPartnerNote || "為你在此工作期間合作的夥伴寫下推薦";
    } else {
      recommendNote.textContent = t.recommendNote || "請填寫推薦內容";
    }
  }

  // 🆕 回推薦模式：隱藏邀請內容區塊
  if (isReplyMode || isGivingRecommendation) {
    const inviteSection = document.querySelector(".form-group");
    if (inviteSection && inviteSection.querySelector("#inviteContent")) {
      inviteSection.style.display = "none";
    }
  }
  
  // 設定工作背景資訊
  const jobInfo = document.getElementById("jobInfo");
if (jobInfo) {
  let titleText = "工作背景";
  if (isReplyMode) {
    titleText = "回推薦背景";
  }
  
  // 🔧 修正：使用真實的工作資料，移除寫死的預設值
  const company = inviteData.company || "公司名稱";
  const position = inviteData.position || "職位";
  const recommenderName = inviteData.recommenderName || "推薦人";
  
  // 🆕 格式化工作期間
  let workPeriod = "";
  if (inviteData.startDate) {
    workPeriod = inviteData.startDate;
    if (inviteData.endDate) {
      workPeriod += " ～ " + inviteData.endDate;
    } else {
      workPeriod += " ～ 目前在職";
    }
  }
  
  jobInfo.innerHTML = [
    "<h3>" + titleText + "</h3>",
    "<div class=\"job-details\">",
    "<p><strong>公司:</strong> " + company + "</p>",
    "<p><strong>職位:</strong> " + position + "</p>",
    workPeriod ? "<p><strong>任職期間:</strong> " + workPeriod + "</p>" : "",
    "<p><strong>推薦人:</strong> " + recommenderName + "</p>",
    inviteData.jobDescription ? "<p><strong>工作描述:</strong> " + inviteData.jobDescription + "</p>" : "",
    "</div>"
  ].join("");
  
  console.log("✅ 工作背景資訊已更新:", {
    company: company,
    position: position,
    recommenderName: recommenderName,
    workPeriod: workPeriod
  });
}
  
  // 更新表單標籤 - 回推薦模式強制使用「被推薦人」標籤
  updateFormLabels(t, isReplyMode || isGivingRecommendation, isReplyMode);
  
  // 設定提醒
  const finalReminder = document.getElementById("finalReminder");
  if (finalReminder) {
    if (isGivingRecommendation) {
      finalReminder.innerHTML = [
        "<p><strong>" + (t.importantNote || "重要提醒") + ":</strong></p>",
        "<p>" + (t.giveRecommendationReminder || "請確保推薦內容真實且基於實際合作經驗。被推薦人將收到 Email 通知，邀請他們註冊查看你的推薦。") + "</p>",
        "<p style=\"color: #666; font-size: 0.9em; margin-top: 15px; font-weight: 500;\">",
        "<strong>" + (t.brandSlogan || "Galaxyz｜讓每個人因真實與信任被看見。") + "</strong>",
        "</p>"
      ].join("");
    } else {
      finalReminder.innerHTML = [
        "<p><strong>" + (t.importantNote || "重要提醒") + ":</strong></p>",
        "<p>" + (t.recommendationReminder || "請確保推薦內容真實且基於實際工作經驗。") + "</p>",
        "<p style=\"color: #666; font-size: 0.9em; margin-top: 15px; font-weight: 500;\">",
        "<strong>" + (t.brandSlogan || "Galaxyz｜讓每個人因真實與信任被看見。") + "</strong>",
        "</p>"
      ].join("");
    }
  }
}

// 🆕 修改表單標籤更新邏輯
function updateFormLabels(t, isGivingRecommendation, isReplyMode = false) {
  console.log("🏷️ 更新表單標籤，推薦他人模式:", isGivingRecommendation, "回推薦模式:", isReplyMode);
  
  // 🎯 回推薦模式和推薦他人模式都使用「被推薦人」標籤
  if (isReplyMode || isGivingRecommendation) {
    const elements = [
      { id: "labelName", text: "被推薦人姓名" },
      { id: "labelEmail", text: "被推薦人 Email" }
    ];
    
    let nameHintText, emailHintText;
    
    if (isReplyMode) {
      nameHintText = "填寫要回推薦的同事姓名";
      emailHintText = "系統將通知對方查看你的推薦";
    } else {
      nameHintText = "請填寫被推薦人的真實姓名";
      emailHintText = "系統將發送通知邀請對方註冊";
    }
    
    elements.forEach(function(item) {
      const element = document.getElementById(item.id);
      if (element) {
        element.textContent = item.text;
        console.log("✅ 更新標籤:", item.id, "->", item.text);
      }
    });
    
    // 更新提示文字
    const nameHint = document.querySelector('small[data-i18n="hintName"]');
    const emailHint = document.querySelector('small[data-i18n="hintEmail"]');
    
    if (nameHint) {
      nameHint.textContent = nameHintText;
    }
    
    if (emailHint) {
      emailHint.textContent = emailHintText;
    }
  } else {
    // 邀請推薦模式使用「您的」標籤
    const elements = [
      { id: "labelName", text: t.yourName || "您的姓名" },
      { id: "labelEmail", text: t.yourEmail || "您的 Email" }
    ];
    
    elements.forEach(function(item) {
      const element = document.getElementById(item.id);
      if (element) {
        element.textContent = item.text;
      }
    });
  }
}

// 設定表單選項
function setupFormOptions(t) {
  console.log("⚙️ 設定表單選項");
  
  // 關係選項
  const relationSelect = document.getElementById("relation");
  if (relationSelect) {
    const relationOptions = t.relationOptions || [
      { value: "directManager", label: "我是他/她的直接主管" },
      { value: "crossDeptManager", label: "我是他/她的跨部門主管" },
      { value: "sameDeptColleague", label: "我是他/她的同部門同事" },
      { value: "crossDeptColleague", label: "我是他/她的跨部門同事" },
      { value: "subordinate", label: "他/她是我的下屬" },
      { value: "client", label: "我是他/她的客戶" },
      { value: "vendor", label: "我是他/她的廠商/合作夥伴" }
    ];
    
    relationSelect.innerHTML = "<option value=\"\">" + (t.selectRelation || "請選擇關係") + "</option>";
    
    relationOptions.forEach(function(option) {
      const optionElement = document.createElement("option");
      optionElement.value = option.value;
      optionElement.textContent = option.label;
      relationSelect.appendChild(optionElement);
    });
    
    console.log("✅ 關係選項設定完成，共", relationOptions.length, "個選項");
  }
  
  // 亮點選項 - 支援多語系
  const highlightsContainer = document.getElementById("highlightsContainer");
  if (highlightsContainer) {
    // 預設選項（作為備用）
    const defaultHighlightOptions = {
      zh: [
        { value: "hardSkill", label: "硬實力" },
        { value: "softSkill", label: "軟實力" },
        { value: "character", label: "人品" }
      ],
      en: [
        { value: "hardSkill", label: "Hard Skills" },
        { value: "softSkill", label: "Soft Skills" },
        { value: "character", label: "Character" }
      ]
    };
    
    // 獲取當前語言
    const currentLang = localStorage.getItem("lang") || "zh";
    console.log("🌐 當前語言:", currentLang);
    
    let highlightOptions;
    
    // 優先使用 i18n 的選項
    if (t.highlightOptions && Array.isArray(t.highlightOptions) && t.highlightOptions.length > 0) {
      // 檢查 i18n 選項格式是否正確
      if (t.highlightOptions[0] && typeof t.highlightOptions[0] === 'object' && 
          t.highlightOptions[0].value && t.highlightOptions[0].label) {
        highlightOptions = t.highlightOptions;
        console.log("📝 使用 i18n 亮點選項");
      } else {
        console.log("⚠️ i18n 亮點選項格式不正確，使用預設選項");
        highlightOptions = defaultHighlightOptions[currentLang] || defaultHighlightOptions.zh;
      }
    } else {
      // 使用預設選項
      console.log("📝 i18n 中無亮點選項，使用預設選項");
      highlightOptions = defaultHighlightOptions[currentLang] || defaultHighlightOptions.zh;
    }
    
    console.log("🎯 最終使用的亮點選項:", highlightOptions);
    
    let htmlContent = "";
    highlightOptions.forEach(function(option, index) {
      console.log("🏷️ 處理第", index + 1, "個選項:", option);
      
      if (typeof option === 'object' && option.value && option.label) {
        htmlContent += [
          "<label class=\"option-label\">",
          "<input type=\"radio\" name=\"highlight\" value=\"" + option.value + "\" required>",
          "<span class=\"option-text\">" + option.label + "</span>",
          "</label>"
        ].join("");
        console.log("✅ 成功添加選項:", option.value, "-", option.label);
      } else {
        console.error("❌ 選項格式錯誤:", option);
      }
    });
    
    highlightsContainer.innerHTML = htmlContent;
    console.log("✅ 亮點選項 HTML 設定完成");
  } else {
    console.error("❌ 找不到 highlightsContainer 元素");
  }
}

// 設定表單提交
function setupFormSubmission(inviteData, t, user) {
  console.log("📝 設定表單提交");
  
  const form = document.getElementById("recommendForm");
  const submitBtn = document.getElementById("submitBtn");
  
  if (!form || !submitBtn) {
    console.error("❌ 找不到表單或提交按鈕");
    return;
  }
  
  submitBtn.textContent = t.submitRecommendation || "送出推薦";
  
  form.addEventListener("submit", async function(e) {
    e.preventDefault();
    console.log("📤 表單提交");
    
    // 防止重複提交
    if (submitBtn.disabled) {
      console.log("⏸️ 避免重複提交");
      return;
    }
    
    try {
      submitBtn.disabled = true;
      submitBtn.textContent = t.submitting || "送出中...";
      
      // 收集表單資料
      const formData = getFormData();
      console.log("📋 表單資料:", formData);
      
      // 驗證資料
      if (!validateData(formData, t)) {
        console.log("❌ 資料驗證失敗");
        return;
      }
      
      // 儲存推薦
      await saveRecommendation(inviteData, formData, t);
      
      // 顯示成功
      showSuccess(t);
      
    } catch (error) {
      console.error("❌ 提交失敗:", error);
      showError(t.submitError || "推薦提交失敗，請稍後再試");
      
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = t.submitRecommendation || "送出推薦";
    }
  });
  
  console.log("✅ 表單提交設定完成");
}

// 收集表單資料
function getFormData() {
  const getValue = function(id) {
    const element = document.getElementById(id);
    return element ? element.value.trim() : '';
  };
  
  const selectedHighlight = document.querySelector('input[name="highlight"]:checked');
  const highlights = selectedHighlight ? [selectedHighlight.value] : [];
  
  const customHighlight = getValue("customHighlight");
  if (customHighlight) {
    highlights.push(customHighlight);
  }
  
  return {
    name: getValue("name"),
    email: getValue("email"),
    relation: getValue("relation"),
    content: getValue("content"),
    highlights: highlights
  };
}

// 驗證資料
function validateData(data, t) {
  const checks = [
    { field: data.name, message: t.errorMissingName || "請填寫被推薦人姓名" },
    { field: data.email, message: t.errorMissingEmail || "請填寫被推薦人 Email" },
    { field: data.relation, message: t.errorMissingRelation || "請選擇關係" },
    { field: data.content, message: t.errorMissingContent || "請填寫推薦內容" }
  ];
  
  for (let i = 0; i < checks.length; i++) {
    if (!checks[i].field) {
      showError(checks[i].message);
      return false;
    }
  }
  
  // Email 格式檢查
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(data.email)) {
    showError(t.errorInvalidEmail || "請填寫有效的 Email 地址");
    return false;
  }
  
  // 亮點檢查
  if (data.highlights.length === 0) {
    showError(t.errorMissingHighlight || "請選擇亮點");
    return false;
  }
  
  return true;
}

// 儲存推薦
// js/pages/give-recommendation.js

async function saveRecommendation(inviteData, formData, t) {
  console.log("💾 儲存推薦資料");
  console.log("  -> 是否為回覆模式:", inviteData.isReplyMode);

  // 準備共用的資料 payload
  const commonData = {
    name: formData.name, // 在回覆模式下，這是被回覆者的名字
    email: formData.email.toLowerCase(), // 被回覆者的 email
    content: formData.content,
    highlights: formData.highlights,
    relation: formData.relation,
    status: "pending",
    recommenderName: inviteData.recommenderName, // 送出回覆的人的名字
    recommenderUserId: auth.currentUser.uid,
    recommenderJobId: inviteData.jobId,
    recommenderCompany: inviteData.company || '',
    recommenderPosition: inviteData.position || '',
    createdAt: new Date(),
    lang: localStorage.getItem("lang") || "zh"
  };

  try {
    if (inviteData.isReplyMode) {
      // =================================
      // 🔥【回覆推薦】寫入路徑
      // =================================
      console.log("  -> 寫入到使用者推薦子集合...");

      const replyData = {
        ...commonData,
        type: "reply",
        originalRecommendationId: inviteData.originalRecId,
        targetUserId: inviteData.targetUserId, // 原推薦人的 ID
        targetEmail: commonData.email,
        targetName: commonData.name
      };

      // 回覆是寫入到自己的 recommendations 子集合中
      const recRef = db.collection("users")
        .doc(auth.currentUser.uid) // 當前使用者 (回覆者)
        .collection("recommendations")
        .doc();

      await recRef.set(replyData);
      console.log("✅ 回覆推薦儲存完成，ID:", recRef.id);

    } else {
      // =================================
      // 🔥【推薦好夥伴】寫入路徑 (原邏輯)
      // =================================
      console.log("  -> 寫入到 outgoingRecommendations 集合...");

      const outgoingData = {
        ...commonData,
        type: "outgoing",
        recommendeeName: commonData.name, // 被推薦人的名字
        recommendeeEmail: commonData.email,
        inviteId: inviteData.id,
      };

      delete outgoingData.name;  // 整理欄位，避免混淆
      delete outgoingData.email;

      const recRef = db.collection("outgoingRecommendations").doc();
      await recRef.set(outgoingData);
      console.log("✅ 推薦好夥伴儲存完成，ID:", recRef.id);
    }

  } catch (error) {
    console.error("❌ 儲存推薦失敗:", error);
    // 拋出錯誤，讓外層的 try/catch 處理
    throw error;
  }

  // 注意：更新原始推薦 hasReplied 的邏輯在後端處理更安全，
  // 前端可以移除，或作為一個非關鍵的即時反饋。
  // 為求簡單，暫時移除前端的這部分操作，完全交給後端。
}

// 修改 showSuccess 函數
function showSuccess(t) {
  console.log("🎉 顯示成功訊息");
  
  const container = document.getElementById("formContainer");
  if (container) {
    container.style.display = "none";
  }
  
  const html = [
    "<div class=\"container\" style=\"text-align: center; padding: 2rem;\">",
    "<div style=\"background: #f8f9fa; border-radius: 8px; padding: 2rem; max-width: 600px; margin: 0 auto;\">",
    "<h1 style=\"color: #28a745; margin-bottom: 1.5rem;\">✅ " + (t.recommendationSentTitle || "推薦已送出！") + "</h1>",
    
    // 🆕 新增重要說明區塊
    "<div style=\"background: #e7f3ff; border: 1px solid #b3d9ff; border-radius: 6px; padding: 1.5rem; margin: 1.5rem 0; text-align: left;\">",
    "<h3 style=\"color: #0066cc; margin: 0 0 1rem 0; font-size: 1.1rem;\">📋 重要說明：</h3>",
    "<p style=\"margin: 0 0 1rem 0; line-height: 1.5;\">推薦將在對方註冊並核實身份後，正式納入你的推薦記錄。</p>",
    "<h3 style=\"color: #0066cc; margin: 1rem 0 1rem 0; font-size: 1.1rem;\">💡 小提醒：</h3>",
    "<p style=\"margin: 0 0 1rem 0; line-height: 1.5;\">你可以主動傳訊息提醒對方查收 Email，以確保推薦能順利送達！</p>",
    "<p style=\"margin: 1rem 0 0 0; line-height: 1.5;\">感謝你花時間為合作夥伴寫推薦，讓優秀的人才被看見。</p>",
    "</div>",
    
    // 原有的感謝訊息
    "<p style=\"font-size: 1.1rem; margin: 1rem 0; color: #333;\">" + (t.recommendationSentMessage || "被推薦人將收到 Email 通知邀請註冊。") + "</p>",
    
    // 按鈕區域
    "<div style=\"margin-top: 2rem;\">",
    "<button onclick=\"location.reload()\" class=\"btn btn-success\" style=\"margin-right: 1rem; padding: 0.75rem 1.5rem;\">",
    (t.recommendAnother || "推薦其他人"),
    "</button>",
    "<button onclick=\"window.location.href='/pages/profile-dashboard.html'\" class=\"btn btn-primary\" style=\"margin-right: 1rem; padding: 0.75rem 1.5rem;\">",
    (t.backToDashboard || "返回儀表板"),
    "</button>",
    "<button onclick=\"window.close()\" class=\"btn btn-secondary\" style=\"padding: 0.75rem 1.5rem;\">",
    (t.closeWindow || "關閉視窗"),
    "</button>",
    "</div>",
    "</div>",
    "</div>"
  ].join("");
  
  document.body.innerHTML = html;
}
// 顯示錯誤
function showError(message) {
  console.error("❌ 錯誤:", message);
  
  const errorDiv = document.getElementById("errorMessage");
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = "block";
    setTimeout(function() {
      errorDiv.style.display = "none";
    }, 8000);
  } else {
    alert(message);
  }
  
  hideLoading();
}

// 隱藏載入畫面
function hideLoading() {
  const loading = document.getElementById("loadingMessage");
  const form = document.getElementById("formContainer");
  
  if (loading) {
    loading.style.display = "none";
  }
  
  if (form) {
    form.style.display = "block";
  }
  
  console.log("👁️ 載入畫面已隱藏，表單已顯示");
}
// 🆕 調試函數
function debugReplyMode() {
  console.log("🔍 回推薦模式調試資訊:");
  
  const urlParams = new URLSearchParams(window.location.search);
  console.log("URL 參數:", {
    inviteId: urlParams.get("inviteId"),
    mode: urlParams.get("mode"),
    originalRecId: urlParams.get("originalRecId"),
    targetUserId: urlParams.get("targetUserId")
  });
  
  console.log("表單元素檢查:");
  console.log("- name input:", document.getElementById("name"));
  console.log("- email input:", document.getElementById("email"));
  console.log("- formTitle:", document.getElementById("formTitle"));
  console.log("- recommendNote:", document.getElementById("recommendNote"));
}
// 🆕 調試函數：檢查工作資料載入狀態
function debugJobInfo(inviteData) {
  console.log("🔍 === 工作資料調試 ===");
  console.log("邀請資料中的工作資訊:", {
    company: inviteData.company,
    position: inviteData.position,
    jobId: inviteData.jobId,
    recommenderName: inviteData.recommenderName,
    recommenderUserId: inviteData.recommenderUserId
  });
  
  console.log("DOM 中的工作背景顯示:");
  const jobInfoElement = document.getElementById("jobInfo");
  if (jobInfoElement) {
    console.log("- jobInfo HTML:", jobInfoElement.innerHTML);
  } else {
    console.log("- jobInfo 元素不存在");
  }
}

console.log("✅ give-recommendation.js 載入完成");