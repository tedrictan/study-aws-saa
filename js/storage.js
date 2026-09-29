/* Progress tracking, spaced repetition (Leitner system), and study-plan state.
   Everything persists to localStorage under one key so the app works fully offline. */

const STORAGE_KEY = "saa_study_app_v1";

const LEITNER_INTERVALS_DAYS = { 1: 0, 2: 2, 3: 4, 4: 9, 5: 21 }; // box -> days until next review

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a, b) {
  const ms = new Date(b) - new Date(a);
  return Math.round(ms / 86400000);
}

function defaultState() {
  return {
    examDate: null,
    startedOn: todayISO(),
    streak: { count: 0, lastActiveDate: null },
    attempts: {},        // questionId -> { seen, correct, wrong, box, nextReview, lastCorrect }
    mockHistory: [],      // { date, score, total, domainBreakdown }
    lessonsRead: {},       // domain -> true
    settings: { name: "" },
    savedExam: null,        // { ids, responses, currentIndex, remainingSeconds, timeLimitSeconds, savedAt }
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return Object.assign(defaultState(), parsed);
  } catch (e) {
    return defaultState();
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) { /* storage unavailable - fail silently, app still works in-memory */ }
}

let STATE = loadState();

function getState() { return STATE; }

function touchStreak() {
  const today = todayISO();
  const s = STATE.streak;
  if (s.lastActiveDate === today) return;
  if (s.lastActiveDate && daysBetween(s.lastActiveDate, today) === 1) {
    s.count += 1;
  } else {
    s.count = 1;
  }
  s.lastActiveDate = today;
  saveState(STATE);
}

function setExamDate(dateStr) {
  STATE.examDate = dateStr;
  saveState(STATE);
}

function recordAnswer(questionId, wasCorrect) {
  touchStreak();
  const a = STATE.attempts[questionId] || { seen: 0, correct: 0, wrong: 0, box: 1, nextReview: todayISO(), lastCorrect: null };
  a.seen += 1;
  if (wasCorrect) {
    a.correct += 1;
    a.box = Math.min(5, a.box + 1);
  } else {
    a.wrong += 1;
    a.box = 1;
  }
  a.lastCorrect = wasCorrect;
  const interval = LEITNER_INTERVALS_DAYS[a.box];
  const next = new Date();
  next.setDate(next.getDate() + interval);
  a.nextReview = next.toISOString().slice(0, 10);
  STATE.attempts[questionId] = a;
  saveState(STATE);
  return a;
}

function getAttempt(questionId) {
  return STATE.attempts[questionId] || null;
}

function getDueReviewQuestionIds() {
  const today = todayISO();
  return Object.keys(STATE.attempts)
    .filter((qid) => {
      const a = STATE.attempts[qid];
      return a.wrong > 0 && a.nextReview <= today && a.box < 5;
    })
    .map(Number);
}

function getMissedQuestionIds() {
  return Object.keys(STATE.attempts)
    .filter((qid) => STATE.attempts[qid].lastCorrect === false)
    .map(Number);
}

function computeDomainStats(questions) {
  const byDomain = {};
  for (const q of questions) {
    byDomain[q.domain] = byDomain[q.domain] || { total: 0, seen: 0, correct: 0, wrong: 0 };
    byDomain[q.domain].total += 1;
    const a = STATE.attempts[q.id];
    if (a) {
      byDomain[q.domain].seen += 1;
      byDomain[q.domain].correct += a.correct;
      byDomain[q.domain].wrong += a.wrong;
    }
  }
  return byDomain;
}

function computeOverallStats(questions) {
  let seen = 0, mastered = 0, totalCorrect = 0, totalWrong = 0;
  for (const q of questions) {
    const a = STATE.attempts[q.id];
    if (a) {
      seen += 1;
      totalCorrect += a.correct;
      totalWrong += a.wrong;
      if (a.box >= 5) mastered += 1;
    }
  }
  return { total: questions.length, seen, mastered, totalCorrect, totalWrong };
}

function recordMockExam(result) {
  STATE.mockHistory.push(result);
  saveState(STATE);
}

function markLessonRead(domain) {
  STATE.lessonsRead[domain] = true;
  saveState(STATE);
}

function isLessonRead(domain) {
  return !!STATE.lessonsRead[domain];
}

function countLessonsRead() {
  return Object.keys(STATE.lessonsRead).filter((d) => STATE.lessonsRead[d]).length;
}

function resetAllProgress() {
  STATE = defaultState();
  saveState(STATE);
}

function saveExamSnapshot(snapshot) {
  STATE.savedExam = snapshot;
  saveState(STATE);
}

function getExamSnapshot() {
  return STATE.savedExam;
}

function clearExamSnapshot() {
  STATE.savedExam = null;
  saveState(STATE);
}
