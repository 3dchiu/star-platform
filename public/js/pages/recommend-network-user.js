// public/js/pages/recommend-network-user.js
import { i18n, setLang } from "../i18n.js";
console.log("recommend-network-user.js 啟動");

/**
 * 【輔助函式】繪製網絡圖 (與前一檔案相同)
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
        sortMethod: "directed"
      }
    },
    physics: { enabled: false },
    nodes: {
      shape: "dot",
      size: 16,
      font: { size: 14, color: "#333" },
      borderWidth: 2
    },
    edges: {
      arrows: { to: { enabled: true, scaleFactor: 0.7 } },
      color: { color: "#cccccc" },
      smooth: true
    }
  };
  new vis.Network(container, data, options);
}

// ===================================================================
// 主要執行區塊
// ===================================================================
window.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("networkContainer");
  container.innerHTML = `<div class="loading-message">初始化中...</div>`;

  // 1. 初始化 Firebase 和 i18n
  if (typeof firebase === 'undefined' || firebase.apps.length === 0) {
    container.innerText = "Firebase 服務錯誤，請重新整理頁面。";
    return;
  }
  const auth = firebase.auth();
  const db = firebase.firestore();
  console.log("✅ Firebase 服務已連接");

  const lang = localStorage.getItem("lang") || "en";
  setLang(lang);
  const t = i18n[lang]?.recommendNetworkUser || i18n.en.recommendNetworkUser;

  // 2. 等待使用者登入
  auth.onAuthStateChanged(async user => {
    if (!user) {
      container.innerText = t.pleaseLogin || "請先登入以查看您的推薦網絡";
      return;
    }

    container.innerHTML = `<div class="loading-message">${t.loading || "正在建立您的推薦網絡圖..."}</div>`;
    
    try {
      const myUid = user.uid;
      const nodesMap = new Map();
      const links = [];

      // 3. 【核心修改】一次高效查詢，取得所有「已驗證」的、對「我」的推薦
      console.log(`[NetUser] 正在查詢使用者 ${myUid} 收到的已驗證推薦...`);
      const recsSnap = await db.collection("users").doc(myUid).collection("recommendations")
        .where("status", "==", "verified")
        .get();
      
      console.log(`[NetUser] ✅ 查詢完成，找到 ${recsSnap.size} 筆已驗證推薦。`);

      if (recsSnap.empty) {
        container.innerText = t.noNetwork || "您尚未收到任何已驗證的推薦，快去邀請朋友吧！";
        return;
      }
      
      // 4. 建立節點與連結
      
      // 4a. 建立「我」的節點
      const myName = user.displayName || "Me";
      nodesMap.set(myUid, {
        id: myUid,
        label: `<span class="math-inline">\{myName\}</span>{t.meTag || " (我)"}`,
        color: { background: "#ffc107", border: "#f0b400" }, // 使用更鮮明的顏色
        shape: "star",
        value: 20 // 讓中心節點更大
      });

      // 4b. 遍歷查詢結果，建立「推薦人」節點和「推薦人 -> 我」的連結
      recsSnap.forEach(doc => {
        const rec = doc.data();
        const recommenderId = rec.recommenderId;
        
        // 只處理有 recommenderId 的已驗證推薦 (後端已確保這點)
        if (recommenderId) {
          // 建立推薦人節點 (如果尚不存在)
          if (!nodesMap.has(recommenderId)) {
            nodesMap.set(recommenderId, {
              id: recommender