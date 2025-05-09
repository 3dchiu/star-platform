// public/js/pages/admin-users.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  collectionGroup,
  query,
  where,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { firebaseConfig } from "../firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const userTableBody = document.querySelector("#userTable tbody");

let registeredUsers = {}; // 儲存 email → { userId, name } 對照表

// 登入後才載入資料
onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("✅ 使用者已登入：", user.email);
    await loadUsers();
    await loadPendingUsers();

  } else {
    alert("請先登入管理員帳號才能使用此頁面。");
  }
});

async function loadUsers() {
  const snapshot = await getDocs(collection(db, "users"));

  userTableBody.innerHTML = ""; // 清空表格內容

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const userId = docSnap.id;
    const name = data.name || "-";
    const email = data.email || "-";
    const createdAt = data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleDateString() : "-";

    // 儲存為：email → { userId, name }
    registeredUsers[email] = { userId, name };

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${name}</td>
      <td>${email}</td>
      <td><code>${userId}</code></td>
      <td>${createdAt}</td>
      <td>
        <button class="toggle-rec" data-userid="${userId}">查看推薦紀錄</button>
      </td>
    `;

    const detailRow = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 5;
    td.innerHTML = `<div id="rec-${userId}" class="rec-list" style="display:none; padding: 8px; background:#f9f9f9;"></div>`;
    detailRow.appendChild(td);

    userTableBody.appendChild(tr);
    userTableBody.appendChild(detailRow);
  });
}

userTableBody.addEventListener("click", async (e) => {
  // 查看推薦紀錄
  if (e.target.classList.contains("toggle-rec")) {
    const userId = e.target.dataset.userid;
    const box = document.querySelector(`#rec-${userId}`);
    if (!box) return;

    if (box.style.display === "none") {
      box.innerHTML = "載入中...";
      box.style.display = "block";

      try {
        const q = query(
          collectionGroup(db, "recommendations"),
          where("invitedBy", "==", userId)
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          box.innerHTML = "❗️沒有寫過推薦內容";
          return;
        }

        let html = "<ul style='margin:0; padding-left:1em;'>";
        const adminEmail = auth.currentUser?.email;

        for (const docSnap of snapshot.docs) {
          const r = docSnap.data();
          const jobId = r.jobId;
          const name = r.name || "(無名)";
          const highlights = (r.highlights || []).join(", ");
          const content = r.content || "(無內容)";
          const hasRecommender = !!r.recommenderId;
          const recommenderEmail = r.email;

          if (!jobId || jobId === "-") continue;
          let patchBtnHtml = "";
          if (!hasRecommender && adminEmail === "sandyylchiu@gmail.com") {
            if (recommenderEmail && registeredUsers[recommenderEmail]) {
              const idToPatch = registeredUsers[recommenderEmail].userId;
              const nameToPatch = registeredUsers[recommenderEmail].name;
              patchBtnHtml = `<button class='patch-btn' data-docpath='${docSnap.ref.path}' data-userid='${idToPatch}'>補上 recommenderId（${nameToPatch}）</button>`;
            } else {
              patchBtnHtml = `
                <span style='color:red;'>🔸 尚未補上 recommenderId，Email: ${recommenderEmail}（請至下方區塊複製註冊連結）</span>
              `;
            }
          }

          html += `<li>
            <b>${name}</b> 推薦了此使用者（Job ID: ${jobId}）<br>
            ⭐ 標記亮點：${highlights}<br>
            📝 內容：${content}<br>
            ${hasRecommender ? "✅ 已補上 recommenderId" : patchBtnHtml}
            <hr>
          </li>`;
        }

        html += "</ul>";
        box.innerHTML = html || "❗️目前尚未有有效推薦紀錄";
      } catch (err) {
        box.innerHTML = "❌ 無法載入推薦資料，請確認權限或稍後再試";
        console.error("讀取推薦失敗：", err);
      }
    } else {
      box.style.display = "none";
    }
  }

  // 補上 recommenderId
  if (e.target.classList.contains("patch-btn")) {
    const path = e.target.dataset.docpath;
    const userId = e.target.dataset.userid;
    const ref = doc(db, path);

    try {
      await updateDoc(ref, { recommenderId: userId });
      alert("✅ 已補上 recommenderId");
      location.reload();
    } catch (err) {
      console.error("補寫失敗", err);
      alert("❌ 無法補寫 recommenderId，請確認權限或重試");
    }
  }
});
const pendingTableBody = document.querySelector("#pendingUserTable tbody");

let pendingUserList = []; // 👈 全域陣列，用於搜尋功能

async function loadPendingUsers() {
  const snapshot = await getDocs(collection(db, "pendingUsers"));
  pendingUserList = [];

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    pendingUserList.push({
      email: data.email || "-",
      name: data.name || "(尚未填姓名)",
      invitedBy: data.invitedBy || "-",
      notified: data.notified || false
    });
  });

  renderPendingTable(pendingUserList); // 👉 將資料交給下面的函式畫出表格
}
function renderPendingTable(data) {
  pendingTableBody.innerHTML = "";

  data.forEach(({ email, name, invitedBy, notified }) => {
    const regLink = `https://galaxyz.ai/pages/login.html?register=1&email=${encodeURIComponent(email)}&invitedBy=${invitedBy}`;
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${email}</td>
      <td>${name}</td>
      <td><code>${regLink}</code></td>
      <td>
        <button class="copy-link-btn" data-link="${regLink}">📋 複製</button>
      </td>
      <td style="text-align: center;">
        <input type="checkbox"
               data-email="${email}"
               class="notified-checkbox"
               ${notified ? "checked" : ""}>
      </td>
    `;

    pendingTableBody.appendChild(tr);
  });
}

// 點擊複製註冊連結
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("copy-link-btn")) {
    const link = e.target.dataset.link;
    navigator.clipboard.writeText(link).then(() => {
      alert("✅ 已複製註冊連結！");
    });
  }
});
document.addEventListener("change", async (e) => {
  if (e.target.classList.contains("notified-checkbox")) {
    const email = e.target.dataset.email;
    const checked = e.target.checked;

    const snapshot = await getDocs(collection(db, "pendingUsers"));
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      if (data.email === email) {
        const ref = doc(db, "pendingUsers", docSnap.id);
        await updateDoc(ref, { notified: checked });
        console.log(`✅ ${email} 已更新 notified = ${checked}`);
        break;
      }
    }
  }
});
document.getElementById("searchInput").addEventListener("input", (e) => {
  const keyword = e.target.value.toLowerCase();
  const filtered = pendingUserList.filter((u) =>
    u.email.toLowerCase().includes(keyword)
  );
  renderPendingTable(filtered);
});



