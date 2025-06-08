// 📁 public/js/pages/login.js - 最終 compat 修復版本
// 只保留 i18n 導入，移除所有 Firebase modular 導入
import { setLang, i18n } from "../i18n.js";

// 全域變數
let auth, db;

// 等待 Firebase 準備就緒
function waitForFirebase() {
  return new Promise((resolve, reject) => {
    const maxAttempts = 20;
    let attempts = 0;
    
    const check = () => {
      attempts++;
      if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
        auth = firebase.auth();
        db = firebase.firestore();
        console.log("✅ Firebase compat 服務初始化完成");
        resolve();
      } else if (attempts >= maxAttempts) {
        reject(new Error("Firebase 初始化超時"));
      } else {
        setTimeout(check, 500);
      }
    };
    check();
  });
}

// 解析 URL 參數
const params = new URLSearchParams(location.search);
const urlEmail = params.get("email");
const inviteCode = params.get("inviteCode");
const isRegister = params.get("register") === "1";
const registrationType = params.get("type") || "";

console.log("🔍 URL 參數解析:", { 
  urlEmail, 
  inviteCode, 
  isRegister, 
  registrationType 
});

// ✅ 根據 email 判斷是否顯示註冊選項
const prefillEmail = sessionStorage.getItem("prefillEmail");
if (prefillEmail) {
  setTimeout(() => {
    const loginEmailInput = document.getElementById("loginEmail");
    const registerEmailInput = document.getElementById("registerEmail");
    if (loginEmailInput) loginEmailInput.value = prefillEmail;
    if (registerEmailInput) registerEmailInput.value = prefillEmail;
    sessionStorage.removeItem("prefillEmail");
  }, 100);
}
// 顯示註冊表單函數 - 修正版
const showRegisterForm = async () => {
  console.log("🎯 顯示註冊表單");
  
  // 等待 Firebase 準備就緒
  await waitForFirebase();
  
  const registerSection = document.getElementById("registerSection");
  const loginSection = document.getElementById("loginSection");
  const showRegisterRow = document.getElementById("showRegisterRow");
  const registerReminder = document.getElementById("registerReminder");
  const welcomeTitle = document.getElementById("welcomeTitle");

  // 顯示註冊表單
  if (registerSection) registerSection.style.display = "block";
  if (loginSection) loginSection.style.display = "none";
  const urlParams = new URLSearchParams(window.location.search);
  const flow = urlParams.get('flow');
  const prefillEmail = urlParams.get('email');

  if (flow === 'lite_reg' && prefillEmail) {
    // 這是我們新的「輕量化註冊」流程
    console.log("🚀 啟用輕量化註冊流程 (Lite Onboarding)");
    window.currentRegistrationMode = "lite_recommender"; // 設定一個專屬模式

    if (welcomeTitle) welcomeTitle.textContent = "完成註冊以送出推薦";
    if (registerReminder) registerReminder.innerHTML = `<span style="color: #28a745;">您的推薦內容已暫存，完成註冊後即可回到前頁送出。</span>`;
    
    // 預填並鎖定 Email
    if (emailInput) {
      emailInput.value = prefillEmail;
      emailInput.readOnly = true;
      emailInput.style.backgroundColor = '#f0f0f0';
    }
    return; // 優先處理完畢，直接結束函數
  }

  if (showRegisterRow) showRegisterRow.style.display = "block";

  // 根據註冊模式設定不同的標題和說明
  let registrationMode = "unknown";
  let modeDescription = "";

  // 🔍 判斷註冊模式
  if (inviteCode) {
    // 模式 3：邀請碼註冊（通過 URL 參數）
    registrationMode = "inviteCode";
    modeDescription = "邀請碼註冊";
    if (welcomeTitle) welcomeTitle.textContent = "受邀註冊";
    
    try {
      const codeDoc = await db.collection("inviteCodes").doc(inviteCode).get();
      if (codeDoc.exists && codeDoc.data().isActive === true) {
        const inviteCodeInput = document.getElementById("inviteCodeInput");
        if (inviteCodeInput) inviteCodeInput.value = inviteCode;
        if (registerReminder) registerReminder.innerHTML = `<span style="color: green;">✅ 邀請碼有效，歡迎加入！</span>`;
        console.log("✅ 邀請碼有效");
      } else {
        if (registerReminder) registerReminder.innerHTML = `<span style="color: red;">❌ 邀請碼無效或已過期</span>`;
        console.log("❌ 邀請碼無效");
      }
    } catch (err) {
      console.error("❌ 驗證邀請碼錯誤:", err);
      if (registerReminder) registerReminder.innerHTML = `<span style="color: red;">❌ 系統錯誤，請稍後再試</span>`;
    }
    
  } else if (urlEmail && isRegister) {
    // 檢查是模式 1 還是模式 2（通過邀請連結）
    try {
      // 查詢 pendingUsers 來判斷註冊類型 - 使用 compat 語法
      const pendingQuery = db.collection("pendingUsers").where("email", "==", urlEmail);
      const pendingSnap = await pendingQuery.get();
      
      if (!pendingSnap.empty) {
        const pendingData = pendingSnap.docs[0].data();
        console.log("📋 找到 pending 資料:", pendingData);
        
        if (pendingData.type === "recommendation_invitee") {
          // 模式 2：推薦他人的被推薦人
          registrationMode = "recommendee";
          modeDescription = "被推薦人註冊";
          if (welcomeTitle) welcomeTitle.textContent = "完成註冊查看推薦";
          if (registerReminder) registerReminder.innerHTML = `<span style="color: blue;">📝 有人為你寫了推薦，註冊後即可查看！</span>`;
        } else if (pendingData.fromRecommendation === true) {
          // 模式 1：邀請推薦的推薦人
          registrationMode = "recommender";
          modeDescription = "推薦人註冊";
          if (welcomeTitle) welcomeTitle.textContent = "註冊管理推薦記錄";
          if (registerReminder) registerReminder.innerHTML = `<span style="color: green;">✅ 感謝你提供推薦，註冊後可管理你的推薦記錄！</span>`;
        } else {
          // 其他類型
          registrationMode = "general";
          modeDescription = "一般註冊";
          if (welcomeTitle) welcomeTitle.textContent = "註冊新帳號";
        }
      } else {
        // 沒有在 pendingUsers 中找到，可能是直接註冊
        registrationMode = "direct";
        modeDescription = "直接註冊";
        if (welcomeTitle) welcomeTitle.textContent = "註冊新帳號";
      }
      
      // 預填並鎖定 Email
      const emailInput = document.getElementById("registerEmail");
      if (emailInput) {
        emailInput.value = urlEmail;
        emailInput.readOnly = true;
        console.log("✅ Email 已預填並鎖定:", urlEmail);
      }
      
    } catch (error) {
      console.error("❌ 檢查註冊類型時發生錯誤:", error);
      registrationMode = "error";
      if (registerReminder) registerReminder.innerHTML = `<span style="color: red;">❌ 系統錯誤，請稍後再試</span>`;
    }
    
  } else {
    // 🔧 手動點擊註冊（無邀請連結或邀請碼）- 要求填寫邀請碼
    registrationMode = "inviteCodeRequired";
    modeDescription = "邀請碼註冊";
    if (welcomeTitle) welcomeTitle.textContent = "邀請碼註冊";
    if (registerReminder) {
      registerReminder.innerHTML = `<span style="color: blue;">📋 請輸入有效的邀請碼以完成註冊。如需邀請碼請聯繫管理員。</span>`;
    }
    
    // 🔧 強調邀請碼欄位必填
    const inviteCodeInput = document.getElementById("inviteCodeInput");
    if (inviteCodeInput) {
      inviteCodeInput.placeholder = "邀請碼（必填）";
      inviteCodeInput.required = true;
      // 添加提示樣式
      inviteCodeInput.style.borderColor = "#3b82f6";
      inviteCodeInput.style.backgroundColor = "#eff6ff";
    }
    
    console.log("📋 手動註冊：要求填寫邀請碼");
  }

  console.log(`✅ 註冊模式確定: ${registrationMode} (${modeDescription})`);
  
  // 將註冊模式存在全域變數，供註冊時使用
  window.currentRegistrationMode = registrationMode;
  window.currentRegistrationEmail = urlEmail;
};

