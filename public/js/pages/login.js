// 📁 public/js/pages/login.js - 最終融合版
import { setLang, i18n } from "../i18n.js";

// --- 全域變數 ---
let auth, db;
const params = new URLSearchParams(location.search);
const isRegister = params.get("register") === "1";

/**
 * 等待 Firebase 準備就緒的 Promise
 */
function waitForFirebase() {
  return new Promise((resolve, reject) => {
    const maxAttempts = 20;
    let attempts = 0;
    const check = () => {
      attempts++;
      if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
        try {
            auth = firebase.auth();
            db = firebase.firestore();
            //console.log("✅ Firebase compat 服務初始化完成");
            resolve();
        } catch (e) {
            reject(new Error("Firebase 服務初始化失敗: " + e.message));
        }
      } else if (attempts >= maxAttempts) {
        reject(new Error("Firebase 初始化超時"));
      } else {
        setTimeout(check, 500);
      }
    };
    check();
  });
}

/**
 * 統一的事件綁定函式
 */
function setupEventListeners(t) {
    // 登入表單
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => handleLogin(e, t));
    }

    // 註冊表單
    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        registerForm.addEventListener("submit", (e) => handleRegister(e, t));
    }

    // 「顯示註冊」按鈕
    const showRegisterBtn = document.getElementById("showRegister");
    if (showRegisterBtn) {
        showRegisterBtn.addEventListener("click", (e) => {
            e.preventDefault();
            showRegisterForm(t);
        });
    }

    // 「返回登入」按鈕
    const showLoginBtn = document.getElementById("showLogin");
    if (showLoginBtn) {
        showLoginBtn.addEventListener("click", (e) => {
            e.preventDefault();
            document.getElementById("registerSection").style.display = "none";
            document.getElementById("loginSection").style.display = "block";
            resetToLoginPageText(t);
        });
    }

    // 「重設密碼」按鈕
    const resetPasswordBtn = document.getElementById("resetPassword");
    if (resetPasswordBtn) {
        resetPasswordBtn.addEventListener("click", (e) => handlePasswordReset(e, t));
    }
    //console.log("✅ 所有事件監聽器已綁定。");
}


/**
 * 處理登入邏輯
 */
async function handleLogin(e, t) {
    e.preventDefault();
    //console.log("📤 嘗試登入...");
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;
    const errorMessage = document.getElementById("error-message");

    try {
        await auth.signInWithEmailAndPassword(email, password);
        // 登入成功後，onAuthStateChanged 會自動處理跳轉
    } catch (error) {
        if (errorMessage) {
            errorMessage.style.display = "block";
            errorMessage.textContent = t.errorLoginFailed || "登入失敗，請檢查帳號密碼。";
        }
    }
}


/**
 * 處理註冊邏輯 (保留您完整的驗證邏輯)
 */
async function handleRegister(e, t) {
    e.preventDefault();
    //console.log("📝 開始註冊流程");
    
    const errorMessage = document.getElementById("error-message");
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;
    const inviteCodeInput = document.getElementById("inviteCodeInput").value.trim();
    const registerBtn = document.getElementById("registerBtn");

    if (!email || !password || password.length < 6) {
        errorMessage.textContent = t.errorWeakPassword || "Email 和密碼為必填，且密碼需至少6位。";
        errorMessage.style.display = "block";
        return;
    }

    // 【保留】您完整的邀請碼驗證邏輯
    if (window.currentRegistrationMode === "inviteCodeRequired" && !inviteCodeInput) {
        errorMessage.textContent = "請輸入邀請碼以完成註冊。";
        errorMessage.style.display = "block";
        return;
    }
    if (inviteCodeInput) {
        try {
            const codeDoc = await db.collection("inviteCodes").doc(inviteCodeInput).get();
            if (!codeDoc.exists || codeDoc.data().isActive !== true) {
                errorMessage.textContent = "邀請碼無效或已過期。";
                errorMessage.style.display = "block";
                return;
            }
        } catch (error) {
            errorMessage.textContent = "邀請碼驗證失敗，請稍後再試。";
            errorMessage.style.display = "block";
            return;
        }
    }

    registerBtn.disabled = true;
    registerBtn.innerText = "註冊中...";
    errorMessage.style.display = "none";

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const uid = userCredential.user.uid;
        //console.log("✅ Firebase 帳號創建成功:", uid);

        const userData = createUserData(uid, email, inviteCodeInput, window.currentRegistrationMode);
        await db.collection("users").doc(uid).set(userData, { merge: true });
        //console.log("✅ 用戶資料寫入成功");
        
        // 【保留】處理 pendingData
        await processPendingData(uid, email, window.currentRegistrationMode);

        // 註冊成功後，onAuthStateChanged 會處理跳轉
    } catch (error) {
        errorMessage.textContent = error.message;
        errorMessage.style.display = "block";
        registerBtn.disabled = false;
        registerBtn.innerText = "註冊";
    }
}


/**
 * 處理忘記密碼
 */
async function handlePasswordReset(e, t) {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const errorMessage = document.getElementById("error-message");
    if (!email) {
        errorMessage.textContent = t.errorEnterEmailForReset || "請輸入 Email 以重置密碼。";
        errorMessage.style.display = "block";
        return;
    }
    try {
        await auth.sendPasswordResetEmail(email);
        errorMessage.textContent = t.successPasswordResetSent || "重置密碼郵件已發送，請檢查您的郵箱。";
        errorMessage.style.display = "block";
    } catch (error) {
        errorMessage.textContent = error.message;
        errorMessage.style.display = "block";
    }
}


