// Assistant page: the fictional owner's cost statement, and the page context Hiško receives.
(function () {
  "use strict";
  var D, cur = 1;

  function total(m) { return m.lines.reduce(function (s, l) { return s + l.v; }, 0); }

  function render() {
    var m = D.months[cur], prev = D.months[cur - 1];
    document.getElementById("st-unit").textContent = D.unit.label + " · " + AK.num(D.unit.area, 1) + " m² · " + D.unit.persons + " osebi";
    document.getElementById("st-building").textContent = " " + D.building.name + ", " + D.building.address;
    document.getElementById("st-months").innerHTML = D.months.map(function (x, i) {
      return '<button type="button" data-m="' + i + '" aria-pressed="' + (i === cur) + '">' + x.label.split(" ")[0] + "</button>";
    }).join("");
    document.querySelectorAll("#st-months button").forEach(function (b) { b.addEventListener("click", function () { cur = +b.dataset.m; render(); }); });
    var rows = m.lines.map(function (l) {
      var p = prev && prev.lines.find(function (x) { return x.k === l.k; });
      var d = p ? l.v - p.v : 0;
      var delta = Math.abs(d) >= 0.01 ? ' <span class="delta ' + (d > 0 ? "up" : "down") + '">' + (d > 0 ? "+" : "−") + AK.eur(Math.abs(d)) + "</span>" : "";
      return "<tr><td>" + AK.esc(l.t) + '<br><span class="fine">' + AK.esc(l.key) + '</span></td><td class="r">' + AK.eur(l.v) + delta + "</td></tr>";
    }).join("");
    var t = total(m), dt = prev ? t - total(prev) : 0;
    document.getElementById("st-table").innerHTML =
      '<thead><tr><th>Razdelilnik · ' + AK.esc(m.label) + '</th><th class="r">Znesek</th></tr></thead><tbody>' + rows + "</tbody>" +
      '<tfoot><tr><td>Skupaj za plačilo</td><td class="r">' + AK.eur(t) +
      (prev ? ' <span class="delta ' + (dt > 0 ? "up" : "down") + '">' + (dt > 0 ? "+" : "−") + AK.eur(Math.abs(dt)) + "</span>" : "") + "</td></tr></tfoot>";
    document.getElementById("st-fund").innerHTML = "<span>Rezervni sklad stavbe na dan " + AK.esc(D.building.fund.asOf) + "</span><b class=\"num\">" + AK.eur(D.building.fund.balance) + "</b>";
    document.getElementById("st-notes").textContent = (m.notes || []).join(" ") + " Načrt: " + D.building.fund.plan;
  }

  // What Hiško sees: the building, the unit and both months, so it can compare.
  window.AktivaChatContext = function () {
    if (!D) return "";
    var b = D.building, u = D.unit;
    var out = ["Izmišljena demo stavba: " + b.name + ", " + b.address + "; " + b.units + " stanovanj, " + b.floors + " nadstropij, " + b.area + " m², zgrajena " + b.built + "; " + b.features.join(", ") + ".",
      "Rezervni sklad stavbe: " + AK.eur(b.fund.balance) + " na dan " + b.fund.asOf + ". Načrt: " + b.fund.plan,
      "Enota uporabnika: " + u.label + ", " + u.area + " m², " + u.persons + " osebi, solastniški delež " + u.share + ".",
      "Uporabnik gleda mesec: " + D.months[cur].label + "."];
    D.months.forEach(function (m) {
      out.push("Razdelilnik " + m.label + " (skupaj " + AK.eur(total(m)) + "): " + m.lines.map(function (l) { return l.t + " [" + l.key + "] " + AK.eur(l.v); }).join("; ") + "." + (m.notes ? " Opombe: " + m.notes.join(" ") : ""));
    });
    return out.join("\n");
  };

  AK.loadDemo().then(function (d) { D = d; cur = D.months.length - 1; render(); });
})();
