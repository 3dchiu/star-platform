// functions/index.js
const functions = require("firebase-functions");
const { GoogleSpreadsheet } = require("google-spreadsheet");
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json"); // ⬅️ 你下載的 JSON 金鑰

admin.initializeApp();

// Google Sheet ID
const SHEET_ID = "1xC_XlhNTWb-wp9FSjzHaA1O8nBSSyWwi7zfnXrjI9oU";

// Cloud Function：接收推薦資料並寫入 Sheet
exports.submitRecommendationToSheet = functions.https.onRequest(async (req, res) => {
    // ✅ 新增：處理 CORS 預檢請求（OPTIONS）
    if (req.method === "OPTIONS") {
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Access-Control-Allow-Methods", "POST");
      res.set("Access-Control-Allow-Headers", "Content-Type");
      res.status(204).send("");
      return;
    }
  
    // ✅ 實際 POST 請求也加上 CORS header
    res.set("Access-Control-Allow-Origin", "*");
  
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }  

  try {
    const { userId, jobId, recommender, email, lang } = req.body;

    const doc = new GoogleSpreadsheet(SHEET_ID);
    await doc.useServiceAccountAuth({
      client_email: serviceAccount.client_email,
      private_key: serviceAccount.private_key,
    });

    await doc.loadInfo();
    const sheet = doc.sheetsByTitle["通知清單"];
    if (!sheet) throw new Error("找不到名稱為『通知清單』的工作表");

    await sheet.addRow({
      Timestamp: new Date().toISOString(),
      UserId: userId,
      JobId: jobId,
      Recommender: recommender,
      Email: email,
      Lang: lang,
    });

    res.status(200).send("✅ Sheet 寫入成功");
  } catch (err) {
    console.error("❌ Cloud Function 發生錯誤：", err);
    res.status(500).send("❌ 寫入失敗：" + err.message);
  }
});
const { onDocumentCreated } = require("firebase-functions/v2/firestore");

exports.notifyOnRecommendationCreated = onDocumentCreated("users/{userId}/recommendations/{recId}", async (event) => {
  const snap = event.data;
  const context = event;
  const data = snap.data();
  const { name, email, content, jobId } = data;
  const userId = context.params.userId;

  console.log(`📣 新推薦來自 ${name} (${email})，針對職缺 ${jobId}`);

  // 🚧 下一步將整合 Email 發送（可使用 nodemailer 或呼叫 Webhook 到你指定的通知服務）
  return null;
});

