// ============================================
// 診療メニュー管理 ロジック
// ============================================

const menuList = MENUS.map(m => ({ ...m, active: true }));

const COLOR_OPTIONS = [
  { key: 'sky',     bg: '#E0F2FE', fg: '#0369A1' },
  { key: 'emerald', bg: '#D1FAE5', fg: '#047857' },
  { key: 'violet',  bg: '#EDE9FE', fg: '#6D28D9' },
  { key: 'rose',    bg: '#FFE4E6', fg: '#BE123C' },
  { key: 'amber',   bg: '#FEF3C7', fg: '#B45309' },
  { key: 'indigo',  bg: '#E0E7FF', fg: '#4338CA' },
];

const ICON_OPTIONS = [
  { key: 'tooth',    lucide: 'stethoscope' },
  { key: 'sparkles', lucide: 'sparkles' },
  { key: 'gem',      lucide: 'gem' },
  { key: 'smile',    lucide: 'smile' },
  { key: 'baby',     lucide: 'baby' },
  { key: 'wrench',   lucide: 'wrench' },
  { key: 'heart',    lucide: 'heart' },
  { key: 'shield',   lucide: 'shield' },
  { key: 'star',     lucide: 'star' },
  { key: 'syringe',  lucide: 'syringe' },
  { key: 'pill',     lucide: 'pill' },
  { key: 'activity', lucide: 'activity' },
];

function iconLucide(key) {
  return ICON_OPTIONS.find(i => i.key === key)?.lucide || 'circle';
}

function renderMenus() {
  const wrap = document.getElementById('menu-grid');
  wrap.innerHTML = menuList.map(m => `
    <div class="m-card fade-in ${m.active ? '' : 'disabled'}">
      <div class="m-actions">
        <button class="icon-btn" onclick="toggleActive('${m.id}')" title="${m.active ? '非公開' : '公開'}">
          <i data-lucide="${m.active ? 'eye' : 'eye-off'}" width="14"></i>
        </button>
        <button class="icon-btn" onclick="openMenuEditor('${m.id}')" title="編集"><i data-lucide="pencil" width="14"></i></button>
        <button class="icon-btn danger" onclick="removeMenu('${m.id}')" title="削除"><i data-lucide="trash-2" width="14"></i></button>
      </div>
      <div class="m-icon-big ${m.color}">
        <i data-lucide="${iconLucide(m.icon)}" width="28"></i>
      </div>
      <div class="m-name">
        ${m.name}
        ${m.popular ? '<span class="badge badge-rose">人気</span>' : ''}
        ${!m.active ? '<span class="badge badge-slate">非公開</span>' : ''}
      </div>
      <div class="m-desc">${m.description}</div>
      <div class="m-meta">
        <div>
          <div class="label">所要時間</div>
          <div class="value">${m.duration}分</div>
        </div>
        <div style="text-align:right">
          <div class="label">料金</div>
          <div class="value">${m.price === 0 ? '無料' : '¥' + m.price.toLocaleString()}</div>
        </div>
      </div>
    </div>
  `).join('') + `
    <div class="m-card add-card" onclick="openMenuEditor()">
      <i data-lucide="plus-circle" width="32"></i>
      <div>メニューを追加</div>
    </div>
  `;
  if (window.lucide) lucide.createIcons();
}

