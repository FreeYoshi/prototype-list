// ============================================
// さくら歯科クリニック - 予約管理システム デモデータ
// ============================================

const CLINIC = {
  name: "さくら歯科クリニック",
  tagline: "やさしい歯医者さん",
  address: "東京都渋谷区桜丘町1-2-3",
  phone: "03-1234-5678",
  hero_image: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1200&q=80",
  logo_color: "#0EA5E9",
};

// 診療メニュー
const MENUS = [
  {
    id: "m1",
    name: "一般診療",
    description: "むし歯・歯周病など、お口のお悩みを幅広く診察します",
    duration: 30,
    price: 3000,
    icon: "tooth",
    color: "sky",
  },
  {
    id: "m2",
    name: "定期検診・クリーニング",
    description: "お口の健康維持に。3か月に1度がおすすめ",
    duration: 60,
    price: 5000,
    icon: "sparkles",
    color: "emerald",
    popular: true,
  },
  {
    id: "m3",
    name: "ホワイトニング",
    description: "白く透明感のある歯へ。施術は1時間半",
    duration: 90,
    price: 15000,
    icon: "gem",
    color: "violet",
  },
  {
    id: "m4",
    name: "矯正相談(無料)",
    description: "歯並びのお悩みを専門医がカウンセリング",
    duration: 45,
    price: 0,
    icon: "smile",
    color: "rose",
  },
  {
    id: "m5",
    name: "小児歯科",
    description: "お子さま専用。優しく丁寧に診療します",
    duration: 30,
    price: 3000,
    icon: "baby",
    color: "amber",
  },
  {
    id: "m6",
    name: "インプラント相談(無料)",
    description: "失った歯を取り戻すご相談はこちら",
    duration: 60,
    price: 0,
    icon: "wrench",
    color: "indigo",
  },
];

// スタッフ
const STAFF = [
  {
    id: "s1",
    name: "山田 健一",
    role: "院長",
    avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&q=80",
    bio: "臨床経験20年。患者さま一人ひとりに寄り添う診療を心がけています。",
  },
  {
    id: "s2",
    name: "佐藤 美咲",
    role: "歯科医師",
    avatar: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=200&q=80",
    bio: "小児歯科専門。お子さまが楽しく通える歯医者さんを目指しています。",
  },
];

// 営業時間
const BUSINESS_HOURS = {
  // 0=日, 1=月, ..., 6=土
  0: null,                                    // 日曜休診
  1: { open: "09:00", close: "18:00" },
  2: { open: "09:00", close: "18:00" },
  3: null,                                    // 水曜休診
  4: { open: "09:00", close: "18:00" },
  5: { open: "09:00", close: "18:00" },
  6: { open: "09:00", close: "17:00" },       // 土曜
};

