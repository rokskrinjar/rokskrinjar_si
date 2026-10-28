// Solis DIY: shared helpers (language, data loading, formatting, icons).
(function () {
  "use strict";
  var KEY = "solis-diy-lang";

  function lang() { return document.documentElement.getAttribute("data-lang") === "en" ? "en" : "sl"; }
  function setLang(l) {
    document.documentElement.setAttribute("data-lang", l);
    document.documentElement.lang = l;
    try { localStorage.setItem(KEY, l); } catch (e) {}
    document.querySelectorAll(".lang button").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.set === l ? "true" : "false"); });
    document.querySelectorAll("[data-ph-sl]").forEach(function (el) { el.placeholder = el.getAttribute("data-ph-" + l) || ""; });
    var t = document.querySelector("meta[name='title-" + l + "']");
    if (t) document.title = t.content;
    document.dispatchEvent(new CustomEvent("langchange", { detail: l }));
  }
  (function initLang() {
    var l = "sl";
    try { l = localStorage.getItem(KEY) || (/^sl\b/i.test(navigator.language || "") ? "sl" : "sl"); } catch (e) {}
    if (location.search.indexOf("lang=en") >= 0) l = "en";
    if (location.search.indexOf("lang=sl") >= 0) l = "sl";
    document.documentElement.setAttribute("data-lang", l);
    document.addEventListener("DOMContentLoaded", function () {
      document.querySelectorAll(".lang button").forEach(function (b) { b.addEventListener("click", function () { setLang(b.dataset.set); }); });
      // On phones the menu scrolls sideways; keep the current page in view.
      var nav = document.querySelector(".nav"), cur = nav && nav.querySelector("[aria-current]");
      if (cur && nav.scrollWidth > nav.clientWidth) nav.scrollLeft = cur.offsetLeft - 16;
      setLang(lang());
    });
  })();

  // Pick the current language from {sl, en} objects or plain strings.
  function tr(v) { return v && typeof v === "object" && ("sl" in v || "en" in v) ? (v[lang()] || v.sl || v.en) : v; }

  var cache = null;
  function load() {
    if (!cache) cache = Promise.all([
      fetch("assets/catalog.json").then(function (r) { return r.json(); }),
      fetch("assets/projects.json").then(function (r) { return r.json(); })
    ]).then(function (a) { return { cat: a[0], proj: a[1] }; });
    return cache;
  }

  function locale() { return lang() === "en" ? "en-GB" : "sl-SI"; }
  function eur(n, dec) {
    if (dec == null) dec = n < 100 ? 2 : 0;
    return new Intl.NumberFormat(locale(), { style: "currency", currency: "EUR", minimumFractionDigits: dec, maximumFractionDigits: dec }).format(n);
  }
  function num(n, dec) { return new Intl.NumberFormat(locale(), { minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 0 }).format(n); }
  function sec(s) { return s.replace("x", " × "); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  }

  // Line icons, 48×48, stroke = currentColor.
  var P = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  var ICONS = {
    bed: '<path d="M6 24h36v16H6z M6 32h36 M6 28h36 M6 36h36"/><path d="M18 24c0-5 3-8 6-9m0 0c0-3 3-5 6-5-0 4-2 6-6 5zm0 0c-1-3-4-4-7-4 0 3 3 5 7 4"/>',
    planter: '<path d="M10 26h28l-3 14H13z M11 31h26 M12 36h24"/><circle cx="24" cy="15" r="4"/><path d="M24 19v7 M24 11V8 M28 15h3 M17 15h3"/>',
    compost: '<path d="M8 16v26 M40 16v26 M24 16v26 M8 20h32 M8 27h32 M8 34h32 M8 41h32"/><path d="M13 12c2-4 7-5 10-3 M35 12c-2-4-7-5-10-3"/>',
    firewood: '<path d="M6 16l36-6 M10 15v27 M38 11v31"/><circle cx="17" cy="37" r="4"/><circle cx="25" cy="37" r="4"/><circle cx="33" cy="37" r="4"/><circle cx="21" cy="30" r="4"/><circle cx="29" cy="30" r="4"/><circle cx="25" cy="23" r="4"/>',
    pergola: '<path d="M10 18v24 M38 18v24 M5 18h38 M5 22h38 M9 13v9 M17 13v9 M25 13v9 M33 13v9 M41 13v9 M10 26l5-4 M38 26l-5-4"/>',
    bench: '<path d="M6 22h36v5H6z M10 27v13 M38 27v13 M10 34h28"/>',
    picnic: '<path d="M6 16h36 M8 28h32 M14 16l-6 24 M34 16l6 24 M17 16l5 12 M31 16l-5 12"/>',
    workbench: '<path d="M4 17h40v6H4z M8 23v19 M40 23v19 M8 34h32 M30 11h10v6 M33 11V8h4v3"/>',
    shelf: '<path d="M8 14h32 M8 26h32 M8 38h32 M12 14v4l4-4 M36 14v4l-4-4 M12 26v4l4-4 M36 26v4l-4-4 M14 38v-7 M18 38v-9 M22 38v-6"/>',
    bookshelf: '<path d="M10 6h28v36H10z M10 18h28 M10 30h28 M14 18v-8 M18 18v-9 M22 18v-7 M15 30v-8 M19 30v-6 M28 30l3-8"/>',
    bedframe: '<path d="M6 20v20 M42 26v14 M6 32h36 M6 26h36 M10 26v-4h10v4"/>',
    sauna: '<path d="M6 42h36 M6 34h20v8 M6 26h12 M26 34v-8h16 M18 26v8"/><path d="M33 8c-2 2 2 4 0 6s2 4 0 6 M39 8c-2 2 2 4 0 6"/>',
    slats: '<path d="M8 8v32 M14 8v32 M20 8v32 M26 8v32 M32 8v32 M38 8v32 M5 42h38"/>',
    plane: '<path d="M6 32h34l2-6H12z M14 26c0-6 4-10 9-10h4l-5 10 M30 26l3-12 M27 32v-6"/>',
    custom: '<path d="M10 10h28v28H10z M16 18h16 M16 24h16 M16 30h10"/>',
    import: '<path d="M8 12h22l10 10v16H8z M14 22h14 M14 28h20 M14 34h12"/><circle cx="36" cy="12" r="5"/>'
  };
  function icon(name, cls) { return '<svg class="' + (cls || "ico") + '" viewBox="0 0 48 48" aria-hidden="true" ' + P + '>' + (ICONS[name] || ICONS.custom) + '</svg>'; }

  // Tree-ring cross-section, deterministic. Used in the hero and the logo.
  function rings(size, n, seed) {
    var c = size / 2, out = [], s = seed || 7;
    function rnd() { s = (s * 9301 + 49297) % 233280; return s / 233280; }
    var ph = [rnd() * 6.28, rnd() * 6.28, rnd() * 6.28];
    for (var i = 1; i <= n; i++) {
      var r0 = (c * .92) * Math.pow(i / n, 0.92), pts = [];
      for (var a = 0; a <= 72; a++) {
        var t = a / 72 * Math.PI * 2;
        var w = 1 + .035 * Math.sin(3 * t + ph[0] + i * .3) + .025 * Math.sin(5 * t + ph[1]) + .02 * Math.sin(2 * t + ph[2] - i * .2);
        var r = r0 * w;
        pts.push((c + r * Math.cos(t) * 1.02 + i * .25).toFixed(1) + "," + (c + r * Math.sin(t)).toFixed(1));
      }
      out.push('<polygon points="' + pts.join(" ") + '" class="' + (i % 4 === 0 ? "late" : "early") + '"/>');
    }
    return out.reverse().join("");
  }

  // Countdown in the concept strip (and on the password card): the concept is on offer for five days.
  // After the deadline gate.js locks every page and /api/solis stops answering (same date in api/solis.js).
  var DEADLINE = Date.parse("2026-11-02T14:00:00+01:00");
  function expired() { return Date.now() >= DEADLINE; }
  function countdownText() {
    var s = Math.max(0, Math.floor((DEADLINE - Date.now()) / 1000));
    if (!s) return lang() === "en" ? "The concept offer has expired." : "Ponudba koncepta je potekla.";
    var d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), sec = s % 60;
    var p = function (n) { return String(n).padStart(2, "0"); };
    return (lang() === "en" ? "Concept available for " : "Koncept na voljo še ") + d + " d " + p(h) + " h " + p(m) + " min " + p(sec) + " s";
  }
  function tick() {
    // A page left open past the deadline reloads once, so the lock in gate.js takes over.
    if (expired() && !document.documentElement.classList.contains("expired")) { location.reload(); return; }
    var t = countdownText();
    document.querySelectorAll(".countdown").forEach(function (el) { el.textContent = t; });
  }
  document.addEventListener("DOMContentLoaded", function () {
    var strip = document.querySelector(".concept");
    if (strip) { var c = document.createElement("div"); c.className = "countdown"; c.setAttribute("role", "timer"); strip.appendChild(c); }
    tick();
    setInterval(tick, 1000);
  });
  document.addEventListener("langchange", tick);

  window.SD = { tick: tick, expired: expired, lang: lang, setLang: setLang, tr: tr, load: load, eur: eur, num: num, sec: sec, esc: esc, icon: icon, rings: rings };
})();
