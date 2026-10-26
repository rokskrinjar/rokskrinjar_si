// Preklop jezika SL / EN / SL+EN. Izbira se zapomni v brskalniku (če je mogoče).
(function () {
  var KEY = "hormozi-lang";
  var root = document.documentElement;
  var lang = "en";
  try { var s = localStorage.getItem(KEY); if (s === "sl" || s === "en" || s === "both") lang = s; } catch (e) {}
  root.setAttribute("data-lang", lang);

  function sync() {
    var cur = root.getAttribute("data-lang");
    document.querySelectorAll(".lang button").forEach(function (b) {
      b.setAttribute("aria-pressed", b.dataset.set === cur ? "true" : "false");
    });
    root.lang = cur === "en" ? "en" : "sl";
  }
  function wire() {
    document.querySelectorAll(".lang button").forEach(function (b) {
      b.addEventListener("click", function () {
        root.setAttribute("data-lang", b.dataset.set);
        try { localStorage.setItem(KEY, b.dataset.set); } catch (e) {}
        sync();
      });
    });
    sync();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire); else wire();
})();
