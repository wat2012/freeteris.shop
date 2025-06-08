import React from 'react';
import style from './index.less';

export default class LanguageToggle extends React.Component {
  constructor() {
    super();
    this.state = {
      currentLang: this.getCurrentLanguage(),
    };
    this.switchToLanguage = this.switchToLanguage.bind(this);
  }

  getCurrentLanguage() {
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lan');
    return langParam === 'en' ? 'en' : 'zh';
  }

  switchToLanguage(targetLang) {
    if (this.state.currentLang === targetLang) {
      return; // Already in target language
    }

    const url = new URL(window.location);
    url.searchParams.set('lan', targetLang);
    window.location.href = url.toString();
  }

  render() {
    const { currentLang } = this.state;

    return (
      <div className={style.languageToggle}>
        <div className={style.buttonGroup}>
          <button
            className={`${style.langButton} ${currentLang === 'zh' ? style.active : ''}`}
            onClick={() => this.switchToLanguage('zh')}
            title="切换到中文"
          >
            <span className={style.flag}>🇨🇳</span>
            <span className={style.text}>中文</span>
          </button>
          <button
            className={`${style.langButton} ${currentLang === 'en' ? style.active : ''}`}
            onClick={() => this.switchToLanguage('en')}
            title="Switch to English"
          >
            <span className={style.flag}>🇺🇸</span>
            <span className={style.text}>EN</span>
          </button>
        </div>
      </div>
    );
  }
}
