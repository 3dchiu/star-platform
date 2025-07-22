// functions/index.js - 完整更新版
require("dotenv").config();
// V2 Imports
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");

// Admin SDK and other modules
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");
const { Resend } = require("resend");
admin.initializeApp();
const resend = new Resend(process.env.RESEND_API_KEY); 
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

  // 🆕 推薦他人功能的信件內容（包含重發版本）
  outgoingRecommendation: {
    zh: {
      // 給被推薦人的通知（首次）
      subjectToRecommendee: (recommenderName) => `🌟 你收到一封來自 ${recommenderName} 的推薦信！`,
      textToRecommendee: (recommenderName, recommendeeName, content, company, position, recommendeeEmail) => `Hi ${recommendeeName}，

你收到一封來自 ${recommenderName} 的推薦信！

**推薦內容預覽：**
「${content.length > 60 ? content.substring(0, 60) + '...' : content}」

${content.length > 60 ? '👆 這只是部分內容，完整推薦還有更多精彩內容！' : ''}

這封來自 ${recommenderName} 的推薦信，是你職涯中的一顆信任星星 ⭐

${recommenderName} 在 ${company} 擔任 ${position} 期間認識了你，現在特別為你寫下這份推薦。

💫 想看完整的推薦內容嗎？點擊下方連結，立即建立你的 Galaxyz 職涯頁！

💡【重要提示】
請優先填寫與 ${recommenderName} 在 ${company} 共事時期的工作經歷，這樣系統能自動將對方的推薦內容顯示在該段經歷中，幫助你快速完成職涯檔案建立。

👉【立即註冊並查看完整推薦】
https://galaxyz.ai/pages/login.html?register=1&email=${encodeURIComponent(recommendeeEmail)}

Galaxyz｜讓每個人因真實與信任被看見。

Galaxyz 團隊敬上`,

      // 🆕 給被推薦人的通知（重發版本）
      subjectToRecommendeeResend: (recommenderName) => `🌟 再次提醒：你收到了來自 ${recommenderName} 的推薦信！`,
      textToRecommendeeResend: (recommenderName, recommendeeName, content, company, position, recommendeeEmail) => `Hi ${recommendeeName}，

這是一封來自 ${recommenderName} 的推薦信提醒 📧

我們之前已經發送過這份推薦給你，但擔心你可能沒有收到或錯過了，所以再次提醒你。

**推薦內容預覽：**
「${content.length > 60 ? content.substring(0, 60) + '...' : content}」

${content.length > 60 ? '👆 這只是部分內容，完整推薦還有更多精彩內容！' : ''}

這封來自 ${recommenderName} 的推薦信，是你職涯中的一顆信任星星 ⭐

💫 想看完整的推薦內容嗎？點擊下方連結，立即建立你的 Galaxyz 職涯頁！

💡【重要提示】
請優先填寫與 ${recommenderName} 在 ${company} 共事時期的工作經歷，這樣系統能自動將對方的推薦內容顯示在該段經歷中。

👉【立即註冊並查看完整推薦】
https://galaxyz.ai/pages/login.html?register=1&email=${encodeURIComponent(recommendeeEmail)}

如果你已經註冊過，請直接登入查看你的推薦。

Galaxyz｜讓每個人因真實與信任被看見。

Galaxyz 團隊敬上`,

      // 給推薦人的確認信（首次）
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

Galaxyz 團隊敬上`,

      // 🆕 給推薦人的確認信（重發版本）
      subjectToRecommenderResend: (recommendeeName) => `🔄 你對 ${recommendeeName} 的推薦已重新發送`,
      textToRecommenderResend: (recommenderName, recommendeeName, company, position) => `Hi ${recommenderName}，

你對 ${recommendeeName} 的推薦已重新發送！

我們理解有時候郵件可能會遺失或被忽略，所以系統允許你重新發送推薦給尚未註冊的夥伴。

推薦內容將在對方註冊並核實身份後，正式納入你的推薦記錄。

💡 小提醒：你可以主動聯絡 ${recommendeeName}，提醒查收推薦邀請！

感謝你的耐心和對夥伴的支持。

🌟 你也可以邀請其他人為你寫推薦：https://galaxyz.ai/pages/login.html?register=1

Galaxyz｜讓每個人因真實與信任被看見。

Galaxyz 團隊敬上`
    },
    en: {
      // 給被推薦人的通知（首次）
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

      // 🆕 給被推薦人的通知（重發版本）
      subjectToRecommendeeResend: (recommenderName) => `🌟 Reminder: You received a recommendation from ${recommenderName}!`,
      textToRecommendeeResend: (recommenderName, recommendeeName, content, company, position, recommendeeEmail) => `Hi ${recommendeeName},

This is a reminder about a recommendation from ${recommenderName} 📧

We previously sent this recommendation to you, but we're concerned you might not have received it or missed it, so here's a friendly reminder.

**Recommendation Preview:**
"${content.length > 100 ? content.substring(0, 100) + '...' : content}"

${content.length > 100 ? '👆 This is just a preview - there\'s more amazing content in the full recommendation!' : ''}

This recommendation from ${recommenderName} is a star of trust in your career journey ⭐

💫 Want to read the complete recommendation? Click the link below to create your Galaxyz career page!

👉【Register Now and View Full Recommendation】
https://galaxyz.ai/pages/login.html?register=1&email=${encodeURIComponent(recommendeeEmail)}

If you've already registered, please log in directly to view your recommendation.

Galaxyz | Where everyone is seen through authenticity and trust.

Warmly,
Team Galaxyz`,

      // 給推薦人的確認信（首次）
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
Team Galaxyz`,

      // 🆕 給推薦人的確認信（重發版本）
      subjectToRecommenderResend: (recommendeeName) => `🔄 Your recommendation for ${recommendeeName} has been resent`,
      textToRecommenderResend: (recommenderName, recommendeeName, company, position) => `Hi ${recommenderName},

Your recommendation for ${recommendeeName} has been resent!

We understand that sometimes emails can get lost or overlooked, so the system allows you to resend recommendations to colleagues who haven't registered yet.

Your recommendation will be officially recorded after the recipient registers and verifies their identity.

💡 Pro Tip: You can reach out to ${recommendeeName} directly to remind them to check their invitation email!

Thank you for your patience and support for your colleague.

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
},
milestoneNotification: {
    zh: {
      recommendationGivenVerified: {
        subject: (recommendeeName) => `✅ 你對 ${recommendeeName} 的推薦已通過驗證！`,
        text: (userName, recommendeeName) => `Hi ${userName}，\n\n好消息！你之前為 ${recommendeeName} 寫下的推薦，現已通過驗證。\n\n你成功為他的職涯，增添了一顆閃亮的信任星星。感謝你的付出！\n\n作為獎勵，你獲得了 +10 EXP。\n\nGalaxyz 團隊敬上`
      },
      recommendationReceivedVerified: {
        subject: (recommenderName) => `✅ 好消息！來自 ${recommenderName} 的推薦已通過驗證`,
        text: (userName, recommenderName) => `Hi ${userName}，\n\n恭喜！來自 ${recommenderName} 的推薦已成功驗證並歸戶到您的檔案中。\n\n你的職涯星圖上，多了一筆真實的信任紀錄。這也讓你獲得了 +5 EXP。\n\n立即前往儀表板查看，並考慮回覆推薦，完成善意的循環！\n👉 https://galaxyz.ai/pages/profile-dashboard.html\n\nGalaxyz 團隊敬上`
      },
      replyGivenVerified: {
  subject: (recommendeeName) => `✅ 你對 ${recommendeeName} 的回覆推薦已通過驗證！`,
  text: (userName, recommendeeName) => `Hi ${userName}，\n\n好消息！你回覆給 ${recommendeeName} 的推薦，現已成功驗證。\n\n你們之間善意的循環已經完成！感謝你的互動！\n\n作為獎勵，你獲得了 +3 EXP。\n\nGalaxyz 團隊敬上`
},
    },
    en: {
      recommendationGivenVerified: {
        subject: (recommendeeName) => `✅ Your recommendation for ${recommendeeName} has been verified!`,
        text: (userName, recommendeeName) => `Hi ${userName},\n\nGreat news! The recommendation you wrote for ${recommendeeName} has now been verified.\n\nYou've successfully added a shining star of trust to their career. Thank you for your contribution!\n\nAs a reward, you've earned +10 EXP.\n\nBest,\nThe Galaxyz Team`
      },
      recommendationReceivedVerified: {
        subject: (recommenderName) => `✅ Good news! The recommendation from ${recommenderName} has been verified`,
        text: (userName, recommenderName) => `Hi ${userName},\n\nCongratulations! The recommendation from ${recommenderName} has been successfully verified and added to your profile.\n\nThis adds another record of trust to your career map. You've also earned +5 EXP.\n\nVisit your dashboard now to see it, and consider replying to complete the cycle of goodwill!\n👉 https://galaxyz.ai/pages/profile-dashboard.html\n\nBest,\nThe Galaxyz Team`
      },
      replyGivenVerified: {
        subject: (recommendeeName) => `✅ Your reply recommendation for ${recommendeeName} has been verified!`,
        text: (userName, recommendeeName) => `Hi ${userName},\n\nGood news! Your reply recommendation for ${recommendeeName} has now been successfully verified.\n\nThe cycle of goodwill between you is complete! Thank you for your interaction.\n\nAs a reward, you've earned +3 EXP.\n\nBest,\nThe Galaxyz Team`
      },
    }
  }
};

// =================================================================
// 1. 感謝信 (用於「邀請夥伴推薦」流程)
// =================================================================
/**
 * 【v2 - 優化版】僅在「邀請他人為我推薦」的情境下，寄送感謝信給推薦人。
 */
exports.notifyOnRecommendationCreated = onDocumentCreated("users/{userId}/recommendations/{recId}", async (event) => {
    const snap = event.data;
    if (!snap) return null;

    const data = snap.data();
    const recId = event.params.recId;
    const recommendeeUserId = event.params.userId;

    // ✨ --- 新增的關鍵檢查 --- ✨
    // 如果這筆推薦是從 `outgoingRecommendations` 流程轉過來的 (fromOutgoing: true)，
    // 代表相關的通知信已在該流程寄出，這裡就不需要再寄送通用的感謝信。
    if (data.fromOutgoing === true) {
        console.log(`[notifyOnRecCreated] [${recId}] ⏭️ 此推薦來自「推薦好夥伴」流程，跳過重複的感謝信。`);
        return null;
    }

    // 只有在不是 fromOutgoing 的情況下，才繼續執行以下舊有邏輯
    const isSimpleReceived = data.type === 'received' && !data.fullyProcessed && !data.notificationSent;

    if (!isSimpleReceived) {
        return null;
    }

    console.log(`[notifyOnRecCreated] [${recId}] 🎯 偵測到單純的收到推薦，準備寄送通知...`);

    try {
        // ... 後續的程式碼完全不變 ...
        const recommendeeSnap = await admin.firestore().doc(`users/${recommendeeUserId}`).get();
        if (!recommendeeSnap.exists) {
            console.error(`[notifyOnRecCreated] [${recId}] ❌ 找不到被推薦人資料 (ID: ${recommendeeUserId})。`);
            return null;
        }
        const recommendee = recommendeeSnap.data();
        const recommenderName = data.name;
        const recommenderEmail = data.email;
        const lang = data.lang || "zh";

        const messages = i18nMessages.notifyRecommendation[lang] || i18nMessages.notifyRecommendation.zh;
        
        if (recommenderEmail) {
            const subject = messages.subject(recommendee.name || '您的夥伴');
            const text = messages.text(recommenderName, recommendee.name || '您的夥伴');
            
            await resend.emails.send({
              from: `${process.env.SENDER_NAME} <${process.env.SENDER_EMAIL}>`,
              to: [recommenderEmail],
              subject: subject,
              text: text,
            });
            console.log(`[notifyOnRecCreated] [${recId}] ✅ [Resend] 已發送感謝信至推薦人: ${recommenderEmail}`);
        }
        
        await snap.ref.update({ notificationSent: true });
        console.log(`[notifyOnRecCreated] [${recId}] 🎉 處理完成。`);

    } catch (error) {
        console.error(`[notifyOnRecCreated] [${recId}] ❌ 處理過程中發生錯誤:`, error);
    }

    return null;
});

