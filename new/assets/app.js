// ============================================
// 患者向けWebアプリ ロジック
// ============================================

const booking = {
  menu_id: null,
  date: null,
  time: null,
  name: "",
  kana: "",
  phone: "",
  email: "",
  note: "",
};

let calMonth = new Date("2026-06-03");
calMonth.setDate(1);

// ===== 画面切替 =====
function goStep(name) {
  document.querySelectorAll('.screen').forEach(s => s.hidden = true);
  const el = document.getElementById('step-' + name);
  if (el) el.hidden = false;
  window.scrollTo({ top: 0, behavior: 'instant' });

  if (name === 'welcome') {
    renderDoctors();
  }
  if (name === 'menu') renderMenus();
  if (name === 'date') {
    renderCalendar();
    renderTimeSection(); // 初期は「日付を選んでください」の案内
  }
  if (name === 'info') renderSummary();

  if (window.lucide) lucide.createIcons();
}

// ===== ヒーロー & ドクター =====
function initHero() {
  const el = document.getElementById('hero-visual');
  if (el) el.style.backgroundImage = `url('${CLINIC.hero_image}')`;
}

function renderDoctors() {
  const wrap = document.getElementById('doc-grid');
  if (!wrap) return;
  wrap.innerHTML = STAFF.map(s => `
    <div class="doc-card">
      <img class="doc-img" src="${s.avatar}" alt="${s.name}" onerror="this.style.display='none'" />
      <div>
        <div class="doc-name">${s.name}</div>
        <span class="doc-role">${s.role}</span>
        <div class="doc-bio">${s.bio}</div>
      </div>
    </div>
  `).join('');
}

// ===== メニュー =====
function renderMenus() {
  const wrap = document.getElementById('menu-list');
  wrap.innerHTML = MENUS.map(m => `
    <div class="menu-card-web fade-in" onclick="selectMenu('${m.id}')">
      <div class="menu-icon-web ${m.color}">
        <i data-lucide="${iconFor(m.icon)}" width="24"></i>
      </div>
      <div class="menu-body-web">
        <div class="menu-name-web">
          ${m.name}
          ${m.popular ? '<span class="badge badge-rose">人気</span>' : ''}
        </div>
        <div class="menu-desc-web">${m.description}</div>
        <div class="menu-meta-web">
          <span><i data-lucide="clock" width="11" style="vertical-align:-1px"></i> ${m.duration}分</span>
          <span>¥ ${m.price === 0 ? '無料' : m.price.toLocaleString()}</span>
        </div>
      </div>
      <i data-lucide="chevron-right" width="20" style="color: var(--text-muted)"></i>
    </div>
  `).join('');
  if (window.lucide) lucide.createIcons();
}

function iconFor(name) {
  const map = {
    tooth: "stethoscope", sparkles: "sparkles", gem: "gem",
    smile: "smile", baby: "baby", wrench: "wrench",
  };
  return map[name] || "circle";
}

function selectMenu(id) {
  booking.menu_id = id;
  goStep('date');
}

// ===== カレンダー =====
function renderCalendar() {
  const wrap = document.getElementById('calendar');
  const year = calMonth.getFullYear();
  const month = calMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date("2026-06-03");
  today.setHours(0, 0, 0, 0);

  let html = `
    <div class="cal-head">
      <button class="cal-nav-btn" onclick="navMonth(-1)"><i data-lucide="chevron-left" width="16"></i></button>
      <div class="cal-title">${year}年 ${month + 1}月</div>
      <button class="cal-nav-btn" onclick="navMonth(1)"><i data-lucide="chevron-right" width="16"></i></button>
    </div>
    <div class="cal-weekdays">
      <div class="cal-weekday sun">日</div>
      <div class="cal-weekday">月</div>
      <div class="cal-weekday">火</div>
      <div class="cal-weekday">水</div>
      <div class="cal-weekday">木</div>
      <div class="cal-weekday">金</div>
      <div class="cal-weekday sat">土</div>
    </div>
    <div class="cal-grid">
  `;

  for (let i = 0; i < firstDay; i++) html += `<div></div>`;

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isPast = date < today;
    const dayOfWeek = date.getDay();
    const closed = BUSINESS_HOURS[dayOfWeek] == null;
    const fullClosure = CLOSURES.some(c => c.date === dateStr && c.type === "fullday");
    const disabled = isPast || closed || fullClosure;
    const isSelected = booking.date === dateStr;
    const isToday = date.getTime() === today.getTime();

    const cls = ['cal-day'];
    if (disabled) cls.push('disabled');
    if (isSelected) cls.push('selected');
    if (isToday) cls.push('today');

    html += `<div class="${cls.join(' ')}" ${disabled ? '' : `onclick="selectDate('${dateStr}')"`}>
      ${d}
      ${!disabled ? '<span class="dot"></span>' : ''}
    </div>`;
  }
  html += `</div>`;
  wrap.innerHTML = html;
  if (window.lucide) lucide.createIcons();
}

