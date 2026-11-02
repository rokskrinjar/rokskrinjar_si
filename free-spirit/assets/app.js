// Free Spirit concept: mirror questions, "Kje si zdaj?", and the article library (assets/articles.json).
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
  var QUESTIONS = ["Kdo sem danes?", "Kaj mi je danes pomembno?", "Kako želim živeti in delati?", "Česa nisem več pripravljen(a) izdati pri sebi?", "Kdo postajam skozi način, kako delam?"];
  var calm = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function byId(id) { return document.getElementById(id); }
  function norm(s) { return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }

  var mirror = byId("mirror-q");
  if (mirror && !calm) {
    var i = 0;
    setInterval(function () {
      mirror.style.opacity = 0;
      setTimeout(function () { i = (i + 1) % QUESTIONS.length; mirror.textContent = QUESTIONS[i]; mirror.style.opacity = 1; }, 900);
    }, 5200);
  }

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });
  } else document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });

  function card(a) {
    return '<a class="card" href="' + BASE + esc(a.u) + '/"><span class="t">' + esc(a.t) + '</span><span class="e">' + esc(a.e) + '</span><span class="th">' + esc(THEMES[a.th] || "") + "</span></a>";
  }

  var articles = fetch("assets/articles.json").then(function (r) { return r.json(); });

  // Kje si zdaj?
  var paths = byId("paths"), answer = byId("answer");
  if (paths) {
    PATHS.forEach(function (p, n) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "path"; b.textContent = p.s; b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", function () {
        paths.querySelectorAll(".path").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        show(p);
      });
      paths.appendChild(b);
    });
  }
  function show(p) {
    articles.then(function (list) {
      var links = p.a.map(function (u) {
        var a = list.filter(function (x) { return x.u === u; })[0];
        return a ? '<li><a href="' + BASE + esc(u) + '/">' + esc(a.t) + "</a></li>" : "";
      }).join("");
      answer.innerHTML =
        '<div><p class="q">' + esc(p.q) + '</p><div class="row-btns"><button class="btn solid" type="button" id="go-on">Nadaljuj z Ogledalom</button>' +
        '<a class="btn" href="#sodelovanje">Pogovor z Anjo</a></div></div>' +
        "<div><h3>Za branje</h3><ul>" + links + "</ul></div>";
      answer.hidden = false;
      byId("go-on").setAttribute("data-ask", "Prepoznam se v tem stavku: »" + p.s + "« Pomagaj mi razmisliti, začni z vprašanjem: " + p.q);
      if (answer.getBoundingClientRect().bottom > window.innerHeight) answer.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "center" });
    });
  }

  // Newest articles on the home page.
  var latest = byId("latest");
  if (latest) articles.then(function (list) { latest.innerHTML = list.slice(0, 6).map(card).join(""); });

  // The library page.
  var all = byId("all");
  if (all) {
    var filters = byId("filters"), input = byId("q"), count = byId("count"), theme = "";
    Object.keys(THEMES).concat([""]).sort(function (a, b) { return a ? (b ? 0 : 1) : -1; }).forEach(function (k) {
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
      all.innerHTML = hits.map(card).join("");
      count.textContent = hits.length === 1 ? "1 članek" : hits.length === 2 ? "2 članka" : hits.length < 5 ? hits.length + " članki" : hits.length + " člankov";
    }
    input.addEventListener("input", draw);
    articles.then(function (list) { items = list; draw(); });
  }
})();
