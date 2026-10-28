// Funding radar (razpisi.html): the weekly report of calls from assets/razpisi.json,
// and the application project that Skobi drafts in mode "razpis" (fields come back as ```polja``` blocks, see chat.js).
(function () {
  "use strict";
  var KEY = "solis-diy-razpisi";
  var FIELDS = [
    { id: "prijavitelj", sl: "Prijavitelj", en: "Applicant", hint: { sl: "Naziv, naslov, matična in davčna številka, velikost, dejavnost, zastopnik.", en: "Name, address, registration and tax numbers, size, activity, legal representative." } },
    { id: "podjetje", sl: "Predstavitev podjetja", en: "Company presentation", hint: { sl: "Zgodovina, proizvodnja, trgi, certifikati, dosedanje naložbe.", en: "History, production, markets, certificates, past investments." } },
    { id: "projekt", sl: "Namen in cilji projekta", en: "Purpose and goals", hint: { sl: "Kaj bomo kupili ali razvili, zakaj in kaj se bo spremenilo.", en: "What we will buy or develop, why, and what changes." } },
    { id: "aktivnosti", sl: "Aktivnosti in časovnica", en: "Activities and timeline", hint: { sl: "Koraki, mejniki, začetek in konec.", en: "Steps, milestones, start and end." } },
    { id: "skladnost", sl: "Skladnost z razpisom in merili", en: "Fit with the call and criteria", hint: { sl: "Kako projekt izpolni cilje, pogoje in merila za ocenjevanje.", en: "How the project meets the call's goals, conditions and scoring." } },
    { id: "finance", sl: "Finančni načrt in viri", en: "Budget and funding sources", hint: { sl: "Upravičeni stroški, zaprošena sredstva, lastni delež.", en: "Eligible costs, requested funding, own contribution." } },
    { id: "ucinki", sl: "Kazalniki in učinki", en: "Indicators and impact", hint: { sl: "Dodana vrednost, delovna mesta, energija, CO₂, izvoz.", en: "Value added, jobs, energy, CO₂, exports." } },
    { id: "tveganja", sl: "Tveganja, trajnost, DNSH", en: "Risks, sustainability, DNSH", hint: { sl: "Tveganja in ukrepi, trajnost rezultatov, načelo »ne škoduj bistveno«.", en: "Risks and mitigation, durability of results, do no significant harm." } }
  ];
  var T = {
    fit: { sl: "ujemanje", en: "fit" },
    status: { odprt: { sl: "Odprt", en: "Open" }, napovedan: { sl: "Napovedan", en: "Announced" }, "zaprt-ponovno": { sl: "Zaprt, pričakovan znova", en: "Closed, expected again" } },
    deadline: { sl: "Rok", en: "Deadline" }, opens: { sl: "Odprtje", en: "Opens" },
    amount: { sl: "Znesek", en: "Amount" }, rate: { sl: "Delež", en: "Rate" }, form: { sl: "Oblika", en: "Type" },
    who: { sl: "Upravičenci", en: "Who can apply" }, costs: { sl: "Upravičeni stroški", en: "Eligible costs" },
    cond: { sl: "Pogoji", en: "Conditions" }, docs: { sl: "Prijavna dokumentacija", en: "Application documents" },
    more: { sl: "Pogoji in dokumentacija", en: "Conditions and documents" },
    start: { sl: "Začni prijavo", en: "Start application" }, resume: { sl: "Odpri prijavo", en: "Open application" },
    official: { sl: "Uradna stran ↗", en: "Official page ↗" },
    days: function (n) { return SD.lang() === "en" ? (n === 0 ? "today" : n === 1 ? "1 day left" : n + " days left") : (n === 0 ? "danes" : "še " + n + (n === 1 ? " dan" : n === 2 ? " dneva" : n < 5 ? " dnevi" : " dni")); },
    tbd: { sl: "ni objavljen", en: "not published" }, ongoing: { sl: "do porabe sredstev", en: "until funds run out" },
    none: { sl: "Ni razpisov za ta filter.", en: "No calls for this filter." },
    idea: { sl: "Kaj želimo financirati", en: "What we want to fund" },
    fill: { sl: "Skobi, izpolni, kar lahko", en: "Skobi, fill in what you can" },
    improve: { sl: "Skobi, izboljšaj", en: "Skobi, improve" },
    confirm: { sl: "Potrdi", en: "Confirm" }, unconfirm: { sl: "Odkleni", en: "Unlock" },
    st: { empty: { sl: "prazno", en: "empty" }, draft: { sl: "osnutek", en: "draft" }, missing: { sl: "manjka podatek", en: "missing data" }, ok: { sl: "potrjeno", en: "confirmed" } },
    progress: function (f, m) { return SD.lang() === "en" ? f + " of 8 fields drafted · " + m + " with missing data" : f + " od 8 polj z osnutkom · " + m + " z manjkajočimi podatki"; },
    qs: { sl: "Skobi sprašuje", en: "Skobi asks" }, qsNone: { sl: "Ko Skobi izpolni polja, bodo tu vprašanja za manjkajoče podatke. Kliknite vprašanje, da odgovorite.", en: "After Skobi fills the fields, its questions about missing data appear here. Click one to answer." },
    answer: { sl: "Odgovor: ", en: "Answer: " },
    condState: { da: { sl: "izpolnjujemo", en: "met" }, ne: { sl: "ne izpolnjujemo", en: "not met" }, "?": { sl: "preveriti", en: "to check" } },
    attach: { sl: "Priloge in obrazci", en: "Attachments and forms" },
    download: { sl: "Prenesi osnutek (.md)", en: "Download draft (.md)" }, copy: { sl: "Kopiraj", en: "Copy" }, copied: { sl: "Kopirano", en: "Copied" },
    close: { sl: "Zapri prijavo", en: "Close application" }, del: { sl: "Izbriši osnutek", en: "Delete draft" },
    delAsk: { sl: "Izbrišem osnutek te prijave?", en: "Delete this application draft?" },
    note: { sl: "Osnutek je shranjen samo v tem brskalniku. Skobi nikoli ne odda prijave; vsebino mora preveriti in podpisati odgovorna oseba.", en: "The draft is stored only in this browser. Skobi never submits; a responsible person must check and sign it." },
    fillAsk: { sl: "Izpolni prijavo, kolikor lahko iz baze znanja, in mi postavi vprašanja za manjkajoče podatke.", en: "Fill in the application as far as the knowledge base allows and ask me about the missing data." },
    improveAsk: function (f) { return SD.lang() === "en" ? "Improve the field \"" + f + "\" so it scores better against the call's criteria." : "Izboljšaj polje »" + f + "«, da bo bolje ustrezalo merilom razpisa."; }
  };
  function t(k) { return SD.tr(T[k]); }

  var DATA = null, filter = "all";
  var state = { active: null, projects: {} };
  try { state = Object.assign(state, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

  var TODAY = new Date(); TODAY.setHours(0, 0, 0, 0);
  function d(s) { var p = s.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function fmt(s) { return d(s).toLocaleDateString(SD.lang() === "en" ? "en-GB" : "sl-SI", { day: "numeric", month: SD.lang() === "en" ? "short" : "numeric", year: "numeric" }); }
  function nextDeadline(c) {
    var fut = (c.roki || []).filter(function (r) { return d(r) >= TODAY; }).sort();
    return fut[0] || null;
  }
  function daysTo(s) { return Math.round((d(s) - TODAY) / 864e5); }
  function callById(id) { return DATA && DATA.razpisi.filter(function (c) { return c.id === id; })[0]; }

  // ---------- Weekly report ----------
  function renderStats() {
    document.getElementById("r-date").textContent = fmt(DATA.preverjeno);
    document.getElementById("r-src").textContent = DATA.viri.length;
    document.getElementById("r-fit").textContent = DATA.razpisi.length;
    document.getElementById("r-open").textContent = DATA.razpisi.filter(function (c) { return c.status === "odprt"; }).length;
    document.getElementById("r-soon").textContent = DATA.razpisi.filter(function (c) { var n = nextDeadline(c); return n && daysTo(n) <= 45; }).length;
    document.getElementById("excl").innerHTML = (DATA.izkljuceni || []).map(function (x) { return "<li>" + SD.esc(SD.tr(x)) + "</li>"; }).join("");
    document.getElementById("srcs").innerHTML = DATA.viri.map(function (v) {
      return '<li><a href="' + SD.esc(v.url) + '" target="_blank" rel="noopener">' + SD.esc(SD.tr(v.ime)) + "</a></li>";
    }).join("");
  }

  function deadlineHtml(c) {
    var n = nextDeadline(c);
    if (n) { var k = daysTo(n); return '<span class="' + (k <= 21 ? "hot" : "") + '">' + fmt(n) + " · " + T.days(k) + "</span>"; }
    if (c.status === "napovedan" && c.odprtje) return SD.esc(t("opens")) + " " + fmt(c.odprtje);
    return SD.esc(c.roki_opis ? SD.tr(c.roki_opis) : c.status === "odprt" ? t("ongoing") : t("tbd"));
  }

  // Open calls first: fit plus a bonus for what can be acted on now.
  function rank(c) { return c.ujemanje + (c.status === "odprt" ? 10 : c.status === "napovedan" ? 0 : -15); }
  function list(items) { return "<ul>" + items.map(function (x) { return "<li>" + SD.esc(SD.tr(x)) + "</li>"; }).join("") + "</ul>"; }

  function renderCalls() {
    var el = document.getElementById("calls");
    var calls = DATA.razpisi.filter(function (c) {
      return filter === "all" || (filter === "eu" ? c.vir === "eu" || c.vir === "cross-border" : c.status === filter);
    }).sort(function (a, b) { return rank(b) - rank(a); });
    if (!calls.length) { el.innerHTML = '<p class="empty">' + t("none") + "</p>"; return; }
    el.innerHTML = calls.map(function (c) {
      var has = state.projects[c.id];
      return '<article class="gcard" data-id="' + c.id + '">' +
        '<div class="gtop"><span class="fit" style="--p:' + c.ujemanje + '"><b>' + c.ujemanje + '</b><small>%</small></span>' +
        '<div><span class="pill ' + c.status + '">' + SD.esc(SD.tr(T.status[c.status] || c.status)) + "</span> " +
        '<span class="funder">' + SD.esc(SD.tr(c.izvajalec)) + "</span>" +
        "<h3>" + SD.esc(SD.tr(c.naziv)) + "</h3></div></div>" +
        '<p class="why">' + SD.esc(SD.tr(c.ustreznost)) + "</p>" +
        '<div class="gkv">' +
        "<div><span>" + (c.status === "napovedan" && !nextDeadline(c) ? t("opens") : t("deadline")) + "</span>" + deadlineHtml(c) + "</div>" +
        "<div><span>" + t("amount") + "</span>" + SD.esc(SD.tr(c.znesek) || "–") + "</div>" +
        "<div><span>" + t("rate") + "</span>" + SD.esc(SD.tr(c.delez) || "–") + "</div>" +
        "<div><span>" + t("form") + "</span>" + SD.esc(SD.tr(c.oblika) || "–") + "</div></div>" +
        '<details class="more"><summary>' + t("more") + "</summary>" +
        '<div class="gdet"><div><h4>' + t("who") + "</h4><p>" + SD.esc(SD.tr(c.upravicenci) || "–") + "</p><h4>" + t("costs") + "</h4><p>" + SD.esc(SD.tr(c.upraviceni_stroski) || "–") + "</p></div>" +
        "<div><h4>" + t("cond") + "</h4>" + list(c.pogoji || []) + "<h4>" + t("docs") + "</h4>" + list(c.dokumentacija || []) + "</div></div></details>" +
        '<div class="gact"><button class="btn primary small" type="button" data-start="' + c.id + '">' + (has ? t("resume") : t("start")) + " →</button>" +
        '<a class="btn ghost small" href="' + SD.esc(c.url) + '" target="_blank" rel="noopener">' + t("official") + "</a></div></article>";
    }).join("");
    el.querySelectorAll("[data-start]").forEach(function (b) { b.addEventListener("click", function () { openProject(b.dataset.start, true); }); });
  }

  // ---------- Application project ----------
  function project() { return state.active && state.projects[state.active]; }

  function openProject(id, scroll) {
    var c = callById(id); if (!c) return;
    if (!state.projects[id]) state.projects[id] = { ideja: SD.tr(c.predlog) || "", polja: {}, pogoji: {}, priloge: {}, vprasanja: [], ustvarjen: new Date().toISOString().slice(0, 10) };
    var changed = state.active !== id;
    state.active = id; save();
    if (changed && window.SolisChat) window.SolisChat.reset();
    renderProject();
    renderCalls();
    if (scroll) document.getElementById("prijava").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function fieldStatus(f) {
    if (!f || !f.t || !f.t.trim()) return "empty";
    if (f.ok) return "ok";
    return /«\s*\[?\s*manjka|\[manjka|\[missing/i.test(f.t) ? "missing" : "draft";
  }

  function renderProject() {
    var sec = document.getElementById("prijava"), el = document.getElementById("proj");
    var p = project(), c = p && callById(state.active);
    if (!p || !c) { sec.hidden = true; return; }
    sec.hidden = false;
    var n = nextDeadline(c);
    var filled = 0, missing = 0;
    FIELDS.forEach(function (f) { var s = fieldStatus(p.polja[f.id]); if (s !== "empty") filled++; if (s === "missing") missing++; });
    el.innerHTML =
      '<div class="section-head"><h2><span class="sl">Prijava</span><span class="en">Application</span></h2>' +
      '<div class="toolbar" style="margin:0"><button class="btn small ghost" type="button" data-a="close">' + t("close") + "</button></div></div>" +
      '<div class="phead"><div><span class="pill ' + c.status + '">' + SD.esc(SD.tr(T.status[c.status])) + "</span> <span class=\"funder\">" + SD.esc(SD.tr(c.izvajalec)) + "</span>" +
      "<h3>" + SD.esc(SD.tr(c.naziv)) + "</h3>" +
      '<p class="muted">' + (n ? t("deadline") + ": " + fmt(n) + " · " + T.days(daysTo(n)) : deadlineHtml(c)) + ' · <a href="' + SD.esc(c.url) + '" target="_blank" rel="noopener">' + t("official") + "</a></p></div>" +
      '<div class="pprog"><div class="track"><div class="fill" style="width:' + Math.round(filled / FIELDS.length * 100) + '%"></div></div><small>' + T.progress(filled, missing) + "</small></div></div>" +
      '<div class="pgrid"><div class="pmain">' +
      '<label class="flabel" for="p-idea">' + t("idea") + '</label><textarea id="p-idea" rows="2">' + SD.esc(p.ideja || "") + "</textarea>" +
      '<div class="toolbar"><button class="btn primary" type="button" data-a="fill">' + t("fill") + "</button>" +
      '<button class="btn small" type="button" data-a="md">' + t("download") + '</button><button class="btn small" type="button" data-a="copy">' + t("copy") + "</button></div>" +
      FIELDS.map(function (f) {
        var v = p.polja[f.id] || {}, s = fieldStatus(v);
        return '<div class="field ' + s + '"><div class="fhead"><label for="f-' + f.id + '">' + SD.esc(SD.tr(f)) + '</label><span class="fst">' + SD.esc(SD.tr(T.st[s])) + "</span></div>" +
          '<textarea id="f-' + f.id + '" data-f="' + f.id + '" rows="3" placeholder="' + SD.esc(SD.tr(f.hint)) + '"' + (v.ok ? " readonly" : "") + ">" + SD.esc(v.t || "") + "</textarea>" +
          '<div class="fact"><button type="button" data-imp="' + f.id + '">' + t("improve") + "</button>" +
          (s !== "empty" ? '<button type="button" data-ok="' + f.id + '">' + (v.ok ? t("unconfirm") : t("confirm")) + "</button>" : "") + "</div></div>";
      }).join("") +
      '<p class="fine">' + t("note") + ' <button type="button" class="linkbtn" data-a="del">' + t("del") + "</button></p>" +
      "</div><aside class=\"pside\">" +
      '<div class="panel"><h3>' + t("qs") + "</h3>" + (p.vprasanja.length
        ? '<ol class="qlist">' + p.vprasanja.map(function (q, i) { return '<li><button type="button" data-q="' + i + '">' + SD.esc(q) + "</button></li>"; }).join("") + "</ol>"
        : '<p class="muted" style="font-size:.9rem">' + t("qsNone") + "</p>") + "</div>" +
      '<div class="panel"><h3>' + t("cond") + "</h3><ul class=\"clist\">" + (c.pogoji || []).map(function (x, i) {
        var v = p.pogoji[i] || "?";
        return '<li class="c-' + (v === "?" ? "q" : v) + '"><button type="button" data-c="' + i + '" title="' + SD.esc(SD.tr(T.condState[v])) + '">' + (v === "da" ? "✓" : v === "ne" ? "✕" : "?") + "</button><span>" + SD.esc(SD.tr(x)) + "</span></li>";
      }).join("") + "</ul></div>" +
      '<div class="panel"><h3>' + t("attach") + "</h3><ul class=\"alist\">" + (c.dokumentacija || []).map(function (x, i) {
        return '<li><label><input type="checkbox" data-att="' + i + '"' + (p.priloge[i] ? " checked" : "") + "> " + SD.esc(SD.tr(x)) + "</label></li>";
      }).join("") + "</ul></div></aside></div>";

    el.querySelectorAll("textarea[data-f]").forEach(function (ta) {
      grow(ta);
      ta.addEventListener("input", function () { grow(ta); var f = p.polja[ta.dataset.f] = p.polja[ta.dataset.f] || {}; f.t = ta.value; save(); });
      ta.addEventListener("change", renderSoon);
    });
    var idea = el.querySelector("#p-idea");
    idea.addEventListener("input", function () { p.ideja = idea.value; save(); });
    el.querySelector("[data-a=fill]").addEventListener("click", function () { ask(t("fillAsk")); });
    el.querySelector("[data-a=close]").addEventListener("click", function () { state.active = null; save(); renderProject(); renderCalls(); if (window.SolisChat) window.SolisChat.close(); });
    el.querySelector("[data-a=del]").addEventListener("click", function () {
      if (!confirm(t("delAsk"))) return;
      delete state.projects[state.active]; state.active = null; save(); renderProject(); renderCalls();
      if (window.SolisChat) { window.SolisChat.reset(); window.SolisChat.close(); }
    });
    el.querySelector("[data-a=md]").addEventListener("click", download);
    el.querySelector("[data-a=copy]").addEventListener("click", function (e) {
      var b = e.currentTarget;
      navigator.clipboard.writeText(markdown()).then(function () { b.textContent = t("copied"); setTimeout(function () { b.textContent = t("copy"); }, 1500); });
    });
    el.querySelectorAll("[data-imp]").forEach(function (b) {
      b.addEventListener("click", function () { var f = FIELDS.filter(function (x) { return x.id === b.dataset.imp; })[0]; ask(T.improveAsk(SD.tr(f))); });
    });
    el.querySelectorAll("[data-ok]").forEach(function (b) {
      b.addEventListener("click", function () { var f = p.polja[b.dataset.ok]; f.ok = !f.ok; save(); renderProject(); });
    });
    el.querySelectorAll("[data-q]").forEach(function (b) {
      b.addEventListener("click", function () { if (window.SolisChat) window.SolisChat.open(t("answer") + p.vprasanja[+b.dataset.q] + " → ", false); });
    });
    el.querySelectorAll("[data-c]").forEach(function (b) {
      b.addEventListener("click", function () { var i = b.dataset.c, order = ["?", "da", "ne"]; p.pogoji[i] = order[(order.indexOf(p.pogoji[i] || "?") + 1) % 3]; save(); renderProject(); });
    });
    el.querySelectorAll("[data-att]").forEach(function (cb) {
      cb.addEventListener("change", function () { p.priloge[cb.dataset.att] = cb.checked; save(); });
    });
  }
  var soon = null;
  function renderSoon() { clearTimeout(soon); soon = setTimeout(function () { var y = window.scrollY; renderProject(); window.scrollTo(0, y); }, 50); }
  function grow(ta) { ta.style.height = "auto"; ta.style.height = Math.max(80, ta.scrollHeight + 2) + "px"; }

  function ask(text) { if (window.SolisChat) { window.SolisChat.open(); window.SolisChat.ask(text); } }

  // Called by chat.js when Skobi's answer has ```polja``` / ```vprasanja``` blocks.
  function apply(fields, questions) {
    var p = project(); if (!p) return;
    Object.keys(fields || {}).forEach(function (k) {
      if (k === "_pogoji" && fields[k] && typeof fields[k] === "object") {
        Object.keys(fields[k]).forEach(function (i) { var v = fields[k][i]; if (v === "da" || v === "ne" || v === "?") p.pogoji[i] = v; });
        return;
      }
      if (!FIELDS.some(function (f) { return f.id === k; }) || typeof fields[k] !== "string") return;
      var cur = p.polja[k] || {};
      if (cur.ok) return; // confirmed fields stay as the person left them
      p.polja[k] = { t: fields[k].trim(), ai: true };
    });
    if (Array.isArray(questions)) p.vprasanja = questions.slice(0, 8);
    save();
    renderProject();
  }

  function markdown() {
    var p = project(), c = callById(state.active);
    var out = ["# " + SD.tr(c.naziv), "", SD.tr(c.izvajalec) + " · " + c.url, "", "## " + t("idea"), "", p.ideja || "", ""];
    FIELDS.forEach(function (f) { out.push("## " + SD.tr(f), "", (p.polja[f.id] && p.polja[f.id].t) || "", ""); });
    out.push("## " + t("cond"), "");
    (c.pogoji || []).forEach(function (x, i) { out.push("- [" + (p.pogoji[i] || "?") + "] " + SD.tr(x)); });
    out.push("", "## " + t("attach"), "");
    (c.dokumentacija || []).forEach(function (x, i) { out.push("- [" + (p.priloge[i] ? "x" : " ") + "] " + SD.tr(x)); });
    out.push("", "---", t("note"));
    return out.join("\n");
  }
  function download() {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([markdown()], { type: "text/markdown" }));
    a.download = "prijava-" + state.active + ".md";
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  // What Skobi sees: the chosen call, the idea, the conditions and the current fields.
  function context() {
    var p = project(), c = p && callById(state.active);
    if (!c) return "No application is open. The user is looking at the weekly report of funding calls (see FUNDING CALLS in the knowledge base).";
    var sl = function (v) { return v && typeof v === "object" && !Array.isArray(v) ? (v.sl || v.en) : v; };
    var call = {};
    Object.keys(c).forEach(function (k) { call[k] = Array.isArray(c[k]) ? c[k].map(sl) : sl(c[k]); });
    var lines = ["CHOSEN CALL (checked " + (c.preverjeno || DATA.preverjeno) + "; today " + new Date().toISOString().slice(0, 10) + "):", JSON.stringify(call),
      "", "PROJECT IDEA: " + (p.ideja || "(not given)"),
      "", "CONDITIONS (index: status): " + (c.pogoji || []).map(function (x, i) { return i + ": " + (p.pogoji[i] || "?"); }).join(", "),
      "", "CURRENT FIELDS:"];
    FIELDS.forEach(function (f) {
      var v = p.polja[f.id];
      lines.push("[" + f.id + "]" + (v && v.ok ? " (confirmed by the user, do not change)" : "") + " " + ((v && v.t) ? v.t.slice(0, 1400) : "(empty)"));
    });
    if (p.vprasanja.length) lines.push("", "OPEN QUESTIONS: " + JSON.stringify(p.vprasanja));
    return lines.join("\n");
  }

  window.SolisChatMode = "razpis";
  window.SolisChatContext = context;
  window.SolisChatIntro = {
    hello: { sl: "Živjo! Sem Skobi. Izberite razpis v poročilu tedna in kliknite »Začni prijavo«. Prijavo izpolnim iz baze znanja o žagi, za manjkajoče podatke pa vas vprašam. Lahko me vprašate tudi, kateri razpis je najboljši za določeno naložbo.", en: "Hi! I'm Skobi. Pick a call in this week's report and click \"Start application\". I'll draft it from the sawmill's knowledge base and ask you for whatever is missing. You can also ask me which call suits a particular investment." },
    ex: {
      sl: ["Kateri razpis bi najbolj pomagal pri širitvi na novo zemljišče?", "Ali lahko sončno elektrarno na strehi sofinancira kateri od teh razpisov?", "Kateri roki so najbližje in kaj moramo pripraviti?", "Zakaj bi žaga potrebovala razpisni radar?"],
      en: ["Which call would help most with expanding onto the new land?", "Can any of these calls co-fund a rooftop solar plant?", "Which deadlines are closest and what do we need to prepare?", "Why would a sawmill need a funding radar?"]
    }
  };
  window.SolisGrant = { apply: apply };

  document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("logo").innerHTML = SD.rings(100, 6, 3);
    document.querySelectorAll("[data-f]").forEach(function (b) {
      if (b.tagName !== "BUTTON") return;
      b.addEventListener("click", function () {
        filter = b.dataset.f;
        document.querySelectorAll("button[data-f]").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        renderCalls();
      });
    });
    fetch("assets/razpisi.json").then(function (r) { return r.json(); }).then(function (data) {
      DATA = data;
      renderStats(); renderCalls();
      if (state.active && callById(state.active)) renderProject(); else state.active = null;
    });
  });
  document.addEventListener("langchange", function () { if (DATA) { renderStats(); renderCalls(); renderProject(); } });
})();
