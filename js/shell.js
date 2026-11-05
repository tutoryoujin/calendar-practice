/* ────────────────────────────────────────────────────────────
   shell.js — 복사본. 여기서 고치지 말 것.

   원본: korean-cards/shared/shell.js
   고친 뒤  python tools/sync_shared.py  를 돌리면 두 앱에 퍼진다.
   sha256 4c2c40d9070ef0e9
   ──────────────────────────────────────────────────────────── */
/* 한국어 with Youjin — 모든 앱이 공유하는 셸 동작.
   마스코트 도형 주입 + 햄버거 메뉴. 다른 스크립트보다 먼저 부른다.

   헤더·푸터의 마크업 자체는 앱마다 index.html 에 직접 적는다.
   달력은 정적 페이지고 카드는 해시 라우팅이라 생성 방식이 달라서,
   한쪽에 맞추면 다른 쪽이 손해를 본다. 대신 구조는 디자인 시스템의
   SiteHeader / SiteFooter 카드를 그대로 베낀다. */
(function () {
  "use strict";

  /* ============================================================
     마스코트 이응 — 도형은 문서에 한 번만 둔다.

     자르는 영역은 반드시 symbol 의 viewBox 로 준다. 바깥 <svg> 에
     적은 viewBox 는 <use> 가 symbol 을 꺼내는 순간 무시되고,
     캐릭터가 왼쪽 위로 밀린 채 보인다.

     같은 이유로 바깥 CSS 선택자는 <use> 가 만든 섀도 트리 안쪽에
     닿지 않는다. 마크에서 팔을 "숨기는" 게 아니라 처음부터
     ieung-head 만 꺼내 쓰는 이유다. (색이 토큰으로 따라오는 건
     커스텀 속성이 상속되기 때문이고, 그쪽은 섀도 트리를 넘어간다.)
     ============================================================ */
  var IEUNG = [
    '<svg width="0" height="0" style="position:absolute" aria-hidden="true">',
    '<defs>',
    '<g id="ieung-limbs">',
    '<ellipse fill="var(--ieung-limb)" cx="84" cy="196" rx="20" ry="13"/>',
    '<ellipse fill="var(--ieung-limb)" cx="136" cy="196" rx="20" ry="13"/>',
    '<rect fill="var(--ieung-limb)" x="22" y="126" width="42" height="15" rx="7.5" transform="rotate(-14 43 133)"/>',
    '<rect fill="var(--ieung-limb)" x="152" y="100" width="44" height="15" rx="7.5" transform="rotate(-38 174 107)"/>',
    '</g>',
    // 같은 팔·발인데 오른팔만 애니메이션용. 한 인스턴스만 움직이게 하려면
    // 원본을 따로 둬야 한다. x/y 가 다른 건 회전 기준점이 달라서다 —
    // 위는 rect 가운데, 아래는 CSS 가 fill-box 왼쪽 끝(어깨)을 기준으로 돌린다.
    '<g id="ieung-limbs-wave">',
    '<ellipse fill="var(--ieung-limb)" cx="84" cy="196" rx="20" ry="13"/>',
    '<ellipse fill="var(--ieung-limb)" cx="136" cy="196" rx="20" ry="13"/>',
    '<rect fill="var(--ieung-limb)" x="22" y="126" width="42" height="15" rx="7.5" transform="rotate(-14 43 133)"/>',
    '<rect class="ieung-wave" fill="var(--ieung-limb)" x="157" y="113.5" width="44" height="15" rx="7.5"/>',
    '</g>',
    '<g id="ieung-head">',
    '<rect fill="var(--primary)" x="103" y="24" width="14" height="50" rx="7"/>',
    '<rect fill="var(--primary)" x="76" y="24" width="68" height="14" rx="7"/>',
    '<circle fill="var(--ieung-body)" cx="110" cy="132" r="64"/>',
    '<ellipse fill="var(--ieung-blush)" cx="65" cy="152" rx="14" ry="9"/>',
    '<ellipse fill="var(--ieung-blush)" cx="155" cy="152" rx="14" ry="9"/>',
    '<circle fill="#fff" cx="88" cy="122" r="23"/><circle fill="#fff" cx="132" cy="122" r="23"/>',
    '<circle fill="var(--ieung-face)" cx="90" cy="126" r="13"/><circle fill="var(--ieung-face)" cx="134" cy="126" r="13"/>',
    '<circle fill="#fff" cx="85" cy="120" r="4.5"/><circle fill="#fff" cx="129" cy="120" r="4.5"/>',
    '<path stroke="var(--ieung-face)" stroke-width="5" stroke-linecap="round" fill="none" d="M100 156 q10 12 20 0"/>',
    '</g>',
    '</defs>',
    // 전신. 가로세로 192:204
    '<symbol id="ieung" viewBox="8 12 192 204"><use href="#ieung-limbs"/><use href="#ieung-head"/></symbol>',
    // 손 흔드는 변형. 팔이 바깥으로 더 나가므로 오른쪽을 8 넓혔다 (200x204)
    '<symbol id="ieung-wave" viewBox="8 12 200 204"><use href="#ieung-limbs-wave"/><use href="#ieung-head"/></symbol>',
    // 브랜드 마크 — 팔을 빼고 얼굴만. 정사각이라 정사각 칸에 꼭 맞는다
    '<symbol id="ieung-mark" viewBox="21.5 16 177 177"><use href="#ieung-head"/></symbol>',
    '</svg>'
  ].join("");

  function injectIeung() {
    if (document.getElementById("ieung-mark")) return;
    var holder = document.createElement("div");
    holder.innerHTML = IEUNG;
    document.body.insertBefore(holder.firstChild, document.body.firstChild);
  }

  // </body> 앞에서 부르면 body 가 이미 있으므로 바로 넣는다.
  // <use> 가 가리키는 symbol 이 뒤늦게 생기면 브라우저에 따라 다시
  // 찾아 주지 않으므로, 기다리지 않고 동기로 넣는 편이 안전하다.
  if (document.body) {
    injectIeung();
  } else {
    document.addEventListener("DOMContentLoaded", injectIeung);
  }

  /* ============================================================
     햄버거 메뉴

     버튼에 직접 걸지 않고 document 에 한 번만 건다. 카드 앱은 화면을
     innerHTML 로 통째로 다시 그려서 버튼에 건 리스너가 날아간다.
     ============================================================ */
  function nav() { return document.getElementById("siteNav"); }
  function btn() { return document.querySelector(".menu-btn"); }

  function setMenu(open) {
    var n = nav(), b = btn();
    if (!n || !b) return;
    b.setAttribute("aria-expanded", String(open));
    b.setAttribute("aria-label", open ? "메뉴 닫기 / Close menu" : "메뉴 열기 / Open menu");
    n.hidden = !open;
  }

  document.addEventListener("click", function (e) {
    var n = nav();
    if (!n) return;
    if (e.target.closest(".menu-btn")) { setMenu(n.hidden); return; }
    // 메뉴 안의 링크를 눌러도 닫는다. 카드 앱은 해시 라우팅이라
    // 링크를 눌러도 페이지가 다시 로드되지 않는다.
    if (!n.hidden) setMenu(false);
  });

  document.addEventListener("keydown", function (e) {
    var n = nav();
    if (e.key === "Escape" && n && !n.hidden) {
      setMenu(false);
      if (btn()) btn().focus();
    }
  });
})();
