// 📁 public/js/pages/login.js
// 1️⃣ 初始化 Firebase（Modular SDK）
import { auth, db } from "../firebase-init.js";

// 2️⃣ 从 Modular Auth 中导入需要的函数
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

// 3️⃣ 从 Modular Firestore 中导入需要的函数
import {
  collection,
  query,
  where,
  limit,
  getDocs,
  getDoc,
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// 4️⃣ i18n 多语言支持
import { setLang, i18n } from "../i18n.js";


const params = new URLSearchParams(location.search);
const urlEmail = params.get("email");
const inviteCode = params.get("inviteCode");
const isRegister = params.get("register") === "1";

// ✅ 根據 email 判斷是否顯示註冊選項
const prefillEmail = sessionStorage.getItem("prefillEmail");
if (prefillEmail) {
  document.getElementById("loginEmail").value = prefillEmail;
  document.getElementById("registerEmail").value = prefillEmail;
  sessionStorage.removeItem("prefillEmail");
}

const showRegisterForm = async () => {
  const registerSection = document.getElementById("registerSection");
  const loginSection = document.getElementById("loginSection");
  const showRegisterRow = document.getElementById("showRegisterRow");
  const registerReminder = document.getElementById("registerReminder");

  if (inviteCode) {
    try {
      const codeDoc = await getDoc(doc(db, "inviteCodes", inviteCode));
      if (codeDoc.exists() && codeDoc.data().isActive === true) {
        registerSection.style.display = "block";
        loginSection.style.display = "none";
        showRegisterRow.style.display = "block";
        document.getElementById("inviteCodeInput").value = inviteCode;
        return;
      } else {
        registerReminder.innerText = "邀請碼無效或已過期，請確認後再試。";
      }
    } catch (err) {
      console.error("❌ 驗證邀請碼時發生錯誤", err);
      registerReminder.innerText = "系統錯誤，請稍後再試。";
    }
  }

  if (urlEmail) {
    const userQuery = query(
      collection(db, "users"),
      where("email", "==", urlEmail),
      limit(1)
    );
    const userSnap = await getDocs(userQuery);
    if (!userSnap.empty) {
      location.href = `/pages/login.html?email=${encodeURIComponent(urlEmail)}`;
      return;
    }

    const pendingSnap = await getDocs(
      query(collection(db, "pendingUsers"), where("email", "==", email))
    );
    if (!pendingSnap.empty) {
      registerSection.style.display = "block";
      loginSection.style.display = "none";
      showRegisterRow.style.display = "block";
      document.getElementById("registerEmail").value = urlEmail;
      document.getElementById("registerEmail").readOnly = true;
      return;
    }
  }

  registerSection.style.display = "block";
  loginSection.style.display = "none";
  showRegisterRow.style.display = "block";
};

if (isRegister) showRegisterForm();

const loginForm = document.getElementById("loginForm");
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  const errorMessage = document.getElementById("error-message");

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      const next = params.get("next") || "profile-dashboard.html";
      location.href = next;
    })
    .catch((error) => {
      errorMessage.style.display = "block";
      errorMessage.textContent = error.message;
    });
});

document.getElementById("resetPassword").addEventListener("click", (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value;
  const errorMessage = document.getElementById("error-message");
  if (!email) {
    errorMessage.style.display = "block";
    errorMessage.textContent = "請輸入 Email 以重置密碼。";
    return;
  }
  sendPasswordResetEmail(auth, email, { url: location.href })
    .then(() => {
      errorMessage.style.display = "block";
      errorMessage.textContent = "重置密碼郵件已發送，請檢查您的郵箱：" + email;
    })
    .catch((error) => {
      errorMessage.style.display = "block";
      errorMessage.textContent = error.message;
    });
});

// 🌐 多語系文字套用
const lang = localStorage.getItem("lang") || "en";
setLang(lang);
window.addEventListener("DOMContentLoaded", () => {
  const t = i18n[lang]?.login || {};
  document.getElementById("welcomeTitle").innerText = t.welcomeTitle || "";
  document.getElementById("noAccountText").innerHTML = t.noAccountText || "";
  document.getElementById("registerOnlyNote").innerText = t.registerOnlyNote || "";
  document.getElementById("resetPassword").innerText = t.resetPassword || "";
  document.getElementById("registerReminder").innerText = t.registerReminder || "";

  const showLoginBtn = document.getElementById("showLogin");
  if (showLoginBtn) {
    showLoginBtn.addEventListener("click", (e) => {
      e.preventDefault();
      document.getElementById("registerSection").style.display = "none";
      document.getElementById("loginSection").style.display = "block";
      document.getElementById("error-message").style.display = "none";
    });
  }
});

window.addEventListener("langChanged", (e) => {
  const newLang = e.detail || "en";
  const t = i18n[newLang]?.login || {};
  document.getElementById("welcomeTitle").innerText = t.welcomeTitle || "";
  document.getElementById("noAccountText").innerHTML = t.noAccountText || "";
  document.getElementById("registerOnlyNote").innerText = t.registerOnlyNote || "";
  document.getElementById("resetPassword").innerText = t.resetPassword || "";
  document.getElementById("registerReminder").innerText = t.registerReminder || "";
});

// 🔽 註冊表單送出事件
const registerForm = document.getElementById("registerForm");
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const errorMessage = document.getElementById("error-message");
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value;
  const inviteCodeInput = document.getElementById("inviteCodeInput").value.trim();
  const registerBtn = document.getElementById("registerBtn");

  // 檢查必填欄位
  if (!email || !password) {
    errorMessage.style.display = "block";
    errorMessage.textContent = "Email 和密碼皆為必填，請重新填寫。";
    return;
  }

  registerBtn.disabled = true;
  registerBtn.innerText = "Registering...";

  // 註冊流程
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    // 寫入 Firestore
    const userData = {
      email,
      name: "",
      createdAt: serverTimestamp()
    };
    if (inviteCodeInput) userData.inviteCode = inviteCodeInput;

    await setDoc(
  doc(db, "users", uid),
  {
    ...userData,
    createdAt: serverTimestamp()
  },
  { merge: true }
);


    window.location.href = "profile-dashboard.html";
  } catch (error) {
    console.error("❌ 註冊失敗", error);
    errorMessage.style.display = "block";
    errorMessage.textContent = error.message;
    registerBtn.disabled = false;
    registerBtn.innerText = "Register";
  }
});

