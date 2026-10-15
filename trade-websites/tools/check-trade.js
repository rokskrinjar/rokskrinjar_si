// Validates trade data files against data/SCHEMA.md. Usage: node check-trade.js data/plumber.js [...]
const fs = require('fs');
const ICONS = 'wrench bolt tiles roller saw roof brick key flame snow leaf sparkle box floor pane gutter chimney trowel car spark hammer sun washer toolbox bath'.split(' ');
let failed = false;
for (const f of process.argv.slice(2)) {
  const errs = [];
  let D = null, n = 0;
  const T = { trade: d => { D = d; n++; } };
  try { new Function('T', fs.readFileSync(f, 'utf8'))(T); } catch (e) { errs.push('JS error: ' + e.message); }
  if (D) {
    const req = (k, t) => { if (t === 'array' ? !Array.isArray(D[k]) : typeof D[k] !== t) errs.push(`${k} must be ${t}`); };
    ['id', 'name', 'plural', 'noun', 'icon'].forEach(k => req(k, 'string'));
    req('emergency', 'boolean');
    if (!ICONS.includes(D.icon)) errs.push('unknown icon ' + D.icon);
    if (require('path').basename(f, '.js') !== D.id) errs.push('id must match file name');
    const min = (k, m, arr = D[k]) => { if (!Array.isArray(arr) || arr.length < m) errs.push(`${k}: need ≥${m}, got ${arr ? arr.length : 0}`); };
    min('pre', 24, D.nameParts && D.nameParts.pre); min('post', 8, D.nameParts && D.nameParts.post);
    min('headlines', 12); min('intros', 8); min('about', 6); min('services', 10); min('usps', 10); min('process', 5);
    min('faq', 10); min('reviews', 14); min('certs', 6); min('gallery', 12); min('jobs', 8); min('urgent', 5); min('tips', 8);
    (D.services || []).forEach((s, i) => { if (!s.n || !s.d || typeof s.from !== 'number' || !s.unit) errs.push('service ' + i + ' incomplete'); });
    (D.reviews || []).forEach((r, i) => { if (!r.t || !r.job || ![4, 5].includes(r.s)) errs.push('review ' + i + ' incomplete'); });
    ['usps', 'process', 'faq', 'tips', 'gallery'].forEach(k => (D[k] || []).forEach((p, i) => { if (!Array.isArray(p) || p.length !== 2 || !p[0] || !p[1]) errs.push(k + ' ' + i + ' must be [a,b]'); }));
    const c = D.calc;
    if (!c || !c.title || !c.intro || typeof c.base !== 'number' || !Array.isArray(c.inputs) || !Array.isArray(c.notes)) errs.push('calc incomplete');
    else {
      if (c.inputs.length < 3 || c.inputs.length > 6) errs.push('calc needs 3–6 inputs');
      const nums = c.inputs.filter(i => i.t === 'num').map(i => i.k);
      if (!nums.length) errs.push('calc needs a num input');
      if (!c.inputs.some(i => i.t === 'sel')) errs.push('calc needs a sel input');
      const eff = (e, w) => { if (!e || typeof e !== 'object') return errs.push(w + ': missing effect'); if (e.r != null && !nums.includes(e.per)) errs.push(w + ': per must name a num input'); if (e.a == null && e.m == null && e.r == null) errs.push(w + ': empty effect'); };
      c.inputs.forEach(i => {
        if (!i.k || !i.l) errs.push('calc input needs k and l');
        if (i.t === 'num') { ['min', 'max', 'v', 'rate'].forEach(x => { if (typeof i[x] !== 'number') errs.push(`num ${i.k}.${x}`); }); if (!i.u) errs.push('num ' + i.k + ' needs u'); }
        else if (i.t === 'sel') { if (!Array.isArray(i.o) || i.o.length < 2) errs.push('sel ' + i.k + ' needs ≥2 options'); else i.o.forEach(o => eff(o[1], 'sel ' + i.k + ' ' + o[0])); }
        else if (i.t === 'chk') eff(i.e, 'chk ' + i.k);
        else errs.push('bad input type ' + i.t);
      });
      // default total sanity
      let add = c.base, mul = 1; const val = {};
      c.inputs.filter(i => i.t === 'num').forEach(i => { val[i.k] = i.v; add += i.v * i.rate; });
      const ap = e => { if (e.a) add += e.a; if (e.m) mul *= e.m; if (e.r) add += e.r * val[e.per]; };
      c.inputs.forEach(i => { if (i.t === 'sel') ap(i.o[0][1]); });
      const tot = add * mul; if (!(tot > 40 && tot < 60000)) errs.push('default estimate unrealistic: £' + Math.round(tot));
      else console.log(`  default estimate £${Math.round(tot)}`);
    }
    if (!D.hours || !D.hours.normal) errs.push('hours.normal missing');
    const txt = JSON.stringify(D); if (/lorem|TBD|TODO|xxx/i.test(txt)) errs.push('placeholder text found');
  } else if (!errs.length) errs.push('T.trade() not called');
  if (n > 1) errs.push('T.trade called more than once');
  if (errs.length) { failed = true; console.log('FAIL ' + f + '\n  - ' + errs.join('\n  - ')); } else console.log('OK ' + f);
}
process.exit(failed ? 1 : 0);
