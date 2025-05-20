import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getFirestore, collection, doc, setDoc, getDocs, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { firebaseConfig } from "../firebase-config.js";

// 🔽 初始化 Firebase 與 Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 🔽 功能：載入邀請碼清單並顯示到表格中
async function loadInviteCodes() {
  const snap = await getDocs(collection(db, "inviteCodes"));
  const tbody = document.getElementById("inviteCodeTableBody");
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
      const ref = doc(db, "inviteCodes", codeId);

      btn.disabled = true;
      btn.textContent = "停用中...";

      try {
        // 📤 將邀請碼狀態更新為停用
        await setDoc(ref, { isActive: false }, { merge: true });
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
}

// 🔐 限定只有管理者登入者能操作
const auth = getAuth();
// 🔽 當 Firebase 驗證登入狀態變更時，進行身分驗證與初始化功能
onAuthStateChanged(auth, (user) => {
  // 🔍 驗證是否為管理者信箱，非管理者則導回登入頁
  if (user?.email !== "sandyylchiu@gmail.com") {
    alert("❌ 你無權使用此頁面");
    window.location.href = "/pages/login.html";
    return;
  }

  console.log("✅ 已登入管理者：", user.email);

  // ➕ 當點擊「建立邀請碼」按鈕時，寫入 Firestore
  document.getElementById("createInviteBtn").addEventListener("click", async () => {
    const code = document.getElementById("inviteCodeInput").value.trim();
    const title = document.getElementById("inviteTitleInput").value.trim();
    const maxUse = parseInt(document.getElementById("inviteMaxInput").value);
    const type = document.getElementById("inviteTypeSelect").value;

    if (!code || !title || !maxUse) {
      alert("請填寫所有欄位");
      return;
    }

    const ref = doc(db, "inviteCodes", code);
    // 📥 寫入新邀請碼資料到 Firestore
    await setDoc(ref, {
      code,
      title,
      maxUse,
      type,
      isActive: true,
      usageCount: 0,
      createdAt: serverTimestamp()
    });

    alert("✅ 邀請碼已成功建立！");
    location.reload();
  });

  // ✅ 成功登入並驗證後，載入邀請碼清單
  loadInviteCodes();
});
