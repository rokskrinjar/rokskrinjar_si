// Catalogue page: search, picker, trolleys, assortments, sets, details and comparison.
(function () {
  "use strict";
  var C, $ = function (id) { return document.getElementById(id); }, esc = WK.esc;
  var state = { q: "", delo: "", prostor: "", zacetek: "", poudarek: "", showSets: false, cmp: WK.compareList() };

  // ---------- Small views ----------
  function dots(v) {
    return '<span class="dots">' + v.barve.filter(function (b, i, a) { return a.findIndex(function (x) { return x.ral === b.ral; }) === i; })
      .map(function (b) { return '<span class="dot" style="background:' + WK.RAL[b.ral][0] + '" title="' + esc(WK.RAL[b.ral][1]) + '"></span>'; }).join("") + "</span>";
  }
  function specLine(v) {
    var bits = [v.predali + " predalov"];
    if (v.sirina) bits.push(v.sirina + " × " + v.globina + " × " + v.visina + " mm");
    if (v.nosilnost_skupaj) bits.push(v.nosilnost_skupaj + " kg skupaj");
    else if (v.nosilnost_predala) bits.push(v.nosilnost_predala + " kg na predal");
    return bits.join(" · ");
  }
  function tile(v, why) {
    var on = state.cmp.indexOf(v.id) >= 0, asm = C.sestavi.filter(function (a) { return a.voz === v.id; }).length;
    return '<article class="tile"><div class="pic">' + WK.drawing(v, v.barve[0].ral, { h: 148, ref: 1055 }) + '</div><div class="bd">' +
      '<h3><button type="button" data-open="v:' + v.id + '">' + esc(v.naziv) + "</button></h3>" +
      '<div class="spec">' + specLine(v) + "</div>" + dots(v) +
      (why && why.length ? why.slice(0, 3).map(function (w) { return '<div class="why">' + esc(w) + "</div>"; }).join("") : "") +
      (asm ? '<div class="spec">' + asm + (asm === 1 ? " sestav" : asm < 5 ? " sestavi" : " sestavov") + " z orodjem</div>" : "") +
      '<div class="act"><button class="btn small" type="button" data-open="v:' + v.id + '">Podrobnosti</button>' +
      '<button class="btn small" type="button" data-cmp="' + v.id + '"' + (v.visina ? "" : " disabled") + ">" + (on ? "Odstrani" : "Primerjaj") + "</button></div></div></article>";
  }
  function asmRow(a, why) {
    var v = C.vozBy[a.voz], p = WK.pack(C, v, a.seti.map(function (x) { return x[0].replace(/\s/g, ""); }));
    return '<div class="row"><span class="dot" style="background:' + WK.RAL[a.barva || v.barve[0].ral][0] + ';width:22px;height:22px;justify-self:center"></span>' +
      '<div><div class="tt"><button type="button" data-open="a:' + a.id + '">' + esc(a.naziv) + '</button></div><div class="sub">' + a.seti.length + " setov · pena v " + p.used + " od " + v.predali + ' predalov · <span class="art">' + a.art + "</span></div>" +
      (why && why.length ? '<div class="why">' + esc(why[0]) + "</div>" : "") + "</div>" +
      '<a class="btn small" href="predali.html#a=' + a.id + '">Odpri predale</a></div>';
  }
  function setRow(s, why) {
    return '<div class="row">' + WK.moduleIcon(s.modul) + '<div><div class="tt"><button type="button" data-open="s:' + s.id + '">' + esc(s.naziv) + "</button></div>" +
      '<div class="sub">' + (s.kosov ? s.kosov + " kosov · " : "") + '<span class="art">' + s.art + "</span></div>" +
      (why && why.length ? why.slice(0, 2).map(function (w) { return '<div class="why">' + esc(w) + "</div>"; }).join("") : "") + "</div>" +
      '<a class="btn small" href="predali.html#s=' + s.id + '">V predal</a></div>';
  }

  // ---------- Picker: every point is a catalogue fact, shown as the reason ----------
  var PICK = {
    delo: {
      servis: [["c7", 3, "Gumijasta zaščita na robovih preprečuje poškodbe na vozilih (str. 3)"], ["c8", 2, "Sestav za vozila Mercedes (str. 18)"]],
      kmetijstvo: [["c7", 3, "Na voljo kot Fendt Edition (str. 3)"]],
      delavnica: [["b84", 2, "Sistemski voziček, 250 kg skupne nosilnosti (str. 6)"], ["b88", 2, "Dva polja pene v predalu, 300 kg (str. 8)"], ["s7", 1, "Perforirane plošče na straneh za orodje na kavljih (str. 2)"]],
      tezko: [["xxl", 3, "1000 kg skupne nosilnosti (str. 11)"], ["we", 3, "500 kg skupne nosilnosti (str. 10)"]]
    },
    poudarek: {
      varnost: [["c7", 2, "Predali se odpirajo samo posamično (str. 3)"], ["b88", 2, "Dvojno zaklepanje s posebno zaporo na vsakem predalu (str. 4)"]],
      kolicina: [["xxl", 3, "Tri polja pene v vsakem predalu"], ["we", 2, "Dve polji pene v vsakem predalu"], ["b88", 2, "Dve polji pene v vsakem predalu"]],
      gibanje: [["c7", 1, "Gumijasta kolesa z zavoro (str. 3)"], ["b84", 1, "Najožji voziček v katalogu (str. 6)"]]
    }
  };
  function picked() {
    var active = state.delo || state.prostor || state.zacetek || state.poudarek;
    if (!active) return null;
    var score = {};
    C.vozicki.forEach(function (v) { score[v.id] = { item: v, score: 0, why: [] }; });
    [["delo", state.delo], ["poudarek", state.poudarek]].forEach(function (p) {
      (PICK[p[0]][p[1]] || []).forEach(function (x) { score[x[0]].score += x[1]; score[x[0]].why.push(x[2]); });
    });
    if (state.zacetek === "orodje") C.vozicki.forEach(function (v) {
      var n = C.sestavi.filter(function (a) { return a.voz === v.id; }).length;
      if (n) { score[v.id].score += 1; score[v.id].why.push(n + (n === 1 ? " sestav" : n < 5 ? " sestavi" : " sestavov") + " z orodjem"); } else score[v.id].score -= 2;
    });
    if (state.prostor) C.vozicki.forEach(function (v) {
      if (!v.sirina) { score[v.id].score = -9; return; }
      if (v.sirina > +state.prostor) score[v.id].score = -9;
      else { score[v.id].score += .5; score[v.id].why.push("Širina " + v.sirina + " mm"); }
    });
    return Object.keys(score).map(function (k) { return score[k]; }).filter(function (x) { return x.score >= 0 && (x.score > 0 || !state.delo && !state.poudarek); }).sort(function (a, b) { return b.score - a.score; });
  }

  // ---------- Rendering ----------
  function render() {
    var out = "";
    if (state.q.trim()) {
      var r = WKSearch.run(C, state.q), total = r.vozicki.length + r.sestavi.length + r.seti.length;
      var bits = [];
      if (r.p.sw) bits.push("SW " + r.p.sw); if (r.p.tx) bits.push("TX" + r.p.tx); if (r.p.imb) bits.push("imbus " + r.p.imb);
      if (r.p.maxW) bits.push("širina do " + r.p.maxW + " mm"); if (r.p.minKg) bits.push("nosilnost od " + r.p.minKg + " kg"); if (r.p.code) bits.push("šifra");
      out += '<div class="rez-head"><h2>' + total + (total === 1 ? " zadetek" : total === 2 ? " zadetka" : total < 5 ? " zadetki" : " zadetkov") + '</h2><span class="fine">' +
        (bits.length ? "Razumljeno: " + esc(bits.join(", ")) + " · " : "") + '<button class="btn small" type="button" id="clearq">Počisti</button></span></div>';
      if (!total) out += '<div class="empty"><b>Te besede katalog ne pozna.</b><p class="muted" style="margin:.3em 0 .6em">Vsako tako iskanje je podatek za prodajo: kaj ljudje iščejo in česa ne najdejo.</p><button class="btn primary small" type="button" data-ask-q>Vprašaj Mojstra</button></div>';
      if (r.vozicki.length) out += '<div class="grid">' + r.vozicki.slice(0, 6).map(function (x) { return tile(x.item, x.why); }).join("") + "</div>";
      if (r.sestavi.length) out += '<div class="rez-head"><h2>Sestavi z orodjem</h2></div><div class="rows">' + r.sestavi.slice(0, 5).map(function (x) { return asmRow(x.item, x.why); }).join("") + "</div>";
      if (r.seti.length) out += '<div class="rez-head"><h2>Seti v peni</h2>' + (r.p.sw || r.p.tx || r.p.imb ? '<span class="fine">Samo seti s tabelo vsebine: katalog jih ima 11, pri drugih velikosti niso naštete.</span>' : "") + '</div><div class="rows">' + r.seti.slice(0, 10).map(function (x) { return setRow(x.item, x.why); }).join("") + "</div>";
    } else {
      var p = picked();
      if (p) {
        out += '<div class="rez-head"><h2>Predlog za vas</h2><span class="fine">Vsak razlog je dejstvo iz kataloga.</span></div>';
        out += p.length ? '<div class="grid">' + p.map(function (x) { return tile(x.item, x.why); }).join("") + "</div>" : '<div class="empty">Takega vozička katalog nima. Popustite eno izbiro.</div>';
      } else {
        out += '<div class="rez-head"><h2>Vozički</h2><span class="fine">Sheme so v istem merilu, barve in mere so iz kataloga.</span></div><div class="grid">' + C.vozicki.map(function (v) { return tile(v); }).join("") + "</div>";
      }
      out += '<div class="rez-head" id="sestavi"><h2>Sestavi z orodjem</h2><span class="fine">Tudi pokazatelj, koliko predalov še ostane prostih.</span></div><div class="rows">' + C.sestavi.map(function (a) { return asmRow(a); }).join("") + "</div>";
      out += '<div class="rez-head" id="seti"><h2>Seti v peni</h2><span class="fine">Ikona pokaže, kolikšen del predala zasede pena.</span></div>';
      var list = C.seti.filter(function (s) { return !state.grp || s.skupina === state.grp; });
      out += '<div class="chips light" style="margin:0 0 10px"><button type="button" data-grp="" aria-pressed="' + !state.grp + '">Vse</button>' + C.skupine.map(function (g) { return '<button type="button" data-grp="' + g.id + '" aria-pressed="' + (state.grp === g.id) + '">' + esc(g.naziv) + "</button>"; }).join("") + "</div>";
      var show = state.showSets || state.grp ? list : list.slice(0, 8);
      out += '<div class="rows">' + show.map(function (s) { return setRow(s); }).join("") + "</div>";
      if (show.length < list.length) out += '<button class="btn more" type="button" id="moresets">Pokaži vseh ' + list.length + " setov</button>";
    }
    $("rez").innerHTML = out;
    var clr = $("clearq"); if (clr) clr.addEventListener("click", function () { $("q").value = ""; state.q = ""; render(); $("q").focus(); });
    var more = $("moresets"); if (more) more.addEventListener("click", function () { state.showSets = true; render(); });
    tray();
  }

  // ---------- Details ----------
  var sheet;
  function openSheet(title, html) {
    sheet.innerHTML = '<div class="sheet-in"><div class="sheet-top"><h2>' + esc(title) + '</h2><button class="xbtn" type="button" data-close aria-label="Zapri">×</button></div>' + html + "</div>";
    if (!sheet.open) sheet.showModal();
    sheet.scrollTop = 0;
  }
  function askBtn(text) { return '<button class="btn" type="button" data-ask="' + esc(text) + '">Vprašaj Mojstra</button>'; }

  function openV(id, ral) {
    var v = C.vozBy[id]; if (!v) return;
    ral = ral || v.barve[0].ral;
    WK.signal("ogled", v.naziv);
    var pick = v.barve.filter(function (b) { return b.ral === ral; })[0] || v.barve[0];
    var asm = C.sestavi.filter(function (a) { return a.voz === id; });
    var row = function (k, val) { return val ? "<dt>" + k + "</dt><dd>" + val + "</dd>" : ""; };
    var html = '<div class="drawing">' + WK.drawing(v, ral, { h: 250, ref: v.visina || 985, dims: !!v.visina }) + "</div>";
    html += '<p class="fine" style="margin:6px 0 10px">Shema je narisana iz mer v katalogu; razporeditev predalov je ponazoritev. ' + WK.source(C, v.stran) + "</p>";
    html += '<div class="dots" aria-label="Barve">' + v.barve.map(function (b) {
      return '<button class="dot" style="width:24px;height:24px;background:' + WK.RAL[b.ral][0] + '" type="button" aria-pressed="' + (b.ral === ral) + '" data-ral="' + id + ":" + b.ral + '" title="' + esc(WK.RAL[b.ral][1]) + '" aria-label="' + esc(WK.RAL[b.ral][1]) + '"></button>';
    }).filter(function (x, i, a) { return a.indexOf(x) === i; }).join("") + ' <span class="fine" style="margin-left:6px">' + esc(WK.RAL[ral][1]) + "</span></div>";
    html += '<dl class="specs">' +
      row("Šifra", v.barve.filter(function (b) { return b.ral === ral; }).map(function (b) { return '<span class="art">' + b.art + "</span>" + (b.opomba ? " (" + esc(b.opomba) + ")" : ""); }).join("<br>")) +
      row("Mere", v.sirina ? v.sirina + " × " + v.globina + " × " + v.visina + " mm (š × g × v)" : '<span class="muted">V katalogu niso navedene</span>') +
      row("Predali", v.predali + (v.izvlek ? ", " + esc(v.izvlek) : "")) +
      row("Notranjost predala", v.predal ? v.predal[0] + " × " + v.predal[1] + " mm, višina " + v.visine[0] + " / " + v.visine[1] + " mm" : "") +
      row("Pena v predalu", v.polja + (v.polja === 1 ? " polje" : v.polja === 2 ? " polji" : " polja") + " po 8.4.1") +
      row("Nosilnost predala", v.nosilnost_predala ? v.nosilnost_predala + " kg" : "") +
      row("Skupna nosilnost", v.nosilnost_skupaj ? v.nosilnost_skupaj + " kg" : "") +
      row("Kolesa", esc(v.kolesa)) + row("Zaklepanje", esc(v.zapiranje)) + row("Odpiranje", esc(v.odpiranje)) + "</dl>";
    html += '<ul class="feat">' + v.lastnosti.map(function (l) { return "<li>" + esc(l) + "</li>"; }).join("") + "</ul>";
    html += '<div class="buy"><a class="btn primary" href="predali.html#v=' + id + "&r=" + ral + '">Napolni predale</a>' + askBtn("Komu je namenjen voziček " + v.naziv + " in kaj moram vedeti pred nakupom?") + (v.visina ? '<button class="btn" type="button" data-cmp="' + id + '">Primerjaj</button>' : "") + "</div>";
    if (asm.length) html += "<h3>Sestavi z orodjem</h3><div class=\"rows\">" + asm.map(function (a) { return asmRow(a); }).join("") + "</div>";
    if (v.dodatki.length) html += '<h3 style="margin-top:16px">Dodatki</h3><ul class="feat">' + v.dodatki.map(function (d) { return "<li>" + esc(d.naziv) + ' <span class="art">' + d.art + "</span></li>"; }).join("") + "</ul>";
    if (v.rezervni_deli) html += '<h3 style="margin-top:16px">Rezervni deli</h3><p class="fine">Katalog ima risbo brez nazivov; opis je prebran z risbe. ' + WK.source(C, v.rezervni_deli.stran) + '</p><ul class="feat">' + v.rezervni_deli.deli.map(function (d) { return '<li><span class="art">' + d.art + "</span> " + esc(d.risba) + "</li>"; }).join("") + "</ul>";
    openSheet(v.naziv, html);
    history.replaceState(null, "", "?v=" + id);
  }
  function openA(id) {
    var a = C.asmBy[id]; if (!a) return;
    var v = C.vozBy[a.voz], ids = a.seti.map(function (x) { return x[0].replace(/\s/g, ""); }), p = WK.pack(C, v, ids), sum = a.seti.reduce(function (t, x) { return t + x[1]; }, 0);
    WK.signal("ogled", a.naziv);
    var html = '<div class="drawing">' + WK.drawing(v, a.barva || v.barve[0].ral, { h: 210, ref: v.visina || 985 }) + "</div>";
    html += '<dl class="specs" style="margin-top:12px"><dt>Voziček</dt><dd><button class="btn small" type="button" data-open="v:' + v.id + '">' + esc(v.naziv) + '</button> <span class="art">' + a.art + "</span></dd><dt>Kosov</dt><dd>" + a.kosov + (sum !== a.kosov ? ' <span class="pill warn">vsota setov: ' + sum + "</span>" : ' <span class="pill ok">vsota setov se ujema</span>') + "</dd><dt>Predali s peno</dt><dd>" + p.used + " od " + v.predali + (p.used < v.predali ? " · še " + (v.predali - p.used) + " prostih za dopolnitev" : "") + "</dd><dt>Vir</dt><dd>" + WK.source(C, a.stran) + "</dd></dl>";
    html += '<div class="buy"><a class="btn primary" href="predali.html#a=' + a.id + '">Odpri predale</a>' + askBtn("Kaj bi dodal v prazne predale pri sestavu " + a.naziv + "?") + "</div><h3>Seti v sestavu</h3><div class=\"rows\">" +
      a.seti.map(function (x) { var s = C.setBy[x[0].replace(/\s/g, "")]; return setRow(s, x[1] !== s.kosov ? ["Na tej strani z oznako " + x[1] + "-delni"] : null); }).join("") + "</div>";
    openSheet(a.naziv, html);
    history.replaceState(null, "", "?a=" + id);
  }
  function openS(id) {
    var s = C.setBy[id]; if (!s) return;
    WK.signal("ogled", s.naziv + " " + s.art);
    var m = C.moduli.filter(function (x) { return x.id === s.modul; })[0];
    var html = '<dl class="specs"><dt>Šifra</dt><dd><span class="art">' + s.art + "</span></dd>" + (s.kosov ? "<dt>Kosov</dt><dd>" + s.kosov + "</dd>" : "") +
      "<dt>Velikost pene</dt><dd>" + WK.moduleIcon(s.modul) + " " + m.oznaka + ", " + m.opis + " (" + m.mere + ")</dd><dt>Skupina</dt><dd>" + esc(C.skupine.filter(function (g) { return g.id === s.skupina; })[0].naziv) + "</dd><dt>Vir</dt><dd>" + WK.source(C, s.stran) + "</dd></dl>";
    html += '<p class="fine">Velikost pene je izmerjena z razporeditve v katalogu. Pene so po katalogu primerne za vse delovne vozičke in sistemske kovčke (str. 25).</p>';
    html += '<div class="buy"><a class="btn primary" href="predali.html#s=' + s.id + '">Dodaj v predal</a>' + askBtn("Za kakšno delo je primeren " + s.naziv + " " + s.art + " in v kateri voziček sodi?") + "</div>";
    if (s.vsebina) html += '<h3>Vsebina seta</h3><div class="tw"><table><tbody>' + s.vsebina.map(function (r) { return '<tr><td class="art">' + esc(r.a) + "</td><td>" + esc(r.n) + "</td></tr>"; }).join("") + "</tbody></table></div>";
    else html += '<p class="muted">Katalog za ta set nima tabele vsebine, zato o posameznih kosih ne ugibamo.</p>';
    if (s.v.length) html += '<h3 style="margin-top:16px">V teh sestavih</h3><div class="rows">' + s.v.map(function (id) { return asmRow(C.asmBy[id]); }).join("") + "</div>";
    openSheet(s.naziv, html);
    history.replaceState(null, "", "?s=" + id);
  }
  window.WKOpen = function (kind, id) { (kind === "v" ? openV : kind === "a" ? openA : openS)(id); };

  // ---------- Comparison ----------
  function toggleCmp(id) {
    var i = state.cmp.indexOf(id);
    if (i >= 0) state.cmp.splice(i, 1);
    else { if (state.cmp.length >= 4) state.cmp.shift(); state.cmp.push(id); }
    WK.compareSave(state.cmp);
    render();
  }
  function tray() {
    var t = $("tray");
    t.hidden = !state.cmp.length;
    if (!state.cmp.length) return;
    t.innerHTML = "<span>Primerjava:</span>" + state.cmp.map(function (id) { return '<span class="pill">' + esc(C.vozBy[id].naziv) + '<button type="button" data-cmp="' + id + '" aria-label="Odstrani">×</button></span>'; }).join("") +
      '<button class="btn primary small" type="button" id="cmpopen"' + (state.cmp.length < 2 ? " disabled" : "") + ">Primerjaj</button>";
    $("cmpopen").addEventListener("click", openCmp);
  }
  function openCmp() {
    var list = state.cmp.map(function (id) { return C.vozBy[id]; });
    var rows = [
      ["Širina", function (v) { return v.sirina + " mm"; }], ["Globina", function (v) { return v.globina + " mm"; }], ["Višina", function (v) { return v.visina + " mm"; }],
      ["Predali", function (v) { return v.predali + ""; }], ["Notranjost predala", function (v) { return v.predal[0] + " × " + v.predal[1] + " mm"; }], ["Višina predalov", function (v) { return v.visine.join(" / ") + " mm"; }],
      ["Polja pene v predalu", function (v) { return v.polja + ""; }], ["Kapaciteta pene", function (v) { return (v.predali * v.polja) + " polj 8.4.1"; }],
      ["Nosilnost predala", function (v) { return v.nosilnost_predala ? v.nosilnost_predala + " kg" : "ni navedena"; }], ["Skupna nosilnost", function (v) { return v.nosilnost_skupaj ? v.nosilnost_skupaj + " kg" : "ni navedena"; }],
      ["Odpiranje", function (v) { return v.odpiranje; }], ["Zaklepanje", function (v) { return v.zapiranje; }], ["Kolesa", function (v) { return v.kolesa; }], ["Barve", function (v) { return dots(v); }],
      ["Sestavi z orodjem", function (v) { return C.sestavi.filter(function (a) { return a.voz === v.id; }).length + ""; }], ["Vir", function (v) { return WK.source(C, v.stran); }]
    ];
    var html = '<div class="drawing foam">' + WK.lineup(C, state.cmp, { h: 200 }) + '</div><p class="fine" style="margin:8px 0">Isto merilo, zato razliko vidite. Obarvane vrstice se razlikujejo.</p><div class="tw"><table class="cmp"><thead><tr><th></th>' + list.map(function (v) { return "<th>" + esc(v.naziv) + "</th>"; }).join("") + "</tr></thead><tbody>";
    rows.forEach(function (r) {
      var vals = list.map(r[1]), diff = r[0] !== "Vir" && r[0] !== "Barve" && vals.some(function (x) { return x !== vals[0]; });
      html += "<tr" + (diff ? ' class="diff"' : "") + "><td>" + r[0] + "</td>" + vals.map(function (x) { return "<td>" + x + "</td>"; }).join("") + "</tr>";
    });
    html += '</tbody></table></div><div class="buy">' + askBtn("Primerjaj " + list.map(function (v) { return v.naziv; }).join(", ") + ": kateri je za koga?") + "</div>";
    var d = $("cmpdlg");
    d.innerHTML = '<div class="sheet-in"><div class="sheet-top"><h2>Primerjava</h2><button class="xbtn" type="button" data-close aria-label="Zapri">×</button></div>' + html + "</div>";
    d.showModal();
  }

  // ---------- Events ----------
  function ask(text) {
    if (sheet.open) sheet.close();
    if ($("cmpdlg").open) $("cmpdlg").close();
    window.Mojster.ask(text);
    if (window.innerWidth <= 1040) $("chat").scrollIntoView({ behavior: "smooth" });
  }
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-open],[data-cmp],[data-ral],[data-close],[data-ask],[data-ask-q],[data-grp],[data-pick]");
    if (!t) return;
    if (t.hasAttribute("data-open")) { var o = t.getAttribute("data-open").split(":"); window.WKOpen(o[0], o[1]); }
    else if (t.hasAttribute("data-cmp")) { toggleCmp(t.getAttribute("data-cmp")); if (sheet.open) sheet.close(); }
    else if (t.hasAttribute("data-ral")) { var p = t.getAttribute("data-ral").split(":"); openV(p[0], p[1]); }
    else if (t.hasAttribute("data-close")) { t.closest("dialog").close(); }
    else if (t.hasAttribute("data-ask")) ask(t.getAttribute("data-ask"));
    else if (t.hasAttribute("data-ask-q")) ask(state.q);
    else if (t.hasAttribute("data-grp")) { state.grp = t.getAttribute("data-grp"); render(); }
    else if (t.hasAttribute("data-pick")) {
      var k = t.getAttribute("data-pick"), val = t.getAttribute("data-val");
      state[k] = state[k] === val ? "" : val;
      document.querySelectorAll('[data-pick="' + k + '"]').forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-val") === state[k]); });
      render();
    }
  });
  var timer;
  function looksLikeQuestion(q) { return /\?\s*$/.test(q) || q.trim().split(/\s+/).length >= 6; }
  function search(q, commit) {
    state.q = q;
    render();
    clearTimeout(timer);
    if (commit && q.trim()) {
      var r = WKSearch.run(C, q), hits = r.vozicki.length + r.sestavi.length + r.seti.length;
      WK.signal("iskanje", q.trim(), hits);
      if (looksLikeQuestion(q)) ask(q.trim());
    }
    if (commit && window.innerWidth <= 1040) $("rez").scrollIntoView({ behavior: "smooth" });
  }

  window.WKContext = function () {
    var bits = [];
    if (state.cmp.length) bits.push("V primerjavi: " + state.cmp.map(function (id) { return C.vozBy[id].naziv; }).join(", "));
    if (state.q) bits.push("Iskanje na strani: " + state.q);
    ["delo", "prostor", "zacetek", "poudarek"].forEach(function (k) { if (state[k]) bits.push(k + ": " + state[k]); });
    return bits.join("\n");
  };

  WK.load().then(function (data) {
    C = data;
    WKSearch.build(C);
    sheet = $("sheet");
    $("lineup").innerHTML = WK.lineup(C, null, { h: 170 });
    $("lineup").addEventListener("click", function (e) { var g = e.target.closest("g[data-id]"); if (g) openV(g.getAttribute("data-id")); });
    $("lineup").addEventListener("keydown", function (e) { if (e.key === "Enter") { var g = e.target.closest("g[data-id]"); if (g) openV(g.getAttribute("data-id")); } });
    $("q").addEventListener("input", function () { search(this.value); });
    $("sform").addEventListener("submit", function (e) { e.preventDefault(); search($("q").value, true); });
    document.querySelectorAll("[data-q]").forEach(function (b) { b.addEventListener("click", function () { $("q").value = b.getAttribute("data-q"); search(b.getAttribute("data-q"), true); }); });
    [sheet, $("cmpdlg")].forEach(function (d) {
      d.addEventListener("click", function (e) { if (e.target === d) d.close(); });
      d.addEventListener("close", function () { if (location.search) history.replaceState(null, "", location.pathname); });
    });
    render();
    var u = new URLSearchParams(location.search);
    if (u.get("v")) openV(u.get("v")); else if (u.get("a")) openA(u.get("a")); else if (u.get("s")) openS(u.get("s"));
    if (u.get("q")) { $("q").value = u.get("q"); search(u.get("q")); }
  });
})();