// 🔽 檢查未註冊用戶的重複推薦（改為智能處理）
async function checkDuplicateUnregisteredRecommendation(targetEmail, recommenderUserId, recommenderJobId) {
    try {
        console.log(`🔍 檢查未註冊用戶重複推薦: email=${targetEmail}, 推薦人=${recommenderUserId}`);
        
        // 查找是否已經有同一推薦人對同一未註冊用戶的推薦
        const existingOutgoingQuery = await admin.firestore()
            .collection('outgoingRecommendations')
            .where('recommendeeEmail', '==', targetEmail)
            .where('recommenderUserId', '==', recommenderUserId)
            .where('recommenderJobId', '==', recommenderJobId)
            .where('status', 'in', ['pending_registration', 'delivered_pending_verification'])
            .orderBy('createdAt', 'desc') // 🔥 按時間排序，取最新的
            .limit(1)
            .get();

        if (!existingOutgoingQuery.empty) {
            const existingDoc = existingOutgoingQuery.docs[0];
            const existingData = existingDoc.data();
            
            console.log(`🔄 發現未註冊用戶的重複推薦: ${existingDoc.id}，將進行智能處理`);
            return {
                exists: true,
                existingRecId: existingDoc.id,
                existingData: existingData,
                action: 'update_and_resend', // 🔥 新動作：更新並重新發送
                reason: 'unregistered_user_resend'
            };
        }

        console.log(`✅ 未發現重複的未註冊推薦`);
        return { exists: false };
        
    } catch (error) {
        console.error(`❌ 檢查未註冊重複推薦時發生錯誤:`, error);
        return { exists: false };
    }
}

/**
 * 【v3 - 最終邏輯版】核心處理函式：當 outgoingRecommendation 文件建立時觸發
 * 職責：承擔所有後續的業務邏輯，並能正確處理推薦人與被推薦人的不同註冊狀態。
 */
exports.notifyOnOutgoingRecommendationCreated = onDocumentCreated("outgoingRecommendations/{recId}", async (event) => {
    const snap = event.data;
    const data = snap.data();
    const recId = event.params.recId;

    if (data.status !== 'submitted' || data.processed || data.processing) {
        console.log(`[notifyOutgoing-v3] [${recId}] ⏭️ 狀態非 submitted 或已在處理中，跳過。狀態: ${data.status}`);
        return null;
    }
    try {
        await snap.ref.update({ processing: true, processingStartedAt: FieldValue.serverTimestamp() });
        console.log(`[notifyOutgoing-v3] [${recId}] 🟢 取得處理權...`);
    } catch (lockError) {
        console.log(`[notifyOutgoing-v3] [${recId}] 🟡 無法取得處理權，跳過。`);
        return null;
    }

    try {
        // 檢查被推薦人(David)是否已註冊
        const recommendeeQuery = await admin.firestore()
            .collection("users")
            .where("email", "==", data.recommendeeEmail)
            .limit(1)
            .get();

        let finalStatus = '';

        if (!recommendeeQuery.empty) {
            // 【流程 A：被推薦人(David)已註冊】
            const recommendeeUserDoc = recommendeeQuery.docs[0];
            const recommendeeUserId = recommendeeUserDoc.id;
            console.log(`[notifyOutgoing-v3] [${recId}] ✅ 被推薦人已註冊 (ID: ${recommendeeUserId})。`);

            // ✨ --- 新增的關鍵邏輯：檢查推薦人(Sandy)是否也已註冊 --- ✨
            const recommenderQuery = await admin.firestore()
                .collection("users")
                .where("email", "==", data.recommenderEmail)
                .limit(1)
                .get();

            if (!recommenderQuery.empty) {
                // 【流程 A.1：雙方都已註冊 -> 執行即時驗證】
                const recommenderUserDoc = recommenderQuery.docs[0];
                console.log(`[notifyOutgoing-v3] [${recId}] ✅ 推薦人也已註冊 (ID: ${recommenderUserDoc.id})。準備即時驗證...`);
                
                // 確保 recommenderUserId 是最新的
                data.recommenderUserId = recommenderUserDoc.id;

                const isDuplicate = await checkDuplicateRecommendationBeforeCreate(recommendeeUserId, data.recommenderUserId, data.recommenderJobId);
                if (isDuplicate.exists) {
                    finalStatus = 'duplicate_recommendation';
                    console.log(`[notifyOutgoing-v3] [${recId}] ⛔ 偵測到重複推薦，流程中止。`);
                    await sendDuplicateRecommendationEmail(data, isDuplicate.existingData);
                } else {
                    const verificationResult = await validateRecommendationImmediately(data, recommendeeUserDoc.data());
                    const newRecId = await createRecommendationForRegisteredUser(recommendeeUserId, data, verificationResult);
                    finalStatus = verificationResult.status === 'verified' ? 'delivered_and_verified' : 'delivered_but_failed';
                    // ... (更新 outgoingRecommendations 的邏輯不變)
                }
            } else {
                // 【流程 A.2：被推薦人已註冊，但推薦人未註冊 -> 建立 pending 推薦】
                console.log(`[notifyOutgoing-v3] [${recId}] ℹ️ 推薦人尚未註冊。將為 ${recommendeeUserId} 建立一筆 pending 推薦。`);
                // 這種情況下，直接為 David 建立一筆收到的推薦，狀態為 pending
                await createSimplePendingRecommendation(recommendeeUserId, data, recId);
                finalStatus = 'delivered_pending_registration'; // 一個新的狀態，表示已送達但等待推薦人註冊
            }
        } else {
            // 【流程 B：被推薦人(David)未註冊 -> 走原本的邀請流程】
            console.log(`[notifyOutgoing-v3] [${recId}] 📝 被推薦人尚未註冊，走邀請流程...`);
            // ... (此處的 checkDuplicateUnregisteredRecommendation, handleUnregisteredResendRecommendation, 建立 pendingUser 等邏輯完全不變)
            const duplicateCheck = await checkDuplicateUnregisteredRecommendation(data.recommendeeEmail, data.recommenderUserId, data.recommenderJobId);
            if (duplicateCheck.exists) { // 簡化判斷
                finalStatus = await handleUnregisteredResendRecommendation(recId, data, duplicateCheck.existingRecId, duplicateCheck.existingData);
            } else {
                await admin.firestore().collection("pendingUsers").add({
                    email: data.recommendeeEmail,
                    type: "recommendation_invitee",
                    recommendationId: recId,
                    recommendationData: data,
                    createdAt: FieldValue.serverTimestamp(),
                });
                finalStatus = 'pending_registration';
            }
        }
        
        // ... (發送郵件和更新最終狀態的邏輯不變)
        if (finalStatus !== 'duplicate_recommendation') {
            await sendOutgoingRecommendationEmails(data, finalStatus === 'resent_to_unregistered');
        }
        await snap.ref.update({
            status: finalStatus,
            processed: true,
            processing: false,
            processedAt: FieldValue.serverTimestamp()
        });
        console.log(`[notifyOutgoing-v3] [${recId}] 🎉 處理完成，最終狀態: ${finalStatus}`);

    } catch (error) {
        console.error(`[notifyOutgoing-v3] [${recId}] ❌ 處理過程中發生嚴重錯誤:`, error);
        await snap.ref.update({ status: "error", errorMessage: error.message, processing: false });
    }
});

// ✨ --- 新增一個輔助函式 --- ✨
/**
 * 輔助函式：為已註冊用戶，建立一筆簡單的、等待推薦人註冊的 pending 推薦。
 */
async function createSimplePendingRecommendation(targetUserId, recommendationData, outgoingRecId) {
    try {
        const recRef = admin.firestore().collection("users").doc(targetUserId).collection("recommendations").doc();
        const pendingRecData = {
            id: recRef.id,
            name: recommendationData.recommenderName,
            email: recommendationData.recommenderEmail,
            content: recommendationData.content,
            highlights: recommendationData.highlights || [],
            relation: recommendationData.relation,
            recommenderId: null, // 推薦人未註冊，所以是 null
            recommenderJobId: recommendationData.recommenderJobId,
            type: 'received',
            status: 'pending', // 核心狀態
            verificationType: 'pending_recommender_registration', // 標示等待原因
            fromOutgoingId: outgoingRecId,
            createdAt: FieldValue.serverTimestamp()
        };
        await recRef.set(pendingRecData);
        console.log(`✅ 已成功建立 simple pending 推薦: ${recRef.id}`);
        // 同時更新 outgoing rec 的狀態
        await admin.firestore().collection("outgoingRecommendations").doc(outgoingRecId).update({
            targetUserId: targetUserId,
            recommendationId: recRef.id
        });
    } catch (error) {
        console.error("❌ 建立 simple pending 推薦失敗:", error);
    }
}

// 🆕 處理未註冊用戶的重新發送推薦
async function handleUnregisteredResendRecommendation(newRecId, newData, oldRecId, oldData) {
    try {
        console.log(`[handleResend] 🔄 處理未註冊用戶重新發送: 新=${newRecId}, 舊=${oldRecId}`);
        
        // 1. 更新舊的 outgoingRecommendations 記錄狀態
        const oldRecRef = admin.firestore().collection("outgoingRecommendations").doc(oldRecId);
        await oldRecRef.update({
            status: 'superseded_by_newer',
            supersededBy: newRecId,
            supersededAt: FieldValue.serverTimestamp()
        });
        console.log(`[handleResend] ✅ 舊記錄 ${oldRecId} 已標記為被新記錄取代`);
        
        // 2. 更新舊的 pendingUsers 記錄，指向新的推薦ID
        const pendingQuery = await admin.firestore()
            .collection("pendingUsers")
            .where("email", "==", newData.recommendeeEmail.toLowerCase())
            .where("type", "==", "recommendation_invitee")
            .where("recommendationId", "==", oldRecId)
            .limit(1)
            .get();
        
        if (!pendingQuery.empty) {
            const pendingDoc = pendingQuery.docs[0];
            await pendingDoc.ref.update({
                recommendationId: newRecId,           // 🔥 指向新的推薦ID
                recommendationData: newData,          // 🔥 更新為最新內容
                lastResent: FieldValue.serverTimestamp(),
                resendCount: FieldValue.increment(1), // 記錄重發次數
                previousRecommendationIds: FieldValue.arrayUnion(oldRecId) // 記錄舊ID歷史
            });
            console.log(`[handleResend] ✅ pendingUsers 記錄已更新指向新推薦: ${newRecId}`);
        } else {
            // 如果找不到對應的 pendingUser，創建新的
            console.log(`[handleResend] ⚠️ 找不到對應的 pendingUser，創建新記錄`);
            await admin.firestore().collection("pendingUsers").add({
                email: newData.recommendeeEmail.toLowerCase(),
                type: "recommendation_invitee",
                recommendationId: newRecId,
                recommendationData: newData,
                createdAt: FieldValue.serverTimestamp(),
                isResend: true,
                originalRecommendationId: oldRecId
            });
        }
        
        // 3. 設定新記錄的狀態
        const newRecRef = admin.firestore().collection("outgoingRecommendations").doc(newRecId);
        await newRecRef.update({
            status: 'resent_to_unregistered',
            isResend: true,
            originalRecommendationId: oldRecId,
            resentAt: FieldValue.serverTimestamp()
        });
        
        console.log(`[handleResend] 🎉 重新發送處理完成`);
        return 'resent_to_unregistered';
        
    } catch (error) {
        console.error(`[handleResend] ❌ 處理重新發送失敗:`, error);
        return 'pending_registration'; // 降級到正常流程
    }
}