// 在 login.js 中，修復 processPendingData 函數
// 找到這個函數並替換：

async function processPendingData(userId, email, registrationMode) {
  console.log("🔄 處理 pending 資料:", { userId, email, registrationMode });
  
  try {
    // 查找所有相關的 pending 記錄 - 使用 compat 語法
    const pendingQuery = db.collection("pendingUsers").where("email", "==", email);
    const pendingSnap = await pendingQuery.get();
    
    if (pendingSnap.empty) {
      console.log("ℹ️ 沒有找到 pending 資料");
      return;
    }
    
    console.log(`📋 找到 ${pendingSnap.size} 筆 pending 資料`);
    
    // 處理每筆 pending 記錄
    for (const pendingDoc of pendingSnap.docs) {
      const pendingData = pendingDoc.data();
      console.log("📄 處理 pending 記錄:", pendingData);
      
      // 根據類型處理不同的邏輯
      if (pendingData.type === "recommendation_invitee") {
        // 模式 2：被推薦人註冊，需要處理推薦記錄
        await handleRecommendeeRegistration(userId, email, pendingData);
        
      } else if (pendingData.fromRecommendation === true) {
        // 模式 1：推薦人註冊，建立關聯
        await handleRecommenderRegistration(userId, email, pendingData);
      }
      
      // 刪除 pending 記錄
      await pendingDoc.ref.delete();
      console.log("✅ Pending 記錄已刪除");
    }
    
    console.log("✅ 所有 pending 資料處理完成");
    
  } catch (error) {
    console.error("❌ 處理 pending 資料失敗:", error);
    // 不阻止註冊流程，只記錄錯誤
  }
}

