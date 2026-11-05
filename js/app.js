/* ============================================================
   읽기 규칙
   - 연·월·일은 모두 한자어 숫자 (일, 이, 삼 …)
   - 예외: 6월 → 유월, 10월 → 시월
   ============================================================ */
const SINO = ["", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"];
const NATIVE = ["", "하나", "둘", "셋", "넷", "다섯", "여섯", "일곱", "여덟", "아홉"];
const NATIVE_TENS = ["", "열", "스물", "서른"];

function sino(n) {
  if (n === 0) return "영";
  let s = "";
  for (const [u, name] of [
    [1000, "천"],
    [100, "백"],
    [10, "십"],
  ]) {
    const q = Math.floor(n / u);
    if (q) s += (q === 1 ? "" : SINO[q]) + name;
    n %= u;
  }
  return s + (n ? SINO[n] : "");
}
const native = (n) => NATIVE_TENS[Math.floor(n / 10)] + NATIVE[n % 10];

const readYear = (y) => sino(y) + " 년";
const readMonth = (m) => (m === 6 ? "유월" : m === 10 ? "시월" : sino(m) + "월");
const readDay = (d) => sino(d) + " 일";

const WEEK = [
  ["일", "Sun", "Sunday"],
  ["월", "Mon", "Monday"],
  ["화", "Tue", "Tuesday"],
  ["수", "Wed", "Wednesday"],
  ["목", "Thu", "Thursday"],
  ["금", "Fri", "Friday"],
  ["토", "Sat", "Saturday"],
];

/* 양력 고정 공휴일 (설날·추석처럼 음력인 날은 해마다 달라서 뺐어요) */
const HOLIDAYS = {
  "1-1": ["신정", "New Year’s Day"],
  "3-1": ["삼일절", "Independence Movement Day"],
  "5-5": ["어린이날", "Children’s Day"],
  "6-6": ["현충일", "Memorial Day"],
  "8-15": ["광복절", "Liberation Day"],
  "10-3": ["개천절", "National Foundation Day"],
  "10-9": ["한글날", "Hangeul Day"],
  "12-25": ["크리스마스", "Christmas"],
};

const RELATIVE = {
  "-2": ["그저께", "the day before yesterday"],
  "-1": ["어제", "yesterday"],
  0: ["오늘", "today"],
  1: ["내일", "tomorrow"],
  2: ["모레", "the day after tomorrow"],
};

const SPECIAL_NOTE = {
  6: ["6월은 ‘육월’이 아니라 ‘유월’이라고 읽어요.", "June is read 유월, not 육월."],
  10: ["10월은 ‘십월’이 아니라 ‘시월’이라고 읽어요.", "October is read 시월, not 십월."],
};

/* ---------- 음성 (브라우저 TTS) ---------- */
const canSpeak = "speechSynthesis" in window;
function speak(text) {
  if (!canSpeak) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ko-KR";
  u.rate = 0.8;
  const voice = speechSynthesis.getVoices().find((v) => v.lang && v.lang.toLowerCase().startsWith("ko"));
  if (voice) u.voice = voice;
  speechSynthesis.speak(u);
}
if (canSpeak) speechSynthesis.getVoices();

/* ---------- 달력 ---------- */
const $ = (id) => document.getElementById(id);
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const today = startOfDay(new Date());
let viewY = today.getFullYear(),
  viewM = today.getMonth() + 1;
let selected = today;

$("weekdays").innerHTML = WEEK.map(
  (w, i) =>
    `<div class="wd ${i === 0 ? "sun" : i === 6 ? "sat" : ""}"><span class="ko">${w[0]}</span><span class="en">${w[1]}</span></div>`,
).join("");

function renderMonth() {
  $("monthDigits").textContent = `${viewY}년 ${viewM}월`;
  $("monthReading").textContent = `${readYear(viewY)} ${readMonth(viewM)}`;

  const first = new Date(viewY, viewM - 1, 1).getDay();
  const days = new Date(viewY, viewM, 0).getDate();
  let html = "";
  for (let i = 0; i < first; i++) html += `<div class="empty"></div>`;
  for (let d = 1; d <= days; d++) {
    const date = new Date(viewY, viewM - 1, d);
    const wd = date.getDay();
    const cls = ["cell"];
    if (wd === 0) cls.push("sun");
    if (wd === 6) cls.push("sat");
    if (HOLIDAYS[`${viewM}-${d}`]) cls.push("holiday");
    if (+date === +today) cls.push("today");
    if (+date === +selected) cls.push("selected");
    html += `<button class="${cls.join(" ")}" type="button" data-d="${d}" aria-label="${readMonth(viewM)} ${readDay(d)} ${WEEK[wd][0]}요일">${d}</button>`;
  }
  $("grid").innerHTML = html;
}

function renderPanel() {
  const y = selected.getFullYear(),
    m = selected.getMonth() + 1,
    d = selected.getDate(),
    wd = selected.getDay();
  const weekKo = WEEK[wd][0] + "요일";
  const special = SPECIAL_NOTE[m];
  const hol = HOLIDAYS[`${m}-${d}`];
  const diff = Math.round((selected - today) / 86400000);
  const rel = RELATIVE[diff];
  const en = selected.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  let tags = "";
  if (rel) tags += `<span class="tag"><b>${rel[0]}</b> ${rel[1]}</span>`;
  if (hol) tags += `<span class="tag hol"><b>${hol[0]}</b> ${hol[1]}</span>`;

  $("panel").innerHTML = `
    <div class="panel-digits">${y}년 ${m}월 ${d}일 ${weekKo}</div>
    <div class="segments">
<div class="seg seg-year"><small>${y}년</small><span>${readYear(y)}</span></div>
<div class="seg seg-month ${special ? "special" : ""}"><small>${m}월</small><span>${readMonth(m)}</span></div>
<div class="seg seg-day"><small>${d}일</small><span>${readDay(d)}</span></div>
<div class="seg seg-week"><small>${WEEK[wd][2]}</small><span>${weekKo}</span></div>
    </div>
    <p class="panel-en">${en}</p>
    ${tags ? `<div class="tags">${tags}</div>` : ""}
    ${special ? `<div class="note"><span class="ko">✨ ${special[0]}</span>${special[1]}</div>` : ""}
    ${canSpeak ? `<button class="btn" id="speakBtn" type="button"><span class="ko">🔊 들어 보기</span><span class="en">Listen</span></button>` : ""}`;

  if (canSpeak)
    $("speakBtn").addEventListener("click", () =>
      speak(`${readYear(y)} ${readMonth(m)} ${readDay(d)} ${weekKo}`),
    );
}

$("grid").addEventListener("click", (e) => {
  const cell = e.target.closest(".cell");
  if (!cell) return;
  selected = new Date(viewY, viewM - 1, +cell.dataset.d);
  renderMonth();
  renderPanel();
});
function shiftMonth(delta) {
  viewM += delta;
  if (viewM < 1) {
    viewM = 12;
    viewY--;
  }
  if (viewM > 12) {
    viewM = 1;
    viewY++;
  }
  renderMonth();
}
$("prevBtn").addEventListener("click", () => shiftMonth(-1));
$("nextBtn").addEventListener("click", () => shiftMonth(1));
$("todayBtn").addEventListener("click", () => {
  viewY = today.getFullYear();
  viewM = today.getMonth() + 1;
  selected = today;
  renderMonth();
  renderPanel();
});

/* ---------- 퀴즈 ---------- */
const QUIZ_LEN = 10; // 한 판에 푸는 문제 수
let quiz = { m: 1, d: 1, answer: "", right: 0, total: 0, seen: [], missed: [] };
const rand = (n) => Math.floor(Math.random() * n);
function shuffle(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function newQuestion() {
  // 한 판 안에서는 같은 날짜가 두 번 나오지 않게
  // 이번 문제의 달은 startQuiz에서 미리 정해 둔 순서대로
  const m = quiz.plan[quiz.total];
  let d;
  do {
    // 평년(2023) 기준이라 2월은 28일까지만 나와요 (2/29 제외)
    d = rand(new Date(2023, m, 0).getDate()) + 1;
  } while (quiz.seen.includes(`${m}-${d}`));
  quiz.seen.push(`${m}-${d}`);
  const day = readDay(d);
  const answer = `${readMonth(m)} ${day}`;

  // 학생들이 자주 하는 실수로 오답 만들기
  const dayWrong = [`${readMonth(m)} ${readDay(d === 1 ? 2 : d - 1)}`]; // 날짜 하나 틀림
  if (d >= 10 && d < 20) dayWrong.push(`${readMonth(m)} 일${day}`); // 10을 ‘일십’으로 읽음

  let opts;
  if (m === 6 || m === 10) {
    // 유월·시월은 헷갈리는 세 가지 읽기를 꼭 함께 보여 줘요
    // 6월: 유월(정답)·육월·여섯월 / 10월: 시월(정답)·십월·열월
    const [plainWrong, nativeWrong] = m === 6 ? ["육월", "여섯월"] : ["십월", "열월"];
    opts = [answer, `${plainWrong} ${day}`, `${nativeWrong} ${day}`, shuffle(dayWrong)[0]];
  } else {
    const wrong = [
      `${native(m)}월 ${native(d)} 일`, // 고유어 숫자로 읽음
      `${readMonth(m === 12 ? 11 : m + 1)} ${day}`, // 달 하나 틀림
      ...dayWrong,
    ];
    opts = [answer];
    for (const w of shuffle(wrong)) {
      if (opts.length >= 4) break;
      if (!opts.includes(w)) opts.push(w);
    }
  }

  quiz = { ...quiz, m, d, answer };
  $("qDate").textContent = `${m}월 ${d}일`;
  $("opts").innerHTML = shuffle(opts)
    .map((o) => `<button class="opt" type="button">${o}</button>`)
    .join("");
  $("feedback").innerHTML = "";
  $("qNext").hidden = true;
  $("qSpeak").hidden = true;
  $("qNum").textContent = `${quiz.total + 1} / ${QUIZ_LEN}`;
  $("scoreText").textContent = quiz.right;
}

function startQuiz() {
  // 한 판의 달 순서를 미리 정해요: 6월·10월은 꼭 한 번씩 넣고,
  // 나머지는 무작위 (유월·시월이 조금 더 자주 나오게 약 30%)
  const plan = [6, 10];
  while (plan.length < QUIZ_LEN) {
    plan.push(Math.random() < 0.3 ? (Math.random() < 0.5 ? 6 : 10) : rand(12) + 1);
  }
  quiz = { ...quiz, right: 0, total: 0, seen: [], missed: [], plan: shuffle(plan) };
  $("qNextKo").textContent = "다음 문제";
  $("qNextEn").textContent = "Next question";
  $("qResult").hidden = true;
  $("qPlay").hidden = false;
  newQuestion();
}

function showResult() {
  const { right } = quiz;
  const msg =
    right === QUIZ_LEN
      ? ["완벽해요! 🎉", "Perfect score!"]
      : right >= 7
        ? ["잘했어요! 👏", "Great job!"]
        : right >= 4
          ? ["좋아요, 조금만 더! 💪", "Good, keep practicing!"]
          : ["다시 한번 해 봐요! 🌱", "Let’s try again!"];
  const missed = quiz.missed.length
    ? `<p class="missed-title">틀린 문제 다시 보기 · Review</p>
       <ul class="missed">${quiz.missed
         .map((q) => `<li><span>${q.date}</span><b>${q.answer}</b></li>`)
         .join("")}</ul>`
    : "";
  $("qResult").innerHTML = `
    <div class="q-label"><span class="ko">결과</span>Result</div>
    <div class="result-score">${right} / ${QUIZ_LEN}</div>
    <div class="result-msg"><span class="ko">${msg[0]}</span><span class="en">${msg[1]}</span></div>
    ${missed}
    <button class="btn" id="qRestart" type="button"><span class="ko">다시 하기</span><span class="en">Play again</span></button>`;
  $("qPlay").hidden = true;
  $("qResult").hidden = false;
  $("qRestart").addEventListener("click", startQuiz);
  $("qRestart").focus();
}

$("opts").addEventListener("click", (e) => {
  const btn = e.target.closest(".opt");
  if (!btn || btn.disabled) return;
  const correct = btn.textContent === quiz.answer;
  quiz.total++;
  if (correct) quiz.right++;
  else quiz.missed.push({ date: `${quiz.m}월 ${quiz.d}일`, answer: quiz.answer });
  document.querySelectorAll(".opt").forEach((o) => {
    o.disabled = true;
    if (o.textContent === quiz.answer) o.classList.add("right");
  });
  if (!correct) btn.classList.add("wrong");

  const special = SPECIAL_NOTE[quiz.m];
  $("feedback").innerHTML = correct
    ? `<span class="ko">맞아요! 🎉</span><span class="en">Correct!</span>`
    : `<span class="ko">아쉬워요! 정답은 ‘${quiz.answer}’예요.</span><span class="en">${special ? special[1] : "Months and days use Sino-Korean numbers (일, 이, 삼…)."}</span>`;
  $("scoreText").textContent = quiz.right;
  if (quiz.total >= QUIZ_LEN) {
    $("qNextKo").textContent = "결과 보기";
    $("qNextEn").textContent = "See results";
  }
  $("qNext").hidden = false;
  $("qSpeak").hidden = !canSpeak;
  $("qNext").focus();
});
$("qNext").addEventListener("click", () => (quiz.total >= QUIZ_LEN ? showResult() : newQuestion()));
$("qSpeak").addEventListener("click", () => speak(quiz.answer));

/* ---------- 연간 달력 ---------- */
const MONTH_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
let yearY = today.getFullYear();
let pickedM = today.getMonth() + 1;

function renderYearPick() {
  const special = SPECIAL_NOTE[pickedM];
  $("yearPick").innerHTML = `
    <div class="sub">${pickedM}월 · ${MONTH_EN[pickedM - 1]}</div>
    <div class="big ${special ? "special-text" : ""}">${readMonth(pickedM)}</div>
    ${special ? `<div class="note" style="text-align:left"><span class="ko">✨ ${special[0]}</span>${special[1]}</div>` : ""}
    <div class="btn-row">
${canSpeak ? `<button class="btn" id="yearSpeak" type="button"><span class="ko">🔊 들어 보기</span><span class="en">Listen</span></button>` : ""}
<button class="btn ghost" id="yearOpen" type="button" ${canSpeak ? "" : 'style="grid-column:1 / -1"'}><span class="ko">이 달 달력 보기</span><span class="en">Open this month</span></button>
    </div>`;
  if (canSpeak) $("yearSpeak").addEventListener("click", () => speak(readMonth(pickedM)));
  $("yearOpen").addEventListener("click", () => {
    viewY = yearY;
    viewM = pickedM;
    renderMonth();
    showTab("cal");
    window.scrollTo({ top: 0 });
  });
}

function renderYear() {
  $("yearDigits").textContent = `${yearY}년`;
  $("yearReading").textContent = readYear(yearY);

  let html = "";
  for (let m = 1; m <= 12; m++) {
    const first = new Date(yearY, m - 1, 1).getDay();
    const days = new Date(yearY, m, 0).getDate();
    let mini = WEEK.map((w) => `<span class="h">${w[0]}</span>`).join("");
    for (let i = 0; i < first; i++) mini += "<span></span>";
    for (let d = 1; d <= days; d++) {
      const wd = (first + d - 1) % 7;
      const cls = [];
      if (wd === 0) cls.push("s");
      if (wd === 6) cls.push("t");
      if (HOLIDAYS[`${m}-${d}`]) cls.push("hd");
      if (yearY === today.getFullYear() && m === today.getMonth() + 1 && d === today.getDate()) cls.push("td");
      mini += `<span class="${cls.join(" ")}">${d}</span>`;
    }
    const isNow = yearY === today.getFullYear() && m === today.getMonth() + 1;
    html += `
<button class="mcard ${m === pickedM ? "picked" : ""} ${isNow ? "now" : ""}" type="button" data-m="${m}" aria-label="${m}월, ${readMonth(m)}">
  <div class="mname ${SPECIAL_NOTE[m] ? "special-name" : ""}">${readMonth(m)}</div>
  <div class="msub">${m}월 · ${MONTH_EN[m - 1]}</div>
  <div class="mini" aria-hidden="true">${mini}</div>
</button>`;
  }
  $("months").innerHTML = html;
  renderYearPick();
}

$("months").addEventListener("click", (e) => {
  const card = e.target.closest(".mcard");
  if (!card) return;
  pickedM = +card.dataset.m;
  renderYear();
  speak(readMonth(pickedM));
  $("yearPick").scrollIntoView({ behavior: "smooth", block: "center" });
});
$("yPrevBtn").addEventListener("click", () => {
  yearY--;
  renderYear();
});
$("yNextBtn").addEventListener("click", () => {
  yearY++;
  renderYear();
});

/* ---------- 탭 ---------- */
const TABS = { cal: ["tabCal", "calView"], year: ["tabYear", "yearView"], quiz: ["tabQuiz", "quizView"] };
function showTab(which) {
  for (const [key, [tab, view]] of Object.entries(TABS)) {
    $(tab).setAttribute("aria-selected", key === which);
    $(view).hidden = key !== which;
  }
}
$("tabCal").addEventListener("click", () => showTab("cal"));
$("tabYear").addEventListener("click", () => showTab("year"));
$("tabQuiz").addEventListener("click", () => showTab("quiz"));

renderMonth();
renderPanel();
renderYear();
startQuiz();
