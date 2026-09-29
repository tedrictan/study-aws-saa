/* Main application logic: view routing, rendering, quiz engine. */

const $app = document.getElementById("app-content");
const $nav = document.getElementById("nav");
const DOMAINS = [1, 2, 3, 4];

let session = null; // active quiz session state

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function byId(id) { return QUESTIONS.find((q) => q.id === id); }

function esc(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

// ---------- Routing ----------
const ROUTES = {
  dashboard: renderDashboard,
  lessons: renderLessonsList,
  practice: renderPracticeSetup,
  mock: renderMockSetup,
  review: renderReview,
  flashcards: renderFlashcards,
  plan: renderStudyPlan,
};

function navigate(route) {
  if (session && session.timerHandle) { clearInterval(session.timerHandle); session.timerHandle = null; }
  session = null;
  window.location.hash = route;
  render();
}

function render() {
  const raw = (window.location.hash || "#dashboard").slice(1);
  const [route, param] = raw.split("/");
  document.querySelectorAll("#nav button").forEach((b) => {
    b.classList.toggle("active", b.dataset.route === route);
  });
  if (route === "lesson" && param) { renderLessonDetail(Number(param)); return; }
  const fn = ROUTES[route] || renderDashboard;
  fn();
}

window.addEventListener("hashchange", render);

document.querySelectorAll("#nav button").forEach((btn) => {
  btn.addEventListener("click", () => {
    navigate(btn.dataset.route);
    closeMobileNav();
  });
});

// ---------- Mobile nav drawer ----------
function openMobileNav() {
  document.getElementById("sidebar").classList.add("open");
  document.getElementById("sidebar-overlay").classList.add("visible");
}
function closeMobileNav() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("sidebar-overlay").classList.remove("visible");
}
document.getElementById("hamburger-btn").addEventListener("click", openMobileNav);
document.getElementById("sidebar-overlay").addEventListener("click", closeMobileNav);

// ---------- Dashboard ----------
function renderDashboard() {
  const state = getState();
  const overall = computeOverallStats(QUESTIONS);
  const domainStats = computeDomainStats(QUESTIONS);
  const due = getDueReviewQuestionIds().length;
  const pct = overall.seen ? Math.round((overall.totalCorrect / (overall.totalCorrect + overall.totalWrong || 1)) * 100) : 0;

  let daysLeftHtml = "";
  if (state.examDate) {
    const days = daysBetween(todayISO(), state.examDate);
    daysLeftHtml = `<div class="stat-card ${days <= 7 ? "urgent" : ""}">
      <div class="stat-value">${days >= 0 ? days : 0}</div>
      <div class="stat-label">days until your exam (${esc(state.examDate)})</div>
    </div>`;
  } else {
    daysLeftHtml = `<div class="stat-card">
      <div class="stat-value">—</div>
      <div class="stat-label">no exam date set — <a href="#plan">set one in Study Plan</a></div>
    </div>`;
  }

  const domainRows = DOMAINS.map((d) => {
    const s = domainStats[d] || { total: 0, seen: 0, correct: 0, wrong: 0 };
    const attempts = s.correct + s.wrong;
    const acc = attempts ? Math.round((s.correct / attempts) * 100) : null;
    const coverage = s.total ? Math.round((s.seen / s.total) * 100) : 0;
    const barColor = acc === null ? "#888" : acc >= 80 ? "var(--good)" : acc >= 60 ? "var(--warn)" : "var(--bad)";
    return `<div class="domain-row">
      <div class="domain-row-head">
        <strong>Domain ${d}: ${esc(DOMAIN_NAMES[d])}</strong>
        <span>${acc === null ? "not started" : acc + "% accuracy"}</span>
      </div>
      <div class="bar-track"><div class="bar-fill" style="width:${coverage}%; background:${barColor}"></div></div>
      <div class="domain-row-sub">${s.seen}/${s.total} questions attempted</div>
    </div>`;
  }).join("");

  $app.innerHTML = `
    <h1>Welcome back${state.settings.name ? ", " + esc(state.settings.name) : ""}</h1>
    <p class="subtitle">Your personal AWS SAA-C03 study coach. Let's get you to a pass.</p>

    <div class="stat-grid">
      ${daysLeftHtml}
      <div class="stat-card">
        <div class="stat-value">${overall.seen}/${overall.total}</div>
        <div class="stat-label">questions attempted</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${pct}%</div>
        <div class="stat-label">overall accuracy</div>
      </div>
      <div class="stat-card ${due > 0 ? "urgent" : ""}">
        <div class="stat-value">${due}</div>
        <div class="stat-label">questions due for review</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${state.streak.count}</div>
        <div class="stat-label">day study streak</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${countLessonsRead()}/${LESSONS.length}</div>
        <div class="stat-label">lessons read</div>
      </div>
    </div>

    <div class="quick-actions">
      ${countLessonsRead() < LESSONS.length ? `<button class="btn btn-primary" id="qa-lessons">Read next lesson</button>` : ""}
      ${due > 0 ? `<button class="btn ${countLessonsRead() < LESSONS.length ? "" : "btn-primary"}" id="qa-review">Review ${due} due question${due === 1 ? "" : "s"}</button>` : ""}
      <button class="btn" id="qa-practice">Practice by domain</button>
      <button class="btn" id="qa-mock">Take the exam simulator</button>
      <button class="btn" id="qa-flash">Crash-course flashcards</button>
    </div>

    <h2>Domain breakdown</h2>
    ${domainRows}

    ${state.mockHistory.length ? renderMockHistory(state) : ""}

    <p class="fine-print reset-row">Stats look wrong, or want a clean slate? <button class="link-btn" id="reset-progress">Reset all progress</button></p>
  `;

  document.getElementById("qa-lessons")?.addEventListener("click", () => {
    const next = LESSONS.find((l) => !isLessonRead(l.domain)) || LESSONS[0];
    window.location.hash = `lesson/${next.domain}`; render();
  });
  document.getElementById("qa-practice")?.addEventListener("click", () => navigate("practice"));
  document.getElementById("qa-mock")?.addEventListener("click", () => navigate("mock"));
  document.getElementById("qa-flash")?.addEventListener("click", () => navigate("flashcards"));
  document.getElementById("qa-review")?.addEventListener("click", () => navigate("review"));
  document.getElementById("reset-progress").addEventListener("click", () => {
    if (confirm("Reset ALL progress? This clears every answered question, lesson-read status, streak, exam history, and saved exam. This can't be undone.")) {
      clearExamSnapshot();
      resetAllProgress();
      renderDashboard();
    }
  });
}