function openMenuEditor(id) {
  const editing = id ? menuList.find(m => m.id === id) : null;
  const m = editing || {
    id: null, name: '', description: '', duration: 30, price: 3000,
    icon: 'tooth', color: 'sky', popular: false, active: true,
  };

  const html = `
    <div class="modal-backdrop" onclick="closeModal(event)">
      <div class="modal" onclick="event.stopPropagation()" style="max-width:560px">
        <div class="flex justify-between items-center mb-4">
          <div class="font-bold text-lg">${editing ? 'メニューを編集' : 'メニューを追加'}</div>
          <button class="icon-btn" onclick="closeModal()"><i data-lucide="x" width="16"></i></button>
        </div>

        <div class="field">
          <label>メニュー名<span class="required">必須</span></label>
          <input type="text" id="e-name" value="${m.name}" placeholder="例: ホワイトニング" />
        </div>
        <div class="field">
          <label>説明</label>
          <textarea id="e-desc" rows="2" placeholder="患者さまに表示される説明文">${m.description}</textarea>
        </div>
        <div class="flex gap-3">
          <div class="field" style="flex:1">
            <label>所要時間(分)<span class="required">必須</span></label>
            <input type="number" id="e-duration" value="${m.duration}" step="15" min="15" />
          </div>
          <div class="field" style="flex:1">
            <label>料金(円)</label>
            <input type="number" id="e-price" value="${m.price}" step="100" min="0" />
          </div>
        </div>
        <div class="field">
          <label>カラー</label>
          <div class="color-picker" id="e-colors">
            ${COLOR_OPTIONS.map(c => `
              <div class="color-swatch ${c.key === m.color ? 'selected' : ''}"
                   data-color="${c.key}"
                   style="background:${c.bg}; border-color: ${c.key === m.color ? c.fg : 'transparent'}"
                   onclick="pickColor('${c.key}')"></div>
            `).join('')}
          </div>
        </div>
        <div class="field">
          <label>アイコン</label>
          <div class="icon-picker" id="e-icons">
            ${ICON_OPTIONS.map(i => `
              <div class="icon-pick ${i.key === m.icon ? 'selected' : ''}"
                   data-icon="${i.key}" onclick="pickIcon('${i.key}')">
                <i data-lucide="${i.lucide}" width="18"></i>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="field">
          <label class="flex items-center gap-2">
            <input type="checkbox" id="e-popular" ${m.popular ? 'checked' : ''}>
            「人気」バッジを表示
          </label>
        </div>

        <div class="flex gap-2 mt-4">
          <button class="btn btn-ghost" style="flex:1" onclick="closeModal()">キャンセル</button>
          <button class="btn btn-primary" style="flex:1" onclick="saveMenu('${editing ? editing.id : ''}')">
            <i data-lucide="save" width="14"></i>保存する
          </button>
        </div>
      </div>
    </div>
  `;
  document.getElementById('modal-area').innerHTML = html;
  if (window.lucide) lucide.createIcons();
  // 仮で選択を保持
  window._pickColor = m.color;
  window._pickIcon = m.icon;
}

function pickColor(key) {
  window._pickColor = key;
  document.querySelectorAll('#e-colors .color-swatch').forEach(s => {
    const sel = s.dataset.color === key;
    s.classList.toggle('selected', sel);
    const c = COLOR_OPTIONS.find(co => co.key === s.dataset.color);
    s.style.borderColor = sel ? c.fg : 'transparent';
  });
}

function pickIcon(key) {
  window._pickIcon = key;
  document.querySelectorAll('#e-icons .icon-pick').forEach(s => {
    s.classList.toggle('selected', s.dataset.icon === key);
  });
}

function saveMenu(id) {
  const name = document.getElementById('e-name').value.trim();
  if (!name) return showToast('メニュー名を入力してください', 'error');
  const desc = document.getElementById('e-desc').value.trim();
  const duration = parseInt(document.getElementById('e-duration').value, 10) || 30;
  const price = parseInt(document.getElementById('e-price').value, 10) || 0;
  const popular = document.getElementById('e-popular').checked;
  const color = window._pickColor || 'sky';
  const icon = window._pickIcon || 'tooth';

  if (id) {
    const m = menuList.find(x => x.id === id);
    Object.assign(m, { name, description: desc, duration, price, popular, color, icon });
    showToast(`「${name}」を更新しました`);
  } else {
    menuList.push({
      id: 'm' + Date.now(),
      name, description: desc, duration, price, popular, color, icon, active: true,
    });
    showToast(`「${name}」を追加しました`);
  }
  closeModal();
  renderMenus();
}

function toggleActive(id) {
  const m = menuList.find(x => x.id === id);
  if (!m) return;
  m.active = !m.active;
  renderMenus();
  showToast(`「${m.name}」を${m.active ? '公開' : '非公開'}にしました`);
}

function removeMenu(id) {
  const m = menuList.find(x => x.id === id);
  if (!m) return;
  if (!confirm(`「${m.name}」を削除しますか?`)) return;
  const idx = menuList.indexOf(m);
  menuList.splice(idx, 1);
  renderMenus();
  showToast(`「${m.name}」を削除しました`);
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
  renderMenus();
});