// 予約データ(管理画面用)
const RESERVATIONS = [
  {
    id: "r001", name: "田中 美香", kana: "タナカ ミカ", phone: "090-1234-5678",
    menu_id: "m2", date: "2026-05-25", time: "10:00", status: "confirmed",
    payment: "オンライン決済済", note: "", created_at: "2026-05-20 14:32",
  },
  {
    id: "r002", name: "鈴木 健太郎", kana: "スズキ ケンタロウ", phone: "080-2345-6789",
    menu_id: "m1", date: "2026-05-25", time: "11:00", status: "confirmed",
    payment: "現地払い", note: "右下奥歯が痛みます", created_at: "2026-05-22 09:15",
  },
  {
    id: "r003", name: "高橋 さくら", kana: "タカハシ サクラ", phone: "090-3456-7890",
    menu_id: "m3", date: "2026-05-25", time: "14:00", status: "confirmed",
    payment: "オンライン決済済", note: "", created_at: "2026-05-18 19:45",
  },
  {
    id: "r004", name: "山本 大輔", kana: "ヤマモト ダイスケ", phone: "080-4567-8901",
    menu_id: "m4", date: "2026-05-25", time: "15:30", status: "pending",
    payment: "未払い", note: "出っ歯が気になります", created_at: "2026-05-24 22:10",
  },
  {
    id: "r005", name: "渡辺 ゆい", kana: "ワタナベ ユイ", phone: "090-5678-9012",
    menu_id: "m2", date: "2026-05-26", time: "09:30", status: "confirmed",
    payment: "オンライン決済済", note: "", created_at: "2026-05-21 11:23",
  },
  {
    id: "r006", name: "伊藤 翔太", kana: "イトウ ショウタ", phone: "080-6789-0123",
    menu_id: "m5", date: "2026-05-26", time: "10:30", status: "confirmed",
    payment: "現地払い", note: "5歳の子供の検診です", created_at: "2026-05-23 16:50",
  },
  {
    id: "r007", name: "中村 亜希", kana: "ナカムラ アキ", phone: "090-7890-1234",
    menu_id: "m1", date: "2026-05-26", time: "14:00", status: "cancelled",
    payment: "返金済", note: "急用のためキャンセル", created_at: "2026-05-19 08:12",
  },
  {
    id: "r008", name: "小林 慎吾", kana: "コバヤシ シンゴ", phone: "080-8901-2345",
    menu_id: "m6", date: "2026-05-27", time: "11:00", status: "confirmed",
    payment: "現地払い", note: "", created_at: "2026-05-22 13:30",
  },
  {
    id: "r009", name: "加藤 真奈美", kana: "カトウ マナミ", phone: "090-9012-3456",
    menu_id: "m2", date: "2026-05-27", time: "15:00", status: "confirmed",
    payment: "オンライン決済済", note: "", created_at: "2026-05-25 10:05",
  },
  {
    id: "r010", name: "吉田 隆", kana: "ヨシダ タカシ", phone: "080-0123-4567",
    menu_id: "m1", date: "2026-05-28", time: "10:00", status: "confirmed",
    payment: "現地払い", note: "", created_at: "2026-05-24 17:48",
  },
  {
    id: "r011", name: "松本 桃子", kana: "マツモト モモコ", phone: "090-1122-3344",
    menu_id: "m3", date: "2026-05-28", time: "13:30", status: "confirmed",
    payment: "オンライン決済済", note: "結婚式前にきれいにしたいです", created_at: "2026-05-15 21:00",
  },
  {
    id: "r012", name: "井上 雄太", kana: "イノウエ ユウタ", phone: "080-2233-4455",
    menu_id: "m2", date: "2026-05-29", time: "09:00", status: "confirmed",
    payment: "現地払い", note: "", created_at: "2026-05-24 12:15",
  },
];

// 顧客メモ・タグ(電話番号で紐づけ)
const CUSTOMER_NOTES = {
  "090-1234-5678": { tag: "VIP", memo: "ホワイトニングご希望。前回満足度高。" },
  "080-2345-6789": { tag: "リピーター", memo: "右下奥歯の経過観察中" },
  "090-3456-7890": { tag: "VIP", memo: "結婚式の前に再来予定" },
  "080-4567-8901": { tag: "新規", memo: "" },
  "090-5678-9012": { tag: "リピーター", memo: "3か月ごとの定期検診" },
  "080-6789-0123": { tag: "新規", memo: "息子さん同伴。怖がりやすい" },
  "090-7890-1234": { tag: "リピーター", memo: "" },
  "080-8901-2345": { tag: "新規", memo: "インプラント検討中" },
  "090-9012-3456": { tag: "リピーター", memo: "" },
  "080-0123-4567": { tag: "リピーター", memo: "" },
  "090-1122-3344": { tag: "VIP", memo: "リピート率高。ホワイトニング2回目" },
  "080-2233-4455": { tag: "リピーター", memo: "" },
};

