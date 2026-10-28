// Solis DIY economics: market sizing per country and a three-year P&L for the DIY channel.
// Pure functions plus the page renderer. Data in assets/economics.json; all money excl. VAT unless noted.
(function () {
  "use strict";
  var D, scen = "base", over = {};

  // ---------- Model ----------
  function A(k) { return k in over ? over[k] : D.assumptions[k].v; }

  function market(c) {
    var timber = c.diy * c.timberShare;               // DIY spend on timber and wood products, € / year
    var fit = timber * A("productFit");               // the part Solis' products cover
    var sam = fit * c.reach * A("onlineReady");       // reachable regions × buyers ready to order timber online
    return { timber: timber, fit: fit, sam: sam };
  }

  function year(y) {
    var S = D.scenarios[scen], rows = [], m3 = 0, rev = 0, samTot = 0, orders = 0, delivRev = 0, delivCost = 0;
    D.countries.forEach(function (c) {
      var mk = market(c), active = y >= c.from;
      var share = active ? S.share[Math.min(y - c.from, 2)] * (c.id === "si" ? A("homeBoost") : 1) * (over.shareMult || 1) : 0;
      var spend = mk.sam * share;                       // customers' spend we capture, at their retail prices
      var vol = spend / (c.retail / (1 + c.vat));       // m³ that spend would buy at retail (net)
      var n = vol / A("m3PerOrder");
      samTot += active ? mk.sam : 0;
      m3 += vol; orders += n;
      delivRev += n * c.delivCharged; delivCost += n * c.deliv;
      rows.push({ c: c, mk: mk, share: share, vol: vol, orders: n, active: active });
    });
    var timberRev = m3 * A("priceNet");
    var cutRev = orders * A("cutsPerOrder") * A("cutFee") / (1 + D.vat);
    var extraRev = orders * A("extrasPerOrder");
    rev = timberRev + cutRev + delivRev + extraRev;
    var cogsTimber = m3 * (A("wholesale") + A("processing"));
    var cogsExtras = extraRev * A("extrasCost");
    var labour = orders * A("minutesPerOrder") / 60 * A("labourHour");
    var packing = orders * A("packing");
    var delivery = delivCost;
    var payment = rev * (1 + D.vat) * A("paymentFee");
    var returns = rev * A("returns");
    var contrib = rev - cogsTimber - cogsExtras - labour - packing - delivery - payment - returns;
    var newCust = orders * (1 - A("repeat"));
    var marketing = newCust * A("cac") + A("content");
    var staff = S.fte[y - 1] * A("fteCost");
    var platform = A("platform") + orders * A("aiPerOrder");
    var capex = y <= 3 ? A("build") / 3 : 0;
    var ebit = contrib - marketing - staff - platform - capex;
    return {
      y: y, rows: rows, sam: samTot, m3: m3, orders: orders, rev: rev, timberRev: timberRev, cutRev: cutRev, delivRev: delivRev, extraRev: extraRev,
      cogsTimber: cogsTimber, cogsExtras: cogsExtras, labour: labour, packing: packing, delivery: delivery, payment: payment, returns: returns,
      contrib: contrib, marketing: marketing, staff: staff, platform: platform, capex: capex, ebit: ebit,
      wholesaleOnly: m3 * A("wholesale"), aov: orders ? rev * (1 + D.vat) / orders : 0
    };
  }

  // ---------- Rendering ----------
  var L = function () { return SD.lang(); };
  function tr(o) { return SD.tr(o); }
  function eur(n) { return SD.eur(n, 0); }
  function k(n) { return Math.abs(n) >= 1e9 ? SD.num(n / 1e9, n >= 1e10 ? 0 : 2) + (L() === "sl" ? " mrd €" : " bn €") : Math.abs(n) >= 1e6 ? SD.num(n / 1e6, 1) + (L() === "sl" ? " mio €" : " M €") : Math.abs(n) >= 1e3 ? SD.num(n / 1e3, 0) + " k €" : eur(n); }
  function pct(n, d) { return SD.num(n * 100, d == null ? 1 : d) + " %"; }
  function $(id) { return document.getElementById(id); }

  function renderMarket() {
    var l = L(), tot = { diy: 0, timber: 0, sam: 0, pop: 0 };
    var rows = D.countries.map(function (c) {
      var mk = market(c);
      tot.diy += c.diy; tot.timber += mk.timber; tot.sam += mk.sam; tot.pop += c.pop;
      return "<tr><td><b>" + tr(c.name) + "</b><br><span class='muted'>" + tr(c.note) + "</span></td>" +
        "<td class='num'>" + SD.num(c.pop, 1) + " M</td><td class='num'>" + k(c.diy) + "</td><td class='num'>" + pct(c.timberShare, 0) + "</td>" +
        "<td class='num'>" + k(mk.timber) + "</td><td class='num'>" + pct(c.reach, 0) + "</td><td class='num'><b>" + k(mk.sam) + "</b></td>" +
        "<td class='num'>" + (l === "sl" ? "leto " : "year ") + c.from + "</td></tr>";
    }).join("");
    $("mkt").innerHTML = "<thead><tr><th>" + (l === "sl" ? "Trg" : "Market") + "</th><th>" + (l === "sl" ? "Prebivalci" : "People") + "</th><th>" + (l === "sl" ? "Trg DIY" : "DIY market") +
      "</th><th>" + (l === "sl" ? "Delež lesa" : "Wood share") + "</th><th>" + (l === "sl" ? "Les v DIY" : "DIY timber") + "</th><th>" + (l === "sl" ? "Doseg" : "Reach") +
      "</th><th>SAM</th><th>" + (l === "sl" ? "Vstop" : "Entry") + "</th></tr></thead><tbody>" + rows +
      "<tr><td><b>" + (l === "sl" ? "Skupaj" : "Total") + "</b></td><td class='num'>" + SD.num(tot.pop, 1) + " M</td><td class='num'>" + k(tot.diy) + "</td><td></td><td class='num'>" + k(tot.timber) +
      "</td><td></td><td class='num'><b>" + k(tot.sam) + "</b></td><td></td></tr></tbody>";
    $("k-eu").textContent = k(D.eu.diy);
    $("k-near").textContent = k(tot.timber);
    $("k-sam").textContent = k(tot.sam);
  }

  function renderMap() {
    // Cities placed by compass bearing and road distance from Straža (schematic, not a map projection).
    var cx = 380, cy = 250, s = 0.42, out = [];
    [200, 400, 600].forEach(function (r) {
      out.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + r * s + '" fill="none" stroke="var(--line)" stroke-dasharray="3 5"/>');
      out.push('<text x="' + cx + '" y="' + (cy + r * s + 14) + '" class="mapt" text-anchor="middle">' + r + ' km</text>');
    });
    var max = Math.max.apply(null, D.cities.map(function (c) { return c.weight; }));
    D.cities.forEach(function (c) {
      var b = c.bearing * Math.PI / 180, x = cx + c.km * s * Math.sin(b), y = cy - c.km * s * Math.cos(b), r = 4 + 9 * Math.sqrt(c.weight / max);
      var col = c.from === 1 ? "forest" : c.from === 2 ? "sage" : c.from === 3 ? "yellow-2" : "line";
      var lx = c.pos === "l" ? x - r - 4 : c.pos === "r" ? x + r + 4 : x, ly = c.pos === "t" ? y - r - 5 : c.pos === "b" ? y + r + 13 : y + 4;
      var anchor = c.pos === "l" ? "end" : c.pos === "r" ? "start" : "middle";
      out.push('<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + r.toFixed(1) + '" fill="var(--' + col + ')" opacity=".9"/>');
      out.push('<text x="' + lx.toFixed(1) + '" y="' + ly.toFixed(1) + '" class="mapl" text-anchor="' + anchor + '">' + c.name + " · " + c.km + " km</text>");
    });
    out.push('<rect x="' + (cx - 7) + '" y="' + (cy - 7) + '" width="14" height="14" fill="var(--yellow)" stroke="var(--forest-2)" stroke-width="2" transform="rotate(45 ' + cx + " " + cy + ')"/>');
    out.push('<text x="' + (cx + 12) + '" y="' + (cy + 22) + '" class="mapl" style="font-weight:800">Straža</text>');
    $("map").innerHTML = out.join("");
  }

  function renderScenario() {
    var l = L(), Y = [1, 2, 3, 4, 5].map(year), y3 = Y[4];
    document.querySelectorAll("[data-scen]").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.scen === scen ? "true" : "false"); });
    $("scen-note").textContent = tr(D.scenarios[scen].note);
    $("t-rev").textContent = k(y3.rev);
    $("t-ebit").textContent = k(y3.ebit);
    $("t-ebit").style.color = y3.ebit < 0 ? "var(--warn)" : "";
    $("t-m3").textContent = SD.num(y3.m3, 0) + " m³";
    $("t-orders").textContent = SD.num(y3.orders, 0);
    $("t-margin").textContent = y3.rev ? pct(y3.ebit / y3.rev, 0) : "–";
    $("t-share").textContent = pct(y3.m3 / A("logOutput"), 2);
    var cum = 0, be = null;
    Y.forEach(function (r) { cum += r.ebit; if (be === null && cum >= 0) be = r.y; });
    $("t-be").textContent = be ? (l === "sl" ? "v " + be + ". letu" : "in year " + be) : (l === "sl" ? "po 5. letu" : "after year 5");

    var lines = [
      ["rev", { sl: "Prihodki (brez DDV)", en: "Revenue (excl. VAT)" }, "rev", 1],
      ["", { sl: "les", en: "timber" }, "timberRev"], ["", { sl: "razrez", en: "cutting" }, "cutRev"], ["", { sl: "dostava (zaračunana)", en: "delivery (charged)" }, "delivRev"], ["", { sl: "peleti in ostanki", en: "pellets and by-products" }, "extraRev"],
      ["neg", { sl: "Les po ceni na debelo + obdelava", en: "Timber at wholesale value + processing" }, "cogsTimber"],
      ["neg", { sl: "Nabava dodatkov", en: "Cost of by-products" }, "cogsExtras"],
      ["neg", { sl: "Razrez, pakiranje (delo)", en: "Cutting and packing labour" }, "labour"],
      ["neg", { sl: "Embalaža", en: "Packaging" }, "packing"],
      ["neg", { sl: "Dostava (strošek)", en: "Delivery (cost)" }, "delivery"],
      ["neg", { sl: "Plačilne provizije", en: "Payment fees" }, "payment"],
      ["neg", { sl: "Reklamacije, poškodbe", en: "Returns and damage" }, "returns"],
      ["sub", { sl: "Prispevek", en: "Contribution" }, "contrib", 1],
      ["neg", { sl: "Marketing in vsebine", en: "Marketing and content" }, "marketing"],
      ["neg", { sl: "Ekipa (prodaja, podpora, logistika)", en: "Team (sales, support, logistics)" }, "staff"],
      ["neg", { sl: "Platforma, gostovanje, AI", en: "Platform, hosting, AI" }, "platform"],
      ["neg", { sl: "Razvoj (amortizacija 3 leta)", en: "Build (3-year amortisation)" }, "capex"],
      ["tot", { sl: "Dobiček kanala (EBIT)", en: "Channel profit (EBIT)" }, "ebit", 1]
    ];
    var head = "<thead><tr><th></th>" + Y.map(function (r) { return "<th class='num'>" + (l === "sl" ? r.y + ". leto" : "Year " + r.y) + "</th>"; }).join("") + "</tr></thead>";
    var ops = "<tr><td class='muted'>" + (l === "sl" ? "Trgi" : "Markets") + "</td>" + Y.map(function (r) {
      return "<td class='num muted'>" + r.rows.filter(function (x) { return x.active; }).map(function (x) { return x.c.id.toUpperCase(); }).join(" ") + "</td>";
    }).join("") + "</tr><tr><td class='muted'>" + (l === "sl" ? "Naročila · m³" : "Orders · m³") + "</td>" + Y.map(function (r) {
      return "<td class='num muted'>" + SD.num(r.orders, 0) + " · " + SD.num(r.m3, 0) + "</td>";
    }).join("") + "</tr>";
    var body = lines.map(function (ln) {
      var cls = ln[0] === "tot" ? " class='pl-tot'" : ln[0] === "sub" ? " class='pl-sub'" : ln[0] === "" ? " class='pl-in'" : "";
      return "<tr" + cls + "><td>" + (ln[0] === "neg" ? "− " : "") + tr(ln[1]) + "</td>" + Y.map(function (r) {
        var v = r[ln[2]], neg = ln[0] === "neg";
        return "<td class='num'" + (ln[0] === "tot" && v < 0 ? " style='color:var(--warn)'" : "") + ">" + (Math.abs(v) < 0.5 ? "–" : (neg ? "−" : "") + k(v)) + "</td>";
      }).join("") + "</tr>";
    }).join("");
    $("pl").innerHTML = head + "<tbody>" + ops + body + "</tbody>";
  }

  function renderSliders() {
    var l = L();
    $("sens").innerHTML = D.sliders.map(function (s) {
      var v = s.id === "shareMult" ? (over.shareMult || 1) : A(s.id);
      return '<div class="param"><label for="s-' + s.id + '">' + tr(s.label) + "<output>" + fmt(s, v) + '</output></label><input type="range" id="s-' + s.id + '" data-s="' + s.id + '" min="' + s.min + '" max="' + s.max + '" step="' + s.step + '" value="' + v + '"></div>';
    }).join("") + '<button type="button" class="btn ghost small" id="reset">' + (l === "sl" ? "Ponastavi" : "Reset") + "</button>";
    document.querySelectorAll("#sens input").forEach(function (r) {
      r.addEventListener("input", function () {
        var s = D.sliders.find(function (x) { return x.id === r.dataset.s; });
        over[s.id] = Number(r.value);
        r.previousElementSibling.querySelector("output").textContent = fmt(s, Number(r.value));
        renderMarket(); renderScenario();
      });
    });
    $("reset").addEventListener("click", function () { over = {}; renderAll(); });
  }
  function fmt(s, v) {
    if (s.f === "pct") return pct(v, 0);
    if (s.f === "x") return "× " + SD.num(v, 2);
    if (s.f === "eur") return SD.eur(v, 0);
    if (s.f === "m3") return SD.num(v, 2) + " m³";
    return SD.num(v, 0);
  }

  function renderAssumptions() {
    var l = L();
    $("assume").innerHTML = "<thead><tr><th>" + (l === "sl" ? "Predpostavka" : "Assumption") + "</th><th class='num'>" + (l === "sl" ? "Vrednost" : "Value") + "</th><th>" + (l === "sl" ? "Podlaga" : "Basis") + "</th></tr></thead><tbody>" +
      Object.keys(D.assumptions).map(function (key) {
        var a = D.assumptions[key];
        return "<tr><td>" + tr(a.label) + "</td><td class='num'>" + fmtA(a) + "</td><td class='muted'>" + tr(a.src) + "</td></tr>";
      }).join("") + "</tbody>";
  }
  function fmtA(a) {
    if (a.f === "pct") return pct(a.v, a.v < 0.1 ? 1 : 0);
    if (a.f === "eur") return SD.eur(a.v, a.v < 10 ? 2 : 0);
    if (a.f === "x") return "× " + SD.num(a.v, 2);
    return SD.num(a.v, a.v < 10 ? 2 : 0) + (a.unit ? " " + a.unit : "");
  }

  function renderReading() {
    $("reading").innerHTML = D.reading[L()].map(function (r) { return "<div><h3>" + SD.esc(r[0]) + "</h3><p>" + SD.esc(r[1]) + "</p></div>"; }).join("");
    $("src").innerHTML = D.sources.map(function (s) { return "<li>" + SD.esc(s) + "</li>"; }).join("");
  }

  function renderAll() { renderMarket(); renderMap(); renderScenario(); renderSliders(); renderAssumptions(); renderReading(); }

  document.querySelectorAll("[data-scen]").forEach(function (b) { b.addEventListener("click", function () { scen = b.dataset.scen; renderScenario(); }); });
  document.addEventListener("langchange", function () { if (D) renderAll(); });
  document.getElementById("logo").innerHTML = SD.rings(100, 6, 3);
  fetch("assets/economics.json").then(function (r) { return r.json(); }).then(function (d) { D = d; renderAll(); });
  window.SolisEcon = { year: year, market: market, data: function () { return D; } };
})();
