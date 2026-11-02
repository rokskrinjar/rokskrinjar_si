// Opportunity list: draws the value/feasibility map from data-v and data-i on each article, adds the score bars, filters the list.
(function () {
  "use strict";
  var items = [].slice.call(document.querySelectorAll("#opp article")), map = document.getElementById("matrix");
  function score(n) { var h = '<span class="score" aria-hidden="true">'; for (var i = 1; i <= 5; i++) h += "<i" + (i <= n ? ' class="on"' : "") + "></i>"; return h + "</span>"; }

  map.innerHTML = '<span class="q" style="left:10px;top:8px">Velika vrednost</span><span class="q" style="right:10px;bottom:8px">Lahko izvedljivo →</span>';
  var seen = {};
  items.forEach(function (a) {
    var v = +a.dataset.v, f = +a.dataset.i, n = a.querySelector(".n").textContent, key = v + "-" + f, k = seen[key] = (seen[key] || 0) + 1;
    var ox = (k - 1) * 8 - (k > 1 ? 3 : 0), oy = (k - 1) * 8.5;
    a.querySelector(".hd").insertAdjacentHTML("beforeend", '<span class="fine" style="margin-left:auto">vrednost ' + score(v) + " izvedljivost " + score(f) + '<span class="vh">Vrednost ' + v + " od 5, izvedljivost " + f + " od 5</span></span>");
    var b = document.createElement("button");
    b.type = "button";
    b.className = "pt" + (a.classList.contains("first") ? " first" : "");
    b.textContent = n;
    b.title = a.querySelector("h3").textContent;
    b.style.left = (((f - .4) / 5) * 100 + ox) + "%";
    b.style.bottom = (((v - .55) / 5) * 100 - oy) + "%";
    b.addEventListener("click", function () {
      items.forEach(function (x) { x.classList.remove("hi"); });
      map.querySelectorAll(".pt").forEach(function (x) { x.classList.remove("hi"); });
      a.classList.add("hi"); b.classList.add("hi");
      a.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    a._pt = b;
    map.appendChild(b);
  });

  document.getElementById("filters").addEventListener("click", function (e) {
    var t = e.target.closest("button");
    if (!t) return;
    this.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", b === t); });
    var f = t.dataset.f;
    items.forEach(function (a) {
      var on = !f || a.dataset.t.split(" ").indexOf(f) >= 0;
      a.hidden = !on;
      a._pt.style.opacity = on ? 1 : .18;
    });
  });
})();
