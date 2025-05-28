// public/js/pages/entry-summary.js (修改版)
(async () => {
  const params = new URLSearchParams(window.location.search);
  const isPublic = params.get("public") === "true";
  const modulePath = isPublic
    ? "/js/pages/summary-public.js"
    : "/js/pages/recommend-summary.js";
  
  console.log("▶ 動態載入模組：", modulePath);
  console.log("🔍 URL 參數:", Object.fromEntries(params.entries()));
  console.log("🔍 是否為公開模式:", isPublic);
  
  try {
    const module = await import(modulePath);
    console.log("✅ 模組載入成功:", modulePath);
    console.log("🔍 模組內容:", module);
  } catch (e) {
    console.error("❌ 模組載入失敗：", e);
    console.error("❌ 錯誤詳情:", e.message);
    console.error("❌ 錯誤堆疊:", e.stack);
    
    // 顯示錯誤給用戶
    document.getElementById("summaryLoading").style.display = "none";
    const summaryArea = document.getElementById("summaryArea");
    if (summaryArea) {
      summaryArea.innerHTML = `
        <div style="color: red; padding: 20px; border: 1px solid red; margin: 20px;">
          <h3>模組載入失敗</h3>
          <p><strong>路徑:</strong> ${modulePath}</p>
          <p><strong>錯誤:</strong> ${e.message}</p>
          <details>
            <summary>詳細錯誤</summary>
            <pre>${e.stack}</pre>
          </details>
        </div>
      `;
    }
  }
})();