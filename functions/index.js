// functions/index.js - 完整更新版
require("dotenv").config();
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const functions = require("firebase-functions");
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_KEY);
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore"); // <-- ✨ 請新增這一行
const { onCall } = require("firebase-functions/v2/https");
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

💡【重要提示】
請優先填寫與 ${recommenderName} 在 <span class="math-inline">\{company\} 共事時期的工作經歷，這樣系統能自動將對方的推薦內容顯示在該段經歷中，幫助你快速完成職涯檔案建立。

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

💡【重要提示】
請優先填寫與 <span class="math-inline">\{replierName\} 共事時期的工作經歷，這樣系統能自動將這份推薦顯示在對應的經歷中。

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
},
milestoneNotification: {
    zh: {
      recommendationGivenVerified: {
        subject: (recommendeeName) => `✅ 你對 ${recommendeeName} 的推薦已通過驗證！`,
        text: (userName, recommendeeName) => `Hi ${userName}，\n\n好消息！你之前為 ${recommendeeName} 寫下的推薦，現已通過驗證。\n\n你成功為他的職涯，增添了一顆閃亮的信任星星。感謝你的付出！\n\n作為獎勵，你獲得了 +10 EXP。\n\nGalaxyz 團隊敬上`
      },
      recommendationReceivedVerified: {
        subject: (recommenderName) => `🌟 你收到一則來自 ${recommenderName} 的新推薦！`,
        text: (userName, recommenderName) => `Hi ${userName}，\n\n恭喜！你收到一則來自 ${recommenderName} 的已驗證推薦。\n\n你的職涯星圖上，又多了一筆真實的信任紀錄。這也讓你獲得了 +5 EXP。\n\n立即前往儀表板查看，並考慮回覆推薦，完成善意的循環！\n👉 https://galaxyz.ai/pages/profile-dashboard.html\n\nGalaxyz 團隊敬上`
      },
      replyGivenVerified: {
        subject: (recommendeeName) => `✨ 你對 ${recommendeeName} 的回覆推薦已成功送達！`,
        text: (userName, recommendeeName) => `Hi ${userName}，\n\n你之前回覆給 ${recommendeeName} 的推薦，現已成功送達並通過驗證。\n\n你們之間善意的循環已經完成！感謝你的互動！\n\n作為獎勵，你獲得了 +3 EXP。\n\nGalaxyz 團隊敬上`
      }
    },
    en: {
      recommendationGivenVerified: {
        subject: (recommendeeName) => `✅ Your recommendation for ${recommendeeName} has been verified!`,
        text: (userName, recommendeeName) => `Hi ${userName},\n\nGreat news! The recommendation you wrote for ${recommendeeName} has now been verified.\n\nYou've successfully added a shining star of trust to their career. Thank you for your contribution!\n\nAs a reward, you've earned +10 EXP.\n\nBest,\nThe Galaxyz Team`
      },
      recommendationReceivedVerified: {
        subject: (recommenderName) => `🌟 You've received a new recommendation from ${recommenderName}!`,
        text: (userName, recommenderName) => `Hi ${userName},\n\nCongratulations! You've received a new verified recommendation from ${recommenderName}.\n\nAnother star of trust has been added to your career constellation. This has also earned you +5 EXP.\n\nVisit your dashboard now to see it, and consider replying to complete the cycle of goodwill!\n👉 https://galaxyz.ai/pages/profile-dashboard.html\n\nBest,\nThe Galaxyz Team`
      },
      replyGivenVerified: {
        subject: (recommendeeName) => `✨ Your reply recommendation for ${recommendeeName} has been delivered!`,
        text: (userName, recommendeeName) => `Hi ${userName},\n\nYour reply recommendation for ${recommendeeName} has been successfully delivered and verified.\n\nThe cycle of goodwill between you is complete! Thank you for your interaction.\n\nAs a reward, you've earned +3 EXP.\n\nBest,\nThe Galaxyz Team`
      }
    }
  }
};


/**
 * 【精簡版】僅處理單純的、由未註冊用戶提交的「邀請推薦」。
 * 觸發時機：當 recommendation 文件被建立時。
 * 執行條件：類型為 'received'，且未被新流程處理過 (無 fullyProcessed 標記)。
 */
exports.notifyOnRecommendationCreated = onDocumentCreated("users/{userId}/recommendations/{recId}", async (event) => {
    const snap = event.data;
    if (!snap) return null;

    const data = snap.data();
    const recId = event.params.recId;
    const recommendeeUserId = event.params.userId;

    // --- 正面表列條件 ---
    // 只有當推薦是單純的 'received' 類型，且未被其他新流程標記處理過時，才繼續執行。
    const isSimpleReceived = data.type === 'received' && !data.fullyProcessed && !data.notificationSent;

    if (!isSimpleReceived) {
        console.log(`[notifyOnRecCreated] [${recId}] ⏭️ 非單純收到的推薦或已通知過，跳過。`);
        return null;
    }

    console.log(`[notifyOnRecCreated] [${recId}] 🎯 偵測到單純的收到推薦，準備寄送通知...`);

    try {
        // --- 獲取所需資料 ---
        const recommendeeSnap = await admin.firestore().doc(`users/${recommendeeUserId}`).get();
        if (!recommendeeSnap.exists) {
            console.error(`[notifyOnRecCreated] [${recId}] ❌ 找不到被推薦人資料 (ID: ${recommendeeUserId})。`);
            return null;
        }
        const recommendee = recommendeeSnap.data();
        
        const recommenderName = data.name; // 推薦人姓名 (來自表單)
        const recommenderEmail = data.email; // 推薦人 Email (來自表單)
        const lang = data.lang || "zh";

        // --- 寄送郵件 ---
        const messages = i18nMessages.notifyRecommendation[lang] || i18nMessages.notifyRecommendation.zh;
        
        // 寄給推薦人的感謝信
        if (recommenderEmail) {
            const subject = messages.subject(recommendee.name || '您的夥伴');
            const text = messages.text(recommenderName, recommendee.name || '您的夥伴');
            
            await sgMail.send({
                to: recommenderEmail,
                from: { email: process.env.SENDER_EMAIL, name: process.env.SENDER_NAME },
                subject: subject,
                text: text,
                trackingSettings: { clickTracking: { enable: false, enableText: false } }
            });
            console.log(`[notifyOnRecCreated] [${recId}] ✅ 已發送感謝信至推薦人: ${recommenderEmail}`);
        }
        
        // (可選) 這裡也可以再寄一封通知信給被推薦人，提醒他查看 Dashboard

        // --- 更新文件狀態，防止重複發送 ---
        await snap.ref.update({ notificationSent: true });
        console.log(`[notifyOnRecCreated] [${recId}] 🎉 處理完成。`);

    } catch (error) {
        console.error(`[notifyOnRecCreated] [${recId}] ❌ 處理過程中發生錯誤:`, error);
    }

    return null;
});