// 新增：處理被推薦人註冊
async function handleRecommendeeRegistration(userId, email, pendingData) {
  console.log("👤 處理被推薦人註冊:", { userId, email, pendingData });
  
  try {
    // 1. 從 outgoingRecommendations 找到推薦記錄
    const outgoingQuery = db.collection("outgoingRecommendations")
      .where("recommendeeEmail", "==", email);
    const outgoingSnap = await outgoingQuery.get();
    
    if (outgoingSnap.empty) {
      console.log("⚠️ 找不到對應的 outgoingRecommendations 記錄");
      return;
    }
    
    console.log(`📋 找到 ${outgoingSnap.size} 筆推薦記錄`);
    
    // 處理每個推薦記錄
    for (const outgoingDoc of outgoingSnap.docs) {
      const recommendationData = outgoingDoc.data();
      console.log("📄 處理推薦記錄:", recommendationData);
      
      // 2. 在被推薦人的 recommendations 集合中創建記錄
      const recommendationId = outgoingDoc.id; // 使用 outgoing 的 ID
      const userRecommendationRef = db.collection("users")
        .doc(userId)
        .collection("recommendations")
        .doc(recommendationId);
      
      const recommendationRecord = {
        // 推薦人資訊
        recommenderName: recommendationData.name,
        recommenderEmail: recommendationData.email,
        recommenderId: recommendationData.recommenderUserId,
        
        // 推薦內容
        content: recommendationData.content,
        highlights: recommendationData.highlights || [],
        relation: recommendationData.relation,
        
        // 工作相關資訊
        jobId: recommendationData.recommenderJobId,
        company: recommendationData.recommenderCompany,
        position: recommendationData.recommenderPosition,
        
        // 狀態資訊
        status: "confirmed",
        type: "received",
        createdAt: recommendationData.createdAt,
        confirmedAt: firebase.firestore.FieldValue.serverTimestamp(),
        
        // 來源資訊
        sourceType: "outgoing_recommendation",
        sourceId: outgoingDoc.id,
        
        // 語言
        lang: recommendationData.lang || "zh"
      };
      
      await userRecommendationRef.set(recommendationRecord);
      console.log("✅ 被推薦人推薦記錄已創建");
      
      // 3. 檢查被推薦人是否有對應的工作經歷，如果沒有則建議創建
      await suggestJobExperience(userId, recommendationData);
      
      // 4. 更新 outgoingRecommendations 狀態
      await outgoingDoc.ref.update({
        status: "confirmed",
        recommendeeUserId: userId,
        confirmedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.log("✅ OutgoingRecommendations 狀態已更新");
      
      // 5. 更新推薦人統計
      await updateRecommenderStats(recommendationData.recommenderUserId);
    }
    
  } catch (error) {
    console.error("❌ 處理被推薦人註冊失敗:", error);
  }
}

// 新增：處理推薦人註冊
async function handleRecommenderRegistration(userId, email, pendingData) {
  console.log("✍️ 處理推薦人註冊:", { userId, email, pendingData });
  
  try {
    // 如果推薦人註冊，更新相關的推薦記錄
    if (pendingData.targetUserId && pendingData.recommendationId) {
      const recRef = db.collection("users")
        .doc(pendingData.targetUserId)
        .collection("recommendations")
        .doc(pendingData.recommendationId);
      
      const updateData = {
        recommenderId: userId,
        recommenderRegistered: true,
        processedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      await recRef.update(updateData);
      console.log("✅ 推薦記錄已更新推薦人 ID");
    }
    
  } catch (error) {
    console.error("❌ 處理推薦人註冊失敗:", error);
  }
}

// 新增：建議工作經歷
async function suggestJobExperience(userId, recommendationData) {
  console.log("💼 檢查並建議工作經歷");
  
  try {
    // 檢查被推薦人是否已有該公司的工作經歷
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      console.log("⚠️ 用戶文檔不存在");
      return;
    }
    
    const userData = userDoc.data();
    const workExperiences = userData.workExperiences || {};
    
    // 檢查是否已有該公司的工作經歷
    const hasMatchingExperience = Object.values(workExperiences).some(exp => 
      exp.company && exp.company.toLowerCase() === recommendationData.recommenderCompany?.toLowerCase()
    );
    
    if (!hasMatchingExperience) {
      // 在 suggestedJobExperiences 中添加建議
      const suggestionId = `suggestion_${Date.now()}`;
      const suggestion = {
        id: suggestionId,
        company: recommendationData.recommenderCompany,
        position: recommendationData.recommenderPosition,
        source: "recommendation",
        recommenderName: recommendationData.name,
        recommendationId: recommendationData.sourceId || "unknown",
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        status: "pending"
      };
      
      await userRef.update({
        [`suggestedJobExperiences.${suggestionId}`]: suggestion
      });
      
      console.log("✅ 工作經歷建議已創建");
    } else {
      console.log("ℹ️ 用戶已有該公司的工作經歷");
    }
    
  } catch (error) {
    console.error("❌ 建議工作經歷失敗:", error);
  }
}
// 修正後的 updateRecommenderStats 函數
async function updateRecommenderStats(recommenderUserId) {
  console.log("📊 更新推薦人統計:", recommenderUserId);
  
  try {
    if (!recommenderUserId) {
      console.log("⚠️ 推薦人 ID 不存在");
      return;
    }
    
    const recommenderRef = db.collection("users").doc(recommenderUserId);
    
    // 🔧 統一使用 recommendationStats 結構，與其他地方保持一致
    await recommenderRef.update({
      "recommendationStats.totalGiven": firebase.firestore.FieldValue.increment(1),
      "recommendationStats.lastUpdated": firebase.firestore.FieldValue.serverTimestamp()
    });
    
    console.log("✅ 推薦人統計已更新 (recommendationStats.totalGiven +1)");
    
  } catch (error) {
    console.error("❌ 更新推薦人統計失敗:", error);
  }
}

// 🔧 修正 createUserData 函數（移除 async，因為不需要）
function createUserData(uid, email, inviteCodeInput, registrationMode) {
  const userData = {
    email,
    name: "", // 可以後續在 profile 頁面填寫
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    registrationMode: registrationMode || "unknown",
    registeredAt: new Date().toISOString(),
    
    // 🔧 初始化統計結構，與其他地方保持一致
    recommendationStats: {
      totalReceived: 0,
      totalGiven: 0,
      lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    }
  };

  if (inviteCodeInput) {
    userData.inviteCode = inviteCodeInput;
  }

  return userData;
}
// 初始化函數
async function initialize() {
  try {
    // 等待 Firebase 準備就緒
    await waitForFirebase();
    console.log("✅ Firebase 準備就緒");
    
    if (auth.currentUser) {
      console.log(`用戶 ${auth.currentUser.email} 已登入，自動跳轉至儀表板...`);
      // 如果有 next 參數，則跳轉到 next，否則跳轉到儀表板
      const params = new URLSearchParams(location.search);
      const nextUrl = params.get("next") || "/pages/profile-dashboard.html";
      window.location.href = nextUrl;
      return; // 【重要】直接退出函數，不執行後續的登入表單邏輯
    }
    
    // 如果有 register 參數，調用 showRegisterForm
    if (isRegister) {
      console.log("🎯 URL 參數檢測到 register=1，調用 showRegisterForm");
      await showRegisterForm();
    }
    
  } catch (error) {
    console.error("❌ 初始化失敗:", error);
  }
}

// 登入表單處理
function setupLoginForm() {
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      // 等待 Firebase 準備就緒
      await waitForFirebase();
      
      const email = document.getElementById("loginEmail").value;
      const password = document.getElementById("loginPassword").value;
      const errorMessage = document.getElementById("error-message");

      try {
        await auth.signInWithEmailAndPassword(email, password);
        const next = params.get("next") || "profile-dashboard.html";
        location.href = next;
      } catch (error) {
        if (errorMessage) {
          errorMessage.style.display = "block";
          errorMessage.textContent = error.message;
        }
      }
    });
  }
}

