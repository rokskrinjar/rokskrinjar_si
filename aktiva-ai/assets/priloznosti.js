// Opportunity map: dots placed from the use-case cards (data-v value, data-x feasibility, 1–5), filter by activity.
(function () {
  "use strict";
  var M = document.getElementById("matrix");
  var cards = Array.prototype.slice.call(document.querySelectorAll("#cases .card[data-n]"));
  var CLS = { upr: "upr", var: "var", cis: "cis", vse: "vse" };

  cards.forEach(function (c) {
    var n = c.dataset.n, x = +c.dataset.x, v = +c.dataset.v;
    var dot = document.createElement("button");
    dot.type = "button";
    dot.className = "dot " + CLS[c.dataset.a] + (c.dataset.risk === "visoko" ? " hi" : "");
    if (c.dataset.a === "vse") dot.style.background = "#8a6bb8";
    // 1–5 mapped into the box with a margin; nudge equal scores apart so dots don't overlap.
    var twins = cards.filter(function (o) { return o.dataset.x === c.dataset.x && o.dataset.v === c.dataset.v; });
    var k = twins.indexOf(c), off = (k - (twins.length - 1) / 2) * 6;
    dot.style.left = (8 + (x - 1) / 4 * 84 + off) + "%";
    dot.style.bottom = (8 + (v - 1) / 4 * 80) + "%";
    dot.textContent = n;
    dot.title = c.querySelector("b").textContent;
    dot.setAttribute("aria-label", n + ": " + dot.title);
    dot.addEventListener("click", function () {
      c.scrollIntoView({ behavior: "smooth", block: "center" });
      c.animate([{ boxShadow: "0 0 0 3px var(--blue)" }, { boxShadow: "0 0 0 0 transparent" }], { duration: 1200 });
    });
    c.querySelector(".row").insertAdjacentHTML("afterbegin", '<span class="n" style="background:' + getComputedStyle(dot).backgroundColor + '">' + n + "</span>");
    M.appendChild(dot);
    c._dot = dot;
  });
  // The badge colour needs the dot in the DOM first.
  cards.forEach(function (c) { c.querySelector(".n").style.background = getComputedStyle(c._dot).backgroundColor; });

  document.querySelectorAll("[data-f]").forEach(function (b) {
    b.addEventListener("click", function () {
      var f = b.dataset.f;
      document.querySelectorAll("[data-f]").forEach(function (o) { o.setAttribute("aria-pressed", o === b ? "true" : "false"); });
      cards.forEach(function (c) {
        var on = f === "all" || c.dataset.a === f;
        c.hidden = !on;
        c._dot.style.opacity = on ? "1" : ".15";
      });
    });
  });
})();