function renderMockHistory(state) {
  const rows = state.mockHistory.slice().reverse().slice(0, 5).map((m) => {
    const pct = Math.round((m.score / m.total) * 100);
    const passed = pct >= 72;
    return `<tr><td>${esc(m.date)}</td><td>${m.score}/${m.total}</td><td>${pct}%</td>
      <td class="${passed ? "pass" : "fail"}">${passed ? "Likely Pass" : "Keep studying"}</td></tr>`;
  }).join("");
  return `<h2>Recent exam simulator results</h2>
    <table class="history-table">
      <thead><tr><th>Date</th><th>Score</th><th>%</th><th>Estimate</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p class="fine-print">"Estimate" uses a common ~72% raw-score approximation of AWS's scaled 720/1000 pass mark. AWS's real scoring algorithm is proprietary and weights questions unevenly — treat this as directional, not exact.</p>`;
}

// ---------- Lessons (read-first teaching content) ----------
function renderLessonsList() {
  const cards = LESSONS.map((l) => {
    const read = isLessonRead(l.domain);
    return `<div class="card lesson-card">
      <div class="lesson-card-head">
        <h3>Domain ${l.domain}: ${esc(l.title)}</h3>
        ${read ? '<span class="pill pill-easy">Read</span>' : '<span class="pill pill-medium">Not started</span>'}
      </div>
      <p>${esc(l.intro)}</p>
      <p class="fine-print">~${l.estMinutes} min read &middot; ${l.sections.length} sections</p>
      <button class="btn btn-primary" data-domain="${l.domain}">${read ? "Re-read lesson" : "Start lesson"}</button>
    </div>`;
  }).join("");

  $app.innerHTML = `
    <h1>Lessons</h1>
    <p class="subtitle">Read these BEFORE you practice or take a mock exam. They teach the concepts up front instead of waiting for you to get a question wrong first — one chapter per exam domain, in the order AWS weights them.</p>
    ${cards}
  `;
  $app.querySelectorAll("button[data-domain]").forEach((btn) => {
    btn.addEventListener("click", () => { window.location.hash = `lesson/${btn.dataset.domain}`; render(); });
  });
}

function renderLessonDetail(domain) {
  const lesson = LESSONS.find((l) => l.domain === domain);
  if (!lesson) { navigate("lessons"); return; }
  const sectionsHtml = lesson.sections.map((s) => `
    <div class="lesson-section">
      <h3>${esc(s.heading)}</h3>
      ${s.body}
    </div>
  `).join("");

  $app.innerHTML = `
    <p class="breadcrumb"><a href="#lessons">← All lessons</a></p>
    <h1>Domain ${lesson.domain}: ${esc(lesson.title)}</h1>
    <p class="subtitle">${esc(lesson.intro)}</p>
    ${sectionsHtml}
    <div class="quiz-actions">
      <button class="btn btn-primary" id="mark-read">${isLessonRead(domain) ? "Marked as read ✓" : "Mark as read"}</button>
      <button class="btn" id="go-practice">Practice Domain ${domain} questions now</button>
    </div>
  `;
  document.getElementById("mark-read").addEventListener("click", () => {
    markLessonRead(domain);
    document.getElementById("mark-read").textContent = "Marked as read ✓";
  });
  document.getElementById("go-practice").addEventListener("click", () => {
    const pool = shuffle(QUESTIONS.filter((q) => q.domain === domain)).map((q) => q.id);
    startQuizSession(pool, { mode: "practice" });
  });
}