// 重置密碼
function setupPasswordReset() {
  const resetPasswordBtn = document.getElementById("resetPassword");
  if (resetPasswordBtn) {
    resetPasswordBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      
      // 等待 Firebase 準備就緒
      await waitForFirebase();
      
      const email = document.getElementById("loginEmail").value;
      const errorMessage = document.getElementById("error-message");
      if (!email) {
        if (errorMessage) {
          errorMessage.style.display = "block";
          errorMessage.textContent = "請輸入 Email 以重置密碼。";
        }
        return;
      }
      
      try {
        await auth.sendPasswordResetEmail(email, { url: location.href });
        if (errorMessage) {
          errorMessage.style.display = "block";
          errorMessage.textContent = "重置密碼郵件已發送，請檢查您的郵箱：" + email;
        }
      } catch (error) {
        if (errorMessage) {
          errorMessage.style.display = "block";
          errorMessage.textContent = error.message;
        }
      }
    });
  }
}

// 修正註冊表單處理函數 - 添加邀請碼驗證
function setupRegisterForm() {
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      console.log("📝 開始註冊流程");
      
      // 等待 Firebase 準備就緒
      await waitForFirebase();
      
      const errorMessage = document.getElementById("error-message");
      const email = document.getElementById("registerEmail").value.trim();
      const password = document.getElementById("registerPassword").value;
      const inviteCodeInput = document.getElementById("inviteCodeInput").value.trim();
      const registerBtn = document.getElementById("registerBtn");

      // 檢查必填欄位
      if (!email || !password) {
        if (errorMessage) {
          errorMessage.style.display = "block";
          errorMessage.textContent = "Email 和密碼皆為必填，請重新填寫。";
        }
        return;
      }

      // 🔧 檢查邀請碼（如果是手動註冊）
      if (window.currentRegistrationMode === "inviteCodeRequired" && !inviteCodeInput) {
        if (errorMessage) {
          errorMessage.style.display = "block";
          errorMessage.textContent = "請輸入邀請碼以完成註冊。";
        }
        return;
      }

      // 🔧 驗證邀請碼有效性（如果有填寫）
      if (inviteCodeInput) {
        try {
          const codeDoc = await db.collection("inviteCodes").doc(inviteCodeInput).get();
          if (!codeDoc.exists || codeDoc.data().isActive !== true) {
            if (errorMessage) {
              errorMessage.style.display = "block";
              errorMessage.textContent = "邀請碼無效或已過期，請確認後重新輸入。";
            }
            return;
          }
          
          // 檢查邀請碼使用次數
          const codeData = codeDoc.data();
          const usageCount = codeData.usageCount || 0;
          const maxUse = codeData.maxUse || Infinity;
          
          if (usageCount >= maxUse) {
            if (errorMessage) {
              errorMessage.style.display = "block";
              errorMessage.textContent = "邀請碼使用次數已達上限，請聯繫管理員。";
            }
            return;
          }
          
          console.log("✅ 邀請碼驗證通過");
        } catch (error) {
          console.error("❌ 邀請碼驗證失敗:", error);
          if (errorMessage) {
            errorMessage.style.display = "block";
            errorMessage.textContent = "邀請碼驗證失敗，請稍後再試。";
          }
          return;
        }
      }

      // 密碼強度檢查
      if (password.length < 6) {
        if (errorMessage) {
          errorMessage.style.display = "block";
          errorMessage.textContent = "密碼至少需要 6 個字元。";
        }
        return;
      }

      if (registerBtn) {
        registerBtn.disabled = true;
        registerBtn.innerText = "註冊中...";
      }
      if (errorMessage) errorMessage.style.display = "none";

      try {
        // 創建 Firebase 帳號 - 使用 compat 語法
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const uid = userCredential.user.uid;
        console.log("✅ Firebase 帳號創建成功:", uid);

        // 使用修正後的 createUserData 函數
        const userData = createUserData(uid, email, inviteCodeInput, window.currentRegistrationMode);

        // 寫入用戶資料 - 使用 compat 語法
        await db.collection("users").doc(uid).set(userData, { merge: true });
        console.log("✅ 用戶資料寫入成功");

        // 🔧 如果使用了邀請碼，更新使用次數
        if (inviteCodeInput) {
          try {
            await db.collection("inviteCodes").doc(inviteCodeInput).update({
              usageCount: firebase.firestore.FieldValue.increment(1),
              lastUsedAt: firebase.firestore.FieldValue.serverTimestamp(),
              lastUsedBy: uid
            });
            console.log("✅ 邀請碼使用次數已更新");
          } catch (error) {
            console.error("❌ 更新邀請碼使用次數失敗:", error);
            // 不阻止註冊流程
          }
        }

        // 根據註冊模式處理 pending 資料
        await processPendingData(uid, email, window.currentRegistrationMode);

        console.log("🎉 註冊完成，重定向到儀表板");
        
        // 重定向到儀表板
        const urlParams = new URLSearchParams(window.location.search);
        const flow = urlParams.get('flow');

        if (flow === 'lite_reg') {
            // ✅ 如果是輕量化註冊流程
            console.log("🎉 輕量化註冊成功！顯示提示訊息，不跳轉。");
            
            // 隱藏表單，顯示成功訊息
            const registerSection = document.getElementById("registerSection");
            if(registerSection) {
              registerSection.innerHTML = `
                  <div style="text-align: center; padding: 2rem; border: 1px solid #d4edda; background-color: #f0fff4; border-radius: 8px;">
                      <h2 style="color: #155724;">✅ 註冊成功！</h2>
                      <p style="margin-top: 1rem;">請關閉此分頁，並回到您先前的「推薦表單」頁面，再次點擊「送出推薦」即可完成。</p>
                      <button onclick="window.close()" style="margin-top: 1.5rem; padding: 10px 20px; font-size: 16px; cursor: pointer;">關閉此分頁</button>
                  </div>
              `;
            }
        } else {
            // 正常註冊流程，跳轉到儀表板進行完整的新手引導
            console.log("🎉 註冊完成，重定向到儀表板");
            window.location.href = "profile-dashboard.html";
        }

      } catch (error) {
        console.error("❌ 註冊失敗:", error);
        
        let errorMsg = "註冊失敗，請稍後再試。";
        
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMsg = "此 Email 已被註冊，請嘗試登入或使用其他 Email。";
            break;
          case 'auth/invalid-email':
            errorMsg = "Email 格式不正確。";
            break;
          case 'auth/weak-password':
            errorMsg = "密碼強度不足，請使用至少 6 個字元。";
            break;
          default:
            errorMsg = error.message || "註冊失敗，請稍後再試。";
        }
        
        if (errorMessage) {
          errorMessage.style.display = "block";
          errorMessage.textContent = errorMsg;
        }
        
        if (registerBtn) {
          registerBtn.disabled = false;
          registerBtn.innerText = "Register";
        }
      }
    });
  }
}

