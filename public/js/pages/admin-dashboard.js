// admin-dashboard.js
console.log("admin-dashboard.js 啟動");

// 🔽 功能：載入邀請碼清單並顯示到表格中
async function loadInviteCodes() {
  // 🔧 檢查 Firebase 是否已初始化
  if (typeof firebase === 'undefined') {
    console.error("❌ Firebase 未載入");
    alert("❌ Firebase 未載入，請檢查頁面配置");
    return;
  }

  if (firebase.apps.length === 0) {
    console.error("❌ Firebase 未初始化");
    alert("❌ Firebase 未初始化");
    return;
  }

  const db = firebase.firestore();
  console.log("✅ Firebase 服務已連接");

  try {
    const snap = await db.collection("inviteCodes").get();
    const tbody = document.getElementById("inviteCodeTableBody");
    if (!tbody) return;
    
    tbody.innerHTML = "";

    // 🔍 將每一筆邀請碼資料渲染成表格列
    snap.forEach(docSnap => {
      const data = docSnap.data();
      const row = document.createElement("tr");
      row.innerHTML = `
        <td class="py-1">${data.code}</td>
        <td class="py-1">${data.title || ""}</td>
        <td class="py-1">${data.usageCount ?? 0}</td>
        <td class="py-1">${data.maxUse ?? "-"}</td>
        <td class="py-1">${data.isActive ? "✅" : "❌"}</td>
        <td class="py-1">
          ${data.isActive
            ? `<button class="text-sm text-red-500 underline" data-disable="${docSnap.id}">停用</button>`
            : `<span class="text-gray-400 text-sm">已停用</span>`}
        </td>
      `;
      tbody.appendChild(row);
    });

    // 🔍 為所有「停用」按鈕加入點擊事件
    tbody.querySelectorAll("button[data-disable]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const codeId = btn.getAttribute("data-disable");
        const ref = db.collection("inviteCodes").doc(codeId);

        btn.disabled = true;
        btn.textContent = "停用中...";

        try {
          // 📤 將邀請碼狀態更新為停用
          await ref.set({ isActive: false }, { merge: true });
          alert(`✅ 已停用邀請碼：${codeId}`);
          loadInviteCodes(); // 重新載入畫面
        } catch (error) {
          console.error("❌ 停用失敗：", error);
          alert("❌ 停用失敗，請稍後再試！");
          btn.disabled = false;
          btn.textContent = "停用";
        }
      });
    });
  } catch (error) {
    console.error("❌ 載入邀請碼失敗：", error);
    alert("❌ 載入邀請碼失敗");
  }
}

// 🔐 限定只有管理者登入者能操作
function initializeAdminDashboard() {
  // 🔧 檢查 Firebase Auth 是否可用
  if (typeof firebase === 'undefined' || !firebase.auth) {
    console.error("❌ Firebase Auth 未載入");
    alert("❌ Firebase Auth 未載入");
    return;
  }

  const auth = firebase.auth();
  
  // 🔽 當 Firebase 驗證登入狀態變更時，進行身分驗證與初始化功能
  auth.onAuthStateChanged((user) => {
    // 🔍 驗證是否為管理者信箱，非管理者則導回登入頁
    if (user?.email !== "sandyylchiu@gmail.com") {
      alert("❌ 你無權使用此頁面");
      window.location.href = "/pages/login.html";
      return;
    }

    console.log("✅ 已登入管理者：", user.email);

    // ➕ 當點擊「建立邀請碼」按鈕時，寫入 Firestore
    const createBtn = document.getElementById("createInviteBtn");
    if (createBtn) {
      createBtn.addEventListener("click", async () => {
        const code = document.getElementById("inviteCodeInput")?.value.trim();
        const title = document.getElementById("inviteTitleInput")?.value.trim();
        const maxUse = parseInt(document.getElementById("inviteMaxInput")?.value);
        const type = document.getElementById("inviteTypeSelect")?.value;

        if (!code || !title || !maxUse) {
          alert("請填寫所有欄位");
          return;
        }

        try {
          const db = firebase.firestore();
          const ref = db.collection("inviteCodes").doc(code);
          
          // 📥 寫入新邀請碼資料到 Firestore
          await ref.set({
            code,
            title,
            maxUse,
            type,
            isActive: true,
            usageCount: 0,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });

          alert("✅ 邀請碼已成功建立！");
          location.reload();
        } catch (error) {
          console.error("❌ 建立邀請碼失敗：", error);
          alert("❌ 建立邀請碼失敗，請稍後再試！");
        }
      });
    }

    // ✅ 成功登入並驗證後，載入邀請碼清單
    loadInviteCodes();
  });
}

// 檢查 DOM 狀態並初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAdminDashboard);
} else {
  initializeAdminDashboard();
}