function navMonth(delta) {
  calMonth.setMonth(calMonth.getMonth() + delta);
  renderCalendar();
}

function selectDate(dateStr) {
  booking.date = dateStr;
  booking.time = null;
  renderCalendar();
  renderTimeSection();
}

// ===== 時間スロット(右カラム) =====
function renderTimeSection() {
  const wrap = document.getElementById('time-section');
  if (!booking.date) {
    wrap.innerHTML = `
      <div class="card" style="padding:24px;text-align:center;color:var(--text-muted)">
        <i data-lucide="calendar-clock" width="32" style="opacity:0.4"></i>
        <div class="mt-3 text-sm">左の日付を選択すると<br>空き時間が表示されます</div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  const slots = generateTimeSlots(booking.date);
  wrap.innerHTML = `
    <div class="card fade-in" style="padding:20px;">
      <div class="font-bold mb-3" style="font-size:15px">${fmtDateLong(booking.date)}</div>
      <div class="time-grid">
        ${slots.map(t => {
          const ok = isSlotAvailable(booking.date, t);
          const sel = booking.time === t;
          return `<button class="time-slot ${sel ? 'selected' : ''}" ${ok ? '' : 'disabled'} onclick="selectTime('${t}')">${t}</button>`;
        }).join('')}
      </div>
      <div class="text-xs muted text-center mt-3">空き時間のみ表示しています</div>
      ${booking.time ? `
        <button class="btn btn-primary" style="width:100%;padding:14px;margin-top:14px" onclick="goStep('info')">
          ${booking.time} で予約する <i data-lucide="arrow-right" width="16"></i>
        </button>
      ` : ''}
    </div>
  `;
  if (window.lucide) lucide.createIcons();
}

function selectTime(t) {
  booking.time = t;
  renderTimeSection();
}

// ===== サマリー =====
function renderSummary() {
  const menu = getMenu(booking.menu_id);
  document.getElementById('sum-menu').textContent = menu.name;
  document.getElementById('sum-datetime').textContent = `${fmtDateLong(booking.date)} ${booking.time}`;
  document.getElementById('sum-price').textContent = menu.price === 0 ? '無料' : `¥${menu.price.toLocaleString()}`;
}

// ===== 確定 =====
function submitBooking() {
  const name = document.getElementById('f-name').value.trim();
  const kana = document.getElementById('f-kana').value.trim();
  const phone = document.getElementById('f-phone').value.trim();

  if (!name || !kana || !phone) {
    showToast('必須項目を入力してください', 'error');
    return;
  }

  booking.name = name;
  booking.kana = kana;
  booking.phone = phone;
  booking.email = document.getElementById('f-email').value.trim();
  booking.note = document.getElementById('f-note').value.trim();

  const id = 'R-' + Date.now().toString().slice(-7);
  const menu = getMenu(booking.menu_id);

  document.getElementById('done-id').textContent = id;
  document.getElementById('done-name').textContent = booking.name;
  document.getElementById('done-menu').textContent = menu.name;
  document.getElementById('done-datetime').textContent = `${fmtDateLong(booking.date)} ${booking.time}`;
  document.getElementById('done-price').textContent = menu.price === 0 ? '無料' : `¥${menu.price.toLocaleString()}`;

  goStep('complete');
}

function resetBooking() {
  booking.menu_id = null;
  booking.date = null;
  booking.time = null;
  booking.name = booking.kana = booking.phone = booking.email = booking.note = "";
  document.querySelectorAll('#step-info input, #step-info textarea').forEach(i => i.value = '');
}

// ===== トースト =====
function showToast(message, type) {
  const area = document.getElementById('toast-area');
  const t = document.createElement('div');
  t.className = 'toast';
  if (type === 'error') t.style.background = '#EF4444';
  t.innerHTML = `<i data-lucide="${type === 'error' ? 'alert-circle' : 'check-circle'}" width="16"></i> ${message}`;
  area.appendChild(t);
  if (window.lucide) lucide.createIcons();
  setTimeout(() => t.remove(), 2400);
}

// ===== 初期化 =====
window.addEventListener('DOMContentLoaded', () => {
  initHero();
  renderDoctors();
  if (window.lucide) lucide.createIcons();
});
