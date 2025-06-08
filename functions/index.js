// functions/index.js - 完整更新版
require("dotenv").config();
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const functions = require("firebase-functions");
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_KEY);
const admin = require("firebase-admin");

admin.initializeApp();

const VERIFICATION_START_DATE = new Date('2025-06-04T00:00:00Z');

// 🔽 多語系信件內容設定（通知推薦人、歡迎信、推薦他人）
const i18nMessages = {
  // 原有的邀請推薦通知
  notifyRecommendation: {
    zh: {
      subject: (name) => `感謝你對 ${name} 的推薦 💫`,
      text: (recommenderName, recommendeeName) => `Hi ${recommenderName}，

謝謝你為 ${recommendeeName} 寫下這段推薦。
這不只是一封信，而是他職涯裡，一份難得的肯定。

或許你還記得，當時你們一起努力完成的那個專案，
或是在某段低潮時，他對你的支持與合作。

你的這段話，會成為他日後回顧職涯時，一道溫柔的光。

如果你也想讓過去合作過的夥伴，知道你記得他們的好，
也歡迎你為自己建立推薦頁，成為這個互相點亮的星系的一員。

🌟 立即建立推薦頁：https://galaxyz.ai/pages/login.html?register=1

謝謝你，讓信任開始流動。  
Galaxyz 團隊敬上`
    },
    en: {
      subject: (name) => `Thank you for recommending ${name} 💫`,
      text: (recommenderName, recommendeeName) => `Hi ${recommenderName},

Thank you for writing a recommendation for ${recommendeeName}.
This isn't just a message — it's a meaningful part of their career.

You might remember that project you worked on together,
or how they supported you through a challenging time.

Your words will become a warm light they carry as they look back on their journey.

If you'd like to share similar memories with people you've worked with,
you're welcome to create your own recommendation page — and pass the light on.

🌟 Start your own page: https://galaxyz.ai/pages/login.html?register=1

Thank you for helping trust move forward.  
Team Galaxyz`
    }
  },

  // 🆕 新增：推薦他人的通知信件
  outgoingRecommendation: {
    zh: {
      // 給被推薦人的通知
      subjectToRecommendee: (recommenderName) => `🌟 你收到一封來自 ${recommenderName} 的推薦信！`,
      textToRecommendee: (recommenderName, recommendeeName, content, company, position, recommendeeEmail) => `Hi ${recommendeeName}，

你收到一封來自 ${recommenderName} 的推薦信！

**推薦內容預覽：**
「${content.length > 60 ? content.substring(0, 60) + '...' : content}」

${content.length > 60 ? '👆 這只是部分內容，完整推薦還有更多精彩內容！' : ''}

這封來自 ${recommenderName} 的推薦信，是你職涯中的一顆信任星星 ⭐

${recommenderName} 在 ${company} 擔任 ${position} 期間認識了你，現在特別為你寫下這份推薦。

💫 想看完整的推薦內容嗎？點擊下方連結，立即建立你的 Galaxyz 職涯頁！

👉【立即註冊並查看完整推薦】
https://galaxyz.ai/pages/login.html?register=1&email=${encodeURIComponent(recommendeeEmail)}

Galaxyz｜讓每個人因真實與信任被看見。

Galaxyz 團隊敬上`,

      // 給推薦人的確認信
      subjectToRecommender: (recommendeeName) => `✅ 你對 ${recommendeeName} 的推薦已送出`,
      textToRecommender: (recommenderName, recommendeeName, company, position) => `Hi ${recommenderName}，

你對 ${recommendeeName} 的推薦已成功送出！

這份推薦來自你在 ${company} 擔任 ${position} 期間的真實經歷和觀察。

📋 重要說明：
推薦將在對方註冊並核實身份後，正式納入你的推薦記錄。

💡 小提醒：
你可以主動傳訊息提醒對方查收 Email，以確保推薦能順利送達！

感謝你花時間為合作夥伴寫推薦，讓優秀的人才被看見。

🌟 你也可以邀請其他人為你寫推薦：https://galaxyz.ai/pages/login.html?register=1

Galaxyz｜讓每個人因真實與信任被看見。

Galaxyz 團隊敬上`
    },
    en: {
      // 給被推薦人的通知
      subjectToRecommendee: (recommenderName) => `🌟 You received a recommendation from ${recommenderName}!`,
      textToRecommendee: (recommenderName, recommendeeName, content, company, position, recommendeeEmail) => `Hi ${recommendeeName},

You received a recommendation from ${recommenderName}!

**Recommendation Preview:**
"${content.length > 100 ? content.substring(0, 100) + '...' : content}"

${content.length > 100 ? '👆 This is just a preview - there\'s more amazing content in the full recommendation!' : ''}

This recommendation from ${recommenderName} is a star of trust in your career journey ⭐

${recommenderName} got to know you during their time as ${position} at ${company}, and now they've written this special recommendation for you.

💫 Want to read the complete recommendation? Click the link below to create your Galaxyz career page!

👉【Register Now and View Full Recommendation】
https://galaxyz.ai/pages/login.html?register=1&email=${encodeURIComponent(recommendeeEmail)}

Galaxyz | Where everyone is seen through authenticity and trust.

Warmly,
Team Galaxyz`,

      // 給推薦人的確認信
      subjectToRecommender: (recommendeeName) => `✅ Your recommendation for ${recommendeeName} has been sent`,
      textToRecommender: (recommenderName, recommendeeName, company, position) => `Hi ${recommenderName},

Your recommendation for ${recommendeeName} has been successfully sent!

This recommendation comes from your real experience and observations during your time as ${position} at ${company}.

📋 Important Notice:
Your recommendation will be officially recorded after the recipient registers and verifies their identity.

💡 Pro Tip:
You can proactively message them to remind them to check their email and ensure your recommendation reaches them!

Thank you for taking the time to recommend your colleague and help great talent get recognized.

🌟 You can also invite others to write recommendations for you: https://galaxyz.ai/pages/login.html?register=1

Galaxyz | Where everyone is seen through authenticity and trust.

Warmly,
Team Galaxyz`
    }
  },

  welcomeEmail: {
    zh: {
      subject: "歡迎加入 Galaxyz！🌟",
      text: (name) => `嗨 ${name || "朋友"}，

歡迎加入 Galaxyz！

在這個履歷可以被 AI 生成的時代，
我們更想留下的，是那些無法被取代的瞬間 ——
🌟在你剛進公司時，願意牽著你跑的學長姐；
🌟在你犯錯時，沒責備你反而幫你擋下火線的主管；
🌟總是默默補位、不爭功的團隊夥伴；
🌟雖然只合作三個月，但始終記得你努力的客戶；
🌟還有那位，幾年前短暫合作過，但你至今仍記得他有多可靠。

如果你願意，現在就寫下一句你對他的感謝吧。
那句話可能很簡單：「謝謝你，讓我在低潮的時候不孤單。」
但對方收到時，會覺得：「原來我做過的那些事，你都記得。」

這，就是 Galaxyz 想幫你留下的東西。
不是一封浮誇的推薦信，而是一份真誠的職涯回憶。

你可以從這裡開始：
✅ 邀請合作過的夥伴，寫下對你的推薦  
✅ 為那些幫過你的人，主動送上一句「謝謝你」  
✅ 建立屬於你的職涯信任網絡，累積那些最真實的價值

我們相信：
履歷會過時，但信任不會。  
你值得被記得，也值得被推薦。

🌟 立即開始：https://galaxyz.ai/pages/login.html?register=1

Galaxyz 團隊敬上`
    },
    en: {
      subject: "Welcome to Galaxyz! 🌟",
      text: (name) => `Hi ${name || "there"},

Welcome to Galaxyz!

In this era where résumés can be generated by AI,
what we truly want to preserve are the irreplaceable moments ——

🌟 The senior colleague who guided you when you first joined the company;  
🌟 The manager who had your back when you made a mistake;  
🌟 The teammate who quietly stepped up without seeking credit;  
🌟 The client who only worked with you for three months, but never forgot your efforts;  
🌟 And that person — the one you collaborated with years ago, and still remember for their reliability.

If you're willing, take a moment to write a simple thank-you to them now.  
It could be something as short as: "Thank you for being there when I was struggling."  
But when they receive it, they'll feel: "So you remembered what I did."

That's what Galaxyz is here for —  
Not to create flashy recommendation letters,  
but to preserve genuine career memories.

You can start from here:
✅ Invite people you've worked with to write a recommendation for you  
✅ Send a message of appreciation to those who've helped you  
✅ Build your own trust-based career network, filled with real value

We believe:
Résumés will fade, but trust will last.  
You deserve to be remembered — and recommended.

🌟 Get Started: https://galaxyz.ai/pages/login.html?register=1

Warmly,  
The Galaxyz Team`
    }
  },

// 在 i18nMessages 中添加（約在第 60 行後）
replyRecommendation: {
  zh: {
    // 回覆推薦給已註冊用戶
    subjectToRecipient: (replierName) => `🎉 ${replierName} 回覆了你的推薦！`,
    textToRecipient: (replierName, recipientName, content, originalContent) => `Hi ${recipientName}，

太棒了！${replierName} 剛剛回覆了你的推薦，並為你寫了一份新的推薦：

**${replierName} 對你的推薦：**
「${content}」

這是你們之間職場善意的美好循環 ✨

**回顧：你對 ${replierName} 的推薦**
「${originalContent ? originalContent.substring(0, 150) + (originalContent.length > 150 ? '...' : '') : '你之前的推薦內容'}」

感謝你們創造了這個互相推薦的正向循環！

👉 查看完整推薦：https://galaxyz.ai/pages/profile-dashboard.html

Galaxyz｜讓職場善意持續傳遞

Galaxyz 團隊敬上`,

    // 回覆推薦給未註冊用戶
    subjectToUnregistered: (replierName) => `💫 ${replierName} 推薦了你！`,
    textToUnregistered: (replierName, recipientName, content, recipientEmail) => `Hi ${recipientName}，

你收到一份來自 ${replierName} 的推薦！

**${replierName} 對你的推薦：**
「${content}」

這份推薦是 ${replierName} 對你工作能力的真實認可 ⭐

💡 有趣的是：這是因為你之前推薦了 ${replierName}，現在 ${replierName} 回覆推薦給你！
這就是職場善意的美好循環。

💫 立即註冊查看完整推薦，並開始建立你的職涯推薦檔案：

👉【立即註冊並查看推薦】
https://galaxyz.ai/pages/login.html?register=1&email=${encodeURIComponent(recipientEmail)}

Galaxyz｜讓每個人因真實與信任被看見

Galaxyz 團隊敬上`,

    // 確認信給回覆者
    subjectToReplier: (recipientName) => `✅ 你對 ${recipientName} 的回覆推薦已送出`,
    textToReplier: (replierName, recipientName, isRegistered) => `Hi ${replierName}，

你對 ${recipientName} 的回覆推薦已成功送出！

${isRegistered ? 
  `✅ ${recipientName} 已註冊，推薦已立即送達並計入你的推薦記錄。` : 
  `📧 ${recipientName} 尚未註冊，我們已發送邀請 email。推薦將在對方註冊後正式計入。`
}

這就是職場善意的美好循環 — 從收到推薦，到回覆推薦，互相認可彼此的專業價值。

💡 小提醒：你可以主動聯絡 ${recipientName}，提醒查收推薦邀請！

感謝你讓信任在職場中持續流動。

🌟 繼續推薦其他優秀夥伴：https://galaxyz.ai/pages/profile-dashboard.html

Galaxyz｜讓職場善意持續傳遞

Galaxyz 團隊敬上`
  },
  en: {
    // 英文版本
    subjectToRecipient: (replierName) => `🎉 ${replierName} replied to your recommendation!`,
    textToRecipient: (replierName, recipientName, content, originalContent) => `Hi ${recipientName},

Great news! ${replierName} just replied to your recommendation and wrote a new one for you:

**${replierName}'s recommendation for you:**
"${content}"

This is a beautiful cycle of professional goodwill between you two ✨

**Recap: Your recommendation for ${replierName}**
"${originalContent ? originalContent.substring(0, 150) + (originalContent.length > 150 ? '...' : '') : 'Your previous recommendation'}"

Thank you for creating this positive cycle of mutual recommendations!

👉 View full recommendation: https://galaxyz.ai/pages/profile-dashboard.html

Galaxyz | Where professional goodwill flows

Warmly,
Team Galaxyz`,

    subjectToUnregistered: (replierName) => `💫 ${replierName} recommended you!`,
    textToUnregistered: (replierName, recipientName, content, recipientEmail) => `Hi ${recipientName},

You received a recommendation from ${replierName}!

**${replierName}'s recommendation for you:**
"${content}"

This recommendation is ${replierName}'s genuine recognition of your professional abilities ⭐

💡 Interesting fact: This happened because you previously recommended ${replierName}, and now ${replierName} is recommending you back!
This is the beautiful cycle of professional goodwill.

💫 Register now to view the complete recommendation and start building your career profile:

👉【Register Now and View Recommendation】
https://galaxyz.ai/pages/login.html?register=1&email=${encodeURIComponent(recipientEmail)}

Galaxyz | Where everyone is seen through authenticity and trust

Warmly,
Team Galaxyz`,

    subjectToReplier: (recipientName) => `✅ Your reply recommendation for ${recipientName} has been sent`,
    textToReplier: (replierName, recipientName, isRegistered) => `Hi ${replierName},

Your reply recommendation for ${recipientName} has been successfully sent!

${isRegistered ? 
  `✅ ${recipientName} is registered, so your recommendation was delivered immediately and counted in your records.` : 
  `📧 ${recipientName} hasn't registered yet, so we've sent an invitation email. Your recommendation will be officially counted once they register.`
}

This is the beautiful cycle of professional goodwill — from receiving recommendations to replying with recommendations, mutually recognizing each other's professional value.

💡 Pro tip: You can reach out to ${recipientName} directly to remind them to check their invitation email!

Thank you for keeping trust flowing in the workplace.

🌟 Continue recommending other great colleagues: https://galaxyz.ai/pages/profile-dashboard.html

Galaxyz | Where professional goodwill flows

Warmly,
Team Galaxyz`
  }
}  
};

