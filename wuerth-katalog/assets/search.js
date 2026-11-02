// Local catalogue search: understands how the trade talks, sizes and limits, and explains every hit. No server, no model.
(function () {
  "use strict";
  function norm(s) {
    return String(s || "").toLowerCase().replace(/[čć]/g, "c").replace(/š/g, "s").replace(/ž/g, "z").replace(/đ/g, "dz")
      .replace(/[″“”"]/g, " in ").replace(/(\d)\s*in\b/g, "$1").replace(/[^a-z0-9/,.\s-]/g, " ");
  }
  // Words people use and the words the catalogue uses. The first word in each group is the catalogue's.
  var SYN = [
    ["izvijac", "sraufenciger", "sraufnciger", "sraufciger", "odvijac", "odvijalec", "screwdriver"],
    ["klesc", "cange", "kombinirk", "klesta", "klijesta", "kliješta", "pliers"],
    ["racn", "ragl", "ragljast", "ratchet", "cegetn", "cegetna", "ratsch"],
    ["naticn", "nasadn", "gedor", "socket", "oreh", "nasadni"],
    ["vilicast", "vilicn", "odprti kljuc", "viljuskast", "spanner"],
    ["obrocast", "okasti", "okast", "zvezdast", "ring"],
    ["imbus", "inbus", "hex", "sestrob", "imbusni", "allen", "sestkot", "6-kt"],
    ["tx", "torx", "zvezdica"],
    ["varovaln", "seger", "zeger", "segerc", "circlip"],
    ["strojn", "udarn", "impact", "pnevmatsk", "za udarni"],
    ["vde", "izoliran", "elektro", "elektrik", "1000v", "pod napetostjo"],
    ["sekac", "dleto", "dleta", "sjekac", "chisel"],
    ["pil", "turpij", "rasp", "file"],
    ["kladiv", "macola", "cekic", "hammer"],
    ["prebijac", "izbijac", "punch", "probijac"],
    ["svedr", "sveder", "svrdl", "drill"],
    ["meril", "merilo", "kljunast", "meter", "metar"],
    ["nastavk", "bit", "biti", "bite", "bitov"],
    ["vozick", "vozicek", "kolica", "trolley", "omar", "predalnik", "delavniski", "orodni"],
    ["kljuc", "kljuce", "wrench", "kljucev"],
    ["podaljsek", "extension", "produzetak"],
    ["konektor", "koncnik", "dtm", "mcp", "krimp"]
  ];
  var IDX = {};
  SYN.forEach(function (g) { g.forEach(function (w) { IDX[w] = g[0]; }); });
  var STOP = {};
  ("za in z s ki bi rad rada bi se je so sem na v k h od do po pri o ali pa ta to tak taka kaksen kaksno kateri katera katere kaj kje kako iscem potrebujem rabim hocem zelim imam imate ima delam dela nekaj neki eno en ena dober dobra dobro mi me moj moja naj lahko ce ko ter tudi samo set seti sestav").split(" ").forEach(function (w) { STOP[w] = 1; });

  function stem(w) {
    if (IDX[w]) return IDX[w];
    var keys = Object.keys(IDX);
    for (var i = 0; i < keys.length; i++) if (keys[i].length >= 4 && w.indexOf(keys[i]) === 0) return IDX[keys[i]];
    if (w.length > 5) w = w.replace(/(ami|ov|ev|ih|om|em|ih|ega|emu|ima)$/, "");
    if (w.length > 3) w = w.replace(/[aeiou]$/, "");
    return w;
  }
  function words(s) {
    return norm(s).split(/[\s,.;:]+/).filter(function (w) { return w && !STOP[w] && !/^\d+$/.test(w); }).map(stem);
  }

  // Sizes and limits in the question.
  function parse(q) {
    var n = norm(q), o = { raw: q, words: [] };
    var m = n.replace(/\s/g, "").match(/\d{7,11}/);
    if (m) o.code = m[0];
    m = n.match(/\b(?:sw|kljuc\w*|velikost\w*)\s*(\d{1,2})\b/); if (m) o.sw = +m[1];
    m = n.match(/\b(?:tx|torx)\s*-?\s*(\d{1,2})\b/); if (m) o.tx = +m[1];
    m = n.match(/\b(?:imbus|inbus|hex)\s*-?\s*(\d{1,2})\b/) || n.match(/\b(\d{1,2})\s*(?:mm\s*)?(?:imbus|inbus)\b/); if (m) o.imb = +m[1];
    m = n.match(/\b(1\/4|3\/8|1\/2)\b/g); if (m) o.drive = m;
    m = n.match(/(?:do|pod|manj kot|najvec|ozj\w*|sirok\w* do|vrata\w*|prehod\w*|sirin\w* do)\s*(?:od\s*)?(\d{2,4})\s*(cm|mm|m)?\b/);
    if (m && !/kg/.test(n.slice(m.index, m.index + m[0].length + 3))) { var v = +m[1]; o.maxW = m[2] === "cm" || (!m[2] && v < 200) ? v * 10 : v; }
    m = n.match(/(\d{2,4})\s*kg/); if (m) o.minKg = +m[1];
    var used = n.replace(/\b(?:sw|tx|torx|imbus|inbus)\s*-?\s*\d{1,2}\b/g, " ").replace(/(\d{2,4})\s*(cm|mm|kg)/g, " ");
    o.words = words(used).filter(function (w, i, a) { return a.indexOf(w) === i; });
    return o;
  }

  function buildText(C) {
    var groups = {};
    C.skupine.forEach(function (g) { groups[g.id] = g.naziv; });
    C.seti.forEach(function (s) {
      var base = s.naziv + " " + groups[s.skupina];
      s._w = words(base);
      s._c = (s.vsebina || []).map(function (r) { return { r: r, w: words(r.n) }; });
    });
    C.vozicki.forEach(function (v) { v._w = words(v.naziv + " " + v.linija + " voziček " + v.lastnosti.join(" ")); });
    C.sestavi.forEach(function (a) { a._w = words(a.naziv + " voziček sestav orodje"); });
  }

  function hit(list, word) {
    for (var i = 0; i < list.length; i++) if (list[i] === word || (word.length >= 4 && list[i].indexOf(word) === 0)) return true;
    return false;
  }

  function contentHit(s, p) {
    var why = [], n = 0;
    (s.vsebina || []).forEach(function (r) {
      if (p.sw && r.sw && r.sw.indexOf(p.sw) >= 0) { why.push("SW " + p.sw + ": " + r.n); n += 6; }
      else if (p.sw && r.swr && p.sw >= r.swr[0] && p.sw <= r.swr[1]) { why.push("SW " + p.sw + " je v razponu: " + r.n); n += 3; }
      if (p.tx && r.tx && r.tx.indexOf(p.tx) >= 0) { why.push("TX" + p.tx + ": " + r.n); n += 6; }
      else if (p.tx && r.txr && p.tx >= r.txr[0] && p.tx <= r.txr[1]) { why.push("TX" + p.tx + " je v razponu: " + r.n); n += 3; }
      if (p.imb && r.imb && r.imb.indexOf(p.imb) >= 0) { why.push("Imbus " + p.imb + ": " + r.n); n += 6; }
    });
    return { n: n, why: why };
  }

  var INTENT = [
    { re: /\b(kombi|vozil|avto|servis|mehanik|karoserij|lak|kamion|tovornjak)/, id: "c7", why: "Gumijasta zaščita na robovih preprečuje poškodbe na vozilih", stran: 3, pts: 6 },
    { re: /\b(mercedes|benz)/, id: "c8", why: "Sestav orodja za vozila Mercedes", stran: 18, pts: 8 },
    { re: /\b(fendt|traktor|kmetij|mehanizacij)/, id: "c7", why: "Na voljo kot Fendt Edition", stran: 3, pts: 8 },
    { re: /\b(tezk|industrij|velik|strojegrad|masivn|najvecj)/, id: "xxl", why: "Največja skupna nosilnost: 1000 kg", stran: 11, pts: 5 },
    { re: /\b(tezk|industrij|masivn)/, id: "we", why: "Skupna nosilnost 500 kg", stran: 10, pts: 4 },
    { re: /\b(varn|otrok|prevrn|nenamern)/, id: "c7", why: "Predali se odpirajo samo posamično", stran: 3, pts: 4 },
    { re: /\b(varn|nenamern|premika)/, id: "b88", why: "Dvojno zaklepanje: centralno in mehanska zapora na vsakem predalu", stran: 4, pts: 4 },
    { re: /\b(ozk|majhn|kompakt|utesnjen|ozek)/, id: "b84", why: "Najožji: 665 mm", stran: 6, pts: 5 },
    { re: /\b(perforiran|kavelj|kavlj)/, id: "s7", why: "Možnost perforiranih plošč na straneh", stran: 2, pts: 6 },
    { re: /\b(les|lesen|delovna plosc|miz)/, id: "xxl", why: "Različica z leseno ploščo", stran: 11, pts: 5 }
  ];
  var TOOL = {};
  SYN.forEach(function (g) { TOOL[g[0]] = 1; });
  var COLOURS = [[/\b(rdec|crven|red)/, "3020"], [/\b(moder|modr|plav|blue)/, "5010"], [/\b(crn|black)/, "9017"], [/\b(siv|grey|gray)/, "7047"], [/\b(zelen|green)/, "FENDT"]];

  function run(C, q) {
    var p = parse(q), n = norm(q), R = { vozicki: [], sestavi: [], seti: [], p: p };
    if (p.code) {
      C.vozicki.forEach(function (v) {
        (v.barve || []).concat(v.dodatki || [], v.rezervni_deli ? v.rezervni_deli.deli : []).forEach(function (b) {
          if (b.art.replace(/\s/g, "").indexOf(p.code) === 0) R.vozicki.push({ item: v, score: 50, why: ["Šifra " + b.art + (b.ral ? " · " + (WK.RAL[b.ral] || [])[1] : b.naziv ? " · " + b.naziv : b.risba ? " · rezervni del: " + b.risba : "")] });
        });
      });
      C.seti.forEach(function (s) {
        if (s.id.indexOf(p.code) === 0) R.seti.push({ item: s, score: 50, why: ["Šifra seta"] });
        else (s.vsebina || []).forEach(function (r) { if (r.a.replace(/\s/g, "").indexOf(p.code) === 0) R.seti.push({ item: s, score: 40, why: ["V vsebini seta: " + r.n] }); });
      });
      return R;
    }
    var vScores = {}, sized = p.sw || p.tx || p.imb;
    C.vozicki.forEach(function (v) {
      var score = 0, why = [];
      p.words.forEach(function (w) { if (!TOOL[w] && hit(v._w, w)) score += 2; });
      INTENT.forEach(function (x) { if (x.id === v.id && x.re.test(n)) { score += x.pts; why.push(x.why + " (str. " + x.stran + ")"); } });
      COLOURS.forEach(function (c) {
        if (c[0].test(n)) v.barve.forEach(function (b) { if (b.ral === c[1] && !why.some(function (t) { return /RAL|Fendt Ed/.test(t) && t === WK.RAL[b.ral][1]; })) { score += 2; why.push(WK.RAL[b.ral][1]); } });
      });
      if (sized) { score = 0; why = []; }
      if (p.maxW) {
        if (!v.sirina) { score = 0; why = []; }
        else if (v.sirina <= p.maxW) { score += 3; why.push("Širina " + v.sirina + " mm"); }
        else score = -99;
      }
      if (p.minKg) {
        var kg = Math.max(v.nosilnost_skupaj || 0, v.nosilnost_predala || 0);
        if (v.nosilnost_skupaj && v.nosilnost_skupaj >= p.minKg) { score += 4; why.push("Skupna nosilnost " + v.nosilnost_skupaj + " kg"); }
        else if (v.nosilnost_predala && v.nosilnost_predala >= p.minKg && p.minKg <= 40) { score += 4; why.push("Nosilnost predala " + v.nosilnost_predala + " kg"); }
        else if (kg) score = -99; else score -= 3;
      }
      vScores[v.id] = score;
      if (score > 0) R.vozicki.push({ item: v, score: score, why: why });
    });
    C.seti.forEach(function (s) {
      var score = 0, why = [];
      p.words.forEach(function (w) { if (w !== "kljuc" && hit(s._w, w)) score += 3; else if (w === "kljuc" && hit(s._w, w)) score += 1; });
      var c = contentHit(s, p);
      score += c.n; why = why.concat(c.why.slice(0, 2));
      // A word found in the contents counts once, however many rows have it.
      if (!c.n) p.words.forEach(function (w) {
        if (w.length < 4 || hit(s._w, w)) return;
        var row = (s._c || []).filter(function (x) { return hit(x.w, w); })[0];
        if (row) { score += 1; if (why.length < 2) why.push("V vsebini: " + row.r.n); }
      });
      if (sized && !c.n) score = 0;   // a size must be proven by the contents table
      if (p.drive) { var hasAll = p.drive.every(function (d) { return s.naziv.indexOf(d) >= 0; }); if (hasAll) score += 3; else if (score && /″/.test(s.naziv)) score -= 2; }
      if (score > 1) R.seti.push({ item: s, score: score, why: why });
    });
    C.sestavi.forEach(function (a) {
      var score = 0, why = [];
      p.words.forEach(function (w) { if (w !== "vozick" && hit(a._w, w)) score += 2; });
      if (vScores[a.voz] > 2) score += 1;
      if (vScores[a.voz] === -99) score = 0;
      R.seti.slice(0, 8).forEach(function (r) { if (a.seti.some(function (x) { return x[0] === r.item.art; }) && r.score > 2) { score += 1; if (!why.length) why.push("Vsebuje " + r.item.naziv); } });
      if (score > 1) R.sestavi.push({ item: a, score: score, why: why });
    });
    [R.vozicki, R.seti, R.sestavi].forEach(function (l) { l.sort(function (a, b) { return b.score - a.score; }); });
    return R;
  }
  window.WKSearch = { build: buildText, run: run, parse: parse };
})();
