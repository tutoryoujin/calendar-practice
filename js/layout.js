/* ============================================================
   이 앱의 셸 설정.
   헤더·푸터의 마크업과 동작은 js/shell.js (카드 앱과 공유) 에 있다.
   여기서는 앱마다 다른 값만 넘기고, 자리표시자를 셸로 바꾼다.
   ============================================================ */
YJ.config({
  home: "./",
  ko: "한국어 달력",
  en: "Korean Calendar",
  h1: true, // 이 화면에는 다른 <h1> 이 없다
  nav: [
    { href: "./", key: "calendar", ko: "달력", en: "Calendar" },
    // 형제 앱. 한쪽만 걸려 있으면 묶음이 아니라 외딴 페이지로 보인다.
    { href: "https://tutoryoujin.github.io/korean-cards/", ko: "한국어 카드", en: "Korean Cards" }
  ],
  tagline: { ko: "날짜 읽기, 매일 조금씩.", en: "Read Korean dates, one day at a time." },
  legal:
    "공휴일은 양력 고정 공휴일만 표시해요. 설날·추석·부처님오신날 같은 음력 공휴일과 " +
    "대체공휴일은 빠져 있어요.<br />" +
    "Only fixed solar-calendar holidays are shown. Lunar holidays (Seollal, Chuseok, " +
    "Buddha’s Birthday) and substitute holidays are not included."
});

YJ.mount("calendar");