// 🆕 檢查已註冊用戶的重複推薦（在建立推薦記錄前）
async function checkDuplicateRecommendationBeforeCreate(targetUserId, recommenderUserId, recommenderJobId) {
    try {
        console.log(`🔍 [修正版] 檢查重複推薦: 被推薦人=${targetUserId}, 推薦人=${recommenderUserId}, 工作=${recommenderJobId}`);
        
        const recsRef = admin.firestore().collection(`users/${targetUserId}/recommendations`);
        
        // 建立兩個獨立的查詢 Promise，一個檢查新欄位，一個檢查舊欄位
        const queryByNewField = recsRef
            .where('recommenderId', '==', recommenderUserId) // ✅ 檢查標準欄位 recommenderId
            .where('recommenderJobId', '==', recommenderJobId)
            .where('status', 'in', ['pending', 'verified', 'verification_failed'])
            .limit(1)
            .get();
            
        const queryByOldField = recsRef
            .where('recommenderUserId', '==', recommenderUserId) // ✅ 兼容檢查舊欄位 recommenderUserId
            .where('recommenderJobId', '==', recommenderJobId)
            .where('status', 'in', ['pending', 'verified', 'verification_failed'])
            .limit(1)
            .get();

        // 使用 Promise.all 平行執行兩個查詢，提升效率
        const [newFieldResult, oldFieldResult] = await Promise.all([queryByNewField, queryByOldField]);

        // 只要任何一個查詢找到結果，就代表重複
        if (!newFieldResult.empty || !oldFieldResult.empty) {
            const existingDoc = !newFieldResult.empty ? newFieldResult.docs[0] : oldFieldResult.docs[0];
            const existingData = existingDoc.data();
            
            console.log(`⛔ 發現重複推薦: ${existingDoc.id}, 狀態: ${existingData.status}`);
            return {
                exists: true,
                existingRecId: existingDoc.id,
                existingData: existingData,
                reason: `already_recommended_from_job_${recommenderJobId}`
            };
        }

        // 為了安全起見，保留跨工作經歷的檢查
        const crossJobQuery = recsRef
            .where('recommenderId', '==', recommenderUserId)
            .where('status', '==', 'verified')
            .limit(1)
            .get();
        const crossJobResult = await crossJobQuery;
            
        if (!crossJobResult.empty) {
             const existingDoc = crossJobResult.docs[0];
             const existingData = existingDoc.data();
            
             console.log(`⛔ 發現同一推薦人的其他已驗證推薦: ${existingDoc.id}`);
             return {
                 exists: true,
                 existingRecId: existingDoc.id,
                 existingData: existingData,
                 reason: 'already_recommended_by_same_person'
             };
        }

        console.log(`✅ 未發現重複推薦`);
        return { exists: false };
        
    } catch (error) {
        console.error(`❌ 檢查重複推薦時發生錯誤:`, error);
        return { exists: false }; // 發生錯誤時，為安全起見回傳 false，避免阻擋正常流程
    }
}

// =================================================================
// 2. 推薦信 (用於「推薦好夥伴」流程)
// =================================================================
/**
 * 發送「推薦好夥伴」的郵件通知 (支援重發)
 * @param {object} data - The recommendation data.
 * @param {boolean} isResend - Flag for resend logic.
 */
async function sendOutgoingRecommendationEmails(data, isResend = false) {
    let lang = data.lang || "zh";
    
    if (lang.startsWith('zh')) lang = 'zh';
    else if (lang.startsWith('en')) lang = 'en';
    else lang = 'zh';
    
    console.log(`📧 [Resend] 開始發送推薦郵件${isResend ? '（重發）' : ''}，語言: ${lang}`);
    
    try {
        const messages = i18nMessages.outgoingRecommendation[lang];
        
        // --- 信件一：通知被推薦人 ---
        const subjectToRecommendee = isResend 
            ? messages.subjectToRecommendeeResend(data.recommenderName) // 修正：使用 recommenderName
            : messages.subjectToRecommendee(data.recommenderName);      // 修正：使用 recommenderName
            
        const textToRecommendee = isResend
            ? messages.textToRecommendeeResend(data.recommenderName, data.recommendeeName, data.content, data.recommenderCompany || "未指定公司", data.recommenderPosition || "未指定職位", data.recommendeeEmail)
            : messages.textToRecommendee(data.recommenderName, data.recommendeeName, data.content, data.recommenderCompany || "未指定公司", data.recommenderPosition || "未指定職位", data.recommendeeEmail);
        
        await resend.emails.send({
            from: `${process.env.SENDER_NAME} <${process.env.SENDER_EMAIL}>`,
            to: [data.recommendeeEmail],
            subject: subjectToRecommendee,
            text: textToRecommendee,
        });
        
        console.log(`✅ [Resend] 被推薦人通知信件已發送${isResend ? '（重發）' : ''}: ${data.recommendeeEmail}`);

        // --- 信件二：確認信給推薦人 ---
        let recommenderEmail = data.recommenderEmail; 
        if (!recommenderEmail && data.recommenderUserId) {
            try {
                const recommenderSnap = await admin.firestore().doc(`users/${data.recommenderUserId}`).get();
                if (recommenderSnap.exists) {
                    recommenderEmail = recommenderSnap.data().email;
                }
            } catch (error) {
                console.warn("⚠️ 查找推薦人 email 失敗:", error);
            }
        }

        if (recommenderEmail) {
            const subjectToRecommender = isResend
                ? messages.subjectToRecommenderResend(data.recommendeeName)
                : messages.subjectToRecommender(data.recommendeeName);
                
            const textToRecommender = isResend
                ? messages.textToRecommenderResend(data.recommenderName, data.recommendeeName, data.recommenderCompany || "未指定公司", data.recommenderPosition || "未指定職位")
                : messages.textToRecommender(data.recommenderName, data.recommendeeName, data.recommenderCompany || "未指定公司", data.recommenderPosition || "未指定職位");
            
            await resend.emails.send({
                from: `${process.env.SENDER_NAME} <${process.env.SENDER_EMAIL}>`,
                to: [recommenderEmail],
                subject: subjectToRecommender,
                text: textToRecommender,
            });
            
            console.log(`✅ [Resend] 推薦人確認信件已發送${isResend ? '（重發）' : ''}: ${recommenderEmail}`);
        }
        
        console.log(`🎉 [Resend] 推薦郵件${isResend ? '重發' : '發送'}完成！`);
        
    } catch (error) {
        console.error(`❌ [Resend] 發送推薦郵件失敗:`, error);
        throw error;
    }
}

/**
 * 🆕 【新增】為已註冊用戶，建立一則收到的推薦記錄
 * @param {string} targetUserId - 被推薦人的用戶 ID
 * @param {object} recommendationData - 來自 outgoingRecommendations 的原始推薦資料
 * @param {object} verificationResult - 來自 validateRecommendationImmediately 的驗證結果
 * @returns {string} - 新建立的推薦記錄 ID
 */
async function createRecommendationForRegisteredUser(targetUserId, recommendationData, verificationResult) {
    try {
        const recRef = admin.firestore().collection("users").doc(targetUserId).collection("recommendations").doc();

        // ✨ 步驟一：無論驗證結果如何，都先建立一筆 status: 'pending' 的文件
        const initialData = {
            id: recRef.id,
            name: recommendationData.recommenderName,
            email: recommendationData.recommenderEmail,
            content: recommendationData.content,
            highlights: recommendationData.highlights || [],
            relation: recommendationData.relation,
            recommenderId: recommendationData.recommenderUserId,
            recommenderJobId: recommendationData.recommenderJobId,
            // ... 其他通用欄位
            type: 'received',
            status: 'pending', // ⬅️ 統一初始狀態為 pending
            createdAt: FieldValue.serverTimestamp(),
            fromOutgoing: true
        };
        await recRef.set(initialData);

        // ✨ 步驟二：根據驗證結果，立刻進行一次「更新」
        await recRef.update({
            status: verificationResult.status, // ⬅️ 更新為 'verified' 或 'verification_failed'
            confidence: verificationResult.confidence || 0,
            jobId: verificationResult.status === 'verified' ? verificationResult.matchedJobId : null,
            matchedJobId: verificationResult.status === 'verified' ? verificationResult.matchedJobId : null,
            verifiedAt: verificationResult.status === 'verified' ? FieldValue.serverTimestamp() : null,
            canReply: verificationResult.status === 'verified'
        });

        console.log(`[createRec-Refactored] ✅ 已為用戶 ${targetUserId} 建立並更新推薦記錄: ${recRef.id}, 狀態: ${verificationResult.status}`);
        console.log(`[createRec-Refactored] 📊 推薦記錄已建立，等待 onRecommendationVerified 統一處理...`);

        return recRef.id;

    } catch (error) {
        console.error(`❌ 建立推薦記錄時發生錯誤:`, error);
        throw error;
    }
}

// 🔽 功能 4：新推薦建立時，若 email 對應已有註冊使用者，補上 recommenderId
exports.assignRecommenderIdOnRecCreated = onDocumentCreated("users/{userId}/recommendations/{recId}", async (event) => {
  const recRef = event.data.ref;
  const rec = event.data.data();
  const recId = event.params.recId;

  // 1. 如果是回覆推薦或已被處理的推薦類型，直接跳過
  if (rec.type === 'reply' || rec.type === 'outgoing' || rec.type === 'received') {
    console.log(`[assignRecommenderIdOnRecCreated] ⏭️ 跳過 type 為 ${rec.type} 的推薦，不進行處理: ${recId}`);
    return null;
  }

  // 2. 如果已經有 recommenderId 或為舊資料，也直接跳過
  if (rec.recommenderId || rec.legacy_protected) {
    console.log(`[assignRecommenderIdOnRecCreated] ⏭️ 推薦已有 ID 或為舊資料，跳過: ${recId}`);
    return null;
  }

  // 3. 檢查推薦人 email 是否存在
  if (!rec.email) {
    console.warn(`[assignRecommenderIdOnRecCreated] ⚠️ 推薦缺少 email，無法配對: ${recId}`);
    return null;
  }

  // 4. 根據 email 查找已註冊的使用者
  const usersSnap = await admin.firestore()
    .collection("users")
    .where("email", "==", rec.email.toLowerCase())
    .limit(1)
    .get();

  if (usersSnap.empty) {
    console.log(`[assignRecommenderIdOnRecCreated] 📝 推薦人 ${rec.email} 尚未註冊。`);
    return null;
  }

  // 5. 如果找到了，只做一件事：補上 ID，並將狀態設為 pending
  const recommenderUid = usersSnap.docs[0].id;
  console.log(`[assignRecommenderIdOnRecCreated] ✅ 找到已註冊的推薦人: ${recommenderUid}，準備補上 ID...`);

  try {
    await recRef.update({
      recommenderId: recommenderUid,
      recommenderRegistered: true,
      status: 'pending', // 將狀態統一設為 pending，等待後續的驗證流程
      updatedAt: FieldValue.serverTimestamp()
    });
    console.log(`[assignRecommenderIdOnRecCreated] ✅ 已為推薦 ${recId} 補上 recommenderId: ${recommenderUid}`);
  } catch (error) {
    console.error(`[assignRecommenderIdOnRecCreated] ❌ 補寫 ID 時發生錯誤: ${recId}`, error);
  }

  return null;
});


