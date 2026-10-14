// ============================================================
//  共通ロジック（公開ページ・管理画面の両方で使用）
// ============================================================
(function () {
  const TYPES = {
    closed:    { label: "全面通行止め", short: "通行止め", color: "#c1121f", icon: "⛔" },
    alternate: { label: "片側交互通行", short: "片側交互", color: "#e85d04", icon: "🚧" },
    lane:      { label: "車線規制",     short: "車線規制", color: "#b08900", icon: "🚧" },
    other:     { label: "その他の規制", short: "その他",   color: "#52606d", icon: "⚠️" }
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
    workDays, periodText, timeText, offText, sortWorks, geomLatLngs, dayRows, esc, telLink, TILE_URL, TILE_ATTR };
})();
