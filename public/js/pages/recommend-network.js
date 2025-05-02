// public/js/pages/recommend-network.js
import { firebaseConfig } from "../firebase-config.js";
import { i18n } from "../i18n.js";

// 初始化 Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

window.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("networkContainer");
  container.innerText = "Loading...";

  try {
    // 1️⃣ 抓取所有從推薦來的帳號
    const usersSnapshot = await db.collection("users")
      .where("fromRecommendation", "==", true).get();

    const nodes = [];
    const links = [];

    usersSnapshot.forEach(doc => {
      const data = doc.data();
      const id = doc.id;
      const name = data.name || id;
      const invitedBy = data.invitedBy || null;

      nodes.push({ id, label: name });
      if (invitedBy) {
        links.push({ from: invitedBy, to: id });  // vis-network 用 from/to
      }
    });

    drawNetwork(nodes, links);  // ✅ 呼叫渲染

  } catch (err) {
    console.error("Error loading network data:", err);
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
    nodes: {
      shape: "dot",
      size: 16,
      font: { size: 14, color: "#333" },
      borderWidth: 2
    },
    edges: {
      arrows: "to",
      color: { color: "#ccc" },
      smooth: true
    },
    layout: {
      improvedLayout: true
    },
    physics: {
      stabilization: true
    }
  };
  new vis.Network(container, data, options);
}
