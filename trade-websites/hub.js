/* hub.js — renders trades/index.html (all 25 trades + 1,000 sites) and trades/<trade>/index.html (40 sites).
   Needs sites.js (window.SITES). The page sets <body data-trade="plumber"> for a trade index, nothing for the hub. */
(function () {
  const S = window.SITES, body = document.body, TRADE = body.dataset.trade || '', base = TRADE ? '../' : '';
  const TR = Object.fromEntries(S.trades.map(t => [t[0], { id: t[0], name: t[1], plural: t[2], icon: t[3], em: t[4], noun: t[5] }]));
  const ALL = S.sites.map(s => ({ t: s[0], n: s[1], file: s[2], name: s[3], town: s[4], region: s[5], cc: s[6], th: s[7], rating: s[8], nrev: s[9], years: s[10], owner: s[11], head: s[12], key: s[0] + '/' + s[2] }));
  const TH = S.themes.map(t => ({ name: t[0], hf: t[1], bf: t[2], acc: t[3], bg: t[4], ink: t[5], dark: !!t[6], hero: t[7] }));
  const CCN = { UK: 'United Kingdom', IE: 'Ireland', AU: 'Australia', NZ: 'New Zealand' };
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const $ = s => document.getElementById(s);
  const ICON = window.T ? T.icon : () => '';
  const css = `
:root{--bg:#f1efe9;--card:#fbfaf7;--tx:#17181a;--mu:#62646a;--ln:#d9d6cd;--acc:#ff5a1f;--hi:#ffd23f}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--tx);font:15px/1.55 'Archivo',system-ui,sans-serif}
.wrap{max-width:1440px;margin:0 auto;padding-inline:32px}
.mono{font-family:'JetBrains Mono',monospace;font-size:11.5px;letter-spacing:.05em;text-transform:uppercase}
.tape{height:12px;background:repeating-linear-gradient(-45deg,var(--hi) 0 14px,var(--tx) 14px 28px)}
nav.top{display:flex;justify-content:space-between;align-items:center;padding-block:18px;font-size:13.5px;color:var(--mu);gap:12px;flex-wrap:wrap}nav.top a{color:var(--tx);text-decoration:none}nav.top span a{margin-left:16px}
header.h{display:grid;grid-template-columns:1.2fr 1fr;gap:48px;align-items:end;padding-block:18px 34px}
h1{font:800 clamp(48px,7.4vw,124px)/.88 'Archivo';font-stretch:75%;letter-spacing:-.02em;margin:0;text-transform:uppercase;text-wrap:balance}
h1 em{font-style:normal;color:var(--acc)}
header.h p{margin:0 0 16px;color:#3d3f44;font-size:16.5px;max-width:48em}
.stats{display:flex;gap:28px;flex-wrap:wrap;font-size:13px;color:var(--mu)}.stats b{font:800 38px/1 'Archivo';font-stretch:75%;color:var(--tx);display:block}
.feat{display:grid;grid-template-columns:repeat(6,1fr);background:var(--tx);color:#eceae4;border-radius:12px;overflow:hidden;margin-bottom:34px}
.feat div{padding:16px 18px}.feat div+div{border-left:1px solid #34363b}.feat b{display:block;color:#fff;font-weight:700;margin:4px 0 2px}.feat small{color:#a7a9ad;font-size:12.5px;line-height:1.4;display:block}.feat .mono{color:var(--hi)}
h2.sec{font:800 clamp(30px,3.6vw,48px)/1 'Archivo';font-stretch:75%;text-transform:uppercase;margin:0 0 6px}
.sub{color:var(--mu);margin:0 0 20px}
.tg{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:56px}
.tc{display:flex;flex-direction:column;background:var(--card);border:1px solid var(--ln);border-radius:12px;overflow:hidden;text-decoration:none;color:inherit;transition:transform .15s,border-color .15s}
.tc:hover{transform:translateY(-2px);border-color:var(--tx)}
.tc .st{display:grid;grid-template-columns:1fr 1fr 1fr;height:74px}.tc .st img{width:100%;height:100%;object-fit:cover;object-position:top}
.tc .bd{padding:12px 14px;display:flex;gap:11px;align-items:center}
.tc .ic{width:22px;height:22px}.tc .ib{width:40px;height:40px;border-radius:10px;background:var(--tx);color:var(--hi);display:grid;place-items:center;flex:none}
.tc b{display:block;font-size:15px;line-height:1.2}.tc small{color:var(--mu);font-size:12.5px}
.em{display:inline-block;background:var(--acc);color:#fff;font-size:10.5px;font-weight:700;border-radius:4px;padding:1px 5px;margin-left:4px;vertical-align:1px}
.ctrl{position:sticky;top:0;z-index:10;background:var(--bg);display:flex;gap:8px;align-items:center;padding-block:12px;border-bottom:1px solid var(--ln);flex-wrap:wrap}
.chip{border:1px solid var(--ln);background:var(--card);color:var(--tx);border-radius:999px;padding:6px 13px;font:600 13px 'Archivo';cursor:pointer;display:inline-flex;gap:6px;align-items:center}
.chip small{font-size:11px;opacity:.55}.chip.on{background:var(--tx);border-color:var(--tx);color:var(--bg)}.chip.likec.on{background:var(--acc);border-color:var(--acc);color:#fff}
.ctrl select,.srch{border:1px solid var(--ln);background:var(--card);border-radius:999px;padding:7px 14px;font:14px 'Archivo';color:var(--tx);max-width:100%}
.srch{width:240px}.ctrl .sp{flex:1}
.cnt{color:var(--mu);font-size:13px;padding-block:12px}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:26px 18px;padding-bottom:30px}
.card{display:flex;flex-direction:column;min-width:0}.card .lnk{display:flex;flex-direction:column;text-decoration:none;color:inherit}
.thumb{position:relative;aspect-ratio:16/10;border-radius:10px;overflow:hidden;background:#e3e0d7;border:1px solid var(--ln)}
.thumb>img{width:100%;height:100%;object-fit:cover;object-position:top;display:block;transition:transform .5s cubic-bezier(.2,.8,.2,1)}.card:hover .thumb>img{transform:scale(1.03)}
.no{position:absolute;left:8px;top:8px;background:var(--tx);color:var(--hi);padding:4px 7px;border-radius:5px}
.like,.cbtn{position:absolute;top:8px;height:34px;border-radius:999px;border:0;background:rgba(251,250,247,.94);color:var(--tx);display:flex;align-items:center;justify-content:center;gap:5px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.15);z-index:2;transition:transform .15s}
.like{right:8px;width:34px}.cbtn{right:48px;min-width:34px;padding:0 9px;font:700 12px 'Archivo'}.like svg{width:17px;height:17px}.cbtn svg{width:16px;height:16px}.like:hover,.cbtn:hover{transform:scale(1.08)}
.like.on{background:var(--acc);color:#fff}.like.on svg path{fill:currentColor}.cbtn.has{background:var(--tx);color:var(--bg)}.cbtn b:empty{display:none}
.like.pop{animation:pop .45s cubic-bezier(.3,1.6,.5,1)}@keyframes pop{40%{transform:scale(1.35)}}
.meta{padding:10px 2px 0;display:flex;flex-direction:column;gap:3px}
.meta h3{margin:0;font-size:16.5px;line-height:1.25}.meta .ln{font-size:13px;color:var(--mu);display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.sw{display:inline-flex}.sw i{width:12px;height:12px;border-radius:50%;margin-left:-3px;border:1.5px solid var(--bg)}.sw i:first-child{margin-left:0}
.more{display:flex;justify-content:center;padding-bottom:50px}.more button{border:0;background:var(--tx);color:var(--bg);font:700 15px 'Archivo';border-radius:999px;padding:12px 26px;cursor:pointer}
.cm{margin-top:8px;background:var(--card);border:1px solid var(--ln);border-radius:10px;padding:12px 14px;display:flex;flex-direction:column;gap:10px}.cm[hidden]{display:none}
.cm .mood{display:flex;gap:6px;flex-wrap:wrap}.cm .mood button,.cm .asp button{border:1px solid var(--ln);background:transparent;color:var(--tx);border-radius:999px;padding:5px 11px;font:600 12.5px 'Archivo';cursor:pointer}
.cm .mood button.on[data-m="+"]{background:#1f8a4c;border-color:#1f8a4c;color:#fff}.cm .mood button.on[data-m="~"]{background:#b7791f;border-color:#b7791f;color:#fff}.cm .mood button.on[data-m="-"]{background:#c53030;border-color:#c53030;color:#fff}
.cm .asp{display:flex;gap:5px;flex-wrap:wrap}.cm .asp button{font-size:12px;padding:3px 9px}.cm .asp button.on{background:var(--tx);border-color:var(--tx);color:var(--bg)}
.cm textarea{width:100%;min-height:70px;resize:vertical;border:1px solid var(--ln);border-radius:8px;padding:9px 10px;font:14.5px/1.45 'Archivo';color:var(--tx);background:#fff}.cm textarea:focus{outline:2px solid var(--acc);outline-offset:-1px}
.cm .row{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}.cm .save{border:0;background:var(--acc);color:#fff;font:700 13.5px 'Archivo';border-radius:999px;padding:8px 16px;cursor:pointer}.cm .save:disabled{opacity:.4;cursor:default}.cm .hint{font-size:12px;color:var(--mu)}
.cl{display:flex;flex-direction:column;gap:6px}.ci{display:grid;grid-template-columns:auto 1fr auto;gap:8px;align-items:start;font-size:13.5px;border-top:1px solid var(--ln);padding-top:8px}
.ci .md{font:700 11px 'Archivo';border-radius:999px;padding:2px 8px;color:#fff;white-space:nowrap}.ci .md.p{background:#1f8a4c}.ci .md.n{background:#c53030}.ci .md.x{background:#b7791f}
.ci small{display:block;color:var(--mu);font-size:11.5px}.ci .del{border:0;background:none;color:var(--mu);cursor:pointer;font-size:15px;padding:0 4px}
.gen{border-top:2px solid var(--tx);padding-block:28px 30px;display:grid;grid-template-columns:1fr 1.4fr;gap:40px}.gen h2{font:800 40px/1 'Archivo';font-stretch:75%;text-transform:uppercase;margin:0 0 10px}.gen p{margin:0;color:var(--mu);max-width:46ch}.gen .cm{margin:0}
.sync{font-size:12.5px;color:var(--mu);display:flex;align-items:center;gap:6px}.sync i{width:8px;height:8px;border-radius:50%;background:#b7791f;display:inline-block;flex:none}.sync.ok i{background:#1f8a4c}
.empty{grid-column:1/-1;text-align:center;color:var(--mu);padding:60px 0}
footer.f{border-top:2px solid var(--tx);padding-block:22px 50px;display:flex;justify-content:space-between;font-size:13.5px;color:var(--mu);flex-wrap:wrap;gap:10px}footer.f a{color:var(--tx)}
.tnav{display:flex;gap:6px;overflow-x:auto;padding-bottom:6px;margin-bottom:18px}.tnav a{flex:none;font-size:13px;text-decoration:none;color:var(--tx);border:1px solid var(--ln);border-radius:999px;padding:5px 11px;background:var(--card)}.tnav a.on{background:var(--tx);color:var(--bg)}
@media(max-width:1200px){.tg{grid-template-columns:repeat(4,1fr)}.grid{grid-template-columns:repeat(3,1fr)}}
@media(max-width:1000px){header.h{grid-template-columns:1fr;gap:16px}.feat{grid-template-columns:repeat(3,1fr)}.feat div:nth-child(4){border-left:0}.feat div:nth-child(n+4){border-top:1px solid #34363b}.tg{grid-template-columns:repeat(3,1fr)}.grid{grid-template-columns:1fr 1fr}.gen{grid-template-columns:1fr;gap:16px}}
@media(max-width:680px){.wrap{padding-inline:16px}.tg{grid-template-columns:1fr 1fr}.grid{grid-template-columns:1fr}.feat{grid-template-columns:1fr 1fr}.feat div{border-left:0!important;border-top:1px solid #34363b}.ctrl{position:static}.srch{width:100%}.ctrl .sp{display:none}}
`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  /* ---- state ---- */
  let likes = [], CM = [], open = new Set(), draft = {}, pending = false, shown = 48;
  const LS = (k, v) => { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || 'null'); localStorage.setItem(k, JSON.stringify(v)) } catch (e) { return null } };
  likes = LS('trades1000-likes') || [];
  const saved = LS('trades1000-' + (TRADE || 'hub')) || {};
  let f = Object.assign({ trade: TRADE, cat: 'All', cc: '', q: '', tone: 'all', hero: '' }, saved, TRADE ? { trade: TRADE } : {});
  const save = () => LS('trades1000-' + (TRADE || 'hub'), { cat: f.cat, cc: f.cc, tone: f.tone, hero: f.hero, trade: TRADE ? undefined : f.trade });

  /* ---- comments (synced to _feedback/trades.json through .claude/serve.js) ---- */
  const COL = 'trades', ASP = ['colours', 'typography', 'layout', 'photos', 'content', 'calculator', 'booking form', 'mobile'], MOODS = [['+', 'I like it'], ['~', 'Mixed'], ['-', 'I don’t like it']];
  const API = (location.protocol === 'file:' ? 'http://localhost:5510' : '') + '/__feedback/';
  CM = LS('trades1000-comments') || [];
  const saveLocal = () => LS('trades1000-comments', CM);
  const OFF = 'Saved in this browser for now. When the local server is reachable again, comments are moved into the project automatically.';
  const sync = (ok, m) => { const s = $('sync'); if (!s) return; s.classList.toggle('ok', ok); s.querySelector('span').textContent = m };
  async function push() { saveLocal(); try { const r = await fetch(API + COL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(CM) }); if (!r.ok) throw 0; pending = false; sync(true, 'Saved to the project (_feedback/trades.json) so Claude can read them.') } catch (e) { pending = true; sync(false, OFF) } }
  async function pull() {
    try { const r = await fetch(API + COL, { cache: 'no-store' }); if (!r.ok) throw 0; const j = await r.json(); const ids = new Set(j.map(x => x.id)); const only = CM.filter(x => !ids.has(x.id)); CM = [...j, ...only]; if (only.length) push(); else { saveLocal(); sync(true, 'Comments are saved to the project (_feedback/trades.json) so Claude can read them.') } }
    catch (e) { pending = CM.length > 0; sync(false, OFF) } draw(); gen();
  }
  setInterval(() => { if (pending) pull() }, 15000); addEventListener('focus', () => { if (pending) pull() });
  const when = ts => new Date(ts).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const GKEY = TRADE ? '_trade:' + TRADE : '_collection';
  function box(k) {
    const d = draft[k] || (draft[k] = { m: '+', a: [], t: '' }), L = CM.filter(x => x.page === k);
    return `<div class="mood">${MOODS.map(m => `<button type="button" data-mood="${m[0]}" data-f="${esc(k)}" data-m="${m[0]}" class="${d.m === m[0] ? 'on' : ''}">${m[1]}</button>`).join('')}</div>
    <div class="asp">${ASP.map(a => `<button type="button" data-asp="${a}" data-f="${esc(k)}" class="${d.a.includes(a) ? 'on' : ''}">${a}</button>`).join('')}</div>
    <textarea data-ta="${esc(k)}" placeholder="${k.startsWith('_') ? 'What do you like or dislike overall? What should I do more or less of?' : 'What works, what doesn’t? E.g. “great calculator”, “colours too dark”, “I’d use this for my business” …'}">${esc(d.t)}</textarea>
    <div class="row"><span class="hint">Save with Ctrl + Enter</span><button type="button" class="save" data-save="${esc(k)}" ${d.t.trim() ? '' : 'disabled'}>Save comment</button></div>
    ${L.length ? `<div class="cl">${L.map(x => `<div class="ci"><span class="md ${x.mood === '+' ? 'p' : x.mood === '-' ? 'n' : 'x'}">${(MOODS.find(m => m[0] === x.mood) || MOODS[1])[1]}</span><div>${esc(x.text)}<small>${when(x.ts)}${x.aspects.length ? ' · ' + x.aspects.join(', ') : ''}</small></div><button type="button" class="del" data-del="${x.id}" aria-label="Delete comment">×</button></div>`).join('')}</div>` : ''}`;
  }
  function gen() { const g = $('genbox'); if (g) g.innerHTML = `<div class="cm">${box(GKEY)}</div>` }
  const nPages = () => new Set(CM.filter(x => !x.page.startsWith('_')).map(x => x.page)).size;
  function addC(k) { const d = draft[k]; if (!d || !d.t.trim()) return; const it = ALL.find(i => i.key === k); CM.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), collection: COL, page: k, name: it ? it.name + ' (' + TR[it.t].name + ')' : k === '_collection' ? 'Whole collection' : 'Trade: ' + TR[TRADE].name, mood: d.m, aspects: d.a, text: d.t.trim(), ts: new Date().toISOString() }); draft[k] = { m: d.m, a: [], t: '' }; push(); rerender(k) }
  function rerender(k) { const c = document.querySelector('[data-c="Commented"] small'); if (c) c.textContent = nPages(); if (k.startsWith('_')) { gen(); return } const el = document.querySelector(`.cm[data-cm="${CSS.escape(k)}"]`); if (el && !el.hidden) el.innerHTML = box(k); const b = document.querySelector(`.cbtn[data-c-open="${CSS.escape(k)}"]`); if (b) { const n = CM.filter(x => x.page === k).length; b.classList.toggle('has', n > 0); b.querySelector('b').textContent = n || '' } }

  /* ---- page skeleton ---- */
  const HEART = '<svg viewBox="0 0 24 24"><path d="M12 20.5s-7.5-4.6-9.3-9.2C1.5 8.1 3.6 4.5 7.2 4.5c2 0 3.5 1.1 4.8 2.8 1.3-1.7 2.8-2.8 4.8-2.8 3.6 0 5.7 3.6 4.5 6.8-1.8 4.6-9.3 9.2-9.3 9.2z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>';
  const CHAT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 5h16v11H9l-5 4z"/></svg>';
  const T0 = TRADE ? TR[TRADE] : null;
  const feat = `<div class="feat"><div><span class="mono">01 · Prices</span><b>Instant estimate</b><small>Trade-specific calculator with a price range and breakdown</small></div><div><span class="mono">02 · Book</span><b>Quote request</b><small>Job type, photos, preferred day and time slot</small></div><div><span class="mono">03 · Trust</span><b>Reviews & credentials</b><small>Rating summary, real-sounding reviews, guarantees</small></div><div><span class="mono">04 · Area</span><b>Area checker</b><small>“Do you cover my town?” with a coverage map</small></div><div><span class="mono">05 · Work</span><b>Gallery</b><small>Filterable photos with a lightbox</small></div><div><span class="mono">06 · Mobile</span><b>Call bar</b><small>Call, WhatsApp and estimate buttons on phones</small></div></div>`;
  const navTop = `<nav class="top"><a href="${base}../index.html">← 100 pages</a><span>${TRADE ? `<a href="../index.html">All 25 trades</a>` : ''}<a href="${base}../erp/index.html">ERP experts</a><a href="${base}../aiconsult/index.html">AI consultants</a></span></nav>`;
  const stripImgs = id => ALL.filter(x => x.t === id).slice(0, 3).map(x => `<img src="${base}thumbs/${id}/${String(x.n).padStart(2, '0')}.jpg" alt="" loading="lazy">`).join('');
  let html = `<div class="tape"></div><div class="wrap">${navTop}`;
  if (!TRADE) {
    html += `<header class="h"><h1>1,000 websites for <em>tradespeople.</em></h1><div><p>Plumbers, electricians, tilers, roofers and 21 other trades: forty ready-made website designs for each, every one a complete, working small-business site. Pick a design you like, swap in your name, prices and photos, and you’re online. All businesses are fictional examples.</p><div class="stats"><span><b>1,000</b>sites</span><span><b>25</b>trades</span><span><b>40</b>designs</span><span><b>4</b>countries</span></div></div></header>${feat}
    <h2 class="sec">Choose your trade</h2><p class="sub">Forty designs per trade. Every trade uses all forty, filled with its own services, prices and calculator.</p>
    <div class="tg">${S.trades.map(t => `<a class="tc" href="${t[0]}/index.html"><div class="st">${stripImgs(t[0])}</div><div class="bd"><span class="ib">${ICON(t[3])}</span><span><b>${esc(t[1])}${t[4] ? '<span class="em">24/7</span>' : ''}</b><small>40 sites</small></span></div></a>`).join('')}</div>
    <h2 class="sec">Browse all 1,000</h2><p class="sub">Filter by trade, country and look. ♥ the ones you like; the bubble lets you comment.</p>`;
  } else {
    html += `<div class="tnav">${S.trades.map(t => `<a href="../${t[0]}/index.html" class="${t[0] === TRADE ? 'on' : ''}">${esc(t[1])}</a>`).join('')}</div>
    <header class="h"><h1>40 websites for <em>${esc(T0.plural.toLowerCase())}.</em></h1><div><p>Forty different designs, each a complete website for a fictional ${esc(T0.name.toLowerCase())} business: services with prices, an instant ${esc(T0.noun)} estimate, reviews, area checker${T0.em ? ', emergency call-out strip' : ''} and a quote request form with photos.</p><div class="stats"><span><b>40</b>designs</span><span><b>${new Set(ALL.filter(x => x.t === TRADE).map(x => x.cc)).size}</b>countries</span><span><b>${ALL.filter(x => x.t === TRADE && TH[x.th].dark).length}</b>dark themes</span></div></div></header>${feat}`;
  }
  html += `<div class="ctrl" id="ctrl"></div><div class="cnt" id="cnt"></div><main class="grid" id="grid"></main><div class="more" id="more"></div>
  <section class="gen"><div><h2>What do you like?</h2><p>Click the speech bubble on any site to say what works and what doesn’t. I distil the comments into your design guidelines and apply them to the next pages.</p><p class="sync" id="sync" style="margin-top:12px"><i></i><span>Checking storage …</span></p></div><div id="genbox"></div></section>
  <footer class="f"><span>All businesses, people, reviews and prices are fictional. Photos: Pexels. Forms on the sites are demos and send nothing.</span><a href="${base}../index.html">Back to 100 pages →</a></footer></div>`;
  body.innerHTML = html;

  /* ---- filters & grid ---- */
  const HEROS = { split: 'Split', full: 'Full photo', card: 'Card', type: 'Big type', mosaic: 'Mosaic', side: 'Side photo' };
  function ctrl() {
    const base0 = ALL.filter(x => !TRADE || x.t === TRADE);
    $('ctrl').innerHTML = `${['All', 'Liked', 'Commented'].map(c => `<button class="chip ${c === 'Liked' ? 'likec' : ''} ${f.cat === c ? 'on' : ''}" data-c="${c}">${c === 'Liked' ? '♥ Liked' : c}<small>${c === 'All' ? base0.length : c === 'Liked' ? base0.filter(x => likes.includes(x.key)).length : base0.filter(x => CM.some(m => m.page === x.key)).length}</small></button>`).join('')}
      ${TRADE ? '' : `<select id="ft" aria-label="Trade"><option value="">All trades</option>${S.trades.map(t => `<option value="${t[0]}" ${f.trade === t[0] ? 'selected' : ''}>${esc(t[1])}</option>`).join('')}</select>`}
      <select id="fc" aria-label="Country"><option value="">All countries</option>${Object.entries(CCN).map(([k, v]) => `<option value="${k}" ${f.cc === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
      <select id="fh" aria-label="Layout"><option value="">All layouts</option>${Object.entries(HEROS).map(([k, v]) => `<option value="${k}" ${f.hero === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
      <select id="fo" aria-label="Tone"><option value="all">Light & dark</option><option value="light" ${f.tone === 'light' ? 'selected' : ''}>Light</option><option value="dark" ${f.tone === 'dark' ? 'selected' : ''}>Dark</option></select>
      <span class="sp"></span><input class="srch" id="q" value="${esc(f.q)}" placeholder="Search name, town, style …">`;
  }
  function list() {
    const q = f.q.toLowerCase().trim();
    return ALL.filter(x => (!TRADE || x.t === TRADE) && (!f.trade || x.t === f.trade) && (!f.cc || x.cc === f.cc) && (!f.hero || TH[x.th].hero === f.hero) && (f.tone === 'all' || (f.tone === 'dark') === TH[x.th].dark)
      && (f.cat === 'All' || (f.cat === 'Liked' && likes.includes(x.key)) || (f.cat === 'Commented' && CM.some(m => m.page === x.key)))
      && (!q || [x.name, x.town, x.region, x.owner, TR[x.t].name, TH[x.th].name, TH[x.th].hf, x.head].join(' ').toLowerCase().includes(q)));
  }
  function card(x) {
    const th = TH[x.th], on = likes.includes(x.key), n = CM.filter(m => m.page === x.key).length, nn = String(x.n).padStart(2, '0');
    return `<article class="card"><a class="lnk" href="${TRADE ? '' : x.t + '/'}${x.file}"><div class="thumb"><button class="like ${on ? 'on' : ''}" data-like="${esc(x.key)}" aria-label="${on ? 'Unlike' : 'Like'} ${esc(x.name)}" aria-pressed="${on}">${HEART}</button><button class="cbtn ${n ? 'has' : ''}" data-c-open="${esc(x.key)}" aria-label="Comment on ${esc(x.name)}" aria-expanded="${open.has(x.key)}">${CHAT}<b>${n || ''}</b></button><img src="${base}thumbs/${x.t}/${nn}.jpg" alt="${esc(x.name)} website" loading="lazy"><span class="no mono">${TRADE ? nn : esc(TR[x.t].name.split(' ')[0]) + ' ' + nn}</span></div>
      <div class="meta"><h3>${esc(x.name)}</h3><div class="ln"><span>${esc(x.town)}, ${x.cc}</span><span>★ ${x.rating}</span><span class="sw"><i style="background:${th.bg}"></i><i style="background:${th.acc}"></i><i style="background:${th.ink}"></i></span><span>${esc(th.name)} · ${esc(th.hf)}</span></div></div></a>
      <div class="cm" data-cm="${esc(x.key)}" ${open.has(x.key) ? '' : 'hidden'}>${open.has(x.key) ? box(x.key) : ''}</div></article>`;
  }
  function draw() {
    if (!$('ctrl').children.length) ctrl();
    const L = list();
    $('cnt').textContent = `${L.length} site${L.length === 1 ? '' : 's'}`;
    $('grid').innerHTML = L.length ? L.slice(0, shown).map(card).join('') : `<div class="empty">${f.cat === 'Liked' ? 'Nothing liked yet. Tap ♥ on any site.' : f.cat === 'Commented' ? 'No comments yet. Click the speech bubble on any site.' : 'No matches. Try other filters.'}</div>`;
    $('more').innerHTML = L.length > shown ? `<button type="button" id="mb">Show more (${L.length - shown} left)</button>` : '';
    save();
  }
  const reset = () => { shown = 48; ctrl(); draw() };
  $('ctrl').addEventListener('click', e => { const b = e.target.closest('[data-c]'); if (b) { f.cat = b.dataset.c; reset() } });
  $('ctrl').addEventListener('change', e => { const id = e.target.id; if (id === 'ft') f.trade = e.target.value; if (id === 'fc') f.cc = e.target.value; if (id === 'fh') f.hero = e.target.value; if (id === 'fo') f.tone = e.target.value; shown = 48; draw() });
  $('ctrl').addEventListener('input', e => { if (e.target.id === 'q') { f.q = e.target.value; shown = 48; draw() } });
  $('more').addEventListener('click', e => { if (e.target.id === 'mb') { shown += 48; draw() } });
  $('grid').addEventListener('click', e => {
    const o = e.target.closest('[data-c-open]');
    if (o) { e.preventDefault(); e.stopPropagation(); const k = o.dataset.cOpen, el = document.querySelector(`.cm[data-cm="${CSS.escape(k)}"]`); if (open.has(k)) { open.delete(k); el.hidden = true } else { open.add(k); el.innerHTML = box(k); el.hidden = false; el.querySelector('textarea').focus() } o.setAttribute('aria-expanded', open.has(k)); return }
    const b = e.target.closest('[data-like]'); if (!b) return; e.preventDefault(); e.stopPropagation();
    const k = b.dataset.like, on = !likes.includes(k); likes = on ? [...likes, k] : likes.filter(x => x !== k); LS('trades1000-likes', likes);
    if (f.cat === 'Liked') { ctrl(); draw(); return }
    b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); b.classList.remove('pop'); if (on) { void b.offsetWidth; b.classList.add('pop') }
    const c = document.querySelector('[data-c="Liked"] small'); if (c) c.textContent = ALL.filter(x => (!TRADE || x.t === TRADE) && likes.includes(x.key)).length;
  }, true);
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-mood],[data-asp],[data-save],[data-del]'); if (!t) return;
    if (t.dataset.del) { const x = CM.find(c => c.id === t.dataset.del); CM = CM.filter(c => c.id !== t.dataset.del); push(); if (x) rerender(x.page); return }
    const k = t.dataset.f || t.dataset.save, d = draft[k] || (draft[k] = { m: '+', a: [], t: '' });
    if (t.dataset.mood) { d.m = t.dataset.mood; t.parentElement.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === t)); return }
    if (t.dataset.asp) { const a = t.dataset.asp; d.a = d.a.includes(a) ? d.a.filter(x => x !== a) : [...d.a, a]; t.classList.toggle('on'); return }
    if (t.dataset.save) addC(k);
  });
  document.addEventListener('input', e => { const k = e.target.dataset && e.target.dataset.ta; if (!k) return; const d = draft[k] || (draft[k] = { m: '+', a: [], t: '' }); d.t = e.target.value; const s = e.target.closest('.cm').querySelector('[data-save]'); if (s) s.disabled = !d.t.trim() });
  document.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && e.target.dataset && e.target.dataset.ta) addC(e.target.dataset.ta); if (e.key === '/' && !/TEXTAREA|INPUT|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); $('q').focus() } });
  draw(); gen(); pull();
})();
