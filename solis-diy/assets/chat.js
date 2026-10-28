// Skobelj chat drawer. Streams answers from /api/solis; keeps the conversation for this tab only.
(function () {
  "use strict";
  var API = "/api/solis";
  var KEY = "solis-diy-chat";
  var T = {
    fab: { sl: "Vprašaj Skobelja", en: "Ask Skobelj" },
    sub: { sl: "DIY svetovalec · AI", en: "DIY adviser · AI" },
    clear: { sl: "Nov pogovor", en: "New chat" },
    close: { sl: "Zapri", en: "Close" },
    send: { sl: "Pošlji", en: "Send" },
    ph: { sl: "npr. Rad bi naredil polico za knjige iz Pinteresta …", en: "e.g. I want to build a bookshelf I saw on Pinterest …" },
    hello: { sl: "Živjo! Sem Skobelj. Povejte, kaj bi radi naredili, pa vam pomagam izbrati les, izračunati količino in pripraviti kosovnik za naročilo.", en: "Hi! I'm Skobelj. Tell me what you want to build and I'll help you choose the wood, work out how much you need and prepare a cut list to order." },
    load: { sl: "Naloži v načrtovalnik", en: "Load into the planner" },
    parts: { sl: "kosov", en: "parts" },
    err: { sl: "Skobelj se ta trenutek ne oglaša. Poskusite znova čez minuto.", en: "Skobelj is not answering right now. Please try again in a minute." },
    offline: { sl: "Bot deluje samo na objavljeni strani (rokskrinjar.si). Lokalno je na voljo samo načrtovalnik.", en: "The bot only runs on the published site (rokskrinjar.si). Locally only the planner works." },
    note: { sl: "Odgovore ustvari umetna inteligenca in so lahko napačni. Koncept, ni povezan s Solis Timber. Vprašanja se pošljejo v Anthropicov API; ne vpisujte osebnih podatkov.", en: "Answers are AI-generated and can be wrong. A concept, not affiliated with Solis Timber. Questions are sent to Anthropic's API; don't include personal data." },
    ex: {
      sl: ["Videl sem visoko gredo na Pinterestu. Kateri les naj vzamem, da bo zdržala?", "Nimam skobeljnika. Lahko vseeno naredim mizo iz vašega lesa?", "Načrt pravi 2x4. Kaj je to v centimetrih?", "Za kaj je dober radialen les?"],
      en: ["I saw a raised bed on Pinterest. Which wood lasts longest?", "I don't own a planer. Can I still build a table from your wood?", "The plan says 2x4. What is that in millimetres?", "What is quarter-sawn wood good for?"]
    }
  };
  function t(k) { return SD.tr(T[k]); }

  var messages = [];
  try { messages = JSON.parse(sessionStorage.getItem(KEY) || "[]") || []; } catch (e) { messages = []; }
  function save() { try { sessionStorage.setItem(KEY, JSON.stringify(messages.slice(-20))); } catch (e) {} }

  var fab = document.createElement("button");
  fab.className = "chat-fab"; fab.type = "button";
  var box = document.createElement("section");
  box.className = "chat"; box.hidden = true; box.setAttribute("aria-label", "Skobelj");
  document.body.appendChild(fab); document.body.appendChild(box);

  function shell() {
    fab.innerHTML = SD.icon("plane", "") + "<span>" + t("fab") + "</span>";
    box.innerHTML =
      '<div class="chat-head"><div class="av">' + SD.icon("plane", "") + '</div><div><b>Skobelj</b><small>' + t("sub") + '</small></div>' +
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
    s = s.replace(/\[([^\]]+)\]\((https:\/\/[^\s)]+|[a-z0-9.\/#?=&-]+\.html[^\s)]*)\)/g, '<a href="$2">$1</a>');
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

  // Split an answer into prose and an optional ```cutlist``` JSON block.
  function parse(text) {
    var m = text.match(/```cutlist\s*([\s\S]*?)```/);
    var prose = text.replace(/```cutlist[\s\S]*?(```|$)/, "").trim();
    var data = null;
    if (m) { try { data = JSON.parse(m[1]); } catch (e) { data = null; } }
    return { prose: prose, cut: data && Array.isArray(data.items) ? data : null };
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

  function bubble(role, text, cls) {
    var div = document.createElement("div");
    div.className = "msg " + role + (cls ? " " + cls : "");
    if (role === "assistant") {
      var p = parse(text);
      div.innerHTML = md(p.prose);
      if (p.cut) div.appendChild(cutCard(p.cut));
    } else div.innerHTML = "<p>" + SD.esc(text) + "</p>";
    log.appendChild(div);
    return div;
  }

  function paint() {
    log.innerHTML = "";
    bubble("assistant", t("hello"));
    messages.forEach(function (m) { bubble(m.role, m.content); });
    if (!messages.length) {
      var ex = document.createElement("div");
      ex.className = "chat-ex";
      t("ex").forEach(function (s) {
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: messages.slice(-9), context: ctx })
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
          div.innerHTML = md(p.prose.replace(/```cutlist[\s\S]*$/, ""));
          var near = log.scrollHeight - log.scrollTop - log.clientHeight < 80;
          if (near) log.scrollTop = log.scrollHeight;
        }
      } else answer = await r.text();
      if (!answer.trim()) throw new Error(t("err"));
      div.remove();
      messages.push({ role: "assistant", content: answer });
      bubble("assistant", answer);
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
    if (prefill && send) ask(prefill);
    else if (prefill) { q.value = prefill; grow(); }
    setTimeout(function () { q.focus(); log.scrollTop = log.scrollHeight; }, 30);
  }
  function close() { box.hidden = true; fab.hidden = false; }

  fab.addEventListener("click", function () { open(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !box.hidden) close(); });
  document.addEventListener("langchange", function () { var was = box.hidden; shell(); box.hidden = was; });
  shell();
  document.querySelectorAll("[data-ask]").forEach(function (el) {
    el.addEventListener("click", function (e) { e.preventDefault(); open(el.getAttribute("data-ask-" + SD.lang()) || "", !!el.getAttribute("data-ask-" + SD.lang())); });
  });

  window.SolisChat = { open: open, close: close, ask: ask };
})();