// ---------- Practice setup ----------
function renderPracticeSetup() {
  const domainChecks = DOMAINS.map((d) => `
    <label class="check-row">
      <input type="checkbox" class="practice-domain" value="${d}" checked>
      Domain ${d}: ${esc(DOMAIN_NAMES[d])} (${QUESTIONS.filter((q) => q.domain === d).length} questions)
    </label>`).join("");

  $app.innerHTML = `
    <h1>Practice mode</h1>
    <p class="subtitle">Untimed, one question at a time. Every wrong answer gets a full crash-course explanation.</p>
    <div class="card">
      <h3>Choose domains</h3>
      ${domainChecks}
      <h3>Difficulty</h3>
      <label class="check-row"><input type="checkbox" class="practice-diff" value="easy" checked> Easy</label>
      <label class="check-row"><input type="checkbox" class="practice-diff" value="medium" checked> Medium</label>
      <label class="check-row"><input type="checkbox" class="practice-diff" value="hard" checked> Hard</label>
      <h3>Question order</h3>
      <label class="check-row"><input type="radio" name="order" value="random" checked> Random</label>
      <label class="check-row"><input type="radio" name="order" value="unseen-first"> Prioritize questions I haven't seen</label>
      <button class="btn btn-primary" id="start-practice" style="margin-top:16px">Start practicing</button>
    </div>
  `;

  document.getElementById("start-practice").addEventListener("click", () => {
    const domains = Array.from(document.querySelectorAll(".practice-domain:checked")).map((c) => Number(c.value));
    const diffs = Array.from(document.querySelectorAll(".practice-diff:checked")).map((c) => c.value);
    const order = document.querySelector('input[name="order"]:checked').value;
    let pool = QUESTIONS.filter((q) => domains.includes(q.domain) && diffs.includes(q.difficulty));
    if (!pool.length) { alert("Select at least one domain and difficulty."); return; }
    if (order === "unseen-first") {
      pool = pool.slice().sort((a, b) => (getAttempt(a.id) ? 1 : 0) - (getAttempt(b.id) ? 1 : 0));
      // light shuffle within same seen/unseen groups
      pool = pool.map((q, i) => ({ q, r: Math.random() + (getAttempt(q.id) ? 1 : 0) })).sort((a, b) => a.r - b.r).map((x) => x.q);
    } else {
      pool = shuffle(pool);
    }
    startQuizSession(pool.map((q) => q.id), { mode: "practice" });
  });
}

// ---------- Exam Simulator setup ----------
function renderMockSetup() {
  const snap = getExamSnapshot();
  if (snap) {
    const answered = snap.responses.filter((r) => r.selected.length > 0).length;
    const m = String(Math.floor(snap.remainingSeconds / 60)).padStart(2, "0");
    const s = String(snap.remainingSeconds % 60).padStart(2, "0");
    $app.innerHTML = `
      <h1>Exam Simulator</h1>
      <div class="card">
        <h3>You have a saved exam in progress</h3>
        <p>${answered}/${snap.ids.length} questions answered &middot; <strong>${m}:${s}</strong> remaining on the clock &middot; saved ${esc(new Date(snap.savedAt).toLocaleString())}</p>
        <p class="fine-print">Heads up: on the real AWS exam, the clock does NOT pause for restroom or other breaks — unscheduled breaks still burn exam time. This save/pause feature is a study-tool convenience the real testing engine doesn't actually offer.</p>
        <button class="btn btn-primary" id="resume-exam">Resume exam</button>
        <button class="btn" id="discard-exam">Discard and start a new exam</button>
      </div>
    `;
    document.getElementById("resume-exam").addEventListener("click", () => resumeExamSession(snap));
    document.getElementById("discard-exam").addEventListener("click", () => {
      if (confirm("Discard your saved exam progress? This can't be undone.")) {
        clearExamSnapshot();
        renderMockSetup();
      }
    });
    return;
  }

  $app.innerHTML = `
    <h1>Exam Simulator</h1>
    <p class="subtitle">Mirrors the real SAA-C03 testing engine, not just a quiz: a mix of single-answer and multi-response ("Select TWO/THREE") questions, drawn proportionally from the four domains at their official weightings (30% / 26% / 24% / 20%).</p>
    <div class="card">
      <h3>How this works, just like the real exam</h3>
      <ul>
        <li>You will <strong>not</strong> see whether an answer is right or wrong until you submit the whole exam — no feedback mid-test, same as the real thing.</li>
        <li>Move freely between questions with Previous / Next, or jump directly to any question using the question navigator.</li>
        <li>Flag any question "for review" and come back to it before submitting.</li>
        <li>Multi-response questions require the <strong>exact</strong> set of correct answers — there's no partial credit, same as the real exam.</li>
        <li>If the timer hits zero, your exam auto-submits with whatever you've answered so far.</li>
        <li>Need a break? Use <strong>Save &amp; Exit</strong> mid-exam to pause the clock and resume later — note the real exam does <strong>not</strong> let you pause for restroom breaks, this is purely a study-tool convenience.</li>
      </ul>
      <button class="btn btn-primary" id="start-mock">Start full exam — 65 questions, 130 minutes</button>
      <button class="btn" id="start-mini-mock">Start a half-length exam — 33 questions, 65 minutes</button>
    </div>
  `;
  document.getElementById("start-mock").addEventListener("click", () => startExamSession(proportionalSample(65), 130 * 60));
  document.getElementById("start-mini-mock").addEventListener("click", () => startExamSession(proportionalSample(33), 65 * 60));
}

function resumeExamSession(snap) {
  clearExamSnapshot();
  session = {
    mode: "exam",
    ids: snap.ids,
    responses: snap.responses,
    currentIndex: Math.min(snap.currentIndex, snap.ids.length - 1),
    startedAt: Date.now(),
    deadline: Date.now() + snap.remainingSeconds * 1000,
    timerHandle: null,
    navigatorOpen: false,
  };
  renderExamQuestion();
  startExamTimer();
}

function proportionalSample(n) {
  const weights = { 1: 0.30, 2: 0.26, 3: 0.24, 4: 0.20 };
  const counts = {};
  let assigned = 0;
  DOMAINS.forEach((d, i) => {
    if (i === DOMAINS.length - 1) {
      counts[d] = n - assigned;
    } else {
      counts[d] = Math.round(n * weights[d]);
      assigned += counts[d];
    }
  });
  let ids = [];
  DOMAINS.forEach((d) => {
    const pool = shuffle(QUESTIONS.filter((q) => q.domain === d));
    ids = ids.concat(pool.slice(0, Math.min(counts[d], pool.length)).map((q) => q.id));
  });
  return shuffle(ids);
}

