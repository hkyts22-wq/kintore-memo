(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.HistoryEdit = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function applyHistoryEdits(targetState, oldDate, draft) {
    const newDate = String(draft.date || "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate)) return { ok: false, error: "invalid-date" };

    const strengthUpdates = [];
    for (const item of draft.strength || []) {
      const record = targetState.records.find((entry) => entry.id === item.id && entry.date === oldDate);
      const weight = Number(item.weight);
      const reps = Number(item.reps);
      if (!record || !Number.isFinite(weight) || weight < 0 || !Number.isInteger(reps) || reps <= 0) {
        return { ok: false, error: "invalid-strength" };
      }
      strengthUpdates.push({ record, weight, reps, comment: String(item.comment || "").trim() });
    }

    const cardioUpdates = [];
    for (const item of draft.cardio || []) {
      const record = targetState.cardio.find((entry) => entry.id === item.id && entry.date === oldDate);
      const distance = Number(item.distance);
      const durMin = Number(item.durMin);
      if (!record || !Number.isFinite(distance) || distance <= 0 || !Number.isFinite(durMin) || durMin <= 0) {
        return { ok: false, error: "invalid-cardio" };
      }
      cardioUpdates.push({ record, distance, durSec: durMin * 60, comment: String(item.comment || "").trim() });
    }

    const condition = draft.condition || {};
    const sleep = String(condition.sleep || "").trim();
    const cond = String(condition.cond || "").trim();
    const memo = String(condition.memo || "").trim();
    if ((sleep !== "" && (!Number.isFinite(Number(sleep)) || Number(sleep) < 0)) ||
        (cond !== "" && (!Number.isFinite(Number(cond)) || Number(cond) < 1 || Number(cond) > 5))) {
      return { ok: false, error: "invalid-condition" };
    }

    strengthUpdates.forEach(({ record, weight, reps, comment }) => Object.assign(record, { weight, reps, comment }));
    cardioUpdates.forEach(({ record, distance, durSec, comment }) => Object.assign(record, { distance, durSec, comment }));
    targetState.records.forEach((entry) => { if (entry.date === oldDate) entry.date = newDate; });
    targetState.cardio.forEach((entry) => { if (entry.date === oldDate) entry.date = newDate; });

    if (oldDate !== newDate) delete targetState.cond[oldDate];
    if (sleep || cond || memo) targetState.cond[newDate] = { sleep, cond, memo };
    else delete targetState.cond[newDate];

    return { ok: true, date: newDate };
  }

  return { applyHistoryEdits };
});
