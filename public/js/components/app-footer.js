// public/js/components/app-footer.js

// 引入 i18n 的翻譯函式
import { t } from '../i18n.js';

function renderFooter() {
  // 從 i18n 取得翻譯後的文字
  const homeText = t('footer.home');
  const aboutText = t('footer.about');
  const privacyText = t('footer.privacy');
  const copyrightText = t('footer.copyright');

  const footerHTML = `
    <footer class="site-footer">
      <div class="footer-links">
        <a href="/index.html">${homeText}</a>
        <a href="/pages/about.html">${aboutText}</a>
        <a href="/pages/privacy.html">${privacyText}</a>
      </div>
      <p>${copyrightText}</p>
    </footer>
  `;

  const footerContainer = document.getElementById('appFooter');
  if (footerContainer) {
    footerContainer.innerHTML = footerHTML;
  }
}

// 初始渲染
renderFooter();

// 監聽語言切換事件，以便在語言變更時重新渲染頁尾
window.addEventListener('langChanged', renderFooter);