"use strict";

// 選択日の前日までの同種目と比較する。記録・設定には書き込まない。
function getSummaryReaction({ date, records = [], cardio = [], exercises = [] }) {
  const result = { kind: "empty", personalBestIds: [], comparedCount: 0, declinedCount: 0 };
  let hasToday = false;
  const valid = value => Number.isFinite(value) && value > 0;
  const maximum = (rows, score) => rows.reduce((best, row) => Math.max(best, score(row)), 0);
  exercises.forEach(ex => {
    const isCardio = ex.type === "cardio";
    const source = (isCardio ? cardio : records).filter(row => row.exId === ex.id && row.date <= date);
    const weightedScore = row => {
      if (!valid(row.weight) || !valid(row.reps)) return 0;
      const value = row.weight * (1 + row.reps / 30);
      return Number.isFinite(value) ? value : 0;
    };
    const scores = isCardio
      ? [row => valid(row.distance) ? row.distance : 0]
      : ex.equip === "body"
        ? [row => row.weight === 0 && valid(row.reps) ? row.reps : 0, weightedScore]
        : [weightedScore];
    let compared = false, declined = true, personalBest = false;
    // 同日に自重と加重が混在しても、それぞれを同じ尺度の過去と比較する。
    scores.forEach(score => {
      const today = source.filter(row => row.date === date && score(row) > 0);
      if (!today.length) return;
      hasToday = true;
      const bestToday = maximum(today, score);
      const past = source.filter(row => row.date < date && score(row) > 0);
      if (!past.length) { declined = false; return; } // 初回や比較なしは通常の演出。
      compared = true;
      const bestPast = maximum(past, score);
      const epsilon = Math.max(bestToday, bestPast) * 1e-9;
      if (bestToday > bestPast + epsilon) personalBest = true;
      const lastDate = past.reduce((latest, row) => row.date > latest ? row.date : latest, "");
      const previous = maximum(past.filter(row => row.date === lastDate), score);
      // セット数ではなく最高値で比較。混在日は維持できた尺度があれば低下扱いにしない。
      if (bestToday > previous * 0.8 + epsilon) declined = false;
    });
    if (personalBest) result.personalBestIds.push(ex.id);
    if (compared) {
      result.comparedCount += 1;
      if (declined) result.declinedCount += 1;
    }
  });
  if (result.personalBestIds.length) result.kind = "pr";
  else if (result.declinedCount > result.comparedCount / 2) result.kind = "down";
  else if (hasToday) result.kind = "normal";
  return result;
}

const SUMMARY_REACTION_COPY = {
  ja: {
    pr: { title: "自己ベスト更新！", message: "今日の積み重ねが、新しい記録に。" },
    normal: { title: "トレーニング完了", message: "今日もおつかれさまでした。" },
    down: { title: "ガーン…", message: "今日は控えめ。また次のトレーニングで。" }
  },
  en: {
    pr: { title: "New personal best!", message: "Today's effort set a new record." },
    normal: { title: "Workout complete", message: "Good work showing up today." },
    down: { title: "Oh no…", message: "A lighter day. There's always the next workout." }
  },
  zh: {
    pr: { title: "刷新个人纪录！", message: "今天的努力，成就了新纪录。" },
    normal: { title: "训练完成", message: "今天也辛苦了。" },
    down: { title: "啊呀…", message: "今天轻练一些，下次继续。" }
  },
  es: {
    pr: { title: "¡Nuevo récord personal!", message: "El esfuerzo de hoy dio un nuevo récord." },
    normal: { title: "Entrenamiento terminado", message: "Buen trabajo hoy." },
    down: { title: "Vaya…", message: "Hoy fue más suave. Habrá otro entrenamiento." }
  },
  fr: {
    pr: { title: "Nouveau record personnel !", message: "Les efforts du jour ont porté leurs fruits." },
    normal: { title: "Séance terminée", message: "Bravo pour la séance d'aujourd'hui." },
    down: { title: "Oh non…", message: "Une séance plus légère. À la prochaine." }
  },
  de: {
    pr: { title: "Neuer persönlicher Rekord!", message: "Dein Einsatz hat einen neuen Rekord gebracht." },
    normal: { title: "Training abgeschlossen", message: "Gut gemacht heute." },
    down: { title: "Oh je…", message: "Heute etwas leichter. Auf zum nächsten Training." }
  },
  it: {
    pr: { title: "Nuovo record personale!", message: "L'impegno di oggi ha portato un nuovo record." },
    normal: { title: "Allenamento completato", message: "Ottimo lavoro oggi." },
    down: { title: "Oh no…", message: "Oggi più leggero. Ci sarà un prossimo allenamento." }
  }
};

function getSummaryReactionCopy(kind, lang) {
  const copy = SUMMARY_REACTION_COPY[lang] || SUMMARY_REACTION_COPY.en;
  return copy[kind] || copy.normal;
}

if (typeof window !== "undefined") {
  window.getSummaryReaction = getSummaryReaction;
  window.getSummaryReactionCopy = getSummaryReactionCopy;
}
if (typeof module !== "undefined") module.exports = { getSummaryReaction, getSummaryReactionCopy };
