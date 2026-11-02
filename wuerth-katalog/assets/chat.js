// Račko chat, embedded in the page (#chat). Streams answers from /api/wuerth; keeps the conversation for this tab only.
// An ```izbor``` block becomes product cards, checked against catalog.json: a code the catalogue does not know is dropped.
// A ```povprasevanje``` block becomes an inquiry that can be sent to the sales inbox (demo, localStorage).
(function () {
  "use strict";
  var API = "/api/wuerth";
  var KEY = "wuerth-katalog-chat";
  var root = document.getElementById("chat");
  if (!root) return;
  var BIZ = root.hasAttribute("data-biz");
  var T = {
    hello: "Živjo! Sem Račko, AI svetovalec za ta katalog. Povejte, kaj delate in koliko prostora imate, pa predlagam voziček in orodje. Vem vse, kar piše v katalogu, in povem, ko česa ne piše. Pišete lahko v kateremkoli jeziku.",
    helloBiz: "Pozdravljeni! Sem Račko. Vprašajte me o možnostih za prodajno analitiko in AI, o tem konceptu ali o avtorju, Roku Skrinjarju.",
    ex: ["Imam avtoservis, dva mehanika in ozek prehod. Kaj priporočate?", "V katerem setu je ključ SW 19 za udarni vijačnik?", "Katera pena ima TX40 in TX45?", "Kakšna je razlika med Basic 8.4 in Basic 8.8?", "Trebam kolica za servis kamiona, što preporučuješ?"],
    exBiz: ["Kje bi začel pri 13.000 kupcih?", "Kako bi merili, ali pametni katalog res poveča prodajo?", "Kaj od tega že obstaja v skupini Würth?", "Kdo je Rok Skrinjar in kaj je naredil v analitiki?"],
    ph: "Vprašajte Račka …",
    err: "Račko se ta trenutek ne oglaša. Poskusite znova čez minuto.",
    offline: "Svetovalec deluje samo na objavljeni strani. Lokalno je na voljo preostali del kataloga.",
    note: "Račko je umetna inteligenca in se lahko zmoti. Koncept, ni povezano s podjetjem Würth; podatki so iz kataloga iz leta 2021, cen ni. Vprašanja gredo v Anthropicov API, zato ne vpisujte osebnih podatkov.",
    send: "Pošlji komercialistu",
    sent: "Poslano v nabiralnik prodaje ✓",
    see: "Odpri pogled prodaje"
  };

  var C = null;
  WK.load().then(function (d) { C = d; paint(); });

  var messages = WK.store(sessionStorage, KEY) || [];
  function save() { WK.store(sessionStorage, KEY, messages.slice(-20)); }

  root.className = "chat";
  root.innerHTML =
    '<div class="chat-head"><div class="av" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="16.5" cy="7.5" r="4.5"/><path d="M13.3 10.7 4 20"/><path d="M16.5 7.5h.01"/></svg></div>' +
    '<div><b>Račko</b><small>AI svetovalec za vozičke in orodje</small></div>' +
    '<div class="sp"><button type="button" data-a="clear">Nov pogovor</button></div></div>' +
    '<div class="chat-log" aria-live="polite"></div>' +
    '<form class="chat-form"><label class="vh" for="rk-q">Vprašanje za Račka</label><textarea id="rk-q" rows="1" maxlength="1500" placeholder="' + WK.esc(T.ph) + '"></textarea>' +
    '<button class="btn primary" type="submit">Pošlji</button></form>' +
    '<p class="chat-note">' + T.note + "</p>";
  var log = root.querySelector(".chat-log"), q = root.querySelector("textarea"), form = root.querySelector("form"), busy = false;

  function grow() { q.style.height = "auto"; q.style.height = Math.min(140, q.scrollHeight) + "px"; }
  form.addEventListener("submit", function (e) { e.preventDefault(); ask(q.value); });
  q.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(q.value); } });
  q.addEventListener("input", grow);
  root.querySelector("[data-a=clear]").addEventListener("click", function () { messages = []; save(); paint(); q.focus(); });

  // Split an answer into prose and the optional blocks.
  function block(text, name) {
    var m = text.match(new RegExp("```" + name + "\\s*([\\s\\S]*?)```"));
    if (!m) return null;
    try { var d = JSON.parse(m[1]); return d && typeof d === "object" ? d : null; } catch (e) { return null; }
  }
  function parse(text) {
    return {
      prose: text.replace(/```(izbor|povprasevanje)[\s\S]*?(```|$)/g, "").trim(),
      pick: block(text, "izbor"),
      lead: block(text, "povprasevanje")
    };
  }

  // Only what exists in catalog.json gets a card.
  function picks(p) {
    if (!C) return null;
    var cards = [];
    (p.vozicki || []).forEach(function (id) { var v = C.vozBy[id]; if (v) cards.push(["v", id, v.naziv, v.barve[0].art]); });
    (p.sestavi || []).forEach(function (id) { var a = C.asmBy[id]; if (a) cards.push(["a", id, a.naziv, a.art]); });
    (p.seti || []).forEach(function (art) { var id = String(art).replace(/\s/g, ""), s = C.setBy[id]; if (s) cards.push(["s", id, s.naziv, s.art]); });
    if (!cards.length) return null;
    var box = document.createElement("div");
    box.className = "picks";
    cards.slice(0, 6).forEach(function (c) {
      var d = document.createElement("div");
      d.className = "pick";
      d.innerHTML = "<span><b>" + WK.esc(c[2]) + '</b><span class="art">' + c[3] + '</span></span><button type="button">Odpri</button>';
      d.querySelector("button").addEventListener("click", function () {
        if (window.WKOpen) window.WKOpen(c[0], c[1]);
        else location.href = "./?" + c[0] + "=" + c[1];
      });
      box.appendChild(d);
    });
    return box;
  }

  function leadBlock(o) {
    var card = WK.leadCard(o);
    var act = document.createElement("div");
    act.className = "act";
    var b = document.createElement("button");
    b.type = "button"; b.className = "btn primary small"; b.textContent = T.send;
    b.addEventListener("click", function () {
      WK.addLead(JSON.parse(JSON.stringify(o)));
      act.innerHTML = '<span class="sent">' + T.sent + '</span> <a href="prodaja.html#inbox">' + T.see + " →</a>";
    });
    act.appendChild(b);
    card.appendChild(act);
    return card;
  }

  function bubble(role, text, cls) {
    var div = document.createElement("div");
    div.className = "msg " + role + (cls ? " " + cls : "");
    if (role === "assistant") {
      var p = parse(text);
      div.innerHTML = WK.md(p.prose);
      if (p.pick) { var box = picks(p.pick); if (box) div.appendChild(box); }
      if (p.lead) div.appendChild(leadBlock(p.lead));
    } else div.innerHTML = "<p>" + WK.esc(text) + "</p>";
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
    var ctx = "";
    try { ctx = window.WKContext ? String(window.WKContext() || "") : ""; } catch (e) {}
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
        throw new Error(r.status === 404 || r.status === 501 ? T.offline : (data.error || T.err));
      }
      if (r.body && r.body.getReader) {
        var reader = r.body.getReader(), dec = new TextDecoder();
        for (;;) {
          var chunk = await reader.read();
          if (chunk.done) break;
          answer += dec.decode(chunk.value, { stream: true });
          div.innerHTML = WK.md(parse(answer).prose);
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
      bubble("assistant", e && e.message ? e.message : T.err, "error");
    }
    save();
    busy = false;
    log.scrollTop = log.scrollHeight;
  }

  window.Racko = { ask: ask };
})();
