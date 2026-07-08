// ============================================
// スケジュール管理 ロジック
// ============================================

const closures = [...CLOSURES];

// ===== 週ビュー描画 =====
function renderWeek() {
  const baseDate = new Date("2026-05-25");
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + i);
    days.push(d);
  }

  const wrap = document.getElementById('week-grid');
  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];

  let html = '<div class="wg-cell wg-head"></div>';
  days.forEach(d => {
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const color = d.getDay() === 0 ? '#EF4444' : d.getDay() === 6 ? '#3B82F6' : 'var(--text)';
    html += `<div class="wg-cell wg-head" style="color:${color}">
      ${d.getMonth() + 1}/${d.getDate()}(${dayNames[d.getDay()]})
    </div>`;
  });

  const times = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

  times.forEach(t => {
    html += `<div class="wg-cell wg-time">${t}</div>`;
    days.forEach(d => {
      const dateStr = d.toISOString().split('T')[0];
      const hours = BUSINESS_HOURS[d.getDay()];

      if (!hours) {
        html += `<div class="wg-cell wg-off">休</div>`;
        return;
      }

      // 全日休業
      const fullClosed = closures.some(c => c.date === dateStr && c.type === 'fullday');
      if (fullClosed) {
        html += `<div class="wg-cell wg-closed">休</div>`;
        return;
      }

      // 時間枠休業
      const slotClosed = closures.some(c =>
        c.date === dateStr && c.type === 'slot' && t >= c.time_start && t < c.time_end
      );
      if (slotClosed) {
        html += `<div class="wg-cell wg-closed">休</div>`;
        return;
      }

      // 予約済
      const booked = RESERVATIONS.filter(r =>
        r.date === dateStr && r.time === t && r.status !== 'cancelled'
      ).length;

      if (booked > 0) {
        html += `<div class="wg-cell wg-booked">予約${booked}</div>`;
      } else {
        html += `<div class="wg-cell wg-slot">空</div>`;
      }
    });
  });

  wrap.innerHTML = html;
}

// ===== 休業履歴 =====
function renderClosures() {
  const wrap = document.getElementById('closure-list');
  document.getElementById('closure-count').textContent = closures.length;

  if (closures.length === 0) {
    wrap.innerHTML = `<div class="empty-state" style="padding:40px;text-align:center;color:var(--text-muted)">登録された休業設定はありません</div>`;
    return;
  }

  const sorted = [...closures].sort((a, b) => a.date.localeCompare(b.date));

  wrap.innerHTML = `
    <table class="table" style="border: none; border-radius: 0;">
      <thead>
        <tr>
          <th>日付</th>
          <th>時間</th>
          <th>区分</th>
          <th>理由</th>
          <th>登録日</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${sorted.map(c => `
          <tr>
            <td class="font-semibold">${fmtDateLong(c.date)}</td>
            <td>${c.type === 'fullday' ? '終日' : `${c.time_start} 〜 ${c.time_end}`}</td>
            <td>
              ${c.type === 'fullday'
                ? '<span class="badge badge-rose">終日休業</span>'
                : '<span class="badge badge-amber">時間枠休業</span>'}
            </td>
            <td>${c.reason || '-'}</td>
            <td class="text-xs muted">${c.created_at}</td>
            <td>
              <button class="icon-btn danger" onclick="removeClosure('${c.id}')"><i data-lucide="trash-2" width="14"></i></button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  // 再開用セレクト更新
  const sel = document.getElementById('reopen-select');
  sel.innerHTML = '<option value="">解除する休業を選択</option>' +
    sorted.map(c => {
      const label = c.type === 'fullday'
        ? `${fmtDateLong(c.date)} 終日`
        : `${fmtDateLong(c.date)} ${c.time_start}〜${c.time_end}`;
      return `<option value="${c.id}">${label} (${c.reason || '-'})</option>`;
    }).join('');

  if (window.lucide) lucide.createIcons();
}

// ===== 操作 =====
function addFullClosure() {
  const date = document.getElementById('closure-date').value;
  const reason = document.getElementById('closure-reason').value.trim();
  if (!date) return showToast('日付を選択してください', 'error');

  closures.push({
    id: 'c' + Date.now(),
    date,
    type: 'fullday',
    time_start: null,
    time_end: null,
    reason: reason || '休業',
    created_at: '2026-05-25',
  });
  renderClosures();
  renderWeek();
  showToast(`${fmtDateLong(date)} を終日休業に設定しました`);
}

function addSlotClosure() {
  const date = document.getElementById('slot-date').value;
  const s = document.getElementById('slot-start').value;
  const e = document.getElementById('slot-end').value;
  if (!date || !s || !e) return showToast('日付と時間を入力してください', 'error');

  closures.push({
    id: 'c' + Date.now(),
    date,
    type: 'slot',
    time_start: s,
    time_end: e,
    reason: '時間枠休業',
    created_at: '2026-05-25',
  });
  renderClosures();
  renderWeek();
  showToast(`${fmtDate(date)} ${s}〜${e} を休業に設定しました`);
}

function removeClosure(id) {
  if (!confirm('この休業設定を解除しますか?')) return;
  const idx = closures.findIndex(c => c.id === id);
  if (idx >= 0) closures.splice(idx, 1);
  renderClosures();
  renderWeek();
  showToast('休業設定を解除しました');
}

function reopen() {
  const id = document.getElementById('reopen-select').value;
  if (!id) return showToast('解除する休業を選択してください', 'error');
  removeClosure(id);
}

// ===== トースト =====
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
  renderWeek();
  renderClosures();
  if (window.lucide) lucide.createIcons();
});
