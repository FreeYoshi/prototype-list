// ============================================
// 設定画面 ロジック
// ============================================

function goTab(name, el) {
  document.querySelectorAll('.tab-panel').forEach(p => p.hidden = true);
  document.getElementById('tab-' + name).hidden = false;
  document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
}

function renderHours() {
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  const wrap = document.getElementById('hours-list');
  if (!wrap) return;

  wrap.innerHTML = days.map((d, i) => {
    const h = BUSINESS_HOURS[i];
    const closed = !h;
    const isSun = i === 0;
    const isSat = i === 6;
    const color = isSun ? '#EF4444' : isSat ? '#3B82F6' : 'inherit';
    return `
      <div class="business-hour-row">
        <div class="day-label" style="color:${color}">${d}曜日</div>
        <div>
          <input type="time" value="${h?.open || '09:00'}" ${closed ? 'disabled' : ''} style="padding:8px 12px;border:1.5px solid var(--border);border-radius:8px;width:100%" />
        </div>
        <div>
          <input type="time" value="${h?.close || '18:00'}" ${closed ? 'disabled' : ''} style="padding:8px 12px;border:1.5px solid var(--border);border-radius:8px;width:100%" />
        </div>
        <div class="toggle ${closed ? '' : 'on'}" onclick="toggleDay(this, ${i})"></div>
      </div>
    `;
  }).join('');
}

function toggleDay(el, i) {
  el.classList.toggle('on');
  const row = el.closest('.business-hour-row');
  const inputs = row.querySelectorAll('input[type="time"]');
  const enabled = el.classList.contains('on');
  inputs.forEach(inp => inp.disabled = !enabled);
}

function saveSettings() {
  showToast('設定を保存しました');
}

function showToast(message, type) {
  const area = document.getElementById('toast-area');
  const t = document.createElement('div');
  t.className = 'toast';
  if (type === 'error') t.style.background = '#EF4444';
  t.innerHTML = `<i data-lucide="check-circle" width="16"></i> ${message}`;
  area.appendChild(t);
  if (window.lucide) lucide.createIcons();
  setTimeout(() => t.remove(), 2400);
}

window.addEventListener('DOMContentLoaded', () => {
  renderHours();
  if (window.lucide) lucide.createIcons();
});
