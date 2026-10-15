/* engine.js — window.T
   25 trades × 40 themes → 1,000 fictional tradesperson websites.
   T.trade(data)             registers a trade (data/<id>.js, see data/SCHEMA.md)
   T.biz(tradeId, n, salt)   pure: generates the business for site n (1–40) — used by the page and by tools/gen.js
   T.site(tradeId, n, salt)  renders the whole page into <body>
*/
(function () {
  const TR = {};
  const ORDER = ['plumber', 'electrician', 'tiler', 'painter', 'joiner', 'roofer', 'bricklayer', 'locksmith', 'heating', 'aircon', 'gardener', 'cleaner', 'removals', 'flooring', 'glazier', 'gutter', 'chimney', 'render', 'mechanic', 'welder', 'carpenter', 'solar', 'appliance', 'handyman', 'bathroom'];
  const PHOTO = { heating: ['heating', 'plumber'], gutter: ['gutter', 'roofer'], appliance: ['appliance', 'handyman'], tiler: ['tiler', 'bathroom'], aircon: ['aircon', 'heating'], chimney: ['chimney', 'roofer'], plumber: ['plumber', 'bathroom'] };

  /* ---------- helpers ---------- */
  const hash = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) } return h >>> 0 };
  function rng(seed) { let a = hash(seed); return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 } }
  const pick = (r, a) => a[Math.floor(r() * a.length)];
  const shuffle = (r, a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1));[a[i], a[j]] = [a[j], a[i]] } return a };
  const sample = (r, a, n) => shuffle(r, a).slice(0, n);
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const slug = s => s.replace(/[’']/g, '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const nice = v => v < 20 ? Math.round(v) : v < 100 ? Math.round(v / 5) * 5 : v < 1000 ? Math.round(v / 10) * 10 : v < 10000 ? Math.round(v / 50) * 50 : Math.round(v / 100) * 100;
  const money = (v, cur) => cur + Math.round(v).toLocaleString('en-GB');

  /* ---------- places & people ---------- */
  const C = {
    UK: { cur: '£', fx: 1, tel: r => '07700 900' + String(100 + Math.floor(r() * 899)), land: r => '0161 496 0' + String(100 + Math.floor(r() * 899)), wa: true, regions: [
      ['Leeds', ['Leeds', 'Horsforth', 'Otley', 'Wetherby', 'Pudsey', 'Garforth', 'Rothwell', 'Morley', 'Guiseley']],
      ['Bristol', ['Bristol', 'Clifton', 'Keynsham', 'Portishead', 'Thornbury', 'Yate', 'Nailsea', 'Bishopston', 'Filton']],
      ['Manchester', ['Stockport', 'Sale', 'Altrincham', 'Didsbury', 'Chorlton', 'Bramhall', 'Cheadle', 'Urmston', 'Prestwich']],
      ['Kent', ['Maidstone', 'Tonbridge', 'Sevenoaks', 'Tunbridge Wells', 'Ashford', 'Canterbury', 'Faversham', 'West Malling']],
      ['Warwickshire', ['Leamington Spa', 'Warwick', 'Kenilworth', 'Coventry', 'Rugby', 'Solihull', 'Stratford-upon-Avon', 'Nuneaton']],
      ['Stirlingshire', ['Stirling', 'Falkirk', 'Dunblane', 'Bridge of Allan', 'Alloa', 'Linlithgow', 'Larbert', 'Grangemouth']],
      ['Devon', ['Exeter', 'Exmouth', 'Topsham', 'Crediton', 'Tiverton', 'Dawlish', 'Newton Abbot', 'Honiton']],
      ['Norfolk', ['Norwich', 'Wymondham', 'Aylsham', 'Dereham', 'Wroxham', 'Diss', 'Loddon', 'Hethersett']],
      ['Sussex', ['Brighton', 'Hove', 'Lewes', 'Worthing', 'Shoreham-by-Sea', 'Haywards Heath', 'Burgess Hill', 'Seaford']],
      ['South Wales', ['Cardiff', 'Penarth', 'Barry', 'Caerphilly', 'Pontypridd', 'Cowbridge', 'Llandaff', 'Radyr']]] },
    IE: { cur: '€', fx: 1.17, tel: r => '087 555 ' + String(1000 + Math.floor(r() * 8999)), land: r => '01 555 ' + String(1000 + Math.floor(r() * 8999)), wa: true, regions: [
      ['Dublin', ['Swords', 'Malahide', 'Lucan', 'Dún Laoghaire', 'Clontarf', 'Rathfarnham', 'Blanchardstown', 'Howth', 'Tallaght']],
      ['Cork', ['Cork', 'Ballincollig', 'Douglas', 'Carrigaline', 'Midleton', 'Cobh', 'Glanmire', 'Blarney']],
      ['Galway', ['Galway', 'Oranmore', 'Salthill', 'Athenry', 'Moycullen', 'Claregalway', 'Tuam', 'Loughrea']]] },
    AU: { cur: 'A$', fx: 1.95, tel: r => '0491 570 ' + String(100 + Math.floor(r() * 899)), land: r => '02 5550 ' + String(1000 + Math.floor(r() * 8999)), wa: false, regions: [
      ['Sydney', ['Parramatta', 'Manly', 'Chatswood', 'Cronulla', 'Penrith', 'Hornsby', 'Castle Hill', 'Bondi']],
      ['Melbourne', ['Geelong', 'Frankston', 'Box Hill', 'Brunswick', 'St Kilda', 'Ringwood', 'Werribee', 'Doncaster']],
      ['Brisbane', ['Brisbane', 'Ipswich', 'Redcliffe', 'Logan', 'Chermside', 'Carindale', 'Indooroopilly', 'Springfield']]] },
    NZ: { cur: 'NZ$', fx: 2.1, tel: r => '021 555 ' + String(1000 + Math.floor(r() * 8999)), land: r => '09 555 ' + String(1000 + Math.floor(r() * 8999)), wa: true, regions: [
      ['Auckland', ['Takapuna', 'Ponsonby', 'Henderson', 'Howick', 'Albany', 'Papakura', 'Devonport', 'Mt Eden']],
      ['Wellington', ['Lower Hutt', 'Upper Hutt', 'Porirua', 'Petone', 'Karori', 'Johnsonville', 'Paraparaumu', 'Eastbourne']],
      ['Christchurch', ['Christchurch', 'Riccarton', 'Rolleston', 'Lyttelton', 'Rangiora', 'Kaiapoi', 'Sumner', 'Halswell']]] },
  };
  // owner portraits that only fit one trade (1-based file numbers)
  const OWNER_AFF = { ownerw: { 2: 'gardener', 11: 'gardener', 12: 'gardener', 14: 'gardener', 19: 'gardener', 20: 'gardener', 21: 'gardener', 10: 'painter', 17: 'cleaner' }, ownerm: { 11: 'gardener', 12: 'painter', 20: 'painter' } };
  const CSEQ = ['UK', 'UK', 'IE', 'UK', 'AU', 'UK', 'NZ', 'UK'];
  const FM = ['James', 'Tom', 'Dan', 'Mark', 'Ryan', 'Sean', 'Liam', 'Ben', 'Chris', 'Matt', 'Gareth', 'Owen', 'Callum', 'Rob', 'Pete', 'Jack', 'Aidan', 'Luke', 'Josh', 'Sam', 'Kieran', 'Rhys', 'Darren', 'Neil', 'Paul', 'Mike', 'Hamish', 'Nathan', 'Kofi', 'Arjun', 'Tomasz', 'Marek', 'Eoin', 'Declan', 'Stuart', 'Alfie'];
  const FW = ['Sarah', 'Emma', 'Kate', 'Laura', 'Rachel', 'Jess', 'Hannah', 'Claire', 'Niamh', 'Siobhan', 'Amy', 'Lucy', 'Megan', 'Zoe', 'Priya', 'Aoife', 'Chloe', 'Gemma', 'Holly', 'Ellie', 'Rosa', 'Ana', 'Tara', 'Leah', 'Fiona', 'Jo'];
  const SUR = { UK: ['Hartley', 'Walsh', 'Bennett', 'Fletcher', 'Turner', 'Morgan', 'Price', 'Hughes', 'Parry', 'Holt', 'Ward', 'Dixon', 'Ashworth', 'Kerr', 'Fraser', 'Barnes', 'Shaw', 'Lowe', 'Pearce', 'Doyle', 'Khan', 'Patel', 'Nowak', 'Osei'], IE: ['Murphy', 'Kelly', 'O’Brien', 'Byrne', 'Ryan', 'Walsh', 'Doyle', 'Kavanagh', 'Brennan', 'Nolan', 'Quinn', 'Moran'], AU: ['Mitchell', 'Clarke', 'Nguyen', 'Taylor', 'Russo', 'Campbell', 'Kelly', 'Papadopoulos', 'Wilson', 'Harris', 'Singh', 'Cooper'], NZ: ['Ngata', 'Wilson', 'Thompson', 'Te Rangi', 'Fraser', 'Patel', 'Stewart', 'Henare', 'Reid', 'Chen', 'Walker', 'Bell'] };
  const RFIRST = ['Sue', 'Graham', 'Helen', 'Andy', 'Moira', 'Raj', 'Linda', 'Dave', 'Karen', 'Ian', 'Becky', 'Tony', 'Jen', 'Phil', 'Nadia', 'Colin', 'Alison', 'Gary', 'Fatima', 'Steve', 'Ruth', 'Bill', 'Sinead', 'Mo', 'Gill', 'Alan', 'Wendy', 'Kev', 'Marta', 'Jon'];

  /* ---------- themes: [name, headFont, bodyFont, headWeight, upper, bg, surf, ink, mu, ln, acc, accInk, acc2, radius, hero, header, services, reviews, deco, dark] ---------- */
  const THEMES = [
    ['Workwear', 'Archivo Black', 'Archivo', 400, 1, '#f4f1ea', '#ffffff', '#1a1a1a', '#5c5a55', '#e2ddd2', '#f2b705', '#1a1a1a', '#1a1a1a', 4, 'split', 'strip', 'cards', 'wall', 'stripe', 0],
    ['Navy & Orange', 'Montserrat', 'Open Sans', 800, 0, '#ffffff', '#f3f6fa', '#0d2340', '#55657a', '#dfe6ee', '#ff6a13', '#ffffff', '#0d2340', 10, 'full', 'float', 'list', 'quote', 'none', 0],
    ['Van Livery', 'Bebas Neue', 'Barlow', 400, 1, '#0f1c2e', '#16263d', '#f1f4f8', '#a8b3c2', '#26374f', '#2ec4ff', '#0f1c2e', '#ffd23f', 6, 'type', 'bar', 'tiles', 'row', 'grid', 1],
    ['Copper', 'Fraunces', 'Work Sans', 600, 0, '#faf6f1', '#ffffff', '#2b211b', '#6d6157', '#ebe1d6', '#b8642e', '#ffffff', '#2f4b3a', 14, 'side', 'center', 'menu', 'quote', 'paper', 0],
    ['Fresh Green', 'Poppins', 'Nunito Sans', 700, 0, '#f5fbf6', '#ffffff', '#163a26', '#557064', '#d8eadd', '#1f9d55', '#ffffff', '#f6c445', 18, 'card', 'bar', 'cards', 'wall', 'dots', 0],
    ['Red Van', 'Oswald', 'Roboto', 600, 1, '#ffffff', '#f5f5f5', '#141414', '#5f5f5f', '#e4e4e4', '#d7262e', '#ffffff', '#141414', 2, 'full', 'strip', 'list', 'row', 'none', 0],
    ['Slate', 'Sora', 'Inter', 600, 0, '#f3f5f7', '#ffffff', '#1d2730', '#5d6a75', '#dde3e8', '#3d5a80', '#ffffff', '#ee6c4d', 12, 'mosaic', 'bar', 'tiles', 'wall', 'none', 0],
    ['Heritage', 'Playfair Display', 'Lato', 700, 0, '#f7f3ea', '#fffdf8', '#23302b', '#66706a', '#e5dece', '#7a2e2e', '#ffffff', '#c9a227', 4, 'split', 'center', 'menu', 'quote', 'paper', 0],
    ['Hi-Vis', 'Anton', 'Work Sans', 400, 1, '#121212', '#1d1d1d', '#f5f5f0', '#a9a9a2', '#2e2e2e', '#d4ff3a', '#121212', '#ff7a00', 4, 'full', 'float', 'cards', 'row', 'stripe', 1],
    ['Sky', 'Plus Jakarta Sans', 'Plus Jakarta Sans', 800, 0, '#f6faff', '#ffffff', '#0f2742', '#56708c', '#dce8f5', '#1877f2', '#ffffff', '#00b894', 16, 'split', 'bar', 'cards', 'quote', 'none', 0],
    ['Chalk', 'Zilla Slab', 'Source Sans 3', 700, 0, '#f2efe8', '#ffffff', '#2a2a2a', '#686560', '#ddd8ce', '#2d6a4f', '#ffffff', '#e76f51', 6, 'side', 'bar', 'list', 'wall', 'grid', 0],
    ['Teal Trade', 'Rubik', 'Rubik', 700, 0, '#ffffff', '#effaf9', '#10302d', '#56706c', '#d5ebe8', '#0f8b80', '#ffffff', '#ff8c42', 10, 'card', 'strip', 'tiles', 'row', 'dots', 0],
    ['Mono Pro', 'Familjen Grotesk', 'IBM Plex Sans', 700, 0, '#fafafa', '#ffffff', '#111111', '#666666', '#e5e5e5', '#111111', '#ffffff', '#ff4d00', 0, 'type', 'bar', 'list', 'quote', 'none', 0],
    ['Sunset', 'Kanit', 'Nunito Sans', 600, 0, '#fff8f2', '#ffffff', '#2e1a12', '#7a6156', '#f0dfd3', '#e85d04', '#ffffff', '#370617', 14, 'mosaic', 'center', 'cards', 'wall', 'none', 0],
    ['Forest', 'Bitter', 'Karla', 700, 0, '#18261e', '#1f3127', '#eef2ec', '#a9b8ad', '#2d4236', '#9bd770', '#18261e', '#f4d35e', 8, 'side', 'bar', 'menu', 'quote', 'none', 1],
    ['Bright Yellow', 'Archivo', 'Archivo', 800, 1, '#fffbea', '#ffffff', '#1b1b1b', '#5f5b4a', '#f0e6bf', '#ffd000', '#1b1b1b', '#1b1b1b', 0, 'type', 'strip', 'tiles', 'row', 'stripe', 0],
    ['Coastal', 'Lexend', 'Lexend', 600, 0, '#f4f9fb', '#ffffff', '#123040', '#5a7380', '#d8e7ee', '#0077b6', '#ffffff', '#f4a261', 20, 'full', 'float', 'cards', 'wall', 'none', 0],
    ['Brick', 'Alfa Slab One', 'Lato', 400, 0, '#f6efe9', '#ffffff', '#2b1d17', '#6d5c53', '#e8d9cd', '#a23e2b', '#ffffff', '#2b1d17', 6, 'split', 'bar', 'list', 'quote', 'paper', 0],
    ['Graphite', 'Outfit', 'Outfit', 700, 0, '#1b1d21', '#24272c', '#f2f3f5', '#a3a8b0', '#33373d', '#ffb000', '#1b1d21', '#4cc9f0', 12, 'card', 'bar', 'cards', 'row', 'grid', 1],
    ['Minimal', 'Instrument Serif', 'Inter', 400, 0, '#ffffff', '#f6f6f4', '#151515', '#666666', '#e8e8e4', '#151515', '#ffffff', '#c65d3b', 2, 'split', 'center', 'menu', 'wall', 'none', 0],
    ['Electric', 'Saira Condensed', 'Saira', 700, 1, '#0b0f1a', '#121829', '#eef2ff', '#9aa4bf', '#1f2840', '#ffe14d', '#0b0f1a', '#7c9cff', 8, 'type', 'strip', 'cards', 'quote', 'grid', 1],
    ['Clay', 'DM Serif Display', 'DM Sans', 400, 0, '#f8f1ea', '#fffaf5', '#33241b', '#7b6a5e', '#ead9c9', '#c2410c', '#ffffff', '#365314', 16, 'mosaic', 'bar', 'tiles', 'quote', 'none', 0],
    ['Toolbox Red', 'Big Shoulders Display', 'Barlow', 800, 1, '#f2f2f2', '#ffffff', '#1a1a1a', '#5c5c5c', '#dcdcdc', '#e63946', '#ffffff', '#1d3557', 4, 'full', 'strip', 'list', 'wall', 'stripe', 0],
    ['Mint', 'Quicksand', 'Nunito', 700, 0, '#f3fbf8', '#ffffff', '#183b35', '#5b7a74', '#d4ece5', '#20a088', '#ffffff', '#ff7f6e', 22, 'card', 'center', 'cards', 'row', 'dots', 0],
    ['Blueprint', 'Chivo', 'Chivo', 800, 0, '#0e3a5f', '#124670', '#eef6ff', '#a9c3de', '#20588a', '#ffffff', '#0e3a5f', '#ffc94d', 4, 'type', 'bar', 'list', 'quote', 'grid', 1],
    ['Oak', 'Libre Baskerville', 'Mulish', 700, 0, '#f5efe6', '#fffaf2', '#2f2419', '#73655a', '#e6dccd', '#8a5a2b', '#ffffff', '#3f6e4b', 8, 'side', 'center', 'menu', 'wall', 'paper', 0],
    ['Signal', 'Red Hat Display', 'Red Hat Text', 800, 0, '#ffffff', '#f5f7fb', '#151b2b', '#5e6678', '#e3e7ef', '#00a86b', '#ffffff', '#ff5a5f', 12, 'split', 'strip', 'cards', 'row', 'none', 0],
    ['Night Shift', 'Teko', 'Hind', 600, 1, '#101114', '#191b20', '#f4f4f4', '#a0a3aa', '#2a2d33', '#ff5400', '#ffffff', '#ffd500', 2, 'full', 'float', 'tiles', 'quote', 'stripe', 1],
    ['Lavender', 'Josefin Sans', 'Lato', 700, 0, '#f8f6fc', '#ffffff', '#2a2340', '#6c6585', '#e6e1f2', '#6d4fc2', '#ffffff', '#f0a500', 14, 'mosaic', 'bar', 'cards', 'wall', 'dots', 0],
    ['Contractor', 'Roboto Slab', 'Roboto', 700, 0, '#eef1f4', '#ffffff', '#1f2a36', '#5c6773', '#d6dce3', '#f77f00', '#ffffff', '#1f2a36', 6, 'card', 'strip', 'list', 'row', 'grid', 0],
    ['Cream & Black', 'Gloock', 'Figtree', 400, 0, '#f6f1e7', '#fffaf0', '#141414', '#5e5a52', '#e3dccd', '#141414', '#f6f1e7', '#d97706', 0, 'type', 'center', 'menu', 'quote', 'paper', 0],
    ['Pool Blue', 'Fredoka', 'Nunito', 600, 0, '#f0f9ff', '#ffffff', '#0b3550', '#557a92', '#d3e9f7', '#0284c7', '#ffffff', '#f97316', 24, 'split', 'bar', 'cards', 'row', 'dots', 0],
    ['Moss', 'Young Serif', 'Manrope', 400, 0, '#f2f4ec', '#ffffff', '#26301f', '#636d58', '#dde3d0', '#4d6b2f', '#ffffff', '#c08a2e', 10, 'side', 'bar', 'tiles', 'wall', 'none', 0],
    ['Steel', 'Barlow Condensed', 'Barlow', 700, 1, '#e9ecef', '#ffffff', '#212529', '#5c636a', '#d3d8dd', '#343a40', '#ffffff', '#f59f00', 2, 'mosaic', 'strip', 'list', 'quote', 'stripe', 0],
    ['Berry', 'Unbounded', 'Manrope', 700, 0, '#fff5f8', '#ffffff', '#2a1020', '#7a5a68', '#f3dbe4', '#d1105a', '#ffffff', '#2a1020', 18, 'card', 'bar', 'cards', 'wall', 'none', 0],
    ['Ink', 'Merriweather', 'Open Sans', 900, 0, '#101826', '#172235', '#eef1f6', '#a3adbf', '#26324a', '#5eead4', '#101826', '#fbbf24', 8, 'split', 'center', 'menu', 'row', 'none', 1],
    ['Sand', 'Raleway', 'Raleway', 800, 0, '#fbf7ef', '#ffffff', '#2a2622', '#6f675d', '#ece3d2', '#b8742a', '#ffffff', '#2f5d62', 12, 'full', 'float', 'cards', 'quote', 'none', 0],
    ['Crimson', 'Crimson Pro', 'Work Sans', 700, 0, '#ffffff', '#faf7f5', '#1e1b1a', '#69625e', '#ece5e0', '#9b1d20', '#ffffff', '#1e1b1a', 4, 'mosaic', 'center', 'list', 'wall', 'paper', 0],
    ['Utility', 'Bricolage Grotesque', 'Figtree', 800, 0, '#f4f4f0', '#ffffff', '#151515', '#5d5d58', '#deded6', '#2b59c3', '#ffffff', '#ffcc00', 10, 'type', 'strip', 'tiles', 'row', 'grid', 0],
    ['Gold', 'Cormorant Garamond', 'Montserrat', 600, 0, '#14120f', '#1c1915', '#f3ede1', '#b0a690', '#2e2a23', '#c9a35a', '#14120f', '#e7dcc5', 2, 'side', 'center', 'menu', 'quote', 'none', 1],
  ].map(a => ({ name: a[0], hf: a[1], bf: a[2], hw: a[3], up: a[4], bg: a[5], surf: a[6], ink: a[7], mu: a[8], ln: a[9], acc: a[10], accInk: a[11], acc2: a[12], r: a[13], hero: a[14], head: a[15], svc: a[16], rev: a[17], deco: a[18], dark: a[19] }));

  /* ---------- icons (24×24 stroke) ---------- */
  const IC = {
    wrench: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    tiles: '<path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z"/>',
    roller: '<path d="M4 3h13v5H4zM17 5h3v6h-8v4M10 15h4v6h-4z"/>',
    saw: '<path d="M3 17 15 5l4 4L7 21H3zM15 5l2-2 4 4-2 2M7 13l2 2M10 10l2 2"/>',
    roof: '<path d="M2 12 12 3l10 9M5 10v10h14V10M10 20v-6h4v6"/>',
    brick: '<path d="M2 5h20v14H2zM2 12h20M8 5v7M16 5v7M12 12v7"/>',
    key: '<circle cx="15" cy="9" r="5"/><path d="M11.5 12.5 3 21M6 18l2 2M8 16l2 2"/>',
    flame: '<path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-3 2-4 2-7 2 1 3 3 3 5 1-2 0-6 0-9z"/>',
    snow: '<path d="M12 2v20M3.3 7l17.4 10M20.7 7 3.3 17M9 4l3 2 3-2M9 20l3-2 3 2"/>',
    leaf: '<path d="M5 19C5 9 11 4 20 4c0 9-5 15-15 15zM5 19l8-8"/>',
    sparkle: '<path d="M11 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2zM19 15l1 3 3 1-3 1-1 3-1-3-3-1 3-1z"/>',
    box: '<path d="M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10"/>',
    floor: '<path d="M3 9h18M3 13h18M3 17h18M3 21h18M8 9v4M15 13v4M6 17v4M18 17v4M12 9v4"/>',
    pane: '<path d="M4 3h16v18H4zM12 3v18M4 12h16"/>',
    gutter: '<path d="M2 6h20v3a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3zM17 12v9M15 21h4"/>',
    chimney: '<path d="M3 21V11l9-7 9 7v10M14 6.5V3h4v6.5M9 21v-5h6v5"/>',
    trowel: '<path d="M3 21l6-6M9 15l3 3 9-9-6-6-9 9z"/>',
    car: '<path d="M3 13l2-6h14l2 6v5H3zM3 13h18"/><circle cx="7.5" cy="16" r="1.4"/><circle cx="16.5" cy="16" r="1.4"/>',
    spark: '<path d="M3 21l7-7M10 14l2 2M14 2v4M20 6l-3 3M22 12h-4M19 19l-3-3M8 6l3 3"/>',
    hammer: '<path d="M13 3l8 8-3 3-8-8zM12 8 3 17l3 3 9-9"/>',
    sun: '<circle cx="12" cy="12" r="4.5"/><path d="M12 1v3M12 20v3M1 12h3M20 12h3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
    washer: '<path d="M4 2h16v20H4zM4 7h16M7 4.5h1M10 4.5h1"/><circle cx="12" cy="14" r="4.5"/>',
    toolbox: '<path d="M3 9h18v11H3zM8 9V5h8v4M3 14h18M10 14v2h4v-2"/>',
    bath: '<path d="M3 12h18v3a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5zM5 12V5a2 2 0 0 1 4 0M6 20l-1 2M18 20l1 2"/>',
    phone: '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
    chat: '<path d="M4 4h16v12H9l-5 4z"/>',
    calc: '<path d="M5 2h14v20H5zM8 6h8M8 11h2M12 11h2M16 11v6M8 15h2M12 15h2M8 19h6"/>',
    check: '<path d="M4 12l5 5L20 6"/>',
    star: '<path d="M12 2l3 7 7 .6-5.3 4.7L18.3 22 12 18l-6.3 4 1.6-7.7L2 9.6 9 9z"/>',
    pin: '<path d="M12 22s7-7 7-12a7 7 0 0 0-14 0c0 5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    shield: '<path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    alert: '<path d="M12 3 2 21h20zM12 10v5M12 18v.5"/>',
  };
  const icon = (k, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[k] || IC.toolbox}</svg>`;
  const stars = (v) => `<span class="stars" aria-label="${v} out of 5">${[1, 2, 3, 4, 5].map(i => `<svg viewBox="0 0 24 24" class="${i <= Math.round(v) ? 'on' : ''}"><path d="M12 2l3 7 7 .6-5.3 4.7L18.3 22 12 18l-6.3 4 1.6-7.7L2 9.6 9 9z"/></svg>`).join('')}</span>`;

  /* ---------- business generator (pure) ---------- */
  function biz(id, n, salt = 0) {
    const D = TR[id]; if (!D) throw new Error('unknown trade ' + id);
    const ti = ORDER.indexOf(id), r = rng(id + ':' + n + ':' + salt);
    const theme = (n - 1 + ti * 7) % 40;
    const cc = CSEQ[(n + ti) % CSEQ.length], K = C[cc];
    const reg = K.regions[(n * 3 + ti) % K.regions.length], towns = reg[1];
    const town = towns[Math.floor(r() * towns.length)];
    const area = [town, ...shuffle(r, towns.filter(t => t !== town))];
    const female = r() < .34;
    const first = pick(r, female ? FW : FM), sur = pick(r, SUR[cc]);
    const pre = D.nameParts.pre, post = D.nameParts.post;
    const pv = r();
    let name;
    if (pv < .58) name = pre[(n * 11 + salt * 5 + ti) % pre.length] + ' ' + pick(r, post);
    else if (pv < .74) name = sur + ' ' + pick(r, post);
    else if (pv < .84 && !female) name = sur + ' & Sons ' + pick(r, post);
    else if (pv < .92) name = town.replace(/-.*/, '') + ' ' + pick(r, post);
    else name = first + '’s ' + pick(r, post);
    const years = 4 + Math.floor(r() * 30), pf = .88 + r() * .34;
    const rating = (4.6 + r() * .4).toFixed(1), nrev = 30 + Math.floor(r() * 520);
    const s = slug(name);
    const fill = t => String(t).replace(/\{town\}/g, town).replace(/\{name\}/g, name).replace(/\{owner\}/g, first).replace(/\{years\}/g, years);
    const ph = female ? 'ownerw' : 'ownerm', aff = OWNER_AFF[ph], cnt = window.P ? P.list(ph).length : (female ? 26 : 29);
    const okIdx = [...Array(cnt).keys()].filter(i => !aff[i + 1] || aff[i + 1] === id);
    const owner = { first, sur, female, photo: ph, pi: okIdx[Math.floor(r() * okIdx.length)] };
    const start = pick(r, ['7:00', '7:30', '8:00']), end = pick(r, ['17:00', '17:30', '18:00']);
    const sat = pick(r, ['8:00–13:00', '9:00–14:00', null, '8:00–12:00']);
    const pick2 = (a, k) => sample(r, a, Math.min(k, a.length));
    const order = [['services', 'calc', 'about', 'gallery', 'process', 'reviews', 'area', 'tips', 'faq', 'contact'], ['services', 'about', 'gallery', 'calc', 'reviews', 'process', 'area', 'faq', 'tips', 'contact'], ['calc', 'services', 'reviews', 'about', 'process', 'gallery', 'tips', 'area', 'faq', 'contact']][(n + ti) % 3];
    const tags = PHOTO[id] || [id];
    return {
      id, n, salt, theme, cc, cur: K.cur, fx: K.fx * pf, region: reg[0], town, area, owner, name, slug: s, years, rating, nrev,
      file: String(n).padStart(2, '0') + '-' + s + '.html',
      tel: K.tel(r), land: K.land(r), wa: K.wa, email: 'hello@' + s.replace(/-/g, '') + '.example', web: s.replace(/-/g, '') + '.example',
      hours: { start, end, sat, emergency: D.emergency ? (D.hours && D.hours.emergency) || '24/7' : null },
      headline: fill(pick(r, D.headlines)), intro: fill(pick(r, D.intros)), about: pick2(D.about, 2).map(fill),
      services: pick2(D.services, 6 + Math.floor(r() * 4)).map(x => ({ ...x, n: fill(x.n), d: fill(x.d), price: nice(x.from * K.fx * pf) })),
      usps: pick2(D.usps, 4).map(p => p.map(fill)), process: D.process.slice(0, 5).map(p => p.map(fill)),
      faq: pick2(D.faq, 6).map(p => p.map(fill)), tips: pick2(D.tips, 4).map(p => p.map(fill)), certs: pick2(D.certs, 4).map(fill),
      reviews: pick2(D.reviews, 6).map((x, i) => ({ ...x, t: fill(x.t), who: pick(r, RFIRST) + ' ' + String.fromCharCode(65 + Math.floor(r() * 26)) + '.', where: area[1 + Math.floor(r() * (area.length - 1))], ago: ['2 weeks ago', '3 weeks ago', '1 month ago', '5 weeks ago', '2 months ago', '3 months ago', '4 months ago', '6 months ago'][Math.min(7, i + Math.floor(r() * 2))] })),
      gallery: pick2(D.gallery, 8).map((g, i) => ({ cap: fill(g[0]), tag: g[1], img: [tags[i % tags.length], Math.floor(r() * 14) + i] })),
      heroImg: [tags[0], Math.floor(r() * 14)], heroImg2: [tags[tags.length - 1], Math.floor(r() * 14) + 3], heroImg3: [tags[0], Math.floor(r() * 14) + 6],
      order, emergencyList: D.urgent.map(fill), jobs: D.jobs.map(fill),
      fill, title: `${name} — ${D.name} in ${town}`,
      desc: fill(pick(r, D.intros)).slice(0, 155),
    };
  }

  /* ---------- CSS ---------- */
  const CSS = `
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--ink);font:400 16.5px/1.6 var(--bf);-webkit-font-smoothing:antialiased}
img{max-width:100%;display:block}a{color:inherit}button,input,select,textarea{font:inherit;color:inherit}
.ic{width:20px;height:20px;flex:none}
.w{max-width:1200px;margin:0 auto;padding-inline:28px}
h1,h2,h3,.hf{font-family:var(--hf);font-weight:var(--hw);text-transform:var(--tt);letter-spacing:var(--hls);line-height:1.08;margin:0;text-wrap:balance}
h2{font-size:clamp(30px,3.6vw,46px)}h3{font-size:20px;line-height:1.2}
p{margin:0}
.kick{display:inline-flex;align-items:center;gap:8px;font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--acc-t)}
.lead{color:var(--mu);font-size:18px;max-width:60ch}
.sh{display:flex;flex-direction:column;gap:12px;margin-bottom:34px}
section.s{padding-block:80px}section.s.alt{background:var(--surf)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:9px;border:2px solid var(--acc);background:var(--acc);color:var(--acc-ink);font-weight:700;font-size:15.5px;padding:13px 22px;border-radius:var(--rb);text-decoration:none;cursor:pointer;transition:transform .15s,filter .15s;white-space:nowrap}
.btn:hover{transform:translateY(-1px);filter:brightness(1.05)}
.btn.o{background:transparent;color:var(--ink);border-color:var(--ink)}
.btn.sm{padding:9px 15px;font-size:14px}
.card{background:var(--surf);border:1px solid var(--ln);border-radius:var(--r)}
.alt .card{background:var(--bg)}
/* header */
.strip{background:var(--ink);color:var(--bg);font-size:13.5px}.strip .w{display:flex;gap:22px;align-items:center;justify-content:space-between;min-height:38px;flex-wrap:wrap}
.strip span{display:inline-flex;align-items:center;gap:7px}.strip .ic{width:15px;height:15px}.strip b{color:var(--acc2-on-ink)}
.hd{position:sticky;top:0;z-index:30;background:var(--bg);border-bottom:1px solid var(--ln)}
.hd .w{display:flex;align-items:center;gap:26px;min-height:74px}
.logo{display:flex;align-items:center;gap:11px;text-decoration:none;min-width:0}
.logo .mk{width:42px;height:42px;display:grid;place-items:center;background:var(--acc);color:var(--acc-ink);border-radius:var(--rl);flex:none}
.logo .mk .ic{width:24px;height:24px}
.logo b{font-family:var(--hf);font-weight:var(--hw);text-transform:var(--tt);font-size:19px;line-height:1.05;display:block}
.logo small{display:block;color:var(--mu);font-size:12.5px;line-height:1.2;margin-top:2px}
.nav{display:flex;gap:22px;font-size:15px;font-weight:600;margin-left:auto}.nav a{text-decoration:none;opacity:.85}.nav a:hover{opacity:1;color:var(--acc-t)}
.hd .call{display:flex;align-items:center;gap:10px;text-decoration:none;font-weight:700}
.hd .call i{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;background:var(--acc);color:var(--acc-ink);flex:none}
.hd .call small{display:block;font-weight:500;color:var(--mu);font-size:12px;line-height:1.1}
.hd.center .w{flex-direction:column;gap:10px;padding-block:14px}.hd.center .nav{margin:0}.hd.center .row{display:flex;align-items:center;gap:24px;width:100%;justify-content:space-between}
.hd.float{position:absolute;left:0;right:0;background:transparent;border:0;color:#fff}.hd.float .logo small{color:rgba(255,255,255,.75)}.hd.float .call small{color:rgba(255,255,255,.75)}
.deco-stripe .hd::after{content:"";position:absolute;left:0;right:0;bottom:-7px;height:7px;background:repeating-linear-gradient(-45deg,var(--acc) 0 12px,var(--ink) 12px 24px)}
.deco-grid{background-image:linear-gradient(var(--ln) 1px,transparent 1px),linear-gradient(90deg,var(--ln) 1px,transparent 1px);background-size:44px 44px}
.deco-dots{background-image:radial-gradient(var(--ln) 1.4px,transparent 1.4px);background-size:22px 22px}
.deco-paper section.s.alt{background-image:repeating-linear-gradient(0deg,transparent 0 31px,var(--ln) 31px 32px)}
/* hero */
.hero{position:relative;padding-block:64px 70px}
.hero h1{font-size:clamp(40px,5.6vw,74px);line-height:1.02}.hero h1,h2{overflow-wrap:break-word;hyphens:auto}.hero{overflow-x:clip}
.hero .in{display:flex;flex-direction:column;gap:20px}
.hero .in>p{font-size:18.5px;color:var(--mu);max-width:54ch}
.cta{display:flex;gap:12px;flex-wrap:wrap}
.trust{display:flex;gap:22px;flex-wrap:wrap;align-items:center;font-size:14px;color:var(--mu)}.trust span{display:inline-flex;align-items:center;gap:7px}.trust b{color:var(--ink)}
.stars{display:inline-flex;gap:2px}.stars svg{width:16px;height:16px;fill:var(--ln)}.stars svg.on{fill:#f5b301}
.open{display:inline-flex;align-items:center;gap:8px;font-size:14px;font-weight:600;padding:6px 12px;border-radius:999px;background:var(--surf);border:1px solid var(--ln);width:max-content;max-width:100%}
.open i{width:9px;height:9px;border-radius:50%;background:#9aa0a6;flex:none}.open.on i{background:#22c55e;box-shadow:0 0 0 4px rgba(34,197,94,.18)}
.ph{border-radius:var(--r);overflow:hidden;background:var(--ln)}.ph img{width:100%;height:100%;object-fit:cover}
.hero.split .w{display:grid;grid-template-columns:1.05fr .95fr;gap:52px;align-items:center}.hero.split .ph{aspect-ratio:4/4.4}
.hero.side .w{display:grid;grid-template-columns:.9fr 1.1fr;gap:52px;align-items:center}.hero.side .ph{aspect-ratio:4/5;position:relative}
.hero .badge{position:absolute;left:16px;bottom:16px;right:16px;background:var(--surf);color:var(--ink);border-radius:var(--r);padding:12px 14px;display:flex;gap:12px;align-items:center;box-shadow:0 10px 30px rgba(0,0,0,.18)}
.hero .badge img{width:48px;height:48px;border-radius:50%;object-fit:cover;object-position:top}.hero .badge b{display:block}.hero .badge small{color:var(--mu);font-size:13px}
.hero.full,.hero.card{min-height:620px;display:flex;align-items:center;color:#fff;padding-block:140px 80px;overflow:hidden}
.hero.full>img,.hero.card>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.hero.full::before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.78),rgba(0,0,0,.35));z-index:1}
.hero.full .w{position:relative;z-index:2;width:100%}.hero.full .in{max-width:680px}.hero.full .in>p,.hero.full .trust{color:rgba(255,255,255,.85)}.hero.full .trust b{color:#fff}.hero.full .btn.o{color:#fff;border-color:#fff}.hero.full .open{background:rgba(0,0,0,.35);border-color:rgba(255,255,255,.25);color:#fff}
.hero.card{padding-block:90px;color:var(--ink)}.hero.card .w{position:relative;z-index:2;width:100%}.hero.card .in{background:var(--bg);border-radius:var(--r);padding:38px;max-width:620px;box-shadow:0 24px 60px rgba(0,0,0,.25)}
.hero.type{padding-block:80px 40px}.hero.type h1{font-size:clamp(46px,8vw,118px);max-width:14ch}.hero.type .in{gap:24px}
.hero.type .row3{display:grid;grid-template-columns:2fr 1fr 1fr;gap:14px;margin-top:44px}.hero.type .row3 .ph{aspect-ratio:16/10}.hero.type .row3 .ph:not(:first-child){aspect-ratio:auto}
.hero.mosaic .w{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center}.hero.mosaic .mos{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:200px 200px;gap:12px}.hero.mosaic .mos .ph:first-child{grid-row:span 2}
/* certs */
.certs{border-block:1px solid var(--ln);background:var(--surf)}.certs .w{display:flex;gap:14px 34px;flex-wrap:wrap;justify-content:space-between;padding-block:18px;font-weight:600;font-size:14.5px}
.certs span{display:inline-flex;gap:9px;align-items:center}.certs .ic{color:var(--acc-t)}
/* services */
.svc{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.svc .card{padding:24px;display:flex;flex-direction:column;gap:10px}
.svc .si{width:46px;height:46px;border-radius:var(--rl);display:grid;place-items:center;background:var(--soft);color:var(--acc-t)}
.svc .pr{margin-top:auto;padding-top:12px;display:flex;justify-content:space-between;align-items:center;border-top:1px dashed var(--ln);font-size:14px;color:var(--mu)}.svc .pr b{font-size:19px;color:var(--ink);font-family:var(--hf)}
.svc p{color:var(--mu);font-size:15px}
.svc .lk{border:0;background:none;padding:0;color:var(--acc-t);font-weight:700;cursor:pointer;font-size:14px}
.svc.list{grid-template-columns:1fr 1fr;gap:0 40px}.svc.list .card{background:none;border:0;border-bottom:1px solid var(--ln);border-radius:0;padding:20px 0;display:grid;grid-template-columns:1fr auto;gap:4px 18px}
.svc.list .si{display:none}.svc.list .pr{grid-row:span 2;border:0;margin:0;padding:0;flex-direction:column;align-items:flex-end;justify-content:center;text-align:right}.svc.list .lk{display:none}
.svc.tiles .card{padding:0;overflow:hidden}.svc.tiles .ph{aspect-ratio:16/10;border-radius:0}.svc.tiles .bd{padding:20px 22px 22px;display:flex;flex-direction:column;gap:8px;flex:1}.svc.tiles .si{display:none}
.svc.menu{grid-template-columns:1fr 1fr;gap:6px 56px}.svc.menu .card{background:none;border:0;padding:14px 0;gap:4px}.svc.menu .si,.svc.menu .lk{display:none}
.svc.menu .ttl{display:flex;align-items:baseline;gap:10px}.svc.menu .ttl h3{flex:none;max-width:70%}.svc.menu .ttl i{flex:1;border-bottom:2px dotted var(--ln);transform:translateY(-5px)}.svc.menu .ttl b{font-family:var(--hf);font-size:19px;white-space:nowrap}.svc.menu .pr{display:none}
.svc .u{font-size:12.5px;color:var(--mu)}
/* calculator */
.calc{display:grid;grid-template-columns:1.15fr .85fr;gap:26px;align-items:start}
.calc .f{padding:26px;display:flex;flex-direction:column;gap:18px}
.fl{display:flex;flex-direction:column;gap:7px;font-size:14.5px;font-weight:600}
.fl .rw{display:flex;gap:12px;align-items:center}.fl input[type=range]{flex:1;accent-color:var(--acc);min-width:0}
.fl output{min-width:84px;text-align:right;font-family:var(--hf);font-size:18px}
.fl select,.in-t,textarea{width:100%;background:var(--bg);border:1.5px solid var(--ln);border-radius:var(--rs);padding:11px 12px;font-size:15.5px;font-weight:400}
.fl select:focus,.in-t:focus,textarea:focus{outline:2px solid var(--acc);outline-offset:-1px}
.seg{display:flex;flex-wrap:wrap;gap:8px}.seg button{border:1.5px solid var(--ln);background:var(--bg);border-radius:var(--rb);padding:8px 13px;font-size:14px;cursor:pointer;font-weight:600}.seg button.on{background:var(--ink);color:var(--bg);border-color:var(--ink)}
.chk{display:flex;gap:10px;align-items:center;font-weight:500;font-size:15px;cursor:pointer}.chk input{width:19px;height:19px;accent-color:var(--acc);flex:none}
.card.res,.alt .card.res{padding:26px;position:sticky;top:96px;display:flex;flex-direction:column;gap:14px;background:var(--ink);color:var(--bg);border-color:var(--ink)}
.res small{opacity:.7}.res .big{font-family:var(--hf);font-size:clamp(34px,4vw,48px);line-height:1}
.res ul{list-style:none;margin:0;padding:0;font-size:14px;display:flex;flex-direction:column;gap:6px}.res li{display:flex;justify-content:space-between;gap:10px;border-bottom:1px solid rgba(127,127,127,.25);padding-bottom:6px}
.res .nt{font-size:12.5px;opacity:.75}.res .btn{background:var(--acc);border-color:var(--acc);color:var(--acc-ink)}
/* about */
.about{display:grid;grid-template-columns:.85fr 1.15fr;gap:56px;align-items:center}
.about .ph{aspect-ratio:4/5;position:relative}.about .ph img{object-position:top}
.about .sig{font-family:var(--hf);font-size:24px}
.about .tx{display:flex;flex-direction:column;gap:16px}.about .tx>p{color:var(--mu)}
.usp{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:8px}.usp div{display:flex;gap:12px}.usp .ic{color:var(--acc-t);margin-top:3px}.usp b{display:block}.usp p{font-size:14.5px;color:var(--mu)}
.nums{display:flex;gap:30px;flex-wrap:wrap;padding-top:6px}.nums b{display:block;font-family:var(--hf);font-size:34px;line-height:1}.nums span{font-size:13.5px;color:var(--mu)}
/* gallery */
.gf{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px}
.gal{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.gal figure{margin:0;position:relative;aspect-ratio:1;border-radius:var(--r);overflow:hidden;cursor:zoom-in;background:var(--ln)}
.gal figure:nth-child(1){grid-column:span 2;grid-row:span 2;aspect-ratio:auto}
.gal img{width:100%;height:100%;object-fit:cover;transition:transform .4s}.gal figure:hover img{transform:scale(1.05)}
.gal figcaption{position:absolute;left:0;right:0;bottom:0;padding:22px 12px 10px;background:linear-gradient(transparent,rgba(0,0,0,.7));color:#fff;font-size:13.5px;font-weight:600}
.lb{position:fixed;inset:0;background:rgba(0,0,0,.9);z-index:100;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;padding:20px}
.lb img{max-height:78vh;max-width:min(1100px,92vw);border-radius:6px}.lb p{color:#fff}.lb button{position:absolute;background:rgba(255,255,255,.12);border:0;color:#fff;width:46px;height:46px;border-radius:50%;cursor:pointer;font-size:22px}
.lb .x{top:16px;right:16px}.lb .pv{left:16px;top:50%}.lb .nx{right:16px;top:50%}
/* process */
.proc{display:grid;grid-template-columns:repeat(5,1fr);gap:18px;counter-reset:p}
.proc div{position:relative;padding-top:56px}.proc div::before{counter-increment:p;content:counter(p);position:absolute;top:0;left:0;width:42px;height:42px;border-radius:50%;background:var(--acc);color:var(--acc-ink);display:grid;place-items:center;font-family:var(--hf);font-weight:700;font-size:18px}
.proc div::after{content:"";position:absolute;top:21px;left:50px;right:-12px;border-top:2px dashed var(--ln)}.proc div:last-child::after{display:none}
.proc p{color:var(--mu);font-size:14.5px;margin-top:6px}
/* reviews */
.rsum{display:flex;gap:26px;align-items:center;flex-wrap:wrap;margin-bottom:26px}.rsum .big{font-family:var(--hf);font-size:58px;line-height:1}
.bars{display:flex;flex-direction:column;gap:4px;font-size:12.5px;color:var(--mu);min-width:220px}.bars div{display:grid;grid-template-columns:14px 1fr 34px;gap:8px;align-items:center}.bars i{height:7px;border-radius:9px;background:var(--ln);overflow:hidden}.bars i b{display:block;height:100%;background:#f5b301}
.rv{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.rv .card{padding:22px;display:flex;flex-direction:column;gap:12px}
.rv .q{font-size:15.5px}.rv .by{display:flex;justify-content:space-between;gap:8px;font-size:13.5px;color:var(--mu);margin-top:auto;flex-wrap:wrap}.rv .by b{color:var(--ink)}
.rv .tg{font-size:12px;font-weight:700;color:var(--acc-t);text-transform:uppercase;letter-spacing:.06em}
.rv.row{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:10px}.rv.row .card{min-width:340px;scroll-snap-align:start}
.rv.quote{grid-template-columns:1.3fr 1fr 1fr}.rv.quote .card:first-child{grid-row:span 2;background:var(--acc);color:var(--acc-ink);border-color:var(--acc)}.rv.quote .card:first-child .q{font-family:var(--hf);font-size:clamp(22px,2.2vw,30px);line-height:1.25}
.rv.quote .card:first-child .by,.rv.quote .card:first-child .by b,.rv.quote .card:first-child .tg{color:inherit}.rv.quote .card:nth-child(n+6){display:none}
/* area */
.area{display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:start}
.chk-area{display:flex;gap:8px}.chk-area .in-t{flex:1}
.ans{margin-top:12px;padding:14px 16px;border-radius:var(--rs);font-size:15px;display:none}.ans.ok{display:block;background:rgba(34,197,94,.13);border:1px solid rgba(34,197,94,.4)}.ans.no{display:block;background:rgba(245,158,11,.12);border:1px solid rgba(245,158,11,.4)}
.towns{display:flex;gap:8px;flex-wrap:wrap;margin-top:18px}.towns button{border:1px solid var(--ln);background:var(--surf);border-radius:999px;padding:6px 13px;font-size:14px;cursor:pointer}
.map{aspect-ratio:4/3;border-radius:var(--r);background:var(--surf);border:1px solid var(--ln);position:relative;overflow:hidden}
.map svg{width:100%;height:100%}
/* tips & faq */
.tips{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}.tips .card{padding:22px;display:flex;flex-direction:column;gap:8px}.tips .card p{font-size:14.5px;color:var(--mu)}.tips .n{font-family:var(--hf);font-size:28px;color:var(--acc-t)}
.faq{max-width:860px}.faq details{border-bottom:1px solid var(--ln);padding:18px 0}.faq summary{cursor:pointer;font-weight:700;font-size:17.5px;list-style:none;display:flex;justify-content:space-between;gap:16px}.faq summary::-webkit-details-marker{display:none}
.faq summary::after{content:"+";font-size:24px;line-height:1;color:var(--acc-t);transition:transform .2s}.faq details[open] summary::after{transform:rotate(45deg)}.faq details p{color:var(--mu);margin-top:10px;max-width:70ch}
/* emergency */
.emg{background:var(--acc2);color:var(--acc2-ink)}.emg .w{display:flex;gap:22px;align-items:center;justify-content:space-between;padding-block:22px;flex-wrap:wrap}
.emg b{font-family:var(--hf);font-size:22px;text-transform:var(--tt)}.emg ul{display:flex;gap:6px 16px;flex-wrap:wrap;list-style:none;margin:6px 0 0;padding:0;font-size:14px;opacity:.9}
.emg .btn{background:var(--acc2-ink);color:var(--acc2);border-color:var(--acc2-ink)}
/* contact */
.ct{display:grid;grid-template-columns:1.25fr .75fr;gap:26px;align-items:start}
.ct form{padding:28px;display:flex;flex-direction:column;gap:16px}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.days{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px}.days button{flex:none;border:1.5px solid var(--ln);background:var(--bg);border-radius:var(--rs);padding:8px 10px;text-align:center;cursor:pointer;min-width:64px;font-size:13px;line-height:1.25}.days button b{display:block;font-size:17px;font-family:var(--hf)}.days button.on{background:var(--ink);color:var(--bg);border-color:var(--ink)}
.files{display:flex;gap:8px;flex-wrap:wrap}.files img{width:64px;height:64px;object-fit:cover;border-radius:8px}
.drop{border:1.5px dashed var(--ln);border-radius:var(--rs);padding:14px;font-size:14px;color:var(--mu);display:flex;gap:10px;align-items:center;cursor:pointer}
.side{display:flex;flex-direction:column;gap:14px}.side .card{padding:22px}.side .card h3{margin-bottom:10px;font-size:18px}
.hrs{list-style:none;margin:0;padding:0;font-size:14.5px}.hrs li{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--ln)}.hrs li.td{font-weight:700}
.cl{display:flex;flex-direction:column;gap:10px;font-size:15px}.cl a{display:flex;gap:10px;align-items:center;text-decoration:none}.cl .ic{color:var(--acc-t)}
.done{padding:30px;display:flex;flex-direction:column;gap:12px}.done .ref{font-family:var(--hf);font-size:30px;color:var(--acc-t)}
.err{color:#dc2626;font-size:13px;font-weight:600}
/* footer */
footer{background:var(--ink);color:var(--bg);padding-block:46px 90px;font-size:14.5px}footer .w{display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:30px}
footer a{text-decoration:none;opacity:.85}footer h3{font-size:16px;margin-bottom:12px}footer ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}
footer .fine{grid-column:1/-1;border-top:1px solid rgba(127,127,127,.3);padding-top:18px;opacity:.65;font-size:13px;display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}
.calc>*,.ct>*,.area>*,.about>*,.hero .w>*,.svc>*,.rv>*,footer .w>*{min-width:0}
input,select,textarea{min-width:0;max-width:100%}.g2>*,.fl>*,.chk-area>*,.sh>*,.tips>*,.proc>*{min-width:0}footer,.cl,.side{overflow-wrap:anywhere}section.s{overflow-x:clip}
.mbar{display:none}
.bk{position:fixed;left:12px;bottom:12px;z-index:60;font:600 12px/1 system-ui,sans-serif;padding:9px 12px;border-radius:999px;background:rgba(20,20,20,.82);color:#fff;text-decoration:none}
html.embed .bk{display:none}
@media(max-width:1040px){.nav{display:none}.hero.split .w,.hero.side .w,.hero.mosaic .w,.about,.calc,.ct,.area{grid-template-columns:1fr}.hero.side .ph{order:-1}.svc{grid-template-columns:1fr 1fr}.proc{grid-template-columns:1fr 1fr 1fr}.tips{grid-template-columns:1fr 1fr}.rv,.rv.quote{grid-template-columns:1fr 1fr}.rv.quote .card:first-child{grid-row:auto;grid-column:span 2}.res{position:static}.hero.split .ph,.hero.side .ph{aspect-ratio:16/10}.about .ph{aspect-ratio:16/12}}
@media(max-width:680px){.w{padding-inline:16px}section.s{padding-block:56px}.svc,.svc.list,.svc.menu,.rv,.rv.quote,.tips,.usp,.g2{grid-template-columns:1fr}.rv.quote .card:first-child{grid-column:auto}.proc{grid-template-columns:1fr}.proc div::after{display:none}
 .gal{grid-template-columns:1fr 1fr}.hd .call small,.hd .call span{display:none}.hd .w{min-height:64px;gap:12px}.logo b{font-size:16.5px}.logo small{display:none}.hd.center .w{padding-block:10px}
 .hero{padding-block:40px 48px}.hero h1{font-size:clamp(34px,10vw,46px)}.hero.type h1{font-size:clamp(36px,11vw,52px)}.hero.full,.hero.card{min-height:0;padding-block:110px 56px}.hero.card{padding-block:40px}.hero.card .in{padding:24px}.hero.type .row3{grid-template-columns:1fr 1fr}.hero.type .row3 .ph:first-child{grid-column:span 2}.hero.mosaic .mos{grid-template-rows:130px 130px}
 .strip .w{justify-content:center;gap:4px 14px;padding-block:6px}.strip .hide-m{display:none}.rv.row .card{min-width:280px}
 .mbar{display:grid;grid-template-columns:repeat(var(--mb),1fr);position:fixed;left:0;right:0;bottom:0;z-index:50;background:var(--ink);padding-bottom:env(safe-area-inset-bottom,0px)}
 .mbar a{display:flex;flex-direction:column;align-items:center;gap:2px;padding:9px 4px;color:var(--bg);text-decoration:none;font-size:12px;font-weight:700}.mbar a.p{background:var(--acc);color:var(--acc-ink)}
 .bk{bottom:72px}footer{padding-bottom:110px}footer .w{grid-template-columns:1fr}.calc .f,.res,.ct form{padding:20px}}
`;

  /* ---------- render ---------- */
  function site(id, n, salt = 0) {
    const B = biz(id, n, salt), D = TR[id], th = THEMES[B.theme], cur = B.cur;
    const img = (a, j = 0) => window.P ? P.get(a[0], a[1] + j) : '';
    const ownerImg = P.get(B.owner.photo, B.owner.pi);
    const dk = !!th.dark, lum = h => { const v = parseInt(h.slice(1), 16); return (.299 * (v >> 16) + .587 * (v >> 8 & 255) + .114 * (v & 255)) / 255 };
    const accT = (!dk && lum(th.acc) > .7) ? th.ink : th.acc;           // accent used as text must stay readable
    const acc2Ink = lum(th.acc2) > .6 ? '#141414' : '#ffffff';
    const soft = th.acc + (dk ? '26' : '1c');
    const root = document.documentElement;
    Object.entries({ '--bg': th.bg, '--surf': th.surf, '--ink': th.ink, '--mu': th.mu, '--ln': th.ln, '--acc': th.acc, '--acc-ink': th.accInk, '--acc-t': accT, '--acc2': th.acc2, '--acc2-ink': acc2Ink, '--acc2-on-ink': lum(th.acc2) > .35 || dk ? th.acc2 : th.acc, '--soft': soft,
      '--hf': `'${th.hf}',system-ui,sans-serif`, '--bf': `'${th.bf}',system-ui,sans-serif`, '--hw': th.hw, '--tt': th.up ? 'uppercase' : 'none', '--hls': th.up ? '.01em' : (th.hw >= 700 ? '-.02em' : '-.01em'),
      '--r': th.r + 'px', '--rs': Math.min(th.r, 10) + 'px', '--rl': Math.min(th.r, 12) + 'px', '--rb': th.r >= 16 ? '999px' : Math.min(th.r, 8) + 'px' }).forEach(([k, v]) => root.style.setProperty(k, v));
    root.style.colorScheme = dk ? 'dark' : 'light';
    const fam = f => f.replace(/ /g, '+') + (f === th.hf ? ':wght@400;' + th.hw : ':wght@400;500;600;700');
    const fl = document.createElement('link'); fl.rel = 'stylesheet'; fl.href = 'https://fonts.googleapis.com/css2?family=' + [...new Set([th.hf, th.bf])].map(f => f === th.hf && f === th.bf ? f.replace(/ /g, '+') + ':wght@400;500;600;700;' + Math.max(th.hw, 800) : fam(f)).join('&family=') + '&display=swap'; document.head.appendChild(fl);
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    const tel = B.tel.replace(/\s/g, ''), waNum = tel.replace(/^0/, { UK: '44', IE: '353', AU: '61', NZ: '64' }[B.cc]);
    const head = th.head === 'float' && !['full', 'card'].includes(th.hero) ? 'bar' : th.head;

    /* hours */
    const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const hrs = DAYS.map((d, i) => [d, i < 5 ? `${B.hours.start}–${B.hours.end}` : i === 5 ? (B.hours.sat || 'Closed') : 'Closed']);
    const toMin = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m };
    function openState() {
      const now = new Date(), di = (now.getDay() + 6) % 7, h = hrs[di][1], m = now.getHours() * 60 + now.getMinutes();
      if (h !== 'Closed') { const [a, b] = h.split('–').map(toMin); if (m >= a && m < b) return [true, `Open now · until ${h.split('–')[1]}`] }
      if (B.hours.emergency) return [true, `Emergency line open · ${B.hours.emergency}`];
      for (let k = 1; k <= 7; k++) { const j = (di + k) % 7, hh = hrs[j][1]; if (hh !== 'Closed' || (k === 0)) { const [a] = hh.split('–'); if (k === 1) { const tm = toMin(a); if (m < tm && h !== 'Closed') return [false, `Opens today at ${a}`] } return [false, `Closed · opens ${k === 1 ? 'tomorrow' : DAYS[j]} ${a}`] } }
      return [false, 'Closed'];
    }
    const [isOpen, openTxt] = openState();
    const tr = D;
    const nameShort = B.name;
    const nav = [['#services', 'Services'], ['#estimate', 'Prices'], ['#work', 'Our work'], ['#reviews', 'Reviews'], ['#area', 'Area'], ['#faq', 'FAQ']];

    const logo = `<a class="logo" href="#top"><span class="mk">${icon(tr.icon)}</span><span><b>${esc(nameShort)}</b><small>${esc(tr.name)} · ${esc(B.town)}</small></span></a>`;
    const callBtn = `<a class="call" href="tel:${tel}"><i>${icon('phone')}</i><span><small>${B.hours.emergency ? 'Call any time' : 'Call us'}</small>${esc(B.tel)}</span></a>`;
    let header = '';
    if (head === 'strip') header += `<div class="strip"><div class="w"><span>${icon('clock')}${B.hours.emergency ? `<b>Emergency call-outs ${esc(B.hours.emergency)}</b>` : `Mon–Fri ${B.hours.start}–${B.hours.end}${B.hours.sat ? ' · Sat ' + B.hours.sat : ''}`}</span><span class="hide-m">${icon('pin')}Covering ${esc(B.area.slice(0, 4).join(', '))} & nearby</span><span>${icon('star')}${B.rating} from ${B.nrev} reviews</span></div></div>`;
    header += head === 'center'
      ? `<header class="hd center"><div class="w"><div class="row">${logo}${callBtn}</div><nav class="nav">${nav.map(a => `<a href="${a[0]}">${a[1]}</a>`).join('')}</nav></div></header>`
      : `<header class="hd ${head === 'float' ? 'float' : ''}"><div class="w">${logo}<nav class="nav">${nav.map(a => `<a href="${a[0]}">${a[1]}</a>`).join('')}</nav>${callBtn}</div></header>`;

    /* hero */
    const trust = `<div class="trust"><span>${stars(B.rating)} <b>${B.rating}</b> (${B.nrev} reviews)</span><span>${icon('shield')}<b>${B.years} years</b> trading</span><span>${icon('check')}Fully insured</span></div>`;
    const ctas = `<div class="cta"><a class="btn" href="#estimate">${icon('calc')}Instant estimate</a><a class="btn o" href="#contact">Book a visit</a></div>`;
    const open = `<span class="open ${isOpen ? 'on' : ''}" id="openst"><i></i>${esc(openTxt)}</span>`;
    const inner = `<div class="in">${open}<h1>${esc(B.headline)}</h1><p>${esc(B.intro)}</p>${ctas}${trust}</div>`;
    const badge = `<div class="badge"><img src="${ownerImg}" alt="${esc(B.owner.first)}"><div><b>${esc(B.owner.first)} ${esc(B.owner.sur)}</b><small>Owner · answers the phone himself</small></div></div>`.replace('himself', B.owner.female ? 'herself' : 'himself');
    let hero;
    if (th.hero === 'split') hero = `<section class="hero split"><div class="w">${inner}<div class="ph"><img src="${img(B.heroImg)}" alt="${esc(tr.name)} at work"></div></div></section>`;
    else if (th.hero === 'side') hero = `<section class="hero side"><div class="w"><div class="ph"><img src="${img(B.heroImg)}" alt="${esc(tr.name)} at work">${badge}</div>${inner}</div></section>`;
    else if (th.hero === 'full') hero = `<section class="hero full"><img src="${img(B.heroImg)}" alt=""><div class="w">${inner}</div></section>`;
    else if (th.hero === 'card') hero = `<section class="hero card"><img src="${img(B.heroImg)}" alt=""><div class="w">${inner}</div></section>`;
    else if (th.hero === 'mosaic') hero = `<section class="hero mosaic"><div class="w">${inner}<div class="mos"><div class="ph"><img src="${img(B.heroImg)}" alt=""></div><div class="ph"><img src="${img(B.heroImg2)}" alt=""></div><div class="ph"><img src="${ownerImg}" alt="${esc(B.owner.first)}" style="object-position:top"></div></div></div></section>`;
    else hero = `<section class="hero type"><div class="w">${inner}<div class="row3"><div class="ph"><img src="${img(B.heroImg)}" alt=""></div><div class="ph"><img src="${img(B.heroImg2)}" alt=""></div><div class="ph"><img src="${ownerImg}" alt="${esc(B.owner.first)}" style="object-position:top"></div></div></div></section>`;

    const certs = `<div class="certs"><div class="w">${B.certs.map(c => `<span>${icon('shield')}${esc(c)}</span>`).join('')}</div></div>`;
    const emg = B.hours.emergency ? `<div class="emg"><div class="w"><div><b>${icon('alert')} Emergency? We answer ${esc(B.hours.emergency)}</b><ul>${B.emergencyList.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div><a class="btn" href="tel:${tel}">${icon('phone')}Call ${esc(B.tel)}</a></div></div>` : '';

    /* sections */
    const S = {};
    const sh = (k, h, p) => `<div class="sh"><span class="kick">${esc(k)}</span><h2>${esc(h)}</h2>${p ? `<p class="lead">${esc(p)}</p>` : ''}</div>`;
    const svcCard = (s, i) => {
      const pr = `<div class="pr"><span>from <b>${money(s.price, cur)}</b> <span class="u">${esc(s.unit)}</span></span><button class="lk" data-job="${esc(s.n)}">Book →</button></div>`;
      if (th.svc === 'tiles') return `<article class="card"><div class="ph"><img src="${img(B.gallery[i % B.gallery.length].img, 20)}" alt="" loading="lazy"></div><div class="bd"><h3>${esc(s.n)}</h3><p>${esc(s.d)}</p>${pr}</div></article>`;
      if (th.svc === 'menu') return `<article class="card"><div class="ttl"><h3>${esc(s.n)}</h3><i></i><b>${money(s.price, cur)}</b></div><p>${esc(s.d)} <span class="u">· from, ${esc(s.unit)}</span></p></article>`;
      if (th.svc === 'list') return `<article class="card"><h3>${esc(s.n)}</h3>${pr}<p>${esc(s.d)}</p></article>`;
      return `<article class="card"><span class="si">${icon(tr.icon)}</span><h3>${esc(s.n)}</h3><p>${esc(s.d)}</p>${pr}</article>`;
    };
    S.services = `<section class="s" id="services"><div class="w">${sh('Services & prices', `What we do`, `Clear starting prices so you know where you stand. Every job gets a fixed written quote before we start.`)}<div class="svc ${th.svc}">${B.services.map(svcCard).join('')}</div></div></section>`;

    const F = B.fill, c = { ...D.calc, title: F(D.calc.title), intro: F(D.calc.intro), notes: D.calc.notes.map(F), inputs: D.calc.inputs.map(i => ({ ...i, l: F(i.l), o: i.o && i.o.map(o => [F(o[0]), o[1]]) })) };
    S.calc = `<section class="s alt" id="estimate"><div class="w">${sh('Instant estimate', c.title, c.intro)}<div class="calc"><div class="card f" id="cf">${c.inputs.map(inp => {
      if (inp.t === 'num') return `<label class="fl">${esc(inp.l)}<span class="rw"><input type="range" data-k="${inp.k}" min="${inp.min}" max="${inp.max}" step="${inp.step || 1}" value="${inp.v}"><output id="o-${inp.k}">${inp.v} ${esc(inp.u)}</output></span></label>`;
      if (inp.t === 'sel') return inp.o.length <= 4 ? `<div class="fl">${esc(inp.l)}<div class="seg" data-k="${inp.k}">${inp.o.map((o, j) => `<button type="button" data-i="${j}" class="${j ? '' : 'on'}">${esc(o[0])}</button>`).join('')}</div></div>` : `<label class="fl">${esc(inp.l)}<select data-k="${inp.k}">${inp.o.map((o, j) => `<option value="${j}">${esc(o[0])}</option>`).join('')}</select></label>`;
      return `<label class="chk"><input type="checkbox" data-k="${inp.k}">${esc(inp.l)}</label>`;
    }).join('')}</div><div class="card res"><small>Estimated price range</small><div class="big" id="cr">—</div><ul id="cb"></ul><p class="nt">${c.notes.map(esc).join(' ')} Prices in ${cur === '£' ? 'GBP' : cur === '€' ? 'EUR' : cur === 'A$' ? 'AUD' : 'NZD'}, guide only — we confirm a fixed price after a free survey.</p><a class="btn" href="#contact" id="cbk">${icon('check')}Book a free survey</a></div></div></div></section>`;

    S.about = `<section class="s" id="about"><div class="w about"><div class="ph"><img src="${ownerImg}" alt="${esc(B.owner.first)} ${esc(B.owner.sur)}" loading="lazy"></div><div class="tx"><span class="kick">About ${esc(nameShort)}</span><h2>Hi, I’m ${esc(B.owner.first)}.</h2>${B.about.map(p => `<p>${esc(p)}</p>`).join('')}<div class="nums"><div><b>${B.years}</b><span>years trading</span></div><div><b>${B.rating}★</b><span>${B.nrev} reviews</span></div><div><b>${B.area.length}</b><span>areas covered</span></div></div><div class="usp">${B.usps.map(u => `<div>${icon('check')}<span><b>${esc(u[0])}</b><p>${esc(u[1])}</p></span></div>`).join('')}</div><span class="sig">— ${esc(B.owner.first)} ${esc(B.owner.sur)}</span></div></div></section>`;

    const gtags = [...new Set(B.gallery.map(g => g.tag))].slice(0, 5);
    S.gallery = `<section class="s alt" id="work"><div class="w">${sh('Recent work', 'Jobs we’re proud of', `A few recent jobs around ${B.town}. Tap a photo to see it bigger.`)}<div class="gf seg" id="gf"><button type="button" class="on" data-t="">All</button>${gtags.map(t => `<button type="button" data-t="${esc(t)}">${esc(t)}</button>`).join('')}</div><div class="gal" id="gal">${B.gallery.map((g, i) => `<figure data-t="${esc(g.tag)}" data-i="${i}"><img src="${img(g.img)}" alt="${esc(g.cap)}" loading="lazy"><figcaption>${esc(g.cap)}</figcaption></figure>`).join('')}</div></div></section>`;

    S.process = `<section class="s" id="how"><div class="w">${sh('How it works', 'From first call to finished job')}<div class="proc">${B.process.map(p => `<div><h3>${esc(p[0])}</h3><p>${esc(p[1])}</p></div>`).join('')}</div></div></section>`;

    const dist = [Math.round(B.nrev * (B.rating - 4.1) / .9 * .92), 0, 0, 0, 0]; dist[1] = Math.round((B.nrev - dist[0]) * .7); dist[2] = Math.round((B.nrev - dist[0] - dist[1]) * .6); dist[3] = Math.round((B.nrev - dist[0] - dist[1] - dist[2]) * .5); dist[4] = Math.max(0, B.nrev - dist[0] - dist[1] - dist[2] - dist[3]);
    S.reviews = `<section class="s alt" id="reviews"><div class="w">${sh('Reviews', 'What customers say')}<div class="rsum"><div class="big">${B.rating}</div><div>${stars(B.rating)}<div style="font-size:14px;color:var(--mu)">${B.nrev} verified reviews</div></div><div class="bars">${dist.map((d, i) => `<div><span>${5 - i}</span><i><b style="width:${Math.round(d / B.nrev * 100)}%"></b></i><span>${d}</span></div>`).join('')}</div></div><div class="rv ${th.rev}">${B.reviews.map(x => `<article class="card"><span class="tg">${esc(x.job)}</span>${stars(x.s)}<p class="q">“${esc(x.t)}”</p><div class="by"><span><b>${esc(x.who)}</b> · ${esc(x.where)}</span><span>${esc(x.ago)}</span></div></article>`).join('')}</div></div></section>`;

    // stylised area map: base town in centre, others around it
    const pts = B.area.map((t, i) => i === 0 ? [200, 150] : [200 + Math.cos(i * 2.39 + 0.6) * (70 + (i % 3) * 32), 150 + Math.sin(i * 2.39 + 0.6) * (52 + (i % 3) * 24)]);
    S.area = `<section class="s" id="area"><div class="w area"><div>${sh('Areas we cover', `Based in ${B.town}, working across ${B.region}`, `Type your town or area to check. No travel charge inside the areas below.`)}<div class="chk-area"><input class="in-t" id="ai" placeholder="e.g. ${esc(B.area[2])}" aria-label="Your town or area"><button class="btn" type="button" id="ab">Check</button></div><div class="ans" id="aa"></div><div class="towns">${B.area.map(t => `<button type="button" data-town="${esc(t)}">${esc(t)}</button>`).join('')}</div></div><div class="map"><svg viewBox="0 0 400 300" role="img" aria-label="Service area map"><circle cx="200" cy="150" r="138" fill="var(--soft)" stroke="var(--acc)" stroke-dasharray="6 6"/>${pts.map((p, i) => `<g><circle cx="${p[0]}" cy="${p[1]}" r="${i ? 5 : 9}" fill="${i ? 'var(--ink)' : 'var(--acc)'}"/><text x="${p[0]}" y="${p[1] - 12}" text-anchor="middle" font-size="${i ? 12 : 14}" font-weight="${i ? 500 : 800}" fill="var(--ink)">${esc(B.area[i])}</text></g>`).join('')}</svg></div></div></section>`;

    S.tips = `<section class="s alt" id="tips"><div class="w">${sh('Advice', `Tips from ${B.owner.first}`, 'Free advice that might save you a call-out.')}<div class="tips">${B.tips.map((t, i) => `<article class="card"><span class="n">0${i + 1}</span><h3>${esc(t[0])}</h3><p>${esc(t[1])}</p></article>`).join('')}</div></div></section>`;

    S.faq = `<section class="s" id="faq"><div class="w">${sh('FAQ', 'Questions people ask')}<div class="faq">${B.faq.map((f, i) => `<details ${i ? '' : 'open'}><summary>${esc(f[0])}</summary><p>${esc(f[1])}</p></details>`).join('')}</div></div></section>`;

    const today = new Date(); const dl = []; for (let k = 1; dl.length < 10; k++) { const d = new Date(today); d.setDate(today.getDate() + k); if (d.getDay() !== 0 && !(d.getDay() === 6 && !B.hours.sat)) dl.push(d) }
    S.contact = `<section class="s alt" id="contact"><div class="w">${sh('Book a visit', 'Get a free quote', `Tell us about the job. ${B.owner.first} will call you back${B.hours.emergency ? ' — for emergencies please phone' : ''}.`)}<div class="ct"><div id="fw"><form class="card" id="bf" novalidate>
      <label class="fl">What do you need?<select id="fj">${B.jobs.map(j => `<option>${esc(j)}</option>`).join('')}<option>Something else</option></select></label>
      <label class="fl">Describe the job<textarea id="fd" rows="4" placeholder="A few details help us quote accurately — sizes, what’s wrong, access, timing."></textarea></label>
      <div class="fl">Photos (optional)<label class="drop">${icon('arrow')}<span id="fn">Add photos of the job</span><input type="file" id="ff" accept="image/*" multiple hidden></label><div class="files" id="fp"></div></div>
      <div class="fl">Preferred day for the visit<div class="days" id="fdays">${dl.map((d, i) => `<button type="button" data-d="${d.toDateString()}" class="${i ? '' : 'on'}">${DAYS[(d.getDay() + 6) % 7]}<b>${d.getDate()}</b>${d.toLocaleString('en-GB', { month: 'short' })}</button>`).join('')}</div><div class="seg" id="fslot"><button type="button" class="on" data-s="Morning">Morning</button><button type="button" data-s="Afternoon">Afternoon</button><button type="button" data-s="Any time">Any time</button></div></div>
      <div class="g2"><label class="fl">Your name<input class="in-t" id="fnm" autocomplete="name"></label><label class="fl">Phone<input class="in-t" id="fph" type="tel" autocomplete="tel"></label></div>
      <div class="g2"><label class="fl">Email<input class="in-t" id="fem" type="email" autocomplete="email"></label><label class="fl">Town or postcode<input class="in-t" id="fpc" placeholder="${esc(B.town)}"></label></div>
      <span class="err" id="fe"></span><button class="btn" type="submit">${icon('check')}Request my free quote</button><small style="color:var(--mu)">Demo form — nothing is sent. We only use your details to reply about this job.</small></form></div>
      <aside class="side"><div class="card"><h3>Contact</h3><div class="cl"><a href="tel:${tel}">${icon('phone')}${esc(B.tel)}</a>${B.wa ? `<a href="https://wa.me/${waNum}" target="_blank" rel="noopener">${icon('chat')}WhatsApp us</a>` : ''}<a href="mailto:${B.email}">${icon('arrow')}${esc(B.email)}</a><span style="display:flex;gap:10px;align-items:center">${icon('pin')}${esc(B.town)}, ${esc(B.region)}</span></div></div><div class="card"><h3>Opening hours</h3><ul class="hrs">${hrs.map((h, i) => `<li class="${i === (today.getDay() + 6) % 7 ? 'td' : ''}"><span>${h[0]}</span><span>${h[1]}</span></li>`).join('')}</ul>${B.hours.emergency ? `<p style="margin-top:10px;font-size:14px"><b>Emergencies:</b> ${esc(B.hours.emergency)}</p>` : ''}</div></aside></div></div></section>`;

    const footer = `<footer><div class="w"><div><div class="logo" style="margin-bottom:12px">${logo.replace(/<a class="logo" href="#top">|<\/a>/g, '')}</div><p style="opacity:.8;max-width:42ch">${esc(B.intro)}</p></div><div><h3>Services</h3><ul>${B.services.slice(0, 6).map(s => `<li><a href="#services">${esc(s.n)}</a></li>`).join('')}</ul></div><div><h3>Get in touch</h3><ul><li><a href="tel:${tel}">${esc(B.tel)}</a></li><li><a href="mailto:${B.email}">${esc(B.email)}</a></li><li>${esc(B.area.slice(0, 5).join(' · '))}</li></ul></div><div class="fine"><span>© 2026 ${esc(B.name)} · ${esc(B.web)}</span><span>Fictional business for a design collection · Photos: Pexels · Forms are demos and send nothing.</span></div></div></footer>`;
    const mbar = `<nav class="mbar" style="--mb:${B.wa ? 3 : 2}"><a href="tel:${tel}">${icon('phone')}Call</a>${B.wa ? `<a href="https://wa.me/${waNum}">${icon('chat')}WhatsApp</a>` : ''}<a class="p" href="#estimate">${icon('calc')}Estimate</a></nav>`;
    const back = `<a class="bk" href="index.html">← 40 ${esc(tr.plural.toLowerCase())}</a>`;

    document.title = B.title;
    document.body.className = 'deco-' + th.deco;
    document.body.id = 'top';
    document.body.innerHTML = header + hero + certs + emg + B.order.map(k => S[k]).join('') + footer + mbar + back;
    wire(B, D, img, c);
  }

  /* ---------- behaviour ---------- */
  function wire(B, D, img, c) {
    const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)], cur = B.cur;
    // calculator
    const st = {};
    c.inputs.forEach(i => st[i.k] = i.t === 'num' ? i.v : i.t === 'sel' ? 0 : false);
    function calc() {
      let add = c.base, mul = 1; const lines = [['Call-out & setup', c.base]], mults = [];
      c.inputs.filter(i => i.t === 'num').forEach(i => { const v = st[i.k] * i.rate; add += v; lines.push([`${i.l} (${st[i.k]} ${i.u})`, v]) });
      const ap = (e, label) => { if (!e) return; if (e.a) { add += e.a; lines.push([label, e.a]) } if (e.r) { const v = e.r * st[e.per]; add += v; lines.push([label, v]) } if (e.m && e.m !== 1) { mul *= e.m; mults.push([label, e.m]) } };
      c.inputs.forEach(i => { if (i.t === 'sel') ap(i.o[st[i.k]][1], i.o[st[i.k]][0]); if (i.t === 'chk' && st[i.k]) ap(i.e, i.l) });
      const tot = add * mul * B.fx, lo = nice(tot * .9), hi = nice(tot * 1.15);
      $('#cr').textContent = money(lo, cur) + ' – ' + money(hi, cur);
      $('#cb').innerHTML = lines.filter(l => l[1]).map(l => `<li><span>${esc(l[0])}</span><span>${money(nice(l[1] * B.fx), cur)}</span></li>`).join('') + mults.map(m => `<li><span>${esc(m[0])}</span><span>${m[1] > 1 ? '+' : '−'}${Math.round(Math.abs(m[1] - 1) * 100)}%</span></li>`).join('');
      calc.summary = `${c.title}: ${money(lo, cur)}–${money(hi, cur)} (${c.inputs.map(i => i.t === 'num' ? `${st[i.k]} ${i.u}` : i.t === 'sel' ? i.o[st[i.k]][0] : st[i.k] ? i.l : '').filter(Boolean).join(', ')})`;
    }
    $('#cf').addEventListener('input', e => { const k = e.target.dataset.k; if (!k) return; const inp = c.inputs.find(i => i.k === k); if (inp.t === 'num') { st[k] = +e.target.value; $('#o-' + k).textContent = st[k] + ' ' + inp.u } else if (inp.t === 'sel') st[k] = +e.target.value; else st[k] = e.target.checked; calc() });
    $('#cf').addEventListener('click', e => { const b = e.target.closest('.seg button'); if (!b) return; const k = b.parentElement.dataset.k; st[k] = +b.dataset.i; b.parentElement.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); calc() });
    calc();
    $('#cbk').addEventListener('click', () => { const d = $('#fd'); if (d && !d.value) d.value = 'Estimate from your website: ' + calc.summary });
    // services → booking
    document.addEventListener('click', e => { const b = e.target.closest('[data-job]'); if (!b) return; const s = $('#fj'); const o = [...s.options].find(x => x.text === b.dataset.job); if (!o) { const n = new Option(b.dataset.job); s.add(n, 0) } s.value = b.dataset.job; $('#contact').scrollIntoView({ behavior: 'smooth' }) });
    // gallery filter + lightbox
    $('#gf').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; $$('#gf button').forEach(x => x.classList.toggle('on', x === b)); $$('#gal figure').forEach(f => f.style.display = !b.dataset.t || f.dataset.t === b.dataset.t ? '' : 'none') });
    const figs = $$('#gal figure');
    function lb(i) {
      const show = () => { const f = figs[i]; o.querySelector('img').src = f.querySelector('img').src; o.querySelector('p').textContent = f.querySelector('figcaption').textContent };
      const o = document.createElement('div'); o.className = 'lb'; o.innerHTML = '<img alt=""><p></p><button class="x" aria-label="Close">×</button><button class="pv" aria-label="Previous">‹</button><button class="nx" aria-label="Next">›</button>';
      document.body.appendChild(o); show();
      const key = e => { if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') { i = (i + 1) % figs.length; show() } if (e.key === 'ArrowLeft') { i = (i - 1 + figs.length) % figs.length; show() } };
      const close = () => { o.remove(); removeEventListener('keydown', key) };
      o.addEventListener('click', e => { if (e.target.classList.contains('nx')) { i = (i + 1) % figs.length; show() } else if (e.target.classList.contains('pv')) { i = (i - 1 + figs.length) % figs.length; show() } else if (e.target === o || e.target.classList.contains('x')) close() });
      addEventListener('keydown', key);
    }
    figs.forEach((f, i) => f.addEventListener('click', () => lb(i)));
    // area check
    const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '');
    function check(q) {
      const a = $('#aa'); if (!q.trim()) { a.className = 'ans'; return }
      const hit = B.area.find(t => norm(t).includes(norm(q)) || norm(q).includes(norm(t)));
      if (hit) { a.className = 'ans ok'; a.innerHTML = `<b>Yes, we cover ${esc(hit)}.</b> No travel charge${hit === B.town ? ' — it’s where we’re based' : ''}. ${D.emergency ? 'Emergency visits usually within 1–2 hours.' : 'We can usually visit within the week.'}` }
      else { a.className = 'ans no'; a.innerHTML = `<b>${esc(q)} is outside our usual area.</b> We sometimes travel for larger jobs — send the details below and we’ll tell you honestly if we can help.` }
    }
    $('#ab').addEventListener('click', () => check($('#ai').value)); $('#ai').addEventListener('keydown', e => { if (e.key === 'Enter') check(e.target.value) });
    $$('[data-town]').forEach(b => b.addEventListener('click', () => { $('#ai').value = b.dataset.town; check(b.dataset.town) }));
    // booking form
    $('#fdays').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; $$('#fdays button').forEach(x => x.classList.toggle('on', x === b)) });
    $('#fslot').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; $$('#fslot button').forEach(x => x.classList.toggle('on', x === b)) });
    $('#ff').addEventListener('change', e => { const fs = [...e.target.files].slice(0, 6); $('#fn').textContent = fs.length ? fs.length + ' photo' + (fs.length > 1 ? 's' : '') + ' added' : 'Add photos of the job'; $('#fp').innerHTML = ''; fs.forEach(f => { const im = document.createElement('img'); im.src = URL.createObjectURL(f); im.alt = ''; $('#fp').appendChild(im) }) });
    $('#bf').addEventListener('submit', e => {
      e.preventDefault(); const nm = $('#fnm').value.trim(), ph = $('#fph').value.trim(), em = $('#fem').value.trim();
      if (!nm) return $('#fe').textContent = 'Please add your name.';
      if (!ph && !em) return $('#fe').textContent = 'Please add a phone number or email so we can reply.';
      if (em && !/^\S+@\S+\.\S+$/.test(em)) return $('#fe').textContent = 'That email address doesn’t look right.';
      const day = $('#fdays .on'), slot = $('#fslot .on').dataset.s, ref = B.name.replace(/[^A-Z]/g, '').slice(0, 3).padEnd(2, 'X') + '-' + String(Math.floor(1000 + Math.random() * 9000));
      const dd = new Date(day.dataset.d);
      $('#fw').innerHTML = `<div class="card done"><span class="kick">${icon('check')} Request received (demo)</span><span class="ref">${ref}</span><h3>Thanks ${esc(nm.split(' ')[0])} — ${esc(B.owner.first)} will be in touch.</h3><p style="color:var(--mu)">${esc($('#fj').value)} · preferred ${dd.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}, ${slot.toLowerCase()}.</p><ol style="margin:0;padding-left:20px;color:var(--mu);line-height:1.8"><li>We call or text you back${B.hours.emergency ? ' quickly' : ' within one working day'}.</li><li>We confirm a time for a free visit or quote.</li><li>You get a fixed written price before any work starts.</li></ol><p style="font-size:13px;color:var(--mu)">This is a demo site: nothing was sent.</p></div>`;
    });
  }

  window.T = { trade: d => { TR[d.id] = d }, biz, site, THEMES, ORDER, TR, C, icon, esc, slug };
})();
