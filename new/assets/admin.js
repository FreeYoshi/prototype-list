// ============================================
// 管理画面 ロジック
// ============================================

let statusFilter = 'all';
// 編集用にコピー(デモ中はオンメモリで反映する)
const reservations = [...RESERVATIONS];

// ===== KPI =====
function renderKPIs() {
  const today = "2026-05-25";
  const weekDates = ["2026-05-25", "2026-05-26", "2026-05-27", "2026-05-28", "2026-05-29", "2026-05-30"];

  const todayCount = reservations.filter(r => r.date === today && r.status !== 'cancelled').length;
  const weekCount = reservations.filter(r => weekDates.includes(r.date) && r.status !== 'cancelled').length;
  const pending = reservations.filter(r => r.status === 'pending').length;
  const revenue = reservations
    .filter(r => r.status !== 'cancelled')
    .reduce((s, r) => s + (getMenu(r.menu_id)?.price || 0), 0);

  document.getElementById('kpi-today').textContent = `${todayCount}件`;
  document.getElementById('kpi-week').textContent = `${weekCount}件`;
  document.getElementById('kpi-pending').textContent = `${pending}件`;
  document.getElementById('kpi-revenue').textContent = `¥${revenue.toLocaleString()}`;
}

// ===== テーブル描画 =====
function renderTable() {
  const search = document.getElementById('search').value.trim().toLowerCase();
  const dateFilter = document.getElementById('filter-date').value;

  let rows = reservations.slice();

  if (dateFilter) rows = rows.filter(r => r.date === dateFilter);
  if (statusFilter !== 'all') rows = rows.filter(r => r.status === statusFilter);
  if (search) {
    rows = rows.filter(r =>
      r.name.toLowerCase().includes(search) ||
      r.kana.toLowerCase().includes(search) ||
      r.phone.includes(search)
    );
  }

  // 日付・時間順
  rows.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  const wrap = document.getElementById('table-wrap');

  if (rows.length === 0) {
    wrap.innerHTML = `
      <div class="card empty-state">
        <i data-lucide="calendar-x" width="40" style="opacity:0.4"></i>
        <div class="mt-3 font-semibold">該当する予約はありません</div>
        <div class="text-sm muted mt-2">検索条件を変更してください</div>
      </div>`;
    if (window.lucide) lucide.createIcons();
    return;
  }

  wrap.innerHTML = `
    <table class="table fade-in">
      <thead>
        <tr>
          <th>日時</th>
          <th>お客さま</th>
          <th>電話番号</th>
          <th>メニュー</th>
          <th>決済</th>
          <th>状態</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(r => {
          const m = getMenu(r.menu_id);
          const s = STATUS_LABEL[r.status];
          const initial = r.name.charAt(0);
          return `
            <tr>
              <td>
                <div class="font-semibold">${fmtDate(r.date)}</div>
                <div class="text-xs muted">${r.time} 〜</div>
              </td>
              <td>
                <div class="name-cell">
                  <div class="avatar">${initial}</div>
                  <div>
                    <div class="font-semibold">${r.name}</div>
                    <div class="text-xs muted">${r.kana}</div>
                  </div>
                </div>
              </td>
              <td><span class="font-semibold">${r.phone}</span></td>
              <td><span class="badge badge-${m.color}">${m.name}</span></td>
              <td><span class="text-xs">${r.payment}</span></td>
              <td><span class="badge badge-${s.color}">${s.text}</span></td>
              <td>
                <div class="actions-cell">
                  <button class="icon-btn" onclick="openDetail('${r.id}')" title="詳細"><i data-lucide="eye" width="14"></i></button>
                  <button class="icon-btn" onclick="confirmReservation('${r.id}')" title="確定"><i data-lucide="check" width="14"></i></button>
                  <button class="icon-btn danger" onclick="cancelReservation('${r.id}')" title="キャンセル"><i data-lucide="x" width="14"></i></button>
                </div>
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
  if (window.lucide) lucide.createIcons();
}

function filterByStatus(s) {
  statusFilter = s;
  document.querySelectorAll('#status-chips .chip').forEach(c => {
    c.classList.toggle('active', c.dataset.status === s);
  });
  renderTable();
}