// ---------- Review mode ----------
function renderReview() {
  const dueIds = getDueReviewQuestionIds();
  const missedIds = getMissedQuestionIds();
  $app.innerHTML = `
    <h1>Review</h1>
    <p class="subtitle">Spaced repetition: questions you got wrong come back at increasing intervals until you consistently get them right.</p>
    <div class="card">
      <h3>Due for review today: ${dueIds.length}</h3>
      <button class="btn btn-primary" id="start-due" ${dueIds.length ? "" : "disabled"}>Review due questions</button>
    </div>
    <div class="card">
      <h3>All previously missed questions: ${missedIds.length}</h3>
      <button class="btn" id="start-missed" ${missedIds.length ? "" : "disabled"}>Review all missed questions</button>
    </div>
  `;
  document.getElementById("start-due")?.addEventListener("click", () => startQuizSession(shuffle(dueIds), { mode: "review" }));
  document.getElementById("start-missed")?.addEventListener("click", () => startQuizSession(shuffle(missedIds), { mode: "review" }));
}

// ---------- Shared answer-checking helpers (single & multi-response) ----------
function correctIndices(q) {
  return q.type === "multi" ? q.correct.slice().sort((a, b) => a - b) : [q.correct];
}
function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  const sa = a.slice().sort((x, y) => x - y);
  const sb = b.slice().sort((x, y) => x - y);
  return sa.every((v, i) => v === sb[i]);
}
function isAnswerCorrect(q, selected) {
  return arraysEqual(selected, correctIndices(q));
}
function optionLetters(n) {
  return "ABCDE".slice(0, n).split("");
}

// ---------- Practice / Review engine (immediate feedback, untimed) ----------
function startQuizSession(questionIds, opts) {
  session = {
    ids: questionIds,
    index: 0,
    answers: [],           // { id, chosen: number[], correct }
    mode: opts.mode,
    timerHandle: null,
  };
  renderQuizQuestion();
}

function renderQuizQuestion() {
  const q = byId(session.ids[session.index]);
  const total = session.ids.length;
  const progressPct = Math.round((session.index / total) * 100);
  const letters = optionLetters(q.options.length);

  $app.innerHTML = `
    <div class="quiz-header">
      <div class="quiz-progress">Question ${session.index + 1} of ${total} &middot; Domain ${q.domain}: ${esc(DOMAIN_NAMES[q.domain])} &middot; <span class="pill pill-${q.difficulty}">${q.difficulty}</span>${q.type === "multi" ? ' <span class="pill pill-multi">multi-select</span>' : ""}</div>
    </div>
    <div class="bar-track"><div class="bar-fill" style="width:${progressPct}%"></div></div>

    <div class="card question-card">
      <p class="question-stem">${esc(q.q)}</p>
      <div class="options" id="options"></div>
      <div id="feedback"></div>
      <div class="quiz-actions">
        <button class="btn" id="quit-quiz">Quit</button>
        <button class="btn btn-primary" id="submit-answer" disabled>Submit answer</button>
        <button class="btn btn-primary" id="next-question" style="display:none">${session.index + 1 === total ? "See results" : "Next question"}</button>
      </div>
    </div>
  `;

  const optionsDiv = document.getElementById("options");
  const selectedSet = new Set();
  q.options.forEach((opt, i) => {
    const row = document.createElement("div");
    row.className = "option";
    row.innerHTML = `<span class="opt-letter">${letters[i]}</span><span class="opt-text">${esc(opt)}</span>`;
    row.addEventListener("click", () => {
      if (row.classList.contains("locked")) return;
      if (q.type === "multi") {
        if (selectedSet.has(i)) { selectedSet.delete(i); row.classList.remove("selected"); }
        else { selectedSet.add(i); row.classList.add("selected"); }
      } else {
        selectedSet.clear();
        optionsDiv.querySelectorAll(".option").forEach((o) => o.classList.remove("selected"));
        selectedSet.add(i);
        row.classList.add("selected");
      }
      document.getElementById("submit-answer").disabled = selectedSet.size === 0;
    });
    optionsDiv.appendChild(row);
  });

  document.getElementById("quit-quiz").addEventListener("click", () => {
    if (confirm("Quit this session? Your progress on answered questions is already saved.")) {
      navigate("dashboard");
    }
  });

  document.getElementById("submit-answer").addEventListener("click", () => {
    if (selectedSet.size === 0) return;
    lockAndReveal(q, Array.from(selectedSet), optionsDiv);
  });
}

