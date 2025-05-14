// functions/index.js
require("dotenv").config();
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const functions = require("firebase-functions");
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_KEY);
const { GoogleSpreadsheet } = require("google-spreadsheet");
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp();

// ✅ Google Sheet ID
const SHEET_ID = "1xC_XlhNTWb-wp9FSjzHaA1O8nBSSyWwi7zfnXrjI9oU";

// ✅ 寫入推薦資料到 Google Sheet
exports.submitRecommendationToSheet = functions.https.onRequest(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.status(204).send("");
    return;
  }

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

// ✅ 推薦寫入後，自動寄送 2 封信件通知
exports.notifyOnRecommendationCreated = onDocumentCreated("users/{userId}/recommendations/{recId}", async (event) => {
  
    const snap = event.data;
    const data = snap.data();
    const userId = event.params.userId;
    const { name, email, content, jobId } = data;
  
    console.log(`📣 新推薦來自 ${name} (${email})，針對職缺 ${jobId}`);
  
    const userSnap = await admin.firestore().doc(`users/${userId}`).get();
    const user = userSnap.data();
    if (!user || !user.email) {
      console.error("❌ 找不到被推薦者資料");
      return null;
    }
  
    const recommendeeEmail = user.email;
    const recommendeeName = user.name || "Galaxyz 使用者";
  
    try {  
      await sgMail.send({
        to: recommendeeEmail,
        from: {
            email: process.env.SENDER_EMAIL,
            name: process.env.SENDER_NAME          
        },
        subject: `✨ 你收到來自 ${name} 的推薦`,
        text: `${name} 剛剛完成了一份推薦給你。\n\n內容摘要：\n"${content}"\n\n👉 立刻查看：https://galaxyz.ai/pages/recommend-summary.html?userId=${userId}`,
        trackingSettings: {
            clickTracking: { enable: false, enableText: false }
          }
    });
          
      await sgMail.send({
        to: email,
        from: {
            email: process.env.SENDER_EMAIL,
            name: process.env.SENDER_NAME
          },
        subject: `感謝你對 ${recommendeeName} 的推薦 💫`,
        text: `感謝你撰寫推薦！這是一個建立於信任與合作的職涯網絡。\n\n如果你也希望建立自己的推薦頁，歡迎加入 Galaxyz 👉 https://galaxyz.ai`,
        trackingSettings: {
            clickTracking: { enable: false, enableText: false }
          }
    });          
  
      console.log(`✅ 已成功寄出感謝信給推薦人 ${email}`);
    } catch (error) {
      console.error("❌ SendGrid 寄信失敗：", error);
    }
  
    return null;
  });