// 🔽 功能 1：推薦送出後，自動寄出感謝信（給推薦人）與通知信（給被推薦人）
// 📥 監聽路徑：users/{userId}/recommendations/{recId}
// 📤 動作：寄送 2 封信（被推薦人通知、推薦人感謝信）
// 1. 修改 notifyOnRecommendationCreated - 加強排除邏輯
exports.notifyOnRecommendationCreated = onDocumentCreated("users/{userId}/recommendations/{recId}", async (event) => {
  const snap = event.data;
  const data = snap.data();
  const userId = event.params.userId;
  const { name, email, content, jobId, type } = data;

  console.log(`📣 新推薦來自 ${name} (${email})，針對職缺 ${jobId}，類型：${type || "邀請推薦"}`);
  
  // 🔧 強化排除邏輯 - 明確分工
  if (type === "outgoing") {
    console.log(`⏭️ 跳過 outgoing 推薦，由 notifyOnOutgoingRecommendationCreated 處理`);
    return null;
  }
  
  if (type === "reply") {
    console.log(`⏭️ 跳過回覆推薦，由 handleReplyRecommendation 處理`);
    return null;
  }
  
  if (type === "received" && data.verificationType === "immediate") {
    console.log(`⏭️ 跳過立即驗證推薦，已由其他函數處理`);
    return null;
  }
  
  if (type === "received" && data.recommenderUserId && data.targetUserId && data.registeredAt) {
    console.log(`⏭️ 跳過註冊流程創建的推薦，已由其他函數處理`);
    return null;
  }

  if (type === "received" && data.recommenderUserId && data.targetUserId && data.registeredAt) {
    console.log(`⏭️ 跳過註冊流程創建的推薦，已由其他函數處理`);
    return null;
  }

  // 🆕 新增：更全面的排除檢查
  if (data.fromRegistration || data.notificationSent || data.skipNotification) {
    console.log(`⏭️ 跳過註冊流程推薦或已發送通知的推薦: ${event.params.recId}`);
    return null;
  }

  if (data.verificationType === 'delayed' || data.verificationType === 'immediate') {
    console.log(`⏭️ 跳過驗證流程推薦，通知已在其他環節發送`);
    return null;
  }

  if (data.fullyProcessed) {
    console.log(`⏭️ 跳過已完全處理的推薦: ${event.params.recId}`);
    return null;
  }

  // ✅ 只處理邀請推薦 (invite recommendations)
  console.log(`🎯 處理邀請推薦...`);

  // 繼續原有邏輯...
  const userSnap = await admin.firestore().doc(`users/${userId}`).get();
  const user = userSnap.data();
  if (!user || !user.email) {
    console.error("❌ 找不到被推薦者資料");
    return null;
  }

  const recommendeeEmail = user.email;
  const recommendeeName = user.name || "Galaxyz 使用者";
  const lang = data.lang || "zh";

  try {
    // 邀請推薦的郵件發送邏輯...
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

    const subject = i18nMessages.notifyRecommendation[lang].subject(recommendeeName);
    const text = i18nMessages.notifyRecommendation[lang].text(name, recommendeeName);
    
    await sgMail.send({
      to: email,
      from: {
        email: process.env.SENDER_EMAIL,
        name: process.env.SENDER_NAME
      },
      subject,
      text,
      trackingSettings: {
        clickTracking: { enable: false, enableText: false }
      }
    });

    console.log(`✅ 邀請推薦郵件已發送`);

  } catch (error) {
    console.error("❌ 處理邀請推薦失敗：", error);
  }

  return null;
});

