// ============================================================
//  デモモード用のサンプルデータ（Firebase接続後は使われません）
//  内容：2026年10月9日時点で公式HPに掲載の沖縄県企業局発注工事（日別9行＝2か所分）
//  ※ 位置はおおよそです。実運用では担当者が地図で指定します。
// ============================================================
window.RW_DEMO = {
  users: [
    { uid: "demo-toshi",  name: "都市計画課 担当者（デモ）", dept: "都市計画課", role: "editor" },
    { uid: "demo-josui",  name: "上下水道課 担当者（デモ）", dept: "上下水道課", role: "editor" },
    { uid: "demo-admin",  name: "デジタル社会推進課（デモ管理者）", dept: "その他", role: "admin" }
  ],
  works: {
    "demo-1": {
      dept: "都市計画課", orderer: "沖縄県企業局", title: "",
      road: "村道伊良皆南線", place: "読谷村字伊良皆（古堅中学校 東側）",
      type: "closed", start: "2026-10-09", end: "2026-10-13",
      timeFrom: "", timeTo: "", weekendsOff: false, skipDates: ["2026-10-11", "2026-10-12"],
      geom: { kind: "point", lat: 26.38095, lng: 127.75375 },
      contractor: "有限会社丸喜産業", contact: "098-938-3365（担当：西島本）\n沖縄県企業局 098-866-2814",
      detour: "", note: "通行止めのため混雑が予想されます。", published: true,
      createdAt: "2026-10-08T09:00:00+09:00", createdBy: "都市計画課 担当者（デモ）",
      updatedAt: "2026-10-09T09:00:00+09:00", updatedBy: "都市計画課 担当者（デモ）"
    },
    "demo-2": {
      dept: "都市計画課", orderer: "沖縄県企業局", title: "",
      road: "村道比謝牧原線", place: "読谷村字ときわ（ローソン読谷大湾店 南側）",
      type: "closed", start: "2026-10-09", end: "2026-10-16",
      timeFrom: "", timeTo: "", weekendsOff: false, skipDates: ["2026-10-11", "2026-10-12"],
      geom: { kind: "line", coords: [{ lat: 26.37862, lng: 127.75540 }, { lat: 26.37835, lng: 127.75610 }] },
      contractor: "有限会社丸喜産業", contact: "098-938-3365（担当：西島本）\n沖縄県企業局 098-866-2814",
      detour: "", note: "通行止めのため混雑が予想されます。", published: true,
      createdAt: "2026-10-08T09:00:00+09:00", createdBy: "都市計画課 担当者（デモ）",
      updatedAt: "2026-10-09T09:00:00+09:00", updatedBy: "都市計画課 担当者（デモ）"
    }
  }
};
