// Sales view: the inquiry inbox, a real analysis of the catalogue's assortments, and the visitor's own visit as a signal.
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); }, esc = WK.esc;
  var SAMPLE = [
    { naslov: "Avtoservis, 2 mehanika, ozek prehod", dejavnost: "servis vozil", izdelki: ["0962 615 700", "0965 905 901", "0965 905 600", "0965 905 501", "0965 905 502"], potreba: "Voziček, ki ne poškoduje vozil, začetna oprema za dva mehanika.", dodatno: "Zanimiv je še set za varovalne obročke.", korak: "Pripravi ponudbo in dogovori obisk.", cas: "vzorec" },
    { naslov: "Vzdrževanje v proizvodnji, težji kosi", dejavnost: "industrija", izdelki: ["0962 639 070", "0965 905 912", "0965 905 402", "0965 905 218"], potreba: "Velik voziček za ključe do SW 34 in strojne natične ključe.", korak: "Preveri, ali kupec že ima ORSY sisteme, in predlagaj skupni obisk.", cas: "vzorec" }
  ];
  function leads() {
    var box = $("leads");
    box.innerHTML = "";
    var mine = WK.leads();
    mine.forEach(function (o) { box.appendChild(WK.leadCard(o, { meta: o.id + " · novo" })); });
    SAMPLE.forEach(function (o) { box.appendChild(WK.leadCard(o, { meta: "vzorec, izmišljeno" })); });
  }
  function mine() {
    var s = WK.signals(), miss = s.iskanja.filter(function (x) { return !x.zadetki; }), views = Object.keys(s.ogledi).sort(function (a, b) { return s.ogledi[b] - s.ogledi[a]; });
    $("mine").innerHTML = "<div><b>" + s.iskanja.length + "</b><span>iskanj</span></div><div><b>" + miss.length + "</b><span>brez zadetka</span></div><div><b>" + views.length + "</b><span>ogledanih izdelkov</span></div>";
    var h = "";
    if (s.iskanja.length) h += '<p style="margin-bottom:4px"><b>Zadnja iskanja:</b> ' + s.iskanja.slice(0, 6).map(function (x) { return esc(x.q) + (x.zadetki ? "" : ' <span class="pill red">0</span>'); }).join(" · ") + "</p>";
    if (views.length) h += "<p><b>Največ ogledov:</b> " + views.slice(0, 4).map(esc).join(" · ") + "</p>";
    if (!h) h = '<p class="muted">Še nič. <a href="./">Odprite katalog</a>, poiščite »seger klešče« in se vrnite.</p>';
    $("mylist").innerHTML = h;
  }

  WK.load().then(function (C) {
    var id = function (a) { return a.replace(/\s/g, ""); }, freq = {};
    C.sestavi.forEach(function (a) { a.seti.forEach(function (x) { var k = id(x[0]); freq[k] = (freq[k] || 0) + 1; }); });
    var keys = Object.keys(freq).sort(function (a, b) { return freq[b] - freq[a]; });
    var unused = C.seti.filter(function (s) { return !freq[s.id]; }).length;
    var fills = C.sestavi.map(function (a) {
      var v = C.vozBy[a.voz], ids = a.seti.map(function (x) { return id(x[0]); }), p = WK.pack(C, v, ids);
      return { a: a, v: v, ids: ids, p: p, free: v.predali - p.used };
    });
    var freeTotal = fills.reduce(function (t, f) { return t + f.free; }, 0), avg = fills.reduce(function (t, f) { return t + f.p.used / f.v.predali; }, 0) / fills.length;
    $("kpis").innerHTML =
      "<div><b>" + keys.length + "</b><span>od " + C.seti.length + " setov je v vsaj enem sestavu</span></div>" +
      "<div><b>" + unused + "</b><span>setov je samo posamično, kupec jih težje najde</span></div>" +
      "<div><b>" + Math.round(avg * 100) + " %</b><span>predalov v povprečnem sestavu ima peno</span></div>" +
      "<div><b>" + freeTotal + "</b><span>praznih predalov v 12 sestavih</span></div>";
    var max = freq[keys[0]];
    $("top").innerHTML = keys.slice(0, 9).map(function (k) {
      var s = C.setBy[k];
      return '<div class="bar"><span class="lbl" title="' + esc(s.naziv) + '">' + esc(s.naziv) + ' <span class="art fine">' + s.art.slice(-3) + '</span></span><span class="tr"><i style="width:' + (freq[k] / max * 100) + '%"></i></span><span>' + freq[k] + "</span></div>";
    }).join("");
    $("fill").innerHTML = "<thead><tr><th>Sestav</th><th class=\"r\">Predali s peno</th><th class=\"r\">Prazni</th></tr></thead><tbody>" +
      fills.slice().sort(function (a, b) { return b.free - a.free; }).slice(0, 7).map(function (f) { return '<tr><td><a href="./?a=' + f.a.id + '">' + esc(f.a.naziv) + '</a></td><td class="r">' + f.p.used + " / " + f.v.predali + '</td><td class="r">' + f.free + "</td></tr>"; }).join("") + "</tbody>";
    var rows = fills.filter(function (f) { return f.free > 0; }).sort(function (a, b) { return b.free - a.free; }).slice(0, 5).map(function (f) {
      var groups = {}, sim = {};
      f.ids.forEach(function (k) { groups[C.setBy[k].skupina] = 1; });
      fills.forEach(function (o) {
        if (o === f) return;
        var w = o.v.linija === f.v.linija ? 2 : 1;
        o.ids.forEach(function (k) { if (f.ids.indexOf(k) < 0 && !groups[C.setBy[k].skupina]) sim[k] = (sim[k] || 0) + w; });
      });
      var best = Object.keys(sim).sort(function (a, b) { return sim[b] - sim[a] || freq[b] - freq[a]; })[0];
      if (!best) return "";
      var s = C.setBy[best];
      return '<tr><td><a href="./?a=' + f.a.id + '">' + esc(f.a.naziv) + "</a></td><td>" + f.free + ' prazni</td><td><a href="./?s=' + s.id + '">' + esc(s.naziv) + '</a> <span class="art fine">' + s.art + "</span></td><td class=\"r\">v " + freq[best] + (freq[best] === 1 ? " sestavu" : " sestavih") + "</td></tr>";
    }).join("");
    $("reco").innerHTML = "<thead><tr><th>Sestav</th><th>Prostor</th><th>Predlog</th><th class=\"r\">Dokaz</th></tr></thead><tbody>" + rows + "</tbody>";
  });

  leads(); mine();
  $("clrleads").addEventListener("click", function () { WK.clearLeads(); leads(); });
  $("clrsig").addEventListener("click", function () { WK.clearSignals(); mine(); });
})();
