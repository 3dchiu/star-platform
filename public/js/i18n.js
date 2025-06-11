export const i18n = {
  en: {
    // header
    login: "Login",
    logout: "Logout",  
     // Common Texts
    common: {
      submit: "Submit",
      submitting: "Submitting...",
      confirm: "Confirm",
      cancel: "Cancel",
      error: "Error",
      success: "Success",
      loading: "Loading...",
      loginRequired: "Please log in to use this feature.",
      permissionDenied: "Permission denied. Please try logging in again.",
      networkError: "Network error. Please check your connection and try again.",
      unknownError: "An unknown error occurred. Please try again later.",
      deleted: "Deleted.",
      linkCopied: "Link copied!",
      linkCopyFailed: "Please copy the link manually."
    },
    // profile-dashboard.html
    onboarding: {
      title: "Build Authentic Professional Network ✨",
      steps: [
        "Recommend a great partner who deserves recognition",
        "Reply with gratitude when you receive recommendations",
        "Invite friends to build authentic professional profiles together"
      ]
    },
    loadingDashboardMessage: "Loading your profile…",
    newRecommendation: "🛎️ You've received a new recommendation!",
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
    noRecommendationsHint: "Start by recommending amazing partners who deserve to be recognized!\nWhen others recommend you too, you can reply to build meaningful professional connections.",
    viewPublicSummary: "🌟 View Public Recommendation Page",
    showAll: (count) => `Show all ${count} recommendations`,
    showLess: "Show less",
    save: "Save",
    inviteRecommender: "Ask Friends to Recommend",
    recommendOthers: "Recommend Great Partners",
    replyRecommend: "Reply",
    edit: "Edit",
    delete: "Delete",
    recommendOthersSuccess: "Opening recommendation form...",
    recommendOthersError: "Failed to create recommendation invite, please try again",
    // 回覆相關
    canReply: "can reply to",
    replyRecommend: "Reply",
    replyOptions: "Reply Options", 
    replyOptionsDescription: "Choose how you'd like to reply:",
    selectColleagueToReply: "Select Colleague to Reply",
    startReply: "Reply with Recommendation",
    noReplyAvailable: "No recommendations available to reply to",
    loadReplyOptionsError: "Failed to load reply options, please try again",
    alreadyRecommendedThem: "You have already recommended them, no need to reply",
    replySubmittedSuccess: "Reply recommendation submitted!",
    
    // 推薦回覆選項
    recommendReply: "Recommendation Reply",
    recommendReplyDesc: "Share your observations about this colleague",
    
    // 咖啡感謝選項
    coffeeGratitude: "Coffee Gratitude",
    coffeeGratitudeDesc: "Send a cup of coffee to express thanks",
    comingSoon: "Coming Soon", 
    joinWaitlist: "Join Waitlist",
    
    // 統計文字
    received: "Received",
    recommendations: "recommendations",
    people: "people", 
    totalRecommended: "Total recommended",
    // invitation templates & UI
    defaultInvite_direct: "I'm building my professional career profile and would love to invite you to write a short recommendation about our time working together. If you're open to it, I'd be happy to return the favor!",
    defaultInvite_warmth: "I'm building my professional network profile, and while reflecting on our past collaborations, I’d love to invite you to share a few words about your impressions of working with me. If you ever want to build your own network, I’d be more than happy to return the recommendation and grow our professional credibility together.",
    inviteEmpty: "Please enter an invitation message before copying.",
    editInviteTitle: "Edit Invitation",
    inviteStyleLabel: "Invitation Style:",
    styleDirect: "Direct",
    styleWarmth: "Warmth",
    previewLinkText: "🔍 Preview Invitation",
    templateHintPrefix: "Not sure what to write?",
    insertDirect: "Insert direct version",
    insertWarmth: "Insert warm version",
    or: "or",
    invitePlaceholder: "Type a message you’d like to say to your collaborator…",
    previewReminder: "⚠️ Remember to click 'Save and Copy' or your message will not be saved.",

    // toast & confirm
    deleteConfirm: "Delete this experience?",
    deleteToast: "Deleted",
    selectStart: "Select start date",
    selectEnd: "Select end date",
    linkCopied: "Link copied!",
    linkCopyFailed: "Please copy the link below:",
    copy: "Copy",
    cancel: "Cancel",
    linkCopied: "Link copied!",
    noBio: "(No biography yet)",
    noReplyAvailable: "No recommendations available to reply to at the moment.",
    recommenderDataError: "Recommender data is incorrect. Please select again.",
    openingReplyForm: "Opening reply form...",
    openingRecommendForm: "Opening recommendation form...",
    createInviteError: "Failed to create recommendation invitation. Please try again later.",
    selectStart: "Please select a start date.",
    enterName: "Please enter a name.",
    errEndBeforeStart: "End date cannot be earlier than the start date.",
    deleteConfirm: "This action cannot be undone. Are you sure you want to delete this experience?",
    inviteEmpty: "Please enter the invitation content first.",

    // recommend-form.html
  identityReminder: "\n    <strong>\ud83c\udf1f Galaxyz is a career network built on authentic collaboration and trust.</strong><br/>\n    Only those who share a collaboration feedback can create their own profile and join the Galaxyz constellation.<br/><br/>\n    \ud83d\udc49 Please enter your real name and personal email so we can invite you afterward.\n    ",
  ogTitle: "\ud83c\udf1f Please write a collaboration feedback for my career profile!",
  ogDescription: "I'm building my career profile on Galaxyz and would love your feedback on our collaboration.",
  recommendingTo: "You are writing a collaboration feedback for <strong>{name}</strong>",
  recPageTitle: "Collaboration Feedback Form",
  formTitle: "Collaboration Feedback Form",
  inviteTitle: "Invitation Message",
  name: "Your Name",
  email: "Your Email",
  relation: "You are the candidate’s",
  contentLabel: "Collaboration Feedback",
  hintContent: "Up to 500 characters — please focus on your impressions and highlights.",
  submitRecommendation: "Submit Collaboration Feedback",
  relationOptions: [
    { value: "directManager", label: "I was their direct manager" },
    { value: "crossDeptManager", label: "I was their cross-team manager" },
    { value: "sameDeptColleague", label: "I was their teammate (same team)" },
    { value: "crossDeptColleague", label: "I was their teammate (different team)" },
    { value: "subordinate", label: "They were my subordinate" },
    { value: "client", label: "I was their client" },
    { value: "vendor", label: "I was their vendor / partner" }
  ],
  highlightLabel: "Which strengths do you particularly appreciate? (Multiple selections allowed)",
  hintName: "Please enter your name. Only the person you are recommending can see it.",
  hintEmail: "Please use your main email so we can invite you to join Galaxyz afterward.",

  highlightOptions: ["hardSkill", "softSkill", "character"],
  highlightOptionLabels: {
    hardSkill: "Hard Skills",
    softSkill: "Soft Skills",
    character: "Character & Integrity"
  },
  hintHighlights: "Select the strengths that best represent this person, or add your own.",
  highlightOptionCustomLabel: "Other Highlight (optional)",
  highlightOptionCustomPlaceholder: "Enter a custom highlight",
  hintCustomHighlight: "Up to 30 characters; optional.",
  highlightLimitMsg: "You can select up to 3 highlights only.",
  brandSlogan: "Galaxyz | Where authentic collaboration builds trusted professional connections.",
  giveRecommendationReminder: "Please ensure your feedback is truthful and based on actual collaboration experience. The recipient will be invited to register and view your feedback.",
  importantNotice: "\ud83d\udcdc Important Notice",
  confirmationNotice: "Your feedback will be officially recorded after the recipient registers and verifies their identity.",
  proTip: "\ud83d\udca1 Pro Tip",
  reminderMessage: "You can proactively message them to check their email and ensure your feedback reaches them!",
  fillAllFields: "Please fill in your name, email, feedback content, and highlight.",
  alreadyRecommended: "You have already submitted collaboration feedback for this work experience!",
  loginToSubmit: "To ensure authenticity, please log in or register to submit. Your content has been saved for you.",
  originalRecNotFound: "Original feedback not found. Cannot proceed with reply.",
  inviteNotFound: "Invitation not found. Cannot proceed with reply.",
  autofilled: "\u2713 Autofilled",
  submitError: "Failed to submit collaboration feedback. Please try again later.",
  recommendationSentTitle: "Collaboration Feedback Sent!",
  successImportantNote: "Important Note:",
  successNote1: "Your feedback will be officially recorded after the recipient registers and verifies their identity.",
  successProTip: "\ud83d\udca1 Pro Tip:",
  successNote2: "You can proactively message them to check their email and ensure your feedback reaches them!",
  successNote3: "Thank you for taking the time to share your collaboration feedback and help great talent be recognized!",
  successRecommendAnother: "Recommend Another",
  successBackToDashboard: "Back to Dashboard",
  successCloseWindow: "Close Window",
  defaultInviteForm: "I'm currently building my professional reputation profile and thought of you as a great collaborator. I'd truly appreciate a few words of feedback on our collaboration. If you are also building your professional network, I'd be happy to write one for you in return!",
  notFound: "\u26a0\ufe0f User data not found.",
  notFoundJob: "\u26a0\ufe0f Job experience not found.",

  recommendPartnerTitle: "Proactively Recommend a Colleague",
  recommendPartnerNote: "Write a collaboration feedback for your colleague from this work experience.",

  workBackground: "Work Background",
  company: "Company",
  position: "Position",
  recommenderName: "Recommender",

  recommendeeName: "Colleague's Name",
  recommendeeEmail: "Colleague's Email",
  selectRelation: "Select Relationship",

  hintRecommendeeName: "Enter your colleague's full name.",
  hintRecommendeeEmail: "We'll send them an invitation to view your feedback.",

  submitRecommendation: "Submit Collaboration Feedback",
  submitting: "Submitting...",
  closeWindow: "Close Window",
  backToDashboard: "Back to Dashboard",

  importantNote: "Important Note",
  giveRecommendationReminder: "Please ensure your feedback is truthful and based on actual collaboration experience. Your colleague will receive an email invitation to register and view your feedback.",

  recommendationSentTitle: "Collaboration Feedback Sent!",
  recommendationSentMessage: "Your feedback has been sent successfully. Your colleague will receive an email notification.",
  thankYouMessage: "Thank you for taking the time to share your collaboration feedback and help great talent be recognized!",
    
    // 錯誤訊息
    errorMissingName: "Please enter the colleague's name",
    errorMissingEmail: "Please enter the colleague's email",
    errorInvalidEmail: "Please enter a valid email address",
    errorMissingRelation: "Please select your relationship",
    errorMissingContent: "Please write your recommendation",
    errorMissingHighlight: "Please select at least one highlight",
    submitError: "Failed to send recommendation. Please try again later.",

    // thank-you.html
    thankYou: {
      pageTitle: "Galaxyz – Thank You for Your Recommendation",
      title: "Your recommendation has been submitted!",
      message: "Your words are not just memories — they are a guiding light in someone’s career journey.",
      summaryIntro: "Others have also shared their impressions and support.",
      summaryLink: "View their public recommendation summary →",
      invite: "You’ve helped others shine. Maybe it’s time to let your own strengths be seen too.",
      start: "Create My Recommendation Profile",
      footer: "Galaxyz is a trust-based network built on real working relationships.",
      emotionalTouch: "On this career journey, we reflect and elevate each other.",
      warmthThanks: "💛 Thank you for writing me a recommendation — I'd love to write something for you too.",
      warmthStart: "Let me write a recommendation for you ✨",
      networkAlt: "Network of professional recommendations"
    },

    // recommend-summary.html legacy
    recommendSummary: {
      upgradeHint: (need, next) => `${need} more to reach Lv.${next}`,
      pageTitle:        "Recommendation Summary",
      description:      "Overview of your recommendations",
      summaryFor:       name => `Recommendation Summary for ${name}`,
      noProfile:        "No profile found. Please create your profile first.",
      noExperience:     "No work experiences available.",
      noRecommendation: "No recommendations yet.",
      backToProfile:    "Back to Profile",
      highlight_hardSkill: "Hard Skills",
      highlight_softSkill: "Soft Skills",
      highlight_character: "Character & Integrity",
      allHighlights: "All Highlights",
      relationFilterOptions: [
        { value: "directManager",      label: "Direct Supervisor" },
        { value: "crossDeptManager",   label: "Cross-team Supervisor" },
        { value: "sameDeptColleague",  label: "Teammate (Same Team)" },
        { value: "crossDeptColleague", label: "Teammate (Different Team)" },
        { value: "subordinate",        label: "Direct Report" },
        { value: "client",             label: "Client" },
        { value: "vendor",             label: "Vendor / Partner" }
      ],
      relationOptions: [
        { value: "directManager",      label: "Direct Supervisor" },
        { value: "crossDeptManager",   label: "Cross-team Supervisor" },
        { value: "sameDeptColleague",  label: "Teammate (Same Team)" },
        { value: "crossDeptColleague", label: "Teammate (Different Team)" },
        { value: "subordinate",        label: "Direct Report" },
        { value: "client",             label: "Client" },
        { value: "vendor",             label: "Vendor / Partner" }
      ],
      allRelations: "All Relations",
      label_relation: "Relation:",
      label_highlight: "Highlight:",
      noFilteredMatch: "No recommendations match your current filters",
      onlyShowRecommendations: "Only show recommendations",
      showWithCompany: "Show with company & role",
      exportPDF: "Export PDF",
      anonymousRecommender: "Recommender hidden",
      loadingSummaryMessage: "Loading recommendation summary…",
      received: "Received",
      recommendations: "Recommendations",
      showAllRec: "Show full recommendation",
      showLessRec: "Collapse recommendation",
      showAll: (count) => `Show all ${count} recommendations`,
      showLess: "Collapse recommendations",
      received: "Received",
      recommendations: "recommendations",
      highlights: "Highlight Summary",
      relations: "Relationship Summary",
      present: "Present",

    },
    // index.html
    home: {
  heroTitle: `Proactively recommend and build your trusted career network`,
  heroSubtitle: `Galaxyz enables you to proactively write authentic recommendations for your collaborators,\nwhile making your professional value more visible.\nEach trusted connection becomes a shining star in your career constellation.`,
  startButton: "Start building my trusted network",

  aboutTitle: "What do we believe?",
  aboutText: `Your value is not just your job title — it's the genuine impact witnessed by those who have worked with you.\n\nIn an AI-driven era, information is abundant but trust is scarce. Galaxyz stands at this crossroads, rebuilding authentic proof of value through proactive recommendations.\n\nThis is why we chose <span class="highlight">galaxyz.ai</span> — to let trust leave a mark in the AI era.`,
  learnMore: "Learn more about our philosophy",

  features: {
    buildProfileTitle: "Create your career profile",
    buildProfileText: "Document your experiences, highlights, and professional story — let your collaborators see the real you.",
    inviteRecoTitle: "Proactively recommend your collaborators",
    inviteRecoText: "Share your trust by writing authentic recommendations and build a reputation network that reflects your true value.",
    buildTrustTitle: "Build a trusted career constellation",
    buildTrustText: "Each recommendation is a trusted connection — your constellation showcases your influence and professional network."
  },

  finalCtaHint: "Build your career constellation through proactive recommendations — let trust become your strongest career asset.",
  finalCta: "Get started now"
},

    
    aboutPage: {
  heroTitle: "We believe trust is the most powerful career asset.",
  heroSubtitle: "<span class=\"gala-blue\">Gala</span><span class=\"xyz-orange\">xyz</span> is a career constellation built on authentic recommendations.\nProactively recommend, proactively build your trusted network.",
  heroButton: "Start building my career constellation",

  ourVisionTitle: "What is <span class=\"gala-blue\">Gala</span><span class=\"xyz-orange\">xyz</span>?",
  ourVisionContent: "Galaxyz was born from a simple yet often overlooked insight:\nMany people's true professional value cannot be fully captured on a resume.\n\nWe believe a career shouldn't be defined solely by titles or self-descriptions —\nbut by the authentic impressions and recommendations from those you've worked with.\nAnd by proactively recommending others, you contribute to a network of trust.",

  ourVisionBullets: [
    "Build your career profile on authentic collaboration experiences",
    "Make recommendations natural, warm, and trustworthy",
    "Earn trust through real experiences, not social likes",
    "Proactively recommend and grow your trusted network"
  ],

  whyStarTitle: "Why do we call it <span class=\"gala-blue\">Gala</span><span class=\"xyz-orange\">xyz</span>?",
  whyStarContent: "Each of us is a star in our career journey.\nThose who have worked and grown with you are the connection points in your constellation.\n\nGalaxyz combines Galaxy + Z — symbolizing how X, Y, Z generations can together build a constellation of trust.\nEvery story you share lights up your part of the galaxy.",

  founderNoteTitle: "A note from our founder",
  founderNoteContent: `Galaxyz.ai was born from a journey of genuine collaboration between humans and AI. This platform is the result of my exploration and learning with ChatGPT.\n\nI believe AI should not replace humans, but empower us to better explore and express our value.\n\nOne day, when you're feeling down, I hope this network of authentic trust can lift you up and help you keep moving forward.\nThat is the biggest reason why I created Galaxyz.`,

  howItWorksTitle: "How does it work?",
  howItWorksSteps: [
    {
      title: "Add a work experience",
      desc: "No need for a full resume — just add a real collaboration experience as the starting point of your trusted network."
    },
    {
      title: "Proactively recommend your collaborators",
      desc: "Write authentic recommendations for people you've worked with — pass on trust and build strong connections in your constellation."
    },
    {
      title: "Collect recommendations and build your trusted constellation",
      desc: "Your recommendations are automatically organized — the system offers both private and public views, with built-in anonymity protection."
    }
  ],

  joinUsTitle: "Let trust start with you",
  joinUsContent: `Build trust through real collaboration and let your professional value be seen.\n\n“You don't have to wait for a promotion or a job change to prove your value.\nStart by proactively recommending your collaborators — and build your trusted career constellation."`,

  joinUsButton: "Join now",
},

    login: {
      welcomeTitle: "Welcome to Galaxyz ✨",
      noAccountText_en: "Don't have an account? <a href='#' id='showRegister'>Register</a>",
      registerOnlyNote_en: "(Only users who have submitted a recommendation can register)",
      registerReminder: "Registration is currently by invitation and recommendation only. Please check if your invitation link is valid.",
      resetPassword: "Forgot your password?",
      titleInvited: "Invited to Register",
      titleCompleteToView: "Complete Registration to View Recommendation",
      titleManageRecs: "Register to Manage Your Recommendations",
      titleDefault: "Create a New Account",
      reminderInviteCodeValid: "✅ Invite code is valid. Welcome aboard!",
      reminderInviteCodeInvalid: "❌ Invite code is invalid or has expired.",
      reminderHasRecommendation: "📝 Someone wrote a recommendation for you! Register to view it.",
      reminderThanksForRecommending: "✅ Thank you for your recommendation. Register to manage your sent recommendations!",
      reminderInviteCodeRequired: "📋 Please enter a valid invite code to register.",
      errorSystem: "❌ System error. Please try again later.",
      errorEmailInUse: "This email is already in use. Please try to log in or use a different email.",
      errorWeakPassword: "Password should be at least 6 characters.",
      errorInvalidInviteCode: "Invite code is invalid or has expired. Please check and re-enter.",
      errorInviteCodeUsageLimit: "This invite code has reached its usage limit. Please contact the administrator.",
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

    // 通用文字
    common: {
      submit: "送出",
      submitting: "送出中...",
      confirm: "確定",
      cancel: "取消",
      error: "錯誤",
      success: "成功",
      loading: "載入中...",
      loginRequired: "請先登入後再使用此功能。",
      permissionDenied: "權限不足，請重新登入後再試。",
      networkError: "網路連線問題，請檢查網路後再試。",
      unknownError: "發生未知錯誤，請稍後再試。",
      deleted: "已刪除。",
      linkCopied: "已複製連結！",
      linkCopyFailed: "請手動複製連結。"
    },

    // profile-dashboard.html
    onboarding: {
      title: "開始建立職場好人脈 ✨",
      steps: [
        "推薦一位值得被看見的好夥伴",
        "當收到推薦時，記得回覆感謝",
        "邀請朋友一起建立真實的職場檔案"
      ]
    },
    loadingDashboardMessage: "正在載入您的個人資料…",
    newRecommendation: "🛎️ 你收到了一則新推薦！",
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
    noRecommendationsHint: "開始推薦值得被看見的好夥伴吧！\n當別人也推薦你時，就能互相回覆建立職場人脈。",
    viewPublicSummary: "🌟 查看公開推薦頁",
    showAll: (count) => `展開 ${count} 則推薦`,
    showLess: "收合推薦", 
    save: "儲存",
    inviteRecommender: "請朋友推薦",
    recommendOthers: "推薦好夥伴",
    replyRecommend: "回覆",
    edit: "編輯",
    delete: "刪除",
    recommendOthersSuccess: "正在開啟推薦表單...",
    recommendOthersError: "建立推薦邀請時發生錯誤，請稍後再試",
    noBio: "（尚未填寫個人簡介）",
    noReplyAvailable: "目前沒有可回覆的推薦。",
    recommenderDataError: "推薦人資料有誤，請重新選擇。",
    openingReplyForm: "正在開啟回推薦表單...",
    openingRecommendForm: "正在開啟推薦表單...",
    createInviteError: "建立推薦邀請失敗，請稍後再試。",
    selectStart: "請選擇開始年月。",
    enterName: "請填寫姓名。",
    errEndBeforeStart: "結束日期不可早於開始日期。",
    deleteConfirm: "刪除後將無法復原，確定刪除此經歷？",
    inviteEmpty: "請先輸入邀請內容。",

    // 回覆相關
    canReply: "可回覆",
    replyRecommend: "回覆", 
    replyOptions: "回覆選項",
    replyOptionsDescription: "選擇你想要的回覆方式：",
    selectColleagueToReply: "選擇要回覆的同事",
    startReply: "用推薦回覆",
    noReplyAvailable: "目前沒有可回覆的推薦",
    loadReplyOptionsError: "載入回覆選項失敗，請稍後再試",
    alreadyRecommendedThem: "你已經推薦過他們了，無需回覆推薦",
    replySubmittedSuccess: "回覆推薦已送出！",
    
    // 推薦回覆選項
    recommendReply: "推薦回覆",
    recommendReplyDesc: "分享你對這位同事的工作觀察",
    
    // 咖啡感謝選項
    coffeeGratitude: "咖啡感謝",
    coffeeGratitudeDesc: "送一杯咖啡表達感謝",
    comingSoon: "即將推出",
    joinWaitlist: "加入等候清單",
    
    // 統計文字
    received: "收到",
    recommendations: "則推薦",
    people: "人",
    totalRecommended: "共推薦",

    // invitation templates & UI
    defaultInvite_direct: "我正在建立自己的職涯人脈口碑，想邀請您幫我寫一段我們合作時期的真實口碑。如果您願意，我也很樂意回覆推薦您！",
    defaultInvite_warmth: "我正在建立自己的職涯人脈檔案，回顧過往的工作歷程，很希望能邀請您寫下幾句對我的合作印象與觀察。如果您未來也想建立自己的職涯人脈網絡，我也很樂意推薦您，共同累積彼此的專業信譽。",
    inviteEmpty: "請先輸入邀請內容再儲存與複製。",
    editInviteTitle: "編輯邀請語",
    inviteStyleLabel: "邀請語風格：",
    styleDirect: "中性版",
    styleWarmth: "溫暖版",
    previewLinkText: "🔍 預覽邀請頁面",
    templateHintPrefix: "不知道怎麼寫嗎？",
    insertDirect: "插入中性版",
    insertWarmth: "插入溫暖版",
    or: "或",
    invitePlaceholder: "請輸入您想對對方說的邀請話語…",
    previewReminder: "⚠️ 請記得按「儲存並複製」，否則推薦人會看不到你的邀請內容",

    // toast & confirm
    deleteConfirm: "刪除後將無法復原，確定刪除此經歷？",
    deleteToast: "已刪除",
    selectStart: "請選擇開始年月",
    selectEnd: "請選擇結束年月",
    linkCopied: "已複製推薦連結",
    linkCopyFailed: "請手動複製以下連結：",
    copy: "複製",
    cancel: "取消",
    linkCopied: "連結已複製！",

    // recommend-form.html
    identityReminder: `
    <strong>🌟 Galaxyz 是一個建立於真實合作與信任的職場口碑網絡。</strong><br/>
    只有完成口碑回饋的人，才能建立個人職涯檔案並加入 Galaxyz 星圖。<br/><br/>
    👉 請填寫您的真實姓名與 Email，以便後續邀請您註冊。
    `,
    loadingMessage: "正在載入推薦表單…",
    ogTitle: "⭐ 請為我撰寫一段合作口碑！",
    ogDescription: "我正在 Galaxyz 建立我的職涯口碑檔案，很希望您能留下我們合作的真實回饋。",
    recommendingTo: "您正在為 <strong>{name}</strong> 撰寫合作口碑",
    recPageTitle: "合作經驗填寫",
    jobDescriptionLabel: "工作職責",
    formTitle: "合作經驗填寫",
    inviteTitle: "被推薦人的邀請語",
    name: "您的姓名",
    email: "您的 Email",
    relation: "您與被推薦人的關係",
    contentLabel: "合作印象",
    hintContent: "最多 500 字，請聚焦您對他的合作印象與亮點。",
    submitRecommendation: "送出合作口碑",
    relationOptions: [
      { value: "directManager",       label: "我是他的直屬主管" },
      { value: "crossDeptManager",    label: "我是他的跨部門主管" },
      { value: "sameDeptColleague",   label: "我是他的同部門同事" },
      { value: "crossDeptColleague",  label: "我是他的跨部門同事" },
      { value: "subordinate",         label: "我是他的部屬" },
      { value: "client",              label: "我是他的客戶" },
      { value: "vendor",              label: "我是供應商或外部合作夥伴" },
    ],
    highlightLabel: "特別欣賞的部分",
    hintName: "請填寫您的姓名，僅被推薦人可看到。",
    hintEmail: "請放心填寫常用Email，僅未來系統核實身份使用，任何人都看不到",

    // ◆ 三個固定亮點 key (dashboard)
    highlightOptions: ["hardSkill", "softSkill", "character"],
    highlightOptionLabels: {
      hardSkill:   "硬實力",
      softSkill:   "軟實力",
      character:   "人品"
    },
    hintHighlights: "請選擇一個你印象最深刻的亮點。",
    highlightOptionCustomLabel:       "其他亮點（選填）",
    highlightOptionCustomPlaceholder: "請填寫其他亮點",
    hintCustomHighlight:              "最多 30 字，可留空",
    highlightLimitMsg:                "最多只能選 3 個亮點",

    brandSlogan: "Galaxyz | 讓真實合作口碑，成為職場最佳資產。。",
    giveRecommendationReminder: "請確保回饋內容真實且基於實際合作經驗。被推薦人將收到 Email 通知，邀請他們註冊查看你的內容。",
    importantNotice: "📋 重要說明",
    confirmationNotice: "被推薦人註冊並完成驗證後，您的合作口碑將正式紀錄。",
    proTip: "💡 小提醒",
    reminderMessage: "你可以主動傳訊息提醒對方查收 Email，確保您的口碑內容被看到！",
    fillAllFields: "請完整填寫姓名、Email、推薦內容與亮點。",
    alreadyRecommended: "您已經為這段工作經歷提交過合作口碑！",
    loginToSubmit: "為了確保推薦的真實性，請登入或註冊以完成提交。您的內容已為您保存。",

    // fallback for form invite
    defaultInviteForm: `我正在建立自己的專業人脈檔案，想到您是我工作中合作愉快的夥伴，很希望能請您幫我寫幾句推薦。如果您也想建立自己的職涯人脈，我也很樂意回饋推薦您！`,
    notFound: "⚠️ 找不到使用者資料。",
    notFoundJob: "⚠️ 找不到對應的工作經歷。",

    // 推薦他人頁面標題和說明
    recommendPartnerTitle: "推薦合作夥伴",
    recommendPartnerNote: "為你在此工作期間合作的夥伴寫下推薦",
    
    // 工作背景區塊
    workBackground: "工作背景",
    company: "公司",
    position: "職位",
    recommenderName: "推薦人",
    
    // 表單標籤
    recommendeeName: "被推薦人姓名",
    recommendeeEmail: "被推薦人 Email",
    selectRelation: "請選擇關係",
    
    // 表單提示文字
    hintRecommendeeName: "請填寫被推薦人的真實姓名",
    hintRecommendeeEmail: "系統將發送通知邀請對方觀看",

    // 按鈕文字
    submitRecommendation: "送出推薦",
    submitting: "送出中...",
    closeWindow: "關閉視窗",
    backToDashboard: "返回首頁",
    
    // 最終提醒
    importantNote: "重要提醒",
    giveRecommendationReminder: "請確保推薦內容真實且基於實際合作經驗。被推薦人將收到 Email 通知，邀請他們註冊查看你的推薦。",
    
    // 成功訊息
    recommendationSentTitle: "推薦已送出！",
    recommendationSentMessage: "你的推薦已成功送出，被推薦人將收到 Email 通知。",
    thankYouMessage: "感謝你花時間為合作夥伴寫推薦，讓優秀的人才被看見！",
    
    // 錯誤訊息
    errorMissingName: "請填寫被推薦人姓名",
    errorMissingEmail: "請填寫被推薦人 Email",
    errorInvalidEmail: "請填寫有效的 Email 地址",
    errorMissingRelation: "請選擇關係",
    errorMissingContent: "請填寫推薦內容",
    errorMissingHighlight: "請選擇至少一個亮點",
    submitError: "推薦提交失敗，請稍後再試",

    // give-recommendation.js
    originalRecNotFound: "找不到原始推薦記錄，無法進行回推薦。",
    inviteNotFound: "找不到邀請記錄，無法進行回推薦。",
    autofilled: "✓ 已自動填入",
    submitError: "推薦提交失敗，請稍後再試。",
    // 成功頁面 (showSuccess)
    recommendationSentTitle: "推薦已送出！",
    successImportantNote: "重要說明：",
    successNote1: "推薦將在對方註冊並核實身份後，正式納入你的推薦記錄。",
    successProTip: "💡 小提醒：",
    successNote2: "你可以主動傳訊息提醒對方查收 Email，以確保推薦能順利送達！",
    successNote3: "感謝你花時間為合作夥伴寫推薦，讓優秀的人才被看見。",
    successRecommendAnother: "推薦其他人",
    successBackToDashboard: "返回儀表板",
    successCloseWindow: "關閉視窗",

    // thank-you.html
    thankYou: {
      pageTitle: "Galaxyz – 感謝您的推薦",
      title: "您的推薦已成功送出！",
      message: "這段話語，不只是回憶，更是他人職涯中最有力量的光芒。",
      summaryIntro: "還有其他人，也留下了他們的肯定與見證。",
      summaryLink: "查看他的公開推薦總表 →",
      invite: "您也曾照亮他人，是時候讓自己被更多人看見。",
      start: "建立我的推薦檔案",
      footer: "Galaxyz 相信每一段真實合作，都值得被記錄與信任。",
      emotionalTouch: "在職涯的旅途中，我們互相映照、互相成就。",
      warmthThanks: "💛 謝謝你為我寫下推薦，我也想寫幾句話送給你。",
      warmthStart: "讓我為你寫一段推薦 ✨",
      networkAlt: "人際推薦網絡圖",
    },

    // recommend-summary.html legacy
    recommendSummary: {
      upgradeHint: (need, next) => `再收到 ${need} 筆推薦可升 Lv.${next}`,
      pageTitle:     "推薦總覽",
      description:   "一覽無遺",
      summaryFor:    name => `${name} 的推薦總表`,
      noProfile:     "尚未建立個人檔案。",
      noExperience:  "尚無任何工作經歷。",
      noRecommendation: "尚無任何推薦。",
      backToProfile: "回到個人檔案",
      highlight_hardSkill: "硬實力",
      highlight_softSkill: "軟實力",
      highlight_character: "人品",
      allHighlights: "全部亮點",
      relationFilterOptions: [
        { value: "directManager", label: "直屬主管" },
        { value: "crossDeptManager", label: "跨部門主管" },
        { value: "sameDeptColleague", label: "同部門同事" },
        { value: "crossDeptColleague", label: "跨部門同事" },
        { value: "subordinate", label: "部屬" },
        { value: "client", label: "客戶" },
        { value: "vendor", label: "供應商或外部合作夥伴" }
      ],
      relationFilterOptions: [
        { value: "directManager",      label: "直屬主管" },
        { value: "crossDeptManager",   label: "跨部門主管" },
        { value: "sameDeptColleague",  label: "同部門同事" },
        { value: "crossDeptColleague", label: "跨部門同事" },
        { value: "subordinate",        label: "部屬" },
        { value: "client",             label: "客戶" },
        { value: "vendor",             label: "供應商或外部合作夥伴" }
      ],
      allRelations: "全部關係",
      label_relation: "推薦關係：",
      label_highlight: "亮點：",
      noFilteredMatch: "目前沒有符合條件的推薦內容",
      onlyShowRecommendations: "只看推薦內容",
      showWithCompany: "顯示公司與職稱",
      exportPDF: "匯出 PDF",
      anonymousRecommender: "推薦人已隱藏",
      loadingSummaryMessage: "正在載入推薦總表…",
      received: "收到",
      recommendations: "則推薦",
      showAll: (count) => `展開 ${count} 則推薦`,
      showLess: "收合推薦",
      received: "收到",
      recommendations: "則推薦",
      highlights: "亮點統計",
      relations: "關係統計",
      present: "目前在職",

    },
    // index.html
    home: {
  heroTitle: `主動推薦，累積你的職涯信任網絡`,
  heroSubtitle: `Galaxyz 讓你主動為合作夥伴撰寫真實推薦，\n也讓你的專業價值被更多人見證。\n每一段信任關係，都是職涯星圖上的一顆亮星。`,
  startButton: "開始建立我的信任網絡",

  aboutTitle: "我們相信什麼？",
  aboutText: `人的價值，不只是履歷上的職稱，更是那些曾與你共事的人，願意見證你帶來的真實影響。\n\n在 AI 時代，資訊越來越多，信任卻越來越稀薄。Galaxyz 選擇站在這個十字路口，\n用主動推薦的方式，重建值得被看見的價值證明。\n\n這也是為什麼，我們選擇 <span class="highlight">galaxyz.ai</span> —— 在 AI 時代，讓信任留下記錄。`,
  learnMore: "了解我們的理念",

  features: {
    buildProfileTitle: "建立個人職涯檔案",
    buildProfileText: "記錄你的經歷、簡介與職場亮點，展現你的專業價值。",
    inviteRecoTitle: "主動推薦合作夥伴",
    inviteRecoText: "透過主動推薦，把信任傳遞出去，也累積屬於自己的真實信譽。",
    buildTrustTitle: "打造值得信賴的職涯星圖",
    buildTrustText: "每則推薦都是一道信任連結，職涯星圖見證你的人脈資產與職場影響力。"
  },

  finalCtaHint: "用主動推薦，打造你的職涯星圖，讓信任成為你最有力的職涯資產。",
  finalCta: "立即開始"
},

    aboutPage: {
  heroTitle: "我們相信職涯中最有力的資產，是信任。",
  heroSubtitle: "<span class=\"gala-blue\">Gala</span><span class=\"xyz-orange\">xyz</span> 是一個由真實合作推薦構成的職涯星圖，\n主動推薦，主動建立信任網絡。",
  heroButton: "開始打造我的職涯星圖",

  ourVisionTitle: "<span class=\"gala-blue\">Gala</span><span class=\"xyz-orange\">xyz</span> 是什麼？",
  ourVisionContent: "Galaxyz 的誕生，來自一個簡單卻被忽略的觀察：\n很多人的專業價值，其實在履歷上無法被完整呈現。\n\n我們相信，一個人的職涯，不應只靠頭銜或自我介紹來定義，\n而是來自合作過的人願意留下的真實推薦，\n更進一步，透過主動推薦，把信任傳遞下去。",

  ourVisionBullets: [
    "將職涯檔案建立在真實合作經驗上",
    "讓推薦變得自然、溫暖而可信",
    "不靠社交按讚，而靠彼此見證",
    "主動推薦，累積專屬信任網絡"
  ],

  whyStarTitle: "為什麼我們叫 <span class=\"gala-blue\">Gala</span><span class=\"xyz-orange\">xyz</span>？",
  whyStarContent: "每一個人在職涯中都是一顆星，\n那些曾與你同行、合作過的人，正是你星圖上的連結點。\n\nGalaxyz 來自 Galaxy（銀河）＋ Z，象徵 X、Y、Z 世代都能共築信任星圖，\n每顆星的故事，成就整個銀河，而你也可以主動點亮更多星辰。",

  founderNoteTitle: "創辦者手記",
  founderNoteContent: `Galaxyz.ai 的誕生，來自一段人與 AI 真誠合作的旅程。這個平台，是我與 ChatGPT 共同摸索、嘗試與學習的成果。我相信，AI 並非取代人，而是成為支持人探索價值的助力。希望有一天，當你們情緒低落時，都能被這真實溫暖的信任接住。然後繼續前進，這就是我做 Galaxyz 最大的初衷。`,

  howItWorksTitle: "如何運作？",
  howItWorksSteps: [
    {
      title: "新增一段工作經歷",
      desc: "不需寫履歷，只需新增一段真實合作經歷，作為建立信任網絡的起點。"
    },
    {
      title: "主動推薦合作夥伴",
      desc: "主動為曾合作過的人撰寫推薦，傳遞信任，也為自己的星圖建立更多可信連結。"
    },
    {
      title: "收集推薦，建立信任星圖",
      desc: "推薦會自動整理成總表，系統提供私人與公開版本，內容具匿名保護。"
    }
  ],

  joinUsTitle: "讓信任從你開始傳遞",
  joinUsContent: `在真實合作中累積信任，讓每一份專業，都有機會被看見。\n\n“你不需要等待升遷、換工作，才能證明自己的價值。\n主動為夥伴寫下一段推薦，也為自己建立更堅實的人脈星圖。"`,
  
  joinUsButton: "立即加入",
},

    
    login: {
      welcomeTitle: "歡迎來到 Galaxyz✨ ",
      noAccountText: "還沒有帳號？<a href='#' id='showRegister'>註冊</a>",
      registerOnlyNote: "（僅限曾填寫推薦表者可註冊）",
      registerReminder: "目前僅限受邀者與推薦人註冊，請確認您的邀請連結是否正確。",
      resetPassword: "忘記密碼？",
      titleInvited: "受邀註冊",
      titleCompleteToView: "完成註冊查看推薦",
      titleManageRecs: "註冊管理推薦記錄",
      titleDefault: "註冊新帳號",
      reminderInviteCodeValid: "✅ 邀請碼有效，歡迎加入！",
      reminderInviteCodeInvalid: "❌ 邀請碼無效或已過期",
      reminderHasRecommendation: "📝 有人為你寫了推薦，註冊後即可查看！",
      reminderThanksForRecommending: "✅ 感謝您提供推薦，註冊後可管理您的推薦記錄！",
      reminderInviteCodeRequired: "📋 請輸入有效的邀請碼以完成註冊。",
      // 錯誤訊息
      errorSystem: "❌ 系統錯誤，請稍後再試",
      errorEmailInUse: "此 Email 已被註冊，請嘗試登入或使用其他 Email。",
      errorWeakPassword: "密碼至少需要 6 個字元。",
      errorInvalidInviteCode: "邀請碼無效或已過期，請確認後重新輸入。",
      errorInviteCodeUsageLimit: "邀請碼使用次數已達上限，請聯繫管理員。",
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

window.i18n = i18n;