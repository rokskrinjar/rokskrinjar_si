// Solis DIY guide page: hero rings, project cards, ideas, Wood 101 tabs.
(function () {
  "use strict";
  var E = window.SolisEngine;
  var filter = "all";

  document.getElementById("rings").innerHTML =
    '<circle cx="220" cy="220" r="214" fill="var(--forest)"/><circle cx="220" cy="220" r="206" fill="var(--piece-line)"/>' +
    '<g style="--x:0">' + SD.rings(412, 26, 11).replace(/<polygon /g, '<polygon transform="translate(14 14)" ') + '</g>' +
    '<path d="M220 222 L408 140" stroke="var(--forest)" stroke-width="3" stroke-dasharray="2 7" stroke-linecap="round"/>';
  var st = document.createElement("style");
  st.textContent = ".rings .early{fill:var(--piece);stroke:var(--piece-line);stroke-width:1}.rings .late{fill:var(--piece-2);stroke:var(--piece-line);stroke-width:1.6}";
  document.head.appendChild(st);
  document.getElementById("logo").innerHTML = SD.rings(100, 6, 3);

  function level(n) { var s = '<span class="level" aria-label="' + n + '/3">'; for (var i = 1; i <= 3; i++) s += '<i class="' + (i <= n ? "on" : "") + '"></i>'; return s + "</span>"; }

  function render(data) {
    var cat = data.cat, proj = data.proj, l = SD.lang();
    var cards = document.getElementById("cards");
    cards.innerHTML = proj.planner.filter(function (p) {
      return filter === "all" || (filter === "easy" ? p.level === 1 : p.where === filter);
    }).map(function (p) {
      var q = E.quote(cat, E.GEN[p.id](E.defaults(p), p.variants[0].id), {});
      var where = p.where === "out" ? (l === "sl" ? "Vrt" : "Garden") : (l === "sl" ? "Dom" : "Home");
      return '<a class="card" href="planner.html#p=' + p.id + '">' + SD.icon(p.icon) +
        '<span class="tag">' + where + "</span><h3>" + SD.esc(p[l].title) + "</h3><p>" + SD.esc(p[l].teaser) + "</p>" +
        '<div class="meta">' + level(p.level) + '<span class="price">' + (l === "sl" ? "od ~" : "from ~") + SD.eur(q.material, 0) + "</span></div></a>";
    }).join("");

    document.getElementById("ideas").innerHTML = proj.ideas.filter(function (p) {
      return filter === "all" || (filter === "easy" ? p.level === 1 : p.where === filter);
    }).map(function (p) {
      return '<button type="button" class="idea" data-q="' + SD.esc(p[l].q) + '"><b>' + SD.esc(p[l].title) + "</b><span>" + SD.esc(p[l].teaser) + "</span><em>" + (l === "sl" ? "Vprašaj Skobelja →" : "Ask Skobelj →") + "</em></button>";
    }).join("");

    document.getElementById("prodlist").innerHTML = cat.products.map(function (p) {
      return "<div><b>" + SD.esc(p[l].name) + "</b>" + (p.soon ? '<span class="badge">' + (l === "sl" ? "kmalu" : "soon") + "</span>" : "") +
        "<p>" + SD.esc(p[l].short) + "</p><p><b class='num' style='font-size:.85rem'>" + p.moisture + "</b> · " + SD.esc(p[l].use) + "</p></div>";
    }).join("");
  }

  document.getElementById("ideas").addEventListener("click", function (e) {
    var b = e.target.closest(".idea");
    if (b && window.SolisChat) window.SolisChat.open(b.getAttribute("data-q"), true);
  });
  document.querySelectorAll("[data-f]").forEach(function (b) {
    b.addEventListener("click", function () {
      filter = b.dataset.f;
      document.querySelectorAll("[data-f]").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      SD.load().then(render);
    });
  });
  document.querySelectorAll("[data-tab]").forEach(function (b) {
    b.addEventListener("click", function () {
      document.querySelectorAll("[data-tab]").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      document.querySelectorAll(".tabpanel").forEach(function (p) { p.hidden = p.id !== b.dataset.tab; });
    });
  });
  document.addEventListener("langchange", function () { SD.load().then(render); });
  SD.load().then(render);
})();