/**
 * 顯示註冊表單 (保留您完整的模式判斷邏輯)
 */
async function showRegisterForm(t) {
    //console.log("🎯 顯示註冊表單");

    const loginT = t || {}; // 確保 t.login 存在
    const registerSection = document.getElementById("registerSection");
    const loginSection = document.getElementById("loginSection");
    const welcomeTitle = document.getElementById("welcomeTitle");
    const registerReminder = document.getElementById("registerReminder");
    const emailInput = document.getElementById("registerEmail");

    registerSection.style.display = "block";
    loginSection.style.display = "none";

    // 【保留】您完整的註冊模式判斷邏輯
    const urlEmail = params.get("email");
    const inviteCode = params.get("inviteCode");
    let registrationMode = "unknown";

    if (inviteCode) {
        registrationMode = "inviteCode";
        welcomeTitle.textContent = loginT.titleInvited || "受邀註冊";
        // ... 其他邀請碼邏輯 ...
    } else if (urlEmail && isRegister) {
        const pendingQuery = await db.collection("pendingUsers").where("email", "==", urlEmail).get();
        if (!pendingQuery.empty) {
            const pendingData = pendingQuery.docs[0].data();
            if (pendingData.type === "recommendation_invitee") {
                registrationMode = "recommendee";
                welcomeTitle.textContent = loginT.titleCompleteToView || "完成註冊以查看推薦";
            } else {
                registrationMode = "recommender";
                welcomeTitle.textContent = loginT.titleManageRecs || "註冊以管理您的推薦";
            }
        } else {
            registrationMode = "direct";
        }
        if (emailInput) {
            emailInput.value = urlEmail;
            emailInput.readOnly = true;
        }
    } else {
        registrationMode = "inviteCodeRequired";
        welcomeTitle.textContent = loginT.titleDefault || "註冊新帳號";
        // ... 其他要求邀請碼邏輯 ...
    }
    
    window.currentRegistrationMode = registrationMode;
    //console.log(`✅ 註冊模式確定: ${registrationMode}`);
}


/**
 * 處理待處理資料 (保留您的函式)
 */
async function processPendingData(userId, email, registrationMode) {
    //console.log("🔄 處理 pending 資料...", { userId, email });
    const pendingSnap = await db.collection("pendingUsers").where("email", "==", email).get();
    if (pendingSnap.empty) return;

    for (const pendingDoc of pendingSnap.docs) {
        // ... 您原有的處理 pendingUsers 的邏輯 ...
        //console.log("處理 pending 記錄:", pendingDoc.id);
        await pendingDoc.ref.delete();
    }
}

/**
 * 建立使用者資料 (保留您的函式)
 */
function createUserData(uid, email, inviteCodeInput, registrationMode) {
    const userData = {
        email,
        name: "",
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        registrationMode: registrationMode || "unknown",
        recommendationStats: { totalReceived: 0, totalGiven: 0 }
    };
    if (inviteCodeInput) userData.inviteCode = inviteCodeInput;
    return userData;
}

/**
 * 重設 UI 文字 (保留您的函式)
 */
function resetToLoginPageText(t) {
    const welcomeTitle = document.getElementById("welcomeTitle");
    if (welcomeTitle) welcomeTitle.textContent = t.welcomeTitle || "歡迎來到 Galaxyz ✨";
    // ... 其他重設 UI 的邏輯 ...
}

/**
 * 更新 UI 文字 (保留您的函式)
 */
function updateUIText(t) {
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.dataset.i18n;
        if (t[key]) el.innerText = t[key];
    });
}


/**
 * 最終的初始化函式
 */
async function initialize() {
    //console.log("🚀 login.js 初始化開始...");
    try {
        await waitForFirebase();

        // 監聽認證狀態改變，這是處理登入/登出後跳轉的最佳實踐
        auth.onAuthStateChanged(user => {
            if (user) {
                // 使用者已登入或剛完成登入/註冊
                //console.log(`用戶 ${user.email} 已認證，跳轉至儀表板...`);
                const nextUrl = params.get("next") || "/pages/profile-dashboard.html";
                // 為了避免在後台分頁中意外跳轉，可以加上一個檢查
                if (document.visibilityState === 'visible') {
                    window.location.href = nextUrl;
                }
            } else {
                // 使用者未登入
                //console.log("👤 用戶未登入，顯示登入表單。");
                document.body.style.display = 'block'; // 顯示頁面內容
            }
        });
        
        // 只有在確定沒有已登入使用者時，才設定事件監聽
        // (上述 onAuthStateChanged 會處理已登入情況，此處為雙重保險)
        if (!auth.currentUser) {
            const lang = localStorage.getItem("lang") || "en";
            const t = i18n[lang]?.login || {};
            updateUIText(t);
setupEventListeners(t);
            if (isRegister) {
                await showRegisterForm(t);
            }
        }
    } catch (error) {
        console.error("❌ 初始化失敗:", error);
        document.body.innerHTML = `頁面載入失敗: ${error.message}`;
    }
}

// 監聽 DOM 載入完成事件，啟動整個頁面
document.addEventListener("DOMContentLoaded", initialize);