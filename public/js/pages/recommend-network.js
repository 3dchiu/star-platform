// public/js/pages/recommend-network.js
console.log("recommend-network.js 啟動");

window.addEventListener("DOMContentLoaded", async () => {
  console.log("❇️ rootUserId =", new URLSearchParams(window.location.search).get("userId"));
  
  const container = document.getElementById("networkContainer");
  container.innerText = "Loading...";

  try {
    // 🔧 檢查 Firebase 是否已初始化
    if (typeof firebase === 'undefined') {
      throw new Error("Firebase 未載入");
    }

    if (firebase.apps.length === 0) {
      throw new Error("Firebase 未初始化，請檢查 firebase-init.js");
    }

    // 使用已初始化的 Firebase 實例
    const db = firebase.firestore();
    console.log("✅ Firebase 服務已連接");

    // 解析 rootUserId（推薦網絡的起點）
    const params = new URLSearchParams(window.location.search);
    const rootUserId = params.get("userId");

    // 1️⃣ 取得所有使用者名稱映射
    const userMap = {};
    // 2️⃣ 準備節點與連線結構
    const nodesMap = {};
    const links = [];
    const allUsers = await db.collection("users").get();
    // 先把所有已註冊使用者 email 收進一個 map
    const emailToId = {};
    allUsers.forEach(doc => {
        const d = doc.data();
        if (d.email) {
        emailToId[d.email] = doc.id;
        }
    });
    const pending = await db.collection("pendingUsers").get();
    allUsers.forEach(doc => {
      const data = doc.data();
      userMap[doc.id] = data.name || doc.id;
    });

    // 處理尚未註冊的推薦人（pendingUsers）
    pending.forEach(doc => {
        const data = doc.data();
        if (emailToId[data.email]) return;
      
        const targetId      = data.invitedBy;           // 被推荐者：陳大衛 的 UID
        const pendingNodeId = `pending_${doc.id}`;      // 未注册的推荐人节点
      
        // 建立「未注册推荐人」节点
        nodesMap[pendingNodeId] = nodesMap[pendingNodeId] || {
          id: pendingNodeId,
          label: `${data.name || "匿名"}（未註冊）`,
          color: { background: "#eee", border: "#aaa" },
          shape: "dot"
        };
      
        // 确保「被推荐者」节点存在
        nodesMap[targetId] = nodesMap[targetId] || {
          id:    targetId,
          label: userMap[targetId] || targetId
        };
      
        // **关键：** pending → 已注册用户
        links.push({ from: pendingNodeId, to: targetId });
      });
      

    // 若有指定 rootUserId，一定先加到 nodesMap 裡
    if (rootUserId) {
        nodesMap[rootUserId] = {
        id:    rootUserId,
        label: userMap[rootUserId] || rootUserId  // 有名字就顯示，沒有就顯示 ID
        };
    }
  

    for (const userDoc of allUsers.docs) {
        const targetId = userDoc.id;  // 被推荐者 UID
        const recSnap  = await db
          .collection("users")
          .doc(targetId)
          .collection("recommendations")
          .get();
      
        recSnap.forEach(recDoc => {
          const recData = recDoc.data();
          // 1) 先尝试用邮箱映射到已注册用户 UID
          const recommenderId = emailToId[recData.email];
          // 2) fallback：如果没找到，就用 recData.invitedBy（pendingUsers 写入时的 invitedBy）
          const fromId = recommenderId || recData.invitedBy;
      
          // —— 建立「推荐人」节点 —— 
          if (!nodesMap[fromId]) {
            nodesMap[fromId] = {
              id:    fromId,
              label: userMap[fromId]     // 已注册用户的真实姓名
                    || recData.name      // 或者推荐人填写的 name
                    || fromId
            };
          }
      
          // —— 确保「被推荐者」节点存在 —— 
          if (!nodesMap[targetId]) {
            nodesMap[targetId] = {
              id:    targetId,
              label: userMap[targetId] || targetId
            };
          }
      
          // —— 建立「推荐人 → 被推荐者」连线 —— 
          if (fromId && fromId !== targetId) {
            links.push({ from: fromId, to: targetId });
          }
        });
      }      

    // 4️⃣ 取出起點可達子樹
    const queue = [];
    const seen = new Set();
    if (rootUserId && nodesMap[rootUserId]) {
      queue.push(rootUserId);
      seen.add(rootUserId);
    } else {
      // 若未指定或找不到 root，預設全部
      Object.keys(nodesMap).forEach(id => {
        queue.push(id);
        seen.add(id);
      });
    }
    const subtreeNodes = {};
    const subtreeLinks = [];

    while (queue.length) {
        const current = queue.shift();
        subtreeNodes[current] = nodesMap[current];
        links.forEach(link => {
    // 1) 如果 current 指向別人（往下）
        if (link.from === current && !seen.has(link.to)) {
           subtreeLinks.push(link);
           seen.add(link.to);
           queue.push(link.to);
         }
    // 2) 如果別人指向 current（往上）
        if (link.to === current && !seen.has(link.from)) {
           subtreeLinks.push(link);
           seen.add(link.from);
           queue.push(link.from);
        }
      });
    }

    console.log("🔹 userMap:", userMap);
    console.log("🔹 nodesMap keys:", Object.keys(nodesMap));
    console.log("🔹 all links:", links);
    console.log("🔹 subtreeLinks:", subtreeLinks);

    // 5️⃣ 最後繪製
    drawNetwork(Object.values(subtreeNodes), subtreeLinks);
  } catch (err) {
    console.error("Error loading network:", err);
    container.innerText = "Failed to load network.";
  }
});

function drawNetwork(nodes, edges) {
  const container = document.getElementById("networkContainer");
  const data = {
    nodes: new vis.DataSet(nodes),
    edges: new vis.DataSet(edges)
  };
  const options = {
    layout: { hierarchical: { direction: "UD", sortMethod: "directed" } },
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