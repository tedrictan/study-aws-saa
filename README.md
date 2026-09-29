# SAA Study App

A personal study app for the AWS Certified Solutions Architect – Associate (SAA-C03) exam.

## Important note on the question bank

This app does **not** contain real or leaked AWS exam questions. Using actual exam content
(often called "braindumps") violates the AWS Certification Agreement you accept when you
register for the exam, and can get a certification revoked. It's also not something I have
a legitimate source for.

Instead, the app ships with **120 original practice questions**, written to match the real
exam's scenario style, format, and difficulty, built directly from AWS's public SAA-C03 exam
guide. That's 100 standard single-answer questions plus 20 multi-response ("Select TWO/THREE")
questions — matching the real exam's mix of both formats, with no partial credit on multi-response,
same as the real thing. The count per domain intentionally mirrors AWS's official exam blueprint
weighting:

| Domain | Weight | Questions in app |
|---|---|---|
| 1. Design Secure Architectures | 30% | 36 |
| 2. Design Resilient Architectures | 26% | 31 |
| 3. Design High-Performing Architectures | 24% | 29 |
| 4. Design Cost-Optimized Architectures | 20% | 24 |

Every question — right or wrong — comes with an explanation plus a "crash course" mini-lesson
on the underlying concept, so wrong answers turn into actual learning instead of just a red X.

## How to run it

No build step, no dependencies. Easiest option (works everywhere Node is installed):

```bash
node /Users/pmoit/Documents/study-aws/serve.js
```

Then open `http://localhost:8721` in your browser. A Python fallback (`serve.py`) is also
included if you'd rather not use Node — run it the same way with `python3 serve.py`. Either
way, avoid `python3 -m http.server` directly: some sandboxed launchers block the `os.getcwd()`
call it makes internally, which is exactly why both custom scripts exist.

Your progress is saved to your browser's local storage, per-browser. It doesn't sync
between browsers/devices and isn't sent anywhere.

## What's inside

- **Dashboard** — days until your exam, overall accuracy, per-domain accuracy, streak, lessons read, exam simulator history.
- **Lessons** — read these first. One structured teaching chapter per domain (not tied to any single question) covering the concepts up front, so you're not learning material for the first time via a wrong answer. Each has a "mark as read" so the Dashboard and Study Plan know where you are.
- **Practice** — untimed, filter by domain/difficulty, immediate feedback + crash course on every question (including multi-response ones — correct-but-unselected options are outlined green, wrongly-selected ones red, so you can see exactly what you missed).
- **Exam Simulator** — built to feel like the real testing engine, not just a timed quiz:
  - 65 questions / 130 minutes (or a 33-question / 65-minute half-length version), sampled proportionally to the real domain weights, mixing single-answer and multi-response questions.
  - **No feedback until you submit** — you don't find out right/wrong per question, same as the real exam.
  - **Flag for review** on any question, plus a **question navigator** grid to jump straight to any question (answered / flagged / unanswered are all visually distinct), just like the real Pearson VUE interface.
  - **Auto-submits** when the timer hits zero, with whatever's answered so far.
  - Results show an overall score, a pass/fail estimate, and a domain-by-domain breakdown — mirroring what a real AWS score report shows. A full question-by-question answer review is available too, but tucked behind a "bonus" button, since the real exam doesn't give you that at all.
- **Review (Spaced Repetition)** — a Leitner-system queue: get a question wrong and it comes back in 2 days, then 4, then 9, then 21 as you get it right, so weak spots get more reps automatically.
- **Flashcards** — quick-fire crash-course concept cards, one per topic, for windshield-time review.
- **Study Plan** — enter your exam date and get a day-by-day plan: learn all 4 domains first, then ramp up exam simulator runs and spaced review in the back half.

## Adding more questions

Open `js/questions.js` — it's a plain JS array. A standard single-answer question:

```js
{ id: 121, domain: 1, topic: "...", difficulty: "medium",
  q: "...", options: ["...","...","...","..."], correct: 0,
  explain: "...", crash: "..." }
```

A multi-response ("Select TWO/THREE") question — 5 options, `correct` is an array of indices,
and the question text should end with `(Select TWO.)` or `(Select THREE.)` like the real exam:

```js
{ id: 122, domain: 1, topic: "...", difficulty: "medium", type: "multi",
  q: "... (Select TWO.)", options: ["...","...","...","...","..."], correct: [0, 3],
  explain: "...", crash: "..." }
```

`domain` is 1-4, `explain` covers why the right answer(s) are right, and `crash` is the deeper
concept lesson shown especially on a wrong answer.
