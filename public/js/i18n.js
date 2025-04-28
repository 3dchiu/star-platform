export const i18n = {
  en: {
    // header
    login: "Login",
    logout: "Logout",  

    // profile-dashboard.html
    workExperiences: "Work Experiences",
    addExperience: "+ Add New Experience",
    addExperienceTitle: "Add Experience",
    company: "Company",
    position: "Position",
    period: "Period",
    descriptionOptional: "Description (optional)",
    cancelExperience: "Cancel",
    saveExperience: "Save",
    currentlyWorking: "Currently working",
    editBio: "Edit Bio",
    noBio: "(No bio yet)",
    viewSummaryAll: "View Recommendation Summary",
    errEndBeforeStart: "End date cannot be before start date",
    selectEnd:         "Select end date",
    errEndAfterToday: "End date cannot be in the future",

    // invitation templates & UI
    defaultInvite_direct: "I'm building my professional career profile and would love to invite you to write a short recommendation about our time working together. If you're open to it, I'd be happy to return the favor!",
    defaultInvite_warmth: "I'm building my professional network profile, and while reflecting on our past collaborations, I’d love to invite you to share a few words about your impressions of working with me. If you ever want to build your own network, I’d be more than happy to return the recommendation and grow our professional credibility together.",
    promptEditInvite: "Please review or revise the invitation message:",
    editInviteTitle: "Edit Invitation",
    inviteStyleLabel: "Invitation Style:",
    styleDirect: "Direct",
    styleWarmth: "Warmth",

    // toast & confirm
    deleteConfirm: "Delete this experience?",
    deleteToast: "Deleted",
    selectStart: "Select start date",
    selectEnd: "Select end date",
    linkCopied: "Link copied!",
    linkCopyFailed: "Copy failed, please copy manually",

    // recommend-form.html
    recommendingTo: "You are writing a recommendation for <strong>{name}</strong>",
    recPageTitle: "Recommendation Form",
    formTitle: "Recommendation Form",
    inviteTitle: "Invitation Message",
    name: "Your Name",
    email: "Your Email",
    relation: "You are the candidate’s",
    contentLabel: "Recommendation",
    hintContent: "Up to 500 characters; please focus on highlights.",
    submitRecommendation: "Submit Recommendation",
    relationOptions: [
      "Their direct supervisor",
      "I'm their cross-team supervisor",
      "Same team colleague",
      "Colleague from another team",
      "Their direct report",
      "Client",
      "Vendor",
    ],
    highlightLabel: "Recommendation Highlights",

    // ◆ 四個固定亮點 key (dashboard)
    highlightOptions: ["professional", "workEthic", "interpersonal", "collaboration"],
    highlightOptionLabels: {
      professional:  "Professional Skills",
      workEthic:     "Work Ethic",
      interpersonal: "Interpersonal Skills",
      collaboration: "Collaboration"
    },
    highlightOptionCustomLabel:       "Other Highlight (optional)",
    highlightOptionCustomPlaceholder: "Enter a custom highlight",
    hintCustomHighlight:              "Up to 30 characters; optional",
    highlightLimitMsg:                "You can select up to 3 highlights only",

    // legacy recommend-form highlight keys
    legacyHighlightOptions: ["Professional Skills","Work Ethic","Collaboration"],

    // fallback for form invite
    defaultInviteForm: `I'm currently building my professional network profile and thought of you as a great collaborator. I'd truly appreciate a few words of recommendation from you. If you're also building your career network, I'd be happy to write one for you in return!`,
    notFound: "⚠️ User data not found.",
    notFoundJob: "⚠️ Job experience not found.",

    // thank-you.html
    thankYou: {
      pageTitle:   "Thank You for Your Recommendation",
      title:       "✅ Thank You for Your Recommendation!",
      message:     "Your words may become a guiding light in someone’s career.",
      viewSummary: "🔗 View This Person's Public Recommendation Summary",
      invite:      "💡 Want to build your own professional network?",
      start:       "👉 Click here to get started",
      footer:      "(Once completed, you can also invite friends to recommend you and co-create your career network.)",
      warmthThanks:"💫 Thank you for your warm support. If you'd like to be seen too, we sincerely invite you to join us!",
      warmthStart: "❤️ Click here to create your profile"
    },

    // recommend-summary.html legacy
    recommendSummary: {
      pageTitle:        "Recommendation Summary",
      description:      "Overview of your recommendations",
      summaryFor:       name => `Recommendations for ${name}`,
      noProfile:        "No profile found. Please create your profile first.",
      noExperience:     "No work experiences available.",
      noRecommendation: "No recommendations yet.",
      backToProfile:    "Back to Profile",
      highlight_professional: "Professional",
      highlight_workEthic: "Work Ethic",
      highlight_interpersonal: "Interpersonal Skills",
      highlight_collaboration: "Collaboration",
      allHighlights: "All Highlights",
      relation_direct: "Direct supervisor",
      relation_cross_direct: "Cross-team supervisor",
      relation_same_dept: "Teammate",
      relation_cross_dept: "Cross-team collaborator",
      relation_subordinate: "Subordinate",
      relation_client: "Client",
      relation_vendor: "Vendor",
      allRelations: "All Relations",
      label_relation: "Relation:",
      label_highlight: "Highlight:",

    },
    // index.html
    home: {
      heroTitle: "Shine your career with real recommendations",
      heroSubtitle: "Build your story with authentic collaborations and let your light shine.",
      startButton: "Start Building",
      aboutTitle: "About Star",
      aboutText: "At Star, we believe every real collaboration deserves to be seen. Here, your everyday efforts — big or small — become shining credentials that carry your story forward.",
      learnMore: "Learn More",
      features: {
        buildProfileTitle: "Craft Your Story",
        buildProfileText: "Showcase your journey and milestones — just one experience to start your story.",
        inviteRecoTitle: "Invite and Celebrate",
        inviteRecoText: "Invite collaborators to share real moments and build lasting trust.",
        buildTrustTitle: "Grow Your Trusted Network",
        buildTrustText: "Turn real experiences into your career momentum and trusted connections."
      },
      finalCta: "Start Your Journey Today",
      finalCtaHint: "Your story doesn't have to be complete to shine. Add one experience and let trust begin."
    },
    about: {
      heroTitle: "Every star deserves to shine.",
      heroSubtitle: "At Star, every collaboration and connection becomes the start of your constellation.",
      heroButton: "Start Building",
      beliefTitle: "Our Belief",
      belief1: "Connections are the constellation of your story.",
      belief2: "Recommendations are the proof of trust built over time.",
      belief3: "Your career is a journey of connections and growth.",
      whyTitle: "Why Choose Star",
      whyText: "At Star, we see more than titles and achievements. We value the trust and stories built through real collaborations.",
      traditionalPlatform: "Traditional Platforms",
      traditional1: "Focus on resumes and job applications",
      traditional2: "Emphasis on hard skills and experiences",
      traditional3: "Purpose limited to job seeking",
      starPlatform: "Star Platform",
      star1: "Focus on real collaboration and trusted connections",
      star2: "Emphasis on stories, character, and interactions",
      star3: "Purpose to build long-term professional trust",
      howTitle: "How It Works",
      howStep1: "Add one real experience to start your story.",
      howStep2: "Invite collaborators to share their authentic impressions.",
      howStep3: "Grow your constellation of trusted connections.",
      finalTitle: "Your story deserves to be seen by the world.",
      finalSubtitle: "Start now and let every real connection become the light for your future.",
      finalButton: "Start Building"
    }
  },

  "zh-Hant": {
    // header
    login: "登入",
    logout: "登出",

    // profile-dashboard.html
    workExperiences: "工作經歷",
    addExperience: "＋ 新增工作經歷",
    addExperienceTitle: "新增工作經歷",
    company: "公司",
    position: "職稱",
    period: "期間",
    descriptionOptional: "描述（選填）",
    cancelExperience: "取消",
    saveExperience: "儲存",
    currentlyWorking: "目前在職",
    editBio: "編輯個人簡介",
    noBio: "（尚未填寫個人簡介）",
    viewSummaryAll: "查看推薦總覽",
    errEndBeforeStart: "結束日期不可早於開始日期",
    selectEnd:         "請選擇結束年月",
    errEndAfterToday: "結束日期不可晚於今天",

    // invitation templates & UI
    defaultInvite_direct: "我正在建立自己的職涯推薦檔案，想邀請您幫我寫一段我們合作時期的推薦文字。如果您願意，我也很樂意回饋推薦您！",
    defaultInvite_warmth: "我正在建立自己的職涯人脈檔案，回顧過往的工作歷程，很希望能邀請您寫下幾句對我的合作印象與推薦。如果您未來也想建立自己的職涯人脈網絡，我也很樂意推薦您，共同累積彼此的專業信譽。",
    promptEditInvite: "請確認或修改邀請語內容：",
    editInviteTitle: "編輯邀請語",
    inviteStyleLabel: "邀請語風格：",
    styleDirect: "中性版",
    styleWarmth: "溫暖版",

    // toast & confirm
    deleteConfirm: "確定刪除此經歷？",
    deleteToast: "已刪除",
    selectStart: "請選擇開始年月",
    selectEnd: "請選擇結束年月",
    linkCopied: "已複製推薦連結",
    linkCopyFailed: "複製失敗，請手動複製",

    // recommend-form.html
    recommendingTo: "您正在為 <strong>{name}</strong> 撰寫推薦",
    recPageTitle: "推薦表單",
    formTitle: "推薦表單",
    inviteTitle: "邀請內容",
    name: "您的姓名",
    email: "您的 Email",
    relation: "你是「被推薦者」的：",
    contentLabel: "推薦內容",
    hintContent: "最多 500 字，請聚焦亮點。",
    submitRecommendation: "送出推薦",
    relationOptions: [
      "我是他的直屬主管",
      "我是他的跨部門主管",
      "我是他的同部門同事",
      "我是他的跨部門同事",
      "我是他的部屬",
      "我是他的客戶",
      "我是他的供應商",
    ],
    highlightLabel: "推薦項目",

    // ◆ 四個固定亮點 key (dashboard)
    highlightOptions: ["professional","workEthic","interpersonal","collaboration"],
    highlightOptionLabels: {
      professional:  "專業能力",
      workEthic:     "工作態度",
      interpersonal: "人際互動",
      collaboration: "團隊協作"
    },
    highlightOptionCustomLabel:       "其他亮點（選填）",
    highlightOptionCustomPlaceholder: "請填寫其他亮點",
    hintCustomHighlight:              "最多 30 字，可留空",
    highlightLimitMsg:                "最多只能選 3 個亮點",

    // legacy recommend-form highlight keys
    legacyHighlightOptions: ["專業能力","工作態度","人際互動"],

    // fallback for form invite
    defaultInviteForm: `我正在建立自己的專業人脈檔案，想到您是我工作中合作愉快的夥伴，很希望能請您幫我寫幾句推薦。如果您也想建立自己的職涯人脈，我也很樂意回饋推薦您！`,
    notFound: "⚠️ 找不到使用者資料。",
    notFoundJob: "⚠️ 找不到對應的工作經歷。",

    // thank-you.html
    thankYou: {
      pageTitle:   "感謝您的推薦",
      title:       "✅ 感謝您的推薦！",
      message:     "您的一句話，可能就是他人職涯中的一束光。",
      viewSummary: "🔗 查看此人的公開推薦總表",
      invite:      "💡 想建立自己的職涯人脈網絡嗎？",
      start:       "👉 點我開始建立檔案",
      footer:      "（完成後也能請朋友推薦您，共同創造職涯網絡）",
      warmthThanks:"💫 謝謝您溫暖的支持，如果您也想被看見，我們誠摯邀請您加入！",
      warmthStart: "❤️ 點我開始建立個人檔案"
    },

    // recommend-summary.html legacy
    recommendSummary: {
      pageTitle:     "推薦總覽",
      description:   "一覽無遺",
      summaryFor:    name => `給 ${name} 的推薦`,
      noProfile:     "尚未建立個人檔案。",
      noExperience:  "尚無任何工作經歷。",
      noRecommendation: "尚無任何推薦。",
      backToProfile: "回到個人檔案",
      highlight_professional: "專業能力",
      highlight_workEthic: "工作態度",
      highlight_interpersonal: "人際互動",
      highlight_collaboration: "團隊協作",
      allHighlights: "全部亮點",
      relation_direct: "直屬主管",
      relation_cross_direct: "跨部門主管",
      relation_same_dept: "同部門同事",
      relation_cross_dept: "跨部門同事",
      relation_subordinate: "部屬",
      relation_client: "客戶",
      relation_vendor: "供應商",
      allRelations: "全部關係",
      label_relation: "推薦關係：",
      label_highlight: "亮點：",

    },
    // index.html
    home: {
      heroTitle: "讓真實推薦照亮你的職涯",
      heroSubtitle: "以真實合作建立個人檔案，讓你的故事閃耀。",
      startButton: "開始建立",
      aboutTitle: "關於 Star",
      aboutText: "在 Star，我們相信每一段真實的合作都值得被看見。無論大小，每一份努力，都將成為照亮你職涯故事的光芒。",
      learnMore: "了解更多",
      features: {
        buildProfileTitle: "打造你的故事",
        buildProfileText: "展現你的職涯旅程與成就，只需新增一段經歷，就能開啟你的故事。",
        inviteRecoTitle: "邀請與見證",
        inviteRecoText: "邀請共事夥伴，分享真實時刻，累積長遠信任。",
        buildTrustTitle: "擴展信任網絡",
        buildTrustText: "將真實經驗轉化為職涯動能，建立可信人脈網絡。"
      },
      finalCta: "立即展開你的旅程",
      finalCtaHint: "你的故事，不必等待完整。新增一段經歷，讓信任開始發光。"
    },
    about: {
      heroTitle: "讓每顆星都被看見。",
      heroSubtitle: "在 Star，每段合作與連結，都是未來星光的起點。",
      heroButton: "開始建立",
      beliefTitle: "我們相信",
      belief1: "人脈是故事的星圖。",
      belief2: "推薦是信任的證明。",
      belief3: "職涯是連結與成長的旅程。",
      whyTitle: "為什麼選擇 Star",
      whyText: "在 Star，我們不只看見你的職稱與成就，更重視你與人真實互動所累積的信任與故事。",
      traditionalPlatform: "傳統平台",
      traditional1: "聚焦填寫履歷與求職",
      traditional2: "強調硬技能與經歷",
      traditional3: "以求職為目的",
      starPlatform: "Star 平台",
      tar1: "聚焦真實合作與信任連結",
      star2: "強調故事、人格與互動",
      star3: "以建立長期職涯信任網絡為目標",
      howTitle: "開始你的星光之旅",
      howStep1: "從一個真實合作開始，建立你的故事起點。",
      howStep2: "邀請共事夥伴，見證你的專業與人格。",
      howStep3: "隨著推薦累積，點亮你的職涯星圖。",
      finalTitle: "你的故事，值得被世界看見。",
      finalSubtitle: "立即開始，讓每一段真實連結，成為你閃耀未來的光芒。",
      finalButton: "開始建立"
    },
  }
};

export function setLang(langCode = "en") {
  localStorage.setItem("lang", langCode);
  document.documentElement.lang = langCode;

  const dict = i18n[langCode] || i18n.en;

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    const keys = key.split(".");
    let text = dict;

    for (const k of keys) {
      if (text && k in text) {
        text = text[k];
      } else {
        text = null;
        break;
      }
    }

    if (typeof text === "string") {
      if (el.tagName === "OPTION") {
        el.textContent = text; // <option> 要用 textContent
      } else {
        el.innerHTML = text;
      }
    }
  });
  window.dispatchEvent(new CustomEvent("langChanged", { detail: langCode }));
}

