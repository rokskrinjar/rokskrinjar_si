// Solis DIY planner: project or custom cut list → nesting → price estimate → inquiry preview.
(function () {
  "use strict";
  var E = window.SolisEngine;
  var CAT, PROJ;
  var S = { mode: "project", pid: "raised-bed", params: {}, variant: "", items: [], title: "", opts: { edges: "round", knotfree: false, ht: false, delivery: "pickup", place: "Ljubljana", extras: {} } };

  var T = {
    s1: { sl: "Projekt", en: "Project" }, s2: { sl: "Mere in les", en: "Sizes and wood" }, s3: { sl: "Kosovnik", en: "Cut list" }, s4: { sl: "Krojni načrt", en: "Cutting plan" },
    custom: { sl: "Lasten kosovnik", en: "Own cut list" },
    customIntro: { sl: "Vpišite dele sami ali jih naložite iz pogovora s Skobeljem. Načrtovalnik jih razporedi na deske in izračuna ceno.", en: "Enter the parts yourself or load them from a chat with Skobelj. The planner nests them onto boards and prices them." },
    titlePh: { sl: "Ime projekta", en: "Project name" },
    steps: { sl: "Postopek", en: "Steps" }, tools: { sl: "Orodje", en: "Tools" }, finish: { sl: "Zaščita", en: "Finish" }, mistakes: { sl: "Pogoste napake", en: "Common mistakes" },
    variant: { sl: "Les", en: "Wood" },
    edges: { sl: "Zaobljeni robovi (skobljan les)", en: "Rounded edges (planed)" },
    knotfree: { sl: "Radialen les brez grč (+20 %)", en: "Knot-free quarter-sawn (+20 %)" },
    ht: { sl: "Toplotna obdelava HT (svež les)", en: "Heat treatment HT (fresh sawn)" },
    part: { sl: "Del", en: "Part" }, mat: { sl: "Les", en: "Wood" }, sec: { sl: "Prerez", en: "Section" }, len: { sl: "Dolžina", en: "Length" }, qty: { sl: "Kosov", en: "Qty" },
    edit: { sl: "Uredi kosovnik", en: "Edit cut list" }, add: { sl: "+ Dodaj del", en: "+ Add part" }, toProject: { sl: "← Nazaj na projekt", en: "← Back to project" },
    noItems: { sl: "Kosovnik je prazen. Dodajte del ali vprašajte Skobelja.", en: "The cut list is empty. Add a part or ask Skobelj." },
    askCheck: { sl: "Vprašaj Skobelja o tem načrtu", en: "Ask Skobelj about this plan" },
    boards: { sl: "desk", en: "boards" }, waste: { sl: "odpadek", en: "offcut" }, cutToLen: { sl: "odrezano na mero", en: "cut to length" },
    sum: { sl: "Povzetek", en: "Summary" }, wood: { sl: "Les z žage", en: "Timber from the mill" },
    vol: { sl: "Prostornina", en: "Volume" }, kg: { sl: "Teža", en: "Weight" }, cuts: { sl: "Rezi", en: "Cuts" },
    material: { sl: "Les", en: "Timber" }, cutting: { sl: "Razrez po meri", en: "Cutting to size" }, small: { sl: "Doplačilo za malo naročilo", en: "Small-order fee" },
    extrasT: { sl: "Dodatki iz ostankov", en: "Extras from the offcuts" }, deliv: { sl: "Prevzem in dostava", en: "Pickup and delivery" },
    place: { sl: "Kraj dostave", en: "Delivery to" }, total: { sl: "Skupaj z DDV", en: "Total incl. VAT" }, net: { sl: "brez DDV", en: "excl. VAT" },
    save: { sl: "V trgovini DIY bi enak les stal približno", en: "In a DIY store the same timber would cost about" },
    saveNo: { sl: "za izdelke, ki jih trgovine imajo", en: "for products the stores carry" },
    send: { sl: "Pošlji povpraševanje", en: "Send inquiry" }, link: { sl: "Kopiraj povezavo", en: "Copy link" }, copied: { sl: "Kopirano ✓", en: "Copied ✓" },
    print: { sl: "Natisni / PDF", en: "Print / PDF" },
    fine: { sl: "Ilustrativne cene koncepta (okt. 2026), ne cenik Solis Timber. Primerjava: povprečne cene skobljanega lesa, KVH in BSH v slovenskih trgovinah DIY, okt. 2026.", en: "Illustrative concept prices (Oct 2026), not a Solis Timber price list. Comparison: average prices of planed timber, KVH and glulam in Slovenian DIY stores, Oct 2026." },
    off: { sl: "ni mogoče", en: "not possible" },
    why: { parcel: { sl: "kosi nad 2 m ali pretežko", en: "pieces over 2 m or too heavy" }, van: { sl: "kosi nad 4 m ali nad 1 t", en: "pieces over 4 m or over 1 t" } },
    soon: { sl: "kmalu", en: "soon" },
    err: { product: { sl: "neznan izdelek", en: "unknown product" }, species: { sl: "ta vrsta ni na voljo", en: "species not available" }, section: { sl: "prerez ni na voljo", en: "section not available" }, length: { sl: "dolžina izven razpona", en: "length out of range" }, qty: { sl: "napačna količina", en: "bad quantity" } },
    imported: { sl: "Naloženo iz pogovora s Skobeljem", en: "Loaded from the chat with Skobelj" },
    struct: { sl: "Nosilna konstrukcija: prerezi so tipični za oceno, ne statični izračun. Pri strehi preverite sneg in dovoljenja.", en: "Load-bearing structure: sections are typical for estimating, not a structural calculation. With a roof, check snow load and permits." },
    orderH: { sl: "Povpraševanje", en: "Inquiry" },
    tabYou: { sl: "Vaš povzetek", en: "Your summary" }, tabMill: { sl: "Kar prejme žaga", en: "What the mill receives" },
    demo: { sl: "To je koncept: nič se ne pošlje. V živi različici bi tu vpisali ime, telefon in želeni termin prevzema, žaga pa bi prejela spodnji delovni nalog z razrezom za vsako desko.", en: "This is a concept: nothing is sent. In a live version you would add your name, phone and pickup slot, and the mill would receive the work order below, with the cutting plan for every board." },
    copy: { sl: "Kopiraj besedilo", en: "Copy text" }
  };
  function t(k) { return SD.tr(T[k]); }
  function esc(s) { return SD.esc(s); }
  function project() { return PROJ.planner.find(function (p) { return p.id === S.pid; }); }
  function prodName(id) { var p = E.productById(CAT, id); return p ? p[SD.lang()].name : id; }
  function spName(id) { return CAT.species[id] ? SD.tr(CAT.species[id]) : id; }
  function km() { var p = CAT.places.find(function (x) { return x[0] === S.opts.place; }); return p ? p[1] : 0; }
  function m(n) { return SD.num(n / 1000, n % 1000 ? (n % 100 ? 3 : 1) : 1) + " m"; }

  function items() {
    if (S.mode === "custom") return S.items;
    var p = project();
    var it = E.GEN[p.id](S.params, S.variant);
    return it;
  }

  // ---------- URL state ----------
  function b64(s) { return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
  function unb64(s) { s = s.replace(/-/g, "+").replace(/_/g, "/"); return decodeURIComponent(escape(atob(s))); }
  function toHash() {
    var h = [];
    if (S.mode === "custom") h.push("c=" + b64(JSON.stringify({ t: S.title, i: S.items.map(function (i) { return [SD.tr(i.label), i.product, i.species, i.section, i.length, i.qty]; }) })));
    else {
      h.push("p=" + S.pid, "v=" + S.variant);
      Object.keys(S.params).forEach(function (k) { h.push(k + "=" + S.params[k]); });
    }
    if (S.opts.delivery !== "pickup") h.push("d=" + S.opts.delivery);
    if (S.opts.delivery === "van" || S.opts.delivery === "truck") h.push("pl=" + encodeURIComponent(S.opts.place));
    if (S.opts.knotfree) h.push("kf=1");
    if (S.opts.ht) h.push("ht=1");
    if (S.opts.edges !== "round") h.push("e=" + S.opts.edges);
    var x = Object.keys(S.opts.extras).filter(function (k) { return S.opts.extras[k] > 0; }).map(function (k) { return k + ":" + S.opts.extras[k]; });
    if (x.length) h.push("x=" + x.join(","));
    history.replaceState(null, "", "#" + h.join("&"));
  }
  function fromHash() {
    var h = {};
    location.hash.replace(/^#/, "").split("&").forEach(function (kv) { var i = kv.indexOf("="); if (i > 0) h[kv.slice(0, i)] = kv.slice(i + 1); });
    if (location.hash === "#import") {
      try { var cut = JSON.parse(sessionStorage.getItem("solis-diy-import") || "null"); sessionStorage.removeItem("solis-diy-import"); if (cut) { applyCut(cut); return; } } catch (e) {}
    }
    if (h.c) {
      try {
        var c = JSON.parse(unb64(h.c));
        S.mode = "custom"; S.title = c.t || "";
        S.items = (c.i || []).map(function (a) { return { label: a[0], product: a[1], species: a[2], section: a[3], length: Number(a[4]), qty: Number(a[5]) }; });
      } catch (e) {}
    } else if (h.p && PROJ.planner.some(function (p) { return p.id === h.p; })) S.pid = h.p;
    var p = project();
    S.params = E.defaults(p);
    p.params.forEach(function (q) { if (h[q.id] != null && !isNaN(Number(h[q.id]))) S.params[q.id] = Number(h[q.id]); });
    S.variant = h.v && p.variants.some(function (v) { return v.id === h.v; }) ? h.v : p.variants[0].id;
    if (h.d) S.opts.delivery = h.d;
    if (h.pl) S.opts.place = decodeURIComponent(h.pl);
    S.opts.knotfree = h.kf === "1" || S.pid === "sauna";
    S.opts.ht = h.ht === "1";
    if (h.e) S.opts.edges = h.e;
    if (h.x) h.x.split(",").forEach(function (kv) { var a = kv.split(":"); S.opts.extras[a[0]] = Number(a[1]) || 0; });
  }

  // ---------- Import from chat ----------
  // US nominal sizes from Pinterest/YouTube plans → nearest European planed section.
  var INCH = { "1x4": "20x95", "1x6": "20x145", "1x8": "28x195", "2x2": "45x45", "2x3": "45x70", "2x4": "45x95", "2x6": "45x145", "2x8": "45x195", "4x4": "95x95" };
  function nearestSection(pr, section) {
    section = String(section).replace(/[×X*]/g, "x").replace(/\s/g, "");
    if (INCH[section] && pr.sections.indexOf(INCH[section]) >= 0) return INCH[section];
    var d = E.dims(section);
    if (isNaN(d[0]) || isNaN(d[1])) return pr.sections[0];
    var best = pr.sections[0], bd = 1e9;
    pr.sections.forEach(function (s) { var e = E.dims(s), dd = Math.abs(e[0] - d[0]) * 2 + Math.abs(e[1] - d[1]); if (dd < bd) { bd = dd; best = s; } });
    return best;
  }
  function applyCut(cut) {
    S.mode = "custom";
    S.title = String(cut.title || "").slice(0, 80);
    S.items = (cut.items || []).slice(0, 60).map(function (i) {
      var pr = E.productById(CAT, i.product) || E.productById(CAT, "planed");
      var it = {
        label: String(i.label || "").slice(0, 60), product: pr.id,
        species: pr.species.indexOf(i.species) >= 0 ? i.species : pr.species[0],
        section: String(i.section || "").replace(/[×X*]/g, "x").replace(/\s/g, ""),
        length: Math.round(Number(i.length) || 0), qty: Math.max(1, Math.round(Number(i.qty) || 1))
      };
      if (pr.sections.indexOf(it.section) < 0) it.section = nearestSection(pr, it.section);
      return it;
    });
    S.imported = true;
  }

  // ---------- Rendering ----------
  function renderProject() {
    var el = document.getElementById("p-project"), l = SD.lang();
    var picks = PROJ.planner.map(function (p) {
      return '<button type="button" class="pick" data-pid="' + p.id + '" aria-pressed="' + (S.mode === "project" && S.pid === p.id) + '">' + SD.icon(p.icon, "") + esc(p[l].title) + "</button>";
    }).join("") + '<button type="button" class="pick" data-pid="" aria-pressed="' + (S.mode === "custom") + '">' + SD.icon(S.imported ? "import" : "custom", "") + t("custom") + "</button>";
    var body;
    if (S.mode === "custom") {
      body = '<h3 style="margin-top:16px">' + t("custom") + "</h3>" + (S.imported ? '<p class="note">' + t("imported") + "</p>" : "") +
        '<p class="muted">' + t("customIntro") + '</p><input type="text" id="ctitle" maxlength="80" style="width:100%" placeholder="' + esc(t("titlePh")) + '" value="' + esc(S.title) + '">';
    } else {
      var p = project(), g = p[l];
      body = '<div class="guide" style="margin-top:16px"><div><h3>' + esc(g.title) + ' <span class="level">' + [1, 2, 3].map(function (i) { return '<i class="' + (i <= p.level ? "on" : "") + '"></i>'; }).join("") + "</span></h3>" +
        "<p>" + esc(g.intro) + "</p>" + (p.level === 3 ? '<p class="note">' + t("struct") + "</p>" : "") +
        '<details class="more"' + (window.innerWidth > 700 ? " open" : "") + "><summary>" + t("steps") + "</summary><ol>" + g.steps.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ol></details></div>" +
        '<div class="side"><p><b>' + t("tools") + ":</b> " + esc(g.tools) + "</p><p><b>" + t("finish") + ":</b> " + esc(g.finish) + "</p><p><b>" + t("mistakes") + ":</b></p><ul>" +
        g.mistakes.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ul></div></div>";
    }
    el.innerHTML = '<h2><span class="n">01</span>' + t("s1") + '</h2><div class="picker" role="group">' + picks + "</div>" + body;
    el.querySelectorAll(".pick").forEach(function (b) {
      b.addEventListener("click", function () {
        if (b.dataset.pid) {
          S.mode = "project"; S.pid = b.dataset.pid; S.imported = false;
          var p = project(); S.params = E.defaults(p); S.variant = p.variants[0].id; S.opts.knotfree = S.pid === "sauna";
        } else if (S.mode !== "custom") toCustom();
        update(true);
      });
    });
    var ct = document.getElementById("ctitle");
    if (ct) ct.addEventListener("input", function () { S.title = ct.value; toHash(); });
    var sel = el.querySelector('.pick[aria-pressed="true"]');
    if (sel && sel.scrollIntoView && renderProject.first) sel.scrollIntoView({ block: "nearest", inline: "center" });
    renderProject.first = false;
  }
  renderProject.first = true;

  function toCustom() {
    var p = project();
    S.title = S.mode === "project" ? p[SD.lang()].title : S.title;
    S.items = items().map(function (i) { return { label: SD.tr(i.label), product: i.product, species: i.species, section: i.section, length: i.length, qty: i.qty }; });
    S.mode = "custom";
  }

  function renderParams(q) {
    var el = document.getElementById("p-params"), l = SD.lang(), html = '<h2><span class="n">02</span>' + t("s2") + "</h2>";
    if (S.mode === "project") {
      var p = project();
      html += '<div class="params">' + p.params.map(function (prm) {
        var v = S.params[prm.id], unit = prm.unit != null ? prm.unit : " mm";
        if (prm.type === "bool") return '<div class="param opts" style="margin:0"><label><input type="checkbox" data-prm="' + prm.id + '"' + (v ? " checked" : "") + "> " + esc(prm[l]) + "</label></div>";
        if (prm.type === "select") return '<div class="param"><label for="prm-' + prm.id + '">' + esc(prm[l]) + '</label><select id="prm-' + prm.id + '" data-prm="' + prm.id + '">' +
          prm.options.map(function (o) { return "<option value='" + o + "'" + (o === v ? " selected" : "") + ">" + SD.num(o / 10) + " cm</option>"; }).join("") + "</select></div>";
        var shown = unit === " mm" ? SD.num(v / 10, v % 10 ? 1 : 0) + " cm" : v + unit;
        return '<div class="param"><label for="prm-' + prm.id + '">' + esc(prm[l]) + "<output>" + shown + '</output></label><input type="range" id="prm-' + prm.id + '" data-prm="' + prm.id + '" min="' + prm.min + '" max="' + prm.max + '" step="' + prm.step + '" value="' + v + '"></div>';
      }).join("") + "</div>";
      if (p.variants.length > 1) html += '<h3 style="margin:18px 0 8px;font-size:1rem">' + t("variant") + '</h3><div class="radios">' + p.variants.map(function (v) {
        return '<label class="radio"><input type="radio" name="variant" value="' + v.id + '"' + (v.id === S.variant ? " checked" : "") + "> " + esc(v[l]) + "</label>";
      }).join("") + "</div>";
    }
    var has = {}; items().forEach(function (i) { has[i.product] = true; });
    var opts = [];
    if (has.planed) opts.push('<label><input type="checkbox" data-opt="edges"' + (S.opts.edges === "round" ? " checked" : "") + "> " + t("edges") + "</label>");
    if (has.radial) opts.push('<label><input type="checkbox" data-opt="knotfree"' + (S.opts.knotfree ? " checked" : "") + "> " + t("knotfree") + "</label>");
    if (has.fresh) opts.push('<label><input type="checkbox" data-opt="ht"' + (S.opts.ht ? " checked" : "") + "> " + t("ht") + "</label>");
    if (opts.length) html += '<div class="opts">' + opts.join("") + "</div>";
    if (S.mode === "custom" && !opts.length) html += '<p class="muted" style="margin:0">' + t("customIntro") + "</p>";
    el.innerHTML = html;
    el.querySelectorAll("input[type=range][data-prm]").forEach(function (r) {
      r.addEventListener("input", function () {
        S.params[r.dataset.prm] = Number(r.value);
        var v = Number(r.value), prm = project().params.find(function (x) { return x.id === r.dataset.prm; });
        var unit = prm.unit != null ? prm.unit : " mm";
        r.previousElementSibling.querySelector("output").textContent = unit === " mm" ? SD.num(v / 10, v % 10 ? 1 : 0) + " cm" : v + unit;
        update(false);
      });
    });
    el.querySelectorAll("select[data-prm]").forEach(function (s) { s.addEventListener("change", function () { S.params[s.dataset.prm] = Number(s.value); update(false); }); });
    el.querySelectorAll("input[type=checkbox][data-prm]").forEach(function (c) { c.addEventListener("change", function () { S.params[c.dataset.prm] = c.checked ? 1 : 0; update(false); }); });
    el.querySelectorAll("input[name=variant]").forEach(function (r) { r.addEventListener("change", function () { S.variant = r.value; update(false); }); });
    el.querySelectorAll("input[data-opt]").forEach(function (c) {
      c.addEventListener("change", function () {
        if (c.dataset.opt === "edges") S.opts.edges = c.checked ? "round" : "sharp"; else S.opts[c.dataset.opt] = c.checked;
        update(false);
      });
    });
  }

  function renderCut(q) {
    var el = document.getElementById("p-cut"), l = SD.lang(), list = items();
    var errAt = {}; q.errors.forEach(function (e) { errAt[e.index] = e.error; });
    var html = '<h2><span class="n">03</span>' + t("s3") + '</h2><div class="tw"><table class="cut"><thead><tr><th>' + t("part") + "</th><th>" + t("mat") + "</th><th>" + t("sec") + "</th><th>" + t("len") + "</th><th>" + t("qty") + "</th>" + (S.mode === "custom" ? "<th></th>" : "") + "</tr></thead><tbody>";
    if (!list.length) html += '<tr><td colspan="6"><div class="empty">' + t("noItems") + "</div></td></tr>";
    list.forEach(function (it, i) {
      var pr = E.productById(CAT, it.product);
      var err = errAt[i] ? ' class="err" title="' + esc(SD.tr(T.err[errAt[i]])) + '"' : "";
      if (S.mode === "custom") {
        html += "<tr" + err + '><td class="lbl"><input type="text" data-i="' + i + '" data-k="label" value="' + esc(SD.tr(it.label)) + '" style="width:100%"></td>' +
          '<td><select data-i="' + i + '" data-k="product">' + CAT.products.map(function (p) { return "<option value='" + p.id + "'" + (p.id === it.product ? " selected" : "") + ">" + esc(p[l].name) + (p.soon ? " (" + t("soon") + ")" : "") + "</option>"; }).join("") + "</select>" +
          (pr && pr.species.length > 1 ? '<br><select data-i="' + i + '" data-k="species" style="margin-top:4px">' + pr.species.map(function (s) { return "<option value='" + s + "'" + (s === it.species ? " selected" : "") + ">" + esc(spName(s)) + "</option>"; }).join("") + "</select>" : "") + "</td>" +
          '<td><select data-i="' + i + '" data-k="section">' + (pr ? pr.sections : []).map(function (s) { return "<option value='" + s + "'" + (s === it.section ? " selected" : "") + ">" + SD.sec(s) + "</option>"; }).join("") + "</select></td>" +
          '<td><input type="number" data-i="' + i + '" data-k="length" min="' + (pr ? pr.minLen : 100) + '" max="' + (pr ? pr.maxLen : 4000) + '" step="10" value="' + it.length + '"></td>' +
          '<td><input type="number" data-i="' + i + '" data-k="qty" min="1" max="500" value="' + it.qty + '" style="width:64px"></td>' +
          '<td><button type="button" class="x" data-del="' + i + '" aria-label="×">✕</button></td></tr>';
        if (errAt[i]) html += '<tr><td colspan="6" class="warnbox">' + esc(SD.tr(T.err[errAt[i]])) + (errAt[i] === "length" && pr ? " (" + pr.minLen + "–" + pr.maxLen + " mm)" : "") + "</td></tr>";
      } else {
        html += "<tr" + err + '><td class="lbl">' + esc(SD.tr(it.label)) + "</td><td>" + esc(prodName(it.product)) + '<br><span class="muted">' + esc(spName(it.species)) + '</span></td><td class="num">' + SD.sec(it.section) + '</td><td class="num">' + SD.num(it.length) + ' mm</td><td class="num">' + it.qty + "</td></tr>";
      }
    });
    html += "</tbody></table></div><div class=\"toolbar\">";
    if (S.mode === "custom") html += '<button type="button" class="btn ghost small" id="addrow">' + t("add") + "</button>";
    else html += '<button type="button" class="btn ghost small" id="editcut">' + t("edit") + "</button>";
    html += '<button type="button" class="btn ghost small" id="askplan">' + t("askCheck") + "</button></div>";
    el.innerHTML = html;
    el.querySelectorAll("[data-k]").forEach(function (f) {
      f.addEventListener("change", function () {
        var it = S.items[Number(f.dataset.i)], k = f.dataset.k;
        it[k] = k === "length" || k === "qty" ? Math.round(Number(f.value) || 0) : f.value;
        if (k === "product") {
          var pr = E.productById(CAT, it.product);
          if (pr.species.indexOf(it.species) < 0) it.species = pr.species[0];
          if (pr.sections.indexOf(it.section) < 0) it.section = nearestSection(pr, it.section);
        }
        update(k === "product");
      });
    });
    el.querySelectorAll("[data-del]").forEach(function (b) { b.addEventListener("click", function () { S.items.splice(Number(b.dataset.del), 1); update(true); }); });
    var add = document.getElementById("addrow");
    if (add) add.addEventListener("click", function () { S.items.push({ label: "", product: "planed", species: "sf", section: "28x145", length: 1000, qty: 1 }); update(true); });
    var ed = document.getElementById("editcut");
    if (ed) ed.addEventListener("click", function () { toCustom(); update(true); });
    document.getElementById("askplan").addEventListener("click", function () {
      if (window.SolisChat) window.SolisChat.open(SD.lang() === "sl" ? "Preveri moj trenutni načrt: ali je les primeren in ali česa manjka?" : "Check my current plan: is the wood right, and is anything missing?", true);
    });
  }

  function renderPlan(q) {
    var el = document.getElementById("p-plan");
    var html = '<h2><span class="n">04</span>' + t("s4") + '</h2><div class="diagram">';
    if (!q.lines.length) html += '<div class="empty">' + t("noItems") + "</div>";
    q.lines.forEach(function (ln) {
      var head = esc(prodName(ln.product)) + " · " + esc(spName(ln.species)) + " · " + SD.sec(ln.section);
      if (ln.bins) {
        var counts = Object.keys(ln.stockCount).sort(function (a, b) { return b - a; }).map(function (s) { return ln.stockCount[s] + " × " + m(Number(s)); }).join(" + ");
        html += "<div><h3>" + head + "<span>" + counts + " · " + t("waste") + " " + SD.num(ln.waste * 100) + " %</span></h3>";
        ln.bins.forEach(function (b) {
          html += '<div class="boardrow"><span class="len">' + m(b.stock) + '</span><div class="board">' + b.pieces.map(function (p) {
            return '<div class="pc" style="flex:0 0 ' + (p / b.stock * 100).toFixed(2) + '%" title="' + p + ' mm">' + (p / b.stock > .09 ? SD.num(p) : "") + "</div>";
          }).join("") + "</div></div>";
        });
        html += "</div>";
      } else {
        var max = Math.max.apply(null, ln.parts.map(function (p) { return p.length; }));
        html += "<div><h3>" + head + "<span>" + ln.pieces + " × " + t("cutToLen") + "</span></h3>";
        ln.parts.forEach(function (p) {
          for (var i = 0; i < Math.min(p.qty, 8); i++) html += '<div class="boardrow"><span class="len">' + m(p.length) + '</span><div class="board" style="background:none;border:0"><div class="pc" style="flex:0 0 ' + (p.length / max * 100).toFixed(1) + '%;border:1px solid var(--piece-line);border-radius:3px">' + esc(SD.tr(p.label)) + "</div></div></div>";
          if (p.qty > 8) html += '<p class="fine">+ ' + (p.qty - 8) + "</p>";
        });
        html += "</div>";
      }
    });
    el.innerHTML = html + "</div>";
  }

  function renderSummary(q) {
    var el = document.getElementById("summary"), l = SD.lang();
    var stock = q.lines.map(function (ln) {
      var what = ln.bins ? Object.keys(ln.stockCount).sort(function (a, b) { return b - a; }).map(function (s) { return ln.stockCount[s] + "× " + m(Number(s)); }).join(", ") : ln.pieces + "× " + t("cutToLen");
      return "<li><span>" + esc(prodName(ln.product)) + " " + SD.sec(ln.section) + (ln.species !== "sf" ? " · " + esc(spName(ln.species)) : "") + '<br><small class="muted">' + what + "</small></span><span>" + SD.eur(ln.price) + "</span></li>";
    }).join("");
    var D = CAT.delivery;
    var deliv = ["pickup", "parcel", "van", "truck"].map(function (k) {
      var md = q.modes[k], ok = md.ok;
      var price = ok ? (md.price ? SD.eur(md.price) : (l === "sl" ? "brezplačno" : "free")) : t("off");
      return '<label class="' + (ok ? "" : "off") + '"' + (!ok && T.why[k] ? ' title="' + esc(SD.tr(T.why[k])) + '"' : "") + '><span><input type="radio" name="deliv" value="' + k + '"' + (q.mode === k ? " checked" : "") + (ok ? "" : " disabled") + "> " + esc(SD.tr(D[k])) + "</span><span>" + price + "</span></label>";
    }).join("");
    var place = (q.mode === "van" || q.mode === "truck") ? '<label class="fine" for="place" style="display:block;margin-top:8px">' + t("place") + '</label><select id="place" style="width:100%">' +
      CAT.places.map(function (p) { return "<option" + (p[0] === S.opts.place ? " selected" : "") + ">" + esc(p[0]) + "</option>"; }).join("") + "</select>" : "";
    var extras = CAT.extras.map(function (x) {
      var n = S.opts.extras[x.id] || 0;
      return '<div class="extra"><span>' + esc(x[l]) + "<small>" + SD.eur(x.price) + (x.bulk ? " · " + x.bulk.from + "+: " + SD.eur(x.bulk.price) : "") + '</small></span><span class="stepper"><button type="button" data-x="' + x.id + '" data-d="-1" aria-label="−">−</button><input type="number" min="0" max="200" value="' + n + '" data-xi="' + x.id + '" aria-label="' + esc(x[l]) + '"><button type="button" data-x="' + x.id + '" data-d="1" aria-label="+">+</button></span></div>';
    }).join("");
    var saving = q.bench > q.material * 1.02 ? '<div class="save">' + t("save") + " <b>" + SD.eur(q.bench, 0) + "</b> " + (q.lines.some(function (x) { return !x.hasBench; }) ? "(" + t("saveNo") + ")" : "") + " · <b>−" + SD.num((1 - q.material / q.bench) * 100) + " %</b></div>" : "";
    el.innerHTML =
      '<div class="panel"><h2 style="font-size:1.2rem">' + t("sum") + "</h2>" +
      (q.lines.length ? '<ul class="stocklist">' + stock + "</ul>" : '<p class="muted">' + t("noItems") + "</p>") +
      '<div class="kv"><span>' + t("vol") + "</span><span>" + SD.num(q.volume, 3) + " m³</span></div>" +
      '<div class="kv"><span>' + t("kg") + "</span><span>≈ " + SD.num(q.kg) + " kg</span></div>" +
      '<div class="kv"><span>' + t("cuts") + "</span><span>" + q.cuts + "</span></div>" + saving + "</div>" +
      '<div class="panel"><h2 style="font-size:1.1rem">' + t("deliv") + '</h2><div class="deliv">' + deliv + "</div>" + place + "</div>" +
      '<div class="panel"><h2 style="font-size:1.1rem">' + t("extrasT") + '</h2><div class="extras">' + extras + "</div></div>" +
      '<div class="panel">' +
      '<div class="kv"><span>' + t("material") + "</span><span>" + SD.eur(q.material) + "</span></div>" +
      '<div class="kv"><span>' + t("cutting") + " (" + q.cuts + " × " + SD.eur(CAT.fees.cut) + ")</span><span>" + SD.eur(q.cutFee) + "</span></div>" +
      (q.extrasTotal ? '<div class="kv"><span>' + t("extrasT") + "</span><span>" + SD.eur(q.extrasTotal) + "</span></div>" : "") +
      (q.small ? '<div class="kv"><span>' + t("small") + "</span><span>" + SD.eur(q.small) + "</span></div>" : "") +
      '<div class="kv"><span>' + esc(SD.tr(D[q.mode])) + "</span><span>" + SD.eur(q.delivery) + "</span></div>" +
      '<div class="kv total"><span>' + t("total") + "</span><span>" + SD.eur(q.total) + "</span></div>" +
      '<div class="kv"><span class="muted">' + t("net") + '</span><span class="muted">' + SD.eur(q.net) + "</span></div>" +
      '<div class="toolbar noprint"><button type="button" class="btn primary" id="send" style="flex:1"' + (q.lines.length ? "" : " disabled") + ">" + t("send") + '</button></div>' +
      '<div class="toolbar noprint"><button type="button" class="btn ghost small" id="copylink">' + t("link") + '</button><button type="button" class="btn ghost small" id="print">' + t("print") + "</button></div>" +
      '<p class="fine">' + t("fine") + "</p></div>";

    el.querySelectorAll("input[name=deliv]").forEach(function (r) { r.addEventListener("change", function () { S.opts.delivery = r.value; update(false); }); });
    var pl = document.getElementById("place");
    if (pl) pl.addEventListener("change", function () { S.opts.place = pl.value; update(false); });
    el.querySelectorAll("[data-x]").forEach(function (b) {
      b.addEventListener("click", function () { var k = b.dataset.x; S.opts.extras[k] = Math.max(0, Math.min(200, (S.opts.extras[k] || 0) + Number(b.dataset.d))); update(false); });
    });
    el.querySelectorAll("[data-xi]").forEach(function (f) { f.addEventListener("change", function () { S.opts.extras[f.dataset.xi] = Math.max(0, Math.min(200, Math.round(Number(f.value) || 0))); update(false); }); });
    document.getElementById("send").addEventListener("click", function () { openOrder(q); });
    document.getElementById("copylink").addEventListener("click", function (e) {
      var b = e.currentTarget;
      (navigator.clipboard ? navigator.clipboard.writeText(location.href) : Promise.reject()).then(function () { b.textContent = t("copied"); setTimeout(function () { b.textContent = t("link"); }, 1500); }, function () {});
    });
    document.getElementById("print").addEventListener("click", function () { window.print(); });
  }

  // ---------- Inquiry preview ----------
  function ref() {
    var s = location.hash, h = 0;
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    var d = new Date();
    return "SD-" + String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, "0") + "-" + (h % 46656).toString(36).toUpperCase().padStart(3, "0");
  }
  function title() { return S.mode === "custom" ? (S.title || t("custom")) : project()[SD.lang()].title; }
  function youText(q) {
    var l = SD.lang(), out = [];
    out.push(t("orderH") + " " + ref() + " · " + title());
    if (S.mode === "project") out.push(project().params.map(function (p) { return p[l] + ": " + (p.type === "bool" ? (S.params[p.id] ? "✓" : "–") : S.params[p.id]); }).join(" · "));
    out.push("");
    q.lines.forEach(function (ln) {
      out.push("• " + prodName(ln.product) + ", " + spName(ln.species) + ", " + SD.sec(ln.section) + " mm");
      ln.parts.forEach(function (p) { out.push("    " + p.qty + " × " + p.length + " mm  " + SD.tr(p.label)); });
    });
    q.extras.forEach(function (x) { out.push("• " + x.qty + " × " + x.item[l]); });
    out.push("");
    out.push(t("vol") + ": " + SD.num(q.volume, 3) + " m³ · " + t("kg") + ": ≈ " + SD.num(q.kg) + " kg · " + t("cuts") + ": " + q.cuts);
    out.push(SD.tr(CAT.delivery[q.mode]) + (q.mode === "van" || q.mode === "truck" ? " → " + S.opts.place : ""));
    out.push(t("total") + ": " + SD.eur(q.total) + " (" + t("net") + " " + SD.eur(q.net) + ")");
    return out.join("\n");
  }
  function millText(q) {
    var out = [], code = function (ln) { var p = E.productById(CAT, ln.product); return p.code + "-" + ln.species.toUpperCase() + "-" + ln.section; };
    out.push("DELOVNI NALOG / WORK ORDER  " + ref());
    out.push("Kanal: splet DIY · " + new Date().toISOString().slice(0, 10));
    out.push("Izvedba: " + SD.tr(CAT.delivery[q.mode]) + (q.mode === "van" || q.mode === "truck" ? " → " + S.opts.place + " (" + km() + " km)" : ""));
    out.push("Opcije: robovi " + (S.opts.edges === "round" ? "zaobljeni" : "ostri") + (S.opts.knotfree ? " · radial brez grč" : "") + (S.opts.ht ? " · HT" : ""));
    out.push("");
    q.lines.forEach(function (ln) {
      out.push(code(ln) + "  " + (ln.bins ? Object.keys(ln.stockCount).map(function (s) { return ln.stockCount[s] + "×L" + s; }).join(" ") : ln.pieces + " kos na mero") + "  " + SD.num(ln.volume, 4) + " m³");
      if (ln.bins) ln.bins.forEach(function (b, i) { out.push("   #" + String(i + 1).padStart(2, "0") + " L" + b.stock + ": " + b.pieces.join(" | ") + "   ost. " + b.waste); });
      else ln.parts.forEach(function (p) { out.push("   " + p.qty + " × L" + p.length); });
    });
    q.extras.forEach(function (x) { out.push(x.id.toUpperCase() + "  " + x.qty + " kos"); });
    out.push("");
    out.push("Skupaj: " + SD.num(q.volume, 3) + " m³ · " + SD.num(q.kg) + " kg · rezov " + q.cuts + " · vrednost " + SD.eur(q.net) + " brez DDV");
    out.push("Ostanki ≥ 300 mm gredo kupcu, krajši v biomaso.");
    return out.join("\n");
  }
  function openOrder(q) {
    var dlg = document.getElementById("order");
    document.getElementById("order-h").textContent = t("orderH") + " " + ref();
    var you = youText(q), mill = millText(q);
    document.getElementById("order-body").innerHTML =
      '<p class="note">' + t("demo") + '</p><div class="tabs" style="margin-top:14px"><button type="button" class="chip" data-ot="you" aria-pressed="true">' + t("tabYou") + '</button><button type="button" class="chip" data-ot="mill" aria-pressed="false">' + t("tabMill") + "</button></div>" +
      '<pre class="order" id="otext"></pre><div class="toolbar"><button type="button" class="btn primary small" id="ocopy">' + t("copy") + '</button><button type="button" class="btn ghost small" id="oprint">' + t("print") + "</button></div>";
    var pre = document.getElementById("otext"); pre.textContent = you;
    dlg.querySelectorAll("[data-ot]").forEach(function (b) {
      b.addEventListener("click", function () {
        dlg.querySelectorAll("[data-ot]").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        pre.textContent = b.dataset.ot === "mill" ? mill : you;
      });
    });
    document.getElementById("ocopy").addEventListener("click", function (e) {
      var b = e.currentTarget;
      (navigator.clipboard ? navigator.clipboard.writeText(pre.textContent) : Promise.reject()).then(function () { b.textContent = t("copied"); }, function () {});
    });
    document.getElementById("oprint").addEventListener("click", function () { window.print(); });
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
  }
  document.querySelector("[data-close]").addEventListener("click", function () { document.getElementById("order").close(); });

  // ---------- Chat context ----------
  window.SolisChatContext = function () {
    var q = E.quote(CAT, items(), quoteOpts());
    var lines = ["Planner: " + (S.mode === "custom" ? "custom cut list \"" + (S.title || "") + "\"" : "project " + S.pid + " (" + project().en.title + "), variant " + S.variant + ", params " + JSON.stringify(S.params))];
    items().forEach(function (i) { lines.push("- " + i.qty + " × " + SD.tr(i.label) + ": " + i.product + "/" + i.species + " " + i.section + " L" + i.length); });
    lines.push("Totals: " + q.volume.toFixed(3) + " m3, " + Math.round(q.kg) + " kg, material " + q.material.toFixed(0) + " EUR, total " + q.total.toFixed(0) + " EUR incl. VAT, delivery " + q.mode);
    return lines.join("\n");
  };

  // ---------- Update loop ----------
  function quoteOpts() { return { knotfree: S.opts.knotfree, ht: S.opts.ht, delivery: S.opts.delivery, km: km(), extras: S.opts.extras }; }
  function update(full) {
    var q = E.quote(CAT, items(), quoteOpts());
    if (q.mode !== S.opts.delivery && !q.modes[S.opts.delivery].ok) { /* keep the user's wish; quote fell back */ }
    if (full) { renderProject(); renderParams(q); }
    renderCut(q); renderPlan(q); renderSummary(q);
    toHash();
  }

  window.SolisPlanner = {
    importCut: function (cut) { applyCut(cut); update(true); window.scrollTo({ top: 0, behavior: "smooth" }); }
  };

  document.addEventListener("langchange", function () { if (CAT) update(true); });
  // Links from the chat change only the hash; replaceState in toHash() does not fire this.
  window.addEventListener("hashchange", function () {
    if (!CAT) return;
    S.mode = "project"; S.imported = false; S.items = []; S.variant = "";
    fromHash();
    if (!S.variant) { var p = project(); S.params = E.defaults(p); S.variant = p.variants[0].id; }
    update(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  document.getElementById("logo").innerHTML = SD.rings(100, 6, 3);
  SD.load().then(function (d) {
    CAT = d.cat; PROJ = d.proj;
    fromHash();
    if (!S.variant) { var p = project(); S.params = E.defaults(p); S.variant = p.variants[0].id; }
    update(true);
  });
})();
