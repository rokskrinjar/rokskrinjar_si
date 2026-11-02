// Mojster concept: shared helpers (escaping, markdown, catalogue data, trolley drawing, drawer packing, stores).
(function () {
  "use strict";
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  }
  function inline(s) {
    s = esc(s);
    s = s.replace(/\[([^\]]+)\]\((https:\/\/[^\s)]+|mailto:[^\s)@]+@[^\s)]+|tel:\+?\d+|[a-z0-9.\/#?=&-]+\.html[^\s)]*)\)/g, '<a href="$2">$1</a>');
    s = s.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
    return s;
  }
  // Small markdown: paragraphs, bullet and numbered lists, links, bold.
  function md(text) {
    var out = [], list = null;
    String(text || "").split(/\n/).forEach(function (line) {
      var m = line.match(/^\s*(\d+)[.)]\s+(.*)$/), b = line.match(/^\s*[-*•]\s+(.*)$/);
      if (m || b) {
        var type = m ? "ol" : "ul";
        if (list !== type) { if (list) out.push("</" + list + ">"); out.push("<" + type + ">"); list = type; }
        out.push("<li>" + inline(m ? m[2] : b[1]) + "</li>");
      } else {
        if (list) { out.push("</" + list + ">"); list = null; }
        if (line.trim()) out.push("<p>" + inline(line.replace(/^#+\s*/, "")) + "</p>");
      }
    });
    if (list) out.push("</" + list + ">");
    return out.join("");
  }
  function store(area, key, value) {
    try {
      if (value === undefined) return JSON.parse(area.getItem(key) || "null");
      area.setItem(key, JSON.stringify(value));
    } catch (e) { return null; }
  }

  // ---------- Catalogue ----------
  var RAL = {
    "3020": ["#c1121c", "rdeča RAL 3020"], "5010": ["#0e518d", "modra RAL 5010"], "5012": ["#1f8fc4", "svetlo modra RAL 5012"],
    "7035": ["#c5c9c7", "svetlo siva RAL 7035"], "7047": ["#d0d2d0", "siva RAL 7047"], "9017": ["#26272a", "črna RAL 9017"], "FENDT": ["#3a8f3f", "Fendt Edition"]
  };
  var data = null;
  function load() {
    if (data) return data;
    data = fetch("assets/catalog.json").then(function (r) { return r.json(); }).then(function (C) {
      C.setBy = {}; C.vozBy = {}; C.asmBy = {};
      C.seti.forEach(function (s) { s.id = s.art.replace(/\s/g, ""); s.v = []; C.setBy[s.id] = s; });
      C.vozicki.forEach(function (v) { C.vozBy[v.id] = v; });
      C.sestavi.forEach(function (a) {
        C.asmBy[a.id] = a;
        a.seti.forEach(function (p) { C.setBy[p[0].replace(/\s/g, "")].v.push(a.id); });
      });
      return C;
    });
    return data;
  }
  function pdf(C, page) { return C.vir.pdf + "#page=" + page; }
  function source(C, page) { return '<a class="src" href="' + pdf(C, page) + '" target="_blank" rel="noopener">str. ' + page + " v PDF-ju ↗</a>"; }

  // First fit in 2-unit steps: a bay has 8 units (2.4.1 = 2, 4.4.1 = 4, 6.4.1 = 6, 8.4.1 = 8).
  // Every drawer has polja bays. Bigger sets go first so the small ones fill the gaps.
  function pack(C, v, ids) {
    var bays = [], n = v.predali * v.polja, out = [], order = ids.map(function (id, i) { return { s: C.setBy[id], i: i }; });
    for (var b = 0; b < n; b++) bays.push({ free: 8, items: [] });
    order.sort(function (a, b) { return b.s.modul - a.s.modul || a.i - b.i; });
    order.forEach(function (o) {
      for (var i = 0; i < n; i++) if (bays[i].free >= o.s.modul) { bays[i].free -= o.s.modul; bays[i].items.push(o.s); return; }
      out.push(o.s);
    });
    var drawers = [];
    for (var d = 0; d < v.predali; d++) drawers.push(bays.slice(d * v.polja, (d + 1) * v.polja));
    var used = drawers.filter(function (dr) { return dr.some(function (x) { return x.items.length; }); }).length;
    return { drawers: drawers, over: out, used: used, units: ids.reduce(function (t, id) { return t + C.setBy[id].modul; }, 0) - out.reduce(function (t, s) { return t + s.modul; }, 0), cap: n * 8 };
  }
  function moduleIcon(m) {
    var h = '<span class="mod" aria-hidden="true">';
    for (var i = 0; i < 4; i++) h += "<i" + (i < m / 2 ? ' class="on"' : "") + "></i>";
    return h + "</span>";
  }

  // Front view of a trolley, drawn from its catalogue measures. Drawer split is schematic.
  function front(v, ral, x, base, k) {
    var c = (RAL[ral] || RAL["3020"])[0], W = (v.sirina || 710) * .92 * k, H = (v.visina || 985) * k, wh = Math.max(9, 70 * k), body = H - wh * 1.5;
    var top = base - H, left = x, s = "", shallow = v.predali - 2, inner = body - 16 * k - 22 * k, unit = inner / (shallow + 2 * 2.1), y = top + 22 * k + 8 * k;
    var dark = ral === "9017" ? "#3a3c41" : "#16171a", light = ral === "9017" || ral === "5010";
    s += '<g class="body">';
    s += '<rect x="' + left + '" y="' + (top + 22 * k) + '" width="' + W + '" height="' + body + '" fill="' + c + '"/>';
    s += '<rect x="' + (left - 6 * k) + '" y="' + top + '" width="' + (W + 12 * k) + '" height="' + (24 * k) + '" fill="' + (ral === "9017" ? "#54565c" : "#26272a") + '"/>';
    for (var i = 0; i < v.predali; i++) {
      var h = (i < shallow ? 1 : 2.1) * unit;
      s += '<rect x="' + (left + W * .06) + '" y="' + y + '" width="' + (W * .88) + '" height="' + Math.max(2, h - 2.6 * k) + '" fill="' + dark + '"/>';
      s += '<rect x="' + (left + W * .08) + '" y="' + (y + Math.min(5 * k, h * .15)) + '" width="' + (W * .84) + '" height="' + Math.max(1, 14 * k) + '" fill="' + (light ? "#8f9198" : "#b9bbc0") + '" opacity=".75"/>';
      y += h;
    }
    s += "</g>";
    var r = wh * .75;
    [left + W * .13, left + W * .87].forEach(function (cx) {
      s += '<rect x="' + (cx - r * .5) + '" y="' + (top + 22 * k + body - 1) + '" width="' + r + '" height="' + (wh * .6) + '" fill="#8f9198"/>';
      s += '<circle cx="' + cx + '" cy="' + (base - r) + '" r="' + r + '" fill="#34363b" stroke="#8f9198" stroke-width="' + Math.max(1, 8 * k) + '"/>';
    });
    return s;
  }
  // Single trolley with dimension lines, or none when the catalogue gives no measures.
  function drawing(v, ral, opts) {
    opts = opts || {};
    var hpx = opts.h || 150, ref = opts.ref || v.visina || 985, k = hpx / ref, W = (v.sirina || 710), pad = opts.dims ? 46 : 8;
    var w = W * k + pad * 2, H = hpx + (opts.dims ? 30 : 6);
    var s = '<svg role="img" aria-label="Shema vozička ' + esc(v.naziv) + '" width="' + Math.round(w) + '" height="' + Math.round(H) + '" viewBox="0 0 ' + Math.round(w) + " " + Math.round(H) + '">';
    s += front(v, ral || v.barve[0].ral, pad + W * .04 * k, hpx + 2, k);
    if (opts.dims && v.visina) {
      var c = "#b5b7bd", bx = pad + W * k + 10, by = hpx + 12;
      s += '<path d="M' + bx + " 2V" + (hpx + 2) + "M" + (bx - 4) + " 2h8M" + (bx - 4) + " " + (hpx + 2) + 'h8" stroke="' + c + '" fill="none"/>';
      s += '<text x="' + (bx - 6) + '" y="' + (hpx / 2) + '" text-anchor="end" transform="rotate(-90 ' + (bx - 6) + " " + (hpx / 2) + ')" dy="-3" style="text-anchor:middle">' + v.visina + " mm</text>";
      s += '<path d="M' + pad + " " + by + "H" + (pad + W * k) + "M" + pad + " " + (by - 4) + "v8M" + (pad + W * k) + " " + (by - 4) + 'v8" stroke="' + c + '" fill="none"/>';
      s += '<text x="' + (pad + W * k / 2) + '" y="' + (by + 11) + '" text-anchor="middle">' + W + " mm</text>";
    }
    return s + "</svg>";
  }
  // All trolleys with known measures, side by side at one scale.
  function lineup(C, ids, opts) {
    opts = opts || {};
    var list = (ids || C.vozicki.map(function (v) { return v.id; })).map(function (id) { return C.vozBy[id]; }).filter(function (v) { return v.visina; });
    var hpx = opts.h || 190, k = hpx / 1055, gap = 16, x = 6, s = "", total = 12;
    list.forEach(function (v) { total += v.sirina * k + gap; });
    list.forEach(function (v) {
      s += '<g data-id="' + v.id + '" tabindex="0" role="button" aria-label="' + esc(v.naziv) + '">' + front(v, opts.ral && opts.ral[v.id] || v.barve[0].ral, x, hpx + 4, k);
      s += '<text x="' + (x + v.sirina * k * .46) + '" y="' + (hpx + 20) + '" text-anchor="middle">' + esc(v.naziv.replace("Sistem ", "").replace(" 7 ", " ")) + "</text></g>";
      x += v.sirina * k + gap;
    });
    return '<svg class="lineup" role="group" aria-label="Vozički v istem merilu" viewBox="0 0 ' + Math.round(total) + " " + (hpx + 26) + '">' + s + "</svg>";
  }

  // ---------- Stores (this browser only) ----------
  var LEADS = "wuerth-katalog-povprasevanja", SIG = "wuerth-katalog-signali", CMP = "wuerth-katalog-primerjava";
  function leads() { return store(localStorage, LEADS) || []; }
  function addLead(o) {
    var list = leads();
    o.id = "P-" + (1041 + list.length);
    o.cas = new Date().toISOString();
    o.status = "nov";
    list.unshift(o);
    store(localStorage, LEADS, list.slice(0, 30));
    return o;
  }
  function clearLeads() { try { localStorage.removeItem(LEADS); } catch (e) {} }
  function signals() { return store(localStorage, SIG) || { iskanja: [], ogledi: {} }; }
  function signal(type, value, hits) {
    var s = signals();
    if (type === "iskanje") { s.iskanja.unshift({ q: value, zadetki: hits, cas: Date.now() }); s.iskanja = s.iskanja.slice(0, 60); }
    else s.ogledi[value] = (s.ogledi[value] || 0) + 1;
    store(localStorage, SIG, s);
  }
  function clearSignals() { try { localStorage.removeItem(SIG); } catch (e) {} }
  function compareList() { return store(localStorage, CMP) || []; }
  function compareSave(list) { store(localStorage, CMP, list); }

  // Inquiry card shared by the chat, the builder and the sales inbox.
  function leadCard(o, opts) {
    opts = opts || {};
    var div = document.createElement("div");
    div.className = "lead";
    div.innerHTML =
      '<div class="rowh"><b>' + esc(o.naslov || "Povpraševanje") + "</b>" + (o.dejavnost ? '<span class="pill">' + esc(o.dejavnost) + "</span>" : "") +
      (opts.meta ? '<span class="meta">' + esc(opts.meta) + "</span>" : "") + "</div><dl>" +
      (o.izdelki && o.izdelki.length ? "<dt>Izdelki</dt><dd>" + o.izdelki.map(function (x) { return '<span class="art">' + esc(x) + "</span>"; }).join(", ") + "</dd>" : "") +
      (o.potreba ? "<dt>Potreba</dt><dd>" + esc(o.potreba) + "</dd>" : "") +
      (o.dodatno ? "<dt>Dodatno</dt><dd>" + esc(o.dodatno) + "</dd>" : "") +
      (o.korak ? "<dt>Naslednji korak</dt><dd>" + esc(o.korak) + "</dd>" : "") + "</dl>";
    return div;
  }

  document.addEventListener("DOMContentLoaded", function () {
    var nav = document.querySelector(".nav"), cur = nav && nav.querySelector("[aria-current]");
    if (cur && nav.scrollWidth > nav.clientWidth) nav.scrollLeft = cur.offsetLeft - 16;
  });

  window.WK = {
    esc: esc, md: md, RAL: RAL, load: load, pdf: pdf, source: source, pack: pack, moduleIcon: moduleIcon, drawing: drawing, lineup: lineup,
    leads: leads, addLead: addLead, clearLeads: clearLeads, leadCard: leadCard, signals: signals, signal: signal, clearSignals: clearSignals,
    compareList: compareList, compareSave: compareSave, store: store
  };
})();
