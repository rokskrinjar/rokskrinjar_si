// Free Spirit concept: the "Kje si zdaj?" picker in the hero and the article library (assets/articles.json).
(function () {
  "use strict";
  var BASE = "https://kariera.freespirithc.com/";
  var THEMES = { sebe: "Kdo sem danes", izgorelost: "Izgorelost in energija", strah: "Strah in kriza", prehod: "Sprememba in prehod", meje: "Meje in vzorci", denar: "Denar in vrednost", sluzba: "Iskanje službe" };
  var PATHS = [
    { s: "Prerasel(a) sem to, kar delam.", q: "Česa preprosto nisi več pripravljen(a) izdati pri sebi?",
      a: ["5-znakov-da-si-prerastel-svojo-sluzbo", "kariera-kot-ogledalo-kaj-ti-poklicna-pot-govori-o-tebi", "karierna-evolucija-kariera-kot-ogledalo-vase-rasti"] },
    { s: "Utrujen(a) sem. Dajem več, kot dobim.", q: "Kje izgubljaš energijo in zakaj?",
      a: ["karierno-opolnomocenje-nehaj-dajati-vec-kot-prejemas", "kje-izgubljas-energijo-prepoznaj-karierne-vzorce", "izgorelost-na-delovnem-mestu-prepoznaj-znake-pravi-cas"] },
    { s: "Vem, kaj bi rad(a), a me je strah.", q: "Kaj je strah in kaj resnični notranji NE?",
      a: ["intuicija-v-karieri-strah-ali-resnicni-notranji-ne", "karierni-naslednji-korak-kako-se-odlociti-kljub-strahu", "karierna-sprememba-brez-financnega-strahu-varen-premik"] },
    { s: "Na papirju je vse v redu, a to nisem jaz.", q: "Kaj si zares želiš, ko odmisliš pričakovanja drugih?",
      a: ["financni-uspeh-brez-izpolnitve-kaj-storiti-zdaj", "karierna-identiteta-kdo-si-brez-naziva", "karierna-identiteta-kdo-si-zunaj-svojega-delovnega-naziva"] },
    { s: "Iščem službo, pa nič ne prime.", q: "Kaj je tvoja zgodba, ki se skriva za CV-jem?",
      a: ["iskanje-zaposlitve-2026-zakaj-klasicni-pristop-ne-deluje", "iskanje-zaposlitve-kaj-poleg-cv-ja-resnicno-steje", "zaposlitveni-razgovor-brez-maske-nastopi-kot-ti"] },
    { s: "Ne vem, kaj hočem. Vem le, da ne tako.", q: "Kdo si danes?",
      a: ["karierna-kriza-si-le-na-razpotju-ne-izgubljen", "kdo-sem-danes-7-vprasanj-za-naslednji-karierni-korak", "samospoznavanje-v-karieri-kdo-si-danes"] }
  ];

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function byId(id) { return document.getElementById(id); }
  function norm(s) { return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }

  function row(a) {
    return '<a href="' + BASE + esc(a.u) + '/"><span><span class="t">' + esc(a.t) + '</span><span class="e">' + esc(a.e) + '</span></span><span class="th">' + esc(THEMES[a.th] || "") + '</span><i aria-hidden="true">→</i></a>';
  }

  var articles = fetch("assets/articles.json").then(function (r) { return r.json(); });

  // Kje si zdaj?
  var picker = byId("picker");
  function menu() {
    picker.innerHTML = "<h2>Kje si zdaj?</h2><p>Izberi, kar je najbližje, ali napiši po svoje.</p>" +
      '<div class="picks">' + PATHS.map(function (p, i) { return '<button class="pick" type="button" data-p="' + i + '">' + esc(p.s) + '<span aria-hidden="true">→</span></button>'; }).join("") + "</div>" +
      '<form class="free"><label class="vh" for="free-q">Tvoje vprašanje</label><input id="free-q" maxlength="1500" placeholder="Kaj te trenutno muči pri delu?" autocomplete="off"><button class="btn teal" type="submit">Vprašaj</button></form>';
    picker.querySelector("form").addEventListener("submit", function (e) {
      e.preventDefault();
      var v = byId("free-q").value;
      if (v.trim()) { FSChat.open(); FSChat.ask(v); byId("free-q").value = ""; }
    });
  }
  function show(p) {
    articles.then(function (list) {
      var links = p.a.map(function (u) {
        var a = list.filter(function (x) { return x.u === u; })[0];
        return a ? '<li><a href="' + BASE + esc(u) + '/">' + esc(a.t) + "</a></li>" : "";
      }).join("");
      picker.innerHTML = '<div class="res"><button class="back" type="button">← Nazaj</button><p class="q">' + esc(p.q) + "</p><h3>Za branje</h3><ul>" + links + "</ul>" +
        '<div class="row-btns"><button class="btn teal" type="button" id="go-on">Nadaljuj v klepetu</button><a class="btn ghost" href="#sodelovanje">Pogovor z Anjo</a></div></div>';
      byId("go-on").setAttribute("data-ask", "Prepoznam se v tem stavku: »" + p.s + "« Pomagaj mi razmisliti, začni z vprašanjem: " + p.q);
    });
  }
  if (picker) {
    menu();
    picker.addEventListener("click", function (e) {
      var b = e.target.closest("[data-p]");
      if (b) show(PATHS[+b.getAttribute("data-p")]);
      else if (e.target.closest(".back")) menu();
    });
  }

  // Newest articles on the home page.
  var latest = byId("latest");
  if (latest) articles.then(function (list) { latest.innerHTML = list.slice(0, 6).map(row).join(""); });

  // The library page.
  var all = byId("all");
  if (all) {
    var filters = byId("filters"), input = byId("q"), count = byId("count"), theme = "";
    [""].concat(Object.keys(THEMES)).forEach(function (k) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "chip"; b.textContent = THEMES[k] || "Vse";
      b.setAttribute("aria-pressed", String(!k));
      b.addEventListener("click", function () {
        theme = k;
        filters.querySelectorAll(".chip").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        draw();
      });
      filters.appendChild(b);
    });
    var items = [];
    function draw() {
      var words = norm(input.value).split(/\s+/).filter(Boolean);
      var hits = items.filter(function (a) {
        if (theme && a.th !== theme) return false;
        var text = norm(a.t + " " + a.e);
        return words.every(function (w) { return text.indexOf(w) >= 0; });
      });
      all.innerHTML = hits.map(row).join("");
      count.textContent = hits.length === 1 ? "1 članek" : hits.length === 2 ? "2 članka" : hits.length && hits.length < 5 ? hits.length + " članki" : hits.length + " člankov";
    }
    input.addEventListener("input", draw);
    articles.then(function (list) { items = list; draw(); });
  }
})();
