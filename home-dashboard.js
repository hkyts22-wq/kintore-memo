"use strict";

function dateFromYmd(value) {
  const [year, month, day] = String(value).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function ymdFromDate(date) {
  return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
}

function buildHomeDashboard({ date, activeExerciseIds, activeShift, records, cardio }) {
  const workoutDates = new Set();
  records.forEach((record) => workoutDates.add(record.date));
  cardio.forEach((record) => workoutDates.add(record.date));

  const selectedDate = dateFromYmd(date);
  const weekStart = new Date(selectedDate);
  weekStart.setDate(selectedDate.getDate() - selectedDate.getDay());
  let weekDays = 0;
  for (let day = 0; day < 7; day += 1) {
    const cursor = new Date(weekStart);
    cursor.setDate(weekStart.getDate() + day);
    if (workoutDates.has(ymdFromDate(cursor))) weekDays += 1;
  }

  let monthDays = 0;
  workoutDates.forEach((workoutDate) => {
    const cursor = dateFromYmd(workoutDate);
    if (cursor.getFullYear() === selectedDate.getFullYear() && cursor.getMonth() === selectedDate.getMonth()) monthDays += 1;
  });

  let streakDays = 0;
  const streakDate = new Date(selectedDate);
  while (workoutDates.has(ymdFromDate(streakDate))) {
    streakDays += 1;
    streakDate.setDate(streakDate.getDate() - 1);
  }

  const activeIds = [...new Set(activeExerciseIds)];
  const loggedSetCount = records.filter((record) => record.date === date).length;
  const hasTodayWorkout = activeIds.length > 0 || workoutDates.has(date);

  return {
    action: hasTodayWorkout ? "continue" : "start",
    activeExerciseCount: activeIds.length,
    loggedSetCount,
    shift: activeShift || "",
    metrics: { weekDays, monthDays, streakDays }
  };
}

if (typeof window !== "undefined") window.buildHomeDashboard = buildHomeDashboard;
if (typeof module !== "undefined") module.exports = { buildHomeDashboard };