// 🌐 多語系文字套用
const lang = localStorage.getItem("lang") || "en";
setLang(lang);

// 修正 DOMContentLoaded 事件處理
document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 login.js (compat 版本) DOMContentLoaded");
  
  const lang = localStorage.getItem("lang") || "en";
  setLang(lang);
  const t = i18n[lang]?.login || {};
  
  // 等待一小段時間確保 DOM 完全載入
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // 更新多語系文字
  updateUIText(t);

  // 🔧 改善按鈕綁定 - 移除有問題的 setupLoginButton 調用
  setupRegisterButton();
  
  // 設定各種表單處理
  setupLoginForm();
  setupPasswordReset();
  setupRegisterForm();
  
  // 初始化
  await initialize();
});

// 修正後的 setupRegisterButton 函數
function setupRegisterButton() {
  const showRegisterBtn = document.getElementById("showRegister");
  const showLoginBtn = document.getElementById("showLogin");
  
  console.log("🔍 註冊按鈕檢查:", {
    showRegisterBtn: !!showRegisterBtn,
    showLoginBtn: !!showLoginBtn
  });
  
  if (showRegisterBtn) {
    // 移除之前的事件監聽器（如果有）
    showRegisterBtn.replaceWith(showRegisterBtn.cloneNode(true));
    const newShowRegisterBtn = document.getElementById("showRegister");
    
    newShowRegisterBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      console.log("🎯 用戶點擊註冊按鈕");
      try {
        await showRegisterForm();
      } catch (error) {
        console.error("❌ 顯示註冊表單失敗:", error);
      }
    });
    
    console.log("✅ 註冊按鈕事件已綁定");
  } else {
    console.error("❌ 找不到 showRegister 按鈕");
  }

  if (showLoginBtn) {
    showLoginBtn.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("🔙 用戶點擊返回登入");
      
      const registerSection = document.getElementById("registerSection");
      const loginSection = document.getElementById("loginSection");
      const errorMessage = document.getElementById("error-message");
      
      // 🔧 重置頁面顯示狀態
      if (registerSection) registerSection.style.display = "none";
      if (loginSection) loginSection.style.display = "block";
      if (errorMessage) errorMessage.style.display = "none";
      
      // 🔧 重置文字狀態為原始登入頁面
      resetToLoginPageText();
      
      console.log("✅ 已切換回登入模式");
    });
    
    console.log("✅ 返回登入按鈕事件已綁定");
  }
}

