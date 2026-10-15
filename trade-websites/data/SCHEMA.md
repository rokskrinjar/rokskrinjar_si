# Trade data schema

Each trade lives in `trades/data/<id>.js` and calls `T.trade({...})` exactly once.
The shared engine (`trades/engine.js`) turns one trade file plus a seed into 40 different
fictional business websites. The engine supplies the town, owner, theme and prices; the trade
file supplies everything that is specific to the trade.

Language: English with British spelling (colour, metre, organise). The text must work for
small businesses in the UK, Ireland, Australia and New Zealand, so don't name country-specific
laws or registration schemes. Use generic wording such as "registered gas engineer",
"certified electrician" or "fully insured". Don't use real company names. Prices are in GBP;
the engine converts them for other countries.

Placeholders that the engine replaces in any string: `{town}` (the business's base town),
`{name}` (the business name), `{owner}` (the owner's first name), `{years}` (years trading).

```js
T.trade({
  id: 'plumber',                 // slug, same as the file name
  name: 'Plumber',               // singular job title
  plural: 'Plumbers',
  noun: 'plumbing',              // "your {noun} sorted"
  icon: 'wrench',                // one of: wrench, bolt, tiles, roller, saw, roof, brick, key, flame, snow,
                                 // leaf, sparkle, box, floor, pane, gutter, chimney, trowel, car, spark,
                                 // hammer, sun, washer, toolbox, bath
  emergency: true,               // true if 24/7 emergency call-outs are normal for the trade

  // Business-name generator: the engine combines one `pre` with one `post`,
  // or uses `{owner}`-style forms. Give 24+ pre and 8+ post.
  // Pre should be evocative, trade-flavoured, not cheesy puns only.
  nameParts: { pre: ['Copperline', 'Clearflow', ...], post: ['Plumbing', 'Plumbing & Heating', ...] },

  headlines: [ /* 12 hero headlines, max ~9 words; some may use {town} */ ],
  intros:    [ /* 8 hero intro paragraphs, 25–45 words, first person plural or singular */ ],
  about:     [ /* 6 short "about us" paragraphs, 40–70 words, may use {owner} {years} {town} */ ],

  services: [  // 10–12 items; engine picks 6–9 per site
    { n: 'Leak detection & repair', d: 'One-sentence description, 12–25 words.', from: 85, unit: 'per job' },
    // unit examples: 'per job', 'per hour', 'per m²', 'per room', 'per metre', 'per day', 'per unit'
  ],

  usps: [ ['Short heading', '15–30 word explanation'], /* 10 items */ ],
  process: [ ['Step heading', '12–25 words'], /* 5 steps from first contact to aftercare */ ],

  // Instant estimate calculator, specific to the trade.
  // total = (base + Σ fixed adds + Σ num·rate + Σ option rate·value(per)) × Π multipliers
  calc: {
    title: 'Estimate your bathroom tiling',
    intro: 'One sentence explaining what the estimate covers.',
    base: 120,                   // GBP call-out / minimum
    inputs: [
      { k: 'area', l: 'Floor and wall area', t: 'num', u: 'm²', min: 1, max: 120, v: 14, step: 1, rate: 38 },
      { k: 'tile', l: 'Tile type', t: 'sel', o: [ ['Ceramic', { m: 1 }], ['Porcelain', { m: 1.18 }], ['Natural stone', { m: 1.55 }] ] },
      { k: 'strip', l: 'Remove old tiles', t: 'chk', e: { r: 9, per: 'area' } },
      { k: 'prep', l: 'Waterproof shower area', t: 'chk', e: { a: 180 } },
      // option/checkbox effect `e` (or the 2nd element of a `sel` option): any of
      //   a: fixed GBP add, m: multiplier, r + per: GBP rate × value of the num input named in `per`
    ],
    notes: ['Two or three short caveats, e.g. "Materials not included".'],
  },
  // 3–6 inputs, with at least one num and one sel. Defaults must give a realistic mid-size job.

  faq: [ ['Question?', 'Answer, 25–60 words.'], /* 10 items */ ],
  reviews: [ { t: 'Review text, 20–55 words, specific and natural.', job: 'Short job label', s: 5 }, /* 14 items, s 4 or 5 */ ],
  certs: [ /* 6 generic credentials/badges, e.g. 'Fully insured to £5m', 'Registered gas engineer', '12-month workmanship guarantee' */ ],
  gallery: [ ['Caption, 3–8 words', 'service tag'], /* 12 items; tags reuse service names in short form */ ],
  jobs: [ /* 8 job types for the booking form select */ ],
  urgent: [ /* 5 urgent problems (used for the emergency strip if emergency:true, otherwise "common problems") */ ],
  tips: [ ['Helpful tip heading', 'Practical advice for homeowners, 25–45 words.'], /* 8 items */ ],
  hours: { emergency: '24/7', normal: 'Mon–Fri 7:30–18:00, Sat 8:00–13:00' },
});
```

Rules:
- Valid JavaScript, single `T.trade({...})` call, no other code, no imports.
- Prices realistic for UK small trades in 2026 (GBP).
- No placeholder text ("lorem", "TBD"). Every list has the stated number of items.
- Run `node trades/tools/check-trade.js trades/data/<id>.js`; it must print `OK`.