function lockAndReveal(q, selected, optionsDiv) {
  const correct = correctIndices(q);
  const isCorrect = isAnswerCorrect(q, selected);
  optionsDiv.querySelectorAll(".option").forEach((row, i) => {
    row.classList.add("locked");
    if (correct.includes(i)) row.classList.add("correct");
    else if (selected.includes(i)) row.classList.add("incorrect");
  });

  const attempt = recordAnswer(q.id, isCorrect);
  session.answers.push({ id: q.id, chosen: selected, correct: isCorrect });

  const feedback = document.getElementById("feedback");
  feedback.innerHTML = `
    <div class="feedback ${isCorrect ? "feedback-correct" : "feedback-incorrect"}">
      <h3>${isCorrect ? "✓ Correct" : "✗ Not quite"}</h3>
      <p>${esc(q.explain)}</p>
      <div class="crash-course ${isCorrect ? "" : "emphasized"}">
        <h4>${isCorrect ? "Crash course (good to know)" : "Crash course — why this trips people up"}</h4>
        <p>${esc(q.crash)}</p>
      </div>
      <p class="fine-print">Box ${attempt.box}/5 in spaced review ${attempt.box < 5 ? `&middot; you'll see this again around ${attempt.nextReview}` : "&middot; mastered!"}</p>
    </div>
  `;

  document.getElementById("submit-answer").style.display = "none";
  document.getElementById("next-question").style.display = "inline-block";
  document.getElementById("next-question").addEventListener("click", () => {
    session.index += 1;
    if (session.index >= session.ids.length) {
      renderQuizResults();
    } else {
      renderQuizQuestion();
    }
  });
}

function renderQuizResults() {
  const answers = session.answers;
  const total = answers.length;
  const correctCount = answers.filter((a) => a.correct).length;
  const pct = Math.round((correctCount / total) * 100);

  const byDomain = {};
  answers.forEach((a) => {
    const q = byId(a.id);
    byDomain[q.domain] = byDomain[q.domain] || { correct: 0, total: 0 };
    byDomain[q.domain].total += 1;
    if (a.correct) byDomain[q.domain].correct += 1;
  });

  const domainRows = Object.keys(byDomain).map((d) => {
    const s = byDomain[d];
    const dpct = Math.round((s.correct / s.total) * 100);
    return `<div class="domain-row">
      <div class="domain-row-head"><strong>Domain ${d}: ${esc(DOMAIN_NAMES[d])}</strong><span>${s.correct}/${s.total} (${dpct}%)</span></div>
      <div class="bar-track"><div class="bar-fill" style="width:${dpct}%; background:${dpct >= 72 ? "var(--good)" : "var(--bad)"}"></div></div>
    </div>`;
  }).join("");

  const missedReview = answers.filter((a) => !a.correct).map((a) => {
    const q = byId(a.id);
    const letters = optionLetters(q.options.length);
    const yourAnswer = a.chosen.length ? a.chosen.map((i) => `${letters[i]}. ${q.options[i]}`).join("<br>") : "<em>No answer selected</em>";
    const correctAnswer = correctIndices(q).map((i) => `${letters[i]}. ${q.options[i]}`).join("<br>");
    return `<div class="card">
      <p class="question-stem">${esc(q.q)}</p>
      <p><strong>Your answer:</strong><br>${yourAnswer}</p>
      <p><strong>Correct answer:</strong><br>${correctAnswer}</p>
      <p>${esc(q.explain)}</p>
      <div class="crash-course emphasized"><h4>Crash course</h4><p>${esc(q.crash)}</p></div>
    </div>`;
  }).join("");

  $app.innerHTML = `
    <h1>Session complete</h1>
    <div class="result-banner ${pct >= 70 ? "pass" : "fail"}">
      <div class="result-score">${correctCount}/${total} (${pct}%)</div>
      <div>Review the explanations below to lock in anything you missed.</div>
    </div>

    <h2>Domain breakdown</h2>
    ${domainRows}

    ${missedReview ? `<h2>Review your missed questions</h2>${missedReview}` : "<h2>No missed questions — excellent!</h2>"}

    <div class="quiz-actions">
      <button class="btn btn-primary" id="back-dash">Back to dashboard</button>
    </div>
  `;
  document.getElementById("back-dash").addEventListener("click", () => navigate("dashboard"));
}

// ---------- Exam Simulator engine (realistic: no feedback until submit, flagging, navigator, auto-submit) ----------
function startExamSession(questionIds, timeLimitSeconds) {
  session = {
    mode: "exam",
    ids: questionIds,
    responses: questionIds.map(() => ({ selected: [], flagged: false })),
    currentIndex: 0,
    startedAt: Date.now(),
    deadline: Date.now() + timeLimitSeconds * 1000,
    timerHandle: null,
    navigatorOpen: false,
  };
  renderExamQuestion();
  startExamTimer();
}

function examAnsweredCount() { return session.responses.filter((r) => r.selected.length > 0).length; }
function examFlaggedCount() { return session.responses.filter((r) => r.flagged).length; }

function renderExamNavigator() {
  const cells = session.ids.map((id, i) => {
    const r = session.responses[i];
    const classes = ["nav-cell"];
    if (i === session.currentIndex) classes.push("nav-current");
    if (r.selected.length > 0) classes.push("nav-answered");
    if (r.flagged) classes.push("nav-flagged");
    return `<button class="${classes.join(" ")}" data-idx="${i}">${i + 1}</button>`;
  }).join("");
  return `
    <div class="exam-navigator">
      <div class="nav-legend">
        <span><span class="legend-swatch legend-answered"></span>Answered (${examAnsweredCount()}/${session.ids.length})</span>
        <span><span class="legend-swatch legend-flagged"></span>Flagged (${examFlaggedCount()})</span>
        <span><span class="legend-swatch legend-unanswered"></span>Unanswered</span>
      </div>
      <div class="nav-grid">${cells}</div>
    </div>
  `;
}

function wireExamNavigator(onJump) {
  document.querySelectorAll(".nav-cell").forEach((btn) => {
    btn.addEventListener("click", () => onJump(Number(btn.dataset.idx)));
  });
}

function renderExamQuestion() {
  const idx = session.currentIndex;
  const q = byId(session.ids[idx]);
  const total = session.ids.length;
  const response = session.responses[idx];
  const letters = optionLetters(q.options.length);
  const isLast = idx === total - 1;

  $app.innerHTML = `
    <div class="quiz-header">
      <div class="quiz-progress">Question ${idx + 1} of ${total} &middot; <span class="pill pill-${q.difficulty}">${q.difficulty}</span>${q.type === "multi" ? ' <span class="pill pill-multi">multi-select</span>' : ""}</div>
      <div class="timer" id="quiz-timer">--:--</div>
    </div>
    <div class="bar-track"><div class="bar-fill" style="width:${Math.round((idx / total) * 100)}%"></div></div>

    <div class="card question-card">
      <div class="exam-question-top">
        <p class="question-stem">${esc(q.q)}</p>
        <button class="btn flag-btn ${response.flagged ? "flagged" : ""}" id="flag-btn">${response.flagged ? "🚩 Flagged" : "🏳 Flag for review"}</button>
      </div>
      <div class="options" id="options"></div>
      <div class="quiz-actions">
        <button class="btn" id="quit-quiz">Quit</button>
        <button class="btn" id="save-exit-exam">Save &amp; exit</button>
        <button class="btn" id="prev-question" ${idx === 0 ? "disabled" : ""}>Previous</button>
        <button class="btn" id="toggle-navigator">Question navigator</button>
        <button class="btn btn-primary" id="next-question">${isLast ? "Review & submit" : "Next question"}</button>
      </div>
      <div id="navigator-slot"></div>
    </div>
  `;

  const optionsDiv = document.getElementById("options");
  q.options.forEach((opt, i) => {
    const row = document.createElement("div");
    row.className = "option" + (response.selected.includes(i) ? " selected" : "");
    row.innerHTML = `<span class="opt-letter">${letters[i]}</span><span class="opt-text">${esc(opt)}</span>`;
    row.addEventListener("click", () => {
      if (q.type === "multi") {
        const pos = response.selected.indexOf(i);
        if (pos === -1) response.selected.push(i); else response.selected.splice(pos, 1);
      } else {
        response.selected = [i];
      }
      renderExamQuestion();
    });
    optionsDiv.appendChild(row);
  });

  document.getElementById("flag-btn").addEventListener("click", () => {
    response.flagged = !response.flagged;
    renderExamQuestion();
  });

  document.getElementById("quit-quiz").addEventListener("click", () => {
    if (confirm("Quit this exam and discard ALL progress? Nothing will be scored, and none of your answers will be saved. (Use \"Save & exit\" instead if you just need a break.)")) {
      clearExamSnapshot();
      navigate("dashboard");
    }
  });

  document.getElementById("save-exit-exam").addEventListener("click", () => {
    const remaining = Math.max(0, Math.round((session.deadline - Date.now()) / 1000));
    if (session.timerHandle) { clearInterval(session.timerHandle); session.timerHandle = null; }
    saveExamSnapshot({
      ids: session.ids,
      responses: session.responses,
      currentIndex: session.currentIndex,
      remainingSeconds: remaining,
      savedAt: Date.now(),
    });
    navigate("mock");
  });

  document.getElementById("prev-question").addEventListener("click", () => {
    session.currentIndex = Math.max(0, idx - 1);
    renderExamQuestion();
  });

  document.getElementById("next-question").addEventListener("click", () => {
    if (isLast) {
      renderExamReviewScreen();
    } else {
      session.currentIndex = idx + 1;
      renderExamQuestion();
    }
  });

  document.getElementById("toggle-navigator").addEventListener("click", () => {
    session.navigatorOpen = !session.navigatorOpen;
    renderNavigatorSlot();
  });

  function renderNavigatorSlot() {
    const slot = document.getElementById("navigator-slot");
    if (!slot) return;
    slot.innerHTML = session.navigatorOpen ? renderExamNavigator() : "";
    if (session.navigatorOpen) wireExamNavigator((i) => { session.currentIndex = i; renderExamQuestion(); });
  }
  renderNavigatorSlot();
  updateExamTimerDisplay();
}

function renderExamReviewScreen() {
  const unanswered = session.ids.length - examAnsweredCount();
  const flagged = examFlaggedCount();
  $app.innerHTML = `
    <h1>Review &amp; submit</h1>
    <p class="subtitle">This is exactly what you'd see before submitting the real exam: a full question map, plus anything left blank or flagged.</p>
    <div class="card">
      ${renderExamNavigator()}
      <p class="fine-print" style="margin-top:12px">
        ${unanswered > 0 ? `You have ${unanswered} unanswered question${unanswered === 1 ? "" : "s"} — these are scored as incorrect. ` : "All questions answered. "}
        ${flagged > 0 ? `You have ${flagged} question${flagged === 1 ? "" : "s"} flagged for review.` : ""}
      </p>
      <div class="quiz-actions">
        <button class="btn" id="back-to-exam">Back to exam</button>
        <button class="btn" id="save-exit-exam">Save &amp; exit</button>
        <button class="btn btn-primary" id="submit-exam-btn">Submit exam</button>
      </div>
    </div>
  `;
  wireExamNavigator((i) => { session.currentIndex = i; renderExamQuestion(); });
  document.getElementById("back-to-exam").addEventListener("click", () => renderExamQuestion());
  document.getElementById("save-exit-exam").addEventListener("click", () => {
    const remaining = Math.max(0, Math.round((session.deadline - Date.now()) / 1000));
    if (session.timerHandle) { clearInterval(session.timerHandle); session.timerHandle = null; }
    saveExamSnapshot({
      ids: session.ids,
      responses: session.responses,
      currentIndex: session.currentIndex,
      remainingSeconds: remaining,
      savedAt: Date.now(),
    });
    navigate("mock");
  });
  document.getElementById("submit-exam-btn").addEventListener("click", () => {
    const msg = unanswered > 0
      ? `You still have ${unanswered} unanswered question(s) — they'll be scored as incorrect. Submit anyway?`
      : "Submit your exam? This can't be undone.";
    if (confirm(msg)) submitExam();
  });
}

