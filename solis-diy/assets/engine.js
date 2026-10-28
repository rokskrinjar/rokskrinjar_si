// Solis DIY: project cut lists, nesting into stock lengths, and the price estimate.
// Pure functions, no DOM. Lengths in mm, sections as "TxW" in mm.
(function () {
  "use strict";

  function part(sl, en, product, species, section, length, qty) {
    return { label: { sl: sl, en: en }, product: product, species: species, section: section, length: Math.round(length), qty: qty };
  }
  function dims(section) { var a = section.split("x"); return [Number(a[0]), Number(a[1])]; }

  // One generator per planner project. p = parameter values, v = variant id.
  var GEN = {
    "raised-bed": function (p, v) {
      var B = v === "dry" ? ["dry", "sf", "24x150"] : v === "larch" ? ["planed", "larch", "28x145"] : ["planed", "sf", "28x145"];
      var P = v === "dry" ? ["dry", "sf", "50x100"] : v === "larch" ? ["planed", "larch", "45x70"] : ["planed", "sf", "45x70"];
      var t = dims(B[2])[0], w = dims(B[2])[1];
      var rows = Math.max(2, Math.round(p.H / w));
      var mids = 2 * Math.max(0, Math.ceil(p.L / 1200) - 1);
      return [
        part("Dolga stranica", "Long side", B[0], B[1], B[2], p.L, 2 * rows),
        part("Kratka stranica", "Short side", B[0], B[1], B[2], p.W - 2 * t, 2 * rows),
        part("Stebriček", "Post", P[0], P[1], P[2], rows * w, 4 + mids)
      ];
    },
    "planter": function (p, v) {
      var s = v === "larch" ? "larch" : "sf";
      var rows = Math.max(2, Math.round(p.H / 95));
      var inner = p.W - 40;
      return [
        part("Dolga stranica", "Long side", "planed", s, "20x95", p.L, 2 * rows),
        part("Kratka stranica", "Short side", "planed", s, "20x95", inner, 2 * rows),
        part("Letvica dna", "Base slat", "planed", s, "20x95", inner, Math.ceil((p.L - 40) / 100)),
        part("Vogalna letev z nogico", "Corner post with foot", "planed", s, "45x45", rows * 95 + 30, 4)
      ];
    },
    "compost": function (p, v) {
      var pr = v === "dry" ? "dry" : "fresh";
      var rows = Math.ceil(p.H / 120);
      return [
        part("Letvica zadnje stene", "Back wall slat", pr, "sf", "24x100", p.W, p.n * rows),
        part("Snemljiva sprednja letvica", "Removable front slat", pr, "sf", "24x100", p.W - 10, p.n * rows),
        part("Letvica stranske stene", "Side wall slat", pr, "sf", "24x100", p.D, (p.n + 1) * rows),
        part("Vodilo za sprednje letvice", "Front slat guide", pr, "sf", "24x100", p.H, 2 * p.n),
        part("Steber", "Post", pr, "sf", "80x80", p.H, 2 * (p.n + 1))
      ];
    },
    "firewood": function (p, v) {
      var ps = v === "larch" ? "larch" : "sf";
      var perSide = Math.ceil(p.L / 1200) + 1;
      return [
        part("Sprednji steber", "Front post", "dry", ps, "100x100", p.H, perSide),
        part("Zadnji steber", "Back post", "dry", ps, "100x100", p.H - 200, perSide),
        part("Lega", "Top plate", "dry", "sf", "50x150", p.L + 200, 2),
        part("Špirovec", "Rafter", "dry", "sf", "50x100", p.D + 400, Math.ceil((p.L + 200) / 650) + 1),
        part("Strešna deska", "Roof board", "dry", "sf", "24x150", p.L + 200, Math.ceil((p.D + 400) / 150)),
        part("Talni tramič", "Floor joist", "dry", "sf", "50x100", p.L, 3),
        part("Talna letev", "Floor slat", "dry", "sf", "24x150", p.D, Math.ceil(p.L / 170))
      ];
    },
    "pergola": function (p, v) {
      var rs = v === "larch" ? "larch" : "sf";
      var posts = p.L > 3600 ? 6 : 4;
      return [
        part("Steber", "Post", "bsh", "sf", "120x120", p.H, posts),
        part("Lega", "Beam", "bsh", "sf", "100x200", p.L + 600, 2),
        part("Špirovec", "Rafter", "planed", rs, "45x145", p.W + 600, Math.ceil(p.L / 500) + 1),
        part("Poševna opora", "Knee brace", "planed", rs, "70x70", 700, 2 * posts)
      ];
    },
    "bench": function (p, v) {
      var s = v === "larch" ? "larch" : "sf";
      return [
        part("Deska sedišča", "Seat board", "planed", s, "45x145", p.L, 3),
        part("Noga", "Leg", "planed", s, "45x95", 405, 4),
        part("Prečka pod sediščem", "Cross rail", "planed", s, "45x95", 450, 2),
        part("Vzdolžna vez", "Stretcher", "planed", s, "45x95", p.L - 300, 2)
      ];
    },
    "picnic": function (p, v) {
      var s = v === "larch" ? "larch" : "sf";
      return [
        part("Deska mize", "Top board", "planed", s, "45x145", p.L, 5),
        part("Deska klopi", "Seat board", "planed", s, "45x145", p.L, 4),
        part("Noga (poševna)", "Leg (angled)", "planed", s, "45x145", 850, 4),
        part("Nosilec klopi", "Seat support", "planed", s, "45x145", 1550, 2),
        part("Prečka mize", "Top cleat", "planed", s, "45x95", 720, 3),
        part("Poševna opora", "Brace", "planed", s, "45x95", 800, 2)
      ];
    },
    "workbench": function (p) {
      var out = [
        part("Letev plošče (na rob)", "Top batten (on edge)", "planed", "sf", "45x95", p.L, Math.floor(p.W / 45)),
        part("Noga (podvojena)", "Leg (doubled)", "planed", "sf", "45x95", p.H - 95, 8),
        part("Vzdolžna vez", "Long rail", "planed", "sf", "45x95", p.L - 300, 4),
        part("Prečna vez", "Short rail", "planed", "sf", "45x95", p.W - 100, 4)
      ];
      if (p.shelf) out.push(part("Deska police", "Shelf board", "planed", "sf", "20x145", p.L - 300, Math.ceil((p.W - 100) / 145)));
      return out;
    },
    "wall-shelf": function (p, v) {
      var pr = v === "radial" ? "radial" : "planed";
      if (pr === "planed" && p.D <= 195) return [part("Polica", "Shelf", "planed", "sf", "28x195", p.L, p.n)];
      if (p.D <= 145) return [part("Polica", "Shelf", pr, "sf", "28x145", p.L, p.n)];
      return [part("Polica (dve deski, zlepljeni)", "Shelf (two boards glued)", pr, "sf", "28x145", p.L, 2 * p.n)];
    },
    "bookshelf": function (p, v) {
      var pr = v === "radial" ? "radial" : "planed";
      var per = p.D <= 145 ? 1 : 2;
      var out = [
        part("Stranica", "Side", pr, "sf", "28x145", p.H, 2 * per),
        part("Polica", "Shelf", pr, "sf", "28x145", p.W - 56, p.n * per)
      ];
      if (p.back) out.push(part("Letvica hrbta", "Back slat", "planed", "sf", "20x95", p.H, Math.ceil(p.W / 95)));
      return out;
    },
    "bed": function (p) {
      var wide = p.MW >= 1400;
      var out = [
        part("Stranica", "Side rail", "planed", "sf", "45x195", p.ML + 40, 2),
        part("Čelo", "End rail", "planed", "sf", "45x195", p.MW + 130, 2),
        part("Noga", "Leg", "planed", "sf", "95x95", p.LH, wide ? 6 : 4),
        part("Nosilna letev", "Ledger strip", "planed", "sf", "45x45", p.ML, 2),
        part("Letvica", "Slat", "planed", "sf", "28x95", p.MW, Math.ceil(p.ML / 125))
      ];
      if (wide) out.splice(4, 0, part("Srednji nosilec", "Centre beam", "planed", "sf", "45x95", p.ML, 1));
      return out;
    },
    "sauna": function (p) {
      var depth = [600, 500, 450], height = [1000, 700, 450];
      var tiers = depth.slice(0, p.n), heights = p.n === 1 ? [450] : p.n === 2 ? [900, 450] : height;
      var frames = Math.ceil(p.L / 600) + 1, out = [];
      tiers.forEach(function (d, i) {
        var n = i + 1;
        out.push(part("Deska sedišča, nivo " + n, "Seat board, tier " + n, "radial", "sf", "28x95", p.L, Math.ceil(d / 105)));
        out.push(part("Noga ogrodja, nivo " + n, "Frame leg, tier " + n, "planed", "sf", "45x70", heights[i] - 28, 2 * frames));
        out.push(part("Prečka ogrodja, nivo " + n, "Frame rail, tier " + n, "planed", "sf", "45x70", d, frames));
      });
      return out;
    },
    "slat-wall": function (p, v) {
      var pr = v === "planed" ? "planed" : "radial";
      var rows = Math.ceil(p.H / 550) + 1;
      var split = Math.ceil(p.W / 4000);
      return [
        part("Letvica", "Slat", pr, "sf", "20x45", p.H, Math.ceil(p.W / (45 + p.G))),
        part("Podkonstrukcijska letev", "Wall batten", "dry", "sf", "30x50", Math.ceil(p.W / split), rows * split)
      ];
    }
  };

  function defaults(project) {
    var p = {};
    project.params.forEach(function (q) { p[q.id] = q.def; });
    return p;
  }

  // First-fit decreasing into the longest stock, then shrink each bin to the shortest stock that still fits.
  // Sawn lengths carry a small overmeasure (trim), so 2 × 2000 mm fits a 4000 mm board.
  function nest(lengths, stock, kerf, trim) {
    trim = trim || 0;
    var max = Math.max.apply(null, stock) + trim, bins = [];
    lengths.slice().sort(function (a, b) { return b - a; }).forEach(function (len) {
      var bin = null;
      for (var i = 0; i < bins.length; i++) {
        if (bins[i].used + len + (bins[i].pieces.length ? kerf : 0) <= max) { bin = bins[i]; break; }
      }
      if (!bin) { bin = { pieces: [], used: 0 }; bins.push(bin); }
      bin.used += len + (bin.pieces.length ? kerf : 0);
      bin.pieces.push(len);
    });
    var sorted = stock.slice().sort(function (a, b) { return a - b; });
    bins.forEach(function (b) {
      b.stock = sorted.find(function (s) { return s + trim >= b.used; }) || max - trim;
      b.waste = Math.max(0, b.stock - b.used);
    });
    return bins;
  }

  function productById(cat, id) { return cat.products.find(function (p) { return p.id === id; }); }

  function validate(cat, it) {
    var pr = productById(cat, it.product);
    if (!pr) return "product";
    if (pr.species.indexOf(it.species) < 0) return "species";
    if (pr.sections.indexOf(it.section) < 0) return "section";
    if (!(it.length >= pr.minLen && it.length <= pr.maxLen)) return "length";
    if (!(it.qty >= 1 && it.qty <= 500)) return "qty";
    return "";
  }

  // Groups identical material, nests board products, prices everything.
  function quote(cat, items, opts) {
    opts = opts || {};
    var groups = {}, order = [], errors = [];
    items.forEach(function (it, idx) {
      var err = validate(cat, it);
      if (err) { errors.push({ index: idx, error: err }); return; }
      var key = it.product + "|" + it.species + "|" + it.section;
      if (!groups[key]) { groups[key] = { product: it.product, species: it.species, section: it.section, parts: [] }; order.push(key); }
      groups[key].parts.push(it);
    });

    var lines = [], material = 0, bench = 0, kg = 0, cuts = 0, longest = 0, net = 0;
    order.forEach(function (key) {
      var g = groups[key], pr = productById(cat, g.product), sp = cat.species[g.species];
      var d = dims(g.section), area = d[0] * d[1] / 1e6;
      var factor = sp.factor;
      if (pr.knotfree && opts.knotfree) factor *= 1 + pr.knotfree;
      var unit = pr.price * factor + (pr.ht && opts.ht ? pr.ht : 0);
      var lengths = [];
      g.parts.forEach(function (p) { for (var i = 0; i < p.qty; i++) lengths.push(p.length); longest = Math.max(longest, p.length); });
      var line = { product: g.product, species: g.species, section: g.section, parts: g.parts, pieces: lengths.length, partVolume: 0 };
      lengths.forEach(function (l) { line.partVolume += area * l / 1000; });
      if (pr.stock) {
        line.bins = nest(lengths, pr.stock, cat.kerf, cat.trim);
        line.stockCount = {};
        line.volume = 0;
        line.bins.forEach(function (b) {
          line.stockCount[b.stock] = (line.stockCount[b.stock] || 0) + 1;
          line.volume += area * b.stock / 1000;
          b.pieces.forEach(function (l) { if (l < b.stock) cuts++; });
        });
        // Delivered length: cut pieces, unless the customer takes whole stock boards.
        line.maxPiece = Math.max.apply(null, lengths);
        line.maxStock = Math.max.apply(null, line.bins.map(function (b) { return b.stock; }));
      } else {
        line.volume = line.partVolume;
        cuts += lengths.length;
        line.maxPiece = line.maxStock = Math.max.apply(null, lengths);
      }
      line.waste = line.volume ? 1 - line.partVolume / line.volume : 0;
      line.unit = unit;
      line.price = line.volume * unit;
      line.kg = line.volume * (pr.density || sp.density);
      line.bench = pr.benchmark ? line.volume * pr.benchmark * sp.factor : line.price;
      line.hasBench = !!pr.benchmark;
      material += line.price; bench += line.bench; kg += line.kg;
      lines.push(line);
    });

    var extras = [], extrasTotal = 0, noParcel = false;
    (cat.extras || []).forEach(function (x) {
      var n = (opts.extras && opts.extras[x.id]) || 0;
      if (!n) return;
      var price = x.bulk && n >= x.bulk.from ? x.bulk.price : x.price;
      extras.push({ id: x.id, qty: n, unit: price, price: n * price, kg: n * x.kg, item: x });
      extrasTotal += n * price; kg += n * x.kg;
      if (x.noParcel) noParcel = true;
    });

    var cutFee = cuts * cat.fees.cut;
    var small = material + extrasTotal > 0 && material + extrasTotal < cat.fees.smallOrder.below ? cat.fees.smallOrder.fee : 0;

    // Delivery options that are physically possible for this order.
    var D = cat.delivery, km = opts.km || 0, modes = {};
    var maxLen = Math.max(longest, 0);
    modes.pickup = { ok: true, price: 0 };
    var tier = D.parcel.tiers.find(function (t) { return kg <= t[0]; });
    modes.parcel = { ok: maxLen <= D.parcel.maxLen && !!tier && !noParcel, price: tier ? tier[1] : null };
    modes.van = { ok: maxLen <= D.van.maxLen && kg <= D.van.maxKg, price: D.van.base + Math.max(0, km - D.van.baseKm) * D.van.perKm };
    modes.truck = { ok: true, price: D.truck.base + Math.max(0, km - D.truck.baseKm) * D.truck.perKm };
    var mode = opts.delivery && modes[opts.delivery] && modes[opts.delivery].ok ? opts.delivery :
      ["pickup", "parcel", "van", "truck"].find(function (m) { return modes[m].ok; });
    var delivery = modes[mode].price || 0;

    var total = material + cutFee + small + extrasTotal + delivery;
    net = total / (1 + cat.vat);
    return {
      lines: lines, errors: errors, extras: extras, material: material, bench: bench, cuts: cuts, cutFee: cutFee,
      small: small, extrasTotal: extrasTotal, delivery: delivery, mode: mode, modes: modes, kg: kg,
      volume: lines.reduce(function (s, l) { return s + l.volume; }, 0),
      partVolume: lines.reduce(function (s, l) { return s + l.partVolume; }, 0),
      longest: longest, total: total, net: net
    };
  }

  window.SolisEngine = { GEN: GEN, defaults: defaults, nest: nest, quote: quote, validate: validate, dims: dims, productById: productById };
})();