// 🔧 同時修正 resetToLoginPageText 函數，確保不會重複添加
function resetToLoginPageText() {
  const lang = localStorage.getItem("lang") || "en";
  const t = i18n[lang]?.login || {};
  
  const welcomeTitle = document.getElementById("welcomeTitle");
  const registerReminder = document.getElementById("registerReminder");
  const inviteCodeInput = document.getElementById("inviteCodeInput");
  
  // 重置標題
  if (welcomeTitle) {
    welcomeTitle.textContent = t.welcomeTitle || "歡迎來到 Galaxyz ✨";
  }
  
  // 重置提醒文字
  if (registerReminder) {
    registerReminder.innerHTML = t.registerReminder || "目前僅限受邀者與推薦人註冊，請確認您的邀請連結是否正確。";
    registerReminder.style.color = "#cc0000"; // 重置顏色
  }
  
  // 重置邀請碼欄位樣式
  if (inviteCodeInput) {
    inviteCodeInput.placeholder = "邀請碼（若有）";
    inviteCodeInput.required = false;
    inviteCodeInput.style.borderColor = "";
    inviteCodeInput.style.backgroundColor = "";
    inviteCodeInput.value = ""; // 清空內容
  }
  
  // 重置全域變數
  window.currentRegistrationMode = null;
  window.currentRegistrationEmail = null;
  
  console.log("✅ 文字狀態已重置為登入頁面");
}

// 新增：更新UI文字
// 修正後的 updateUIText 函數 - 移除註冊連結的重複處理
function updateUIText(t) {
  const welcomeTitle = document.getElementById("welcomeTitle");
  const noAccountText = document.getElementById("noAccountText");
  const registerOnlyNote = document.getElementById("registerOnlyNote");
  const resetPassword = document.getElementById("resetPassword");
  const registerReminder = document.getElementById("registerReminder");
  
  if (welcomeTitle && !isRegister) welcomeTitle.innerText = t.welcomeTitle || "歡迎來到 Galaxyz ✨";
  if (noAccountText) noAccountText.innerHTML = t.noAccountText || "還沒有帳號？";
  if (registerOnlyNote) registerOnlyNote.innerText = t.registerOnlyNote || "（僅限曾填寫推薦表者可註冊）";
  if (resetPassword) resetPassword.innerText = t.resetPassword || "忘記密碼？";
  if (registerReminder && !isRegister) {
    registerReminder.innerText = t.registerReminder || "目前僅限受邀者與推薦人註冊，請確認您的邀請連結是否正確。";
  }
}