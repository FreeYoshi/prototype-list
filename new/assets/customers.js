// ============================================
// 顧客管理 ロジック
// ============================================

let tagFilter = 'all';
const customers = buildCustomers();

function renderKPIs() {
  const total = customers.length;
  const vip = customers.filter(c => c.tag === "VIP").length;
  const totalSpent = customers.reduce((s, c) => s + c.total_spent, 0);
  const totalVisits = customers.reduce((s, c) => s + c.visits, 0);
  const avg = totalVisits > 0 ? Math.round(totalSpent / totalVisits) : 0;

  document.getElementById('cust-total').textContent = total;
  document.getElementById('cust-kpi-total').textContent = `${total}名`;
  document.getElementById('cust-kpi-vip').textContent = `${vip}名`;
  document.getElementById('cust-kpi-avg').textContent = avg.toLocaleString();
}

function renderCustomers() {
  const search = document.getElementById('search').value.trim().toLowerCase();
  let list = customers.slice();

  if (tagFilter !== 'all') list = list.filter(c => c.tag === tagFilter);
  if (search) {
    list = list.filter(c =>
      c.name.toLowerCase().includes(search) ||
      c.kana.toLowerCase().includes(search) ||
      c.phone.includes(search)
    );
  }

  // 来院回数の多い順
  list.sort((a, b) => b.visits - a.visits);

  const wrap = document.getElementById('cust-grid');
  if (list.length === 0) {
    wrap.innerHTML = `<div class="card" style="padding:40px;text-align:center;color:var(--text-muted);grid-column:1/-1">
      <i data-lucide="users" width="40" style="opacity:0.4"></i>
      <div class="mt-3 font-semibold">該当する顧客はいません</div>
    </div>`;
    if (window.lucide) lucide.createIcons();
    return;
  }

  wrap.innerHTML = list.map(c => {
    const favMenu = c.favorite_menu ? getMenu(c.favorite_menu) : null;
    const isVip = c.tag === "VIP";
    return `
      <div class="cust-card fade-in" onclick="openCustomer('${c.phone}')">
        <div class="cust-head">
          <div class="cust-avatar ${isVip ? 'vip' : ''}">${c.name.charAt(0)}</div>
          <div style="flex:1;min-width:0">
            <div class="cust-name">${c.name}</div>
            <div class="cust-kana">${c.kana}</div>
          </div>
          <span class="badge badge-${TAG_COLOR[c.tag] || 'sky'}">${c.tag}</span>
        </div>
        <div class="cust-stats">
          <div class="cust-stat">
            <div class="cust-stat-label">来院</div>
            <div class="cust-stat-value">${c.visits}回</div>
          </div>
          <div class="cust-stat">
            <div class="cust-stat-label">最終来院</div>
            <div class="cust-stat-value" style="font-size:12px">${c.last_visit ? fmtDate(c.last_visit) : '-'}</div>
          </div>
          <div class="cust-stat">
            <div class="cust-stat-label">累計</div>
            <div class="cust-stat-value">¥${c.total_spent.toLocaleString()}</div>
          </div>
        </div>
        <div class="cust-foot">
          <span><i data-lucide="phone" width="11" style="vertical-align:-1px"></i> ${c.phone}</span>
          ${favMenu ? `<span class="badge badge-${favMenu.color}">${favMenu.name}</span>` : ''}
        </div>
        ${c.note ? `<div class="cust-note"><i data-lucide="sticky-note" width="11" style="vertical-align:-1px"></i> ${c.note}</div>` : ''}
      </div>
    `;
  }).join('');
  if (window.lucide) lucide.createIcons();
}

function filterTag(tag) {
  tagFilter = tag;
  document.querySelectorAll('#tag-chips .chip').forEach(c => {
    c.classList.toggle('active', c.dataset.tag === tag);
  });
  renderCustomers();
}

function openCustomer(phone) {
  const c = customers.find(x => x.phone === phone);
  if (!c) return;
  const isVip = c.tag === "VIP";

  // 来院履歴(新しい順)
  const visits = c.reservations
    .slice()
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

  const html = `
    <div class="modal-backdrop" onclick="closeModal(event)">
      <div class="modal" onclick="event.stopPropagation()" style="max-width:560px">
        <div class="flex justify-between items-center mb-4">
          <div class="flex items-center gap-3">
            <div class="cust-avatar ${isVip ? 'vip' : ''}" style="width:48px;height:48px">${c.name.charAt(0)}</div>
            <div>
              <div class="font-bold text-lg">${c.name} 様</div>
              <div class="text-xs muted">${c.kana} · ${c.phone}</div>
            </div>
          </div>
          <button class="icon-btn" onclick="closeModal()"><i data-lucide="x" width="16"></i></button>
        </div>

        <div class="cust-stats" style="grid-template-columns: repeat(4, 1fr); margin-bottom: 14px;">
          <div class="cust-stat">
            <div class="cust-stat-label">タグ</div>
            <div class="cust-stat-value"><span class="badge badge-${TAG_COLOR[c.tag] || 'sky'}">${c.tag}</span></div>
          </div>
          <div class="cust-stat">
            <div class="cust-stat-label">来院回数</div>
            <div class="cust-stat-value">${c.visits}回</div>
          </div>
          <div class="cust-stat">
            <div class="cust-stat-label">初回来院</div>
            <div class="cust-stat-value" style="font-size:12px">${c.first_visit ? fmtDate(c.first_visit) : '-'}</div>
          </div>
          <div class="cust-stat">
            <div class="cust-stat-label">累計金額</div>
            <div class="cust-stat-value">¥${c.total_spent.toLocaleString()}</div>
          </div>
        </div>

        <div class="field">
          <label>担当者メモ</label>
          <textarea rows="3" id="cust-memo">${c.note || ''}</textarea>
        </div>

        <div class="font-bold mt-4 mb-2">来院履歴</div>
        <div class="visit-list">
          ${visits.map(v => {
            const m = getMenu(v.menu_id);
            const s = STATUS_LABEL[v.status];
            return `
              <div class="visit-item">
                <div class="visit-date">${fmtDate(v.date)}<br><span class="text-xs muted">${v.time}</span></div>
                <div style="flex:1">
                  <div class="font-semibold">${m.name}</div>
                  <div class="text-xs muted">¥${m.price.toLocaleString()} · ${v.payment}</div>
                </div>
                <span class="badge badge-${s.color}">${s.text}</span>
              </div>
            `;
          }).join('')}
        </div>

        <div class="flex gap-2 mt-4">
          <button class="btn btn-ghost" style="flex:1" onclick="closeModal()">閉じる</button>
          <button class="btn btn-primary" style="flex:1" onclick="saveMemo('${c.phone}')">
            <i data-lucide="save" width="14"></i>メモを保存
          </button>
        </div>
      </div>
    </div>
  `;
  document.getElementById('modal-area').innerHTML = html;
  if (window.lucide) lucide.createIcons();
}

function saveMemo(phone) {
  const memo = document.getElementById('cust-memo').value.trim();
  const c = customers.find(x => x.phone === phone);
  if (c) c.note = memo;
  closeModal();
  renderCustomers();
  showToast('メモを保存しました');
}

function closeModal(e) {
  if (e && e.target !== e.currentTarget) return;
  document.getElementById('modal-area').innerHTML = '';
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
  renderKPIs();
  renderCustomers();
});
