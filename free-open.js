/* 全機能無料公開（〜2026-12-31）と先行ユーザーの判定
   設計：30_アプリ開発/筋トレメモアプリ/2026-10-30_設計_1か月無料公開.md
   ここは state を直接さわらない。引数だけで答えを決める（Nodeでテストするため）。 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.FreeOpen = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const FREE_OPEN_END_MS = new Date(2027, 0, 1).getTime(); // 2026-12-31 23:59:59（端末の現地時刻）までが期間
  const FREE_OPEN_END_DATE = "2026-12-31"; // tsを持たない記録（体重・計測・古い記録）はこの日付以下なら期間内
  const SALE_STARTED = false; // BOOTHで販売を始める版だけ true にする

  function inPeriod(e, endMs, endDate) {
    if (!e) return false;
    if (typeof e.ts === "number") return e.ts < endMs; // dateは利用者が選べるので、保存した瞬間の時刻を優先
    return typeof e.date === "string" && e.date <= endDate;
  }

  function hasEntryBefore(s, endMs, endDate) {
    return ["records", "cardio", "body", "bodyMeasure"].some((k) =>
      (s[k] || []).some((e) => inPeriod(e, endMs, endDate))
    );
  }

  function isFoundingState(s, endMs, endDate) {
    return !!(s.settings && s.settings.foundingMember === true) || hasEntryBefore(s, endMs, endDate);
  }

  // 期間中に記録があれば印を残す（あとで記録を全部消しても先行ユーザーのまま。印はバックアップで引き継がれる）
  function markFoundingIfEligible(s, nowMs) {
    if (nowMs >= FREE_OPEN_END_MS) return;
    if (!hasEntryBefore(s, FREE_OPEN_END_MS, FREE_OPEN_END_DATE)) return;
    s.settings = s.settings || {};
    s.settings.foundingMember = true;
  }

  function freeOpenPhase(nowMs, saleStarted, endMs) {
    if (saleStarted) return "sale";
    return nowMs < endMs ? "open" : "ended";
  }

  // 先行ユーザーは最上位の段階として扱う。今後新しい有料段階を足すときも、ここで最上位を返すこと（約束：販売後の新機能も無料）
  function effectiveTier(stored, founding, saleStarted) {
    if (founding || !saleStarted) return "premium";
    return stored;
  }

  return { FREE_OPEN_END_MS, FREE_OPEN_END_DATE, SALE_STARTED, hasEntryBefore, isFoundingState, markFoundingIfEligible, freeOpenPhase, effectiveTier };
});
