// 語言詞庫
const i18n = {
    en: {
      endBeforeStart: "⚠️ End date cannot be earlier than start date.",
      endAfterNow: "⚠️ End date cannot be in the future.",
      currentlyWorking: "Currently Working"
    },
    "zh-Hant": {
      endBeforeStart: "⚠️ 結束年月不可早於開始年月",
      endAfterNow: "⚠️ 結束年月不能超過現在",
      currentlyWorking: "目前在職"
    }
  };
  
  const lang = localStorage.getItem("lang") || "en";
  const t = i18n[lang];
  
  // ✅ 頁面載入後初始化邏輯
  window.addEventListener("DOMContentLoaded", () => {
    const profile = JSON.parse(localStorage.getItem("profile"));
  
    populateYearAndMonth(); // 產生年/月下拉選單
  
    if (profile && profile.chineseName && profile.englishName) {
      const chineseInput = document.getElementById("chineseName");
      const englishInput = document.getElementById("englishName");
  
      chineseInput.value = profile.chineseName;
      englishInput.value = profile.englishName;
  
      chineseInput.removeAttribute("required");
      englishInput.removeAttribute("required");
  
      chineseInput.readOnly = true;
      englishInput.readOnly = true;
  
      document.getElementById("nameFields").style.opacity = 0.3;
    }
  
    // ✅ 勾選「目前在職」時隱藏結束年月欄位
    document.getElementById("stillWorking").addEventListener("change", (e) => {
      const endFields = document.getElementById("endDateFields");
      endFields.style.display = e.target.checked ? "none" : "inline";
    });
  
    const addButton = document.getElementById("addButton");
    if (addButton) {
      addButton.addEventListener("click", () => {
        window.location.href = "index.html";
      });
    }
    
  });
  
  // ✅ 動態建立年／月下拉選單
  function populateYearAndMonth() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
    const startYear = currentYear - 40;
  
    const yearOptions = [];
    for (let y = startYear; y <= currentYear; y++) {
      yearOptions.push(`<option value="${y}">${y}</option>`);
    }
  
    const monthOptions = [];
    for (let m = 1; m <= 12; m++) {
      const mm = m.toString().padStart(2, '0');
      monthOptions.push(`<option value="${mm}">${mm}</option>`);
    }
  
    ["startYear", "endYear"].forEach(id => {
      document.getElementById(id).innerHTML = yearOptions.join("");
    });
  
    ["startMonth", "endMonth"].forEach(id => {
      document.getElementById(id).innerHTML = monthOptions.join("");
    });
  
    document.getElementById("endYear").value = currentYear;
    document.getElementById("endMonth").value = currentMonth;
  }
  
  // ✅ 表單送出：驗證與儲存資料
  document.getElementById("profileForm").addEventListener("submit", function (e) {
    e.preventDefault();
  
    const startYear = document.getElementById("startYear").value;
    const startMonth = document.getElementById("startMonth").value;
  
    if (!startYear || !startMonth) {
      alert("⚠️ Please select a valid start year and month.");
      return;
    }
  
    const isStillWorking = document.getElementById("stillWorking").checked;
    const endYear = document.getElementById("endYear").value;
    const endMonth = document.getElementById("endMonth").value;
  
    if (!isStillWorking && (!endYear || !endMonth)) {
      alert("⚠️ Please select a valid end year and month.");
      return;
    }
  
    const startDate = `${startYear}-${startMonth}`;
    let endDate = isStillWorking ? t.currentlyWorking : `${endYear}-${endMonth}`;
  
    if (!isStillWorking && endDate < startDate) {
      alert(t.endBeforeStart);
      return;
    }
  
    const now = new Date();
    const maxDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    if (!isStillWorking && endDate > maxDate) {
      alert(t.endAfterNow);
      return;
    }
  
    let profile = JSON.parse(localStorage.getItem("profile")) || {};
  
    if (!profile.userId) {
      profile.userId = crypto.randomUUID();
    }
  
    if (!profile.workExperiences) {
      profile.workExperiences = [];
    }
  
    if (!profile.chineseName || !profile.englishName) {
      profile.chineseName = document.getElementById("chineseName").value;
      profile.englishName = document.getElementById("englishName").value;
    }
  
    const company = document.getElementById("company").value;
    const position = document.getElementById("position").value;
  
    profile.workExperiences.push({ company, position, startDate, endDate });
    localStorage.setItem("profile", JSON.stringify(profile));
  
    window.location.href = "recommend.html";
  });