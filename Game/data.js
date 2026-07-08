/* =============================================================
   PlotGuard - 仮データ（JSON相当のハードコーディング）
   - characters : 登録済みキャラクターDB
   - rules      : 矛盾検出ルール（プロトタイプ用ルールエンジン）
   - sampleText : 解析デモ用のサンプル原稿（わざと矛盾を仕込んでいる）
   ============================================================= */
window.DATA = {
  /* ---------- キャラクターDB（STEP1で登録した想定） ---------- */
  characters: [
    {
      id: "miu",
      name: "太郎",
      reading: "Taro",
      role: "主人公 / 高校2年生",
      color: "#ff7eb6",
      color2: "#ff3d81",
      facts: [
        { icon: "📍", label: "居住地", value: "東京（第4章まで）→ 京都（第5章〜）" },
        { icon: "✋", label: "利き手", value: "左利き" },
        { icon: "🐱", label: "体質", value: "猫アレルギー" },
        { icon: "🍵", label: "好み", value: "紅茶党（コーヒーは飲まない）" }
      ]
    },
    {
      id: "tianxing",
      name: "ハナコ",
      reading: "Hanako",
      role: "留学生 / 太郎のクラスメイト",
      color: "#7c9bff",
      color2: "#3d5bff",
      facts: [
        { icon: "🗣️", label: "口調", value: "常に丁寧な敬語。タメ口は使わない" },
        { icon: "🤝", label: "関係", value: "太郎との初対面は第5章（京都）" },
        { icon: "📚", label: "性格", value: "生真面目・成績優秀・人見知り" }
      ]
    },
    {
      id: "ren",
      name: "ジロウ",
      reading: "Jiro",
      role: "太郎の幼馴染",
      color: "#5fd6b4",
      color2: "#13b890",
      facts: [
        { icon: "🏠", label: "関係", value: "太郎とは幼稚園からの幼馴染" },
        { icon: "⚽", label: "性格", value: "明るくお調子者・運動部" }
      ]
    }
  ],

  /* ---------- 矛盾検出ルール ---------- */
  /* find : 原稿内で検出する文字列（正規表現ソース）
     type : timeline(時系列) / personality(性格) / setting(設定)
     whenChapterAtMost : この章番号以下のシーンでのみ警告
     suggestion.with   : 自動修正で置き換える文字列（無い場合は手動対応）   */
  rules: [
    {
      id: "miu-location",
      charId: "miu",
      type: "timeline",
      typeLabel: "時系列の矛盾",
      find: "京都",
      whenChapterAtMost: 4,
      message:
        "この時間軸（第{chapter}章）では、太郎はまだ東京にいるはずです。京都への転居は第5章の設定です。",
      suggestion: { label: "「京都」→「東京」に修正", with: "東京" }
    },
    {
      id: "miu-hand",
      charId: "miu",
      type: "setting",
      typeLabel: "設定の矛盾",
      find: "右手",
      message:
        "太郎は『左利き』の設定です。利き手で動作する描写は左手が自然です。",
      suggestion: { label: "「右手」→「左手」に修正", with: "左手" }
    },
    {
      id: "miu-cat",
      charId: "miu",
      type: "setting",
      typeLabel: "設定の矛盾",
      find: "子猫",
      message:
        "太郎は『猫アレルギー』の設定です。猫を抱き上げる描写は体質設定と矛盾します。",
      suggestion: { label: "「子猫」→「子犬」に修正", with: "子犬" }
    },
    {
      id: "tianxing-tone",
      charId: "tianxing",
      type: "personality",
      typeLabel: "性格・口調の矛盾",
      find: "あー、それ簡単じゃん。こうやんだよ",
      message:
        "ハナコは『常に敬語』のキャラクターです。タメ口のセリフは口調設定と矛盾します。",
      suggestion: {
        label: "敬語のセリフに修正",
        with: "ええと、それは簡単ですよ。こうやるんです"
      }
    },
    {
      id: "tianxing-meet",
      charId: "tianxing",
      type: "timeline",
      typeLabel: "時系列（人間関係）の矛盾",
      find: "ハナコ",
      whenChapterAtMost: 4,
      message:
        "太郎とハナコの初対面は第5章（京都）の設定です。第{chapter}章の時点では二人はまだ面識がありません。",
      manual:
        "このシーンを第5章以降へ移動するか、別キャラ（例：幼馴染のジロウ）との会話に置き換えてください。"
      /* suggestion なし＝自動修正できない例。手動確認を促す */
    }
  ],

  /* ---------- デモ用サンプル原稿（わざと矛盾入り） ---------- */
  sampleText:
`【第2章 — 東京、桜舞う放課後】

放課後の教室。太郎は京都の自宅を思い浮かべながら、窓の外をぼんやりと眺めていた。
机に置かれた紅茶を、右手でそっと口へ運ぶ。

「ねえハナコ、この数学の問題、どう解くの？」
ハナコは「あー、それ簡単じゃん。こうやんだよ」とニヤッと笑った。

足元にすり寄ってきた子猫を抱き上げ、太郎は思わず頬をゆるめた。
窓の外では、いつもと変わらない街並みが広がっている。`
};