// 🆕 推薦他人功能：監聽 outgoingRecommendations 集合的新增
exports.notifyOnOutgoingRecommendationCreated = onDocumentCreated("outgoingRecommendations/{recId}", async (event) => {
    const snap = event.data;
    const data = snap.data();
    const recId = event.params.recId;

    // 1. 防止重複處理的入口檢查
    if (data.processed || data.processing) {
        console.log(`[${recId}] ⏭️ 記錄已處理或正在處理中，跳過。`);
        return null;
    }

    // 2. 透過 Transaction 取得處理權，避免競爭條件
    try {
        await snap.ref.update({
            processing: true,
            processingStartedAt: FieldValue.serverTimestamp()
        });
        console.log(`[${recId}] 🟢 取得處理權，開始處理...`);
    } catch (lockError) {
        console.log(`[${recId}] 🟡 無法取得處理權，可能已被其他執行緒處理，跳過。`);
        return null;
    }

    try {
        // 3. 查找被推薦人是否已註冊
        const usersQuery = await admin.firestore()
            .collection("users")
            .where("email", "==", data.recommendeeEmail.toLowerCase())
            .limit(1)
            .get();

        let finalStatus = '';

        if (!usersQuery.empty) {
            // 4a.【流程A：被推薦人已註冊】
            const targetUserDoc = usersQuery.docs[0];
            console.log(`[${recId}] ✅ 被推薦人已註冊 (ID: ${targetUserDoc.id})，執行立即驗證流程。`);
            
            const verificationResult = await validateRecommendationImmediately(data, targetUserDoc.data());
            
            if (verificationResult.status === 'duplicate_skipped') {
                // 如果驗證後發現是重複推薦
                finalStatus = 'duplicate_recommendation';
                await snap.ref.update({
                    targetUserId: targetUserDoc.id,
                    status: finalStatus,
                    duplicateOf: verificationResult.duplicateOf,
                });
            } else {
                // 創建推薦記錄並更新統計
                const newRecId = await createRecommendationForRegisteredUser(targetUserDoc.id, data, verificationResult);
                finalStatus = verificationResult.status === 'verified' ? 'delivered_and_verified' : 'delivered_but_failed';
                await snap.ref.update({
                    targetUserId: targetUserDoc.id,
                    recommendationId: newRecId,
                    status: finalStatus,
                    verificationStatus: verificationResult.status,
                    confidence: verificationResult.confidence,
                    deliveredAt: FieldValue.serverTimestamp(),
                });
            }
        } else {
            // 4b.【流程B：被推薦人未註冊】
            console.log(`[${recId}] 📝 被推薦人尚未註冊，建立 pendingUser 記錄。`);
            await admin.firestore().collection("pendingUsers").add({
                email: data.recommendeeEmail.toLowerCase(),
                type: "recommendation_invitee",
                recommendationId: recId, // 指向 outgoingRecommendations 的 ID
                recommendationData: data, // 將原始推薦資料存入
                createdAt: FieldValue.serverTimestamp(),
            });
            finalStatus = 'pending_registration';
            await snap.ref.update({
                status: finalStatus,
                pendingAt: FieldValue.serverTimestamp(),
            });
        }

        // 5. 發送郵件通知 (僅在非重複的情況下)
        if (finalStatus !== 'duplicate_recommendation') {
            await sendOutgoingRecommendationEmails(data);
        }

        // 6. 標記處理完成
        await snap.ref.update({
            processed: true,
            processing: false,
            processedAt: FieldValue.serverTimestamp(),
        });
        console.log(`[${recId}] 🎉 處理完成，最終狀態: ${finalStatus}`);

    } catch (error) {
        console.error(`[${recId}] ❌ 處理過程中發生嚴重錯誤:`, error);
        // 錯誤處理：寫回錯誤狀態
        await snap.ref.update({
            processing: false,
            processed: false, // 標記為未處理，以便未來重試
            status: "error",
            errorMessage: error.message,
            errorAt: FieldValue.serverTimestamp()
        });
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

    // index.js -> onUserCreated_assignRecommenderId 函數內部

    for (const pendingDoc of pendingSnap.docs) {
      const pendingData = pendingDoc.data();
      console.log(`📋 處理 pending 記錄:`, {
        id: pendingDoc.id,
        type: pendingData.type
      });

      // 🔥 根據不同類型的 pendingUser 進行不同處理 (修正後的平行結構)
      if (pendingData.type === "recommendation_invitee") {
        // 情況一：被「推薦好夥伴」的人註冊了
        const recommendationId = pendingData.recommendationId;
        if (recommendationId && pendingData.recommendationData) {
          console.log(`🎯 處理推薦他人註冊: ${recommendationId}`);
          updatePromises.push(
            processOutgoingRecommendationRegistration(newUserId, recommendationId, pendingData)
          );
        } else {
          console.warn(`⚠️ 推薦他人記錄缺少必要資料:`, pendingData);
        }

      } else if (pendingData.type === "reply_recommendation") {
        // 情況二：被「回覆推薦」的人註冊了
        const replyRecId = pendingData.replyRecommendationId;
        if (replyRecId && pendingData.recommendationData) {
          console.log(`🎯 處理回覆推薦註冊: ${replyRecId}`);
          updatePromises.push(
            processReplyRecommendationRegistration(newUserId, replyRecId, pendingData)
          );
        } else {
          console.warn(`⚠️ 回覆推薦記錄缺少必要資料:`, pendingData);
        }

      } else if (pendingData.type === "recommender_registration") { 
        // 情況三：「邀請推薦」的推薦人註冊了
        const inviteId = pendingData?.inviteId;
        if (inviteId) {
          console.log(`🎯 處理邀請推薦的推薦人註冊: ${inviteId}`);
          updatePromises.push(
            updateInviteRecommendation(newUserId, inviteId, pendingData)
          );
        } else {
            console.warn(`⚠️ 推薦人註冊記錄缺少 inviteId:`, pendingData);
        }

      } else {
        // 情況四：兼容最舊版的「邀請推薦」邏輯 (沒有 type)
        const inviteId = pendingData?.inviteId;
        if (inviteId) {
          console.log(`🎯 處理舊版邀請推薦: ${inviteId}`);
          updatePromises.push(
            updateInviteRecommendation(newUserId, inviteId, pendingData)
          );
        } else {
            console.warn(`⚠️ 未知的 pendingUser 類型或資料不完整:`, pendingData);
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
      createdAt: FieldValue.serverTimestamp(),
      registeredAt: FieldValue.serverTimestamp()
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
          deliveredAt: FieldValue.serverTimestamp()
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
            confirmedAt: FieldValue.serverTimestamp()
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
          confirmedAt: FieldValue.serverTimestamp()
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
      createdAt: FieldValue.serverTimestamp(),
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
        verifiedAt: FieldValue.serverTimestamp(),
        matchedJobId: verificationResult.matchedJobId,
        matchedCompany: verificationResult.matchedCompany,
        confidence: verificationResult.confidence,
        verificationType: 'delayed',
        recommenderId: outgoingData.recommenderUserId,
        recommenderRegistered: true,
        confirmedAt: FieldValue.serverTimestamp(),
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
        validationFailedAt: FieldValue.serverTimestamp(),
        reason: verificationResult.reason,
        confidence: verificationResult.confidence || 0,
        verificationType: 'delayed',
        recommenderId: outgoingData.recommenderUserId,
        recommenderRegistered: true,
        confirmedAt: FieldValue.serverTimestamp(),
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
      
      // 更新雙方統計數字
      await updateRecommenderStats(
        outgoingData.recommenderUserId, 
        1, 
        outgoingData.recommenderJobId, 
        { // <-- 保留這個完整的物件
            recommendationId: recRef.id,
            recommendeeName: outgoingData.recommendeeName,
            recommendeeEmail: outgoingData.recommendeeEmail,
            content: outgoingData.content,
            relation: outgoingData.relation,
            highlights: outgoingData.highlights,
            targetUserId: userId
        }, 
        10 // <-- ✨ 在物件後面，加上我們新的 EXP 參數
    );
      
    await updateRecipientStats(userId, 1); // <-- ✨ 並加上這一行

    console.log(`✅ 推薦人與被推薦人統計已更新`);

    const recommenderSnap = await admin.firestore().doc(`users/${outgoingData.recommenderUserId}`).get();
      if (recommenderSnap.exists) {
          const recommender = recommenderSnap.data();
          // userData 就是 recipient (被推薦人) 的資料
          await sendMilestoneNotification('recommendationGivenVerified', { recipient: userData, recommender });
          await sendMilestoneNotification('recommendationReceivedVerified', { recipient: userData, recommender });
      }

    } else {
      console.log(`⏭️ 驗證失敗，跳過統計更新`);
    }

    // 6. 更新 outgoingRecommendations 狀態
    const outgoingStatus = verificationResult.status === 'verified' ? 'delivered_and_verified' : 'delivered_but_failed';
    
    await admin.firestore().collection("outgoingRecommendations").doc(outgoingRecId).update({
      targetUserId: userId,
      recommendationId: recRef.id,
      status: outgoingStatus,
      deliveredAt: FieldValue.serverTimestamp(),
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
  try {
    console.log(`🔍 驗證推薦記錄 (最終修正版): ${recId}`);

    // 排除各種不需要驗證的情況
    if (recData.status !== 'pending' && recData.status !== 'verification_failed') {
      console.log(`⏭️ 跳過非 pending/failed 狀態的推薦: ${recId}`);
      return;
    }
    if (recData.verificationType === 'reply_automatic' || recData.verificationType === 'immediate' || recData.fullyProcessed) {
      console.log(`⏭️ 跳過無需重複驗證的推薦: ${recId}`);
      return;
    }
    if (!recData.recommenderUserId || !recData.recommenderJobId) {
      console.log(`⚠️ 推薦記錄缺少必要資訊，無法驗證: ${recId}`);
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
      // ✅ 找到匹配，準備更新為 verified
      console.log(`👍 找到最佳匹配，信心度: ${maxConfidence.toFixed(2)}`);

      // 🔥【核心修正】在這裡執行基於 matchedJobId 的重複檢查
      const duplicateCheckSnap = await admin.firestore()
        .collection(`users/${userId}/recommendations`)
        .where('recommenderUserId', '==', recData.recommenderUserId)
        .where('matchedJobId', '==', bestMatch.id) // 使用最佳匹配的工作 ID
        .where('status', '==', 'verified')
        .limit(1)
        .get();

      if (!duplicateCheckSnap.empty) {
        console.log(`⏭️ 發現針對同一工作經歷的重複推薦，標記為 duplicate_skipped: ${recId}`);
        await recRef.update({
          status: 'duplicate_skipped',
          skipReason: 'already_verified_for_same_target_job',
          duplicateOf: duplicateCheckSnap.docs[0].id
        });
        return;
      }

      // 如果不重複，則更新為 verified
      await recRef.update({
        status: 'verified',
        verifiedAt: FieldValue.serverTimestamp(),
        matchedJobId: bestMatch.id,
        matchedCompany: bestMatch.company,
        confidence: maxConfidence,
        canReply: true,
        hasReplied: false
      });

      // 更新雙方統計數字 (+10 EXP 給推薦人, +5 EXP 給被推薦人)
      await updateRecommenderStats(recData.recommenderUserId, 1, recData.recommenderJobId, recData, 10);
      await updateRecipientStats(userId, 1);
      console.log(`✅ 推薦驗證通過並更新統計: ${recId}`);

      const recommenderSnap = await admin.firestore().doc(`users/${recData.recommenderUserId}`).get();
      const recipientSnap = await admin.firestore().doc(`users/${userId}`).get();
      if (recommenderSnap.exists && recipientSnap.exists) {
          const recommender = recommenderSnap.data();
          const recipient = recipientSnap.data();
          // 分別通知推薦人和被推薦人
          await sendMilestoneNotification('recommendationGivenVerified', { recipient, recommender });
          await sendMilestoneNotification('recommendationReceivedVerified', { recipient, recommender });
      }

    } else {
      // ❌ 驗證失敗
      await recRef.update({
        status: 'verification_failed',
        reason: 'no_sufficient_overlap',
        confidence: maxConfidence
      });
      console.log(`❌ 推薦驗證失敗: ${recId} - 沒有足夠的時間重疊`);
    }

  } catch (error) {
    console.error(`❌ 驗證推薦記錄失敗 (v2): ${recId}`, error);
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

// functions/index.js

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
        // --- 1. 新增：重複回覆檢查 ---
        const originalRecRef = admin.firestore().collection("users").doc(replierUserId).collection("recommendations").doc(recData.originalRecommendationId);
        const originalRecSnap = await originalRecRef.get();

        if (originalRecSnap.exists && originalRecSnap.data().hasReplied) {
            console.log(`[handleReply] [${replyRecId}] ⚠️ 原始推薦 ${recData.originalRecommendationId} 已被回覆過，標記為重複並終止。`);
            await snap.ref.update({ status: 'duplicate_reply', processed: true, processing: false });
            return null;
        }

        // --- 2. 新增：統一資料物件 ---
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

        // --- 3. 根據目標用戶是否註冊，執行不同流程 ---
        if (replyContext.isRecipientRegistered) {
            await handleRegisteredUserReply(replyContext);
        } else {
            await handleUnregisteredUserReply(replyContext);
        }

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

/**
 * 處理對【已註冊】用戶的回覆推薦。
 * @param {object} replyContext - 標準化的回覆資料物件。
 */
async function handleRegisteredUserReply(replyContext) {
    const { replier, recipient, reply, originalRec } = replyContext;

    console.log(`[handleReply] ✅ 開始處理對已註冊用戶的回覆: ${recipient.id}`);

    try {
        const targetRecRef = admin.firestore()
            .collection("users").doc(recipient.id)
            .collection("recommendations").doc(); // 為接收者建立新的推薦文件

        const targetRecData = {
            id: targetRecRef.id,
            name: replier.name,
            email: replier.email,
            content: reply.content,
            highlights: reply.highlights,
            relation: reply.relation,
            type: 'received',
            recommenderId: replier.id,
            originalRecommendationId: originalRec.id, // 標示此推薦是為了回覆哪一則
            replyRecommendationId: reply.id,          // 指向 replier 那邊的 reply 記錄
            hasReplied: false,
            jobId: replier.jobId || 'default',
            status: 'verified', // 基於信任，回覆推薦預設為已驗證
            confidence: 1.0,
            verifiedAt: FieldValue.serverTimestamp(),
            verificationType: 'reply_based',
            createdAt: FieldValue.serverTimestamp(),
            lang: reply.lang,
            fullyProcessed: true, // 標記此記錄為完全處理，其他函數應跳過
            statsUpdated: true
        };

        await targetRecRef.set(targetRecData);
        console.log(`[handleReply] ✅ 推薦記錄已創建到目標用戶: ${targetRecRef.id}`);

        // 更新雙方統計數據
        // 更新雙方統計數據 (+3 EXP 給回覆者, +5 EXP 給接收者)
        await updateRecommenderStats(replier.id, 1, replier.jobId, { id: reply.id, targetName: recipient.name, targetUserId: recipient.id }, 3); // 給予回覆者 +3 EXP
        await updateRecipientStats(recipient.id, 1); // 給予接收者 +5 EXP

        // 發送 email 通知
        await sendMilestoneNotification('replyGivenVerified', { recipient, recommender: replier });
        await sendMilestoneNotification('recommendationReceivedVerified', { recipient, recommender: replier });
        await sendReplyRecommendationEmails(replyContext);

        console.log(`[handleReply] ✅ 已註冊用戶回覆流程處理完成。`);

    } catch (error) {
        console.error(`[handleReply] ❌ 處理對已註冊用戶的回覆時失敗:`, error);
        // 拋出錯誤，讓上層的 catch 區塊可以捕獲並記錄
        throw error;
    }
}

/**
 * 處理對【未註冊】用戶的回覆推薦。
 * @param {object} replyContext - 標準化的回覆資料物件。
 */
async function handleUnregisteredUserReply(replyContext) {
    const { replier, recipient, reply, originalRec } = replyContext;

    console.log(`[handleReply] 📧 開始處理對未註冊用戶的回覆: ${recipient.email}`);
    
    try {
        // 1. 創建 pendingUsers 記錄，等待對方註冊
        const pendingData = {
            email: recipient.email.toLowerCase(),
            type: "reply_recommendation",
            replyRecommendationId: reply.id,
            recommendationData: {
                name: replier.name,
                email: replier.email,
                content: reply.content,
                highlights: reply.highlights,
                relation: reply.relation,
                type: 'received',
                recommenderId: replier.id,
                originalRecommendationId: originalRec.id,
                replyRecommendationId: reply.id,
                hasReplied: false,
                jobId: replier.jobId || 'default',
                lang: reply.lang
            },
            createdAt: FieldValue.serverTimestamp()
        };

        await admin.firestore().collection("pendingUsers").add(pendingData);
        console.log(`[handleReply] ✅ pendingUser 記錄已為 ${recipient.email} 創建。`);

        // 2. 發送 email 邀請對方註冊 (不更新統計，等註冊後再說)
        await sendReplyRecommendationEmails(replyContext);
        
        console.log(`[handleReply] ✅ 未註冊用戶回覆流程處理完成。`);

    } catch (error) {
        console.error(`[handleReply] ❌ 處理對未註冊用戶的回覆時失敗:`, error);
        throw error;
    }
}

// functions/index.js

/**
 * 📧 發送回覆推薦的 email 通知 (修正版)
 * @param {object} replyContext - 標準化的回覆資料物件
 */
async function sendReplyRecommendationEmails(replyContext) {
    const { replier, recipient, reply, originalRec, isRecipientRegistered } = replyContext;

    try {
        let lang = reply.lang || "zh";
        // 語言標準化
        if (lang.startsWith('zh')) lang = 'zh';
        else if (lang.startsWith('en')) lang = 'en';
        else lang = 'zh';

        console.log(`[handleReply] 📧 發送回覆推薦郵件，語言: ${lang}`);

        const messages = i18nMessages.replyRecommendation[lang];
        if (!messages) {
            console.error(`[handleReply] ❌ 找不到語言 ${lang} 的翻譯`);
            return;
        }

        // --- 1. 發送給目標用戶（接收者） ---
        if (isRecipientRegistered) {
            // 已註冊用戶：收到回覆通知
            const subject = messages.subjectToRecipient(replier.name);
            const text = messages.textToRecipient(replier.name, recipient.name, reply.content, originalRec.content);
            await sgMail.send({
                to: recipient.email,
                from: { email: process.env.SENDER_EMAIL, name: process.env.SENDER_NAME },
                subject, text, trackingSettings: { clickTracking: { enable: false, enableText: false } }
            });
            console.log(`[handleReply] ✅ 已註冊用戶回覆通知已發送至: ${recipient.email}`);
        } else {
            // 未註冊用戶：收到新的推薦邀請
            const subject = messages.subjectToUnregistered(replier.name);
            const text = messages.textToUnregistered(replier.name, recipient.name, reply.content, recipient.email);
            await sgMail.send({
                to: recipient.email,
                from: { email: process.env.SENDER_EMAIL, name: process.env.SENDER_NAME },
                subject, text, trackingSettings: { clickTracking: { enable: false, enableText: false } }
            });
            console.log(`[handleReply] ✅ 未註冊用戶推薦邀請已發送至: ${recipient.email}`);
        }

        // --- 2. 發送確認信給回覆者 ---
        if (replier.email) {
            const subject = messages.subjectToReplier(recipient.name);
            const text = messages.textToReplier(replier.name, recipient.name, isRecipientRegistered);
            await sgMail.send({
                to: replier.email,
                from: { email: process.env.SENDER_EMAIL, name: process.env.SENDER_NAME },
                subject, text, trackingSettings: { clickTracking: { enable: false, enableText: false } }
            });
            console.log(`[handleReply] ✅ 回覆者確認信已發送至: ${replier.email}`);
        }

    } catch (error) {
        console.error(`[handleReply] ❌ 發送回覆推薦 email 失敗:`, error);
        throw error; // 向上拋出錯誤，讓主函式可以捕獲
    }
}

// 🆕 處理回覆推薦的註冊確認
/**
 * 【最終修正版】處理回覆推薦的註冊確認
 * - 修正了讀取 recommenderId 時的欄位名稱不一致問題。
 */
async function processReplyRecommendationRegistration(newUserId, replyRecId, pendingData) {
  try {
    console.log(`[processReplyReg] 🎯 開始處理回覆推薦註冊: newUserId=${newUserId}, replyRecId=${replyRecId}`);
    
    const recommendationData = pendingData.recommendationData;
    if (!recommendationData) {
      console.error(`[processReplyReg] ❌ 待辦事項缺少 recommendationData，無法處理。`);
      return;
    }

    // 步驟 1：資料歸屬 - 為新用戶建立收到的推薦
    const recRef = admin.firestore()
      .collection("users").doc(newUserId)
      .collection("recommendations").doc();
    
    const finalRecommendationData = {
      ...recommendationData,
      id: recRef.id,
      type: "received",
      targetUserId: newUserId,
      status: 'verified',
      verifiedAt: FieldValue.serverTimestamp(),
      verificationType: 'reply_based_registration',
      createdAt: FieldValue.serverTimestamp(),
      registeredAt: FieldValue.serverTimestamp(),
      fullyProcessed: true,
      statsUpdated: true
    };
    
    await recRef.set(finalRecommendationData);
    console.log(`[processReplyReg] ✅ 已為新用戶 ${newUserId} 創建推薦記錄: ${recRef.id}`);

    // ▼▼▼ 【核心修正】 ▼▼▼
    // 同時檢查 recommenderId 和 recommenderUserId，確保能抓到正確的回覆者 ID
    const replierId = recommendationData.recommenderId || recommendationData.recommenderUserId;
    
    // 步驟 2：更新統計數字
    if (replierId) {
      // 使用從 recommendationData 中獲取的 jobId
      await updateRecommenderStats(replierId, 1, recommendationData.jobId, null, 3); 
      await updateRecipientStats(newUserId, 1);
      console.log(`[processReplyReg] 📊 雙方統計數字已更新。`);
      const recommenderSnap = await admin.firestore().doc(`users/${replierId}`).get();
      const recipientSnap = await admin.firestore().doc(`users/${newUserId}`).get();
      if (recommenderSnap.exists && recipientSnap.exists) {
          await sendMilestoneNotification('replyGivenVerified', { recipient: recipientSnap.data(), recommender: recommenderSnap.data() });
          await sendMilestoneNotification('recommendationReceivedVerified', { recipient: recipientSnap.data(), recommender: recommenderSnap.data() });
      }
    } else {
      console.warn(`[processReplyReg] ⚠️ 缺少回覆者ID，跳過統計更新。`);
    }

    // 步驟 3：回寫並更新原始的 reply 推薦記錄
    if (replierId && replyRecId) {
      const originalReplyRef = admin.firestore()
        .collection("users").doc(replierId)
        .collection("recommendations").doc(replyRecId);
      
      await originalReplyRef.update({
        targetUserId: newUserId,
        status: 'delivered',
        deliveredAt: FieldValue.serverTimestamp(),
        processed: true
      });
      console.log(`[processReplyReg] ✅ 已回寫更新原始 reply 記錄: ${replyRecId}`);
    } else {
      console.warn(`[processReplyReg] ⚠️ 缺少回覆者ID或回覆記錄ID，跳過回寫更新。`);
    }
    
    console.log(`[processReplyReg] 🎉 回覆推薦註冊流程處理完成。`);

  } catch (error) {
    console.error(`[processReplyReg] ❌ 處理回覆推薦註冊時發生嚴重錯誤:`, error);
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

/**
 * 🆕 新功能：當推薦被補上 recommenderId 時，更新推薦人的送出統計
 * 觸發器：當 users/{userId}/recommendations/{recId} 文件被更新時
 */
/**
 * 🆕 終極智慧版：當推薦被補上 recommenderId 時，自動匹配工作經歷並更新統計
 */
exports.updateStatsOnRecommenderIdAdded = onDocumentUpdated("users/{userId}/recommendations/{recId}", async (event) => {
  const beforeData = event.data.before.data();
  const afterData = event.data.after.data();

  // 核心條件：只有在「recommenderId 從無到有」時才觸發
  if (!beforeData.recommenderId && afterData.recommenderId) {

    if (afterData.statsUpdated) {
      console.log(`⏭️ 統計已更新過，跳過: ${event.params.recId}`);
      return null;
    }

    const recommenderId = afterData.recommenderId; // 推薦人 (耘萱) 的 ID
    const recommendeeId = event.params.userId;   // 被推薦人 (您) 的 ID
    const recommendeeJobId = afterData.jobId;  // 被推薦的工作 (您的生涯設計師) 的 ID

    console.log(`📈 偵測到 recommenderId 被補上: ${recommenderId}`);

    try {
      // 步驟 A: 獲取被推薦人（您）的工作經歷詳情
      const recommendeeJob = await getRecommenderJobData(recommendeeId, recommendeeJobId);
      if (!recommendeeJob) {
        throw new Error(`找不到被推薦人的工作經歷: ${recommendeeJobId}`);
      }

      // 步驟 B: 獲取推薦人（耘萱）的完整資料
      const recommenderRef = admin.firestore().doc(`users/${recommenderId}`);
      const recommenderSnap = await recommenderRef.get();
      if (!recommenderSnap.exists) {
        throw new Error(`找不到推薦人資料: ${recommenderId}`);
      }
      const recommenderData = recommenderSnap.data();
      let recommenderWorkExperiences = recommenderData.workExperiences || [];
      if (!Array.isArray(recommenderWorkExperiences)) {
        recommenderWorkExperiences = Object.values(recommenderWorkExperiences);
      }

      // 步驟 C: 在推薦人（耘萱）的經歷中，找出與被推薦工作（您的）最佳的匹配
      let bestMatchRecommenderJob = null;
      let maxConfidence = 0;
      for (const job of recommenderWorkExperiences) {
          const validation = checkTimeOverlap(recommendeeJob, job);
          if (validation.hasOverlap && validation.confidence > maxConfidence) {
              bestMatchRecommenderJob = job;
              maxConfidence = validation.confidence;
          }
      }

      // 步驟 D: 準備要傳遞的完整資料
      const recommendeeName = (await admin.firestore().doc(`users/${recommendeeId}`).get()).data()?.name || '用戶';
      const dataForStats = { 
        ...afterData, 
        id: event.params.recId,
        recommendeeName: recommendeeName,
        targetUserId: recommendeeId
      };

      // 步驟 E: 執行統計更新
      if (bestMatchRecommenderJob) {
        console.log(`👍 找到推薦人最匹配的工作經歷: ${bestMatchRecommenderJob.id}`);
        await updateRecommenderStats(
          recommenderId, 
          1,
          bestMatchRecommenderJob.id, // 🔥 使用偵測到的、推薦人自己的 jobId
          dataForStats
        );
      } else {
        console.warn(`⚠️ 在推薦人 ${recommenderId} 的資料中找不到匹配的工作經歷，只更新總數。`);
        await updateRecommenderStats(recommenderId, 1, null, dataForStats);
      }

      console.log(`   ✅ 成功為推薦人 ${recommenderId} 更新統計。`);

      // 在推薦記錄上標記統計已更新
      await event.data.after.ref.update({
        statsUpdated: true,
        statsUpdatedAt: FieldValue.serverTimestamp()
      });

    } catch (error) {
      console.error(`❌ 更新推薦人統計時發生錯誤 (from updateStatsOnRecommenderIdAdded):`, error);
    }
  }

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
/**
 * 史詩級任務 II - 校準函式 (V2 - 支援EXP與Settings)
 * HTTP 觸發的資料校準腳本。
 */
exports.calibrateDataHealth = functions.https.onCall(async (data, context) => {
  // 安全性檢查
  //if (!process.env.FUNCTIONS_EMULATOR && (!context.auth || context.auth.token.role !== 'admin')) {
    //throw new functions.https.HttpsError('permission-denied', '此操作需要管理員權限。');
  //}
  if(process.env.FUNCTIONS_EMULATOR) {
    console.log("🚀 正在模擬器環境中執行校準腳本...");
  }

  console.log("✅ 開始執行資料校準 (V2)...");
  const stats = {
    usersScanned: 0,
    recommendationsUpdated: 0,
    statsRecalculated: 0,
    expInitialized: 0,      // ✨ 新增：EXP 初始化計數
    settingsInitialized: 0, // ✨ 新增：Settings 初始化計數
  };

  const db = admin.firestore();
  const usersSnap = await db.collection('users').get();
  stats.usersScanned = usersSnap.size;

  let batch = db.batch();
  let operationCount = 0;

  for (const userDoc of usersSnap.docs) {
    const userId = userDoc.id;
    const userData = userDoc.data();
    let totalGiven = 0;
    let totalReceived = 0;
    const userUpdatePayload = {};

    const givenRecsSnap = await db.collectionGroup('recommendations')
      .where('recommenderId', '==', userId).get();
    totalGiven += givenRecsSnap.size;

    if (Array.isArray(userData.workExperiences)) {
      for (const job of userData.workExperiences) {
        if (Array.isArray(job.recommendations)) {
          const legacyGivenCount = job.recommendations.filter(r => r.type === 'given').length;
          totalGiven += legacyGivenCount;
        }
      }
    }
    
    const receivedRecsSnap = await db.collection('users').doc(userId).collection('recommendations').get();
    
    for (const recDoc of receivedRecsSnap.docs) {
      const recData = recDoc.data();
      if (recData.status === 'verified' && recData.type === 'received') {
        totalReceived++;
      }
      if (!recData.recommenderId && recData.recommenderUserId) {
        batch.update(recDoc.ref, { recommenderId: recData.recommenderUserId });
        operationCount++;
        stats.recommendationsUpdated++;
      }
    }

    const oldStats = userData.recommendationStats || {};
    const calculatedExp = (totalGiven * 10) + (totalReceived * 5);

    // 2. 檢查是否有任何統計數據需要更新
    const statsNeedUpdate = 
        oldStats.totalGiven !== totalGiven || 
        oldStats.totalReceived !== totalReceived || 
        oldStats.exp !== calculatedExp;

    if (statsNeedUpdate) {
        userUpdatePayload['recommendationStats'] = {
            totalGiven: totalGiven,
            totalReceived: totalReceived,
            exp: calculatedExp,
            lastUpdated: FieldValue.serverTimestamp()
        };
        stats.statsRecalculated++;
        if (oldStats.exp !== calculatedExp) stats.expInitialized++;
    }

    // 3. 檢查 settings 是否需要初始化
    if (userData.settings?.showLevelOnPublicProfile === undefined) {
        userUpdatePayload['settings.showLevelOnPublicProfile'] = true;
        stats.settingsInitialized++;
    }

    // 4. 如果有任何需要更新的欄位，才加入到 batch 中
    if (Object.keys(userUpdatePayload).length > 0) {
      batch.update(userDoc.ref, userUpdatePayload);
      operationCount++;
    }

    // Batch commit 邏輯 (保持不變)
    if (operationCount >= 490) {
      await batch.commit();
      batch = db.batch();
      operationCount = 0;
    }
  }

  if (operationCount > 0) {
    await batch.commit();
  }

  console.log("🎉 資料校準完成！");
  console.log(stats);
  return { success: true, stats: stats };
});

// =================================================================
// 史詩級任務 I：搜尋與探索 - 核心同步函式
// =================================================================

/**
 * 主函式：監聽 users 文件的更新，同步到 publicProfiles 集合。
 */
exports.syncPublicProfileOnUpdate = onDocumentUpdated("users/{userId}", async (event) => {
  const beforeData = event.data.before.data();
  const afterData = event.data.after.data();
  const userId = event.params.userId;
  const publicProfileRef = admin.firestore().collection("publicProfiles").doc(userId);

  // --- 邏輯分支 ---

  // 1. 當使用者決定公開 Profile (或更新已公開的 Profile)
  if (afterData.isPublicProfile === true) {
    console.log(`[Public Sync] 👤 用戶 ${userId} 決定公開或更新 Profile，正在產生資料...`);
    try {
      const publicData = await generatePublicProfileData(userId, afterData);
      await publicProfileRef.set(publicData, { merge: true }); // 使用 merge:true 避免覆蓋正在進行的更新
      console.log(`[Public Sync] ✅ 已成功為 ${userId} 建立/更新公開 Profile。`);
    } catch (error) {
      console.error(`[Public Sync] ❌ 為 ${userId} 產生公開 Profile 時發生錯誤:`, error);
    }
    return;
  }

  // 2. 當使用者決定關閉 Profile (從公開變為私密)
  if (beforeData.isPublicProfile === true && afterData.isPublicProfile === false) {
    console.log(`[Public Sync] 🙈 用戶 ${userId} 決定關閉 Profile，正在刪除公開資料...`);
    await publicProfileRef.delete();
    console.log(`[Public Sync] ✅ 已成功刪除 ${userId} 的公開 Profile。`);
    return;
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
    },
    lastUpdated: FieldValue.serverTimestamp() // 確保頂部已 import { FieldValue }
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
exports.updateFeaturedUsers = onCall({
  invoker: "private",
}, async (request) => {
  // ... 權限檢查邏輯保持不變 ...
  if (!process.env.FUNCTIONS_EMULATOR && (!request.auth || request.auth.token.role !== 'admin')) { /* ... */ }
  if (process.env.FUNCTIONS_EMULATOR) { /* ... */ }

  console.log("[Featured Users] ✅ 開始更新精選用戶列表 (混合模式 V3)...");

  try {
    const db = admin.firestore();
    const MAX_HEROES = 5;

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
        // ✨【核心修正 2】將 EXP 也加入到要儲存的資料中，雖然前端目前沒用到，但未來可能有用
        const publicData = docSnap.data();
        const correspondingUser = sortedUsers.find(u => u.id === publicData.userId);
        featuredUsersData.push({
          userId: publicData.userId,
          name: publicData.name,
          headline: publicData.headline,
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

/**
 * 🆕 里程碑通知輔助函式
 * @param {string} milestoneType - 通知的類型 ('recommendationGivenVerified', 'recommendationReceivedVerified', 'replyGivenVerified')
 * @param {object} context - 包含 { recipient, recommender } 等資料的物件
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

    await sgMail.send({ to: toEmail, from: { email: process.env.SENDER_EMAIL, name: process.env.SENDER_NAME }, subject, text });
    console.log(`[Notification] ✅ 已寄送「${milestoneType}」通知信至 ${toEmail}`);

  } catch (error) {
    console.error(`[Notification] ❌ 寄送里程碑通知信時發生錯誤:`, error);
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

    // --- 核心觸發條件 ---
    // 只有在 status 從「不是 verified」變成「是 verified」時，才執行
    if (beforeData.status !== 'verified' && afterData.status === 'verified') {
        
        console.log(`🎉 推薦 ${recId} 已通過驗證！開始處理成就與統計...`);

        // 安全檢查，確保有推薦人 ID
        const recommenderId = afterData.recommenderId || afterData.recommenderUserId;
        if (!recommenderId) {
            console.warn(`[onVerified] ⚠️ 推薦 ${recId} 缺少 recommenderId，無法更新統計。`);
            return null;
        }

        try {
            // 1. 更新雙方統計數字與 EXP
            //    - `afterData.type === 'reply'` 用來判斷是否為「回覆推薦」
            const isReply = afterData.type === 'reply';
            const expForGiver = isReply ? 3 : 10; // 回覆+3, 主動+10

            await updateRecommenderStats(recommenderId, 1, afterData.jobId, afterData, expForGiver);
            await updateRecipientStats(recipientId, 1);
            console.log(`[onVerified] ✅ 雙方統計與 EXP 更新完畢。`);

            // 2. 寄送里程碑通知信
            const recommenderSnap = await admin.firestore().doc(`users/${recommenderId}`).get();
            const recipientSnap = await event.data.after.ref.parent.parent.get(); // 直接從事件上下文中獲取，更高效

            if (recommenderSnap.exists && recipientSnap.exists) {
                const recommender = recommenderSnap.data();
                const recipient = recipientSnap.data();
                
                // 根據是否為回覆，寄送不同類型的「給予者」通知
                const givenMilestoneType = isReply ? 'replyGivenVerified' : 'recommendationGivenVerified';
                await sendMilestoneNotification(givenMilestoneType, { recipient, recommender });
                
                // 寄送給「接收者」的通知
                await sendMilestoneNotification('recommendationReceivedVerified', { recipient, recommender });
            }
            
            // 3. 在推薦文件上標記，避免重複處理
            await event.data.after.ref.update({
                statsUpdatedAt: FieldValue.serverTimestamp()
            });

        } catch (error) {
            console.error(`[onVerified] ❌ 處理推薦 ${recId} 的後續流程時發生錯誤:`, error);
        }
    }

    return null;
});