// 🆕 推薦他人功能：監聽 outgoingRecommendations 集合的新增
exports.notifyOnOutgoingRecommendationCreated = onDocumentCreated("outgoingRecommendations/{recId}", async (event) => {
  const snap = event.data;
  const data = snap.data();
  const recId = event.params.recId;
  
  console.log(`📣 新的推薦他人記錄：${recId}`);
  console.log(`📋 推薦資料:`, {
    recommenderName: data.name,
    recommendeeEmail: data.recommendeeEmail,
    recommenderUserId: data.recommenderUserId
  });
  
  // 🔧 新增：防重複處理檢查
  if (data.processed || data.processing) {
    console.log(`⏭️ 推薦已處理或正在處理中，跳過: ${recId}`);
    return null;
  }
  
  // 🔧 新增：原子性鎖定
  try {
    await snap.ref.update({
      processing: true,
      processingStartedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.log(`⏭️ 無法獲得處理權，可能已被其他函數處理: ${recId}`);
    return null;
  }

  try {
    // 在第 295 行左右（防重複處理檢查之後）添加
    console.log(`🔍 執行原子性重複檢查...`);

// 🆕 使用 Transaction 確保原子性
const duplicateCheck = await admin.firestore().runTransaction(async (transaction) => {
  // 檢查已完成和處理中的推薦
  const existingSnap = await transaction.get(
    admin.firestore()
      .collection("outgoingRecommendations")
      .where("recommenderUserId", "==", data.recommenderUserId)
      .where("recommendeeEmail", "==", data.recommendeeEmail.toLowerCase())
      .where("recommenderJobId", "==", data.recommenderJobId)
      .where("status", "in", ["delivered_and_verified", "delivered_but_failed", "pending_registration"])
      .limit(1)
  );

  if (!existingSnap.empty) {
    return { isDuplicate: true, existing: existingSnap.docs[0] };
  }

  // 檢查正在處理中的記錄
  const processingSnap = await transaction.get(
    admin.firestore()
      .collection("outgoingRecommendations")
      .where("recommenderUserId", "==", data.recommenderUserId)
      .where("recommendeeEmail", "==", data.recommendeeEmail.toLowerCase())
      .where("recommenderJobId", "==", data.recommenderJobId)
      .where("processing", "==", true)
      .limit(1)
  );

  if (!processingSnap.empty) {
    return { isDuplicate: true, existing: processingSnap.docs[0] };
  }

  // 標記當前記錄為處理中
  transaction.update(snap.ref, {
    processing: true,
    processingStartedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return { isDuplicate: false };
});

if (duplicateCheck.isDuplicate) {
  console.log(`⚠️ 發現重複推薦，標記並停止處理`);
  
  await snap.ref.update({
    status: "duplicate_recommendation",
    duplicateOf: duplicateCheck.existing.id,
    processedAt: admin.firestore.FieldValue.serverTimestamp(),
    processed: true,
    processing: false
  });

  return null;
}

console.log(`✅ 原子性檢查通過，繼續處理...`);
    // 🔍 查找被推薦人是否已註冊
    const usersQuery = await admin.firestore()
      .collection("users")
      .where("email", "==", data.recommendeeEmail.toLowerCase())
      .limit(1)
      .get();

    if (!usersQuery.empty) {
      // ✅ 被推薦人已註冊：立即驗證流程
      const targetUserId = usersQuery.docs[0].id;
      const targetUserData = usersQuery.docs[0].data();
      
      console.log(`✅ 被推薦人已註冊: ${targetUserId}`);
      console.log(`🚀 開始立即驗證流程...`);
      
      // 📝 準備推薦記錄數據
      const recommendationData = {
        name: data.name,
        email: data.email || "推薦人郵箱",
        content: data.content,
        highlights: data.highlights || [],
        relation: data.relation,
        type: "received",
        jobId: data.recommenderJobId,
        recommendeeName: data.recommendeeName,
        recommendeeEmail: data.recommendeeEmail,
        recommenderUserId: data.recommenderUserId,
        recommenderJobId: data.recommenderJobId,
        recommenderCompany: data.recommenderCompany,
        recommenderPosition: data.recommenderPosition,
        targetUserId: targetUserId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lang: data.lang || "zh"
      };

      // 🔥 立即驗證推薦
      console.log(`🔍 執行立即驗證...`);
      const verificationResult = await validateRecommendationImmediately(recommendationData, targetUserData);
      
      console.log(`📊 驗證結果:`, {
        status: verificationResult.status,
        confidence: verificationResult.confidence,
        reason: verificationResult.reason
      });

      // 📝 根據驗證結果設定推薦記錄
      let finalRecommendationData;
      // 🔽🔽🔽 新增對 duplicate_skipped 的處理 🔽🔽🔽
      if (verificationResult.status === 'duplicate_skipped') {
        console.log(`⏭️ 推薦被標記為重複，不創建新記錄，僅更新 outgoing 狀態`);
        await snap.ref.update({
          targetUserId: targetUserId,
          status: "duplicate_recommendation",
          duplicateOf: verificationResult.duplicateOf,
          processed: true,
          processing: false,
          processedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return null; // 直接結束函數
      }

      if (verificationResult.status === 'verified') {
  // ✅ 驗證通過
  console.log(`✅ 立即驗證通過! 信心度: ${verificationResult.confidence.toFixed(2)}`);
  
  finalRecommendationData = {
    ...recommendationData,
    status: 'verified',
    verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
    matchedJobId: verificationResult.matchedJobId,
    matchedCompany: verificationResult.matchedCompany,
    confidence: verificationResult.confidence,
    verificationType: 'immediate',
    recommenderId: data.recommenderUserId,
    recommenderRegistered: true,
    confirmedAt: admin.firestore.FieldValue.serverTimestamp(),
    jobId: verificationResult.matchedJobId,
    recommenderJobId: data.recommenderJobId,
    sourceJobId: data.recommenderJobId,
    
    // 🆕 新增：防止重複處理的標記
    statsUpdated: true,                    // 統計已更新
    notificationSent: true,                // 通知已發送  
    skipWorkExperienceValidation: true,    // 跳過工作經歷驗證
    fromRegistration: true,                // 來自註冊流程
    canReply: true,                          // <== 新增
    hasReplied: false,                       // <== 新增
    fullyProcessed: true                   // 完全處理完成
  };
        
      } else {
  // ❌ 驗證失敗
  console.log(`❌ 立即驗證失敗: ${verificationResult.reason}`);
  
  finalRecommendationData = {
    ...recommendationData,
    status: 'verification_failed',
    validationFailedAt: admin.firestore.FieldValue.serverTimestamp(),
    reason: verificationResult.reason,
    confidence: verificationResult.confidence || 0,
    verificationType: 'immediate',
    recommenderId: data.recommenderUserId,
    recommenderRegistered: true,
    confirmedAt: admin.firestore.FieldValue.serverTimestamp(),
    jobId: data.recommenderJobId,
    recommenderJobId: data.recommenderJobId,
    sourceJobId: data.recommenderJobId,
    
    // 🆕 新增：即使驗證失敗也標記處理完成
    notificationSent: true,
    skipWorkExperienceValidation: true,
    fromRegistration: true,
    canReply: true,                          // <== 新增
    hasReplied: false,                       // <== 新增
    fullyProcessed: true
  };
}
      // 🗃️ 創建推薦記錄
      const recRef = admin.firestore()
        .collection("users")
        .doc(targetUserId)
        .collection("recommendations")
        .doc();
      
      await recRef.set(finalRecommendationData);
      console.log(`✅ 推薦記錄已創建: ${recRef.id} (狀態: ${finalRecommendationData.status})`);
      
      // 📊 只有驗證通過才更新統計
      if (verificationResult.status === 'verified') {
        console.log(`📊 更新統計中...`);
        
        await updateRecommenderStats(data.recommenderUserId, 1, data.recommenderJobId, {
          recommendationId: recRef.id,
          recommendeeName: data.recommendeeName,
          recommendeeEmail: data.recommendeeEmail,
          content: data.content,
          relation: data.relation,
          highlights: data.highlights,
          targetUserId: targetUserId
        });
        console.log(`✅ 推薦人統計已更新: ${data.recommenderUserId}`);
        
        await updateRecipientStats(targetUserId, 1);
        console.log(`✅ 被推薦人統計已更新: ${targetUserId}`);
        
        if (verificationResult.matchedJob) {
          await collectQualityMetricsImmediate(
            recRef.id, 
            recommendationData, 
            verificationResult.confidence,
            await getRecommenderJobData(data.recommenderUserId, data.recommenderJobId),
            verificationResult.matchedJob
          );
          console.log(`📊 品質數據已收集`);
        }
      } else {
        console.log(`⏭️ 驗證失敗，跳過統計更新`);
      }
      
      // 🆕 更新 outgoingRecommendations 狀態
      const outgoingStatus = verificationResult.status === 'verified' ? 'delivered_and_verified' : 'delivered_but_failed';
      
      await snap.ref.update({
        targetUserId: targetUserId,
        recommendationId: recRef.id,
        status: outgoingStatus,
        deliveredAt: admin.firestore.FieldValue.serverTimestamp(),
        verificationStatus: verificationResult.status,
        confidence: verificationResult.confidence || 0
      });
      
      console.log(`✅ outgoingRecommendations 狀態已更新: ${outgoingStatus}`);

    } else {
      // ❌ 被推薦人未註冊：創建 pendingUser 記錄
      console.log(`📝 被推薦人未註冊，創建 pending 記錄`);
      
      const pendingData = {
        email: data.recommendeeEmail.toLowerCase(),
        type: "recommendation_invitee",
        recommendationId: recId,
        targetUserId: `pending_${Date.now()}`,
        jobId: data.recommenderJobId,
        recommendationData: {
          name: data.name,
          email: data.email || "推薦人郵箱",
          content: data.content,
          highlights: data.highlights || [],
          relation: data.relation,
          type: "received", 
          status: "pending",
          jobId: data.recommenderJobId,
          recommendeeName: data.recommendeeName,
          recommendeeEmail: data.recommendeeEmail,
          recommenderUserId: data.recommenderUserId,
          recommenderJobId: data.recommenderJobId,
          recommenderCompany: data.recommenderCompany,
          recommenderPosition: data.recommenderPosition,
          lang: data.lang || "zh"
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await admin.firestore().collection("pendingUsers").add(pendingData);
      console.log(`✅ pendingUser 記錄已創建`);
      
      // 🆕 更新 outgoingRecommendations 狀態
      await snap.ref.update({
        status: "pending_registration",
        pendingAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    // 在 sendOutgoingRecommendationEmails 前添加
    if (data.emailNotificationSent || data.notificationSent) {
      console.log(`⏭️ 通知已發送，跳過郵件發送`);
      return null;
    }

    // 🔔 發送郵件通知
    console.log(`📧 準備發送推薦他人郵件...`);
    await sendOutgoingRecommendationEmails(data);
    console.log(`✅ 推薦他人郵件發送完成`);

    // 在 sendOutgoingRecommendationEmails 後添加
    await snap.ref.update({
      emailNotificationSent: true,
      notificationSent: true,
      notificationSentAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // 🔧 新增：處理完成，清除標記
    await snap.ref.update({
      processed: true,
      processing: false,
      processedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`🎉 推薦他人處理完成: ${recId}`);

  } catch (error) {
  console.error(`❌ 處理推薦他人記錄失敗: ${recId}`, error);
  
  // 🔧 只保留一次錯誤處理，加上錯誤分類
  try {
    let errorType = "unknown_error";
    if (error.code === 'permission-denied') errorType = "permission_error";
    else if (error.code === 'not-found') errorType = "data_not_found";
    else if (error.message?.includes('network')) errorType = "network_error";
    
    await snap.ref.update({
      processing: false,
      processed: false,
      status: "error",
      errorType: errorType,
      errorMessage: error.message,
      errorAt: new Date() // 🔧 也要修正這裡的 FieldValue
    });
  } catch (updateError) {
    console.error("❌ 更新錯誤狀態失敗:", updateError);
  }
}

  return null;
});

// 🆕 發送推薦他人的郵件通知
async function sendOutgoingRecommendationEmails(data) {
  let lang = data.lang || "zh";
  
  // 🔧 語言代碼標準化：zh-Hant, zh-TW 等都對應到 zh
  if (lang.startsWith('zh')) {
    lang = 'zh';
  } else if (lang.startsWith('en')) {
    lang = 'en';
  } else {
    lang = 'zh'; // 預設為中文
  }
  
  console.log(`📧 開始發送推薦他人郵件，原始語言: ${data.lang || 'undefined'}，標準化語言: ${lang}`);
  console.log(`📋 郵件資料:`, {
    recommendeeName: data.recommendeeName,
    recommendeeEmail: data.recommendeeEmail,
    recommenderName: data.name,
    company: data.recommenderCompany,
    position: data.recommenderPosition
  });
  
  // 🔍 檢查翻譯是否存在
  const messages = i18nMessages.outgoingRecommendation[lang];
  if (!messages) {
    console.error(`❌ 找不到語言 ${lang} 的翻譯，使用預設中文翻譯`);
    lang = 'zh';
  }
  
  try {
    // 📤 信件一：通知被推薦人
    console.log(`📤 發送被推薦人通知信件...`);
    const subjectToRecommendee = i18nMessages.outgoingRecommendation[lang].subjectToRecommendee(data.name);
    const textToRecommendee = i18nMessages.outgoingRecommendation[lang].textToRecommendee(
      data.name, 
      data.recommendeeName, 
      data.content, 
      data.recommenderCompany || "未指定公司", 
      data.recommenderPosition || "未指定職位",
      data.recommendeeEmail  // 🆕 新增這個參數
    );
    
    console.log(`📧 被推薦人郵件主旨: ${subjectToRecommendee}`);
    console.log(`📧 被推薦人收件地址: ${data.recommendeeEmail}`);
    
    await sgMail.send({
      to: data.recommendeeEmail,
      from: {
        email: process.env.SENDER_EMAIL,
        name: process.env.SENDER_NAME
      },
      subject: subjectToRecommendee,
      text: textToRecommendee,
      trackingSettings: {
        clickTracking: { enable: false, enableText: false }
      }
    });
    
    console.log(`✅ 被推薦人通知信件已發送: ${data.recommendeeEmail}`);

    // 📤 信件二：確認信給推薦人
    console.log(`📤 發送推薦人確認信件...`);
    const subjectToRecommender = i18nMessages.outgoingRecommendation[lang].subjectToRecommender(data.recommendeeName);
    const textToRecommender = i18nMessages.outgoingRecommendation[lang].textToRecommender(
      data.name, 
      data.recommendeeName, 
      data.recommenderCompany || "未指定公司", 
      data.recommenderPosition || "未指定職位"
    );
    
    // 🔍 取得推薦人的 email
    let recommenderEmail = null;
    
    console.log(`🔍 查找推薦人 email...`);
    console.log(`📋 推薦人資料:`, {
      dataEmail: data.email,
      recommenderUserId: data.recommenderUserId
    });
    
    // 優先使用 data.email
    if (data.email) {
      recommenderEmail = data.email;
      console.log(`✅ 使用 data.email: ${recommenderEmail}`);
    } 
    // 如果沒有，嘗試從推薦人 ID 查找
    else if (data.recommenderUserId) {
      try {
        console.log(`🔍 從用戶集合查找推薦人 email: ${data.recommenderUserId}`);
        const recommenderSnap = await admin.firestore().doc(`users/${data.recommenderUserId}`).get();
        if (recommenderSnap.exists) {
          recommenderEmail = recommenderSnap.data().email;
          console.log(`✅ 從用戶資料取得 email: ${recommenderEmail}`);
        } else {
          console.warn(`⚠️ 找不到推薦人用戶資料: ${data.recommenderUserId}`);
        }
      } catch (error) {
        console.warn("⚠️ 查找推薦人 email 失敗:", error);
      }
    }

    if (recommenderEmail) {
      console.log(`📧 推薦人郵件主旨: ${subjectToRecommender}`);
      console.log(`📧 推薦人收件地址: ${recommenderEmail}`);
      
      await sgMail.send({
        to: recommenderEmail,
        from: {
          email: process.env.SENDER_EMAIL,
          name: process.env.SENDER_NAME
        },
        subject: subjectToRecommender,
        text: textToRecommender,
        trackingSettings: {
          clickTracking: { enable: false, enableText: false }
        }
      });
      
      console.log(`✅ 推薦人確認信件已發送: ${recommenderEmail}`);
      console.log(`🎉 推薦他人郵件全部發送完成！`);
    } else {
      console.warn("⚠️ 找不到推薦人 email，僅發送給被推薦人");
      console.log(`✅ 被推薦人通知信件發送完成（推薦人信件略過）`);
    }
    
  } catch (error) {
    console.error("❌ 發送推薦他人郵件失敗:", error);
    console.error("❌ 詳細錯誤:", {
      message: error.message,
      code: error.code,
      response: error.response?.body
    });
    throw error;
  }
}

// 🔽 功能 4：新推薦建立時，若 email 對應已有註冊使用者，補上 recommenderId
exports.assignRecommenderIdOnRecCreated = onDocumentCreated(
  "users/{userId}/recommendations/{recId}",
  async (event) => {
    const recRef = event.data.ref;
    const rec = event.data.data();
    const userId = event.params.userId;
    const recId = event.params.recId;

    // 檢查推薦創建時間，決定是否需要驗證
    // 🔧 修正：優先識別遷移資料
const recommendationDate = rec.createdAt?.toDate();
const confirmedDate = rec.confirmedAt?.toDate();
const migrationDate = rec.migrationDate?.toDate();

let checkDate;
let isLegacyByMigration = false;

if (migrationDate && rec.migrationVersion) {
  // 🎯 關鍵：有 migrationDate 的一定是舊資料
  checkDate = migrationDate;
  isLegacyByMigration = true;
  console.log(`📦 發現遷移資料: ${recId}，遷移時間: ${migrationDate.toISOString()}`);
} else if (confirmedDate) {
  checkDate = confirmedDate;
} else if (recommendationDate) {
  checkDate = recommendationDate;
} else {
  checkDate = new Date();
}

const isLegacyRecommendation = isLegacyByMigration || (checkDate < VERIFICATION_START_DATE);

if (isLegacyRecommendation) {
  console.log(`📦 標記舊推薦為 legacy_protected: ${recId}`);
  
  await recRef.update({
    legacy_protected: true,
    verification_status: 'legacy_protected',
    verified: true,
    // 🆕 補充缺少的關鍵欄位
    status: 'verified',
    confidence: 1.0,
    verificationType: 'legacy_migration',
    verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return null;
}
    
    if (isLegacyRecommendation) {
      // 舊推薦：標記為 legacy_protected，不進行驗證
      console.log(`推薦 ${recId} 為舊推薦，標記為 legacy_protected`);
      
      await recRef.update({
        legacy_protected: true,
        verification_status: 'legacy_protected',
        verified: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return null;
    }

    // 新推薦：進行驗證（保持原有邏輯）
    if (rec.recommenderId) {
      return null;
    }

    const usersSnap = await admin
      .firestore()
      .collection("users")
      .where("email", "==", rec.email)
      .limit(1)
      .get();

    if (usersSnap.empty) {
      console.log(`📝 推薦人 ${rec.email} 尚未註冊，推薦待確認`);
      return null;
    }

    const recommenderUid = usersSnap.docs[0].id;

// 🆕 添加邀請推薦驗證邏輯
if (rec.type === 'invite' || !rec.type) { // 邀請推薦類型
  try {
    console.log(`🔍 開始驗證邀請推薦: ${recId}`);
    
    // 獲取推薦人和被推薦人的工作經歷數據
    const recommenderSnap = await admin.firestore().doc(`users/${recommenderUid}`).get();
    const targetUserSnap = await admin.firestore().doc(`users/${userId}`).get();
    
    if (recommenderSnap.exists && targetUserSnap.exists) {
      const recommenderData = recommenderSnap.data();
      const targetUserData = targetUserSnap.data();
      
      // 使用現有的驗證函數
      const verificationResult = await validateRecommendationImmediately({
        ...rec,
        recommenderUserId: recommenderUid,
        targetUserId: userId
      }, targetUserData);
      
      if (verificationResult.status === 'verified') {
        // ✅ 驗證通過
        await recRef.update({ 
          recommenderId: recommenderUid,
          status: 'verified',
          verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
          matchedJobId: verificationResult.matchedJobId,
          confidence: verificationResult.confidence,
          recommenderRegistered: true,
          canReply: true,       // <== 新增
          hasReplied: false,    // <== 新增
          confirmedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // 更新統計
        await updateRecommenderStats(recommenderUid, 1, rec.jobId);
        await updateRecipientStats(userId, 1);
        
        console.log(`✅ 邀請推薦驗證通過: ${recId}`);
      } else {
        // ❌ 驗證失敗
        await recRef.update({ 
          recommenderId: recommenderUid,
          status: 'verification_failed',
          reason: verificationResult.reason,
          confidence: verificationResult.confidence || 0,
          recommenderRegistered: true,
          canReply: true,       // <== 新增
          hasReplied: false,    // <== 新增
          confirmedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`❌ 邀請推薦驗證失敗: ${recId} - ${verificationResult.reason}`);
      }
    } else {
      // 數據不完整，設為 pending
      await recRef.update({ 
        recommenderId: recommenderUid,
        status: 'pending',
        recommenderRegistered: true,
        confirmedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
  } catch (verificationError) {
    console.error(`❌ 邀請推薦驗證過程出錯: ${recId}`, verificationError);
    
    // 驗證出錯時，設為 pending
    await recRef.update({ 
      recommenderId: recommenderUid,
      status: 'pending',
      recommenderRegistered: true,
      confirmedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
} else {
  // 非邀請推薦，保持原有邏輯
  await recRef.update({ 
    recommenderId: recommenderUid,
    status: 'pending',
    recommenderRegistered: true,
    confirmedAt: admin.firestore.FieldValue.serverTimestamp()
  });
}

    console.log(`✅ 推薦人已註冊: ${recommenderUid}，等待工作經歷驗證後才計入統計`);

    return null;
  }
);

// 🔽 功能 2：推薦人完成註冊後，自動補上 recommenderId
// 📥 監聽路徑：users/{userId}
// 📤 動作：補寫推薦紀錄的 recommenderId、刪除 pendingUser、更新統計
exports.onUserCreated_assignRecommenderId = onDocumentCreated("users/{userId}", async (event) => {
  const snap = event.data;
  const newUser = snap.data();
  const newUserId = event.params.userId;
  const email = newUser?.email;

  console.log(`🧩 新使用者註冊檢測開始`);
  console.log(`→ 使用者 ID: ${newUserId}`);
  console.log(`→ Email: ${email}`);
  console.log(`→ 使用者資料:`, newUser);

  if (!email) {
    console.warn("⚠️ 新使用者缺少 email，略過 recommenderId 配對");
    return;
  }

  console.log(`🧩 新使用者註冊：${email} (${newUserId})`);

  try {
    // 🔍 查找 pendingUsers 中符合 email 的紀錄
    console.log(`🔍 查找 pendingUsers 中的 email: ${email}`);
    const pendingSnap = await admin.firestore()
      .collection("pendingUsers")
      .where("email", "==", email.toLowerCase()) // 🆕 統一轉小寫
      .get();

    console.log(`🔍 找到 ${pendingSnap.size} 筆 pendingUsers 記錄`);

    if (pendingSnap.empty) {
      console.log("🔍 沒有找到對應的 pendingUser 推薦紀錄");
      return;
    }

    console.log(`🔍 找到 ${pendingSnap.size} 筆待確認的推薦記錄`);

    // 🆕 使用 Promise.all 並行處理多筆記錄
    const updatePromises = [];

    for (const pendingDoc of pendingSnap.docs) {
      const pendingData = pendingDoc.data();
      console.log(`📋 處理 pending 記錄:`, {
        id: pendingDoc.id,
        type: pendingData.type,
        email: pendingData.email,
        recommendationId: pendingData.recommendationId
      });

      // 🔥 根據不同類型的 pendingUser 進行不同處理
      if (pendingData.type === "recommendation_invitee") {
        // 推薦他人的情況
        const recommendationId = pendingData.recommendationId;
        
        if (recommendationId && pendingData.recommendationData) {
          console.log(`🎯 處理推薦他人註冊: ${recommendationId}`);
          updatePromises.push(
            processOutgoingRecommendationRegistration(newUserId, recommendationId, pendingData)
          );
        } else {
          console.warn(`⚠️ 推薦他人記錄缺少必要資料:`, pendingData);
        }
      } 
      
      // 在 onUserCreated_assignRecommenderId 函數的 for 迴圈中添加
      else if (pendingData.type === "reply_recommendation") {
      // 回覆推薦的情況
        const replyRecId = pendingData.replyRecommendationId;
  
        if (replyRecId && pendingData.recommendationData) {
          console.log(`🎯 處理回覆推薦註冊: ${replyRecId}`);
          updatePromises.push(
            processReplyRecommendationRegistration(newUserId, replyRecId, pendingData)
          );
        } else {
          console.warn(`⚠️ 回覆推薦記錄缺少必要資料:`, pendingData);
        }
      } else {
        // 原有的邀請推薦邏輯
        const inviteId = pendingData?.inviteId;
        if (inviteId) {
          console.log(`🎯 處理邀請推薦: ${inviteId}`);
          updatePromises.push(
            updateInviteRecommendation(newUserId, inviteId, pendingData)
          );
        }
      }

      // 刪除 pendingUser 記錄
      console.log(`🗑️ 刪除 pendingUser 記錄: ${pendingDoc.id}`);
      updatePromises.push(pendingDoc.ref.delete());
    }

    await Promise.all(updatePromises);
    console.log(`✅ 所有推薦記錄配對完成，共處理 ${pendingSnap.size} 筆`);

  } catch (err) {
    console.error("❌ 自動補 recommenderId 發生錯誤：", err);
    console.error("❌ 錯誤堆疊:", err.stack);
  }

  return;
});

// 🆕 處理推薦他人的註冊確認
async function processOutgoingRecommendationRegistration(newUserId, recommendationId, pendingData) {
  try {
    console.log(`🎯 開始處理推薦他人註冊`);
    console.log(`→ 新用戶 ID: ${newUserId}`);
    console.log(`→ 推薦 ID: ${recommendationId}`);
    console.log(`→ Pending 資料:`, pendingData);
    
    const recommendationData = pendingData.recommendationData;
    
    if (!recommendationData) {
      console.error(`❌ 缺少 recommendationData`);
      return;
    }
    
    // 📝 創建推薦記錄到新註冊使用者的 recommendations 集合
    const recRef = admin.firestore()
      .collection("users")
      .doc(newUserId)
      .collection("recommendations")
      .doc();
    
    const finalRecommendationData = {
      ...recommendationData,
      type: "received",
      recommenderId: null, // 等待後續驗證補上
      targetUserId: newUserId,
      status: 'pending',
      recommenderRegistered: false, // 推薦人可能還沒註冊
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      registeredAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    console.log(`📝 準備寫入推薦記錄:`, finalRecommendationData);
    
    await recRef.set(finalRecommendationData);
    console.log(`✅ 推薦記錄已創建: ${recRef.id}`);
    
    // 🆕 更新原始 outgoingRecommendations 記錄
    try {
      const outgoingRef = admin.firestore().collection("outgoingRecommendations").doc(recommendationId);
      const outgoingSnap = await outgoingRef.get();
      
      if (outgoingSnap.exists()) {
        await outgoingRef.update({
          targetUserId: newUserId,
          recommendationId: recRef.id,
          status: "delivered",
          deliveredAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`✅ outgoingRecommendations 狀態已更新`);
      } else {
        console.warn(`⚠️ 找不到 outgoingRecommendations 記錄: ${recommendationId}`);
      }
    } catch (outgoingError) {
      console.error(`❌ 更新 outgoingRecommendations 失敗:`, outgoingError);
      // 不中斷主流程
    }
    
    // 🔍 嘗試找到推薦人並更新統計
    try {
      const recommenderEmail = recommendationData.email;
      if (recommenderEmail) {
        console.log(`🔍 查找推薦人: ${recommenderEmail}`);
        
        // 查找推薦人是否已註冊
        const recommenderQuery = await admin.firestore()
          .collection("users")
          .where("email", "==", recommenderEmail.toLowerCase())
          .limit(1)
          .get();
        
        if (!recommenderQuery.empty) {
          const recommenderId = recommenderQuery.docs[0].id;
          console.log(`✅ 找到推薦人: ${recommenderId}`);
          
          // 更新推薦記錄的 recommenderId
          await recRef.update({
            recommenderId: recommenderId,
            status: 'pending', // 仍需等待工作經歷驗證
            recommenderRegistered: true,
            confirmedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          
          // 🔧 不在這裡更新統計，等工作經歷驗證通過再更新
          console.log(`✅ 推薦人已關聯，等待工作經歷驗證: ${recommenderId}`);
        } else {
          console.log(`📝 推薦人尚未註冊: ${recommenderEmail}`);
        }
      }
    } catch (recommenderError) {
      console.error(`❌ 處理推薦人統計失敗:`, recommenderError);
      // 不中斷主流程
    }
    
    console.log(`✅ 推薦他人註冊處理完成`);
    
  } catch (error) {
    console.error(`❌ 處理推薦他人註冊失敗:`, error);
    console.error(`❌ 錯誤堆疊:`, error.stack);
  }
}

// 🔄 處理原有的邀請推薦確認
async function updateInviteRecommendation(newUserId, inviteId, pendingData) {
  try {
    // 🔍 從 pendingUser 找出 inviteId，查詢該推薦紀錄
    const recSnap = await admin.firestore()
      .collection(`users/${pendingData.userId}/recommendations`)
      .where("inviteId", "==", inviteId)
      .get();

    console.log(`🕵️‍♀️ 查找到推薦紀錄共 ${recSnap.size} 筆，嘗試補上 recommenderId`);

    for (const recDoc of recSnap.docs) {
      const recData = recDoc.data();
      if (!recData.recommenderId) {
        // ✅ 寫入 recommenderId
        await recDoc.ref.update({ 
          recommenderId: newUserId,
          status: 'pending', // 🔧 改為 pending，等待工作經歷驗證
          recommenderRegistered: true,
          confirmedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`✅ 已補上 recommenderId：${recDoc.id}`);
      }
    }
  } catch (error) {
    console.error(`❌ 更新邀請推薦記錄失敗:`, error);
  }
}

// 🔽 功能 3：新使用者註冊後，自動寄送歡迎信
exports.sendWelcomeEmailOnUserDocCreated = onDocumentCreated("users/{userId}", async (event) => {
  const snap = event.data;
  const user = snap.data();
  const email = user?.email;
  const lang = user?.lang;

  // ✅ 若有 inviteCode，則自動累加使用次數
  const inviteCode = user?.inviteCode;
  if (inviteCode) {
    try {
      const inviteRef = admin.firestore().collection("inviteCodes").doc(inviteCode);
      const inviteSnap = await inviteRef.get();
      if (inviteSnap.exists) {
        const currentCount = inviteSnap.data().usageCount || 0;
        await inviteRef.update({ usageCount: currentCount + 1 });
        console.log(`🔢 邀請碼 ${inviteCode} 使用次數 +1 成功`);
      } else {
        console.warn(`⚠️ 找不到 inviteCode：${inviteCode}`);
      }
    } catch (err) {
      console.error("❌ 累加 inviteCode 使用次數失敗：", err);
    }
  }

  // 🔍 驗證 email 是否存在，再決定是否寄信
  if (!email) {
    console.warn("⚠️ 使用者缺少 email，略過歡迎信");
    return;
  }

  // 🆕 語言標準化處理
  let normalizedLang = lang || "zh";
  if (normalizedLang.startsWith('zh')) {
    normalizedLang = 'zh';
  } else if (normalizedLang.startsWith('en')) {
    normalizedLang = 'en';
  } else {
    normalizedLang = 'zh'; // 預設為中文
  }
  
  console.log(`📧 歡迎信語言標準化: ${lang} → ${normalizedLang}`);
  
  const subject = i18nMessages.welcomeEmail[normalizedLang]?.subject || i18nMessages.welcomeEmail.zh.subject;
  const text = i18nMessages.welcomeEmail[normalizedLang]?.text(user.displayName) || i18nMessages.welcomeEmail.zh.text(user.displayName);
  const msg = {
    to: email,
    from: {
      email: process.env.SENDER_EMAIL,
      name: process.env.SENDER_NAME
    },
    subject,
    text,
    trackingSettings: {
      clickTracking: { enable: false, enableText: false }
    }
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ 歡迎信已寄出給 ${email}`);
  } catch (error) {
    console.error("❌ 寄送歡迎信失敗：", error);
  }

  return;
});

// 🆕 監聽工作經歷更新，觸發推薦驗證
exports.validateRecommendationsOnWorkExperienceUpdate = onDocumentUpdated(
  "users/{userId}",
  async (event) => {
    const beforeData = event.data.before.data();
    const afterData = event.data.after.data();
    const userId = event.params.userId;

    // 檢查是否有工作經歷更新
    const beforeWorkExp = beforeData?.workExperiences || {};
    const afterWorkExp = afterData?.workExperiences || {};

    if (JSON.stringify(beforeWorkExp) === JSON.stringify(afterWorkExp)) {
      return null; // 工作經歷沒變化
    }

    console.log(`🔍 使用者 ${userId} 的工作經歷已更新，開始驗證相關推薦`);

    try {
      // === 原有的推薦驗證邏輯 ===
      const recommendationsSnap = await admin.firestore()
        .collection("users")
        .doc(userId)
        .collection("recommendations")
        .where("status", "in", ["pending", "verification_failed"])
        .get();

      console.log(`📋 找到 ${recommendationsSnap.size} 筆待驗證推薦`);

      // 驗證每個推薦記錄
      const validationPromises = [];
      for (const recDoc of recommendationsSnap.docs) {
        const recData = recDoc.data();
        validationPromises.push(
          validateRecommendationWorkExperience(userId, recDoc.id, recData, afterWorkExp)
        );
      }

      await Promise.all(validationPromises);

      // 🆕 === 新增：檢查待處理的推薦邀請 ===
      console.log(`🔍 檢查待處理的推薦邀請...`);
      await checkPendingInvitations(userId, afterData);

      console.log(`✅ 推薦驗證完成`);

    } catch (error) {
      console.error(`❌ 驗證推薦時發生錯誤:`, error);
    }

    return null;
  }
);

// 🆕 新增函數：檢查並處理待處理的推薦邀請
async function checkPendingInvitations(userId, userData) {
  try {
    console.log(`🔍 查找針對用戶的推薦邀請: ${userId}`);
    
    // 1. 獲取用戶的 email
    const userEmail = userData.email;
    if (!userEmail) {
      console.log(`⚠️ 用戶缺少 email，無法查找邀請`);
      return;
    }

    console.log(`📧 用戶 email: ${userEmail}`);

    // 2. 查找所有 outgoing 類型的推薦邀請
    const invitesSnap = await admin.firestore()
      .collection("invites")
      .where("type", "==", "outgoing")
      .where("status", "in", ["pending", "verification_failed"])
      .get();

    console.log(`🔍 找到 ${invitesSnap.size} 筆待處理的推薦邀請`);

    if (invitesSnap.empty) {
      console.log(`📝 沒有待處理的推薦邀請`);
      return;
    }

    // 3. 檢查是否有 outgoingRecommendations 對應此用戶
    const outgoingSnap = await admin.firestore()
      .collection("outgoingRecommendations")
      .where("recommendeeEmail", "==", userEmail.toLowerCase())
      .where("status", "==", "pending_registration")
      .get();

    console.log(`🔍 找到 ${outgoingSnap.size} 筆針對此 email 的推薦記錄`);

    if (outgoingSnap.empty) {
      console.log(`📝 沒有針對此用戶的推薦記錄`);
      return;
    }

    // 4. 處理每個推薦記錄
    const processPromises = [];
    for (const outgoingDoc of outgoingSnap.docs) {
      const outgoingData = outgoingDoc.data();
      console.log(`🎯 處理推薦記錄: ${outgoingDoc.id}`);
      console.log(`→ 推薦人: ${outgoingData.name}`);
      console.log(`→ 被推薦人: ${outgoingData.recommendeeName}`);
      
      processPromises.push(
        processDelayedRecommendation(userId, outgoingDoc.id, outgoingData, userData)
      );
    }

    await Promise.all(processPromises);
    console.log(`✅ 待處理推薦邀請處理完成`);

  } catch (error) {
    console.error(`❌ 檢查待處理邀請失敗:`, error);
  }
}

// 🆕 處理延遲的推薦記錄
async function processDelayedRecommendation(userId, outgoingRecId, outgoingData, userData) {
  try {
    console.log(`🚀 開始處理延遲推薦: ${outgoingRecId}`);
    
    // 1. 準備推薦記錄數據
    const recommendationData = {
      name: outgoingData.name,
      email: outgoingData.email || "推薦人郵箱",
      content: outgoingData.content,
      highlights: outgoingData.highlights || [],
      relation: outgoingData.relation,
      type: "received",
      jobId: outgoingData.recommenderJobId,
      recommendeeName: outgoingData.recommendeeName,
      recommendeeEmail: outgoingData.recommendeeEmail,
      recommenderUserId: outgoingData.recommenderUserId,
      recommenderJobId: outgoingData.recommenderJobId,
      recommenderCompany: outgoingData.recommenderCompany,
      recommenderPosition: outgoingData.recommenderPosition,
      targetUserId: userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lang: outgoingData.lang || "zh",
      
      // 🆕 新增：防止重複處理的標記
      fromDelayedVerification: true,    // 標記來自延遲驗證
      notificationSent: true,           // 通知已在推薦時發送
      skipNotification: true,           // 跳過重複通知
      skipWorkExperienceValidation: true // 跳過工作經歷驗證
    };

    // 2. 立即驗證推薦
    console.log(`🔍 執行延遲驗證...`);
    const verificationResult = await validateRecommendationImmediately(recommendationData, userData);
    
    console.log(`📊 驗證結果:`, {
      status: verificationResult.status,
      confidence: verificationResult.confidence,
      reason: verificationResult.reason
    });

    // 3. 根據驗證結果設定推薦記錄
    let finalRecommendationData;

    if (verificationResult.status === 'verified') {
      // ✅ 驗證通過
      console.log(`✅ 延遲驗證通過! 信心度: ${verificationResult.confidence.toFixed(2)}`);
      
      finalRecommendationData = {
        ...recommendationData,
        status: 'verified',
        verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
        matchedJobId: verificationResult.matchedJobId,
        matchedCompany: verificationResult.matchedCompany,
        confidence: verificationResult.confidence,
        verificationType: 'delayed',
        recommenderId: outgoingData.recommenderUserId,
        recommenderRegistered: true,
        confirmedAt: admin.firestore.FieldValue.serverTimestamp(),
        jobId: verificationResult.matchedJobId, // 更新為被推薦人的工作ID
        recommenderJobId: outgoingData.recommenderJobId,
        sourceJobId: outgoingData.recommenderJobId,
        canReply: true,       // <== 新增
        hasReplied: false     // <== 新增
      };
      
    } else {
      // ❌ 驗證失敗
      console.log(`❌ 延遲驗證失敗: ${verificationResult.reason}`);
      
      finalRecommendationData = {
        ...recommendationData,
        status: 'verification_failed',
        validationFailedAt: admin.firestore.FieldValue.serverTimestamp(),
        reason: verificationResult.reason,
        confidence: verificationResult.confidence || 0,
        verificationType: 'delayed',
        recommenderId: outgoingData.recommenderUserId,
        recommenderRegistered: true,
        confirmedAt: admin.firestore.FieldValue.serverTimestamp(),
        jobId: outgoingData.recommenderJobId,
        recommenderJobId: outgoingData.recommenderJobId,
        sourceJobId: outgoingData.recommenderJobId,
        canReply: true,       // <== 新增
        hasReplied: false     // <== 新增
      };
    }

    // 4. 創建推薦記錄
    const recRef = admin.firestore()
      .collection("users")
      .doc(userId)
      .collection("recommendations")
      .doc();
    
    await recRef.set(finalRecommendationData);
    console.log(`✅ 推薦記錄已創建: ${recRef.id} (狀態: ${finalRecommendationData.status})`);

    // 5. 只有驗證通過才更新統計
    if (verificationResult.status === 'verified') {
      console.log(`📊 更新統計中...`);
      
      // 更新推薦人統計
      await updateRecommenderStats(outgoingData.recommenderUserId, 1, outgoingData.recommenderJobId, {
        recommendationId: recRef.id,
        recommendeeName: outgoingData.recommendeeName,
        recommendeeEmail: outgoingData.recommendeeEmail,
        content: outgoingData.content,
        relation: outgoingData.relation,
        highlights: outgoingData.highlights,
        targetUserId: userId
      });
      console.log(`✅ 推薦人統計已更新: ${outgoingData.recommenderUserId}`);
      
      // 更新被推薦人統計
      await updateRecipientStats(userId, 1);
      console.log(`✅ 被推薦人統計已更新: ${userId}`);
    } else {
      console.log(`⏭️ 驗證失敗，跳過統計更新`);
    }

    // 6. 更新 outgoingRecommendations 狀態
    const outgoingStatus = verificationResult.status === 'verified' ? 'delivered_and_verified' : 'delivered_but_failed';
    
    await admin.firestore().collection("outgoingRecommendations").doc(outgoingRecId).update({
      targetUserId: userId,
      recommendationId: recRef.id,
      status: outgoingStatus,
      deliveredAt: admin.firestore.FieldValue.serverTimestamp(),
      verificationStatus: verificationResult.status,
      confidence: verificationResult.confidence || 0
    });
    
    console.log(`✅ outgoingRecommendations 狀態已更新: ${outgoingStatus}`);
    console.log(`🎉 延遲推薦處理完成: ${outgoingRecId}`);

  } catch (error) {
    console.error(`❌ 處理延遲推薦失敗: ${outgoingRecId}`, error);
  }
}
// 🆕 驗證單一推薦記錄的工作經歷重疊
async function validateRecommendationWorkExperience(userId, recId, recData, userWorkExperiences) {
  // 🔄 重新驗證失敗記錄
  if (recData.status === 'verification_failed') {
    console.log(`🔄 重新驗證失敗記錄: ${recId} - ${recData.recommenderName} → ${recData.recommendeeName}`);
    
    const recRef = admin.firestore()
      .collection("users")
      .doc(userId)
      .collection("recommendations")
      .doc(recId);
    await recRef.update({
      status: 'pending',
      excludeFromStats: false,
      retryValidation: true,
      retryTimestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    recData.status = 'pending';
    recData.retryValidation = true;
  }
  try {
    console.log(`🔍 驗證推薦記錄: ${recId}`);
    
    // 🆕 新增：全面的排除檢查（插入在這裡）
    if (recData.verificationType === 'immediate') {
      console.log(`⏭️ 跳過立即驗證推薦: ${recId}`);
      return;
    }
    
    if (recData.skipWorkExperienceValidation) {
      console.log(`⏭️ 跳過標記為跳過的推薦: ${recId}`);
      return;
    }

    if (recData.verificationType === 'reply_automatic' || recData.replyRecommendationId) {
      console.log(`⏭️ 跳過回覆推薦的工作經歷驗證: ${recId}`);
    return;
  }
    
    if (recData.fullyProcessed) {
      console.log(`⏭️ 跳過已完全處理的推薦: ${recId}`);
      return;
    }
    
    if (recData.statsUpdated) {
      console.log(`⏭️ 跳過統計已更新的推薦: ${recId}`);
      return;
    }
    
    if (recData.fromRegistration) {
      console.log(`⏭️ 跳過註冊流程的推薦: ${recId}`);
      return;
    }

    // 🆕 檢查是否已有來自同一推薦人「同一工作經歷」的驗證推薦
    const existingRecsSnap = await admin.firestore()
      .collection(`users/${userId}/recommendations`)
      .where('recommenderUserId', '==', recData.recommenderUserId)
      .where('recommenderJobId', '==', recData.recommenderJobId)
      .where('type', '==', 'received')
      .where('status', '==', 'verified')
      .get();

    if (!existingRecsSnap.empty) {
      console.log(`⏭️ 用戶已有來自推薦人 ${recData.recommenderUserId} 在工作 ${recData.recommenderJobId} 的驗證推薦，跳過: ${recId}`);
      
      const recRef = admin.firestore()
        .collection("users")
        .doc(userId)
        .collection("recommendations")
        .doc(recId);
      
      await recRef.update({
        status: 'duplicate_skipped',
        skipReason: 'already_has_verified_recommendation_from_same_job',
        skippedAt: admin.firestore.FieldValue.serverTimestamp(),
        duplicateOf: existingRecsSnap.docs[0].id
      });
      return;
    }

    // 如果沒有推薦人的工作經歷資訊，無法驗證
    if (!recData.recommenderUserId || !recData.recommenderJobId) {
      console.log(`⚠️ 推薦記錄缺少推薦人工作經歷資訊，無法驗證`);
      return;
    }

    // 獲取推薦人的工作經歷詳情
    const recommenderSnap = await admin.firestore()
      .doc(`users/${recData.recommenderUserId}`)
      .get();

    if (!recommenderSnap.exists) {
      console.log(`⚠️ 找不到推薦人資料: ${recData.recommenderUserId}`);
      return;
    }

    const recommenderData = recommenderSnap.data();
    const recommenderWorkExp = recommenderData.workExperiences || {};
    
    // 查找推薦人的特定工作經歷
    let recommenderJob = null;
    if (Array.isArray(recommenderWorkExp)) {
      recommenderJob = recommenderWorkExp.find(job => job.id === recData.recommenderJobId);
    } else {
      recommenderJob = recommenderWorkExp[recData.recommenderJobId];
    }

    if (!recommenderJob) {
      console.log(`⚠️ 找不到推薦人的工作經歷: ${recData.recommenderJobId}`);
      return;
    }

    // 在被推薦人的工作經歷中尋找時間重疊
    let hasTimeOverlap = false;
    let bestMatch = null;
    let confidence = 0;
    
    const userWorkExpArray = Array.isArray(userWorkExperiences) 
      ? userWorkExperiences 
      : Object.values(userWorkExperiences);

    for (const userJob of userWorkExpArray) {
      const validation = checkTimeOverlap(recommenderJob, userJob);
      
      if (validation.hasOverlap && validation.confidence > confidence) {
        hasTimeOverlap = true;
        bestMatch = userJob;
        confidence = validation.confidence;
      }
    }

    // 更新推薦記錄狀態
    const recRef = admin.firestore()
      .collection("users")
      .doc(userId)
      .collection("recommendations")
      .doc(recId);

    if (hasTimeOverlap && confidence >= 0.6) {
       // 2. 🔽🔽🔽 在此處加入新的重複檢查邏輯 🔽🔽🔽
      const duplicateCheckSnap = await admin.firestore()
          .collection(`users/${userId}/recommendations`)
          .where('recommenderUserId', '==', recData.recommenderUserId)
          .where('matchedJobId', '==', bestMatch.id) // <== 核心修改：查詢被推薦人匹配上的工作 ID
          .where('status', '==', 'verified')
          .limit(1)
          .get();
  
      if (!duplicateCheckSnap.empty) {
          console.log(`⏭️ 發現針對同一工作經歷的重複推薦，標記為 duplicate_skipped: ${recId}`);
          await recRef.update({
              status: 'duplicate_skipped',
              skipReason: 'already_verified_for_same_target_job',
              skippedAt: admin.firestore.FieldValue.serverTimestamp(),
              duplicateOf: duplicateCheckSnap.docs[0].id
          });
          return; // 結束函數，不執行後續操作
      }
      // 如果檢查通過，才繼續更新為 verified
      await recRef.update({
      status: 'verified',
      verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      matchedJobId: bestMatch.id || `matched_${Date.now()}`,
      matchedCompany: bestMatch.company,
      confidence: confidence,
      // 🆕 添加回覆相關字段
      canReply: true,
      hasReplied: false
    });

      // 🎯 重點：驗證通過後更新推薦人統計
    if (recData.recommenderUserId) {
     // 🆕 獲取被推薦人基本資料
      const userSnap = await admin.firestore().doc(`users/${userId}`).get();
      const userData = userSnap.exists ? userSnap.data() : {};
  
      await updateRecommenderStats(recData.recommenderUserId, 1, recData.recommenderJobId, {
        recommendationId: recId,  // ✅ 使用正確的 recId
        recommendeeName: userData.name || '使用者',  // ✅ 從用戶資料取得
        recommendeeEmail: userData.email || '',     // ✅ 從用戶資料取得
        content: recData.content,
        relation: recData.relation,
        highlights: recData.highlights,
        targetUserId: userId
      });
      console.log(`📊 推薦人統計已更新: ${recData.recommenderUserId}`);
    }
      // 🆕 收集品質數據（背景作業）
      await collectQualityMetrics(recId, recData, confidence, recommenderJob, bestMatch);

      console.log(`✅ 推薦驗證通過: ${recId} (信心度: ${confidence.toFixed(2)})`);

    } else {
      // ❌ 驗證失敗
      await recRef.update({
        status: 'validation_failed',
        validationFailedAt: admin.firestore.FieldValue.serverTimestamp(),
        reason: 'no_time_overlap',
        confidence: confidence
      });

      console.log(`❌ 推薦驗證失敗: ${recId} - 沒有時間重疊`);
    }

  } catch (error) {
    console.error(`❌ 驗證推薦記錄失敗: ${recId}`, error);
  }
}

// 🆕 檢查時間重疊（簡化版：主要看時間，公司作為加分項）
function checkTimeOverlap(job1, job2) {
  console.log(`🕐 檢查時間重疊 (推廣期寬鬆模式):`, {
    job1: { company: job1.company, start: job1.startDate, end: job1.endDate },
    job2: { company: job2.company, start: job2.startDate, end: job2.endDate }
  });

  const start1 = job1.startDate ? new Date(job1.startDate) : null;
  const end1 = job1.endDate ? new Date(job1.endDate) : new Date();
  const start2 = job2.startDate ? new Date(job2.startDate) : null;
  const end2 = job2.endDate ? new Date(job2.endDate) : new Date();

  if (!start1 || !start2) {
    return { hasOverlap: false, confidence: 0 };
  }

  // 檢查時間重疊
  const hasTimeOverlap = start1 <= end2 && start2 <= end1;
  
  if (!hasTimeOverlap) {
    return { hasOverlap: false, confidence: 0 };
  }

  // 計算基礎信心度（有時間重疊）
  let confidence = 0.6;

  // 公司名稱相似度加分
  if (job1.company && job2.company) {
    const similarity = calculateCompanySimilarity(job1.company, job2.company);
    confidence += similarity * 0.3; // 最多加30%
  }

  // 重疊時間長度加分
  const overlapMonths = calculateOverlapMonths(start1, end1, start2, end2);
  if (overlapMonths >= 12) confidence += 0.1;
  if (overlapMonths >= 6) confidence += 0.05;

  const finalConfidence = Math.min(1.0, confidence);

// 🆕 添加這段詳細日誌
console.log(`📊 推廣期驗證結果:`, {
  重疊時間月數: overlapMonths,
  公司相似度: (job1.company && job2.company) ? 
    calculateCompanySimilarity(job1.company, job2.company).toFixed(2) : '0.00',
  最終信心度: finalConfidence.toFixed(2),
  驗證狀態: finalConfidence >= 0.6 ? '✅ 通過' : '❌ 失敗'
});

  return {
    hasOverlap: true,
    confidence: Math.min(1.0, confidence),
    overlapMonths: overlapMonths
  };
}

// 🔧 修復後的 updateRecommenderStats 函數
async function updateRecommenderStats(recommenderId, increment, jobId = null, recommendationData = null) {
  try {
    console.log(`📊 開始更新推薦人統計: ${recommenderId}, 增量: ${increment}, 工作ID: ${jobId}`);
    
    await admin.firestore().runTransaction(async (transaction) => {
      const userRef = admin.firestore().doc(`users/${recommenderId}`);
      const userDoc = await transaction.get(userRef);
      
      if (!userDoc.exists) {
        console.log(`❌ 找不到推薦人: ${recommenderId}`);
        return;
      }
      
      const userData = userDoc.data();
      
      // 更新全域統計
      const currentTotalGiven = userData.recommendationStats?.totalGiven || 0;
      const newTotalGiven = Math.max(0, currentTotalGiven + increment);
      
      // 更新工作經歷統計
      let workExperiences = userData.workExperiences || [];
      
      if (!Array.isArray(workExperiences)) {
        workExperiences = Object.values(workExperiences);
      }
      
      if (jobId) {
        workExperiences = workExperiences.map(job => {
          if (job.id === jobId) {
            const currentGivenCount = job.givenCount || 0;
            let recommendations = job.recommendations || [];
            
            if (recommendationData && increment > 0) {
              const recommendationRecord = {
                id: recommendationData.recommendationId || `rec_${Date.now()}`,
                type: 'given',
                recommendeeName: recommendationData.recommendeeName || '被推薦人',
                recommendeeEmail: recommendationData.recommendeeEmail || '',
                content: recommendationData.content || '',
                relation: recommendationData.relation || '',
                highlights: recommendationData.highlights || [],
                targetUserId: recommendationData.targetUserId || '',
                status: 'verified',
                createdAt: new Date() // 🔧 修復：使用普通 Date
              };
              
              const existingRec = recommendations.find(
                rec => rec.id === recommendationRecord.id || 
                       (rec.targetUserId === recommendationRecord.targetUserId && 
                        rec.content === recommendationRecord.content)
              );
              
              if (!existingRec) {
                recommendations.push(recommendationRecord);
                console.log(`📝 推薦記錄已添加: ${recommendationRecord.id}`);
              }
            }
            
            return {
              ...job,
              givenCount: Math.max(0, currentGivenCount + increment),
              recommendations: recommendations
            };
          }
          return job;
        });
      }
      
      const updateData = {
        'recommendationStats.totalGiven': newTotalGiven,
        workExperiences: workExperiences
      };
      
      transaction.update(userRef, updateData);
      
      console.log(`✅ 推薦人統計更新完成: ${recommenderId} -> totalGiven: ${newTotalGiven}`);
    });
    
  } catch (error) {
    console.error(`❌ 更新推薦人統計失敗: ${recommenderId}`, error);
    throw error;
  }
}

// 🆕 更新被推薦人統計（在推薦創建時立即執行）
async function updateRecipientStats(userId, increment) {
  try {
    const statsUpdate = {
      'recommendationStats.totalReceived': admin.firestore.FieldValue.increment(increment)
    };
    
    await admin.firestore().doc(`users/${userId}`).update(statsUpdate);
    console.log(`📊 被推薦人統計已更新: ${userId} (+${increment})`);
    
  } catch (error) {
    console.error(`❌ 更新被推薦人統計失敗: ${userId}`, error);
  }
}

// 🆕 收集品質數據（背景作業，不影響用戶體驗）
async function collectQualityMetrics(recId, recData, confidence, recommenderJob, userJob) {
  try {
    // 🆕 安全的 userId 獲取
    const userId = recData.targetUserId || recData.userId || recData.recommendeeUserId || null;
    
    if (!userId) {
      console.warn(`⚠️ 無法確定 userId，跳過品質數據收集: ${recId}`);
      return;
    }
    
    const qualityData = {
      // 基本資訊
      recommendationId: recId,
      userId: userId,
      recommenderId: recData.recommenderUserId || recData.recommenderId,
      
      // 驗證結果
      confidence: confidence,
      verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      
      // 工作經歷匹配
      recommenderCompany: recommenderJob?.company || null,
      userCompany: userJob?.company || null,
      timeOverlapMonths: userJob ? calculateOverlapMonths(
        new Date(recommenderJob.startDate || 0),
        new Date(recommenderJob.endDate || Date.now()),
        new Date(userJob.startDate || 0),
        new Date(userJob.endDate || Date.now())
      ) : 0,
      
      // 推薦內容品質
      contentLength: recData.content?.length || 0,
      hasHighlights: (recData.highlights?.length || 0) > 0,
      relationshipType: recData.relation || 'unknown',
      
      // 元數據
      type: recData.type || 'incoming',
      lang: recData.lang || 'zh'
    };

    // 🆕 過濾掉 undefined 值
    const cleanedData = Object.fromEntries(
      Object.entries(qualityData).filter(([_, value]) => value !== undefined)
    );
    
    // 寫入品質數據庫
    await admin.firestore()
      .collection('qualityMetrics')
      .doc(recId)
      .set(cleanedData);
      
    console.log(`📊 品質數據已收集: ${recId}`);
    
  } catch (error) {
    console.error(`❌ 收集品質數據失敗: ${recId}`, error);
    // 不影響主流程，靜默處理錯誤
  }
}

// 輔助函數
function calculateCompanySimilarity(company1, company2) {
  if (!company1 || !company2) return 0;
  
  const normalize = (str) => str.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]/g, '').trim();
  const norm1 = normalize(company1);
  const norm2 = normalize(company2);
  
  if (norm1 === norm2) return 1.0;
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    return Math.min(norm1.length, norm2.length) / Math.max(norm1.length, norm2.length);
  }
  
  return 0;
}

function calculateOverlapMonths(start1, end1, start2, end2) {
  const overlapStart = new Date(Math.max(start1.getTime(), start2.getTime()));
  const overlapEnd = new Date(Math.min(end1.getTime(), end2.getTime()));
  
  if (overlapStart > overlapEnd) return 0;
  
  return Math.max(0, (overlapEnd.getFullYear() - overlapStart.getFullYear()) * 12 + 
                     (overlapEnd.getMonth() - overlapStart.getMonth()));
}

// 🆕 監聽回覆推薦的創建和處理
// Cloud Functions/index.js

exports.handleReplyRecommendation = onDocumentCreated(
  "users/{userId}/recommendations/{recId}",
  async (event) => {
    const recData = event.data.data();
    const userId = event.params.userId; // 回覆者的 ID
    const recId = event.params.recId;
    
    if (recData.type !== 'reply') {
      return null;
    }
    
    console.log(`💬 處理回覆推薦: ${recId}`);
    
    if (recData.processed || recData.processing) {
      console.log(`⏭️ 回覆推薦已處理或正在處理中，跳過: ${recId}`);
      return null;
    }
    
    try {
      await event.data.ref.update({
        processing: true,
        processingStartedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      console.log(`⏭️ 無法獲得處理權，跳過: ${recId}`);
      return null;
    }
    
    try {
      // 🔽🔽🔽 【核心修改】 🔽🔽🔽
      // 在處理郵件前，先讀取原始推薦的內容
      let originalContent = '';
      if (recData.originalRecommendationId) {
        try {
          // 原始推薦記錄存在於回覆者(userId)的檔案底下
          const originalRecSnap = await admin.firestore()
            .collection("users").doc(userId)
            .collection("recommendations").doc(recData.originalRecommendationId)
            .get();

          if (originalRecSnap.exists) {
            originalContent = originalRecSnap.data().content || '';
            console.log("✅ 成功讀取原始推薦內容。");
          }
          // 同時更新原始推薦的狀態
          await updateOriginalRecommendation(userId, recData.originalRecommendationId, recId);

        } catch (readError) {
          console.error("❌ 讀取原始推薦內容失敗:", readError);
        }
      }

      // 將原始推薦內容加入到 recData 中，傳遞給郵件函數
      const fullRecData = { ...recData, originalContent };
      // 🔼🔼🔼 【核心修改結束】 🔼🔼🔼

      const targetUserId = recData.targetUserId;
      const targetEmail = recData.targetEmail;
      
      if (targetUserId && targetUserId !== 'unregistered') {
        await handleRegisteredUserReply(fullRecData, userId, targetUserId, recId);
      } else if (targetEmail) {
        await handleUnregisteredUserReply(fullRecData, userId, recId);
      }
      
      await event.data.ref.update({
        processed: true,
        processing: false,
        processedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`✅ 回覆推薦處理完成: ${recId}`);
      
    } catch (error) {
      console.error(`❌ 處理回覆推薦失敗: ${recId}`, error);
      
      try {
        await event.data.ref.update({
          processing: false,
          processed: false,
          status: "error",
          errorMessage: error.message,
          errorAt: new Date()
        });
      } catch (updateError) {
        console.error("❌ 清除錯誤狀態失敗:", updateError);
      }
    }
    
    return null;
  }
);

// 🔄 更新原始推薦記錄
async function updateOriginalRecommendation(replierUserId, originalRecId, newRecId) {
  try {
    console.log(`🔄 更新原始推薦記錄: ${originalRecId}`);
    
    const originalRecRef = admin.firestore()
      .collection("users")
      .doc(replierUserId)
      .collection("recommendations")
      .doc(originalRecId);
    
    await originalRecRef.update({
      hasReplied: true,
      replyRecommendationId: newRecId,
      repliedAt: admin.firestore.FieldValue.serverTimestamp(),
      canReply: false  
    });
    
    console.log(`✅ 原始推薦記錄已更新: ${originalRecId}`);
    
  } catch (error) {
    console.error(`❌ 更新原始推薦記錄失敗: ${originalRecId}`, error);
  }
}

// 🎯 處理已註冊用戶的回覆推薦
async function handleRegisteredUserReply(recData, replierUserId, targetUserId, replyRecId) {
  try {
    console.log(`✅ 處理已註冊用戶回覆: ${targetUserId}`);
    
    // 1. 創建推薦記錄到目標用戶的 recommendations
    const targetRecRef = admin.firestore()
      .collection("users")
      .doc(targetUserId)
      .collection("recommendations")
      .doc();
    
    const targetRecData = {
      id: targetRecRef.id,
      name: recData.replierName,
      email: recData.replierEmail,
      content: recData.content,
      highlights: recData.highlights || [],
      relation: recData.relation || 'colleague',
      type: 'received',
      recommenderId: replierUserId,
      replyRecommendationId: replyRecId,
      hasReplied: false,
      jobId: recData.targetJobId || 'default',
      status: 'verified',
      confidence: 1.0,
      verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      verificationType: 'reply_based',
      reason: 'reply_to_existing_recommendation',
      excludeFromStats: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lang: recData.lang || 'zh'
    };
    
    await targetRecRef.set(targetRecData);
    console.log(`✅ 推薦記錄已創建到目標用戶: ${targetRecRef.id}`);
    
    // 2. 更新統計
    await updateRecommenderStats(replierUserId, 1);
    await updateRecipientStats(targetUserId, 1);
    
    // 3. 發送 email 通知
    await sendReplyRecommendationEmails(recData, true);
    
    console.log(`✅ 已註冊用戶回覆處理完成`);
    
  } catch (error) {
    console.error(`❌ 處理已註冊用戶回覆失敗`, error);
  }
}

// 📧 處理未註冊用戶的回覆推薦
async function handleUnregisteredUserReply(recData, replierUserId, replyRecId) {
  try {
    console.log(`📧 處理未註冊用戶回覆: ${recData.targetEmail}`);
    
    // 1. 創建 pendingUser 記錄
    const pendingData = {
      email: recData.targetEmail.toLowerCase(),
      type: "reply_recommendation",
      replyRecommendationId: replyRecId,
      recommendationData: {
        name: recData.replierName,
        email: recData.replierEmail,
        content: recData.content,
        highlights: recData.highlights || [],
        relation: recData.relation || 'colleague',
        type: 'received',
        recommenderId: replierUserId,
        replyRecommendationId: replyRecId,
        hasReplied: false,
        jobId: 'default',
        lang: recData.lang || 'zh'
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await admin.firestore().collection("pendingUsers").add(pendingData);
    console.log(`✅ pendingUser 記錄已創建`);
    
    // 2. 發送 email 通知（不更新統計，等註冊後再更新）
    await sendReplyRecommendationEmails(recData, false);
    
    console.log(`✅ 未註冊用戶回覆處理完成`);
    
  } catch (error) {
    console.error(`❌ 處理未註冊用戶回覆失敗`, error);
  }
}

// 📧 發送回覆推薦的 email 通知
async function sendReplyRecommendationEmails(recData, isTargetRegistered) {
  try {
    let lang = recData.lang || "zh";
    
    // 語言標準化
    if (lang.startsWith('zh')) lang = 'zh';
    else if (lang.startsWith('en')) lang = 'en';
    else lang = 'zh';
    
    console.log(`📧 發送回覆推薦邀請，語言: ${lang}`);
    
    const messages = i18nMessages.replyRecommendation[lang];
    if (!messages) {
      console.error(`❌ 找不到語言 ${lang} 的翻譯`);
      return;
    }
    
    // 1. 發送給目標用戶（已註冊 vs 未註冊）
    if (isTargetRegistered) {
      // 已註冊用戶：回覆通知
      const subjectToRecipient = messages.subjectToRecipient(recData.replierName);
      const textToRecipient = messages.textToRecipient(
        recData.replierName,
        recData.targetName,
        recData.content,
        recData.originalContent
      );
      
      await sgMail.send({
        to: recData.targetEmail,
        from: {
          email: process.env.SENDER_EMAIL,
          name: process.env.SENDER_NAME
        },
        subject: subjectToRecipient,
        text: textToRecipient,
        trackingSettings: {
          clickTracking: { enable: false, enableText: false }
        }
      });
      
      console.log(`✅ 已註冊用戶回覆通知已發送: ${recData.targetEmail}`);
      
    } else {
      // 未註冊用戶：推薦邀請
      const subjectToUnregistered = messages.subjectToUnregistered(recData.replierName);
      const textToUnregistered = messages.textToUnregistered(
        recData.replierName,
        recData.targetName,
        recData.content,
        recData.targetEmail
      );
      
      await sgMail.send({
        to: recData.targetEmail,
        from: {
          email: process.env.SENDER_EMAIL,
          name: process.env.SENDER_NAME
        },
        subject: subjectToUnregistered,
        text: textToUnregistered,
        trackingSettings: {
          clickTracking: { enable: false, enableText: false }
        }
      });
      
      console.log(`✅ 未註冊用戶推薦邀請已發送: ${recData.targetEmail}`);
    }
    
    // 2. 發送確認信給回覆者
    if (recData.replierEmail) {
      const subjectToReplier = messages.subjectToReplier(recData.targetName);
      const textToReplier = messages.textToReplier(
        recData.replierName,
        recData.targetName,
        isTargetRegistered
      );
      
      await sgMail.send({
        to: recData.replierEmail,
        from: {
          email: process.env.SENDER_EMAIL,
          name: process.env.SENDER_NAME
        },
        subject: subjectToReplier,
        text: textToReplier,
        trackingSettings: {
          clickTracking: { enable: false, enableText: false }
        }
      });
      
      console.log(`✅ 回覆者確認信已發送: ${recData.replierEmail}`);
    }
    
  } catch (error) {
    console.error(`❌ 發送回覆推薦 email 失敗`, error);
    throw error;
  }
}

// 🆕 處理回覆推薦的註冊確認
async function processReplyRecommendationRegistration(newUserId, replyRecId, pendingData) {
  try {
    console.log(`🎯 開始處理回覆推薦註冊`);
    console.log(`→ 新用戶 ID: ${newUserId}`);
    console.log(`→ 回覆推薦 ID: ${replyRecId}`);
    
    const recommendationData = pendingData.recommendationData;
    
    if (!recommendationData) {
      console.error(`❌ 缺少 recommendationData`);
      return;
    }
    
    // 📝 創建推薦記錄到新註冊使用者的 recommendations 集合
    const recRef = admin.firestore()
      .collection("users")
      .doc(newUserId)
      .collection("recommendations")
      .doc();
    
    const finalRecommendationData = {
      ...recommendationData,
      type: "received",
      targetUserId: newUserId,
      status: 'verified', // 回覆推薦通常已驗證
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      registeredAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await recRef.set(finalRecommendationData);
    console.log(`✅ 回覆推薦記錄已創建: ${recRef.id}`);
    
    // 📊 更新統計
    if (recommendationData.recommenderId) {
      await updateRecommenderStats(recommendationData.recommenderId, 1, recommendationData.jobId);
      await updateRecipientStats(newUserId, 1);
      console.log(`📊 回覆推薦統計已更新`);
    }
    // 🔄 更新原始回覆推薦記錄的目標用戶ID
    if (recommendationData.recommenderId) {
      const originalReplyRef = admin.firestore()
        .collection("users")
        .doc(recommendationData.recommenderId)
        .collection("recommendations")
        .doc(replyRecId);
      
      await originalReplyRef.update({
        targetUserId: newUserId,
        status: 'delivered',
        deliveredAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`✅ 原始回覆推薦記錄已更新`);
    }
    
    console.log(`✅ 回覆推薦註冊處理完成`);
    
  } catch (error) {
    console.error(`❌ 處理回覆推薦註冊失敗:`, error);
  }
}
// 🆕 立即驗證推薦函數
async function validateRecommendationImmediately(recommendationData, targetUserData) {
  try {
    console.log(`🔍 開始立即驗證推薦`);
    console.log(`→ 推薦人: ${recommendationData.name}`);
    console.log(`→ 被推薦人: ${recommendationData.recommendeeName}`);
    
    // 1. 獲取推薦人工作經歷
    const recommenderJob = await getRecommenderJobData(
      recommendationData.recommenderUserId,
      recommendationData.recommenderJobId
    );
    
    if (!recommenderJob) {
      console.log(`❌ 找不到推薦人工作經歷`);
      return {
        status: 'verification_failed',
        reason: 'recommender_job_not_found',
        confidence: 0
      };
    }
    
    console.log(`✅ 推薦人工作經歷:`, {
      company: recommenderJob.company,
      start: recommenderJob.startDate,
      end: recommenderJob.endDate
    });
    
    // 2. 檢查被推薦人工作經歷
    const targetWorkExperiences = targetUserData.workExperiences || {};
    const userWorkExpArray = Array.isArray(targetWorkExperiences) 
      ? targetWorkExperiences 
      : Object.values(targetWorkExperiences);
    
    console.log(`🔍 被推薦人工作經歷數量: ${userWorkExpArray.length}`);
    
    // 3. 尋找最佳匹配
    let bestMatch = null;
    let maxConfidence = 0;
    
    for (const userJob of userWorkExpArray) {
      const validation = checkTimeOverlap(recommenderJob, userJob);
      
      console.log(`🕐 檢查重疊:`, {
        recommender: { company: recommenderJob.company, start: recommenderJob.startDate, end: recommenderJob.endDate },
        user: { company: userJob.company, start: userJob.startDate, end: userJob.endDate },
        hasOverlap: validation.hasOverlap,
        confidence: validation.confidence
      });
      
      if (validation.hasOverlap && validation.confidence > maxConfidence) {
        bestMatch = userJob;
        maxConfidence = validation.confidence;
      }
    }
    
    // 4. 判定結果
    if (maxConfidence >= 0.6) {
      // 🔽🔽🔽 在此處加入新的重複檢查邏輯 🔽🔽🔽
      const duplicateCheckSnap = await admin.firestore()
          .collection(`users/${recommendationData.targetUserId}/recommendations`)
          .where('recommenderUserId', '==', recommendationData.recommenderUserId)
          .where('matchedJobId', '==', bestMatch.id) // <== 核心修改：查詢匹配上的工作 ID
          .where('status', '==', 'verified')
          .limit(1)
          .get();

      if (!duplicateCheckSnap.empty) {
        console.log(`⏭️ 立即驗證時發現重複推薦: ${bestMatch.id}`);
        return {
            status: 'duplicate_skipped', // <== 返回新的狀態
            reason: 'already_verified_for_same_target_job',
            confidence: maxConfidence,
            duplicateOf: duplicateCheckSnap.docs[0].id
        };
      }

      console.log(`✅ 驗證通過! 信心度: ${maxConfidence.toFixed(2)}`);
      return {
        status: 'verified',
        confidence: maxConfidence,
        matchedJob: bestMatch,
        matchedJobId: bestMatch.id || `matched_${Date.now()}`,
        matchedCompany: bestMatch.company,
        reason: 'time_overlap_verified'
      };
    } else {
      console.log(`❌ 驗證失敗! 最高信心度: ${maxConfidence.toFixed(2)}`);
      return {
        status: 'verification_failed',
        confidence: maxConfidence,
        reason: 'no_sufficient_overlap'
      };
    }
    
  } catch (error) {
    console.error('❌ 立即驗證失敗:', error);
    return {
      status: 'verification_error',
      confidence: 0,
      reason: 'system_error'
    };
  }
}

// 🆕 獲取推薦人工作經歷數據
async function getRecommenderJobData(recommenderUserId, recommenderJobId) {
  try {
    const recommenderSnap = await admin.firestore()
      .doc(`users/${recommenderUserId}`)
      .get();

    if (!recommenderSnap.exists) {
      console.log(`⚠️ 找不到推薦人資料: ${recommenderUserId}`);
      return null;
    }

    const recommenderData = recommenderSnap.data();
    const recommenderWorkExp = recommenderData.workExperiences || {};
    
    // 查找特定工作經歷
    let recommenderJob = null;
    if (Array.isArray(recommenderWorkExp)) {
      recommenderJob = recommenderWorkExp.find(job => job.id === recommenderJobId);
    } else {
      recommenderJob = recommenderWorkExp[recommenderJobId];
    }

    return recommenderJob;
  } catch (error) {
    console.error('❌ 獲取推薦人工作經歷失敗:', error);
    return null;
  }
}

// 🆕 立即品質數據收集函數
async function collectQualityMetricsImmediate(recId, recData, confidence, recommenderJob, userJob) {
  try {
    // 安全的 userId 獲取
    const userId = recData.targetUserId || recData.recommendeeUserId || null;
    
    if (!userId) {
      console.warn(`⚠️ 無法確定 userId，跳過品質數據收集`);
      return;
    }
    
    const qualityData = {
      // 基本資訊
      recommendationId: recId,
      userId: userId,
      recommenderId: recData.recommenderUserId || recData.recommenderId,
      
      // 驗證結果
      confidence: confidence,
      verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      verificationType: 'immediate',
      
      // 工作經歷匹配
      recommenderCompany: recommenderJob?.company || null,
      userCompany: userJob?.company || null,
      timeOverlapMonths: userJob ? calculateOverlapMonths(
        new Date(recommenderJob.startDate || 0),
        new Date(recommenderJob.endDate || Date.now()),
        new Date(userJob.startDate || 0),
        new Date(userJob.endDate || Date.now())
      ) : 0,
      
      // 推薦內容品質
      contentLength: recData.content?.length || 0,
      hasHighlights: (recData.highlights?.length || 0) > 0,
      relationshipType: recData.relation || 'unknown',
      
      // 推薦流程數據
      recommendationType: 'outgoing',
      userRegistrationStatus: 'registered',
      
      // 元數據
      type: 'received',
      lang: recData.lang || 'zh'
    };
    
    // 過濾掉 undefined 值
    const cleanedData = Object.fromEntries(
      Object.entries(qualityData).filter(([_, value]) => value !== undefined)
    );
    
    // 寫入品質數據庫
    await admin.firestore()
      .collection('qualityMetrics')
      .doc(recId)
      .set(cleanedData);
      
    console.log(`📊 立即品質數據已收集: ${recId}`);
    
  } catch (error) {
    console.error(`❌ 收集立即品質數據失敗:`, error);
    // 不影響主流程
  }
}
// 🆕 發送重複推薦通知郵件
async function sendDuplicateRecommendationEmail(data, existingData) {
  let lang = data.lang || "zh";
  
  // 語言標準化
  if (lang.startsWith('zh')) lang = 'zh';
  else if (lang.startsWith('en')) lang = 'en';
  else lang = 'zh';
  
  const duplicateMessages = {
    zh: {
      subject: `💫 你已經推薦過 ${data.recommendeeName} 了`,
      text: `Hi ${data.name}，

我們注意到你剛才嘗試推薦 ${data.recommendeeName}，但你之前已經推薦過他/她了！

你的原始推薦仍然有效，無需重複推薦。

如果你想：
✅ 查看你的推薦記錄：https://galaxyz.ai/pages/profile-dashboard.html
✅ 推薦其他優秀夥伴：https://galaxyz.ai/pages/profile-dashboard.html

感謝你對 Galaxyz 的支持！

Galaxyz 團隊敬上`
    },
    en: {
      subject: `💫 You've already recommended ${data.recommendeeName}`,
      text: `Hi ${data.name},

We noticed you just tried to recommend ${data.recommendeeName}, but you've already recommended them before!

Your original recommendation is still active, so no need to recommend again.

If you'd like to:
✅ View your recommendations: https://galaxyz.ai/pages/profile-dashboard.html  
✅ Recommend other great colleagues: https://galaxyz.ai/pages/profile-dashboard.html

Thank you for your continued support!

Team Galaxyz`
    }
  };

  try {
    const recommenderEmail = data.email;
    if (!recommenderEmail) {
      console.log(`⚠️ 無推薦人 email，跳過重複推薦通知`);
      return;
    }

    await sgMail.send({
      to: recommenderEmail,
      from: {
        email: process.env.SENDER_EMAIL,
        name: process.env.SENDER_NAME
      },
      subject: duplicateMessages[lang].subject,
      text: duplicateMessages[lang].text,
      trackingSettings: {
        clickTracking: { enable: false, enableText: false }
      }
    });
    
    console.log(`✅ 重複推薦通知已發送: ${recommenderEmail}`);
  } catch (error) {
    console.error("❌ 發送重複推薦通知失敗:", error);
  }
}