// ============================================================
//  共通ロジック（公開ページ・管理画面の両方で使用）
// ============================================================
(function () {
  const TYPES = {
    closed:    { label: "全面通行止め", short: "通行止め", color: "#c1121f", icon: "closed" },
    alternate: { label: "片側交互通行", short: "片側交互", color: "#e85d04", icon: "alternate" },
    lane:      { label: "車線規制",     short: "車線規制", color: "#b08900", icon: "lane" },
    other:     { label: "その他の規制", short: "その他",   color: "#52606d", icon: "other" }
  };
  const STATUS = {
    active:  { label: "本日 規制あり",   cls: "st-active"  },
    off:     { label: "本日は施工なし", cls: "st-off"     },
    planned: { label: "予定",           cls: "st-planned" },
    ended:   { label: "終了",           cls: "st-ended"   }
  };
  const DOW = ["日", "月", "火", "水", "木", "金", "土"];

  // 日付は "YYYY-MM-DD"（日本時間）の文字列で扱う
  function todayJST() {
    return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(new Date());
  }
  function parseD(s) { const [y, m, d] = s.split("-").map(Number); return new Date(Date.UTC(y, m - 1, d)); }
  function addDays(s, n) { const dt = parseD(s); dt.setUTCDate(dt.getUTCDate() + n); return dt.toISOString().slice(0, 10); }
  function dow(s) { return parseD(s).getUTCDay(); }
  function fmtD(s) { if (!s) return ""; const dt = parseD(s); return `${dt.getUTCMonth() + 1}月${dt.getUTCDate()}日（${DOW[dt.getUTCDay()]}）`; }
  function fmtShort(s) { const dt = parseD(s); return `${dt.getUTCMonth() + 1}/${dt.getUTCDate()}（${DOW[dt.getUTCDay()]}）`; }
  function fmtDateTime(iso) {
    if (!iso) return "";
    const dt = new Date(iso);
    return dt.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", month: "numeric", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit" });
  }

  function skipList(w) { return Array.isArray(w.skipDates) ? w.skipDates : Object.values(w.skipDates || {}); }
  function isOff(w, s) {
    return skipList(w).includes(s) || (w.weekendsOff && (dow(s) === 0 || dow(s) === 6));
  }
  function statusOf(w, today) {
    today = today || todayJST();
    if (!w.start || !w.end) return "planned";
    if (today < w.start) return "planned";
    if (today > w.end) return "ended";
    return isOff(w, today) ? "off" : "active";
  }
  // from 以降の施工日（最大 limit 件）
  function workDays(w, from, limit) {
    const res = [];
    let d = from && from > w.start ? from : w.start;
    let guard = 0;
    while (d <= w.end && res.length < (limit || 999) && guard < 800) {
      if (!isOff(w, d)) res.push(d);
      d = addDays(d, 1); guard++;
    }
    return res;
  }
  function periodText(w) {
    if (!w.start) return "";
    return w.start === w.end ? fmtD(w.start) : `${fmtD(w.start)} 〜 ${fmtD(w.end)}`;
  }
  function timeText(w) {
    if (w.timeFrom && w.timeTo) return `${w.timeFrom} 〜 ${w.timeTo}`;
    if (w.timeFrom) return `${w.timeFrom} 〜`;
    if (w.timeTo) return `〜 ${w.timeTo}`;
    return "";
  }
  function offText(w) {
    const parts = [];
    if (w.weekendsOff) parts.push("土日");
    const list = skipList(w).filter(s => s >= w.start && s <= w.end).sort();
    if (list.length) parts.push(list.map(fmtShort).join("、"));
    return parts.join("、");
  }
  function sortWorks(list, today) {
    const order = { active: 0, off: 1, planned: 2, ended: 3 };
    return list.sort((a, b) => {
      const sa = order[statusOf(a, today)], sb = order[statusOf(b, today)];
      if (sa !== sb) return sa - sb;
      return (a.start || "").localeCompare(b.start || "");
    });
  }
  function geomLatLngs(g) {
    if (!g) return [];
    if (g.kind === "point") return [[g.lat, g.lng]];
    const c = Array.isArray(g.coords) ? g.coords : Object.values(g.coords || {});
    return c.map(p => Array.isArray(p) ? p : [p.lat, p.lng]);
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function telLink(s) {
    const t = esc(s);
    return t.replace(/(0\d{1,4}-\d{1,4}-\d{3,4})/g, '<a href="tel:$1">$1</a>');
  }

  // 日別の施工予定（公開ページの日程表用）
  // 期間が31日以内なら全日程、それより長い場合は今日から14日分
  function dayRows(w, today) {
    if (!w.start || !w.end) return { rows: [], more: false };
    const total = Math.round((Date.parse(w.end) - Date.parse(w.start)) / 864e5) + 1;
    let from = w.start, limit = total;
    if (total > 31) { from = today > w.start ? today : w.start; limit = 14; }
    const rows = [];
    let d = from;
    while (d <= w.end && rows.length < limit) {
      rows.push({ date: d, work: !isOff(w, d), past: d < today, today: d === today });
      d = addDays(d, 1);
    }
    return { rows, more: d <= w.end };
  }

  // ── SVGアイコン（絵文字の代わり。色は文字色 currentColor に従う） ──
  const S = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  const ICONS = {
    cone: '<g fill="currentColor"><path d="M10.4 2.5h3.2l1.5 5.5H8.9z"/><path d="M8.4 10h7.2l1.4 5.5H7z"/><path d="M6.5 17.5h11l.6 2H5.9z"/><rect x="3" y="20" width="18" height="2.2" rx="1"/></g>',
    pin: `<g ${S}><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></g>`,
    clock: `<g ${S}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/></g>`,
    map: `<g ${S}><path d="M3 6.5l6-2.5 6 2.5 6-2.5v13.5l-6 2.5-6-2.5-6 2.5z"/><path d="M9 4v13.5M15 6.5V20"/></g>`,
    calendar: `<g ${S}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></g>`,
    route: `<g ${S}><circle cx="5.5" cy="18.5" r="2"/><circle cx="18.5" cy="5.5" r="2"/><path d="M7.5 18.5H14a3 3 0 0 0 0-6h-4a3 3 0 0 1 0-6h6.5"/></g>`,
    check: `<g ${S}><path d="M5 12.5l4.5 4.5L19 7.5"/></g>`,
    closed: `<g ${S}><circle cx="12" cy="12" r="9"/><path d="M7 12h10" stroke-width="3"/></g>`,
    alternate: `<g ${S}><path d="M8 20V5M4.5 8.5L8 5l3.5 3.5M16 4v15M12.5 15.5L16 19l3.5-3.5"/></g>`,
    lane: `<g ${S}><path d="M5 21L8 3M19 21L16 3"/><path d="M12 4v2.5M12 10v2.5M12 16v2.5"/></g>`,
    other: `<g ${S}><path d="M12 3.5l9 16H3z"/><path d="M12 10v4"/><path d="M12 17v.2" stroke-width="2.6"/></g>`
  };
  function icon(name, cls) {
    return `<svg class="ic${cls ? " " + cls : ""}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONS[name] || ""}</svg>`;
  }
  (function () {
    const st = document.createElement("style");
    st.textContent = ".ic{width:1.15em;height:1.15em;vertical-align:-0.2em;flex-shrink:0;display:inline-block}" +
      ".pin .ic{width:18px;height:18px;color:#fff;vertical-align:0}" +
      ".hic{color:#f39a3a;margin-right:4px}";
    document.head.appendChild(st);
    // HTMLに書いた <span data-ic="名前"></span> をアイコンに置き換える
    document.addEventListener("DOMContentLoaded", () => {
      document.querySelectorAll("[data-ic]").forEach(el => { el.outerHTML = icon(el.dataset.ic, el.className); });
    });
  })();

  // 地図タイル：OpenStreetMap（選挙特設サイトと同じ）
  const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
  const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors';

  // デモ版・試行版の表示
  //   ・デモモード（config.js の apiKey が空）… 自動で「デモ版」
  //   ・本番接続中 … config.js の trialBadge に文字があれば表示（空にすれば消える）
  const CFG = window.RW_CONFIG || {};
  const badgeText = CFG.demo ? "デモ版" : (CFG.trialBadge || "");
  const pillText = CFG.demo ? "デモ版・正式な情報ではありません" : (CFG.trialNotice || "");
  if (badgeText) {
    document.addEventListener("DOMContentLoaded", () => {
      document.title = "【" + badgeText + "】" + document.title;
      const st = document.createElement("style");
      st.textContent = `
        .demo-badge { display: inline-block; vertical-align: middle; margin-left: 8px; background: #ffd23f; color: #3d2e00;
          font-size: 12px; font-weight: 800; letter-spacing: .05em; padding: 3px 10px; border-radius: 20px; white-space: nowrap; }
        .demo-pill { position: fixed; left: 12px; bottom: 12px; z-index: 10000; background: #ffd23f; color: #3d2e00;
          font-size: 12px; font-weight: 800; padding: 6px 12px; border-radius: 20px; box-shadow: 0 2px 8px rgba(0,0,0,.25);
          pointer-events: none; max-width: calc(100vw - 24px); }
        body:has(#v-edit:not([hidden])) .demo-pill { bottom: 84px; }`;
      document.head.appendChild(st);
      const h1 = document.querySelector("header h1");
      if (h1) h1.insertAdjacentHTML("beforeend", '<span class="demo-badge">' + esc(badgeText) + '</span>');
      if (pillText) document.body.insertAdjacentHTML("beforeend", '<div class="demo-pill" aria-hidden="true">' + esc(pillText) + '</div>');
    });
  }

  window.RW = { TYPES, STATUS, todayJST, addDays, fmtD, fmtShort, fmtDateTime, skipList, isOff, statusOf,
    workDays, periodText, timeText, offText, sortWorks, geomLatLngs, dayRows, esc, telLink, icon, TILE_URL, TILE_ATTR };
})();