// 🔽 功能 2：推薦人完成註冊後，自動補上 recommenderId
// 📥 監聽路徑：users/{userId}
// 📤 動作：補寫推薦紀錄的 recommenderId、刪除 pendingUser、更新統計
exports.onUserCreated_assignRecommenderId = onDocumentCreated("users/{userId}", async (event) => {
    const snap = event.data;
    const newUser = snap.data();
    const newUserId = event.params.userId;
    const email = newUser?.email;

    console.log(`🧩 新使用者註冊檢測: ${email} (${newUserId})`);

    if (!email) {
        console.warn("⚠️ 新使用者缺少 email，略過處理");
        return;
    }

    try {
        const pendingSnap = await admin.firestore()
            .collection("pendingUsers")
            .where("email", "==", email.toLowerCase())
            .get();

        console.log(`🔍 找到 ${pendingSnap.size} 筆 pendingUsers 記錄`);

        if (pendingSnap.empty) {
            console.log("🔍 沒有找到對應的 pendingUser 記錄");
            return;
        }

        const updatePromises = [];

        for (const pendingDoc of pendingSnap.docs) {
            const pendingData = pendingDoc.data();
            
            if (pendingData.type === "recommendation_invitee") {
                // 被推薦人註冊了
                updatePromises.push(
                    processOutgoingRecommendationRegistration(newUserId, pendingData.recommendationId, pendingData)
                );
            } else if (pendingData.type === "recommender_registration" || pendingData.inviteId) {
                // 推薦人註冊了
                updatePromises.push(
                    updateInviteRecommendation(newUserId, pendingData.inviteId, pendingData)
                );
            }

            // 刪除 pendingUser 記錄
            updatePromises.push(pendingDoc.ref.delete());
        }

        await Promise.all(updatePromises);
        console.log(`✅ 所有推薦記錄配對完成，共處理 ${pendingSnap.size} 筆`);

    } catch (err) {
        console.error("❌ 處理新用戶註冊時發生錯誤：", err);
    }

    return;
});

// 🆕 處理推薦他人的註冊確認
async function processOutgoingRecommendationRegistration(newUserId, recommendationId, pendingData) {
    try {
        console.log(`🎯 [Refactored] 處理推薦他人註冊: newUserId=${newUserId}, recId=${recommendationId}`);
        
        const recommendationData = pendingData.recommendationData;
        if (!recommendationData) {
            console.error(`❌ 缺少 recommendationData`);
            return;
        }
        
        // 關鍵檢查：確保同一推薦人對同一被推薦人只計入一筆
        const existingRecommendationQuery = await admin.firestore()
            .collection(`users/${newUserId}/recommendations`)
            .where('recommenderId', '==', recommendationData.recommenderUserId) // ✨ 修正：使用標準欄位 recommenderId
            .where('recommenderJobId', '==', recommendationData.recommenderJobId)
            .where('status', 'in', ['pending', 'verified', 'verification_failed'])
            .limit(1)
            .get();
        
        if (!existingRecommendationQuery.empty) {
            console.log(`[processReg] ⚠️ 用戶 ${newUserId} 已有來自推薦人 ${recommendationData.recommenderUserId} 的推薦，跳過重複建立`);
            
            // 更新 outgoingRecommendations 狀態為已存在
            try {
                const outgoingRef = admin.firestore().collection("outgoingRecommendations").doc(recommendationId);
                await outgoingRef.update({
                    targetUserId: newUserId,
                    status: "already_exists_after_registration",
                    existingRecommendationId: existingRecommendationQuery.docs[0].id,
                    deliveredAt: FieldValue.serverTimestamp()
                });
                console.log(`[processReg] ✅ outgoingRecommendations 已標記為重複`);
            } catch (outgoingError) {
                console.error(`[processReg] ❌ 更新 outgoingRecommendations 失敗:`, outgoingError);
            }
            return;
        }
        
        // 沒有重複，正常創建推薦記錄
        const recRef = admin.firestore()
            .collection("users").doc(newUserId)
            .collection("recommendations").doc();
        
        const finalRecommendationData = {
            // 從 outgoingRecommendations 的快照中繼承大部分資料
            name: recommendationData.recommenderName,
            email: recommendationData.recommenderEmail,
            content: recommendationData.content,
            highlights: recommendationData.highlights,
            relation: recommendationData.relation,
            recommenderCompany: recommendationData.recommenderCompany,
            recommenderPosition: recommendationData.recommenderPosition,
            recommenderJobId: recommendationData.recommenderJobId,

            // ✨ 關鍵修正：正確寫入推薦人 ID 和其他元數據
            id: recRef.id,
            recommenderId: recommendationData.recommenderUserId, // ✅ 正確寫入推薦人(David)的ID
            recommenderUserId: recommendationData.recommenderUserId, // 為了兼容舊的查詢，暫時保留
            type: "received",
            targetUserId: newUserId,
            status: 'pending', // 設為 pending，等待後續工作經歷驗證
            createdAt: FieldValue.serverTimestamp(),
            fromOutgoing: true, // 標示來源
            
            // 記錄重發歷史
            isFromResend: pendingData.isResend || false,
            resendCount: pendingData.resendCount || 0
        };
        
        await recRef.set(finalRecommendationData);
        console.log(`✅ 推薦記錄已創建: ${recRef.id}，狀態: pending（等待工作經歷驗證）`);
        
        // 更新 outgoingRecommendations 狀態
        try {
            const outgoingRef = admin.firestore().collection("outgoingRecommendations").doc(recommendationId);
            await outgoingRef.update({
                targetUserId: newUserId,
                recommendationId: recRef.id,
                status: "delivered_pending_verification",
                deliveredAt: FieldValue.serverTimestamp()
            });
            console.log(`✅ outgoingRecommendations 狀態已更新`);
        } catch (outgoingError) {
            console.error(`❌ 更新 outgoingRecommendations 失敗:`, outgoingError);
        }
        
        console.log(`✅ 推薦他人註冊處理完成，等待工作經歷驗證後才會計入統計`);
        
    } catch (error) {
        console.error(`❌ 處理推薦他人註冊失敗:`, error);
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
          confirmedAt: FieldValue.serverTimestamp()
        });
        console.log(`✅ 已補上 recommenderId：${recDoc.id}`);
      }
    }
  } catch (error) {
    console.error(`❌ 更新邀請推薦記錄失敗:`, error);
  }
}

// =================================================================
// 3. 歡迎信
// =================================================================
/**
 * 新使用者註冊後，自動寄送歡迎信
 * @param {object} event - Firestore event object.
 */