// 顧客集約: 予約データから生成
function buildCustomers() {
  const map = new Map();
  RESERVATIONS.forEach(r => {
    const key = r.phone;
    if (!map.has(key)) {
      map.set(key, {
        phone: r.phone,
        name: r.name,
        kana: r.kana,
        visits: 0,
        last_visit: "",
        first_visit: "",
        total_spent: 0,
        menus: {},
        reservations: [],
      });
    }
    const c = map.get(key);
    if (r.status !== "cancelled") {
      c.visits++;
      const price = getMenu(r.menu_id)?.price || 0;
      c.total_spent += price;
      c.menus[r.menu_id] = (c.menus[r.menu_id] || 0) + 1;
      if (!c.last_visit || r.date > c.last_visit) c.last_visit = r.date;
      if (!c.first_visit || r.date < c.first_visit) c.first_visit = r.date;
    }
    c.reservations.push(r);
  });
  return Array.from(map.values()).map(c => ({
    ...c,
    note: CUSTOMER_NOTES[c.phone]?.memo || "",
    tag: CUSTOMER_NOTES[c.phone]?.tag || (c.visits >= 3 ? "リピーター" : "新規"),
    favorite_menu: Object.entries(c.menus).sort((a, b) => b[1] - a[1])[0]?.[0] || null,
  }));
}

const TAG_COLOR = {
  "VIP":       "violet",
  "リピーター": "emerald",
  "新規":      "sky",
};

// 月別売上(レポート用ダミー)
const MONTHLY_REVENUE = [
  { month: "1月", revenue: 480000, count: 96 },
  { month: "2月", revenue: 520000, count: 104 },
  { month: "3月", revenue: 610000, count: 118 },
  { month: "4月", revenue: 580000, count: 112 },
  { month: "5月", revenue: 690000, count: 132 },
  { month: "6月", revenue: 740000, count: 138 },
];

// 休業日・休業時間枠
const CLOSURES = [
  { id: "c1", date: "2026-06-03", type: "fullday", time_start: null, time_end: null, reason: "院内研修", created_at: "2026-05-10" },
  { id: "c2", date: "2026-06-10", type: "slot", time_start: "13:00", time_end: "15:00", reason: "学会出席", created_at: "2026-05-12" },
  { id: "c3", date: "2026-06-15", type: "fullday", time_start: null, time_end: null, reason: "設備点検", created_at: "2026-05-15" },
  { id: "c4", date: "2026-05-30", type: "slot", time_start: "16:00", time_end: "17:00", reason: "メンテナンス", created_at: "2026-05-20" },
];

// ユーティリティ: メニューID → メニュー
function getMenu(id) {
  return MENUS.find(m => m.id === id);
}

// ユーティリティ: 日付フォーマット
function fmtDate(dateStr) {
  const d = new Date(dateStr);
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return `${d.getMonth() + 1}/${d.getDate()}(${days[d.getDay()]})`;
}

function fmtDateLong(dateStr) {
  const d = new Date(dateStr);
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日(${days[d.getDay()]})`;
}

// 時間枠を生成(30分刻み)
function generateTimeSlots(dateStr) {
  const d = new Date(dateStr);
  const hours = BUSINESS_HOURS[d.getDay()];
  if (!hours) return [];

  const slots = [];
  const [oh, om] = hours.open.split(':').map(Number);
  const [ch, cm] = hours.close.split(':').map(Number);
  const start = oh * 60 + om;
  const end = ch * 60 + cm;

  for (let t = start; t < end; t += 30) {
    const h = Math.floor(t / 60);
    const m = t % 60;
    const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    // 休憩時間(12:00-14:00)はスキップ
    if (h >= 12 && h < 14) continue;
    slots.push(time);
  }
  return slots;
}

// 既存予約と休業を考慮して空きスロットを判定
function isSlotAvailable(dateStr, time) {
  // 休業判定
  for (const c of CLOSURES) {
    if (c.date !== dateStr) continue;
    if (c.type === "fullday") return false;
    if (c.type === "slot") {
      if (time >= c.time_start && time < c.time_end) return false;
    }
  }
  // 予約被り判定
  const taken = RESERVATIONS.some(r =>
    r.date === dateStr && r.time === time && r.status !== "cancelled"
  );
  return !taken;
}

// 状態ラベル
const STATUS_LABEL = {
  confirmed: { text: "確定", color: "emerald" },
  pending:   { text: "未確認", color: "amber" },
  cancelled: { text: "キャンセル", color: "slate" },
  completed: { text: "完了", color: "blue" },
};
