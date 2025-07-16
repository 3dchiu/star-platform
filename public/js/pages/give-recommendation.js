// js/pages/give-recommendation.js - i18n 完整修正版本 (Firebase Compat)

// 使用 compat 版本的 Firebase - 全域變數
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
  console.log("🚀 推薦表單頁面初始化 (v2)");

  try {
    await waitForFirebaseReady();
    db = firebase.firestore();
    auth = firebase.auth();
    console.log("✅ Firebase 服務初始化完成");

    // 使用全域的翻譯函數
    const lang = window.getCurrentLang();
    console.log("🌍 當前語言:", lang);
    
    const urlParams = new URLSearchParams(window.location.search);
    const inviteId = urlParams.get("inviteId");
    
    console.log("📋 URL 參數:", { inviteId });

    if (!inviteId) {
      throw new Error("缺少 inviteId 參數，無法載入頁面。");
    }

    const user = await waitForAuth();
    if (!user) {
      window.location.href = '/auth.html';
      return;
    }
    console.log("✅ 用戶已登入:", user.uid);

    // 【核心邏輯】所有情境都從 inviteId 開始
    const inviteData = await loadInviteData(inviteId);
    if (!inviteData) {
      showError(window.t("recommendForm.inviteNotFound"));
      return;
    }

    // 根據邀請類型，決定是「推薦他人」還是「回覆推薦」
    if (inviteData.type === 'reply') {
        console.log("🎯 進入回覆推薦模式");
        inviteData.isReplyMode = true;
        inviteData.isGivingRecommendation = true;
        // targetUserId 和 targetEmail 等資訊已在 inviteData 中
        prefillReplyForm(inviteData);
    } else if (inviteData.type === 'outgoing') {
        console.log("🎯 進入推薦好夥伴模式");
        inviteData.isReplyMode = false;
        inviteData.isGivingRecommendation = true;
    } else {
        // 其他未來可能的模式
        console.warn("未知的邀請類型:", inviteData.type);
    }
    
    console.log("✅ 推薦資料載入成功:", inviteData);
    
    setupPageContent(inviteData);
    setupFormOptions();
    setupFormSubmission(inviteData, user);

    hideLoading();
    console.log("✅ 頁面初始化完成");

  } catch (error) {
    console.error("❌ 初始化失敗:", error);
    showError(window.t("common.loadingError") + ": " + error.message);
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
      nameLabel.innerHTML += ' <span style="color: #28a745;">' + window.t("recommendForm.autofilled") + '</span>';
    }
    
    if (emailLabel) {
      emailLabel.innerHTML += ' <span style="color: #28a745;">' + window.t("recommendForm.autofilled") + '</span>';
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
function setupPageContent(inviteData) {
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
      formTitle.textContent = window.t("recommendForm.recommendPartnerTitle");
    } else if (isGivingRecommendation) {
      formTitle.textContent = window.t("recommendForm.recommendPartnerTitle");
    } else {
      formTitle.textContent = window.t("recommendForm.formTitle");
    }
  }
  
  if (recommendNote) {
    if (isReplyMode) {
      // 回推薦模式的特殊說明
      recommendNote.textContent = window.t("recommendForm.replyRecommendNote");
    } else if (isGivingRecommendation) {
      recommendNote.textContent = window.t("recommendForm.recommendPartnerNote");
    } else {
      recommendNote.textContent = window.t("recommendForm.recommendingTo");
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
    let titleText = window.t("recommendForm.workBackground");
    if (isReplyMode) {
      titleText = window.t("recommendForm.replyBackground");
    }
    
    // 🔧 修正：使用真實的工作資料，移除寫死的預設值
    const company = inviteData.company || window.t("common.company");
    const position = inviteData.position || window.t("common.position");
    const recommenderName = inviteData.recommenderName || window.t("recommendForm.recommenderName");
    
    // 🆕 格式化工作期間
    let workPeriod = "";
    if (inviteData.startDate) {
      workPeriod = inviteData.startDate;
      if (inviteData.endDate) {
        workPeriod += " ～ " + inviteData.endDate;
      } else {
        workPeriod += " ～ " + window.t("recommendSummary.present");
      }
    }
    
    jobInfo.innerHTML = [
      "<h3>" + titleText + "</h3>",
      "<div class=\"job-details\">",
      "<p><strong>" + window.t("common.company") + ":</strong> " + company + "</p>",
      "<p><strong>" + window.t("common.position") + ":</strong> " + position + "</p>",
      workPeriod ? "<p><strong>" + window.t("profileDashboard.period") + ":</strong> " + workPeriod + "</p>" : "",
      "<p><strong>" + window.t("recommendForm.recommenderName") + ":</strong> " + recommenderName + "</p>",
      inviteData.jobDescription ? "<p><strong>" + window.t("profileDashboard.descriptionOptional") + ":</strong> " + inviteData.jobDescription + "</p>" : "",
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
  updateFormLabels(isReplyMode || isGivingRecommendation, isReplyMode);
  
  // 設定提醒
  const finalReminder = document.getElementById("finalReminder");
  if (finalReminder) {
    if (isGivingRecommendation) {
      finalReminder.innerHTML = [
        "<p><strong>" + window.t("recommendForm.importantNotice") + ":</strong></p>",
        "<p>" + window.t("recommendForm.giveRecommendationReminder") + "</p>",
        "<p style=\"color: #666; font-size: 0.9em; margin-top: 15px; font-weight: 500;\">",
        "<strong>" + window.t("recommendForm.brandSlogan") + "</strong>",
        "</p>"
      ].join("");
    } else {
      finalReminder.innerHTML = [
        "<p><strong>" + window.t("recommendForm.importantNotice") + ":</strong></p>",
        "<p>" + window.t("recommendForm.confirmationNotice") + "</p>",
        "<p style=\"color: #666; font-size: 0.9em; margin-top: 15px; font-weight: 500;\">",
        "<strong>" + window.t("recommendForm.brandSlogan") + "</strong>",
        "</p>"
      ].join("");
    }
  }
}

// 🆕 修改表單標籤更新邏輯
function updateFormLabels(isGivingRecommendation, isReplyMode = false) {
  console.log("🏷️ 更新表單標籤，推薦他人模式:", isGivingRecommendation, "回推薦模式:", isReplyMode);
  
  // 🎯 回推薦模式和推薦他人模式都使用「被推薦人」標籤
  if (isReplyMode || isGivingRecommendation) {
    const elements = [
      { id: "labelName", text: window.t("recommendForm.recommendeeName") },
      { id: "labelEmail", text: window.t("recommendForm.recommendeeEmail") }
    ];
    
    let nameHintText, emailHintText;
    
    if (isReplyMode) {
      nameHintText = window.t("recommendForm.hintReplyName");
      emailHintText = window.t("recommendForm.hintReplyEmail");
    } else {
      nameHintText = window.t("recommendForm.hintRecommendeeName");
      emailHintText = window.t("recommendForm.hintRecommendeeEmail");
    }
    
    elements.forEach(function(item) {
      const element = document.getElementById(item.id);
      if (element) {
        element.textContent = item.text;
        console.log("✅ 更新標籤:", item.id, "->", item.text);
      }
    });
    
    // 更新提示文字
    const nameHint = document.querySelector('small[data-i18n="recommendForm.hintName"]');
    const emailHint = document.querySelector('small[data-i18n="recommendForm.hintEmail"]');
    
    if (nameHint) {
      nameHint.textContent = nameHintText;
    }
    
    if (emailHint) {
      emailHint.textContent = emailHintText;
    }
  } else {
    // 邀請推薦模式使用「您的」標籤
    const elements = [
      { id: "labelName", text: window.t("recommendForm.name") },
      { id: "labelEmail", text: window.t("recommendForm.email") }
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
function setupFormOptions() {
  console.log("⚙️ 設定表單選項");
  
  // 關係選項
  const relationSelect = document.getElementById("relation");
  if (relationSelect) {
    // 使用 relationLabels 物件訪問翻譯
    const relationOptions = [
      { value: "directManager", label: window.t("recommendForm.relationLabels.directManager") },
      { value: "crossDeptManager", label: window.t("recommendForm.relationLabels.crossDeptManager") },
      { value: "sameDeptColleague", label: window.t("recommendForm.relationLabels.sameDeptColleague") },
      { value: "crossDeptColleague", label: window.t("recommendForm.relationLabels.crossDeptColleague") },
      { value: "subordinate", label: window.t("recommendForm.relationLabels.subordinate") },
      { value: "client", label: window.t("recommendForm.relationLabels.client") },
      { value: "vendor", label: window.t("recommendForm.relationLabels.vendor") }
    ];
    
    relationSelect.innerHTML = "<option value=\"\">" + window.t("recommendForm.selectRelation") + "</option>";
    
    relationOptions.forEach(function(option) {
      const optionElement = document.createElement("option");
      optionElement.value = option.value;
      optionElement.textContent = option.label;
      relationSelect.appendChild(optionElement);
    });
    
    console.log("✅ 關係選項設定完成，共", relationOptions.length, "個選項");
  }
  
  // 亮點選項
  const highlightsContainer = document.getElementById("highlightsContainer");
  if (highlightsContainer) {
    const highlightOptions = [
      { value: "hardSkill", label: window.t("recommendForm.highlightOptionLabels.hardSkill") },
      { value: "softSkill", label: window.t("recommendForm.highlightOptionLabels.softSkill") },
      { value: "character", label: window.t("recommendForm.highlightOptionLabels.character") }
    ];
    
    console.log("🎯 使用的亮點選項:", highlightOptions);
    
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
function setupFormSubmission(inviteData, user) {
  console.log("📝 設定表單提交");
  
  const form = document.getElementById("recommendForm");
  const submitBtn = document.getElementById("submitBtn");
  
  if (!form || !submitBtn) {
    console.error("❌ 找不到表單或提交按鈕");
    return;
  }
  
  submitBtn.textContent = window.t("recommendForm.submitRecommendation");
  
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
      submitBtn.textContent = window.t("common.submitting");
      
      // 收集表單資料
      const formData = getFormData();
      console.log("📋 表單資料:", formData);
      
      // 驗證資料
      if (!validateData(formData)) {
        console.log("❌ 資料驗證失敗");
        return;
      }
      
      // 儲存推薦
      await saveRecommendation(inviteData, formData);
      
      // 顯示成功
      showSuccess();
      
    } catch (error) {
      console.error("❌ 提交失敗:", error);
      showError(window.t("recommendForm.submitError"));
      
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = window.t("recommendForm.submitRecommendation");
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
function validateData(data) {
  const checks = [
    { field: data.name, message: window.t("recommendForm.errorMissingName") },
    { field: data.email, message: window.t("recommendForm.errorMissingEmail") },
    { field: data.relation, message: window.t("recommendForm.errorMissingRelation") },
    { field: data.content, message: window.t("recommendForm.errorMissingContent") }
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
    showError(window.t("recommendForm.errorInvalidEmail"));
    return false;
  }
  
  // 亮點檢查
  if (data.highlights.length === 0) {
    showError(window.t("recommendForm.errorMissingHighlight"));
    return false;
  }
  
  return true;
}

// 儲存推薦
async function saveRecommendation(inviteData, formData) {
  console.log("💾 呼叫後端函式儲存推薦資料...");
  console.log("  -> 是否為回覆模式:", inviteData.isReplyMode);

  try {
    if (inviteData.isReplyMode) {
      // --- 回覆推薦的寫入路徑 (維持不變，因為是寫入使用者自己的子集合，權限通常允許) ---
      console.log("  -> 寫入到使用者推薦子集合 (回覆模式)...");
      const replyData = {
        content: formData.content,
        highlights: formData.highlights,
        relation: formData.relation,
        status: "pending",
        recommenderName: inviteData.recommenderName,
        recommenderUserId: auth.currentUser.uid,
        recommenderJobId: inviteData.jobId,
        recommenderCompany: inviteData.company || '',
        recommenderPosition: inviteData.position || '',
        createdAt: new Date(),
        lang: localStorage.getItem("lang") || "zh",
        recommenderEmail: auth.currentUser.email,
        name: inviteData.targetName,
        email: inviteData.targetEmail,
        type: "reply",
        originalRecommendationId: inviteData.originalRecommendationId || originalRecIdFromUrl,
        targetEmail: inviteData.targetEmail,
        targetName: inviteData.targetName,
      };
      if (inviteData.targetUserId) {
        replyData.targetUserId = inviteData.targetUserId;
      }
      const recRef = db.collection("users").doc(auth.currentUser.uid).collection("recommendations").doc();
      await recRef.set(replyData);
      console.log("✅ 回覆推薦儲存完成，ID:", recRef.id);

    } else {
      // --- 推薦好夥伴的寫入路徑 (改為呼叫 Cloud Function) ---
      console.log("  -> 呼叫 'submitOutgoingRecommendation' Cloud Function...");
      const functions = firebase.functions();
      const submitFunction = functions.httpsCallable('submitOutgoingRecommendation');
      
      const response = await submitFunction({ inviteData, formData });
      
      if (response.data.success) {
        console.log("✅ 後端函式成功儲存推薦，ID:", response.data.recommendationId);
      } else {
        throw new Error("後端函式回報儲存失敗。");
      }
    }

  } catch (error) {
    console.error("❌ 儲存或呼叫後端函式失敗:", error);
    // 拋出錯誤，讓外層的 try...catch 可以捕捉到並顯示給使用者
    throw error;
  }
}

// 修改 showSuccess 函數
function showSuccess() {
  console.log("🎉 顯示成功訊息");

  const container = document.getElementById("formContainer");
  if (container) {
    container.style.display = "none";
  }

  const html = [
    `<div class="container" style="text-align: center; padding: 2rem;">`,
    `<div style="background: #f8f9fa; border-radius: 8px; padding: 2rem; max-width: 600px; margin: 0 auto;">`,
    `<h1 style="color: #28a745; margin-bottom: 1.5rem;">✅ ${window.t("recommendForm.recommendationSentTitle")}</h1>`,

    // 重要說明區塊
    `<div style="background: #e7f3ff; border: 1px solid #b3d9ff; border-radius: 6px; padding: 1.5rem; margin: 1.5rem 0; text-align: left;">`,
    `<h3 style="color: #0066cc; margin: 0 0 1rem 0; font-size: 1.1rem;">${window.t("recommendForm.successImportantNote")}</h3>`,
    `<p style="margin: 0 0 1rem 0; line-height: 1.5;">${window.t("recommendForm.successNote1")}</p>`,
    `<h3 style="color: #0066cc; margin: 1rem 0 1rem 0; font-size: 1.1rem;">${window.t("recommendForm.successProTip")}</h3>`,
    `<p style="margin: 0 0 1rem 0; line-height: 1.5;">${window.t("recommendForm.successNote2")}</p>`,
    `<p style="margin: 1rem 0 0 0; line-height: 1.5;">${window.t("recommendForm.successNote3")}</p>`,
    `</div>`,

    // 按鈕區域
    `<div style="margin-top: 2rem;">`,
    `<button onclick="location.reload()" class="btn btn-success" style="margin-right: 1rem; padding: 0.75rem 1.5rem;">`,
    `${window.t("recommendForm.successRecommendAnother")}`,
    `</button>`,
    `<button onclick="window.location.href='/pages/profile-dashboard.html'" class="btn btn-primary" style="margin-right: 1rem; padding: 0.75rem 1.5rem;">`,
    `${window.t("common.backToDashboard")}`,
    `</button>`,
    `<button onclick="window.close()" class="btn btn-secondary" style="padding: 0.75rem 1.5rem;">`,
    `${window.t("common.closeWindow")}`,
    `</button>`,
    `</div>`,
    `</div>`,
    `</div>`
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