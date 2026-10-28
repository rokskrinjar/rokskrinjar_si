// Skobi chat drawer. Streams answers from /api/solis; keeps the conversation for this tab only.
(function () {
  "use strict";
  var API = "/api/solis";
  var KEY = "solis-diy-chat";
  var T = {
    fab: { sl: "Vprašaj Skobija", en: "Ask Skobi" },
    sub: { sl: "DIY svetovalec · AI", en: "DIY adviser · AI" },
    clear: { sl: "Nov pogovor", en: "New chat" },
    close: { sl: "Zapri", en: "Close" },
    send: { sl: "Pošlji", en: "Send" },
    ph: { sl: "npr. Rad bi naredil polico za knjige iz Pinteresta …", en: "e.g. I want to build a bookshelf I saw on Pinterest …" },
    hello: { sl: "Živjo! Sem Skobi. Povejte, kaj bi radi naredili, pa vam pomagam izbrati les, izračunati količino in pripraviti kosovnik za naročilo.", en: "Hi! I'm Skobi. Tell me what you want to build and I'll help you choose the wood, work out how much you need and prepare a cut list to order." },
    helloBiz: { sl: "Živjo! Sem Skobi. Vprašajte me o konceptu, trgu in izračunih na tej strani ali o avtorju koncepta, Roku Skrinjarju.", en: "Hi! I'm Skobi. Ask me about the concept, the market and the numbers on this page, or about the concept's author, Rok Skrinjar." },
    load: { sl: "Naloži v načrtovalnik", en: "Load into the planner" },
    parts: { sl: "kosov", en: "parts" },
    err: { sl: "Skobi se ta trenutek ne oglaša. Poskusite znova čez minuto.", en: "Skobi is not answering right now. Please try again in a minute." },
    offline: { sl: "Bot deluje samo na objavljeni strani (rokskrinjar.si). Lokalno je na voljo samo načrtovalnik.", en: "The bot only runs on the published site (rokskrinjar.si). Locally only the planner works." },
    note: { sl: "Odgovore ustvari umetna inteligenca in so lahko napačni. Koncept, ni povezan s Solis Timber. Vprašanja se pošljejo v Anthropicov API; ne vpisujte osebnih podatkov.", en: "Answers are AI-generated and can be wrong. A concept, not affiliated with Solis Timber. Questions are sent to Anthropic's API; don't include personal data." },
    ex: {
      sl: ["Videl sem visoko gredo na Pinterestu. Kateri les naj vzamem, da bo zdržala?", "Nimam skobeljnika. Lahko vseeno naredim mizo iz vašega lesa?", "Načrt pravi 2x4. Kaj je to v centimetrih?", "Za kaj je dober radialen les?"],
      en: ["I saw a raised bed on Pinterest. Which wood lasts longest?", "I don't own a planer. Can I still build a table from your wood?", "The plan says 2x4. What is that in millimetres?", "What is quarter-sawn wood good for?"]
    },
    // Business case and economics pages are read by the company, so they get business questions.
    exBiz: {
      sl: ["Zakaj bi se žaga sploh lotila prodaje domačim mojstrom?", "Koliko bi kanal DIY zaslužil in kdaj bi se povrnil?", "Kaj so največja tveganja in kako bi jih zmanjšali?", "Kdo je Rok Skrinjar in kaj je naredil do zdaj?"],
      en: ["Why would a sawmill sell to hobbyists at all?", "How much would the DIY channel earn, and when does it pay back?", "What are the biggest risks, and how would you reduce them?", "Who is Rok Skrinjar and what has he done so far?"]
    }
  };
  var BIZ = /(business|economics)\.html$/.test(location.pathname);
  // A page can run Skobi in another mode (razpisi.html: "razpis") with its own greeting, examples and history.
  var MODE = window.SolisChatMode || "";
  var INTRO = window.SolisChatIntro || null;
  if (MODE) KEY += "-" + MODE;
  function t(k) { return SD.tr(T[k]); }
  function hello() { return INTRO ? SD.tr(INTRO.hello) : t(BIZ ? "helloBiz" : "hello"); }
  function examples() { return INTRO ? SD.tr(INTRO.ex) : t(BIZ ? "exBiz" : "ex"); }

  var messages = [];
  try { messages = JSON.parse(sessionStorage.getItem(KEY) || "[]") || []; } catch (e) { messages = []; }
  function save() { try { sessionStorage.setItem(KEY, JSON.stringify(messages.slice(-20))); } catch (e) {} }

  var fab = document.createElement("button");
  fab.className = "chat-fab"; fab.type = "button";
  var box = document.createElement("section");
  box.className = "chat"; box.hidden = true; box.setAttribute("aria-label", "Skobi");
  document.body.appendChild(fab); document.body.appendChild(box);

  function shell() {
    var av = '<img src="assets/skobi.webp" alt="" width="40" height="40">';
    fab.innerHTML = av + "<span>" + t("fab") + "</span>";
    box.innerHTML =
      '<div class="chat-head"><div class="av">' + av + '</div><div><b>Skobi</b><small>' + t("sub") + '</small></div>' +
      '<div class="sp"><button type="button" data-a="clear">' + t("clear") + '</button><button type="button" data-a="close" aria-label="' + t("close") + '">✕</button></div></div>' +
      '<div class="chat-log" aria-live="polite"></div>' +
      '<form class="chat-form"><label class="vh" for="sk-q">' + t("fab") + '</label><textarea id="sk-q" rows="1" maxlength="1500" placeholder="' + SD.esc(t("ph")) + '"></textarea>' +
      '<button class="btn primary" type="submit">' + t("send") + '</button></form>' +
      '<p class="chat-note">' + t("note") + '</p>';
    log = box.querySelector(".chat-log"); q = box.querySelector("textarea"); form = box.querySelector("form");
    form.addEventListener("submit", function (e) { e.preventDefault(); ask(q.value); });
    q.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(q.value); } });
    q.addEventListener("input", grow);
    box.querySelector("[data-a=close]").addEventListener("click", close);
    box.querySelector("[data-a=clear]").addEventListener("click", function () { messages = []; save(); paint(); q.focus(); });
    paint();
  }
  var log, q, form, busy = false;

  function grow() { q.style.height = "auto"; q.style.height = Math.min(140, q.scrollHeight) + "px"; }

  function inline(s) {
    s = SD.esc(s);
    s = s.replace(/\[([^\]]+)\]\((https:\/\/[^\s)]+|mailto:[^\s)@]+@[^\s)]+|tel:\+?\d+|[a-z0-9.\/#?=&-]+\.html[^\s)]*)\)/g, '<a href="$2">$1</a>');
    s = s.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
    return s;
  }
  function md(text) {
    var out = [], list = null;
    text.split(/\n/).forEach(function (line) {
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

  // Split an answer into prose and the optional JSON blocks: ```cutlist``` (planner),
  // ```polja``` and ```vprasanja``` (application fields and open questions on razpisi.html).
  function block(text, name) {
    var m = text.match(new RegExp("```" + name + "\\s*([\\s\\S]*?)```"));
    if (!m) return null;
    try { return JSON.parse(m[1]); } catch (e) { return null; }
  }
  function parse(text) {
    var data = block(text, "cutlist");
    var prose = text.replace(/```(cutlist|polja|vprasanja)[\s\S]*?(```|$)/g, "").trim();
    var fields = block(text, "polja"), qs = block(text, "vprasanja");
    return { prose: prose, cut: data && Array.isArray(data.items) ? data : null,
      fields: fields && typeof fields === "object" && !Array.isArray(fields) ? fields : null,
      questions: Array.isArray(qs) ? qs.filter(function (x) { return typeof x === "string"; }) : [] };
  }
  // Older answers go back to the model without their field blocks; the page sends the current fields as context.
  function slim(m) {
    return m.role === "assistant" && MODE ? { role: m.role, content: m.content.replace(/```polja[\s\S]*?```/g, "[polja posodobljena / fields updated]") } : m;
  }

  function cutCard(cut) {
    var div = document.createElement("div");
    div.className = "cutcard";
    var n = cut.items.reduce(function (s, i) { return s + (Number(i.qty) || 0); }, 0);
    div.innerHTML = "<b>" + SD.esc(cut.title || "Kosovnik") + "</b> · " + n + " " + t("parts") +
      "<ul>" + cut.items.slice(0, 8).map(function (i) {
        return "<li>" + i.qty + " × " + SD.esc(String(i.section).replace("x", "×")) + " · " + i.length + " mm · " + SD.esc(i.label || "") + "</li>";
      }).join("") + (cut.items.length > 8 ? "<li>…</li>" : "") + "</ul>";
    var b = document.createElement("button");
    b.type = "button"; b.className = "btn primary small"; b.textContent = t("load");
    b.addEventListener("click", function () { importCut(cut); });
    div.appendChild(b);
    return div;
  }

  function importCut(cut) {
    if (window.SolisPlanner && window.SolisPlanner.importCut) { window.SolisPlanner.importCut(cut); if (window.innerWidth < 980) close(); return; }
    try { sessionStorage.setItem("solis-diy-import", JSON.stringify(cut)); } catch (e) {}
    location.href = "planner.html#import";
  }

  function fieldCard(p) {
    var div = document.createElement("div");
    div.className = "cutcard";
    var n = p.fields ? Object.keys(p.fields).filter(function (k) { return k.charAt(0) !== "_"; }).length : 0;
    div.innerHTML = "<b>" + (SD.lang() === "en" ? "Application updated" : "Prijava posodobljena") + "</b>" +
      (n ? "<br>" + (SD.lang() === "en" ? "Fields filled: " : "Izpolnjena polja: ") + n : "") +
      (p.questions.length ? "<br>" + (SD.lang() === "en" ? "Open questions: " : "Odprta vprašanja: ") + p.questions.length : "");
    return div;
  }

  function bubble(role, text, cls) {
    var div = document.createElement("div");
    div.className = "msg " + role + (cls ? " " + cls : "");
    if (role === "assistant") {
      var p = parse(text);
      div.innerHTML = md(p.prose);
      if (p.cut) div.appendChild(cutCard(p.cut));
      if (p.fields || p.questions.length) div.appendChild(fieldCard(p));
    } else div.innerHTML = "<p>" + SD.esc(text) + "</p>";
    log.appendChild(div);
    return div;
  }

  function paint() {
    log.innerHTML = "";
    bubble("assistant", hello());
    messages.forEach(function (m) { bubble(m.role, m.content); });
    if (!messages.length) {
      var ex = document.createElement("div");
      ex.className = "chat-ex";
      examples().forEach(function (s) {
        var b = document.createElement("button"); b.type = "button"; b.textContent = s;
        b.addEventListener("click", function () { ask(s); });
        ex.appendChild(b);
      });
      log.appendChild(ex);
    }
    log.scrollTop = log.scrollHeight;
  }

  async function ask(text) {
    text = (text || "").trim();
    if (!text || busy) return;
    busy = true;
    var ex = log.querySelector(".chat-ex"); if (ex) ex.remove();
    messages.push({ role: "user", content: text });
    bubble("user", text);
    q.value = ""; grow();
    var div = bubble("assistant", "", "wait");
    log.scrollTop = log.scrollHeight;
    var ctx = "";
    try { ctx = window.SolisChatContext ? String(window.SolisChatContext() || "") : ""; } catch (e) {}
    var answer = "";
    try {
      var r = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Solis-Key": window.SolisKey ? window.SolisKey() : "" },
        body: JSON.stringify({ messages: messages.slice(-9).map(slim), context: ctx, mode: MODE || undefined })
      });
      var ct = r.headers.get("content-type") || "";
      if (!r.ok || ct.indexOf("text/plain") < 0) {
        var data = ct.indexOf("json") >= 0 ? await r.json().catch(function () { return {}; }) : {};
        throw new Error(r.status === 404 || r.status === 501 ? t("offline") : (data.error || t("err")));
      }
      if (r.body && r.body.getReader) {
        var reader = r.body.getReader(), dec = new TextDecoder();
        for (;;) {
          var chunk = await reader.read();
          if (chunk.done) break;
          answer += dec.decode(chunk.value, { stream: true });
          var p = parse(answer);
          div.innerHTML = md(p.prose.replace(/```[\s\S]*$/, "")) +
            (/```polja/.test(answer) && !p.fields ? '<p class="writing">' + (SD.lang() === "en" ? "Writing the application fields…" : "Pišem polja prijave …") + "</p>" : "");
          var near = log.scrollHeight - log.scrollTop - log.clientHeight < 80;
          if (near) log.scrollTop = log.scrollHeight;
        }
      } else answer = await r.text();
      if (!answer.trim()) throw new Error(t("err"));
      div.remove();
      messages.push({ role: "assistant", content: answer });
      bubble("assistant", answer);
      var done = parse(answer);
      if ((done.fields || done.questions.length) && window.SolisGrant) window.SolisGrant.apply(done.fields || {}, done.questions);
    } catch (e) {
      div.remove();
      messages.pop();
      bubble("assistant", e && e.message ? e.message : t("err"), "error");
    }
    save();
    busy = false;
    log.scrollTop = log.scrollHeight;
    q.focus();
  }

  function open(prefill, send) {
    box.hidden = false; fab.hidden = true;
    document.documentElement.classList.add("chat-open");
    if (prefill && send) ask(prefill);
    else if (prefill) { q.value = prefill; grow(); }
    setTimeout(function () { q.focus(); log.scrollTop = log.scrollHeight; }, 30);
  }
  function close() { box.hidden = true; fab.hidden = false; document.documentElement.classList.remove("chat-open"); }

  fab.addEventListener("click", function () { open(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !box.hidden) close(); });
  document.addEventListener("langchange", function () { var was = box.hidden; shell(); box.hidden = was; });
  shell();
  document.querySelectorAll("[data-ask]").forEach(function (el) {
    el.addEventListener("click", function (e) { e.preventDefault(); open(el.getAttribute("data-ask-" + SD.lang()) || "", !!el.getAttribute("data-ask-" + SD.lang())); });
  });

  window.SolisChat = { open: open, close: close, ask: ask, reset: function () { messages = []; save(); paint(); }, busy: function () { return busy; } };
})();