function startExamTimer() {
  updateExamTimerDisplay();
  session.timerHandle = setInterval(() => {
    const remaining = Math.max(0, Math.round((session.deadline - Date.now()) / 1000));
    updateExamTimerDisplay();
    if (remaining <= 0) {
      clearInterval(session.timerHandle);
      session.timerHandle = null;
      alert("Time's up! Submitting your exam now.");
      submitExam();
    }
  }, 1000);
}

function updateExamTimerDisplay() {
  const el = document.getElementById("quiz-timer");
  if (!el || !session || !session.deadline) return;
  const remaining = Math.max(0, Math.round((session.deadline - Date.now()) / 1000));
  const m = String(Math.floor(remaining / 60)).padStart(2, "0");
  const s = String(remaining % 60).padStart(2, "0");
  el.textContent = `${m}:${s}`;
  el.classList.toggle("timer-low", remaining <= 300);
}

function submitExam() {
  if (session.timerHandle) { clearInterval(session.timerHandle); session.timerHandle = null; }
  clearExamSnapshot();
  const results = session.ids.map((id, i) => {
    const q = byId(id);
    const selected = session.responses[i].selected;
    const correct = isAnswerCorrect(q, selected);
    recordAnswer(id, correct);
    return { id, selected, correct };
  });

  const byDomain = {};
  results.forEach((r) => {
    const q = byId(r.id);
    byDomain[q.domain] = byDomain[q.domain] || { correct: 0, total: 0 };
    byDomain[q.domain].total += 1;
    if (r.correct) byDomain[q.domain].correct += 1;
  });

  const correctCount = results.filter((r) => r.correct).length;
  recordMockExam({ date: todayISO(), score: correctCount, total: results.length, domainBreakdown: byDomain });
  renderExamResults(results, byDomain);
}

