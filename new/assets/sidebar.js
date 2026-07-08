// ============================================
// 管理画面 共通サイドバー
// ============================================
// 使い方: <aside class="admin-sidebar" data-page="reservations"></aside>

const SIDEBAR_ITEMS = [
  { key: "reservations", href: "admin.html",     label: "予約一覧",       icon: "layout-dashboard" },
  { key: "schedule",     href: "schedule.html",  label: "スケジュール管理", icon: "calendar-days" },
  { key: "customers",    href: "customers.html", label: "顧客管理",       icon: "users" },
  { key: "menus",        href: "menus.html",     label: "診療メニュー",   icon: "list" },
  { key: "reports",      href: "reports.html",   label: "レポート",       icon: "bar-chart-3" },
  { key: "settings",     href: "settings.html",  label: "設定",           icon: "settings" },
];

function renderSidebar() {
  const aside = document.querySelector('.admin-sidebar');
  if (!aside) return;
  const active = aside.dataset.page || '';

  const navHtml = SIDEBAR_ITEMS.map(item => `
    <a href="${item.href}" class="${item.key === active ? 'active' : ''}">
      <i data-lucide="${item.icon}" width="16"></i>${item.label}
    </a>
  `).join('');

  aside.innerHTML = `
    <div class="admin-logo">
      <i data-lucide="stethoscope" width="20" style="vertical-align:-4px;color:#0EA5E9"></i>
      さくら歯科
    </div>
    <nav class="admin-nav">${navHtml}</nav>
    <div style="position:absolute; bottom: 20px; left:0; right:0; padding: 0 20px; font-size: 12px;">
      <div style="display:flex; align-items:center; gap:10px; padding: 10px 12px; background:#1E293B; border-radius:10px; margin-bottom: 10px;">
        <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#0EA5E9,#6366F1);color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;">山</div>
        <div style="flex:1; min-width: 0;">
          <div style="color:white;font-weight:600;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">山田 健一</div>
          <div style="color:#64748B;font-size:10px;">院長</div>
        </div>
      </div>
      <a href="login.html" style="color:#94A3B8;text-decoration:none;display:flex;align-items:center;gap:6px;padding:6px 4px;">
        <i data-lucide="log-out" width="14"></i> ログアウト
      </a>
    </div>
  `;
  if (window.lucide) lucide.createIcons();
}

window.addEventListener('DOMContentLoaded', renderSidebar);
