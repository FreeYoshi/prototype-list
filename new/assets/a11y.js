// ============================================
// アクセシビリティ: 文字サイズ設定
// 早期実行で初期描画前にスケールを適用する
// ============================================

(function () {
  const STORAGE_KEY = 'reservemate.fontSize';
  const SIZES = ['sm', 'md', 'lg', 'xl'];

  function apply(level) {
    if (!SIZES.includes(level)) level = 'md';
    const html = document.documentElement;
    SIZES.forEach(s => html.classList.remove('fs-' + s));
    html.classList.add('fs-' + level);
  }

  // 起動時: 保存値を適用
  const saved = localStorage.getItem(STORAGE_KEY) || 'md';
  apply(saved);

  // グローバル API
  window.A11y = {
    get: () => localStorage.getItem(STORAGE_KEY) || 'md',
    set: (level) => {
      if (!SIZES.includes(level)) return;
      localStorage.setItem(STORAGE_KEY, level);
      apply(level);
      // 他タブにも反映
      window.dispatchEvent(new CustomEvent('a11y:changed', { detail: { level } }));
    },
    SIZES,
  };

  // 他タブで変更された場合に同期
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY && e.newValue) apply(e.newValue);
  });
})();