function renderExamResults(results, byDomain) {
  const total = results.length;
  const correctCount = results.filter((r) => r.correct).length;
  const pct = Math.round((correctCount / total) * 100);
  const passed = pct >= 72;

  const domainRows = Object.keys(byDomain).map((d) => {
    const s = byDomain[d];
    const dpct = Math.round((s.correct / s.total) * 100);
    return `<div class="domain-row">
      <div class="domain-row-head"><strong>Domain ${d}: ${esc(DOMAIN_NAMES[d])}</strong><span>${s.correct}/${s.total} (${dpct}%)</span></div>
      <div class="bar-track"><div class="bar-fill" style="width:${dpct}%; background:${dpct >= 72 ? "var(--good)" : "var(--bad)"}"></div></div>
    </div>`;
  }).join("");

  const detailHtml = results.map((r) => {
    const q = byId(r.id);
    const letters = optionLetters(q.options.length);
    const yourAnswer = r.selected.length ? r.selected.map((i) => `${letters[i]}. ${q.options[i]}`).join("<br>") : "<em>No answer selected</em>";
    const correctAnswer = correctIndices(q).map((i) => `${letters[i]}. ${q.options[i]}`).join("<br>");
    return `<div class="card ${r.correct ? "" : "missed-card"}">
      <p class="question-stem">${r.correct ? "✓" : "✗"} ${esc(q.q)}</p>
      <p><strong>Your answer:</strong><br>${yourAnswer}</p>
      ${r.correct ? "" : `<p><strong>Correct answer:</strong><br>${correctAnswer}</p>`}
      <p>${esc(q.explain)}</p>
      <div class="crash-course ${r.correct ? "" : "emphasized"}"><h4>Crash course</h4><p>${esc(q.crash)}</p></div>
    </div>`;
  }).join("");

  $app.innerHTML = `
    <h1>Exam results</h1>
    <div class="result-banner ${passed ? "pass" : "fail"}">
      <div class="result-score">${correctCount}/${total} (${pct}%)</div>
      <div>${passed ? "Estimated PASS — keep this consistent and you're in great shape." : "Estimated below the pass line — focus on the weak domains below."}</div>
      <p class="fine-print">This mirrors a real AWS score report: an overall result plus a domain-by-domain breakdown — it does <strong>not</strong> show which individual questions were right or wrong. This estimate uses a common ~72% approximation of AWS's scaled 720/1000 pass mark; the real scoring algorithm is proprietary.</p>
    </div>

    <h2>Domain breakdown</h2>
    ${domainRows}

    <div class="card">
      <button class="btn btn-primary" id="toggle-detail">Show full answer review (bonus — the real exam doesn't give you this)</button>
      <div id="detail-slot"></div>
    </div>

    <div class="quiz-actions">
      <button class="btn btn-primary" id="back-dash">Back to dashboard</button>
    </div>
  `;

  let detailShown = false;
  document.getElementById("toggle-detail").addEventListener("click", (e) => {
    detailShown = !detailShown;
    document.getElementById("detail-slot").innerHTML = detailShown ? detailHtml : "";
    e.target.textContent = detailShown ? "Hide full answer review" : "Show full answer review (bonus — the real exam doesn't give you this)";
  });
  document.getElementById("back-dash").addEventListener("click", () => navigate("dashboard"));
}

