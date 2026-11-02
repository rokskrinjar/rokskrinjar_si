// Vprašaj Anjo chat: a floating panel on every page. Streams answers from /api/freespirit; keeps the conversation for this tab only.
(function () {
  "use strict";
  var API = "/api/freespirit";
  var KEY = "free-spirit-chat";
  var BIZ = document.body.hasAttribute("data-biz");
  var T = {
    hello: "Živjo. Tukaj ne piše Anja, ampak AI asistent, ki pozna njen pristop, ponudbo in članke. Povem ti, kako Anja dela, poiščem članek za tvojo situacijo ali ti pomagam razmisliti. Odločitve ostanejo tvoje.",
    helloBiz: "Pozdravljeni. Sem AI asistent Vprašaj Anjo. Vprašajte me, kako sem narejen, kaj znam in česa ne, kaj je v tem konceptu drugače ali kdo je avtor, Rok Skrinjar.",
    ex: ["Kaj sploh je karierno opolnomočenje?", "Sem izgorel(a) ali samo utrujen(a)?", "Kako ločim strah od resničnega notranjega NE?", "Kateri paket je zame, če ne vem, kaj hočem?", "Kako poteka prvo srečanje?"],
    exBiz: ["Kako si narejen in iz česa je tvoja baza znanja?", "Česa namenoma ne delaš?", "Kaj je v tem konceptu drugače od zdajšnje strani?", "Kdo je Rok Skrinjar?"],
    ph: "Napiši, kaj te zanima …",
    err: "Asistent se ta trenutek ne oglaša. Poskusi znova čez minuto.",
    offline: "Asistent deluje samo na objavljeni strani (rokskrinjar.si). Lokalno je na voljo le preostali del strani.",
    note: 'Asistent je umetna inteligenca, ne Anja, in se lahko zmoti. Vprašanja gredo v Anthropicov API, zato ne vpisuj občutljivih podatkov. V hudi stiski pokliči <a href="tel:116123">116 123</a> ali <a href="tel:112">112</a>.'
  };

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

  var messages = [];
  try { messages = JSON.parse(sessionStorage.getItem(KEY) || "[]") || []; } catch (e) { messages = []; }
  function save() { try { sessionStorage.setItem(KEY, JSON.stringify(messages.slice(-20))); } catch (e) {} }

  var fab = document.createElement("button");
  fab.type = "button"; fab.className = "fab";
  fab.innerHTML = '<i aria-hidden="true"></i>Vprašaj Anjo';
  var root = document.createElement("aside");
  root.className = "chat"; root.hidden = true;
  root.setAttribute("aria-label", "Vprašaj Anjo, pogovor z AI asistentom");
  root.innerHTML =
    '<div class="chat-head"><i aria-hidden="true"></i><div><b>Vprašaj Anjo</b><small>AI asistent po Anjinih zapisih, ne Anja</small></div>' +
    '<div class="sp"><button type="button" data-a="clear">Nov pogovor</button><button type="button" data-a="close" aria-label="Zapri">✕</button></div></div>' +
    '<div class="chat-log" aria-live="polite"></div>' +
    '<form class="chat-form"><label class="vh" for="og-q">Tvoje vprašanje</label><textarea id="og-q" rows="1" maxlength="1500" placeholder="' + esc(T.ph) + '"></textarea>' +
    '<button class="btn solid small" type="submit">Pošlji</button></form>' +
    '<p class="chat-note">' + T.note + "</p>";
  document.body.appendChild(fab);
  document.body.appendChild(root);
  var log = root.querySelector(".chat-log"), q = root.querySelector("textarea"), form = root.querySelector("form"), busy = false;

  function open() { root.hidden = false; document.documentElement.classList.add("chat-open"); log.scrollTop = log.scrollHeight; q.focus({ preventScroll: true }); }
  function close() { root.hidden = true; document.documentElement.classList.remove("chat-open"); fab.focus(); }
  function grow() { q.style.height = "auto"; q.style.height = Math.min(140, q.scrollHeight) + "px"; }
  fab.addEventListener("click", open);
  form.addEventListener("submit", function (e) { e.preventDefault(); ask(q.value); });
  q.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(q.value); } });
  q.addEventListener("input", grow);
  root.querySelector("[data-a=clear]").addEventListener("click", function () { messages = []; save(); paint(); q.focus(); });
  root.querySelector("[data-a=close]").addEventListener("click", close);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !root.hidden) close(); });

  function bubble(role, text, cls) {
    var div = document.createElement("div");
    div.className = "msg " + role + (cls ? " " + cls : "");
    if (role === "assistant") div.innerHTML = md(text);
    else div.innerHTML = "<p>" + esc(text) + "</p>";
    log.appendChild(div);
    return div;
  }

  function paint() {
    log.innerHTML = "";
    bubble("assistant", BIZ ? T.helloBiz : T.hello);
    messages.forEach(function (m) { bubble(m.role, m.content); });
    if (!messages.length) {
      var ex = document.createElement("div");
      ex.className = "chat-ex";
      (BIZ ? T.exBiz : T.ex).forEach(function (s) {
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
    var answer = "";
    try {
      var r = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: messages.slice(-9), page: BIZ ? "koncept" : "stran" })
      });
      var ct = r.headers.get("content-type") || "";
      if (!r.ok || ct.indexOf("text/plain") < 0) {
        var data = ct.indexOf("json") >= 0 ? await r.json().catch(function () { return {}; }) : {};
        throw new Error(r.status === 404 || r.status === 405 || r.status === 501 ? T.offline : (data.error || T.err));
      }
      if (r.body && r.body.getReader) {
        var reader = r.body.getReader(), dec = new TextDecoder();
        for (;;) {
          var chunk = await reader.read();
          if (chunk.done) break;
          answer += dec.decode(chunk.value, { stream: true });
          div.classList.remove("wait");
          div.innerHTML = md(answer);
          var near = log.scrollHeight - log.scrollTop - log.clientHeight < 80;
          if (near) log.scrollTop = log.scrollHeight;
        }
      } else answer = await r.text();
      if (!answer.trim()) throw new Error(T.err);
      div.remove();
      messages.push({ role: "assistant", content: answer });
      bubble("assistant", answer);
    } catch (e) {
      div.remove();
      messages.pop();
      bubble("assistant", e && e.message && e.message.indexOf("fetch") < 0 ? e.message : T.err, "error");
    }
    save();
    busy = false;
    log.scrollTop = log.scrollHeight;
  }

  paint();
  document.querySelectorAll("[data-open-chat]").forEach(function (el) { el.addEventListener("click", open); });
  document.addEventListener("click", function (e) {
    var el = e.target.closest && e.target.closest("[data-ask]");
    if (el) { open(); ask(el.getAttribute("data-ask")); }
  });
  window.FSChat = { open: open, ask: ask };
})();