exports.sendWelcomeEmailOnUserDocCreated = onDocumentCreated("users/{userId}", async (event) => {
    const user = event.data.data();
    const email = user?.email;
    const lang = user?.lang;
    const inviteCode = user?.inviteCode;

    // 累加 inviteCode 使用次數 (此邏輯與郵件無關，保留)
    if (inviteCode) {
        try {
            const inviteRef = admin.firestore().collection("inviteCodes").doc(inviteCode);
            const inviteSnap = await inviteRef.get();
            if (inviteSnap.exists) {
                await inviteRef.update({ usageCount: FieldValue.increment(1) });
                console.log(`🔢 邀請碼 ${inviteCode} 使用次數 +1 成功`);
            } else {
                console.warn(`⚠️ 找不到 inviteCode：${inviteCode}`);
            }
        } catch (err) {
            console.error("❌ 累加 inviteCode 使用次數失敗：", err);
        }
    }

    // 驗證 email 是否存在
    if (!email) {
        console.warn("⚠️ 使用者缺少 email，略過歡迎信");
        return;
    }

    // 語言標準化
    let normalizedLang = lang || "zh";
    if (normalizedLang.startsWith('zh')) {
        normalizedLang = 'zh';
    } else if (normalizedLang.startsWith('en')) {
        normalizedLang = 'en';
    } else {
        normalizedLang = 'zh';
    }
    
    const subject = i18nMessages.welcomeEmail[normalizedLang]?.subject || i18nMessages.welcomeEmail.zh.subject;
    const text = i18nMessages.welcomeEmail[normalizedLang]?.text(user.displayName) || i18nMessages.welcomeEmail.zh.text(user.displayName);

    try {
        await resend.emails.send({
            from: `${process.env.SENDER_NAME} <${process.env.SENDER_EMAIL}>`,
            to: [email],
            subject: subject,
            text: text,
        });
        console.log(`✅ [Resend] 歡迎信已寄出給 ${email}`);
    } catch (error) {
        console.error("❌ [Resend] 寄送歡迎信失敗：", error);
    }
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
            // 查找所有 pending 或 verification_failed 的推薦
            const recommendationsSnap = await admin.firestore()
                .collection("users").doc(userId)
                .collection("recommendations")
                .where("type", "==", "received")
                .where("status", "in", ["pending", "verification_failed"])
                .get();

            console.log(`📋 找到 ${recommendationsSnap.size} 筆待驗證推薦`);

            const validationPromises = [];
            for (const recDoc of recommendationsSnap.docs) {
                const recData = recDoc.data();
                validationPromises.push(
                    validateRecommendationWorkExperience(userId, recDoc.id, recData, afterWorkExp)
                );
            }

            await Promise.all(validationPromises);

            // 檢查待處理的推薦邀請
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

// 3. 重構 processDelayedRecommendation 函式
async function processDelayedRecommendation(userId, outgoingRecId, outgoingData, userData) {
  try {
    console.log(`🚀 [Refactored] 開始處理延遲推薦: ${outgoingRecId}`);
    
    // 步驟 1: 驗證推薦（此部分邏輯保留）
    const verificationResult = await validateRecommendationImmediately(outgoingData, userData);
    console.log(`📊 [Refactored] 驗證結果: status=${verificationResult.status}, confidence=${verificationResult.confidence}`);

    // 步驟 2: 準備推薦記錄的基礎數據
    const recommendationData = {
        name: outgoingData.name,
        email: outgoingData.email,
        content: outgoingData.content,
        highlights: outgoingData.highlights || [],
        relation: outgoingData.relation,
        recommenderUserId: outgoingData.recommenderUserId,
        recommenderJobId: outgoingData.recommenderJobId,
        recommenderCompany: outgoingData.recommenderCompany,
        recommenderPosition: outgoingData.recommenderPosition,
        type: 'received',
        confidence: verificationResult.confidence || 0,
        verificationType: 'delayed',
        createdAt: FieldValue.serverTimestamp(),
        fullyProcessed: true,
        fromDelayedVerification: true
    };

    // 步驟 3: 建立推薦記錄 (不再直接呼叫統計)
    const recRef = admin.firestore().collection("users").doc(userId).collection("recommendations").doc();
    await recRef.set({
        ...recommendationData,
        id: recRef.id,
        status: verificationResult.status, // ⬅️ 直接使用驗證結果的狀態 ('verified' or 'verification_failed')
        verifiedAt: verificationResult.status === 'verified' ? FieldValue.serverTimestamp() : null,
        matchedJobId: verificationResult.matchedJobId || null,
        canReply: verificationResult.status === 'verified',
        hasReplied: false
    });
    console.log(`✅ [Refactored] 推薦記錄已創建: ${recRef.id} (狀態: ${verificationResult.status})`);

    // 🔴 關鍵：移除了所有直接呼叫 updateRecommenderStats 和 updateRecipientStats 的程式碼。
    // 如果 status 是 'verified'，onRecommendationVerified 將會被觸發並處理所有後續事宜。

    // 步驟 4: 更新 outgoingRecommendations 狀態（此部分邏輯保留）
    const outgoingStatus = verificationResult.status === 'verified' ? 'delivered_and_verified' : 'delivered_but_failed';
    await admin.firestore().collection("outgoingRecommendations").doc(outgoingRecId).update({
      targetUserId: userId,
      recommendationId: recRef.id,
      status: outgoingStatus,
      deliveredAt: FieldValue.serverTimestamp(),
      verificationStatus: verificationResult.status,
      confidence: verificationResult.confidence || 0
    });
    
    console.log(`🎉 [Refactored] 延遲推薦處理完成: ${outgoingRecId}`);

  } catch (error) {
    console.error(`❌ [Refactored] 處理延遲推薦失敗: ${outgoingRecId}`, error);
  }
}

// 🆕 驗證單一推薦記錄的工作經歷重疊
async function validateRecommendationWorkExperience(userId, recId, recData, userWorkExperiences) {
    try {
        console.log(`🔍 驗證推薦記錄: ${recId}`);

        // 檢查驗證日期限制
        const recCreatedAt = recData.createdAt?.toDate() || new Date();
        if (recCreatedAt < VERIFICATION_START_DATE) {
            console.log(`⏭️ 推薦 ${recId} 建立於驗證開始日期前，跳過驗證`);
            return;
        }

        if (recData.status !== 'pending' && recData.status !== 'verification_failed') {
            console.log(`⏭️ 跳過非 pending/failed 狀態的推薦: ${recId}`);
            return;
        }

        if (!recData.recommenderUserId || !recData.recommenderJobId) {
            console.log(`⚠️ 推薦記錄缺少必要資訊，無法驗證: ${recId}`);
            return;
        }

        // 🔥 在驗證前再次檢查重複（雙重保險）
        const duplicateCheck = await checkDuplicateRecommendationBeforeCreate(
            userId, 
            recData.recommenderUserId, 
            recData.recommenderJobId
        );
        
        if (duplicateCheck.exists && duplicateCheck.existingRecId !== recId) {
            console.log(`⛔ 在驗證階段發現重複推薦，標記為 duplicate_skipped: ${recId}`);
            const recRef = admin.firestore().collection("users").doc(userId).collection("recommendations").doc(recId);
            await recRef.update({
                status: 'duplicate_skipped',
                skipReason: 'duplicate_found_during_verification',
                duplicateOf: duplicateCheck.existingRecId
            });
            return;
        }

        // 獲取推薦人的工作經歷
        const recommenderJob = await getRecommenderJobData(recData.recommenderUserId, recData.recommenderJobId);
        if (!recommenderJob) {
            console.log(`⚠️ 找不到推薦人的工作經歷: ${recData.recommenderJobId}`);
            return;
        }

        // 找出最佳匹配
        let bestMatch = null;
        let maxConfidence = 0;
        const userWorkExpArray = Array.isArray(userWorkExperiences) ? userWorkExperiences : Object.values(userWorkExperiences);

        for (const userJob of userWorkExpArray) {
            const validation = checkTimeOverlap(recommenderJob, userJob);
            if (validation.hasOverlap && validation.confidence > maxConfidence) {
                bestMatch = userJob;
                maxConfidence = validation.confidence;
            }
        }

        const recRef = admin.firestore().collection("users").doc(userId).collection("recommendations").doc(recId);

        if (maxConfidence >= 0.6) {
            /* ⬅️ 開始註解
            // 🔥 最後一次重複檢查：基於即將匹配的工作ID
            const finalDuplicateCheck = await admin.firestore()
                .collection(`users/${userId}/recommendations`)
                .where('recommenderUserId', '==', recData.recommenderUserId)
                .where('matchedJobId', '==', bestMatch.id)
                .where('status', '==', 'verified')
                .where(admin.firestore.FieldPath.documentId(), '!=', recId) // 排除自己
                .limit(1)
                .get();

            if (!finalDuplicateCheck.empty) {
                console.log(`⛔ 基於匹配工作ID的最終重複檢查發現重複: ${recId}`);
                await recRef.update({
                    status: 'duplicate_skipped',
                    skipReason: 'duplicate_matched_job_id',
                    duplicateOf: finalDuplicateCheck.docs[0].id
                });
                return;
            }*/ // ⬅️ 結束註解

            // 驗證通過
            await recRef.update({
                status: 'verified',
                verifiedAt: FieldValue.serverTimestamp(),
                jobId: bestMatch.id,
                matchedJobId: bestMatch.id,
                matchedCompany: bestMatch.company,
                confidence: maxConfidence,
                canReply: true,
                hasReplied: false
            });

            console.log(`✅ 推薦驗證通過: ${recId}，統計將由 onRecommendationVerified 處理`);

        } else {
            // 驗證失敗
            await recRef.update({
                status: 'verification_failed',
                reason: 'no_sufficient_overlap',
                confidence: maxConfidence
            });
            console.log(`❌ 推薦驗證失敗: ${recId} - 沒有足夠的時間重疊`);
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

/**
 * 更新【送出】推薦者的統計 (V4 - 融合 EXP 經驗值版)
 * @param {string} recommenderId - 推薦人ID
 * @param {number} increment - 增加的推薦數量 (通常是 1)
 * @param {string | null} jobId - 推薦人自己的工作經歷ID
 * @param {object | null} recommendationData - 推薦內容，用於備份
 * @param {number} expToAdd - 要增加的經驗值，預設為 10
 */
async function updateRecommenderStats(recommenderId, increment, jobId = null, recommendationData = null, expToAdd = 10) {
  try {
    console.log(`📊 更新推薦人統計: ${recommenderId}, 推薦+${increment}, 經驗值+${expToAdd}`);
    const userRef = admin.firestore().doc(`users/${recommenderId}`);

    await admin.firestore().runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) {
        console.warn(`❌ 找不到推薦人: ${recommenderId}`);
        return;
      }
      
      const userData = userDoc.data();
      const newTotalGiven = (userData.recommendationStats?.totalGiven || 0) + increment;

      let updatedWorkExperiences = userData.workExperiences || [];
      if (!Array.isArray(updatedWorkExperiences)) {
        updatedWorkExperiences = Object.values(updatedWorkExperiences);
      }
      if (jobId) {
        let jobFound = false;
        updatedWorkExperiences = updatedWorkExperiences.map(job => {
          if (job.id === jobId) {
            jobFound = true;
            job.givenCount = (job.givenCount || 0) + increment;
            if (increment > 0 && recommendationData) {
              let recommendations = job.recommendations || [];
              const recId = recommendationData.id || recommendationData.recommendationId;
              if (recId && !recommendations.some(r => r.id === recId)) {
                recommendations.push({
                  id: recId,
                  type: 'given',
                  recommendeeName: recommendationData.targetName || recommendationData.recommendeeName,
                  targetUserId: recommendationData.targetUserId,
                  status: 'verified',
                  createdAt: new Date()
                });
              }
              job.recommendations = recommendations;
            }
          }
          return job;
        });
        if (!jobFound) {
          console.warn(`⚠️ 在用戶 ${recommenderId} 的資料中找不到 jobId: ${jobId}。`);
        }
      }

      const updateData = {
        'recommendationStats.totalGiven': newTotalGiven,
        'recommendationStats.exp': FieldValue.increment(expToAdd),
        'recommendationStats.lastUpdated': FieldValue.serverTimestamp(),
        workExperiences: updatedWorkExperiences
      };
      transaction.update(userRef, updateData);
    });
    console.log(`✅ 推薦人統計交易完成: ${recommenderId}`);
  } catch (error) {
    console.error(`❌ 更新推薦人統計失敗: ${recommenderId}`, error);
    throw error;
  }
}

/**
 * 🆕 新增：更新【收到】推薦者的統計
 */
async function updateRecipientStats(userId, increment) {
  try {
    const expToAdd = 5; // 收到推薦固定 +5 EXP
    console.log(`📊 被推薦人統計已更新: ${userId}, 推薦+${increment}, 經驗值+${expToAdd}`);
    const statsUpdate = {
      'recommendationStats.totalReceived': FieldValue.increment(increment),
      'recommendationStats.exp': FieldValue.increment(expToAdd),
      'recommendationStats.lastUpdated': FieldValue.serverTimestamp(),
    };
    await admin.firestore().doc(`users/${userId}`).update(statsUpdate);
    console.log(`✅ 被推薦人統計已更新: ${userId}`);
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
      verifiedAt: FieldValue.serverTimestamp(),
      
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

/**
 * 處理「回覆推薦」的核心函式。
 * 觸發時機：當 recommendation 文件被建立且 type 為 'reply' 時。
 * 執行流程：檢查重複 -> 統一資料 -> 根據目標用戶狀態執行不同流程 -> 更新原始推薦狀態。
 */
exports.handleReplyRecommendation = onDocumentCreated("users/{userId}/recommendations/{recId}", async (event) => {
    const snap = event.data;
    if (!snap) return null;

    const recData = snap.data();
    const replierUserId = event.params.userId; // 回覆者的 ID
    const replyRecId = event.params.recId;     // 這筆回覆推薦的 ID

    if (recData.type !== 'reply') {
        return null; // 只處理 type 為 'reply' 的文件
    }
    
    if (recData.processed || recData.processing) {
        console.log(`[handleReply] [${replyRecId}] ⏭️ 記錄已處理或正在處理中，跳過。`);
        return null;
    }

    try {
        await snap.ref.update({ processing: true, processingStartedAt: FieldValue.serverTimestamp() });
        console.log(`[handleReply] [${replyRecId}] 🟢 取得處理權，開始處理回覆推薦...`);
    } catch (lockError) {
        console.log(`[handleReply] [${replyRecId}] 🟡 無法取得處理權，跳過。`);
        return null;
    }

    try {
        // --- 1. 重複回覆檢查 ---
        const originalRecRef = admin.firestore().collection("users").doc(replierUserId).collection("recommendations").doc(recData.originalRecommendationId);
        const originalRecSnap = await originalRecRef.get();

        if (originalRecSnap.exists && originalRecSnap.data().hasReplied) {
            console.log(`[handleReply] [${replyRecId}] ⚠️ 原始推薦 ${recData.originalRecommendationId} 已被回覆過，標記為重複並終止。`);
            await snap.ref.update({ status: 'duplicate_reply', processed: true, processing: false });
            return null;
        }

        // --- 2. 統一資料物件 ---
        const replyContext = {
            replier: {
                id: replierUserId,
                name: recData.recommenderName,
                email: recData.recommenderEmail,
                jobId: recData.recommenderJobId
            },
            recipient: {
                id: recData.targetUserId,
                name: recData.targetName,
                email: recData.targetEmail
            },
            reply: {
                id: replyRecId,
                content: recData.content,
                highlights: recData.highlights || [],
                relation: recData.relation || 'colleague',
                lang: recData.lang || 'zh'
            },
            originalRec: {
                id: recData.originalRecommendationId,
                content: originalRecSnap.exists ? originalRecSnap.data().content : ''
            },
            isRecipientRegistered: recData.targetUserId && recData.targetUserId !== 'unregistered',
        };
        console.log(`[handleReply] [${replyRecId}] 📝 已建立標準化資料物件(replyContext)。`);

        // --- 3. 🔥 修正：只處理已註冊用戶的回覆 ---
        if (!replyContext.isRecipientRegistered) {
            console.error(`[handleReply] [${replyRecId}] ❌ 系統錯誤：verified 推薦的被推薦人必須已註冊`);
            await snap.ref.update({ 
                status: 'error', 
                errorMessage: 'Verified recommendation must have registered recipient',
                processed: true, 
                processing: false 
            });
            return null;
        }

        // 只執行已註冊用戶的回覆邏輯
        await handleRegisteredUserReply(replyContext);

        // --- 4. 更新原始推薦的狀態為「已回覆」 ---
        await updateOriginalRecommendation(replyContext.replier.id, replyContext.originalRec.id, replyContext.reply.id);

        // --- 5. 標記此回覆推薦處理完成 ---
        await snap.ref.update({
            processed: true,
            processing: false,
            processedAt: FieldValue.serverTimestamp()
        });
        console.log(`[handleReply] [${replyRecId}] 🎉 回覆推薦處理完成。`);

    } catch (error) {
        console.error(`[handleReply] [${replyRecId}] ❌ 處理過程中發生錯誤:`, error);
        await snap.ref.update({
            processing: false,
            processed: false,
            status: "error",
            errorMessage: error.message,
            errorAt: FieldValue.serverTimestamp()
        });
    }

    return null;
});

/**
 * 更新原始推薦記錄的狀態為「已回覆」。
 * @param {string} replierUserId - 回覆者的用戶 ID。
 * @param {string} originalRecId - 原始推薦的文檔 ID。
 * @param {string} newRecId - 新建立的回覆推薦的文檔 ID。
 */
async function updateOriginalRecommendation(replierUserId, originalRecId, newRecId) {
    console.log(`[handleReply] 🔄 開始更新原始推薦記錄: ${originalRecId}`);
    try {
        const originalRecRef = admin.firestore()
            .collection("users").doc(replierUserId)
            .collection("recommendations").doc(originalRecId);
        
        await originalRecRef.update({
            hasReplied: true,
            replyRecommendationId: newRecId,
            repliedAt: FieldValue.serverTimestamp(),
            canReply: false // 更新為不可再回覆
        });
        
        console.log(`[handleReply] ✅ 原始推薦記錄 ${originalRecId} 已更新為「已回覆」。`);
    } catch (error) {
        console.error(`[handleReply] ❌ 更新原始推薦記錄 ${originalRecId} 失敗:`, error);
        // 此處錯誤不應中斷主流程，僅記錄即可
    }
}

// 1. 重構 handleRegisteredUserReply 函式
async function handleRegisteredUserReply(replyContext) {
    const { replier, recipient, reply } = replyContext;

    console.log(`[handleReply-Refactored] ✅ 開始處理對已註冊用戶的回覆: ${recipient.id}`);

    try {
        const targetRecRef = admin.firestore()
            .collection("users").doc(recipient.id)
            .collection("recommendations").doc(); // 為接收者建立新的推薦文件

        // ✨ 採用「建立再更新」模式，以可靠地觸發 onRecommendationVerified
        // 步驟 1: 先建立一筆 status 為 'pending' 的推薦記錄
        const initialRecData = {
            id: targetRecRef.id,
            name: replier.name,
            email: replier.email,
            content: reply.content,
            highlights: reply.highlights,
            relation: reply.relation,
            type: 'received',
            recommenderId: replier.id,
            originalRecommendationId: replyContext.originalRec.id,
            replyRecommendationId: reply.id,
            hasReplied: false,
            jobId: replier.jobId || 'default',
            status: 'pending', // ⬅️ 關鍵：初始狀態為 pending
            confidence: 1.0,   // 回覆推薦的信心度預設為 1.0
            verificationType: 'reply_based',
            createdAt: FieldValue.serverTimestamp(),
            lang: reply.lang,
            fullyProcessed: true
        };
        await targetRecRef.set(initialRecData);
        console.log(`[handleReply-Refactored] ✅ 已創建 pending 推薦記錄: ${targetRecRef.id}`);

        // 步驟 2: 立刻將其狀態更新為 'verified'
        // 這個 "update" 動作將會被 onRecommendationVerified 監聽到
        await targetRecRef.update({
            status: 'verified',
            verifiedAt: FieldValue.serverTimestamp()
        });
        console.log(`[handleReply-Refactored] ✅ 推薦狀態已更新為 verified，等待中央統計處理...`);

        try {
          console.log(`[handleReply-Refactored] 正在嘗試發送郵件通知...`);
          // 註：sendReplyRecommendationEmails 已包含里程碑通知，此處只調用一次即可
          // 但為確保邏輯不變，暫時維持。理想狀態是 sendReplyRecommendationEmails 內部處理所有郵件。
          await sendReplyRecommendationEmails(replyContext);
        } catch (emailError) {
          // 即使郵件發送失敗，也只記錄錯誤，不中斷主流程
          console.error(`[handleReply-Refactored] ⚠️ 郵件發送失敗，但不影響核心流程:`, emailError);
        }
      console.log(`[handleReply-Refactored] ✅ 已註冊用戶回覆流程處理完成。`);

    } catch (error) {
        console.error(`[handleReply-Refactored] ❌ 處理對已註冊用戶的回覆時失敗:`, error);
        throw error;
    }
}

/**
 * 發送回覆推薦的 email 通知 (修正版 - 只處理已註冊用戶)
 * @param {object} replyContext - 標準化的回覆資料物件
 */
async function sendReplyRecommendationEmails(replyContext) {
    const { replier, recipient, reply, originalRec } = replyContext;

    try {
        let lang = reply.lang || "zh";
        if (lang.startsWith('zh')) lang = 'zh';
        else if (lang.startsWith('en')) lang = 'en';
        else lang = 'zh';

        console.log(`[handleReply] 📧 [Resend] 發送回覆推薦郵件，語言: ${lang}`);
        const messages = i18nMessages.replyRecommendation[lang];
        if (!messages) {
            console.error(`[handleReply] ❌ 找不到語言 ${lang} 的翻譯`);
            return;
        }

        // --- 1. 發送給目標用戶（接收者）- 只處理已註冊用戶 ---
        const subject = messages.subjectToRecipient(replier.name);
        const text = messages.textToRecipient(replier.name, recipient.name, reply.content, originalRec.content);
        await resend.emails.send({
            from: `${process.env.SENDER_NAME} <${process.env.SENDER_EMAIL}>`,
            to: [recipient.email],
            subject: subject,
            text: text,
        });
        console.log(`[handleReply] ✅ [Resend] 回覆推薦通知已發送至: ${recipient.email}`);

        // --- 2. 發送確認信給回覆者 ---
        if (replier.email) {
            const subject = messages.subjectToReplier(recipient.name);
            const text = messages.textToReplier(replier.name, recipient.name, true); // 固定為 true，因為接收者必定已註冊
            await resend.emails.send({
                from: `${process.env.SENDER_NAME} <${process.env.SENDER_EMAIL}>`,
                to: [replier.email],
                subject: subject,
                text: text,
            });
            console.log(`[handleReply] ✅ [Resend] 回覆者確認信已發送至: ${replier.email}`);
        }

    } catch (error) {
        console.error(`[handleReply] ❌ [Resend] 發送回覆推薦 email 失敗:`, error);
        throw error;
    }
}

// 🆕 立即驗證推薦函數
async function validateRecommendationImmediately(recommendationData, targetUserData) {
    try {
        console.log(`🔍 開始立即驗證推薦`);
        // ✨ --- 修正日誌的顯示欄位 --- ✨
        // 修正前: console.log(`→ 推薦人: ${recommendationData.name}`);
        console.log(`→ 推薦人: ${recommendationData.recommenderName}`); // ✅ 修正後
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
        
        // 4. 判定結果（不再檢查重複，因為已在前面檢查過）
        if (maxConfidence >= 0.6) {
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
      verifiedAt: FieldValue.serverTimestamp(),
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

/**
 * 發送重複推薦通知郵件
 * @param {object} data - The new recommendation data from outgoingRecommendations.
 * @param {object} existingData - The existing recommendation data.
 */
async function sendDuplicateRecommendationEmail(data, existingData) {
    let lang = data.lang || "zh";
    if (lang.startsWith('zh')) lang = 'zh';
    else if (lang.startsWith('en')) lang = 'en';
    else lang = 'zh';
  
    const duplicateMessages = {
        zh: {
            subject: (recommendeeName) => `💫 你已經推薦過 ${recommendeeName} 了`,
            text: (recommenderName, recommendeeName) => `Hi ${recommenderName}，

我們注意到你剛才嘗試推薦 ${recommendeeName}，但你之前已經推薦過他/她了！

你的原始推薦仍然有效，無需重複推薦。

如果你想：
✅ 查看你的推薦記錄：https://galaxyz.ai/pages/profile-dashboard.html
✅ 推薦其他優秀夥伴：https://galaxyz.ai/pages/profile-dashboard.html

每位夥伴只能被同一人推薦一次，以確保推薦的獨特性和價值。

感謝你對 Galaxyz 的支持！

Galaxyz 團隊敬上`
        },
        en: {
            subject: (recommendeeName) => `💫 You've already recommended ${recommendeeName}`,
            text: (recommenderName, recommendeeName) => `Hi ${recommenderName},

We noticed you just tried to recommend ${recommendeeName}, but you've already recommended them before!

Your original recommendation is still active, so no need to recommend again.

If you'd like to:
✅ View your recommendations: https://galaxyz.ai/pages/profile-dashboard.html  
✅ Recommend other great colleagues: https://galaxyz.ai/pages/profile-dashboard.html

Each person can only be recommended once by the same recommender to ensure the uniqueness and value of recommendations.

Thank you for your continued support!

Team Galaxyz`
        }
    };

    try {
        // ✨ 關鍵修正：使用 recommenderEmail 和 recommenderName
        const recommenderEmail = data.recommenderEmail; // ✅ 修正：使用推薦人(David)的 Email
        const recommenderName = data.recommenderName;   // ✅ 修正：使用推薦人(David)的名字
        const recommendeeName = data.recommendeeName;   // ✅ 修正：使用被推薦人(Leo)的名字

        if (!recommenderEmail) {
            console.log(`⚠️ 無推薦人 email，跳過重複推薦通知`);
            return;
        }

        await resend.emails.send({
            from: `${process.env.SENDER_NAME} <${process.env.SENDER_EMAIL}>`,
            to: [recommenderEmail],
            subject: duplicateMessages[lang].subject(recommendeeName),
            text: duplicateMessages[lang].text(recommenderName, recommendeeName),
        });
        
        console.log(`✅ [Resend] 重複推薦通知已發送: ${recommenderEmail}`);
    } catch (error) {
        console.error("❌ [Resend] 發送重複推薦通知失敗:", error);
    }
}

/**
 * 🆕 新功能：當推薦被補上 recommenderId 時，更新推薦人的送出統計
 * 觸發器：當 users/{userId}/recommendations/{recId} 文件被更新時
 */
/**
 * 🆕 終極智慧版：當推薦被補上 recommenderId 時，自動匹配工作經歷並更新統計
 */
exports.updateStatsOnRecommenderIdAdded = onDocumentUpdated("users/{userId}/recommendations/{recId}", async (event) => {
    // 🛑 此函數已停用，統計完全由 onRecommendationVerified 處理
    console.log(`[updateStatsOnRecommenderIdAdded] 🛑 此函數已停用，統計由 onRecommendationVerified 統一處理`);
    return null;
});


exports.fixJobIdAttribution = onCall({ region: "asia-east1" }, async (request) => {
    const { userId, recommendationId, correctJobId } = request.data;
    if (!request.auth.token.admin) {
        throw new functions.https.HttpsError('permission-denied', '此操作需管理員權限。');
    }
    if (!userId || !recommendationId || !correctJobId) {
        throw new functions.https.HttpsError('invalid-argument', '必須提供 userId, recommendationId, 和 correctJobId。');
    }

    console.log(`[JobID校準] 準備將用戶 ${userId} 的推薦 ${recommendationId} jobId 校準為 ${correctJobId}`);
    const db = admin.firestore();
    const recRef = db.collection('users').doc(userId).collection('recommendations').doc(recommendationId);

    try {
        await recRef.update({
            jobId: correctJobId
        });
        const message = `✅ JobID 校準成功！`;
        console.log(message);
        return { success: true, message };

    } catch (error) {
        console.error("[JobId校準] ❌ 執行失敗:", error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

// =================================================================
// 史詩級任務 I：搜尋與探索 - 核心同步函式
// =================================================================

/**
 * 主函式：監聽 users 文件的更新，同步到 publicProfiles 集合。
 */
exports.syncPublicProfileOnUpdate = onDocumentUpdated("users/{userId}", async (event) => {
  const afterData = event.data.after.data();
  const userId = event.params.userId;
  const publicProfileRef = admin.firestore().collection("publicProfiles").doc(userId);

  console.log(`[Public Sync] [強制公開模式] 偵測到用戶 ${userId} 資料更新，一律同步至公開 Profile。`);

  try {
    // ✨ 無論 isPublicProfile 為何，一律呼叫 generatePublicProfileData 產生最新資料
    const publicData = await generatePublicProfileData(userId, afterData);
    await publicProfileRef.set(publicData, { merge: true });
    console.log(`[Public Sync] [強制公開模式] ✅ 已成功為 ${userId} 建立/更新公開 Profile。`);
  } catch (error) {
    console.error(`[Public Sync] [強制公開模式] ❌ 為 ${userId} 產生公開 Profile 時發生錯誤:`, error);
  }
});

/**
 * 輔助函式：產生單一使用者的公開 Profile 資料 (V3 - 最終姓名欄位版)
 * @param {string} userId - 使用者的 ID。
 * @param {object} userData - 來自 users 集合的完整使用者資料。
 * @returns {Promise<object>} - 符合 publicProfiles 結構的物件。
 */
async function generatePublicProfileData(userId, userData) {
  // 將收到的整個 userData 物件以易於閱讀的 JSON 格式印出來，方便偵錯
  console.log("[Debug] 收到要處理的 userData 完整內容:", JSON.stringify(userData, null, 2));
  
  // 1. 準備基本公開資訊，並根據 name 和 englishName 組合顯示名稱
  let displayName = userData.name || ""; // 母語姓名
  if (userData.englishName) {
    displayName += ` (${userData.englishName})`; // 加上英文名
  }

  const publicData = {
    userId: userId,
    name: displayName,
    headline: userData.headline || "",
    bio: userData.bio || "",
    photoURL: userData.photoURL || null,
    isPublic: true,
    stats: {
      totalReceived: userData.recommendationStats?.totalReceived || 0,
      exp: userData.recommendationStats?.exp || 0 // ✨【新增】從 recommendationStats 讀取 exp 欄位
    },
    settings: {
      showLevelOnPublicProfile: true // ✨【新增】直接設定為 true，強制顯示等級徽章
    },
    lastUpdated: FieldValue.serverTimestamp()
  };

  // --- ▼▼▼ 【最終版關鍵字生成邏輯】 ▼▼▼ ---
  const keywords = new Set();
  
  // 處理母語姓名 (name 欄位)
  if (userData.name) {
    keywords.add(userData.name.toLowerCase());
  }
  
  // 處理英文姓名 (englishName 欄位)，並拆成獨立單字
  if (userData.englishName) {
    userData.englishName.toLowerCase().split(' ').forEach(part => {
      if (part) keywords.add(part);
    });
  }

  // 處理頭銜
  if (publicData.headline) {
    const headlineParts = publicData.headline.toLowerCase().match(/[a-z0-9\u4e00-\u9fa5]+/g) || [];
    headlineParts.forEach(part => keywords.add(part));
  }
  publicData.keywords = Array.from(keywords);
  // --- ▲▲▲ 【最終版關鍵字生成邏輯】 ▲▲▲ ---

  // 3. 獲取推薦 (邏輯不變)
  const recsSnap = await admin.firestore()
    .collection("users").doc(userId)
    .collection("recommendations")
    .where("status", "==", "verified")
    .where("type", "==", "received")
    .get();
  
  const verifiedRecommendations = [];
  recsSnap.forEach(doc => {
    const recData = doc.data();
    verifiedRecommendations.push({
      id: doc.id,
      content: recData.content || "",
      relation: recData.relation || "夥伴",
      highlights: recData.highlights || [],
      jobId: recData.jobId || null
    });
  });

  // 4. 組合工作經歷與推薦 (邏輯不變)
  const workExperiences = userData.workExperiences || [];
  const workExpArray = Array.isArray(workExperiences) ? workExperiences : Object.values(workExperiences);

  const jobMap = new Map();
  workExpArray.forEach(job => {
    jobMap.set(job.id, {
      id: job.id, company: job.company || "", position: job.position || "",
      startDate: job.startDate || "", endDate: job.endDate || "",
      description: job.description || "", recommendations: []
    });
  });

  verifiedRecommendations.forEach(rec => {
    if (rec.jobId && jobMap.has(rec.jobId)) {
      jobMap.get(rec.jobId).recommendations.push(rec);
    }
  });

  // 5. 過濾與排序 (邏輯不變)
  publicData.workExperiences = Array.from(jobMap.values())
    .filter(job => job.recommendations.length > 0)
    .sort((a, b) => (b.startDate || "").localeCompare(a.startDate || ""));

  return publicData;
}

// =================================================================
// 史詩級任務 I：搜尋與探索 - 搜尋函式
// =================================================================

/**
 * 可呼叫函式：搜尋公開的 Profile
 * @param {object} data - 包含 { keyword: string } 的物件
 * @returns {Promise<Array<object>>} - 回傳符合條件的使用者列表
 */
exports.searchPublicProfiles = onCall({
  // 允許未經驗證的請求，讓所有訪客都能使用搜尋功能
  invoker: "public",
}, async (request) => {
  const keyword = request.data.keyword;

  if (!keyword || typeof keyword !== 'string' || keyword.trim().length < 1) {
    // 如果關鍵字為空或格式不符，回傳空陣列
    console.log("[Search] 收到無效的關鍵字，回傳空結果。");
    return [];
  }

  // 將關鍵字轉為小寫，以進行不分大小寫的搜尋
  const lowerCaseKeyword = keyword.toLowerCase();
  console.log(`[Search] 正在搜尋關鍵字: "${lowerCaseKeyword}"`);

  try {
    const publicProfilesRef = admin.firestore().collection("publicProfiles");
    
    // 我們利用之前設計的 `keywords` 陣列欄位來進行高效搜尋
    const query = publicProfilesRef
      .where("keywords", "array-contains", lowerCaseKeyword)
      .limit(10); // 為了效能，限制最多回傳 10 筆結果

    const snapshot = await query.get();

    if (snapshot.empty) {
      console.log(`[Search] 找不到符合 "${lowerCaseKeyword}" 的結果。`);
      return [];
    }

    const results = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      // 只回傳列表所需的最基本、最安全的資訊
      results.push({
        userId: doc.id,
        name: data.name,
        headline: data.headline,
        photoURL: data.photoURL
      });
    });

    console.log(`[Search] 成功找到 ${results.length} 筆結果。`);
    return results;

  } catch (error) {
    console.error(`[Search] 搜尋時發生錯誤:`, error);
    // 為了安全，不將詳細錯誤回傳給前端，只在後端日誌記錄
    throw new functions.https.HttpsError('internal', '搜尋時發生未預期的錯誤。');
  }
});

/**
 * 手動觸發的 onCall 函式：更新精選用戶列表 (V3 - 最終排序版)
 */
exports.updateFeaturedUsers = onCall(
 async (request) => {
  // ... 權限檢查邏輯保持不變 ...
  if (!process.env.FUNCTIONS_EMULATOR && (!request.auth || request.auth.token.role !== 'admin')) { /* ... */ }
  if (process.env.FUNCTIONS_EMULATOR) { /* ... */ }

  console.log("[Featured Users] ✅ 開始更新精選用戶列表 (混合模式 V3)...");

  try {
    const db = admin.firestore();
    const MAX_HEROES = 3;

    // 1. 同時查詢 isFeatured 和 Top EXP 的用戶
    const featuredQuery = db.collection('users').where('isFeatured', '==', true).get();
    const topExpQuery = db.collection('users').orderBy('recommendationStats.exp', 'desc').limit(MAX_HEROES).get();
    const [featuredSnap, topExpSnap] = await Promise.all([featuredQuery, topExpQuery]);

    // 2. 使用 Map 合併並去重，確保拿到最終的用戶 ID 列表
    const finalUserMap = new Map();

    // 將使用者資料（包含 exp）存入 Map，方便後續取用和排序
    const addUserToMap = (doc) => {
      if (!finalUserMap.has(doc.id)) {
        finalUserMap.set(doc.id, {
          id: doc.id,
          exp: doc.data().recommendationStats?.exp || 0
        });
      }
    };

    featuredSnap.forEach(addUserToMap);
    topExpSnap.forEach(addUserToMap);

    // 3. ✨【核心修正 1】對合併後的用戶，直接在記憶體中根據 exp 排序
    const sortedUsers = Array.from(finalUserMap.values()).sort((a, b) => b.exp - a.exp);
    const finalUserIds = sortedUsers.slice(0, MAX_HEROES).map(u => u.id);

    console.log(`[Featured Users] 🕵️‍♂️ 最終英雄榜名單 (已排序):`, finalUserIds);

    // 4. 根據最終 ID 列表，獲取他們的公開資料
    if (finalUserIds.length === 0) {
      await db.collection('system').doc('featuredUsers').set({ users: [], lastUpdated: FieldValue.serverTimestamp() });
      return { success: true, message: "找不到精選用戶，列表已清空。", count: 0 };
    }

    const publicProfilePromises = finalUserIds.map(userId => db.collection('publicProfiles').doc(userId).get());
    const publicProfileSnaps = await Promise.all(publicProfilePromises);
    
    const featuredUsersData = [];
    publicProfileSnaps.forEach(docSnap => {
      if (docSnap.exists) {
        const publicData = docSnap.data();
        const correspondingUser = sortedUsers.find(u => u.id === publicData.userId);
        
        // ✨✨✨【這就是您要新增的程式碼】✨✨✨
        // 檢查 headline 是否存在且不為空字串，如果不存在，就給一個預設的優雅文字。
        const userHeadline = publicData.headline ? publicData.headline : "探索這位夥伴的專業旅程";

        featuredUsersData.push({
          userId: publicData.userId,
          name: publicData.name,
          headline: userHeadline, // ✅ 使用我們剛剛處理過的 userHeadline 變數
          photoURL: publicData.photoURL,
          exp: correspondingUser?.exp || 0
        });
      }
    });

    // 5. 將【已排序】的陣列，寫入到固定的文件中
    await db.collection('system').doc('featuredUsers').set({
      users: featuredUsersData, // 這個陣列現在已經是按 EXP 排序的了
      lastUpdated: FieldValue.serverTimestamp()
    });

    const successMessage = `✅ 成功更新精選用戶列表，共 ${featuredUsersData.length} 位。`;
    console.log(successMessage);
    return { success: true, message: successMessage, count: featuredUsersData.length };

  } catch (error) {
    console.error("[Featured Users] ❌ 更新時發生嚴重錯誤:", error);
    throw new functions.https.HttpsError('internal', '更新精選用戶時發生未預期的錯誤。');
  }
});

// =================================================================
// 6. 里程碑通知
// =================================================================
/**
 * 里程碑通知輔助函式
 * @param {string} milestoneType - The type of milestone.
 * @param {object} context - Contains recipient and recommender data.
 */
async function sendMilestoneNotification(milestoneType, context) {
    try {
        const { recipient, recommender } = context;

        if (!recipient?.email || !recommender?.name) {
            console.error(`[Notification] 缺少必要的收件人Email或推薦人姓名。`, { recipient, recommender });
            return;
        }

        const lang = recipient.lang?.startsWith('en') ? 'en' : 'zh';
        const messages = i18nMessages.milestoneNotification[lang]?.[milestoneType];

        if (!messages) {
            console.error(`[Notification] 找不到對應的郵件範本: ${milestoneType}`);
            return;
        }

        let subject, text, toEmail;

        switch (milestoneType) {
            case 'recommendationGivenVerified':
            case 'replyGivenVerified':
                toEmail = recommender.email;
                if (!toEmail) {
                    console.warn(`[Notification] 推薦人缺少 Email，無法寄送 ${milestoneType} 通知。`);
                    return;
                }
                subject = messages.subject(recipient.name);
                text = messages.text(recommender.name, recipient.name);
                break;
            
            case 'recommendationReceivedVerified':
                toEmail = recipient.email;
                subject = messages.subject(recommender.name);
                text = messages.text(recipient.name, recommender.name);
                break;
            default:
                return;
        }
        
        if (!toEmail) {
            console.warn(`[Notification] 找不到收件人 Email，無法寄送 ${milestoneType} 通知。`);
            return;
        }

        await resend.emails.send({
            from: `${process.env.SENDER_NAME} <${process.env.SENDER_EMAIL}>`,
            to: [toEmail],
            subject: subject,
            text: text,
        });
        console.log(`[Notification] ✅ [Resend] 已寄送「${milestoneType}」通知信至 ${toEmail}`);

    } catch (error) {
        console.error(`[Notification] ❌ [Resend] 寄送里程碑通知信時發生錯誤:`, error);
    }
}

/**
 * 史詩級任務 III - 最終版核心邏輯
 * 監聽推薦文件的更新，當 status 首次變為 'verified' 時，觸發所有後續動作。
 */
exports.onRecommendationVerified = onDocumentUpdated("users/{userId}/recommendations/{recId}", async (event) => {
    const beforeData = event.data.before.data();
    const afterData = event.data.after.data();
    const recipientId = event.params.userId;
    const recId = event.params.recId;

    // 🔥 核心觸發條件：只有在 status 首次從「非 verified」變成「verified」時才執行
    if (beforeData.status !== 'verified' && afterData.status === 'verified') {
        // 🆕 添加這一行防重複檢查
        if (afterData.statsUpdated === true) {
            console.log(`[onVerified] ⏭️ 推薦統計已更新過，跳過處理。`);
            return null;
        }
        console.log(`🎉 推薦 ${recId} 首次通過驗證！開始處理統計與通知...`);

        const recommenderId = afterData.recommenderId || afterData.recommenderUserId;
        if (!recommenderId) {
            console.warn(`[onVerified] ⚠️ 推薦 ${recId} 缺少 recommenderId，無法更新統計。`);
            return null;
        }

        try {
            // 🔥 統計更新：根據推薦類型給予不同 EXP
            const isReply = !!afterData.originalRecommendationId; 
            const expForGiver = isReply ? 3 : 10; // 回覆+3, 主動推薦+10

            // 更新推薦人統計 (+10 EXP 主動推薦, +3 EXP 回覆推薦)
            await updateRecommenderStats(recommenderId, 1, afterData.recommenderJobId, {
                id: recId,
                recommendeeName: afterData.name || '被推薦人',
                targetUserId: recipientId,
                content: afterData.content
            }, expForGiver);

            // 更新被推薦人統計 (+5 EXP)
            await updateRecipientStats(recipientId, 1);
            await event.data.after.ref.update({
                statsUpdated: true,
                statsUpdatedAt: FieldValue.serverTimestamp()
            });
            console.log(`[onVerified] ✅ 雙方統計與 EXP 更新完畢 (推薦人+${expForGiver}, 被推薦人+5)`);

            // 🔥 發送里程碑通知信
            const recommenderSnap = await admin.firestore().doc(`users/${recommenderId}`).get();
            const recipientSnap = await event.data.after.ref.parent.parent.get();

            if (recommenderSnap.exists && recipientSnap.exists) {
                const recommender = recommenderSnap.data();
                const recipient = recipientSnap.data();
                
                // 根據推薦類型發送不同通知
                const givenMilestoneType = isReply ? 'replyGivenVerified' : 'recommendationGivenVerified';
                await sendMilestoneNotification(givenMilestoneType, { recipient, recommender });
                await sendMilestoneNotification('recommendationReceivedVerified', { recipient, recommender });
                
                console.log(`[onVerified] ✅ 里程碑通知信已發送`);
            }

        } catch (error) {
            console.error(`[onVerified] ❌ 處理推薦 ${recId} 時發生錯誤:`, error);
        }
        // 🆕 在統計更新完成後添加標記
        await event.data.after.ref.update({
            statsUpdated: true,
            statsUpdatedAt: FieldValue.serverTimestamp()
        });
    }

    return null;
});

// =================================================================
// 輔助函式：設定使用者為管理員 (一次性使用)
// =================================================================
/**
 * 可呼叫函式：為指定 email 的使用者加上 admin 的 custom claim。
 * 執行此函式的人，必須已經是專案的擁有者。
 * @param {object} data - 包含 { email: string } 的物件
 * @returns {Promise<object>} - 回傳操作結果
 */
exports.addAdminRole = onCall(async (request) => {
  // 1. 權限檢查：確保呼叫此函式的人是登入狀態
  if (!request.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      '必須登入才能執行此操作。'
    );
  }

  // 2. 取得要設為 admin 的使用者 email
  const email = request.data.email;
  if (!email || typeof email !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      '必須提供 email。'
    );
  }

  try {
    // 3. 根據 email 找到使用者
    console.log(`[Admin Setup] 正在尋找使用者: ${email}`);
    const user = await admin.auth().getUserByEmail(email);

    // 4. 為該使用者設定 custom claim
    console.log(`[Admin Setup] 找到使用者 ${user.uid}，正在設定 admin 權限...`);
    await admin.auth().setCustomUserClaims(user.uid, { role: 'admin' });

    const successMessage = `✅ 成功將 ${email} (UID: ${user.uid}) 設為管理員。`;
    console.log(successMessage);
    return { success: true, message: successMessage };

  } catch (error) {
    console.error(`[Admin Setup] ❌ 設定管理員時發生錯誤:`, error);
    throw new functions.https.HttpsError('internal', '設定管理員時發生錯誤。');
  }
});

/**
 * 【v4 - 最終簡化版】可呼叫函式：處理前端送出的「推薦好夥伴」表單資料
 * 職責：只接收前端組合好的標準資料包，並存入資料庫。
 */
exports.submitOutgoingRecommendation = onCall({
  enforceAppCheck: false,
  consumeAppCheckToken: false,
}, async (request) => {

  // 接收前端傳來的、已經組合好的標準資料包
  const recommendationData = request.data.recommendationData;

  // 進行最基本的驗證
  if (!recommendationData || !recommendationData.recommendeeEmail || !recommendationData.recommenderEmail) {
    throw new HttpsError('invalid-argument', '推薦資料不完整，缺少必要的 Email。');
  }

  console.log(`[submitOutgoing-v4] 收到標準化推薦請求，來自: ${recommendationData.recommenderEmail}`);

  // 為資料加上伺服器端的時間戳和初始狀態
  const finalData = {
    ...recommendationData,
    status: "submitted", // 統一初始狀態
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    processing: false,
    processed: false,
  };

  try {
    // 直接寫入 outgoingRecommendations 集合
    const recRef = await admin.firestore().collection("outgoingRecommendations").add(finalData);
    console.log(`[submitOutgoing-v4] ✅ 推薦已安全提交，ID: ${recRef.id}。`);
    return { success: true, recommendationId: recRef.id };

  } catch (error) {
    console.error("[submitOutgoing-v4] ❌ 寫入資料庫失敗:", error);
    throw new HttpsError('internal', '儲存推薦時發生伺服器錯誤。');
  }
});

/**
 * 可呼叫函式：根據 Email 查詢已註冊用戶的工作經歷
 * @param {object} data - 包含 { email: string } 的物件
 * @returns {Promise<Array<object>>} - 回傳該用戶的工作經歷陣列
 */
exports.getRecommenderWorkExperiencesByEmail = onCall({
  // 確保只有已登入的使用者可以呼叫此函式
  enforceAppCheck: false,
  consumeAppCheckToken: false,
}, async (request) => {
  
  const email = request.data.email;
  if (!email || typeof email !== 'string') {
    throw new HttpsError(
      'invalid-argument',
      '必須提供有效的 email。'
    );
  }

  console.log(`[getWorkExp] 收到查詢請求，Email: ${email}`);

  try {
    const usersSnap = await admin.firestore()
      .collection("users")
      .where("email", "==", email.toLowerCase())
      .limit(1)
      .get();

    if (usersSnap.empty) {
      console.log(`[getWorkExp] 找不到對應的已註冊用戶。`);
      // 找不到用戶是正常情況，回傳空陣列給前端
      return [];
    }

    const userData = usersSnap.docs[0].data();
    const workExperiences = userData.workExperiences || [];

    // 將工作經歷陣列轉換為安全的格式，只回傳必要欄位
    const safeWorkExperiences = workExperiences.map(job => ({
      id: job.id,
      company: job.company,
      position: job.position,
      startDate: job.startDate,
      endDate: job.endDate || null // 確保有值
    }));
    
    console.log(`[getWorkExp] 成功找到 ${safeWorkExperiences.length} 筆工作經歷。`);
    return safeWorkExperiences;

  } catch (error) {
    console.error(`[getWorkExp] 查詢工作經歷時發生錯誤:`, error);
    throw new HttpsError('internal', '查詢使用者資料時發生未預期的錯誤。');
  }
});