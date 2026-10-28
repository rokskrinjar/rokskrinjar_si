// Hiško chat, embedded in the page (#chat). Streams answers from /api/aktiva; keeps the conversation for this tab only.
// A ```nalog``` JSON block in an answer becomes a work-order card that can be sent to the upravnik inbox (demo, localStorage).
(function () {
  "use strict";
  var API = "/api/aktiva";
  var KEY = "aktiva-ai-chat";
  var root = document.getElementById("chat");
  if (!root) return;
  var BIZ = root.hasAttribute("data-biz");
  var T = {
    hello: "Pozdravljeni! Sem Hiško, AI asistent za etažne lastnike. Razložim razdelilnik stroškov, rezervni sklad, zbor lastnikov in pravila v stavbi, okvaro pa pretvorim v delovni nalog za upravnika. Pišete lahko v kateremkoli jeziku.",
    helloBiz: "Pozdravljeni! Sem Hiško. Vprašajte me o konceptu, priložnostih za AI v skupini, odgovorni uporabi in merjenju učinka ali o avtorju koncepta, Roku Skrinjarju.",
    ex: ["Zakaj je moj oktobrski račun skoraj dvakrat višji?", "Za kaj se porablja rezervni sklad in koliko moram plačevati?", "V kleti pušča cev, tla so mokra. Kaj naj naredim?", "Kako se odloča o zamenjavi strehe?", "Чи можу я встановити кондиціонер на фасаді?"],
    exBiz: ["Kje bi AI v skupini Aktiva prinesel največ in kje ne bi začel?", "Kako bi merili, ali asistent res razbremeni upravnike?", "Kaj zahteva AI Act za takšnega asistenta?", "Kdo je Rok Skrinjar in kaj je naredil do zdaj?"],
    ph: "Vprašajte ali opišite okvaro …",
    err: "Hiško se ta trenutek ne oglaša. Poskusite znova čez minuto.",
    offline: "Asistent deluje samo na objavljeni strani (rokskrinjar.si). Lokalno je na voljo le preostali del strani.",
    note: "Hiško je umetna inteligenca in se lahko zmoti. Koncept, ni povezan s skupino Aktiva; stavba in zneski so izmišljeni. Vprašanja gredo v Anthropicov API, zato ne vpisujte osebnih podatkov.",
    send: "Pošlji upravniku",
    sent: "Poslano v nabiralnik upravnika ✓",
    see: "Odpri pogled upravnika"
  };

  var messages = [];
  try { messages = JSON.parse(sessionStorage.getItem(KEY) || "[]") || []; } catch (e) { messages = []; }
  function save() { try { sessionStorage.setItem(KEY, JSON.stringify(messages.slice(-20))); } catch (e) {} }

  root.className = "chat";
  root.innerHTML =
    '<div class="chat-head"><div class="av" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/></svg></div>' +
    '<div><b>Hiško</b><small>AI asistent za etažne lastnike</small></div>' +
    '<div class="sp"><button type="button" data-a="clear">Nov pogovor</button></div></div>' +
    '<div class="chat-log" aria-live="polite"></div>' +
    '<form class="chat-form"><label class="vh" for="hk-q">Vprašanje za Hiška</label><textarea id="hk-q" rows="1" maxlength="1500" placeholder="' + AK.esc(T.ph) + '"></textarea>' +
    '<button class="btn primary" type="submit">Pošlji</button></form>' +
    '<p class="chat-note">' + T.note + "</p>";
  var log = root.querySelector(".chat-log"), q = root.querySelector("textarea"), form = root.querySelector("form"), busy = false;

  function grow() { q.style.height = "auto"; q.style.height = Math.min(140, q.scrollHeight) + "px"; }
  form.addEventListener("submit", function (e) { e.preventDefault(); ask(q.value); });
  q.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(q.value); } });
  q.addEventListener("input", grow);
  root.querySelector("[data-a=clear]").addEventListener("click", function () { messages = []; save(); paint(); q.focus(); });

  // Split an answer into prose and an optional ```nalog``` JSON block.
  function parse(text) {
    var m = text.match(/```nalog\s*([\s\S]*?)```/);
    var prose = text.replace(/```nalog[\s\S]*?(```|$)/, "").trim();
    var data = null;
    if (m) { try { data = JSON.parse(m[1]); } catch (e) { data = null; } }
    return { prose: prose, order: data && typeof data === "object" ? data : null };
  }

  function orderBlock(o) {
    var card = AK.orderCard(o);
    var act = document.createElement("div");
    act.className = "act";
    var b = document.createElement("button");
    b.type = "button"; b.className = "btn primary small"; b.textContent = T.send;
    b.addEventListener("click", function () {
      AK.addOrder(JSON.parse(JSON.stringify(o)));
      act.innerHTML = '<span class="sent">' + T.sent + '</span> <a href="upravnik.html#inbox">' + T.see + " →</a>";
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
      div.innerHTML = AK.md(p.prose);
      if (p.order) div.appendChild(orderBlock(p.order));
    } else div.innerHTML = "<p>" + AK.esc(text) + "</p>";
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
    try { ctx = window.AktivaChatContext ? String(window.AktivaChatContext() || "") : ""; } catch (e) {}
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
          div.innerHTML = AK.md(parse(answer).prose.replace(/```nalog[\s\S]*$/, ""));
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

  paint();
  document.querySelectorAll("[data-ask]").forEach(function (el) {
    el.addEventListener("click", function () { ask(el.getAttribute("data-ask")); if (window.innerWidth < 980) root.scrollIntoView({ behavior: "smooth" }); });
  });
  window.Hisko = { ask: ask };
})();
