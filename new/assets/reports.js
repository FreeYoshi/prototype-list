// ============================================
// レポート ロジック
// ============================================

// ===== KPI =====
function renderKPIs() {
  const totalCount = MONTHLY_REVENUE.reduce((s, m) => s + m.count, 0);
  const totalRev = MONTHLY_REVENUE.reduce((s, m) => s + m.revenue, 0);
  document.getElementById('rep-total').textContent = `${totalCount}件`;
  document.getElementById('rep-revenue').textContent = `¥${(totalRev / 10000).toFixed(0)}万`;
}

// ===== 折れ線グラフ(SVG) =====
function renderLineChart() {
  const w = 560, h = 220, pad = 40;
  const data = MONTHLY_REVENUE;
  const maxV = Math.max(...data.map(d => d.revenue));
  const stepX = (w - pad * 2) / (data.length - 1);

  const points = data.map((d, i) => {
    const x = pad + stepX * i;
    const y = h - pad - ((d.revenue / maxV) * (h - pad * 2));
    return { x, y, ...d };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = pathD + ` L ${points[points.length - 1].x} ${h - pad} L ${points[0].x} ${h - pad} Z`;

  // Yラベル
  const ySteps = 4;
  let yLabels = '';
  for (let i = 0; i <= ySteps; i++) {
    const v = (maxV / ySteps) * i;
    const y = h - pad - ((v / maxV) * (h - pad * 2));
    yLabels += `<line x1="${pad}" y1="${y}" x2="${w - pad}" y2="${y}" stroke="#F1F5F9" stroke-width="1"/>`;
    yLabels += `<text x="${pad - 8}" y="${y + 4}" font-size="10" fill="#94A3B8" text-anchor="end">${(v / 10000).toFixed(0)}万</text>`;
  }

  let xLabels = '';
  points.forEach(p => {
    xLabels += `<text x="${p.x}" y="${h - pad + 16}" font-size="11" fill="#64748B" text-anchor="middle">${p.month}</text>`;
  });

  let dots = '';
  points.forEach(p => {
    dots += `<circle cx="${p.x}" cy="${p.y}" r="5" fill="white" stroke="#0EA5E9" stroke-width="2.5"/>`;
    dots += `<text x="${p.x}" y="${p.y - 12}" font-size="10" fill="#0369A1" text-anchor="middle" font-weight="700">¥${(p.revenue / 10000).toFixed(0)}万</text>`;
  });

  document.getElementById('line-chart').innerHTML = `
    <svg viewBox="0 0 ${w} ${h}" style="width:100%; height: auto">
      <defs>
        <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0EA5E9" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="#0EA5E9" stop-opacity="0"/>
        </linearGradient>
      </defs>
      ${yLabels}
      <path d="${areaD}" fill="url(#lineFill)"/>
      <path d="${pathD}" fill="none" stroke="#0EA5E9" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      ${dots}
      ${xLabels}
    </svg>
  `;
}

// ===== 曜日別棒グラフ(SVG) =====
function renderBarChart() {
  const w = 360, h = 220, pad = 28;
  const data = [
    { label: '月', value: 32 },
    { label: '火', value: 36 },
    { label: '水', value: 0 },
    { label: '木', value: 38 },
    { label: '金', value: 42 },
    { label: '土', value: 48 },
    { label: '日', value: 0 },
  ];
  const maxV = Math.max(...data.map(d => d.value));
  const barW = (w - pad * 2) / data.length * 0.6;
  const gap = (w - pad * 2) / data.length;

  let bars = '';
  data.forEach((d, i) => {
    const x = pad + gap * i + (gap - barW) / 2;
    const barH = maxV ? (d.value / maxV) * (h - pad * 2) : 0;
    const y = h - pad - barH;
    const isClosed = d.value === 0;
    bars += `<rect x="${x}" y="${y}" width="${barW}" height="${barH}"
      fill="${isClosed ? '#E2E8F0' : 'url(#barGrad)'}" rx="6"/>`;
    bars += `<text x="${x + barW / 2}" y="${y - 6}" font-size="11" font-weight="700" fill="${isClosed ? '#94A3B8' : '#0369A1'}" text-anchor="middle">${isClosed ? '休' : d.value}</text>`;
    bars += `<text x="${x + barW / 2}" y="${h - pad + 16}" font-size="11" fill="#64748B" text-anchor="middle">${d.label}</text>`;
  });

  document.getElementById('bar-chart').innerHTML = `
    <svg viewBox="0 0 ${w} ${h}" style="width:100%; height: auto">
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0EA5E9"/>
          <stop offset="100%" stop-color="#6366F1"/>
        </linearGradient>
      </defs>
      ${bars}
    </svg>
  `;
}

// ===== ドーナツチャート =====
function renderDonut() {
  // メニュー別予約集計
  const counts = {};
  RESERVATIONS.filter(r => r.status !== 'cancelled').forEach(r => {
    counts[r.menu_id] = (counts[r.menu_id] || 0) + 1;
  });
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const slices = Object.entries(counts).map(([id, n]) => ({
    menu: getMenu(id),
    count: n,
    ratio: n / total,
  })).sort((a, b) => b.count - a.count);

  // 色マッピング
  const colorMap = {
    sky: '#0EA5E9', emerald: '#10B981', violet: '#8B5CF6',
    rose: '#F43F5E', amber: '#F59E0B', indigo: '#6366F1',
  };

  const r = 60, R = 90, cx = 100, cy = 100;
  let cum = 0;
  let paths = '';
  slices.forEach(s => {
    const startAngle = cum * Math.PI * 2 - Math.PI / 2;
    cum += s.ratio;
    const endAngle = cum * Math.PI * 2 - Math.PI / 2;
    const large = s.ratio > 0.5 ? 1 : 0;
    const x1 = cx + R * Math.cos(startAngle);
    const y1 = cy + R * Math.sin(startAngle);
    const x2 = cx + R * Math.cos(endAngle);
    const y2 = cy + R * Math.sin(endAngle);
    const x3 = cx + r * Math.cos(endAngle);
    const y3 = cy + r * Math.sin(endAngle);
    const x4 = cx + r * Math.cos(startAngle);
    const y4 = cy + r * Math.sin(startAngle);
    const fill = colorMap[s.menu.color] || '#0EA5E9';
    paths += `<path d="M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${r} ${r} 0 ${large} 0 ${x4} ${y4} Z" fill="${fill}"/>`;
  });

  document.getElementById('donut-chart').innerHTML = `
    <svg viewBox="0 0 200 200" width="180" height="180">
      ${paths}
      <text x="100" y="95" text-anchor="middle" font-size="13" fill="#64748B">合計</text>
      <text x="100" y="118" text-anchor="middle" font-size="22" font-weight="800" fill="#0F172A">${total}件</text>
    </svg>
  `;

  document.getElementById('donut-legend').innerHTML = slices.map(s => `
    <div class="donut-legend-row">
      <span><span class="legend-dot" style="background:${colorMap[s.menu.color]}"></span>${s.menu.name}</span>
      <span class="font-semibold">${(s.ratio * 100).toFixed(0)}%</span>
    </div>
  `).join('');
}

// ===== 人気時間帯 =====
function renderPopularTimes() {
  const times = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];
  const values = [4, 9, 7, 6, 12, 10, 5]; // ダミー(視覚的バランス重視)
  const max = Math.max(...values);

  document.getElementById('time-popular').innerHTML = times.map((t, i) => `
    <div class="bar-row">
      <div class="font-semibold">${t}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${(values[i] / max * 100).toFixed(0)}%"></div></div>
      <div class="font-semibold text-right">${values[i]}件</div>
    </div>
  `).join('');
}

// ===== トップ顧客 =====
function renderTopCustomers() {
  const customers = buildCustomers()
    .sort((a, b) => b.visits - a.visits || b.total_spent - a.total_spent)
    .slice(0, 5);

  document.getElementById('top-customers').innerHTML = customers.map((c, i) => {
    const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
    return `
      <div class="top-list-row">
        <div class="rank-badge ${rankClass}">${i + 1}</div>
        <div class="avatar" style="width:38px;height:38px">${c.name.charAt(0)}</div>
        <div style="flex:1">
          <div class="font-semibold">${c.name}</div>
          <div class="text-xs muted">${c.kana} · <span class="badge badge-${TAG_COLOR[c.tag]}">${c.tag}</span></div>
        </div>
        <div style="text-align:right">
          <div class="font-bold">${c.visits}回</div>
          <div class="text-xs muted">¥${c.total_spent.toLocaleString()}</div>
        </div>
      </div>
    `;
  }).join('');
}

window.addEventListener('DOMContentLoaded', () => {
  renderKPIs();
  renderLineChart();
  renderBarChart();
  renderDonut();
  renderPopularTimes();
  renderTopCustomers();
  if (window.lucide) lucide.createIcons();
});
