export const i18n = {
  en: {
    // header
    login: "Login",
    logout: "Logout",  

    // profile-dashboard.html
    onboarding: {
      title: "Quick Start ✨",
      steps: [
        "📄 Create a work experience: just company, title, dates – takes 30 seconds!",
        "Invite collaborators: click 🔗 to copy a link and send it – choose EN or ZH templates!",
        "🧑‍🤝‍🧑 Build your career reputation: once submitted, it’s shown on your profile!"
      ]
    },
    loadingDashboardMessage: "Loading your profile…",
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
    inviteCancel:       "Cancel",
    inviteSaveAndCopy:  "Save & Copy",
    noRecommendationsHint: "📭 No recommendations received yet.\n🧡 Invite a colleague to share their kind words about you!",
    viewPublicSummary: "🌟 View Public Recommendation Page",

    // invitation templates & UI
    defaultInvite_direct: "I'm building my professional career profile and would love to invite you to write a short recommendation about our time working together. If you're open to it, I'd be happy to return the favor!",
    defaultInvite_warmth: "I'm building my professional network profile, and while reflecting on our past collaborations, I’d love to invite you to share a few words about your impressions of working with me. If you ever want to build your own network, I’d be more than happy to return the recommendation and grow our professional credibility together.",
    promptEditInvite: "Please review or revise the invitation message:",
    editInviteTitle: "Edit Invitation",
    inviteStyleLabel: "Invitation Style:",
    styleDirect: "Direct",
    styleWarmth: "Warmth",
    previewLinkText: "🔍 Preview Invitation",

    // toast & confirm
    deleteConfirm: "Delete this experience?",
    deleteToast: "Deleted",
    selectStart: "Select start date",
    selectEnd: "Select end date",
    linkCopied: "Link copied!",
    linkCopyFailed: "Copy failed, please copy manually",

    // recommend-form.html
    loadingMessage: "Loading recommendation form...",
    ogTitle:       "⭐ Please write a recommendation for my career profile!",
    ogDescription: "I'm building my career profile on Star and would love your recommendation on our collaboration.",
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
    legacyHighlightOptions: ["Professional Skills","Work Ethic","Interpersonal Skills","Collaboration"],

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
      summaryFor:       name => `Recommendation Summary for ${name}`,
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
      noFilteredMatch: "No recommendations match your current filters",
      onlyShowRecommendations: "Only show recommendations",
      showWithCompany: "Show with company & role",
      exportPDF: "Export PDF",
      anonymousRecommender: "Recommender hidden",
      loadingSummaryMessage: "Loading recommendation summary…",
    },
    // index.html
    home: {
      heroTitle: `Every star has a story. Together, we form a Galaxy.`,
      heroSubtitle: `Galaxyz is a career constellation built from real recommendations. \nEach trusted collaboration tells more than a title ever could.`,
      startButton: "Create My Career Star Map",
    
      aboutTitle: "What We Believe",
      aboutText: `Your value isn’t just written on your resume — it’s reflected in the words of those you've truly worked with.\n<span class="highlight">Galaxyz</span> is not a social profile. It's a trust-based record of real collaboration.`,
      learnMore: "Learn More About Galaxyz",
    
      features: {
        buildProfileTitle: "Build Your Career Profile",
        buildProfileText: "Share your background, strengths, and work highlights so collaborators can truly see who you are.",
        inviteRecoTitle: "Invite Real Recommendations",
        inviteRecoText: "Generate a unique link for each experience and ask coworkers to write honest impressions.",
        buildTrustTitle: "Create a Trusted Career Constellation",
        buildTrustText: "Each recommendation forms a star connection. Your reputation grows not just by saying it, but by showing it."
      },
    
      finalCtaHint: "Let trust become your greatest asset — one recommendation at a time.",
      finalCta: "Start Now"
    },
    
    aboutPage: {
      heroTitle: "We believe the strongest career asset is trust.",
      heroSubtitle: "<span class=\"gala-blue\">Gala</span><span class=\"xyz-orange\">xyz</span> is a constellation built on real recommendations —\nwhere people you've worked with help you shine.",
      heroButton: "Create My Career Star Map",
    
      ourVisionTitle: "What is <span class=\"gala-blue\">Gala</span><span class=\"xyz-orange\">xyz</span>?",
      ourVisionContent: "Galaxyz was born from a simple insight: resumes often fail to show a person’s true value.\n\nWe believe a career should not be defined solely by titles or self-promotion,\nbut by the voices of those who have truly worked with you.",
    
      ourVisionBullets: [
        "Build your career profile through real collaboration",
        "Make recommendations natural, warm, and trustworthy",
        "Let your reputation be earned through shared experience",
        "Redefine your value beyond job titles"
      ],
    
      whyStarTitle: "Why the name <span class=\"gala-blue\">Gala</span><span class=\"xyz-orange\">xyz</span>?",
      whyStarContent: "Each of us is a star in our own career journey.\nThe people we've worked with form the connections on our constellation.\n\n'Galaxyz' combines 'Galaxy' with 'Z' to represent the unity of Gen X, Y, and Z\n— a galaxy formed through mutual trust and shared stories.",
    
      howItWorksTitle: "How Does It Work?",
      howItWorksSteps: [
        {
          title: "Add a Work Experience",
          desc: "Just fill out one experience you want to be recommended for — no full resume or intro needed."
        },
        {
          title: "Generate and Send the Link",
          desc: "Choose a warm or neutral message, copy your link, and send it to someone you've worked with."
        },
        {
          title: "Collect Recommendations",
          desc: "Each entry is auto-organized with both private and public views, with anonymized protection."
        }
      ],
    
      joinUsTitle: "Join Us",
      joinUsContent: `Build trust through real collaboration, and let every piece of professionalism shine.
    
    "You don’t need a promotion to prove your value.\nStart building your Galaxyz constellation — one recommendation at a time."`,
    
      joinUsButton: "Start Building"
    },
    login: {
      welcomeTitle: "Welcome to Star ✨",
    },
    header: {
      login: "Login",
      logout: "Logout",
    },

    //Recommend-Network
    recommendNetwork: {
      pageTitle: "Recommendation Network",
      title: "Recommendation Network",
      hint: "Visualizing how recommendations spread across users.",
      empty: "No recommendation data yet to display the network.",
    },
    //Recommend-Network-User
    recommendNetworkUser: {
      loading: "Loading...",
      pleaseLogin: "Please log in to view your network.",
      networkTitle: "My Recommendation Network",
      networkLoadError: "Failed to load network.",
      networkLoginPrompt: "Please log in to view your network.",
      meTag: "(me)",
      unregisteredTag: "(unregistered)"
    }
  },

  "zh-Hant": {
    // header
    login: "登入",
    logout: "登出",

    // profile-dashboard.html
    onboarding: {
      title: "快速開始 ✨",
      steps: [
        "📄 建立一段經歷：填寫公司、職稱、起訖日期，只要 30 秒！",
        "邀請合作夥伴推薦：點 🔗 複製連結，發給共事過的人，有兩種範本可選！",
        "🧑‍🤝‍🧑 累積你的職涯推薦：完成後，推薦會自動出現在你的個人檔案，展現你的專業價值！"
      ]
    },
    loadingDashboardMessage: "正在載入您的個人資料…",
    workExperiences: "工作經歷",
    addExperience: "新增工作經歷",
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
    inviteCancel:       "取消",
    inviteSaveAndCopy:  "儲存並複製",
    noRecommendationsHint: "📭 尚未收到推薦內容\n🧡 邀請合作夥伴寫下對你的肯定吧！",
    viewPublicSummary: "🌟 查看公開推薦頁",

    // invitation templates & UI
    defaultInvite_direct: "我正在建立自己的職涯推薦檔案，想邀請您幫我寫一段我們合作時期的推薦文字。如果您願意，我也很樂意回饋推薦您！",
    defaultInvite_warmth: "我正在建立自己的職涯人脈檔案，回顧過往的工作歷程，很希望能邀請您寫下幾句對我的合作印象與推薦。如果您未來也想建立自己的職涯人脈網絡，我也很樂意推薦您，共同累積彼此的專業信譽。",
    promptEditInvite: "請確認或修改邀請語內容：",
    editInviteTitle: "編輯邀請語",
    inviteStyleLabel: "邀請語風格：",
    styleDirect: "中性版",
    styleWarmth: "溫暖版",
    previewLinkText: "🔍 預覽邀請頁面",

    // toast & confirm
    deleteConfirm: "確定刪除此經歷？",
    deleteToast: "已刪除",
    selectStart: "請選擇開始年月",
    selectEnd: "請選擇結束年月",
    linkCopied: "已複製推薦連結",
    linkCopyFailed: "複製失敗，請手動複製",

    // recommend-form.html
    loadingMessage: "正在載入推薦表單…",
    ogTitle:       "⭐ 邀請你為我的職涯檔案撰寫推薦！",
    ogDescription: "我正在 Star 平台建立職涯檔案，想邀請您對我的合作經驗寫幾句推薦。",
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
    legacyHighlightOptions: ["專業能力","工作態度","人際互動","團隊協作"],

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
      summaryFor:    name => `${name} 的推薦總表`,
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
      noFilteredMatch: "目前沒有符合條件的推薦內容",
      onlyShowRecommendations: "只看推薦內容",
      showWithCompany: "顯示公司與職稱",
      exportPDF: "匯出 PDF",
      anonymousRecommender: "推薦人已隱藏",
      loadingSummaryMessage: "正在載入推薦總表…",
    },
    // index.html
    home: {
      heroTitle: `每顆星的故事，成就一整片星空`,
      heroSubtitle: `Galaxyz 是由真實合作推薦所構成的職涯星圖，\n每一段彼此信任的經驗，都比頭銜更能說明你是誰。`,
      startButton: "建立我的職涯星圖",
    
      aboutTitle: "我們相信什麼？",
      aboutText: `人的價值，不只是履歷上的職稱，而是那些曾經與你共事的人，\n願意為你寫下的那段真實合作印象。\n<span class="highlight">Galaxyz</span> 不是社交名片，而是一份被看見的信任證明。`,
      learnMore: "了解我們的理念",
    
      features: {
        buildProfileTitle: "建立個人職涯檔案",
        buildProfileText: "記錄你的經歷、簡介與職場亮點，讓合作過的夥伴看見你的真實樣貌。",
        inviteRecoTitle: "邀請真實推薦",
        inviteRecoText: "針對每段工作經歷，產生推薦連結，邀請共事者留下合作印象。",
        buildTrustTitle: "打造值得信賴的職涯星圖",
        buildTrustText: "每則推薦都是一道連結，你的信譽不只靠說，更靠曾經合作過的人證明。"
      },
    
      finalCtaHint: "用推薦打造你的職涯星圖，讓信任成為你最有力的資產。",
      finalCta: "立即開始"
    },
    aboutPage: {
      heroTitle: "我們相信職涯中最有力的資產，是信任。",
      heroSubtitle: "<span class=\"gala-blue\">Gala</span><span class=\"xyz-orange\">xyz</span> 是一個由真實推薦組成的職涯星圖，\n讓合作過的人為你發光。",
      heroButton: "開始建立我的職涯星圖",
    
      ourVisionTitle: "<span class=\"gala-blue\">Gala</span><span class=\"xyz-orange\">xyz</span> 是什麼？",
      ourVisionContent: "Galaxyz 的誕生，來自一個簡單卻被忽略的觀察：\n很多人的專業價值，其實在履歷上無法被完整呈現。\n\n我們相信，一個人的職涯，不應只靠頭銜或自我介紹來定義，\n而是來自合作過的人，願意為他留下的印象與推薦。",
    
      ourVisionBullets: [
        "將職涯檔案建立在真實合作經驗上",
        "讓推薦變得自然、溫暖而可信",
        "不靠社交按讚，而靠彼此見證",
        "重新定義你在職場上的價值"
      ],
    
      whyStarTitle: "為什麼我們叫 <span class=\"gala-blue\">Gala</span><span class=\"xyz-orange\">xyz</span>？",
      whyStarContent: "每一個人在職涯中都是一顆星，\n那些曾與你同行、合作過的人，正是你星圖上的連結點。\n\nGalaxyz 來自 Galaxy（銀河）＋ Z，象徵 X、Y、Z 世代都能共築信任星圖，\n而每顆星的故事，正成就整個銀河。",
    
      howItWorksTitle: "如何運作？",
      howItWorksSteps: [
        {
          title: "新增一段工作經歷",
          desc: "只需填寫一段你想被推薦的經歷，不用一次寫完整份履歷，也不必輸入自我介紹。"
        },
        {
          title: "產生推薦連結並發送",
          desc: "系統幫你準備好邀請內容（中性版／溫暖版），直接複製連結，發給合作過的人。"
        },
        {
          title: "收集推薦，建立信任星圖",
          desc: "推薦會自動整理成總表，系統提供私人與公開版本，內容具匿名保護。"
        }
      ],
    
      joinUsTitle: "邀請一起加入",
      joinUsContent: `在真實合作中累積信任，讓每一份專業，都有機會被看見。
    
    “你不需要等待升遷、換工作，才能證明自己的價值。\n現在就邀請合作過的夥伴，開始打造你的 Galaxyz 星圖。"`,
    
      joinUsButton: "立即加入"
    },
    
    login: {
      welcomeTitle: "歡迎來到 Star ✨"
    },
    header: {
      login: "登入",
      logout: "登出",
  },
  //Recommend-Network
  recommendNetwork: {
    pageTitle: "推薦人脈網絡圖",
    title: "推薦人脈網絡圖",
    hint: "視覺化顯示推薦如何從一位使用者擴散到另一位。",
    empty: "目前尚無推薦資料可顯示網絡圖。",
  },
  //Recommend-Network-User
  recommendNetworkUser: {
    loading: "載入中...",
    pleaseLogin: "請先登入才能查看您的人脈網絡。",
    networkTitle: "我的推薦網絡",
    networkLoadError: "載入網絡失敗。",
    networkLoginPrompt: "請先登入以查看推薦網絡。",
    meTag: "（我）",
    unregisteredTag: "（未註冊）",
  }
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

