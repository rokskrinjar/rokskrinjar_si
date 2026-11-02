// Data page: the sums and the reconciliation list, computed from catalog.json in the browser.
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); }, esc = WK.esc;
  var TIP = { kosi: "Število kosov", sifra: "Šifre", opis: "Opis izdelka", ime: "Poimenovanje" };
  WK.load().then(function (C) {
    var ok = 0;
    var rows = C.sestavi.map(function (a) {
      var sum = a.seti.reduce(function (t, x) { return t + x[1]; }, 0), good = sum === a.kosov;
      if (good) ok++;
      return '<tr><td><a href="./?a=' + a.id + '">' + esc(a.naziv) + "</a></td><td>" + WK.source(C, a.stran) + '</td><td class="r">' + a.seti.length + '</td><td class="r">' + a.kosov + '</td><td class="r">' + sum + "</td><td>" + (good ? '<span class="pill ok">izide se</span>' : '<span class="pill warn">razlika ' + (sum - a.kosov) + "</span>") + "</td></tr>";
    });
    $("sums").innerHTML = '<thead><tr><th>Sestav</th><th>Vir</th><th class="r">Setov</th><th class="r">Naslov</th><th class="r">Vsota</th><th></th></tr></thead><tbody>' + rows.join("") + "</tbody>";
    var codes = {};
    C.vozicki.forEach(function (v) { v.barve.concat(v.dodatki, v.rezervni_deli ? v.rezervni_deli.deli : []).forEach(function (b) { codes[b.art.replace(/\s/g, "")] = 1; }); });
    C.seti.forEach(function (s) { codes[s.id] = 1; (s.vsebina || []).forEach(function (r) { codes[r.a] = 1; }); });
    $("kpis").innerHTML =
      "<div><b>" + C.vir.strani + "</b><span>strani prebranih</span></div>" +
      "<div><b>" + Object.keys(codes).length + "</b><span>šifer in razponov šifer preverjenih proti PDF-ju</span></div>" +
      "<div><b>" + ok + "/" + C.sestavi.length + "</b><span>sestavov, kjer se kosi izidejo</span></div>" +
      "<div><b>" + C.usklajevanje.length + "</b><span>mest za uskladitev</span></div>";
    var cur = "";
    function list() {
      $("list").innerHTML = "<thead><tr><th>Kje</th><th>Kaj je opaziti</th><th>Kaj predlagamo</th><th>Vir</th></tr></thead><tbody>" +
        C.usklajevanje.filter(function (u) { return !cur || u.tip === cur; }).map(function (u) {
          return "<tr><td><b>" + esc(u.kaj) + '</b><br><span class="tag">' + TIP[u.tip] + "</span></td><td>" + esc(u.opis) + "</td><td>" + esc(u.predlog) + "</td><td>" + WK.source(C, u.stran) + "</td></tr>";
        }).join("") + "</tbody>";
    }
    var f = $("filters");
    f.innerHTML = '<button type="button" data-t="" aria-pressed="true">Vse</button>' + Object.keys(TIP).map(function (k) { return '<button type="button" data-t="' + k + '" aria-pressed="false">' + TIP[k] + "</button>"; }).join("");
    f.addEventListener("click", function (e) {
      var t = e.target.closest("button");
      if (!t) return;
      f.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", b === t); });
      cur = t.dataset.t;
      list();
    });
    list();
  });
})();