// ---------- Flashcards (crash-course concept library, derived from the question bank) ----------
function renderFlashcards() {
  const seen = new Set();
  const cards = [];
  QUESTIONS.forEach((q) => {
    const key = q.topic;
    if (!seen.has(key)) {
      seen.add(key);
      cards.push({ topic: q.topic, domain: q.domain, crash: q.crash });
    }
  });
  const shuffled = shuffle(cards);
  let idx = 0;

  function draw() {
    const c = shuffled[idx];
    $app.innerHTML = `
      <h1>Crash-course flashcards</h1>
      <p class="subtitle">${idx + 1} of ${shuffled.length} &middot; Domain ${c.domain}: ${esc(DOMAIN_NAMES[c.domain])}</p>
      <div class="card flashcard" id="flip-card">
        <div class="flashcard-inner">
          <div class="flashcard-face flashcard-front">
            <div class="flash-topic">${esc(c.topic)}</div>
            <div class="flash-hint">Tap to reveal the crash course</div>
          </div>
          <div class="flashcard-face flashcard-back">
            <div class="flash-topic">${esc(c.topic)}</div>
            <p>${esc(c.crash)}</p>
          </div>
        </div>
      </div>
      <div class="quiz-actions">
        <button class="btn" id="fc-prev" ${idx === 0 ? "disabled" : ""}>Previous</button>
        <button class="btn btn-primary" id="fc-next">Next</button>
      </div>
    `;
    const flip = document.getElementById("flip-card");
    flip.addEventListener("click", () => flip.classList.toggle("flipped"));
    document.getElementById("fc-prev").addEventListener("click", () => { idx = Math.max(0, idx - 1); draw(); });
    document.getElementById("fc-next").addEventListener("click", () => {
      if (idx + 1 >= shuffled.length) { navigate("dashboard"); return; }
      idx += 1; draw();
    });
  }
  draw();
}

// ---------- Study plan ----------
function renderStudyPlan() {
  const state = getState();
  $app.innerHTML = `
    <h1>Study plan</h1>
    <p class="subtitle">Tell me your exam date and I'll build a day-by-day plan across all four domains, ramping up to full mock exams before test day.</p>
    <div class="card">
      <label>Exam date: <input type="date" id="exam-date" value="${state.examDate || ""}"></label>
      <button class="btn btn-primary" id="save-date" style="margin-left:12px">Generate plan</button>
    </div>
    <div id="plan-output"></div>
  `;
  document.getElementById("save-date").addEventListener("click", () => {
    const val = document.getElementById("exam-date").value;
    if (!val) { alert("Pick a date first."); return; }
    setExamDate(val);
    renderPlanOutput(val);
  });
  if (state.examDate) renderPlanOutput(state.examDate);
}

function renderPlanOutput(examDateStr) {
  const days = daysBetween(todayISO(), examDateStr);
  const out = document.getElementById("plan-output");
  if (days <= 0) {
    out.innerHTML = `<p class="fine-print">That date has already passed or is today — good luck!</p>`;
    return;
  }
  const plan = generatePlan(days);
  out.innerHTML = `
    <h2>${days}-day plan (${todayISO()} → ${esc(examDateStr)})</h2>
    <table class="history-table">
      <thead><tr><th>Phase</th><th>Days</th><th>Focus</th></tr></thead>
      <tbody>${plan.map((p) => `<tr><td>${p.phase}</td><td>${p.dayRange}</td><td>${p.focus}</td></tr>`).join("")}</tbody>
    </table>
    <p class="fine-print">This is a template — life happens. What matters is roughly this shape: learn all 4 domains first, then spend the back half mixing full-length mock exams with targeted review of your weakest domain (check the Dashboard for that).</p>
  `;
}

function generatePlan(days) {
  const learnPhase = Math.max(1, Math.round(days * 0.5));
  const mixPhase = Math.max(1, Math.round(days * 0.35));
  const finalPhase = Math.max(1, days - learnPhase - mixPhase);

  const perDomainDays = Math.max(1, Math.round(learnPhase / 4));
  const plan = [];
  let dayCursor = 1;

  DOMAINS.forEach((d) => {
    const end = Math.min(learnPhase, dayCursor + perDomainDays - 1);
    plan.push({
      phase: "Learn",
      dayRange: `Day ${dayCursor}-${end}`,
      focus: `Domain ${d} (${DOMAIN_NAMES[d]}): read the Domain ${d} Lesson first, then work through every Practice question for this domain untimed, reading the crash course on every wrong answer. Review flashcards for this domain's topics each evening.`,
    });
    dayCursor = end + 1;
  });
  if (dayCursor <= learnPhase) {
    plan.push({ phase: "Learn", dayRange: `Day ${dayCursor}-${learnPhase}`, focus: "Buffer/catch-up day: redo Practice questions you got wrong in the last phase." });
  }

  const mixStart = learnPhase + 1;
  const mixEnd = learnPhase + mixPhase;
  plan.push({
    phase: "Mix & Review",
    dayRange: `Day ${mixStart}-${mixEnd}`,
    focus: "Alternate days: (1) full 65-question timed mock exam, review every miss, then (2) targeted Practice + spaced-repetition Review sessions focused on your two weakest domains from the Dashboard.",
  });

  const finalStart = mixEnd + 1;
  plan.push({
    phase: "Final push",
    dayRange: `Day ${finalStart}-${days}`,
    focus: "One mock exam every 1-2 days, spend remaining time exclusively in Review mode clearing due/missed questions. Stop cramming new material 1-2 days before the exam; the day before, do a light flashcard review and rest.",
  });

  return plan;
}

// ---------- Init ----------
render();
