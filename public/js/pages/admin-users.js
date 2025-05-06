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
          let infoText = "";

          if (hasRecommender) {
            const found = Object.values(registeredUsers).find(u => u.userId === r.recommenderId);
            if (found) {
              infoText = `✅ 已補上 recommenderId（來自：${found.name}）`;
            } else {
              infoText = "✅ 已補上 recommenderId";
            }
          } else if (adminEmail === "sandyylchiu@gmail.com") {
            if (recommenderEmail && registeredUsers[recommenderEmail]) {
              const idToPatch = registeredUsers[recommenderEmail].userId;
              const nameToPatch = registeredUsers[recommenderEmail].name;
              patchBtnHtml = `<button class='patch-btn' data-docpath='${docSnap.ref.path}' data-userid='${idToPatch}'>補上 recommenderId（${nameToPatch}）</button>`;
            } else {
              patchBtnHtml = `<span style='color:red;'>🔸 尚未補上 recommenderId，Email: ${recommenderEmail}</span>`;
            }
          }

          html += `<li>
            <b>${name}</b> 推薦了此使用者（Job ID: ${jobId}）<br>
            ⭐ 標記亮點：${highlights}<br>
            📝 內容：${content}<br>
            ${infoText || patchBtnHtml}
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
