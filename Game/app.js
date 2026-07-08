/* =============================================================
   PlotGuard - アプリ本体（APIなし・全てローカル処理）
   ============================================================= */
(function () {
  "use strict";

  const D = window.DATA;
  const $ = (id) => document.getElementById(id);

  const editor = $("editor");
  const backdrop = $("backdrop");
  const warnList = $("warnList");
  const charList = $("charList");
  const scanning = $("scanning");

  let currentWarnings = []; // 現在表示中の警告（apply/ignore で参照）
  const ignored = new Set(); // 無視したルールID
  let scanTimer = null;

  /* ---------- ユーティリティ ---------- */
  function escapeHtml(s) {
    return s.replace(/[&<>"]/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])
    );
  }
  function charById(id) {
    return D.characters.find((c) => c.id === id);
  }
  function parseChapter(text) {
    const m = text.match(/第\s*(\d+)\s*章/);
    return m ? parseInt(m[1], 10) : null;
  }

  /* ---------- 解析エンジン ---------- */
  function analyze(text) {
    const chapter = parseChapter(text);
    const warnings = [];

    for (const rule of D.rules) {
      if (ignored.has(rule.id)) continue;
      if (rule.whenChapterAtMost != null) {
        if (chapter == null || chapter > rule.whenChapterAtMost) continue;
      }
      const re = new RegExp(rule.find, "g");
      const m = re.exec(text); // 各ルール最初の1件
      if (!m) continue;

      const ch = charById(rule.charId);
      warnings.push({
        rule,
        char: ch,
        type: rule.type,
        typeLabel: rule.typeLabel,
        message: rule.message
          ? rule.message.replace("{chapter}", chapter != null ? chapter : "?")
          : "",
        manual: rule.manual || null,
        suggestion: rule.suggestion || null,
        matched: m[0],
        start: m.index,
        end: m.index + m[0].length
      });
    }
    warnings.sort((a, b) => a.start - b.start);
    return warnings;
  }

  /* ---------- ハイライト描画（backdrop） ---------- */
  function renderHighlights(text, warnings) {
    let html = "";
    let cursor = 0;
    let lastEnd = -1;
    warnings.forEach((w, i) => {
      if (w.start < lastEnd) return; // 重なりはスキップ
      html += escapeHtml(text.slice(cursor, w.start));
      html +=
        '<mark data-wid="' + i + '">' + escapeHtml(text.slice(w.start, w.end)) + "</mark>";
      cursor = w.end;
      lastEnd = w.end;
    });
    html += escapeHtml(text.slice(cursor));
    backdrop.innerHTML = html + "\n"; // 末尾改行の高さ確保
  }

  /* ---------- スコア＆統計 ---------- */
  function updateScore(warnings) {
    const score = Math.max(0, 100 - warnings.length * 8);
    $("scoreNum").textContent = score;

    const circ = 2 * Math.PI * 33; // ≒207
    const arc = $("gaugeArc");
    arc.setAttribute("stroke-dashoffset", (circ * (1 - score / 100)).toFixed(1));
    const color = score >= 90 ? "#46d39a" : score >= 65 ? "#ffb454" : "#ff6b8a";
    arc.setAttribute("stroke", color);

    const state =
      warnings.length === 0
        ? "問題なし ✓"
        : warnings.length + " 件の矛盾を検出";
    $("scoreState").textContent = state;
    $("scoreState").style.color = warnings.length === 0 ? "#46d39a" : color;

    $("cntTimeline").textContent = warnings.filter((w) => w.type === "timeline").length;
    $("cntPersonality").textContent = warnings.filter((w) => w.type === "personality").length;
    $("cntSetting").textContent = warnings.filter((w) => w.type === "setting").length;
  }

  /* ---------- 警告カード描画 ---------- */
  const TYPE_ICON = { timeline: "⏳", personality: "🎭", setting: "📌" };

  function renderWarnings(warnings) {
    warnList.innerHTML = "";
    if (warnings.length === 0) {
      warnList.innerHTML =
        '<div class="empty"><div class="big">✨</div>矛盾は見つかりませんでした。<br>このまま執筆を続けられます。</div>';
      return;
    }
    warnings.forEach((w, i) => {
      const card = document.createElement("div");
      card.className = "warn-card " + w.type;
      card.dataset.wid = i;

      let actions, hint;
      if (w.suggestion && w.suggestion.with != null) {
        actions =
          '<button class="btn primary tiny" data-act="fix" data-wid="' + i + '">修正を適用</button>' +
          '<button class="btn ghost tiny" data-act="ignore" data-wid="' + i + '">無視</button>';
        hint = '<div class="fix-hint">💡 ' + escapeHtml(w.suggestion.label) + "</div>";
      } else {
        actions =
          '<button class="btn ghost tiny" data-act="ignore" data-wid="' + i + '">確認済みにする</button>';
        hint = '<div class="manual-hint">🔧 ' + escapeHtml(w.manual || "手動で確認してください") + "</div>";
      }

      card.innerHTML =
        '<div class="warn-top">' +
          '<span class="warn-badge ' + w.type + '">' + TYPE_ICON[w.type] + " " + escapeHtml(w.typeLabel) + "</span>" +
          '<span class="warn-char">' + (w.char ? escapeHtml(w.char.name) : "") + "</span>" +
        "</div>" +
        '<div class="warn-quote">「' + escapeHtml(w.matched) + "」</div>" +
        '<div class="warn-msg">' + escapeHtml(w.message) + "</div>" +
        hint +
        '<div class="warn-actions">' + actions + "</div>";

      // カードクリックで該当ハイライトへフォーカス
      card.addEventListener("click", (e) => {
        if (e.target.closest("button")) return;
        focusHighlight(i);
      });
      warnList.appendChild(card);
    });
  }

  function focusHighlight(wid) {
    backdrop.querySelectorAll("mark.focus").forEach((m) => m.classList.remove("focus"));
    const mark = backdrop.querySelector('mark[data-wid="' + wid + '"]');
    if (mark) {
      mark.classList.add("focus");
      backdrop.scrollTop = Math.max(0, mark.offsetTop - backdrop.clientHeight / 2);
      editor.scrollTop = backdrop.scrollTop;
    }
  }

  /* ---------- メイン解析実行 ---------- */
  function runAnalyze() {
    const text = editor.value;
    currentWarnings = analyze(text);
    renderHighlights(text, currentWarnings);
    updateScore(currentWarnings);
    renderWarnings(currentWarnings);
    syncScroll();
  }

  // 入力時：解析中アニメ→結果
  function scheduleAnalyze() {
    scanning.classList.add("on");
    if (scanTimer) clearTimeout(scanTimer);
    scanTimer = setTimeout(() => {
      runAnalyze();
      scanning.classList.remove("on");
    }, 550);
  }

  /* ---------- 修正適用 / 無視 ---------- */
  function applyFix(w) {
    const text = editor.value;
    editor.value = text.slice(0, w.start) + w.suggestion.with + text.slice(w.end);
    runAnalyze();
    toast("修正を適用しました ✓");
  }

  warnList.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-act]");
    if (!btn) return;
    const w = currentWarnings[parseInt(btn.dataset.wid, 10)];
    if (!w) return;
    if (btn.dataset.act === "fix") {
      applyFix(w);
    } else if (btn.dataset.act === "ignore") {
      ignored.add(w.rule.id);
      runAnalyze();
      toast("この指摘を非表示にしました");
    }
  });

  /* ---------- スクロール同期 ---------- */
  function syncScroll() {
    backdrop.scrollTop = editor.scrollTop;
    backdrop.scrollLeft = editor.scrollLeft;
  }
  editor.addEventListener("scroll", syncScroll);
  editor.addEventListener("input", scheduleAnalyze);

  /* ---------- キャラクターDB描画 ---------- */
  function renderChars() {
    charList.innerHTML = "";
    D.characters.forEach((c) => {
      const card = document.createElement("div");
      card.className = "char-card";
      const facts = c.facts
        .map(
          (f) =>
            '<div class="fact"><span class="ico">' + f.icon + "</span>" +
            '<span class="flabel">' + escapeHtml(f.label) + "</span>" +
            '<span class="fval">' + escapeHtml(f.value) + "</span></div>"
        )
        .join("");
      card.innerHTML =
        '<div class="char-head">' +
          '<div class="avatar" style="background:linear-gradient(135deg,' + c.color + "," + c.color2 + ')">' +
            escapeHtml(c.name.charAt(0)) +
          "</div>" +
          "<div>" +
            '<div class="char-name">' + escapeHtml(c.name) +
              (c.reading ? '<span class="read">' + escapeHtml(c.reading) + "</span>" : "") +
            "</div>" +
            '<div class="char-role">' + escapeHtml(c.role) + "</div>" +
          "</div>" +
        "</div>" +
        '<div class="facts">' + facts + "</div>";
      charList.appendChild(card);
    });
  }

  /* ---------- 新規キャラ登録モーダル ---------- */
  const overlay = $("overlay");
  $("addCharBtn").addEventListener("click", () => overlay.classList.add("on"));
  $("cancelChar").addEventListener("click", () => overlay.classList.remove("on"));
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.classList.remove("on");
  });

  const PALETTE = [
    ["#ffd27e", "#ff9d3d"], ["#9d7eff", "#6e3dff"],
    ["#7effd2", "#13b8a0"], ["#ff7e9d", "#ff3d6e"]
  ];

  $("saveChar").addEventListener("click", () => {
    const name = $("fName").value.trim();
    if (!name) {
      toast("キャラクター名を入力してください");
      return;
    }
    const role = $("fRole").value.trim() || "登録キャラクター";
    const factStrs = $("fFacts").value.split(/[,、]/).map((s) => s.trim()).filter(Boolean);
    const ngWords = $("fNg").value.split(/[,、]/).map((s) => s.trim()).filter(Boolean);

    const id = "c" + D.characters.length + "_" + name;
    const pal = PALETTE[D.characters.length % PALETTE.length];
    D.characters.push({
      id: id,
      name: name,
      reading: "",
      role: role,
      color: pal[0],
      color2: pal[1],
      facts: factStrs.length
        ? factStrs.map((v) => ({ icon: "•", label: "設定", value: v }))
        : [{ icon: "•", label: "設定", value: "（基本設定なし）" }]
    });

    // NGワードから口調の矛盾ルールを自動生成
    ngWords.forEach((w, idx) => {
      D.rules.push({
        id: id + "-ng" + idx,
        charId: id,
        type: "personality",
        typeLabel: "性格・口調の矛盾",
        find: w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        message: name + " の口調設定と矛盾する可能性のある表現「" + w + "」が使われています。",
        manual: "キャラクターの口調・性格に合った表現か確認してください。"
      });
    });

    overlay.classList.remove("on");
    ["fName", "fRole", "fFacts", "fNg"].forEach((i) => ($(i).value = ""));
    renderChars();
    runAnalyze();
    toast(name + " をDBに登録しました ✓");
  });

  /* ---------- トースト ---------- */
  function toast(msg) {
    const wrap = $("toastWrap");
    const t = document.createElement("div");
    t.className = "toast";
    t.innerHTML = '<span class="ic">●</span>' + escapeHtml(msg);
    wrap.appendChild(t);
    setTimeout(() => {
      t.style.transition = ".3s";
      t.style.opacity = "0";
      t.style.transform = "translateY(10px)";
      setTimeout(() => t.remove(), 300);
    }, 2200);
  }

  /* ---------- 初期化 ---------- */
  renderChars();
  editor.value = D.sampleText;
  runAnalyze();
})();
