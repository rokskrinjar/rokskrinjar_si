// Ask Alex chat UI. Talks to window.ASK_ALEX_API; keeps the conversation for this tab only.
(function () {
  var API = window.ASK_ALEX_API || "";
  var T = window.ASK_TEXT || {};
  var KEY = "ask-alex-chat";
  var log = document.getElementById("log");
  var form = document.getElementById("form");
  var q = document.getElementById("q");
  var send = document.getElementById("send");
  var examples = document.getElementById("examples");
  var messages = [];

  function lang() { return document.documentElement.getAttribute("data-lang") === "sl" ? "sl" : "en"; }
  function t(k) { return (T[k] && T[k][lang()]) || ""; }

  function esc(s) {
    return s.replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function inline(s) {
    s = esc(s);
    s = s.replace(/\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g, '<a href="$2">$1</a>');
    s = s.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
    return s;
  }
  // minimal Markdown: paragraphs, numbered and bulleted lists, links, bold
  function render(md) {
    var out = [], list = null;
    md.split(/\n/).forEach(function (line) {
      var m = line.match(/^\s*(\d+)[.)]\s+(.*)$/), b = line.match(/^\s*[-*•]\s+(.*)$/);
      if (m || b) {
        var type = m ? "ol" : "ul";
        if (list !== type) { if (list) out.push("</" + list + ">"); out.push("<" + type + ">"); list = type; }
        out.push("<li>" + inline(m ? m[2] : b[1]) + "</li>");
      } else {
        if (list) { out.push("</" + list + ">"); list = null; }
        if (line.trim()) out.push("<p>" + inline(line) + "</p>");
      }
    });
    if (list) out.push("</" + list + ">");
    return out.join("");
  }

  function add(role, text, cls) {
    var div = document.createElement("div");
    div.className = "msg " + role + (cls ? " " + cls : "");
    div.innerHTML = role === "assistant" ? render(text) : "<p>" + esc(text) + "</p>";
    log.appendChild(div);
    div.scrollIntoView({ block: "nearest" });
    return div;
  }

  function save() { try { sessionStorage.setItem(KEY, JSON.stringify(messages)); } catch (e) {} }
  function restore() {
    try { messages = JSON.parse(sessionStorage.getItem(KEY) || "[]") || []; } catch (e) { messages = []; }
    messages.forEach(function (m) { add(m.role, m.content); });
    examples.hidden = messages.length > 0;
  }

  function setPlaceholder() { q.placeholder = q.getAttribute("data-ph-" + lang()) || ""; }

  async function ask(text) {
    text = text.trim();
    if (!text) return;
    if (!API) { add("assistant", t("offline"), "error"); return; }
    examples.hidden = true;
    messages.push({ role: "user", content: text });
    add("user", text);
    q.value = "";
    send.disabled = true;
    var wait = add("assistant", t("thinking"), "wait");
    try {
      var r = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: messages.slice(-7) })
      });
      var data = await r.json().catch(function () { return {}; });
      wait.remove();
      if (!r.ok || !data.answer) {
        messages.pop();
        add("assistant", data.error || "Something went wrong. Please try again.", "error");
      } else {
        messages.push({ role: "assistant", content: data.answer });
        add("assistant", data.answer);
      }
    } catch (e) {
      wait.remove();
      messages.pop();
      add("assistant", "The chatbot could not be reached. Please try again.", "error");
    }
    save();
    send.disabled = false;
    q.focus();
  }

  form.addEventListener("submit", function (e) { e.preventDefault(); ask(q.value); });
  q.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(q.value); }
  });
  examples.addEventListener("click", function (e) {
    var b = e.target.closest("button.ex");
    if (b) ask(b.getAttribute("data-q-" + lang()));
  });
  document.getElementById("clear").addEventListener("click", function () {
    messages = []; save(); log.innerHTML = ""; examples.hidden = false; q.focus();
  });
  document.querySelectorAll(".lang button").forEach(function (b) { b.addEventListener("click", function () { setTimeout(setPlaceholder, 0); }); });

  setPlaceholder();
  restore();
  if (!API) add("assistant", t("offline"), "error");
})();
