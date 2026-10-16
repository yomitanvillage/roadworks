// ============================================================
//  読谷村 道路工事・交通規制マップ　共通設定
//  ※ firebaseConfig.apiKey が空のあいだは「デモモード」で動きます
//    （データはこのブラウザ内だけに保存され、外部には送信されません）
// ============================================================
window.RW_CONFIG = {
  firebaseConfig: {
  apiKey: "AIzaSyC7oWUTOGv4UNhel-qNvVW4KX3iNCjTyXw",
  authDomain: "roadworks-88b69.firebaseapp.com",
  databaseURL: "https://roadworks-88b69-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "roadworks-88b69",
  storageBucket: "roadworks-88b69.firebasestorage.app",
  messagingSenderId: "421321521445",
  appId: "1:421321521445:web:2cd8bcfd2abc63762482cc",
  measurementId: "G-TELVYHCW8B"
  },

  // 担当課（管理画面の選択肢・表示に使用）
  depts: ["都市計画課", "土木建築課", "上下水道課", "その他"],

  // 発注者
  orderers: ["読谷村", "沖縄県企業局", "沖縄県", "国", "その他"],

  // 地図の初期表示（読谷村役場付近）
  center: [26.3962, 127.7445],
  zoom: 14,

  // 公開ページ下部のリンク・問い合わせ先
  officialUrl: "https://www.vill.yomitan.okinawa.jp/kurashi/doro_kotsu/7239.html",
  contactText: "読谷村役場 都市計画課　098-982-9220",

  // 試行運用中の表示（本番接続中でも出る）。正式運用になったら "" にすると消えます
  trialBadge: "試行版",
  trialNotice: "試行運用中です。正式な情報は村公式ホームページをご確認ください"
};
window.RW_CONFIG.demo = !window.RW_CONFIG.firebaseConfig.apiKey;
