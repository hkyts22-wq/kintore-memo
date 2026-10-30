"use strict";

// 部位の日：前回の記録・今日の目安・夜勤明けの復元（画面に触れない純粋関数）
// index.html の関数名とぶつからないよう、中身は即時関数に閉じ込めて window.PartDay だけを出す
const PartDay = (() => {

function byTs(a, b) {
  return (a.ts || 0) - (b.ts || 0);
}

// その部位で「beforeDate より前の一番新しい日」の記録を、種目ごとにまとめて返す
function latestPartSession({ records, cardio, exercises, part, beforeDate }) {
  const ids = new Set(exercises.filter((e) => e.part === part).map((e) => e.id));   // 削除済みの種目は ids に無いので飛ばされる
  const source = part === "cardio" ? cardio : records;
  const rows = source.filter((x) => ids.has(x.exId) && x.date < beforeDate);        // 今日の記録は前回にしない
  if (!rows.length) return null;
  const date = rows.reduce((max, x) => (x.date > max ? x.date : max), rows[0].date);
  const byEx = new Map();
  rows.filter((x) => x.date === date).sort(byTs).forEach((x) => {
    if (!byEx.has(x.exId)) byEx.set(x.exId, []);
    byEx.get(x.exId).push(x);
  });
  const items = [...byEx].map(([exId, sets]) => ({ exId, sets }));   // 種目の並び＝その日の最初の記録が早い順
  return { date, items };
}

function round2(value) {
  return Math.round(value * 100) / 100;   // 7.5+2 などの小数の誤差を消す
}

function weightStep(ex) {
  if (ex.part === "legs" || ex.part === "calf") return 5;
  if (ex.equip === "dumbbell") return 2;
  return 2.5;
}

// 前回のセットから今日の目安（重量×回数）を作る。参考値なので、出せないときは null
function suggestTarget(sets, ex, isPostNight) {
  if (ex.type === "cardio" || !sets || !sets.length) return null;
  const sorted = sets.slice().sort(byTs);
  const maxWeight = Math.max(...sorted.map((s) => Number(s.weight) || 0));
  const main = sorted.filter((s) => (Number(s.weight) || 0) === maxWeight);   // 本番セット＝最大重量のセット
  const first = main[0].reps;
  const last = main[main.length - 1].reps;

  if (ex.equip === "body" && maxWeight === 0) {   // 自重のみ
    if (isPostNight) return { weight: 0, reps: first };
    return { weight: 0, reps: Math.max(...sorted.map((s) => s.reps)) + 1 };
  }
  if (isPostNight) return { weight: maxWeight, reps: first };   // 明けは前回と同じ
  if (main.length === 1) return { weight: maxWeight, reps: first };
  if (last >= first) return { weight: round2(maxWeight + weightStep(ex)), reps: first };
  return { weight: maxWeight, reps: first + 1 };   // 途中で落ちたら重量は据え置き
}

// その日に「明け」の記録があれば "明け"（筋トレ・有酸素どちらでも）
function restoreShift(records, cardio, date) {
  const hit = (x) => x.date === date && x.shift === "明け";
  return records.some(hit) || cardio.some(hit) ? "明け" : null;
}

// "YYYY-MM-DD" 2つの日数差（to - from）。UTCで数えるので時差・夏時間でずれない
function daysBetween(fromDate, toDate) {
  const toUtc = (value) => {
    const [y, m, d] = String(value).split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((toUtc(toDate) - toUtc(fromDate)) / 86400000);
}

return { latestPartSession, suggestTarget, restoreShift, daysBetween };
})();

if (typeof window !== "undefined") window.PartDay = PartDay;
if (typeof module !== "undefined") module.exports = PartDay;
