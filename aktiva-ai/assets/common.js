// Hiško concept: shared helpers (escaping, markdown, work-order store, demo data).
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
  function eur(n) { return new Intl.NumberFormat("sl-SI", { style: "currency", currency: "EUR" }).format(n); }
  function num(n, d) { return new Intl.NumberFormat("sl-SI", { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }).format(n); }

  // Work orders sent from the chat land in this browser's localStorage; upravnik.html reads them.
  var KEY = "aktiva-ai-nalogi";
  function orders() { try { return JSON.parse(localStorage.getItem(KEY) || "[]") || []; } catch (e) { return []; } }
  function addOrder(o) {
    var list = orders();
    o.id = "N-" + (2600 + list.length + 41);
    o.cas = new Date().toISOString();
    o.kanal = "Hiško (klepet)";
    o.status = "nov";
    list.unshift(o);
    try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, 30))); } catch (e) {}
    return o;
  }
  function clearOrders() { try { localStorage.removeItem(KEY); } catch (e) {} }

  var URG = { "nujno": ["bad", "nujno"], "24 ur": ["warn", "h24"], "ta teden": ["blue", ""], "načrtovano": ["", ""] };
  // Work-order card shared by the chat and the upravnik inbox.
  function orderCard(o, opts) {
    opts = opts || {};
    var u = URG[o.nujnost] || ["", ""];
    var div = document.createElement("div");
    div.className = "wo " + u[1];
    div.innerHTML =
      '<div class="row"><b>' + esc(o.naslov || "Delovni nalog") + '</b><span class="pill ' + u[0] + '">' + esc(o.nujnost || "") + '</span><span class="pill">' + esc(o.kategorija || "") + "</span>" +
      (opts.meta ? '<span class="meta">' + esc(opts.meta) + "</span>" : "") + "</div>" +
      "<dl>" +
      (o.lokacija ? "<dt>Kje</dt><dd>" + esc(o.lokacija) + "</dd>" : "") +
      (o.opis ? "<dt>Opis</dt><dd>" + esc(o.opis) + "</dd>" : "") +
      (o.izvajalec ? "<dt>Predlog</dt><dd>" + esc(o.izvajalec) + "</dd>" : "") +
      (o.lastniku ? "<dt>Lastniku</dt><dd>" + esc(o.lastniku) + "</dd>" : "") +
      (o.podlaga ? "<dt>Podlaga</dt><dd>" + esc(o.podlaga) + "</dd>" : "") +
      "</dl>";
    return div;
  }

  var demo = null;
  function loadDemo() { if (!demo) demo = fetch("assets/demo.json").then(function (r) { return r.json(); }); return demo; }

  document.addEventListener("DOMContentLoaded", function () {
    var nav = document.querySelector(".nav"), cur = nav && nav.querySelector("[aria-current]");
    if (cur && nav.scrollWidth > nav.clientWidth) nav.scrollLeft = cur.offsetLeft - 16;
  });

  window.AK = { esc: esc, md: md, eur: eur, num: num, orders: orders, addOrder: addOrder, clearOrders: clearOrders, orderCard: orderCard, loadDemo: loadDemo };
})();
