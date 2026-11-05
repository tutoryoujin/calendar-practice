/* ────────────────────────────────────────────────────────────
   shell.js — 복사본. 여기서 고치지 말 것.

   원본: korean-cards/shared/shell.js
   고친 뒤  python tools/sync_shared.py  를 돌리면 두 앱에 퍼진다.
   sha256 da2664847509d92f
   ──────────────────────────────────────────────────────────── */
/* 한국어 with Youjin — 모든 앱이 공유하는 셸.
   마스코트 도형 · 헤더 · 푸터 · 햄버거. 다른 스크립트보다 먼저 부른다.

   마크업까지 여기서 만든다. 앱마다 index.html 에 따로 적어 두면
   한쪽만 고치고 끝내게 되고, 실제로 그렇게 갈라졌다.
   앱이 다른 부분은 YJ.config() 로만 받는다.

   정적 페이지는 <div id="siteHeader"> / <div id="siteFooter"> 를 두고
   YJ.mount() 를 부른다. 화면을 직접 그리는 앱은 YJ.header() /
   YJ.footer() 가 돌려주는 문자열을 쓴다.
*/
window.YJ = (function () {
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

  /* ============================================================
     헤더와 푸터

     구조는 두 앱이 똑같다. 다른 것은 YJ.config() 로 받는 값뿐이다.
     ============================================================ */
  var cfg = {
    home: "./",               // 브랜드를 눌렀을 때 갈 곳
    ko: "한국어",             // 워드마크 가운데 낱말
    en: "",                   // 영문 병기
    h1: false,                // 워드마크를 <h1> 로 쌀지 (화면에 다른 h1 이 없을 때만)
    nav: [],                  // [{ href, key, ko, en }] — key 가 active 와 같으면 현재 위치
    tagline: { ko: "", en: "" },
    legal: ""                 // 저작권·면책 문구. 줄바꿈용 <br> 를 허용하므로 날 HTML 이다
  };

  function config(c) {
    for (var k in c) if (Object.prototype.hasOwnProperty.call(c, k)) cfg[k] = c[k];
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  var MARK = '<svg><use href="#ieung-mark"/></svg>';
  var WORDMARK = function () {
    return esc(cfg.ko) + ' <em>with Youjin</em><small>' + esc(cfg.en) + "</small>";
  };

  function header(active) {
    var tag = cfg.h1 ? "h1" : "span";
    var links = cfg.nav.map(function (n) {
      var on = n.key && n.key === active;
      return '          <a href="' + esc(n.href) + '"' +
        (on ? ' class="active" aria-current="page"' : "") + ">" +
        esc(n.ko) + "<small>" + esc(n.en) + "</small></a>";
    }).join("\n");
    return [
      '<header class="site-header">',
      '  <div class="site-inner">',
      '    <a class="brand" href="' + esc(cfg.home) + '" aria-label="' + esc(cfg.ko) + ' with Youjin 홈 / Home">',
      '      <span class="brand-mark" aria-hidden="true">' + MARK + "</span>",
      "      <" + tag + ' class="brand-text">' + WORDMARK() + "</" + tag + ">",
      "    </a>",
      '    <div class="menu">',
      '      <button class="menu-btn" type="button" aria-label="메뉴 열기 / Open menu"',
      '              aria-expanded="false" aria-controls="siteNav">',
      '        <span class="bars" aria-hidden="true"></span>',
      "      </button>",
      '      <nav class="site-nav" id="siteNav" aria-label="메뉴 / Menu" hidden>',
      links,
      "      </nav>",
      "    </div>",
      "  </div>",
      "</header>"
    ].join("\n");
  }

  /* 푸터에는 저작권 관련 내용만 둔다. 형제 앱 링크는 헤더 메뉴에
     이미 있어서 겹쳤다. */
  function footer() {
    return [
      '<footer class="site-footer">',
      '  <div class="site-inner">',
      '    <div class="foot-brand">',
      '      <span class="brand-mark sm" aria-hidden="true">' + MARK + "</span>",
      "      <div>",
      "        <b>" + esc(cfg.ko) + " <em>with Youjin</em></b>",
      "        <span>" + esc(cfg.tagline.ko) + "<br>" + esc(cfg.tagline.en) + "</span>",
      "      </div>",
      "    </div>",
      '    <p class="foot-legal">' + cfg.legal + "</p>",
      '    <p class="foot-copy">© ' + new Date().getFullYear() + " Made by Youjin. All rights reserved.</p>",
      "  </div>",
      "</footer>"
    ].join("\n");
  }

  /* 정적 페이지용 — 자리표시자를 실제 셸로 바꾼다 */
  function mount(active) {
    var h = document.getElementById("siteHeader");
    if (h) h.outerHTML = header(active);
    var f = document.getElementById("siteFooter");
    if (f) f.outerHTML = footer();
  }

  return { config: config, header: header, footer: footer, mount: mount };
})();
