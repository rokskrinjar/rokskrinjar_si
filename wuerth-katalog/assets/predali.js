// Drawer builder: pick a trolley, add foam sets, see what fits. State lives in the URL so a set-up can be shared.
(function () {
  "use strict";
  var C, $ = function (id) { return document.getElementById(id); }, esc = WK.esc;
  var st = { v: "c7", r: "", s: [], grp: "", from: "" }, q = "";

  function readHash() {
    var h = new URLSearchParams(location.hash.slice(1));
    if (h.get("a") && C.asmBy[h.get("a")]) {
      var a = C.asmBy[h.get("a")];
      st.v = a.voz; st.r = a.barva || ""; st.from = a.id;
      st.s = a.seti.map(function (x) { return x[0].replace(/\s/g, ""); });
      return;
    }
    if (h.get("v") && C.vozBy[h.get("v")]) st.v = h.get("v");
    if (h.get("r")) st.r = h.get("r");
    if (h.get("s")) st.s = h.get("s").split(",").filter(function (id) { return C.setBy[id]; });
  }
  function writeHash() {
    var v = "v=" + st.v + (st.r ? "&r=" + st.r : "") + (st.s.length ? "&s=" + st.s.join(",") : "");
    history.replaceState(null, "", "#" + v);
  }
  function usable() { return C.vozicki.filter(function (v) { return v.predal; }); }

  function renderDrawers() {
    var v = C.vozBy[st.v], p = WK.pack(C, v, st.s);
    var html = "";
    p.drawers.forEach(function (bays, i) {
      html += '<div class="drawer"><b>' + (i + 1) + '</b><div class="bays">';
      bays.forEach(function (b) {
        html += '<div class="bay">';
        b.items.forEach(function (s) {
          html += '<button type="button" class="foamset" style="grid-column:span ' + (s.modul / 2) + '" data-rm="' + s.id + '" title="' + esc(s.naziv) + ' (odstrani)"><b>' + esc(s.naziv) + "</b><span>" + s.art.slice(-3) + "</span></button>";
        });
        for (var k = 0; k < b.free / 2; k++) html += '<span class="slot"></span>';
        html += "</div>";
      });
      html += "</div></div>";
    });
    $("drawers").innerHTML = html;
    var pieces = st.s.reduce(function (t, id) { return t + (C.setBy[id].kosov || 0); }, 0), pct = Math.round(p.units / p.cap * 100);
    var free = v.predali - p.used;
    $("sum").innerHTML =
      '<div class="facts" style="grid-template-columns:1fr 1fr;margin-bottom:10px"><div><b>' + pieces + "</b><span>kosov orodja</span></div><div><b>" + p.used + "/" + v.predali + '</b><span>predalov s peno</span></div></div>' +
      '<div class="meter" role="img" aria-label="Zapolnjeno ' + pct + ' %"><i style="width:' + pct + '%"></i></div><p class="fine" style="margin:4px 0 10px">Zapolnjeno ' + pct + " % kapacitete pene" + (free > 0 && st.s.length ? " · še " + free + (free === 1 ? " prost predal" : free < 5 ? " prosti predali" : " prostih predalov") : "") + "</p>" +
      (p.over.length ? '<p class="pill warn" style="white-space:normal">Ne gre več v voziček: ' + p.over.map(function (s) { return esc(s.naziv); }).join(", ") + "</p>" : "");
    $("list").innerHTML = st.s.length ? "<table><tbody>" + st.s.map(function (id) { var s = C.setBy[id]; return "<tr><td>" + esc(s.naziv) + '<br><span class="art">' + s.art + '</span></td><td class="r">' + (s.kosov || "") + "</td></tr>"; }).join("") + "</tbody></table>" : '<p class="muted" style="margin:0">Dodajte sete iz seznama ali naložite sestav.</p>';
    $("export").disabled = $("copy").disabled = $("tolead").disabled = !st.s.length;
    $("tips").innerHTML = suggestions(p);
    writeHash();
  }

  // Sets that the catalogue's own assortments use most and this set-up does not have yet.
  function suggestions(p) {
    if (!st.s.length) return "";
    var v = C.vozBy[st.v], freq = {};
    C.sestavi.forEach(function (a) { a.seti.forEach(function (x) { var id = x[0].replace(/\s/g, ""); freq[id] = (freq[id] || 0) + 1; }); });
    var have = st.s.reduce(function (o, id) { o[C.setBy[id].skupina] = 1; return o; }, {});
    var free = p.cap - p.units;
    var list = Object.keys(freq).filter(function (id) { var s = C.setBy[id]; return st.s.indexOf(id) < 0 && s.modul * 1 <= free && !have[s.skupina]; })
      .sort(function (a, b) { return freq[b] - freq[a]; }).slice(0, 3);
    if (!list.length) list = Object.keys(freq).filter(function (id) { return st.s.indexOf(id) < 0 && C.setBy[id].modul <= free; }).sort(function (a, b) { return freq[b] - freq[a]; }).slice(0, 3);
    if (!list.length) return "";
    return '<h3 style="margin-top:14px">Pogosto zraven</h3><p class="fine" style="margin-bottom:6px">Seti iz skupin, ki jih še nimate, po tem, kako pogosti so v sestavih iz kataloga. Pravilo, ne AI.</p><div class="lib" style="max-height:none">' +
      list.map(function (id) { var s = C.setBy[id]; return '<div class="row">' + WK.moduleIcon(s.modul) + '<div><div class="tt">' + esc(s.naziv) + '</div><div class="sub">v ' + freq[id] + " od 12 sestavov</div></div><button class=\"btn small\" type=\"button\" data-add=\"" + id + '">Dodaj</button></div>'; }).join("") + "</div>";
  }

  function renderLib() {
    var words = q.toLowerCase();
    var list = C.seti.filter(function (s) {
      return (!st.grp || s.skupina === st.grp) && (!words || (s.naziv + " " + s.art).toLowerCase().indexOf(words) >= 0) && !/^0955/.test(s.art);
    });
    $("lib").innerHTML = list.length ? list.map(function (s) {
      var n = st.s.indexOf(s.id) >= 0;
      return '<div class="row">' + WK.moduleIcon(s.modul) + '<div><div class="tt">' + esc(s.naziv) + '</div><div class="sub">' + (s.kosov ? s.kosov + " kosov · " : "") + '<span class="art">' + s.art + '</span></div></div><button class="btn small" type="button" data-' + (n ? "rm" : "add") + '="' + s.id + '">' + (n ? "Odstrani" : "Dodaj") + "</button></div>";
    }).join("") : '<p class="muted">Ni setov s tem imenom.</p>';
  }
  function renderHead() {
    var v = C.vozBy[st.v];
    $("pic").innerHTML = WK.drawing(v, st.r || v.barve[0].ral, { h: 170, ref: 1055 });
    $("vinfo").innerHTML = "<b>" + esc(v.naziv) + '</b><br><span class="fine">' + v.predali + " predalov · " + v.polja + (v.polja === 1 ? " polje" : v.polja === 2 ? " polji" : " polja") + " pene v predalu · notranjost " + v.predal[0] + " × " + v.predal[1] + " mm · " + WK.source(C, v.stran) + "</span>";
    $("vsel").value = st.v;
    $("asel").innerHTML = '<option value="">Naloži sestav iz kataloga …</option>' + C.sestavi.filter(function (a) { return C.vozBy[a.voz].predal; }).map(function (a) { return '<option value="' + a.id + '"' + (a.id === st.from ? " selected" : "") + ">" + esc(a.naziv) + "</option>"; }).join("");
  }
  function all() { renderHead(); renderDrawers(); renderLib(); }

  function csv() {
    var v = C.vozBy[st.v], ral = st.r || v.barve[0].ral, b = v.barve.filter(function (x) { return x.ral === ral; })[0] || v.barve[0];
    var rows = [["Šifra", "Naziv", "Kosov v setu"], [b.art, "Voziček " + v.naziv + " (" + WK.RAL[b.ral][1] + ")", ""]].concat(st.s.map(function (id) { var s = C.setBy[id]; return [s.art, s.naziv, s.kosov || ""]; }));
    return "﻿" + rows.map(function (r) { return r.map(function (x) { return '"' + String(x).replace(/"/g, '""') + '"'; }).join(";"); }).join("\r\n");
  }

  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-add],[data-rm]");
    if (!t) return;
    if (t.hasAttribute("data-add")) { st.s.push(t.getAttribute("data-add")); }
    else { var i = st.s.indexOf(t.getAttribute("data-rm")); if (i >= 0) st.s.splice(i, 1); }
    st.from = "";
    renderDrawers(); renderLib();
  });

  window.WKContext = function () {
    var v = C.vozBy[st.v], p = WK.pack(C, v, st.s);
    return "Stran Sestavi predale. Voziček: " + v.naziv + ". Predalov s peno: " + p.used + " od " + v.predali + ". Zapolnjeno enot: " + p.units + " od " + p.cap + ".\nIzbrani seti: " + (st.s.map(function (id) { return C.setBy[id].art + " " + C.setBy[id].naziv; }).join("; ") || "nobeden");
  };

  WK.load().then(function (data) {
    C = data;
    readHash();
    $("vsel").innerHTML = usable().map(function (v) { return '<option value="' + v.id + '">' + esc(v.naziv) + "</option>"; }).join("");
    $("vsel").addEventListener("change", function () { st.v = this.value; st.r = ""; st.from = ""; all(); });
    $("asel").addEventListener("change", function () {
      if (!this.value) return;
      var a = C.asmBy[this.value];
      st.v = a.voz; st.r = a.barva || ""; st.from = a.id;
      st.s = a.seti.map(function (x) { return x[0].replace(/\s/g, ""); });
      all();
    });
    $("grp").innerHTML = '<option value="">Vse skupine</option>' + C.skupine.map(function (g) { return '<option value="' + g.id + '">' + esc(g.naziv) + "</option>"; }).join("");
    $("grp").addEventListener("change", function () { st.grp = this.value; renderLib(); });
    $("libq").addEventListener("input", function () { q = this.value; renderLib(); });
    $("clear").addEventListener("click", function () { st.s = []; st.from = ""; all(); });
    $("export").addEventListener("click", function () {
      var a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([csv()], { type: "text/csv;charset=utf-8" }));
      a.download = "seznam-sifer.csv";
      a.click();
      URL.revokeObjectURL(a.href);
    });
    $("copy").addEventListener("click", function () {
      var b = this;
      navigator.clipboard.writeText(location.href).then(function () { b.textContent = "Povezava kopirana ✓"; setTimeout(function () { b.textContent = "Kopiraj povezavo"; }, 1800); });
    });
    $("tolead").addEventListener("click", function () {
      var v = C.vozBy[st.v], ral = st.r || v.barve[0].ral, b = v.barve.filter(function (x) { return x.ral === ral; })[0] || v.barve[0], p = WK.pack(C, v, st.s);
      WK.addLead({ naslov: "Voziček " + v.naziv + " po meri", dejavnost: "konfigurator", izdelki: [b.art].concat(st.s.map(function (id) { return C.setBy[id].art; })), potreba: "Kupec je sam sestavil predale: " + p.used + " od " + v.predali + " predalov s peno.", korak: "Komercialist preveri šifre in pripravi ponudbo." });
      this.outerHTML = '<a class="btn" href="prodaja.html#inbox">Poslano ✓ Odpri pogled prodaje →</a>';
    });
    $("askr").addEventListener("click", function () { window.Racko.ask("Kaj bi še dodal ali zamenjal v tej postavitvi predalov in zakaj?"); });
    all();
  });
})();
