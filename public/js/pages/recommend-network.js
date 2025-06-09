// public/js/pages/recommend-network.js
console.log("recommend-network.js 啟動");

/**
 * 【輔助函式】繪製網絡圖
 * @param {Array} nodes - 節點陣列
 * @param {Array} edges - 連線陣列
 */
function drawNetwork(nodes, edges) {
  const container = document.getElementById("networkContainer");
  const data = {
    nodes: new vis.DataSet(nodes),
    edges: new vis.DataSet(edges)
  };
  const options = {
    layout: {
      hierarchical: {
        direction: "UD", // 由上到下
        sortMethod: "directed",
        shakeTowards: "roots"
      }
    },
    physics: {
        enabled: false // 關閉物理模擬，讓佈局更穩定
    },
    nodes: {
      shape: "dot",
      size: 20,
      font: {
        size: 14,
        color: "#333"
      },
      borderWidth: 2,
    },
    edges: {
      arrows: {
        to: { enabled: true, scaleFactor: 0.7 }
      },
      color: {
        color: "#cccccc",
        highlight: "#848484",
        hover: "#848484",
      },
      smooth: true
    },
    interaction: {
        hover: true,
        dragNodes: true,
        zoomView: true,
        dragView: true
    }
  };
  new vis.Network(container, data, options);
}

/**
 * 【輔助函式】逐層抓取網絡資料
 * @param {firebase.firestore.Firestore} db - Firestore 實例
 * @param {string} startUserId - 起始使用者的 ID
 * @param {number} maxDepth - 最大抓取深度
 * @returns {Promise<{nodes: Array, links: Array}>} - 包含節點和連線的物件
 */
async function fetchNetworkData(db, startUserId, maxDepth = 3) {
  const nodesMap = new Map();
  const linksSet = new Set();
  
  let userIdsToProcess = new Set([startUserId]);
  const processedUserIds = new Set();

  for (let depth = 0; depth < maxDepth && userIdsToProcess.size > 0; depth++) {
    console.log(`[網絡抓取] 正在處理第 ${depth + 1} 層，包含 ${userIdsToProcess.size} 個使用者...`);
    
    const currentUserIds = Array.from(userIdsToProcess);
    userIdsToProcess.clear();
    currentUserIds.forEach(id => processedUserIds.add(id));
    
    // 建立當前層級所有用戶的查詢 Promise
    const promises = currentUserIds.flatMap(userId => [
      // 1. 獲取用戶基本資料
      db.collection("users").doc(userId).get(),
      // 2. 查詢誰推薦了他 (收到的、已驗證的推薦)
      db.collection("users").doc(userId).collection("recommendations").where("status", "==", "verified").get(),
      // 3. 查詢他推薦了誰 (送出的、已驗證的推薦)
      db.collection("outgoingRecommendations").where("recommenderUserId", "==", userId).where("status", "==", "delivered_and_verified").get()
    ]);

    const results = await Promise.all(promises);
    const nextLevelUserIds = new Set();

    // 處理查詢結果，每 3 個一組
    for (let i = 0; i < currentUserIds.length; i++) {
        const userId = currentUserIds[i];
        const userDocResult = results[i * 3];
        const incomingRecsResult = results[i * 3 + 1];
        const outgoingRecsResult = results[i * 3 + 2];

        // 處理用戶節點
        if (userDocResult.exists) {
            const userData = userDocResult.data();
            if (!nodesMap.has(userId)) {
                nodesMap.set(userId, {
                    id: userId,
                    label: userData.name || `User...${userId.substring(24)}`,
                    shape: userId === startUserId ? "star" : "dot",
                    color: userId === startUserId ? "#ffc107" : "#97c2fc",
                    value: 20 // 根節點較大
                });
            }
        }
        
        // 處理收到的推薦 (建立 recommender -> user 的連結)
        if (!incomingRecsResult.empty) {
            incomingRecsResult.forEach(doc => {
                const recommenderId = doc.data().recommenderId;
                if (recommenderId && recommenderId !== userId) {
                    const linkKey = `${recommenderId}-${userId}`;
                    if (!linksSet.has(linkKey)) {
                        linksSet.add(linkKey);
                        if (!processedUserIds.has(recommenderId)) {
                            nextLevelUserIds.add(recommenderId);
                        }
                    }
                }
            });
        }
        
        // 處理送出的推薦 (建立 user -> target 的連結)
        if (!outgoingRecsResult.empty) {
            outgoingRecsResult.forEach(doc => {
                const targetUserId = doc.data().targetUserId;
                if (targetUserId && targetUserId !== userId) {
                    const linkKey = `${userId}-${targetUserId}`;
                    if (!linksSet.has(linkKey)) {
                        linksSet.add(linkKey);
                        if (!processedUserIds.has(targetUserId)) {
                            nextLevelUserIds.add(targetUserId);
                        }
                    }
                }
            });
        }
    }
    
    // 更新下一輪要處理的 user IDs
    nextLevelUserIds.forEach(id => userIdsToProcess.add(id));
  }
  
  const links = Array.from(linksSet).map(key => {
    const [from, to] = key.split('-');
    return { from, to };
  });

  return { nodes: Array.from(nodesMap.values()), links };
}


// ===================================================================
// 主要執行區塊：當 DOM 載入完成後觸發
// ===================================================================
window.addEventListener("DOMContentLoaded", async () => {
    console.log("🚀 [v2] 開始初始化推薦網絡");
    const container = document.getElementById("networkContainer");

    try {
        const loadingMessage = document.createElement("div");
        loadingMessage.className = "loading-message";
        loadingMessage.innerText = "正在建立您的推薦網絡圖...";
        container.innerHTML = "";
        container.appendChild(loadingMessage);

        // 1. 連接 Firebase
        if (typeof firebase === 'undefined' || firebase.apps.length === 0) {
            throw new Error("Firebase 服務尚未準備就緒。");
        }
        const db = firebase.firestore();
        console.log("✅ Firebase 已連接");

        // 2. 獲取網絡的根使用者 ID
        const params = new URLSearchParams(window.location.search);
        const rootUserId = params.get("userId");
        if (!rootUserId) {
            throw new Error("缺少必要參數：userId");
        }

        // 3. 逐層抓取網絡資料
        const { nodes, links } = await fetchNetworkData(db, rootUserId, 3); // 預設抓取 3 層深度

        // 4. 繪製網絡圖
        if (nodes.length <= 1 && links.length === 0) { // 修改判斷條件，如果只有自己一個節點也算無網絡
            container.innerText = "找不到與此使用者相關的已驗證推薦網絡。";
        } else {
            console.log(`✅ 資料抓取完成，準備繪製 ${nodes.length} 個節點和 ${links.length} 條連線。`);
            drawNetwork(nodes, links);
        }

    } catch (err) {
        console.error("❌ 載入推薦網絡失敗:", err);
        container.innerText = `載入失敗: ${err.message}`;
        container.style.color = 'red';
    }
});