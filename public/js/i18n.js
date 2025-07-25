// 保持你原有的全域暴露
export const i18n = {
  en: {
    // header
    login: "Login",
    logout: "Logout",

    // level
    level1_name: "Spark of Initiative",
    level2_name: "Solid Collaborator", 
    level3_name: "Trusted Partner",
    level4_name: "Team Navigator",
    level5_name: "Star Connector",
    level6_name: "Sphere of Sincerity",
    level7_name: "Sphere of Influence", 
    level8_name: "Industry Benchmark",
    level9_name: "Career Champion",
    level10_name: "Stellar Leader",

    // Common Texts
    common: {
      submit: "Submit",
      submitting: "Submitting...",
      confirm: "Confirm",
      cancel: "Cancel",
      error: "Error",
      success: "Success",
      loading: "Loading...",
      save: "Save",
      delete: "Delete",
      edit: "Edit",
      closeWindow: "Close Window",
      backToDashboard: "Back to Dashboard",
      company: "Company",
      position: "Position",
      loginRequired: "Please log in to use this feature.",
      permissionDenied: "Permission denied. Please try logging in again.",
      networkError: "Network error. Please check your connection and try again.",
      unknownError: "An unknown error occurred. Please try again later.",
      deleted: "Deleted.",
      linkCopied: "Link copied!",
      linkCopyFailed: "Please copy the link manually.",
      loadingError: "Loading failed",
    },
    
    // profile-dashboard.html
    profileDashboard: {
      onboarding: {
        title: "Start with giving — become a GIVER ✨",
        steps: [
          "<strong>Give a recommendation</strong> to someone you’ve worked with and believe in<br/><span class='exp-badge'>+10 EXP</span> (You’re helping them shine)",
          "<strong>Receive</strong> a genuine recommendation from someone<br/><span class='exp-badge'>+5 EXP</span> (Trust becomes your visible value)",
          "<strong>Reply</strong> to a recommendation you’ve received with gratitude<br/><span class='exp-badge'>+3 EXP</span> (Let trust become a two-way connection)"
        ],
        footer: "All EXP will be granted once the recommendation is verified. Your star map will light up with every new connection."
      },

      onboardingModal: {
        modalTitle: "Welcome to Galaxyz!",
        modalSubtitle: "Please complete your basic profile to get started.",
        step1: "Step 1: Your Name",
        step2: "Step 2: Your First Work Experience",
        getStarted: "Get Started with Galaxyz",
        placeholderNameWithWarning: "Cannot be changed once submitted",
      },
      // Level System
      upgradeHint: (expNeeded, nextLevel) => `${expNeeded} EXP to reach Lv.${nextLevel}`,
      maxLevelReached: "Maximum level reached",
      maxLevel: "MAX",
      level1_name: "Spark of Initiative",
      level2_name: "Solid Collaborator",
      level3_name: "Trusted Partner",
      level4_name: "Team Navigator",
      level5_name: "Star Connector",
      level6_name: "Sphere of Sincerity",
      level7_name: "Sphere of Influence",
      level8_name: "Industry Benchmark",
      level9_name: "Career Champion",
      level10_name: "Stellar Leader",
      
      // Page & General UI
      profileTitle: "My Career Profile",
      loadingDashboardMessage: "Loading your profile…",
      bio: "Bio",
      noBio: "(No bio has been added yet)",
      workExperiences: "Work Experiences",
      addExperience: "Add Experience",
      viewSummaryAll: "View All Recommendations",
      viewPublicSummary: "🌟 View Public Profile",

      // Edit Profile Modal
      editProfileTitle: "Edit Profile",
      labelName: "Name (Native Language)",
      labelEnglishName: "English Name",
      labelEnglishNameOptional: "English Name (Optional)",
      labelHeadline: "Headline",
      placeholderHeadline: "A brief introduction, e.g., Software Engineer passionate about product design",
      labelBio: "Bio",
      
      // Add/Edit Experience Modal
      addExperienceTitle: "Add Experience",
      editExperienceTitle: "Edit Experience",
      editDescriptionTitle: "Edit Work Description",
      company: "Company",
      position: "Position",
      period: "Period",
      currentlyWorking: "Currently working",
      descriptionOptional: "Description (Optional)",
      placeholderDescription: "Briefly describe your main responsibilities, projects, or achievements in this role...",

      // Buttons
      cancel: "Cancel",
      save: "Save",
      saveChanges: "Save Changes",
      saving: "Saving...",
      edit: "Edit",
      delete: "Delete",
      
      // Toasts & Alerts
      updateSuccess: "✅ Update successful!",
      updateFailed: "❌ Update failed: ",
      selectStart: "Please select the start date",
      enterName: "Please enter your name",
      selectEnd: "If you are no longer working here, please select the end date",
      errEndBeforeStart: "End date cannot be earlier than start date",
      errEndAfterToday: "End date cannot be after today",
      editLockWarning: "Once this experience has a verified recommendation, core fields (Company, Position, Start Date) cannot be modified.",
      deleteConfirm: "Are you sure you want to delete this experience?",
      deleted: "Deleted",
      
      // Recommendation Stats & Actions
      received: "Received",
      recommendations: "recommendations",
      noRecommendation: "No recommendations yet",
      canReply: "Can reply to",
      people: "people",
      totalRecommended: "Recommended",
      hintBoth: (p) => `You have ${p.pending} pending recommendations and ${p.failed} failed verifications.`,
      hintPendingOnly: (p) => `You have ${p.count} recommendations pending data completion from the other party for verification.`,
      hintFailedOnly: (p) => `You have ${p.count} recommendations that failed verification due to mismatched data.`,
      noHighlights: "No highlight statistics yet",
      noRelations: "No relation statistics yet",
      highlights: "Highlights",
      relations: "Relations",
      noRecsTitle: "Start building your professional credibility!",
      noRecsAction1: "Endorse a great colleague by clicking '🤝 Recommend Others'",
      noRecsAction2: "Invite colleagues to vouch for you by clicking '📨 Invite to Recommend'",
      recommendOthers: "Recommend a Partner",
      replyRecommend: "Reply",
      inviteRecommender: "Invite to Recommend",
      successfulRecommendation: "successful recommendation",
      
      // Reply Flow
      noReplyAvailable: "No recommendations available to reply to at the moment.",
      loadReplyOptionsError: "Failed to load reply options. Please try again later.",
      recommenderDataError: "Recommender data is invalid, unable to proceed with reply.",
      openingReplyForm: "Opening the reply form for you...",
      openingUnregisteredReplyForm: "Opening the reply form. It will be linked automatically after the recipient registers.",
      allReplied: "You have replied to all recommenders ✅",
      startReply: "Reply with Recommendation",
      verifiedBadgeText: "✅ Work relationship confirmed",
      registeredBadgeText: "Registered",
      unregisteredBadgeText: "Not Registered",
      select: "Select",
      
      // Invite Recommendation Feature
      inviteModalTitle: "Invite Colleague Recommendation",
      inviteMessage: "Invitation Message",
      invitePlaceholder: "Please enter your invitation message to your colleague...",
      inviteEmpty: "Invitation message cannot be empty",
      
      // Template Buttons
      insertDirectBtn: "📋 Insert Professional Template",
      insertWarmthBtn: "🤗 Insert Warm Template",
      previewLink: "🔍 Preview Recommendation Form",
      inviteSaveBtn: "💾 Save & Copy Link",
      inviteCancelBtn: "Cancel",
      
      // Template Hint
      templateHint: "💡 Not sure what to write? Choose a template to get started:",
      
      // Invitation Message Templates
      inviteTemplates: {
        inviteSenior: {
            name: "Invite a Senior",
            message: `Hi {Recipient Name},\n\nHope you're doing well! I often look back on our time working together at {company}. I especially remember your guidance and help, which had a great impact on me.\n\nI'm currently updating my career profile and was wondering if you would be willing to write a brief recommendation about my performance back then. It would mean a lot.\n\nThank you so much!\n\nBest,\n{userName}`
        },
        invitePeer: {
            name: "Invite a Peer",
            message: `Hi {Recipient Name},\n\nHow's it going? I was just thinking about our time working together at {company}. Good times!\n\nI'm building my professional trust profile on a new platform and would love for you to write a few words about my work. Your perspective would be incredibly valuable.\n\nThanks a bunch!\n\nCheers,\n{userName}`
        },
        inviteJunior: {
            name: "Invite a Junior",
            message: `Hi {Recipient Name},\n\nHope you're well! I'm currently organizing my past project and leadership experiences, and our time at {company} came to mind.\n\nTo make my record more complete, I'd like to invite you to share a sentence from your perspective about my management or collaboration style back then. Your feedback is highly valuable to me.\n\nThanks for your help!\n\nBest,\n{userName}`
        }
      },

      
      // Success/Error Messages for Invite
      inviteLinkCopied: "✅ Invitation link copied to clipboard!",
      inviteCreateSuccess: "✅ Invitation created successfully!",
      inviteCreateFailed: "❌ Failed to create invitation, please try again later",
      inviteCopyFailed: "❌ Copy failed, please manually copy the link",
      
      // Other Helper Text
      unknownCompany: "the company",
      
      // Legacy Invite Flow
      editInviteTitle: "Edit Invitation",
      templateHintPrefix: "Not sure what to write?",
      insertDirect: "Insert direct version",
      or: "or",
      insertWarmth: "Insert warm version",
      previewReminder: "⚠️ Remember to click 'Save and Copy' or your message will not be saved.",
      previewLinkLabel: "Preview Link",
      inviteSaveAndCopy: "Save & Copy",
      
      // Copy Related
      linkCopyFailed: "Copy failed, please manually copy the link below:",
      copy: "Copy",
      
      // Reply Options
      replyOptions: "Reply Options",
      recommendReply: "Recommendation Reply",
      recommendReplyDesc: "Share your observations about this colleague",
      coffeeGratitude: "Coffee Gratitude", 
      comingSoon: "Coming Soon",
      coffeeGratitudeDesc: "Send a cup of coffee to express thanks",
      joinWaitlist: "Join Waitlist",
      selectColleagueToReply: "Select Colleague to Reply",
      
      // Waitlist Related
      waitlistTitle: "☕ Coffee Gratitude Feature Waitlist",
      waitlistDesc1: "We're developing a coffee gratitude feature that lets you thank colleagues who recommended you with a cup of coffee.",
      waitlistDesc2: "Leave your email and we'll notify you as soon as the feature launches!",
      labelEmail: "Email",
      placeholderEmail: "your.email@example.com",
      labelCoffeePrice: "What's your preferred coffee price range?",
      coffeePriceOption1: "US$ 3-5 (Convenience store coffee)",
      coffeePriceOption2: "US$ 6-8 (Chain coffee shop)", 
      coffeePriceOption3: "US$ 9-12 (Specialty coffee)",
      coffeePriceOption4: "Flexible choice",
      joinWaitlist: "Join Waitlist",
      
      // System Errors
      systemInitError: "System initialization failed, please refresh the page",
      firebaseConnectionError: "Firebase connection failed, please check your network and refresh",
      firebaseSDKNotLoaded: "Firebase SDK not loaded, please check script loading order",
      firebaseInitTimeout: "Firebase initialization timeout, please check if firebase-init.js is loaded correctly",
      loadingError: "Oops, loading failed",
      loadingErrorDesc: "Unable to load your profile data. Please check your network connection and try again.",
      errorDetails: "Error details",
      refreshPage: "Refresh Page",
      newUser: "New User",
      
      // Form Related
      requiredFieldsEmpty: "Please fill in all required fields",
      addSuccess: "Added successfully!",
      editSuccess: "Updated successfully!",
      confirmDelete: "Confirm Delete",
      
      // Reply Recommendation Related
      originalRecommendationNotFound: "Original recommendation not found",
      replyFormTitle: "Reply Recommendation Form", 
      recommendFormTitle: "Recommendation Form",
      waitlistSignupSuccess: "✅ Successfully joined the waitlist! We'll notify you when the feature launches",
      waitlistSignupError: "❌ Failed to join waitlist, please try again later",
      
      // Smart Opening Related
      attemptingNewTab: "Attempting to open in new tab",
      newTabBlocked: "New tab blocked",
      fallbackToSameWindow: "Falling back to same window",
      newTabSuccess: "New tab opened successfully", 
      
      // Page Titles
      recommendSummaryTitle: "Recommendation Summary",
      publicSummaryTitle: "Public Profile",
      
      // General Errors (consolidating)
      createInviteError: "Failed to create invitation, please try again later.",
      openingRecommendForm: "Opening recommendation form...",
      permissionDenied: "Permission denied for this operation",
      networkError: "Network error, please try again later",
      loginRequired: "Please log in to use this feature.",
      manualCopyTitle: "📋 Copy Link Manually",
      manualCopyDesc: "Auto-copy failed, please manually copy the link below:",
      copyBtn: "Copy",
      close: "Close",

      // Add these missing placeholder keys
      placeholderHeadline: "e.g., Software Engineer passionate about product design",
      placeholderDescription: "Briefly describe your main responsibilities, projects, or achievements...",
    },

    // recommend-form.html
    recommendForm: {
      // 頁面和表單基本資訊
      identityReminder: "\n    <strong>🌟 Galaxyz is a career network built on authentic collaboration and trust.</strong><br/>\n    Only those who share a collaboration feedback can create their own profile and join the Galaxyz constellation.<br/><br/>\n    👉 Please enter your real name and personal email so we can invite you afterward.\n    ",
      ogTitle: "🌟 Please write a collaboration feedback for my career profile!",
      ogDescription: "I'm building my career profile on Galaxyz and would love your feedback on our collaboration.",
      loadingMessage: "Loading recommendation form...",
      recPageTitle: "Collaboration Feedback Form",
      formTitle: "Collaboration Feedback Form",
      recommendPartnerTitle: "Proactively Recommend a Colleague",
      recommendPartnerNote: "Write a collaboration feedback for your colleague from this work experience.",
      
      // 基本表單標籤
      name: "Your Name",
      email: "Your Email",
      relation: "You are the candidate's",
      highlightLabel: "Which strengths do you particularly appreciate? (Multiple selections allowed)",
      contentLabel: "Collaboration Feedback",
      inviteTitle: "Invitation Message",
      selectRelation: "Select Relationship",
      submitRecommendation: "Submit Recommendation",
      recommenderJobLabel: "Based on which of your work experiences is this recommendation?",
      loadingJobs: "Loading your experiences...",
      identityReminder: (email) => `To ensure the authenticity of every recommendation, after submission, we will send a confirmation link to <strong>${email}</strong>. Please click it to complete the final step.`,
      
      // 推薦他人模式標籤
      recommendeeName: "Colleague's Name", 
      recommendeeEmail: "Colleague's Email",
      
      // 工作背景
      workBackground: "Work Background",
      recommenderName: "Recommender",
      
      // 回推薦相關
      replyRecommendNote: "Thank your colleague for their recommendation, now write one for your work partner from this period",
      replyBackground: "Reply Recommendation Background",
      hintReplyName: "Enter the name of the colleague you want to recommend back", 
      hintReplyEmail: "The system will notify them to view your recommendation",
      
      // 表單提示文字
      hintName: "Please enter your name. Only the person you are recommending can see it.",
      hintEmail: "Please use your main email so we can invite you to join Galaxyz afterward.",
      hintContent: "Up to 500 characters — please focus on your impressions and highlights.",
      hintRecommendeeName: "Enter your colleague's full name.",
      hintRecommendeeEmail: "We'll send them an invitation to view your feedback.",
      hintHighlights: "Select the strengths that best represent this person, or add your own.",
      hintCustomHighlight: "Up to 30 characters, optional.",
      hintRelation: "Please select your working relationship with the recommendee",
      
      // 關係選項
      relationOptions: [
        { value: "directManager", label: "I was their direct manager" },
        { value: "crossDeptManager", label: "I was their cross-team manager" },
        { value: "sameDeptColleague", label: "I was their teammate (same team)" },
        { value: "crossDeptColleague", label: "I was their teammate (different team)" },
        { value: "subordinate", label: "They were my subordinate" },
        { value: "client", label: "I was their client" },
        { value: "vendor", label: "I was their vendor / partner" }
      ],
      
      // 關係選項標籤
      relationLabels: {
        directManager: "I was their direct manager",
        crossDeptManager: "I was their cross-team manager",
        sameDeptColleague: "I was their teammate (same team)", 
        crossDeptColleague: "I was their teammate (different team)",
        subordinate: "They were my subordinate",
        client: "I was their client",
        vendor: "I was their vendor / partner"
      },
      
      // 亮點選項
      highlightOptions: ["hardSkill", "softSkill", "character"],
      highlightOptionLabels: {
        hardSkill: "Hard Skills",
        softSkill: "Soft Skills",
        character: "Character & Integrity"
      },
      highlightOptionCustomLabel: "Other Highlight (optional)",
      highlightOptionCustomPlaceholder: "Enter a custom highlight",
      highlightLimitMsg: "You can select up to 3 highlights only.",
      
      // 系統訊息和提醒
      importantNotice: "📋 Important Notice",
      confirmationNotice: "Your feedback will be officially recorded after the recipient registers and verifies their identity.",
      giveRecommendationReminder: "Please ensure the recommendation content is authentic and based on actual collaboration experience. The recommendee will receive an email notification inviting them to register and view your recommendation.",
      proTip: "💡 Pro Tip",
      reminderMessage: "You can proactively message them to check their email and ensure your feedback reaches them!",
      brandSlogan: "Galaxyz | Where authentic collaboration builds trusted professional connections.",
      
      // 表單驗證和錯誤訊息
      fillAllFields: "Please fill in your name, email, feedback content, and highlight.",
      alreadyRecommended: "You have already submitted collaboration feedback for this work experience!",
      loginToSubmit: "To ensure authenticity, please log in or register to submit. Your content has been saved for you.",
      errorMissingName: "Please enter the colleague's name",
      errorMissingEmail: "Please enter the colleague's email",
      errorInvalidEmail: "Please enter a valid email address",
      errorMissingRelation: "Please select your relationship",
      errorMissingContent: "Please write your recommendation",
      errorMissingHighlight: "Please select at least one highlight",
      submitError: "Recommendation submission failed, please try again later",
      
      // 成功頁面
      recommendationSentTitle: "Collaboration Feedback Sent!",
      successImportantNote: "Important Note:",
      successNote1: "Your feedback will be officially recorded after the recipient registers and verifies their identity.",
      successProTip: "💡 Pro Tip:",
      successNote2: "You can proactively message them to check their email and ensure your feedback reaches them!",
      successNote3: "Thank you for taking the time to share your collaboration feedback and help great talent be recognized!",
      successRecommendAnother: "Recommend Another",
      
      // 錯誤和狀態訊息
      originalRecNotFound: "Original feedback not found. Cannot proceed with reply.",
      inviteNotFound: "Invitation not found or invalid",
      autofilled: "✓ Autofilled",
      notFound: "⚠️ User data not found.",
      notFoundJob: "⚠️ Job experience not found.",
      
      // 其他
      defaultInviteForm: "I'm currently building my professional reputation profile and thought of you as a great collaborator. I'd truly appreciate a few words of feedback on our collaboration. If you are also building your professional network, I'd be happy to write one for you in return!",
      recommendingTo: "You are writing a collaboration feedback for <strong>{name}</strong>",

      // 錯誤訊息
      errorMissingInviteId: "Missing inviteId parameter, cannot load the page.",
      backendError: "Backend processing failed.",
      errorFirebaseTimeout: "Firebase initialization timed out, please check your network connection.",
      errorInviteTimeout: "Loading invitation data timed out.",
      errorInviteNotFound: "Invitation not found or has expired.",
      errorUserTimeout: "Loading user data timed out.",
      errorUserNotFound: "User data not found.",
      errorJobNotFound: "Could not find work experience: {jobId}", // {jobId} 是變數
      errorFormIncomplete: "The form is not completely filled out.",

      // 載入提示
      loadingInvite: "Loading invitation data...",
      loadingPreview: "Loading preview data...",
      loadingUser: "Loading user data...",
      processingJobs: "Processing work experiences...",

      // UI 文字
      selectExperience: "Please select which experience this recommendation is based on...",
      selectExperienceFor: "Based on which of your ({name}) work experiences is this recommendation?",
    },

    // thank-you.html
    thankYou: {
      pageTitle: "Galaxyz – Thank You for Your Recommendation",
      title: "Your recommendation has been submitted!",
      message: "Your words are not just memories — they are a guiding light in someone's career journey.",
      summaryIntro: "Others have also shared their impressions and support.",
      summaryLink: "View their public recommendation summary →",
      invite: "You've helped others shine. Maybe it's time to let your own strengths be seen too.",
      start: "Create My Recommendation Profile",
      footer: "Galaxyz is a trust-based network built on real working relationships.",
      emotionalTouch: "On this career journey, we reflect and elevate each other.",
      warmthThanks: "💛 Thank you for writing me a recommendation — I'd love to write something for you too.",
      warmthStart: "Let me write a recommendation for you ✨",
      networkAlt: "Network of professional recommendations"
    },

    // recommend-summary.html
    recommendSummary: {
      ogTitle: "Galaxyz | Authentic recommendations from every collaborator",
      ogDescription: "See the authentic career recommendations they've received, and leave your sincere words too.",
      publicProfileTitle: "'s Recommendation Profile",
      noVerifiedRecommendations: "No verified recommendations yet.",
      upgradeHint: (need, next) => `${need} EXP to reach Lv.${next}`,
      maxLevelReached: "Max Level Reached",
      pageTitle: "Recommendation Summary",
      description: "Overview of your recommendations",
      summaryFor: name => `Recommendation Summary for ${name}`,
      noProfile: "No profile found. Please create your profile first.",
      noExperience: "No work experiences available.",
      noRecommendation: "No recommendations yet.",
      backToProfile: "Back to Profile",
      highlight_hardSkill: "Hard Skills",
      highlight_softSkill: "Soft Skills",
      highlight_character: "Character & Integrity",
      allHighlights: "All Highlights",
      relationFilterOptions: [
        { value: "directManager", label: "Direct Supervisor" },
        { value: "crossDeptManager", label: "Cross-team Supervisor" },
        { value: "sameDeptColleague", label: "Teammate (Same Team)" },
        { value: "crossDeptColleague", label: "Teammate (Different Team)" },
        { value: "subordinate", label: "Direct Report" },
        { value: "client", label: "Client" },
        { value: "vendor", label: "Vendor / Partner" }
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
      showAllRec: "Show full recommendation",
      showLessRec: "Collapse recommendation",
      showAll: (count) => `Show all ${count} recommendations`,
      showLess: "Collapse recommendations",
      highlights: "Highlight Summary",
      relations: "Relationship Summary",
      present: "Present",
      registerToView: "🌟 Register to view all",

      //分享按鈕
      shareMessage_part1: "I received a recommendation from my {{relation}} during my time at {{company}}, documenting my performance in ({{highlights}}).",
      shareMessage_part2: "This is more than just professional recognition; it's a collaborative experience worth remembering.",
      shareMessage_part3: "Click to see this heartfelt recommendation from a colleague 👇",
      copySuccess: "Share link copied!",
      copyFailed: "Copy failed. Please copy the link manually: ",
      shareRecBtnTitle: "Share this recommendation",
    },

    // public_profile 公開推薦頁
    publicSummary: {
      errorMissingId: "User ID is missing in the URL.",
      errorProfileNotFound: "This user's profile does not exist or is not public.",
      errorLoading: "Failed to load",
      pageTitle: "'s Public Recommendation Profile | Galaxyz",
      defaultUserName: "User Name",
      noVerifiedRecommendations: "No verified recommendations received yet.",
      
      // 新增 public-profile.html 需要的翻譯
      loadingSummaryMessage: "Loading profile…",
      aboutMe: "About Me",
      onlyShowRecommendations: "Show recommendations only",
      showWithCompany: "Show with work experience",
      
      // OG Meta 翻譯
      ogTitle: "Galaxyz | Authentic recommendations from every collaborator",
      ogDescription: "See the authentic career recommendations they've received, and leave your sincere words too.",
      
      // 統計
      totalRecommendations: "Total Recommendations",
      workExperience: "Work Experience",
      memberSince: "Member Since",

      // 時間
      present: "Present",

      // 推薦相關
      verifiedRecommendations: "Verified Recommendations",
      totalRecommendations: "Total Recommendations",
      workExperience: "Work Experience",
      recommendations: "Recommendations",

      // 亮點翻譯
      highlight_hardSkill: "Hard Skills",
      highlight_softSkill: "Soft Skills", 
      highlight_character: "Character & Integrity",

      // 關係翻譯
      relation_directManager: "Direct Manager",
      relation_crossDeptManager: "Cross-team Manager",
      relation_sameDeptColleague: "Teammate (Same Team)",
      relation_crossDeptColleague: "Teammate (Different Team)",
      relation_subordinate: "Direct Report",
      relation_client: "Client",
      relation_vendor: "Vendor / Partner",
      
      // 其他功能
      viewFullProfile: "View Full Profile",
      contactUser: "Contact User",
      shareProfile: "Share Profile",
      recommendThisUser: "Write a Recommendation",
      publicProfile: "Public Profile",
      memberSince: "Member Since",
      totalExperience: "Total Experience",
      currentPosition: "Current Position",
      
      // 等級名稱 (為了向後兼容)
      level1_name: "Spark of Initiative",
      level2_name: "Solid Collaborator",
      level3_name: "Trusted Partner",
      level4_name: "Team Navigator",
      level5_name: "Star Connector",
      level6_name: "Sphere of Sincerity",
      level7_name: "Sphere of Influence",
      level8_name: "Industry Benchmark",
      level9_name: "Career Champion",
      level10_name: "Stellar Leader"
    },

    // index.html
    home: {
      // 頁面基本資訊
      pageTitle: "Galaxyz | Trust is the best career recommendation",
      ogTitle: "Galaxyz | Authentic recommendations from every collaborator",
      ogDescription: "Every star has a story. Together, we form a Galaxy of trust.",
      
      // Hero 區塊
      heroTitle: "Proactively recommend and build your trusted career network",
      heroSubtitle: "Galaxyz enables you to proactively write authentic recommendations for your collaborators,\nwhile making your professional value more visible.\nEach trusted connection becomes a shining star in your career constellation.",
      startButton: "Start building my trusted network",
      
      // 搜尋功能
      searchPlaceholder: "Search by name or headline...",
      searchButton: "Search",
      searchDisabled: "Search function temporarily unavailable",
      searching: "Searching...",
      noSearchResults: "No results found. Try different keywords!",
      noResultsHint: "💡 Try searching with different keywords, or browse featured users below",
      searchError: "Search failed, please try again later",
      noHeadline: "Exploring career journey",
      
      // 精選用戶區塊
      featuredUsers: "Featured Users",
      noSearchResults: "No results found.",
      featuredUsersTitle: "✨ Career Stars",
      loadingFeaturedUsers: "Loading featured users...",
      featuredUsersError: "Failed to load featured users. Please refresh the page",
      noFeaturedUsers: "No featured users available",
      discoverJourney: "Discover this professional's journey",
      
      // About 區塊
      aboutTitle: "What do we believe?",
      aboutText: "Your value is not just your job title — it's the genuine impact witnessed by those who have worked with you.\n\nIn an AI-driven era, information is abundant but trust is scarce. Galaxyz stands at this crossroads, rebuilding authentic proof of value through proactive recommendations.\n\nThis is why we chose <span class=\"highlight\">galaxyz.ai</span> — to let trust leave a mark in the AI era.",
      learnMore: "Learn more about our philosophy",
      
      // 功能介紹區塊
      featuresTitle: "🚀 What can Galaxyz do for you?",
      features: {
        buildProfileTitle: "Create your career profile",
        buildProfileText: "Document your experiences, highlights, and professional story — let your collaborators see the real you.",
        inviteRecoTitle: "Proactively recommend your collaborators",
        inviteRecoText: "Share your trust by writing authentic recommendations and build a reputation network that reflects your true value.",
        buildTrustTitle: "Build your trusted career constellation",
        buildTrustText: "Every recommendation creates a connection of trust. Your career constellation reflects your network assets and professional influence."
      },
      
      // 最終 CTA
      finalCtaHint: "Use proactive recommendations to build your career constellation and make trust your most powerful career asset.",
      finalCta: "Get Started Now",
      
      // 錯誤訊息
      firebaseConnectionError: "Firebase connection failed. Please check your network and refresh the page",
      systemInitError: "System initialization failed. Please refresh the page",
  
    },
    aboutPage: {
  // 🪐 Hero Section
  heroTitle: "We believe trust is the most powerful career asset.",
  heroSubtitle: "Galaxyz is a career constellation made up of GIVERs.\nHere, recommendations aren't passively requested, but actively given.",
  heroButton: "Start building my constellation",

  // 🌟 Why Galaxyz exists?
  whyGalaxyTitle: "Why does Galaxyz exist?",
  whyGalaxyContent: "Many people's true value is actually hidden in others' eyes.\n\nWe see:\nSome efforts can't be shown on resumes;\nSome collaborations deserve to be recorded.\n\nSo we created Galaxyz,\nto let 'people who once worked together' leave genuine testimonies for each other.",

  // 👥 Who is a GIVER?
  whoIsGiverTitle: "Who is a GIVER?",
  whoIsGiverContent: "A GIVER is not a manager, not a celebrity.\nA GIVER is someone willing to actively give.\n\nYou just need to have worked together, willing to leave observations and recognition,\nthen you are a GIVER.\n\nHere, everyone has the ability to give.",

  // 🔤 The five spirits of GIVER
  giverSpiritTitle: "The Five Spirits of GIVER",
  giverSpirits: [
    {
      letter: "G",
      word: "Give",
      meaning: "Actively give, don't wait for invitations"
    },
    {
      letter: "I",
      word: "Impact", 
      meaning: "Leave impact, create connections"
    },
    {
      letter: "V",
      word: "Visibility",
      meaning: "Let others be seen by more people"
    },
    {
      letter: "E", 
      word: "Endorse",
      meaning: "Endorsement based on real collaboration"
    },
    {
      letter: "R",
      word: "Reciprocity", 
      meaning: "Trust circulates and comes back"
    }
  ],
  giverSpiritFooter: "Every GIVER is a shining star in Galaxyz.",

  // ✨ How does Galaxyz work?
  howItWorksTitle: "How does Galaxyz work?",
  howItWorksSteps: [
    {
      title: "Build a collaboration experience",
      desc: "No need to write a resume, just add a story of working together."
    },
    {
      title: "Become a GIVER",
      desc: "Actively recommend collaborators, and let your own value be seen."
    },
    {
      title: "Receive recommendations, build trust constellation",
      desc: "Recommendations are automatically organized into summaries, can be kept private or shared publicly."
    }
  ],

  // 🌌 Origin of Galaxyz name
  nameOriginTitle: "How did Galaxyz get its name?",
  nameOriginContent: "Galaxyz = Galaxy + Z\n\nEveryone is a star in their career galaxy,\nthose who connect us are our career constellation.\n\nZ represents Gen Z, and also represents everyone who is shining.",

  // 🧡 Founder's note
  founderNoteTitle: "Founder's Note",
  founderQuote: "One day, if you feel down,\nI hope the recommendations here can gently catch you like starlight.",
  founderNoteContent: "Galaxyz is a product I completed with ChatGPT,\nand also my deepest longing for 'trust'.",

  // 🔁 Final CTA
  finalCtaQuote: "Start with you, become a GIVER.\nA recommendation is the most genuine light you give to the world.",
  finalCtaButton: "Join Now"
},

    login: {
      welcomeTitle: "Welcome to Galaxyz ✨",
      pageTitle: "Login – Galaxyz",
      emailPlaceholder: "Email",
      passwordPlaceholder: "Password",
      loginButton: "Login",
      registerButton: "Register",
      forgotPassword: "Forgot your password?",
      noAccount: "Don't have an account?",
      registerLink: "Register",
      registerOnlyNote: "(Only users who have submitted a recommendation can register)",
      inviteCodePlaceholder: "Invite code",
      inviteCodeHint: "Please enter your exclusive invite code, e.g., galaxyz12345",
      inviteOnlyNotice: "Registration is currently by invitation and recommendation only. Please check if your invitation link is valid.",
      alreadyHaveAccount: "Already have an account?",
      backToLogin: "Back to Login",
      termsAgreement: 'By clicking "Register", you agree to our <a href="/pages/privacy.html" target="_blank">Privacy Policy</a>.',
    },

    header: {
      login: "Login",
      logout: "Logout",
      searchPlaceholder: "Search for talent...",
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
      unregisteredTag: "(unregistered)",
    },

    footer: {
      home: "Home",
      about: "About Us",
      privacy: "Privacy Policy",
      copyright: `© ${new Date().getFullYear()} Galaxyz.ai - All Rights Reserved.`
    }

  },

  "zh-Hant": {
    // header
    login: "登入",
    logout: "登出",

    level1_name: "初心之光",
    level2_name: "穩健合作者",
    level3_name: "值得信賴的夥伴",
    level4_name: "團隊領航者",
    level5_name: "人脈之星",
    level6_name: "真誠推薦磁場",
    level7_name: "影響力連結者",
    level8_name: "業界口碑典範",
    level9_name: "職涯任性代言人",
    level10_name: "星光領袖",

    // 通用文字
    common: {
      submit: "送出",
      submitting: "送出中...",
      confirm: "確定",
      cancel: "取消",
      error: "錯誤",
      success: "成功",
      loading: "載入中...",
      save: "儲存",
      delete: "刪除",
      edit: "編輯",
      closeWindow: "關閉視窗",
      backToDashboard: "返回儀表板",
      company: "公司",
      position: "職位",
      loginRequired: "請登入以使用此功能。",
      permissionDenied: "權限不足，請重新登入後再試。",
      networkError: "網路連線錯誤，請檢查您的連線並再試一次。",
      unknownError: "發生未知錯誤，請稍後再試。",
      deleted: "已刪除。",
      linkCopied: "連結已複製！",
      linkCopyFailed: "複製失敗，請手動複製連結。",
      loadingError: "載入失敗",
    },

    // profile-dashboard.html
    profileDashboard: {
      onboarding: {
      title: "從給予開始，成為一位 GIVER ✨",
      steps: [
        "<strong>主動推薦</strong>一位合作過、值得被看見的夥伴<br/><span class='exp-badge'>+10 EXP</span>（你也是他的發光者）",
        "<strong>收到</strong>一則來自他人的真實推薦<br/><span class='exp-badge'>+5 EXP</span>（讓信任成為你的價值證明）",
        "<strong>回應</strong>一則你收到的推薦，表達感謝與回饋<br/><span class='exp-badge'>+3 EXP</span>（讓信任成為循環）"
      ],
      footer: "所有經驗值將在推薦驗證後計入，星圖上的連結也會同步亮起。",
    },
      // ✨ --- 新增這個 onboardingModal 物件 --- ✨
      onboardingModal: {
        modalTitle: "歡迎來到 Galaxyz！",
        modalSubtitle: "請完成您的基本資料，開始建立您的職涯檔案。",
        step1: "第一步：您的姓名",
        step2: "第二步：您的第一份工作經歷",
        getStarted: "開始使用 Galaxyz",
        placeholderNameWithWarning: "送出後無法修改",
      },
      profileTitle: "我的職涯檔案",
      loadingDashboardMessage: "正在載入您的個人資料…",
      bio: "個人簡介",
      noBio: "（尚未填寫個人簡介）",
      workExperiences: "工作經歷",
      editProfileTitle: "編輯個人檔案",
      labelName: "姓名 (母語)",
      labelEnglishName: "英文姓名 (English Name)",
      labelEnglishNameOptional: "英文姓名（選填）",
      labelHeadline: "個人標題 (Headline)",
      placeholderHeadline: "一句話介紹你自己，例如：對產品設計充滿熱情的軟體工程師",
      labelBio: "個人簡介 (Bio)",
      cancel: "取消",
      save: "儲存",
      saveChanges: "儲存變更",
      saving: "儲存中...",
      updateSuccess: "✅ 更新成功！",
      updateFailed: "❌ 更新失敗: ",
      addExperience: "新增工作經歷",
      viewSummaryAll: "查看推薦總覽",
      viewPublicSummary: "🌟 查看公開推薦頁",
      addExperienceTitle: "新增工作經歷",
      editExperienceTitle: "編輯工作經歷",
      editDescriptionTitle: "編輯工作描述",
      company: "公司",
      position: "職位",
      period: "期間",
      currentlyWorking: "目前在職",
      descriptionOptional: "工作描述 (選填)",
      placeholderDescription: "簡單描述您在這份工作中的主要職責、專案或成就…",
      selectStart: "請選擇開始年月",
      enterName: "請輸入您的姓名",
      selectEnd: "如果您已離職，請選擇結束年月",
      errEndBeforeStart: "結束日期不可早於開始日期",
      errEndAfterToday: "結束日期不能晚於今天",
      editLockWarning: "當此筆經歷有已驗證的推薦後，核心欄位 (公司、職位、開始年月) 將無法修改。",
      deleteConfirm: "刪除後將無法復原，確定刪除此經歷？",
      deleted: "已刪除",
      inviteEmpty: "邀請內容不能為空。",
      createInviteError: "建立邀請失敗，請稍後再試。",
      permissionDenied: "權限不足，無法執行此操作。",
      networkError: "網路連線錯誤，請稍後再試。",
      openingRecommendForm: "正在開啟推薦表單...",
      edit: "編輯",
      delete: "刪除",
      received: "收到",
      recommendations: "則推薦",
      noRecommendation: "尚未收到推薦",
      canReply: "可回覆",
      people: "人",
      totalRecommended: "共推薦",
      hintBoth: (p) => `您有 ${p.pending} 則推薦待處理、${p.failed} 則驗證失敗。`,
      hintPendingOnly: (p) => `您有 ${p.count} 則推薦正在等待對方完成資料以進行驗證。`,
      hintFailedOnly: (p) => `您有 ${p.count} 則推薦因資料不符而驗證失敗。`,
      noHighlights: "暫無亮點統計",
      noRelations: "暫無關係統計",
      highlights: "亮點",
      relations: "關係",
      noRecsTitle: "開始建立你的職場信譽吧！",
      noRecsAction1: "為共事時期的好夥伴背書，點擊「🤝 推薦好夥伴」。",
      noRecsAction2: "邀請同事為你推薦，點擊「📨 請夥伴推薦」。",
      recommendOthers: "推薦好夥伴",
      replyRecommend: "回覆",
      inviteRecommender: "請夥伴推薦",
      noReplyAvailable: "目前沒有可回覆的推薦。",
      loadReplyOptionsError: "載入回覆選項失敗，請稍後再試。",
      recommenderDataError: "推薦人資料有誤，請重新選擇。",
      openingReplyForm: "正在開啟回覆推薦表單...",
      openingUnregisteredReplyForm: "正在為未註冊用戶開啟回覆推薦表單...",
      allReplied: "你已經回覆過所有推薦人了 ✅",
      startReply: "用推薦回覆",
      verifiedBadgeText: "✅ 已確認工作關係",
      registeredBadgeText: "已註冊",
      unregisteredBadgeText: "未註冊",
      select: "選擇",
      editInviteTitle: "編輯邀請語",
      templateHintPrefix: "不知道怎麼寫嗎？",
      insertDirect: "插入中性版",
      or: "或",
      insertWarmth: "插入溫暖版",
      previewReminder: "⚠️ 請記得按「儲存並複製」，否則推薦人會看不到你的邀請內容",
      previewLinkLabel: "預覽連結：",
      inviteSaveAndCopy: "儲存並複製",
      linkCopyFailed: "複製失敗，請手動複製以下連結：",
      copy: "複製",
      replyOptions: "回覆選項",
      recommendReply: "推薦回覆",
      recommendReplyDesc: "分享你對這位同事的工作觀察",
      coffeeGratitude: "咖啡感謝",
      comingSoon: "即將推出",
      coffeeGratitudeDesc: "送一杯咖啡表達感謝",
      joinWaitlist: "加入等候清單",
      selectColleagueToReply: "選擇要回覆的同事",
      waitlistTitle: "☕ 咖啡感謝功能等候清單",
      waitlistDesc1: "我們正在開發咖啡感謝功能，讓你可以用一杯咖啡向推薦你的同事表達感謝。",
      waitlistDesc2: "留下你的 email，我們會在功能上線時第一時間通知你！",
      labelEmail: "Email",
      placeholderEmail: "your.email@example.com",
      labelCoffeePrice: "你希望的咖啡價位？",
      coffeePriceOption1: "NT$ 100 (便利商店咖啡)",
      coffeePriceOption2: "NT$ 200 (連鎖咖啡店)",
      coffeePriceOption3: "NT$ 250 (精品咖啡)",
      coffeePriceOption4: "彈性選擇",
      newUser: "新用戶",
      maxLevel: "最高等級",
      upgradeHint: (expNeeded, nextLevel) => `再 ${expNeeded} EXP 可升至 Lv.${nextLevel}`,
      maxLevelReached: "已達最高等級",
      requiredFieldsEmpty: "公司、職稱和開始年月為必填項。",
      addSuccess: "新增經歷成功！",
      editSuccess: "編輯經歷成功！",
      originalRecommendationNotFound: "找不到原始推薦記錄",
      replyFormTitle: "回推薦表單",
      recommendFormTitle: "推薦表單",
      waitlistSignupSuccess: "✅ 成功加入等候清單！我們會在功能上線時通知你",
      waitlistSignupError: "❌ 加入等候清單失敗，請稍後再試",
      systemInitError: "系統初始化失敗，請重新整理頁面",
      firebaseConnectionError: "Firebase 連接失敗，請檢查網路連線後重新整理頁面",
      firebaseSDKNotLoaded: "Firebase SDK 未載入，請確認腳本載入順序",
      firebaseInitTimeout: "Firebase 初始化超時，請檢查 firebase-init.js 是否正確載入",
      loadingError: "糟糕，載入失敗了",
      loadingErrorDesc: "無法順利讀取您的個人資料，請檢查您的網路連線，然後再試一次。",
      errorDetails: "錯誤詳情",
      refreshPage: "重新整理頁面",
      attemptingNewTab: "嘗試開新分頁",
      newTabBlocked: "新分頁被阻擋", 
      fallbackToSameWindow: "降級到同視窗開啟",
      newTabSuccess: "新分頁開啟成功",
      recommendSummaryTitle: "推薦總覽",
      publicSummaryTitle: "公開推薦頁",
      // 邀請推薦功能
      inviteModalTitle: "邀請夥伴推薦",
      inviteMessage: "邀請訊息", 
      invitePlaceholder: "請輸入您想對對方說的邀請話語...",
      inviteEmpty: "請輸入邀請訊息",
      insertDirectBtn: "📋 插入中性版",
      insertWarmthBtn: "🤗 插入溫暖版",
      previewLink: "🔍 預覽推薦表單",
      inviteSaveBtn: "💾 儲存並複製連結",
      inviteCancelBtn: "取消",
      templateHint: "💡 不知道怎麼寫嗎？選擇範本快速開始：",
      inviteTemplates: {
        inviteSenior: {
            name: "邀請前輩",
            message: `Hi {對方姓名}，\n\n好久不見，別來無恙！我們之前在 {company} 一起工作的日子讓我印象深刻，特別是您當時給我的指導與幫助，對我影響很大。\n\n最近我正在整理職涯紀錄，如果方便的話，是否能請您為我當時的表現，寫下幾句簡單的推薦或肯定呢？\n\n非常感謝！\n\n{userName}`
        },
        invitePeer: {
            name: "邀請同輩",
            message: `Hi {對方姓名}，\n\n最近好嗎？突然想到我們之前在 {company} 一起合作奮鬥的時光，真的很懷念！\n\n我正在使用一個平台來建立我的職涯信任檔案，想邀請你為我當時的表現寫幾句真實的話。你的看法對我來說很重要！\n\n先謝謝你！\n\n{userName}`
        },
        inviteJunior: {
            name: "邀請後輩",
            message: `Hi {對方姓名}，\n\n希望你一切都好！我最近在整理過去的專案與帶人經驗，想起了我們在 {company} 一起工作的時光。\n\n為了讓我的紀錄更完整，想邀請你從你的角度，為我當時的管理或協作風格寫幾句話。你的回饋對我非常有價值。\n\n感謝你的幫忙！\n\n{userName}`
        }
      },
      inviteLinkCopied: "✅ 邀請連結已複製到剪貼簿！",
      inviteCreateSuccess: "✅ 邀請建立成功！",
      inviteCreateFailed: "❌ 建立邀請失敗，請稍後再試",
      inviteCopyFailed: "❌ 複製失敗，請手動複製連結",
      unknownCompany: "該公司",
      manualCopyTitle: "📋 手動複製連結",
      manualCopyDesc: "自動複製失敗，請手動複製以下連結：",
      copyBtn: "複製",
      close: "關閉",
      successfulRecommendation: "成功推薦",
      placeholderHeadline: "一句話介紹你自己，例如：對產品設計充滿熱情的軟體工程師",
      placeholderDescription: "簡單描述您在這份工作中的主要職責、專案或成就…",
      coffeePriceOption4: "彈性選擇",
      joinWaitlist: "加入等候清單",
    },

    // recommend-form.html
    recommendForm: {
      // 頁面和表單基本資訊
      identityReminder: `
    <strong>🌟 Galaxyz 是一個建立於真實合作與信任的職場口碑網絡。</strong><br/>
    只有完成口碑回饋的人，才能建立個人職涯檔案並加入 Galaxyz 星圖。<br/><br/>
    👉 請填寫您的真實姓名與 Email，以便後續邀請您註冊。
    `,
      ogTitle: "⭐ 請為我撰寫一段合作口碑！",
      ogDescription: "我正在 Galaxyz 建立我的職涯口碑檔案，很希望您能留下我們合作的真實回饋。",
      loadingMessage: "正在載入推薦表單…",
      recPageTitle: "合作經驗填寫",
      formTitle: "合作經驗填寫",
      recommendPartnerTitle: "推薦合作夥伴",
      recommendPartnerNote: "為你在此工作期間合作的夥伴寫下推薦",
      
      // 基本表單標籤
      name: "您的姓名",
      email: "您的 Email",
      relation: "您與被推薦人的關係",
      highlightLabel: "特別欣賞的部分",
      contentLabel: "合作印象",
      inviteTitle: "被推薦人的邀請語",
      selectRelation: "請選擇關係",
      submitRecommendation: "送出合作口碑",
      recommenderJobLabel: "這則推薦是基於您的哪一份工作經歷？",
      loadingJobs: "正在查詢您的經歷...",
      identityReminder: (email) => `為確保每份推薦的真實性，送出後系統將寄送一封確認信至 <strong>${email}</strong>，請點擊連結完成最後一步。`,
      
      // 推薦他人模式標籤
      recommendeeName: "被推薦人姓名", 
      recommendeeEmail: "被推薦人 Email",
      
      // 工作背景
      workBackground: "工作背景",
      recommenderName: "推薦人",
      
      // 回推薦相關
      replyRecommendNote: "感謝對方為你寫推薦，現在為此工作期間合作的夥伴寫下推薦",
      replyBackground: "回推薦背景",
      hintReplyName: "填寫要回推薦的同事姓名", 
      hintReplyEmail: "系統將通知對方查看你的推薦",
      
      // 表單提示文字
      hintName: "請填寫您的姓名，僅被推薦人可看到。",
      hintEmail: "請放心填寫常用Email，僅未來系統核實身份使用，任何人都看不到",
      hintContent: "最多 500 字，請聚焦您對他的合作印象與亮點。",
      hintRecommendeeName: "請填寫被推薦人的真實姓名",
      hintRecommendeeEmail: "系統將發送通知邀請對方觀看",
      hintHighlights: "請選擇一個你印象最深刻的亮點。",
      hintCustomHighlight: "最多 30 字，可留空",
      hintRelation: "請選擇您與被推薦人的工作關係",
      
      // 關係選項
      relationOptions: [
        { value: "directManager",       label: "我是他的直屬主管" },
        { value: "crossDeptManager",    label: "我是他的跨部門主管" },
        { value: "sameDeptColleague",   label: "我是他的同部門同事" },
        { value: "crossDeptColleague",  label: "我是他的跨部門同事" },
        { value: "subordinate",         label: "我是他的部屬" },
        { value: "client",              label: "我是他的客戶" },
        { value: "vendor",              label: "我是供應商或外部合作夥伴" },
      ],
      
      // 關係選項標籤
      relationLabels: {
        directManager: "我是他/她的直接主管",
        crossDeptManager: "我是他/她的跨部門主管",
        sameDeptColleague: "我是他/她的同部門同事",
        crossDeptColleague: "我是他/她的跨部門同事",
        subordinate: "他/她是我的下屬",
        client: "我是他/她的客戶",
        vendor: "我是他/她的廠商/合作夥伴"
      },
      
      // 亮點選項
      highlightOptions: ["hardSkill", "softSkill", "character"],
      highlightOptionLabels: {
        hardSkill:   "硬實力",
        softSkill:   "軟實力",
        character:   "人品"
      },
      highlightOptionCustomLabel: "其他亮點（選填）",
      highlightOptionCustomPlaceholder: "請填寫其他亮點",
      highlightLimitMsg: "最多只能選 3 個亮點",
      
      // 系統訊息和提醒
      importantNotice: "📋 重要說明",
      confirmationNotice: "被推薦人註冊並完成驗證後，您的合作口碑將正式紀錄。",
      giveRecommendationReminder: "請確保回饋內容真實且基於實際合作經驗。被推薦人將收到 Email 通知，邀請他們註冊查看你的內容。",
      proTip: "💡 小提醒",
      reminderMessage: "你可以主動傳訊息提醒對方查收 Email，確保您的口碑內容被看到！",
      brandSlogan: "Galaxyz | 讓真實合作口碑，成為職場最佳資產。",
      
      // 表單驗證和錯誤訊息
      fillAllFields: "請完整填寫姓名、Email、推薦內容與亮點。",
      alreadyRecommended: "您已經為這段工作經歷提交過合作口碑！",
      loginToSubmit: "為了確保推薦的真實性，請登入或註冊以完成提交。您的內容已為您保存。",
      errorMissingName: "請填寫被推薦人姓名",
      errorMissingEmail: "請填寫被推薦人 Email",
      errorInvalidEmail: "請填寫有效的 Email 地址",
      errorMissingRelation: "請選擇關係",
      errorMissingContent: "請填寫推薦內容",
      errorMissingHighlight: "請選擇至少一個亮點",
      submitError: "推薦提交失敗，請稍後再試",
      
      // 載入提示
      loadingInvite: "載入邀請資料中...",
      loadingPreview: "載入預覽資料中...",
      loadingUser: "載入用戶資料中...",
      processingJobs: "處理工作經歷資料...",

      // 成功頁面
      recommendationSentTitle: "推薦已送出！",
      successImportantNote: "重要說明：",
      successNote1: "推薦將在對方註冊並核實身份後，正式納入你的推薦記錄。",
      successProTip: "💡 小提醒：",
      successNote2: "你可以主動傳訊息提醒對方查收 Email，以確保推薦能順利送達！",
      successNote3: "感謝你花時間為合作夥伴寫推薦，讓優秀的人才被看見。",
      successRecommendAnother: "推薦其他人",
      
      // 錯誤和狀態訊息
      originalRecNotFound: "找不到原始推薦記錄，無法進行回推薦。",
      inviteNotFound: "邀請資料不存在或已失效",
      autofilled: "✓ 已自動填入",
      notFound: "⚠️ 找不到使用者資料。",
      notFoundJob: "⚠️ 找不到對應的工作經歷。",
      selectExperience: "請選擇您想基於哪份經歷推薦...",
      selectExperienceFor: "這則推薦是基於您 ({name}) 的哪一份工作經歷？",
      
      // 其他
      defaultInviteForm: `我正在建立自己的專業人脈檔案，想到您是我工作中合作愉快的夥伴，很希望能請您幫我寫幾句推薦。如果您也想建立自己的職涯人脈，我也很樂意回饋推薦您！`,
      recommendingTo: "您正在為 <strong>{name}</strong> 撰寫合作口碑",
      jobDescriptionLabel: "工作職責",
    },

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

    // recommend-summary.html
    recommendSummary: {
      ogTitle: "Galaxyz｜真實推薦，來自合作過的每一位夥伴",
      ogDescription: "看看他收到了哪些真實的職涯推薦，你也能留下真誠的一句話。",
      publicProfileTitle: "的推薦總覽",
      noVerifiedRecommendations: "尚未收到任何已驗證的推薦。",
      registerToView: "🌟 註冊以查看全部",
      upgradeHint: (need, next) => `再 ${need} EXP 可升至 Lv.${next}`,
      maxLevelReached: "已達最高等級",
      pageTitle: "推薦總覽",
      description: "一覽無遺",
      summaryFor: name => `${name} 的推薦總表`,
      noProfile: "尚未建立個人檔案。",
      noExperience: "尚無任何工作經歷。",
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
      allRelations: "全部關係",
      label_relation: "推薦關係：",
      label_highlight: "亮點：",
      noFilteredMatch: "目前沒有符合條件的推薦內容",
      onlyShowRecommendations: "只看推薦內容",
      showWithCompany: "顯示公司與職稱",
      exportPDF: "匯出 PDF",
      anonymousRecommender: "推薦人已隱藏",
      loadingSummaryMessage: "正在載入推薦總表…",
      showAll: (count) => `展開 ${count} 則推薦`,
      showLess: "收合推薦",
      highlights: "亮點統計",
      relations: "關係統計",
      present: "目前在職",
      
      //分享按鈕
      shareMessage_part1: "收到來自 {{company}} 時期 {{relation}} 的推薦，記錄了我在（{{highlights}}）上的真實表現。",
      shareMessage_part2: "這不只是工作上的肯定，更是一段值得被記住的合作經歷。",
      shareMessage_part3: "點進來看看這份來自共事夥伴的真心推薦👇",
      copySuccess: "分享連結已複製！",
      copyFailed: "複製失敗，請手動複製：",
      shareRecBtnTitle: "分享這則推薦",
    },

    // public_profile 公開推薦頁
    publicSummary: {
      errorMissingId: "網址缺少使用者 ID",
      errorProfileNotFound: "這位使用者的檔案不存在或未公開。",
      errorLoading: "載入失敗",
      pageTitle: " 的公開推薦檔案 | Galaxyz",
      defaultUserName: "使用者名稱",
      noVerifiedRecommendations: "尚未收到任何已驗證的推薦。",
      
      // 新增 public-profile.html 需要的翻譯
      loadingSummaryMessage: "正在載入檔案…",
      aboutMe: "關於我",
      onlyShowRecommendations: "只顯示推薦內容",
      showWithCompany: "顯示工作經歷",
      
      // OG Meta 翻譯
      ogTitle: "Galaxyz｜真實推薦，來自合作過的每一位夥伴",
      ogDescription: "看看他收到了哪些真實的職涯推薦，你也能留下真誠的一句話。",
      
      // 推薦相關
      verifiedRecommendations: "已驗證推薦",
      totalRecommendations: "推薦總數",
      workExperience: "工作經歷",
      recommendations: "推薦",
      
      // 亮點翻譯
      highlight_hardSkill: "硬實力",
      highlight_softSkill: "軟實力",
      highlight_character: "人品",
      
      // 關係翻譯
      relation_directManager: "直屬主管",
      relation_crossDeptManager: "跨部門主管", 
      relation_sameDeptColleague: "同部門同事",
      relation_crossDeptColleague: "跨部門同事",
      relation_subordinate: "部屬",
      relation_client: "客戶",
      relation_vendor: "供應商或外部合作夥伴",
      
      // 時間
      present: "目前在職",
      
      // 統計
      totalRecommendations: "推薦總數",
      workExperience: "工作經歷", 
      memberSince: "加入時間",

      // 其他功能
      viewFullProfile: "查看完整檔案",
      contactUser: "聯絡用戶",
      shareProfile: "分享檔案",
      recommendThisUser: "為他寫推薦",
      publicProfile: "公開檔案",
      memberSince: "加入時間",
      totalExperience: "總工作經驗",
      currentPosition: "目前職位",
      
      // 等級名稱 (為了向後兼容)
      level1_name: "初心之光",
      level2_name: "穩健合作者",
      level3_name: "值得信賴的夥伴",
      level4_name: "團隊領航者",
      level5_name: "人脈之星",
      level6_name: "真誠推薦磁場",
      level7_name: "影響力連結者",
      level8_name: "業界口碑典範",
      level9_name: "職涯任性代言人",
      level10_name: "星光領袖"
    },

    // index.html
    home: {
      // 頁面基本資訊
      pageTitle: "Galaxyz｜信任，是最好的職涯推薦",
      ogTitle: "Galaxyz — 建立值得信賴的人脈推薦網絡",
      ogDescription: "每一顆星都有故事，每個人都值得被推薦。一起組成信任星系。",
      
      // Hero 區塊
      heroTitle: "成為 Giver，點亮彼此的職涯星圖",
      heroSubtitle: "在 Galaxyz，你不必等待升遷或機會才被看見。\n只要你願意主動肯定合作過的人，\n你就是一位 Giver。\n每一次推薦，都是信任與價值的傳遞。",
      startButton: "我想成為一位 Giver",
      
      // 搜尋功能
      searchPlaceholder: "搜尋姓名或個人標題...",
      searchButton: "搜尋",
      searchDisabled: "搜尋功能暫時無法使用",
      searching: "搜尋中...",
      noSearchResults: "找不到相關結果，試試其他關鍵字吧！",
      noResultsHint: "💡 試試搜尋不同的關鍵字，或瀏覽下方精選用戶",
      searchError: "搜尋失敗，請稍後再試",
      noHeadline: "正在探索職涯旅程",
      
      // 精選用戶區塊
      featuredUsers: "精選用戶",
      noSearchResults: "找不到相關結果。",
      featuredUsersTitle: "✨ 職涯星光榜",
      loadingFeaturedUsers: "載入精選用戶中...",
      featuredUsersError: "載入精選用戶失敗，請重新整理頁面",
      noFeaturedUsers: "暫無精選用戶",
      discoverJourney: "探索這位夥伴的專業旅程",
      
      // About 區塊
      aboutTitle: "我們相信什麼？",
      aboutText: "人的價值，不只是履歷上的職稱，更是那些曾與你共事的人，願意見證你帶來的真實影響。\n\n在 AI 時代，資訊越來越多，信任卻越來越稀薄。Galaxyz 選擇站在這個十字路口，\n用主動推薦的方式，重建值得被看見的價值證明。\n\n這也是為什麼，我們選擇 <span class=\"highlight\">galaxyz.ai</span> —— 在 AI 時代，讓信任留下記錄。",
      learnMore: "了解我們的理念",
      
      // 功能介紹區塊
      featuresTitle: "🚀 Galaxyz 能為你做什麼？",
      features: {
        buildProfileTitle: "建立個人職涯檔案",
        buildProfileText: "記錄你的經歷、簡介與職場亮點，展現你的專業價值。",
        inviteRecoTitle: "主動推薦合作夥伴",
        inviteRecoText: "透過主動推薦，把信任傳遞出去，也累積屬於自己的真實信譽。",
        buildTrustTitle: "打造值得信賴的職涯星圖",
        buildTrustText: "每則推薦都是一道信任連結，職涯星圖見證你的人脈資產與職場影響力。"
      },
      
      // 最終 CTA
      finalCtaHint: "成為 Giver，從你開始傳遞信任。寫下對夥伴的肯定，也成就你的人脈影響力。",
      finalCta: "立即開始",
      
      // 錯誤訊息
      firebaseConnectionError: "Firebase 連線失敗，請檢查網路連線並重新整理頁面",
      systemInitError: "系統初始化失敗，請重新整理頁面"
    },
  

aboutPage: {
  // 🪐 Hero 區塊
  heroTitle: "我們相信，職涯中最有力的資產，是信任。",
  heroSubtitle: "Galaxyz 是一個由 GIVER 組成的職涯星圖。\n在這裡，推薦不是被動請求，而是主動給予。",
  heroButton: "打造我的人脈星圖",

  // 🌟 為什麼會有 Galaxyz？
  whyGalaxyTitle: "為什麼會有 Galaxyz？",
  whyGalaxyContent: "人的潛力就藏在歷練中\n\n我們看到：\n有些努力，履歷無法呈現；\n有些合作，值得被留下紀錄。\n\n所以我們創造 Galaxyz，\n讓「曾經一起努力的人」，可以為彼此留下真實的見證。",

  // 👥 誰是 GIVER？
  whoIsGiverTitle: "誰是 GIVER？",
  whoIsGiverContent: "GIVER，不是主管、不是名人。\nGIVER 是願意主動給予的人。\n\n你只需要曾共事，願意留下觀察與肯定，\n你就是一位 GIVER。\n\n在這裡，每個人都有能力給予。",

  // 🔤 GIVER 的五個精神
  giverSpiritTitle: "GIVER 的五個精神",
  giverSpirits: [
    {
      letter: "G",
      word: "Give",
      meaning: "主動給予，不等待邀請"
    },
    {
      letter: "I", 
      word: "Impact",
      meaning: "留下影響，創造連結"
    },
    {
      letter: "V",
      word: "Visibility", 
      meaning: "讓對方被更多人看見"
    },
    {
      letter: "E",
      word: "Endorse",
      meaning: "基於真實合作的背書"
    },
    {
      letter: "R",
      word: "Reciprocity",
      meaning: "信任會循環，也會回來"
    }
  ],
  giverSpiritFooter: "每一個 GIVER，都是 Galaxyz 閃耀的一顆星。",

  // ✨ Galaxyz 是怎麼運作的？
  howItWorksTitle: "Galaxyz 是怎麼運作的？",
  howItWorksSteps: [
    {
      title: "建立合作經歷",
      desc: "不用寫履歷，只需新增一段你們曾一起共事的經歷。"
    },
    {
      title: "成為 GIVER", 
      desc: "主動推薦當時的合作夥伴，讓彼此的價值被看見。"
    },
    {
      title: "累積人脈星圖",
      desc: "推薦自動整理成總表，可私密保存與公開分享。"
    }
  ],

  // 🌌 Galaxyz 的名字由來
  nameOriginTitle: "Galaxyz 的名字，怎麼來的？",
  nameOriginContent: "Galaxyz = Galaxy + Z\n\n每個人都是職涯銀河中的一顆星，\n這些連結我們的人，就是我們的人脈星圖。\n\n加上Z 象徵 X Y Z世代，共同在這片星空發光。",

  // 🧡 創辦者手記
  founderNoteTitle: "創辦者手記",
  founderQuote: "有一天，如果你情緒低落，\n希望這裡的推薦能像星光一樣，溫柔地接住你。",
  founderNoteContent: "Galaxyz 是我和 ChatGPT 一起完成的產品，\n也是我對「信任」最深的渴望。",

  // 🔁 結尾 CTA
  finalCtaQuote: "從你開始，成為一位 GIVER。\n一份推薦，是你給這世界最真實的光。",
  finalCtaButton: "立即加入"
},
    
    login: {
      welcomeTitle: "歡迎來到 Galaxyz✨ ",
      pageTitle: "登入 – Galaxyz",
      emailPlaceholder: "Email",
      passwordPlaceholder: "密碼",
      loginButton: "登入",
      registerButton: "註冊",
      forgotPassword: "忘記密碼？",
      noAccount: "還沒有帳號？",
      registerLink: "註冊新帳號",
      registerOnlyNote: "（僅限曾填寫推薦表者可註冊）",
      inviteCodePlaceholder: "邀請碼",
      inviteCodeHint: "請填寫專屬邀請碼，例如 galaxyz12345",
      inviteOnlyNotice: "目前僅限受邀者與推薦人註冊，請確認您的邀請連結是否正確。",
      alreadyHaveAccount: "已經有帳號了？",
      backToLogin: "返回登入",
      termsAgreement: '點擊「註冊」即表示您已閱讀並同意我們的<a href="/pages/privacy.html" target="_blank">隱私權政策</a>。',
    },

    header: {
      login: "登入",
      logout: "登出",
      searchPlaceholder: "搜尋人名...",
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
    },
    footer: {
      home: "首頁",
      about: "關於我們",
      privacy: "隱私權政策",
      copyright: `© ${new Date().getFullYear()} Galaxyz.ai - 版權所有`
    }
  },
};
// 🌍 添加缺少的全域變數
let currentLang = localStorage.getItem('lang') || 'en';

// 🌍 添加缺少的 getCurrentLang 函數
export function getCurrentLang() {
  return currentLang;
}

// 你原有的 setLang 函數，只需要小修改
export function setLang(langCode = "en") {
  // 🔧 更新全域變數
  currentLang = langCode;
  
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
        el.textContent = text;
      } else {
        el.innerHTML = text;
      }
    }
  });
  
  // 🔧 添加 placeholder 更新
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.getAttribute("data-i18n-placeholder");
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
      el.placeholder = text;
    }
  });
  
  window.dispatchEvent(new CustomEvent("langChanged", { detail: { lang: langCode } }));
}

// 🔧 添加翻譯函數
export function t(key, ...args) {
  const dict = i18n[currentLang] || i18n.en;
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

  if (text === null || text === undefined) {
    console.warn(`🌍 Missing translation for key: ${key}`);
    return key;
  }

  if (typeof text === "function") {
    return text(...args);
  }

  return text;
}

window.setLang = setLang;
window.getCurrentLang = getCurrentLang;
window.t = t;
window.i18n = i18n;