// ===== 詳細モーダル =====
function openDetail(id) {
  const r = reservations.find(x => x.id === id);
  if (!r) return;
  const m = getMenu(r.menu_id);
  const s = STATUS_LABEL[r.status];

  const html = `
    <div class="modal-backdrop" onclick="closeModal(event)">
      <div class="modal" onclick="event.stopPropagation()">
        <div class="flex justify-between items-center mb-4">
          <div>
            <div class="text-xs muted">予約番号</div>
            <div class="font-bold text-lg">${r.id}</div>
          </div>
          <button class="icon-btn" onclick="closeModal()"><i data-lucide="x" width="16"></i></button>
        </div>

        <div class="flex items-center gap-3 mb-4 p-4" style="background: var(--bg); border-radius: 12px;">
          <div class="avatar" style="width:48px;height:48px;font-size:18px">${r.name.charAt(0)}</div>
          <div>
            <div class="font-bold text-lg">${r.name} 様</div>
            <div class="text-xs muted">${r.kana}</div>
          </div>
          <div style="margin-left:auto"><span class="badge badge-${s.color}">${s.text}</span></div>
        </div>

        <div class="summary-row"><span class="label">電話</span><span class="value">${r.phone}</span></div>
        <div class="summary-row"><span class="label">日時</span><span class="value">${fmtDateLong(r.date)} ${r.time}</span></div>
        <div class="summary-row"><span class="label">メニュー</span><span class="value">${m.name} (${m.duration}分)</span></div>
        <div class="summary-row"><span class="label">料金</span><span class="value">${m.price === 0 ? '無料' : '¥' + m.price.toLocaleString()}</span></div>
        <div class="summary-row"><span class="label">決済</span><span class="value">${r.payment}</span></div>
        <div class="summary-row"><span class="label">登録日時</span><span class="value text-xs">${r.created_at}</span></div>
        ${r.note ? `
          <div class="card mt-4" style="background:#FEF3C7; border-color:#FDE68A;">
            <div class="text-xs muted mb-2">ご相談内容</div>
            <div class="text-sm">${r.note}</div>
          </div>` : ''}

        <div class="flex gap-2 mt-4">
          <button class="btn btn-ghost" style="flex:1" onclick="closeModal()">閉じる</button>
          <button class="btn btn-primary" style="flex:1" onclick="confirmReservation('${r.id}'); closeModal();">
            <i data-lucide="check" width="14"></i>確定する
          </button>
        </div>
      </div>
    </div>
  `;
  document.getElementById('modal-area').innerHTML = html;
  if (window.lucide) lucide.createIcons();
}

function closeModal(e) {
  if (e && e.target !== e.currentTarget) return;
  document.getElementById('modal-area').innerHTML = '';
}

// ===== 操作 =====
function confirmReservation(id) {
  const r = reservations.find(x => x.id === id);
  if (!r) return;
  r.status = 'confirmed';
  renderTable();
  renderKPIs();
  showToast(`${r.name} 様の予約を確定しました`);
}

function cancelReservation(id) {
  const r = reservations.find(x => x.id === id);
  if (!r) return;
  if (!confirm(`${r.name} 様の予約をキャンセルしますか?`)) return;
  r.status = 'cancelled';
  renderTable();
  renderKPIs();
  showToast(`${r.name} 様の予約をキャンセルしました`, 'warn');
}

// ===== トースト =====
function showToast(message, type) {
  const area = document.getElementById('toast-area');
  const t = document.createElement('div');
  t.className = 'toast';
  if (type === 'warn') t.style.background = '#B45309';
  if (type === 'error') t.style.background = '#EF4444';
  t.innerHTML = `<i data-lucide="check-circle" width="16"></i> ${message}`;
  area.appendChild(t);
  if (window.lucide) lucide.createIcons();
  setTimeout(() => t.remove(), 2400);
}

// ===== 初期化 =====
window.addEventListener('DOMContentLoaded', () => {
  renderKPIs();
  renderTable();
  if (window.lucide) lucide.createIcons();
});
