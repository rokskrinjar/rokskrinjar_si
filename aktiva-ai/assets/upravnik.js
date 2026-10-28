// Upravnik view: simulated KPIs, the work-order inbox (seed orders + the ones sent from the chat), topic and language bars.
(function () {
  "use strict";
  var STATUS = { "nov": "blue", "v delu": "warn", "za zbor lastnikov": "", "zaključen": "ok" };

  function when(iso) {
    var d = new Date(iso);
    return d.toLocaleDateString("sl-SI", { day: "numeric", month: "numeric" }) + " ob " + d.toLocaleTimeString("sl-SI", { hour: "2-digit", minute: "2-digit" });
  }

  function bars(el, rows) {
    var max = Math.max.apply(null, rows.map(function (r) { return r[1]; }));
    el.innerHTML = rows.map(function (r) {
      return '<div class="bar"><span>' + AK.esc(r[0]) + '</span><i style="width:' + (r[1] / max * 100).toFixed(1) + '%"></i><span>' + AK.num(r[1] * 100) + " %</span></div>";
    }).join("");
  }

  function renderOrders(D) {
    var mine = AK.orders();
    var list = mine.concat(D.seedOrders);
    var box = document.getElementById("orders");
    box.innerHTML = "";
    list.forEach(function (o, i) {
      var card = AK.orderCard(o, { meta: o.id + " · " + when(o.cas) + " · " + (o.kanal || "") });
      var act = document.createElement("div");
      act.className = "act";
      act.innerHTML = '<span class="pill ' + (STATUS[o.status] || "") + '">' + AK.esc(o.status || "nov") + "</span>" +
        (i < mine.length ? '<span class="pill blue">iz vašega pogovora</span>' : "") +
        (o.status === "nov" ? '<button class="btn small" type="button" disabled title="V konceptu gumb ne naredi ničesar">Potrdi in pošlji izvajalcu</button>' : "");
      card.appendChild(act);
      box.appendChild(card);
    });
    document.getElementById("reset").hidden = !mine.length;
  }

  AK.loadDemo().then(function (D) {
    var s = D.sim;
    document.getElementById("kpis").innerHTML = [
      [AK.num(s.questions), "vprašanj lastnikov", ""],
      [AK.num(s.selfServed * 100) + " %", "rešenih brez upravnika", ""],
      [AK.num(s.orders), "delovnih nalogov iz pogovorov", ""],
      [s.firstResponse, "do prvega odgovora", "prej " + s.before],
      [AK.num(s.hoursSaved) + " h", "prihranjenega časa na mesec", "točnost na naboru vprašanj " + AK.num(s.accuracy * 100) + " %"]
    ].map(function (k) { return "<div><b>" + k[0] + "</b><span>" + k[1] + "</span>" + (k[2] ? "<em>" + AK.esc(k[2]) + "</em>" : "") + "</div>"; }).join("");
    document.getElementById("sim-note").textContent = "Simulacija za " + s.period + ". Prikazuje, kako bi poročilo izgledalo, ne dejanskih rezultatov.";
    bars(document.getElementById("topics"), s.topics);
    bars(document.getElementById("langs"), s.languages);
    renderOrders(D);
    document.getElementById("reset").addEventListener("click", function () { AK.clearOrders(); renderOrders(D); });
  });
})();
