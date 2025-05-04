import { firebaseConfig } from "../firebase-config.js";
import { i18n, setLang } from "../i18n.js";

// 初始化 Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

window.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("networkContainer");

  // ❶ 語系初始化
  const lang = localStorage.getItem("lang") || "en";
  setLang(lang);
  const t = i18n[lang]?.recommendNetworkUser || i18n.en.recommendNetworkUser;

  // ❷ 不預先寫文字，等 onAuthStateChanged 後再動作
  container.innerText = "";

  // ❸ 建立 email ↔ uid 對照表 + userMap
  const allUsersSnap = await db.collection("users").get();
  const emailToUid = {};
  const userMap = {};
  allUsersSnap.forEach(doc => {
    const data = doc.data();
    if (data.email) emailToUid[data.email] = doc.id;
    userMap[doc.id] = data.name || data.pseudonym || doc.id;
  });

  // ❹ 等登入狀態確認
  auth.onAuthStateChanged(async user => {
    if (!user) {
      container.innerText = t.pleaseLogin;
      return;
    }

    container.innerText = t.loading; // ✅ 現在才顯示「載入中」
try {
    const myUid = user.uid;
    const nodesMap = {};
    const links = [];

    // 1️⃣ 自己節點
    const myDoc = await db.collection("users").doc(myUid).get();
    const myData = myDoc.exists ? myDoc.data() : {};
    const myName = myData.pseudonym || myData.name || "Me";
    const myLabel = `${myName}${t.meTag}`;
    nodesMap[myUid] = {
      id: myUid,
      label: myLabel,
      color: { background: "#cce5ff", border: "#3399ff" },
      shape: "dot"
    };

    // 2️⃣ 誰推薦了我（推薦人 → 我）
    for (const userDoc of allUsersSnap.docs) {
      const uid = userDoc.id;
      const recs = await db.collection("users").doc(uid).collection("recommendations")
        .where("claimedBy", "==", myUid).get();
      for (const recDoc of recs.docs) {
        const rec = recDoc.data();
        const fromId = uid;
        const fromLabel = userMap[fromId] || fromId;
        if (!nodesMap[fromId]) {
          nodesMap[fromId] = {
            id: fromId,
            label: fromLabel
          };
        }
        links.push({ from: fromId, to: myUid });
      }
    }

    // 3️⃣ 我邀請的推薦人（被我邀請填推薦）
    const myRecs = await db.collection("users").doc(myUid).collection("recommendations").get();
    for (const doc of myRecs.docs) {
      const rec = doc.data();
      const fromId = rec.claimedBy || emailToUid[rec.email] || `pending_${doc.id}`;
      const fromLabel = userMap[fromId] || rec.name || rec.email || fromId;

      if (!nodesMap[fromId]) {
        const isRegistered = userMap[fromId] !== undefined;
        nodesMap[fromId] = {
          id: fromId,
          label: isRegistered ? fromLabel : `${fromLabel}${t.unregisteredTag}`,
          ...(isRegistered
            ? {}
            : {
                color: { background: "#eee", border: "#aaa" },
                shape: "dot"
              })
        };
      }

      // 推薦人 → 我
      links.push({ from: fromId, to: myUid });
    }

    // 4️⃣ 畫圖
    drawNetwork(Object.values(nodesMap), links);
  } catch (err) {
    console.error("📛 Network loading failed:", err);
    container.innerText = t.networkLoadError;
  }
  });
});

function drawNetwork(nodes, edges) {
  const container = document.getElementById("networkContainer");
  const data = {
    nodes: new vis.DataSet(nodes),
    edges: new vis.DataSet(edges)
  };
  const options = {
    layout: { hierarchical: { direction: "UD" } },
    physics: { enabled: false },
    nodes: {
      shape: "dot",
      size: 16,
      font: { size: 14, color: "#333" },
      borderWidth: 2
    },
    edges: {
      arrows: { to: true },
      color: { color: "#ccc" },
      smooth: true
    }
  };
  new vis.Network(container, data, options);
}
