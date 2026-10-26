#!/usr/bin/env python3
"""Build AH distilled from the knowledge base.

Source (kb/):
  catalog.yaml                     books -> sections -> concepts
  site.yaml                        home page texts
  <book>/_book.{en,sl}.md          book introductions
  <book>/<concept>.{en,sl}.md      concept pages (English is primary)

Output (ah-distilled/):
  index.html                       level 0: overview
  <book>/index.html                level 1: book
  <book>/<concept>.html            level 2: concept
  kb/ah-distilled-kb.en.md         whole knowledge base in one file (for the "Ask Alex" adviser)
  kb/ah-distilled-kb.sl.md
  kb/index.json                    machine-readable catalogue

Run: python3 ah-distilled/kb/build.py
"""
import html
import json
import re
import sys
from pathlib import Path

import markdown
import yaml

KB = Path(__file__).resolve().parent
OUT = KB.parent
LANGS = ("en", "sl")

OLD_URLS = {
    "value-equation.html": "offers/value-equation.html",
    "grand-slam-offer.html": "offers/grand-slam-offer.html",
    "starving-crowd.html": "offers/starving-crowd.html",
    "pricing-enhancers.html": "offers/charge-what-its-worth.html",
    "core-four.html": "leads/core-four.html",
    "lead-magnet.html": "leads/lead-magnets.html",
    "rule-of-100.html": "leads/rule-of-100.html",
    "lead-getters.html": "leads/lead-getters.html",
    "money-model.html": "money/money-models.html",
    "unit-economics.html": "money/client-financed-acquisition.html",
    "closer.html": "sales/closer.html",
    "constraint.html": "sales/constraint.html",
}

UI = {
    "read_more": {"en": "Read more →", "sl": "Preberi več →"},
    "apply": {"en": "Apply", "sl": "Uporabi"},
    "concepts": {"en": "concepts", "sl": "konceptov"},
    "open_book": {"en": "Open the book →", "sl": "Odpri knjigo →"},
    "related": {"en": "Related concepts", "sl": "Povezani koncepti"},
    "prev": {"en": "← Previous", "sl": "← Prejšnji"},
    "next": {"en": "Next →", "sl": "Naslednji →"},
    "in_book": {"en": "Concepts in this book", "sl": "Koncepti v tej knjigi"},
    "other_books": {"en": "Other books", "sl": "Druge knjige"},
    "coming": {"en": "Coming soon", "sl": "Kmalu"},
    "sl_missing": {"en": "", "sl": "Slovenski prevod še ni pripravljen, prikazana je angleška različica."},
    "kb_file": {"en": "Knowledge base (Markdown)", "sl": "Baza znanja (Markdown)"},
    "home": {"en": "AH distilled", "sl": "AH distilled"},
}

MD = markdown.Markdown(extensions=["extra", "sane_lists", "smarty"],
                       extension_configs={"smarty": {"smart_quotes": False}})


def e(s):
    return html.escape(str(s or ""), quote=True)


def bi(d, tag="span", cls=""):
    """Render a {en, sl} dict as two language-tagged elements."""
    c = f" {cls}" if cls else ""
    return "".join(f'<{tag} class="{l}{c}" lang="{l}">{e(d.get(l) or d.get("en"))}</{tag}>' for l in LANGS)


def bi_html(d, tag="div", cls=""):
    c = f" {cls}" if cls else ""
    return "".join(f'<{tag} class="{l}{c}" lang="{l}">{d.get(l) or d.get("en") or ""}</{tag}>' for l in LANGS)


def inline_md(s):
    out = MD.reset().convert(s or "")
    return re.sub(r"^<p>(.*)</p>$", r"\1", out.strip(), flags=re.S)


def read_md(path):
    text = path.read_text(encoding="utf-8")
    meta, body = {}, text
    if text.startswith("---"):
        _, fm, body = text.split("---", 2)
        meta = yaml.safe_load(fm) or {}
    return meta, body.strip()


def render_body(body):
    h = MD.reset().convert(body)
    # wrap each <h2> and what follows it into a <section> carrying the h2 id
    parts = re.split(r"(?=<h2[ >])", h)
    out = []
    for p in parts:
        m = re.match(r'<h2(?: id="([^"]+)")?>', p)
        if m:
            sid = m.group(1) or ""
            out.append(f'<section class="sec sec-{sid}">{p}</section>')
        elif p.strip():
            out.append(f'<div class="pre">{p}</div>')
    return "\n".join(out)


def load():
    cat = yaml.safe_load((KB / "catalog.yaml").read_text(encoding="utf-8"))
    site = yaml.safe_load((KB / "site.yaml").read_text(encoding="utf-8"))
    concepts = {}
    for book in cat["books"]:
        book["intro"] = {}
        for l in LANGS:
            p = KB / book["id"] / f"_book.{l}.md"
            if p.exists():
                book["intro"][l] = read_md(p)
        book["concept_ids"] = []
        for sec in book["sections"]:
            for cid in sec["concepts"]:
                info = dict(cat["concepts"][cid])
                info.update(id=cid, book=book, section=sec, docs={})
                for l in LANGS:
                    p = KB / book["id"] / f"{cid}.{l}.md"
                    if p.exists():
                        info["docs"][l] = read_md(p)
                concepts[cid] = info
                book["concept_ids"].append(cid)
    return cat, site, concepts


def field(c, key, lang):
    doc = c["docs"].get(lang) or c["docs"].get("en")
    return (doc[0].get(key) if doc else None) or ""


def ready(c):
    return "en" in c["docs"]


# ---------------------------------------------------------------- page shell

def page(title, desc, depth, body, crumbs=""):
    up = "../" * depth
    return f"""<!doctype html>
<html lang="en" data-lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<link rel="icon" href="{up}../favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&family=JetBrains+Mono:wght@400;600&display=swap">
<link rel="stylesheet" href="{up}assets/site.css">
<script src="{up}assets/site.js"></script>
</head>
<body>
<header class="topbar">
  <nav class="crumbs" aria-label="Breadcrumb">{crumbs}</nav>
  <div class="lang" role="group" aria-label="Language">
    <button type="button" data-set="en">EN</button><button type="button" data-set="sl">SL</button>
  </div>
</header>
<main class="wrap">
{body}
</main>
</body>
</html>
"""


def crumb_html(items, depth):
    up = "../" * depth
    parts = [f'<a href="{up}index.html">AH distilled</a>']
    for label, href in items:
        if href:
            parts.append(f'<a href="{href}">{label}</a>')
        else:
            parts.append(f'<span aria-current="page">{label}</span>')
    return '<span class="sep">/</span>'.join(parts)


def concept_card(c, href, show_book=False):
    if not ready(c):
        return f"""<article class="card card-off"><h3>{bi(c['title'])}</h3><p class="muted">{bi(UI['coming'])}</p></article>"""
    key = {l: field(c, "key", l) for l in LANGS}
    apply_ = {l: field(c, "apply", l) for l in LANGS}
    card = {l: field(c, "card", l) for l in LANGS}
    book = f'<p class="card-book">{bi(c["book"]["title"])}</p>' if show_book else ""
    keyhtml = f'<p class="key">{bi(key)}</p>' if key["en"] else ""
    applyhtml = (f'<p class="apply"><b>{bi(UI["apply"])}</b> {bi(apply_)}</p>' if apply_["en"] else "")
    return f"""<article class="card">
  {book}<h3><a href="{href}">{bi(c['title'])}</a></h3>
  <p>{bi(card)}</p>
  {keyhtml}
  {applyhtml}
  <a class="more" href="{href}">{bi(UI['read_more'])}</a>
</article>"""


# ---------------------------------------------------------------- level 2

def build_concept(c, prev_c, next_c, concepts):
    book = c["book"]
    bodies = {}
    for l in LANGS:
        doc = c["docs"].get(l)
        note = ""
        if not doc:
            doc = c["docs"]["en"]
            note = f'<p class="note">{e(UI["sl_missing"][l])}</p>'
        bodies[l] = note + render_body(doc[1])
    meta_en = c["docs"]["en"][0]
    term = meta_en.get("term", "")
    src = f'{e(book["title"]["en"])}{" · " + e(term) if term else ""}'
    related = []
    for rid in meta_en.get("related", []) or []:
        r = concepts.get(rid)
        if r and ready(r):
            href = ("" if r["book"]["id"] == book["id"] else f'../{r["book"]["id"]}/') + f"{rid}.html"
            related.append(f'<a class="chip" href="{href}">{bi(r["title"])}</a>')
    rel = (f'<section class="related"><h2>{bi(UI["related"])}</h2><div class="chips">{"".join(related)}</div></section>'
           if related else "")
    pager = '<nav class="pager">'
    if prev_c:
        pager += f'<a class="prev" href="{prev_c["id"]}.html"><span class="dir">{bi(UI["prev"])}</span><span class="name">{bi(prev_c["title"])}</span></a>'
    if next_c:
        pager += f'<a class="next" href="{next_c["id"]}.html"><span class="dir">{bi(UI["next"])}</span><span class="name">{bi(next_c["title"])}</span></a>'
    pager += "</nav>"
    card = {l: field(c, "card", l) for l in LANGS}
    body = f"""<header class="page-head">
  <p class="eyebrow">{bi(book['title'])} · {bi(c['section']['title'])}</p>
  <h1>{bi(c['title'])}</h1>
  <p class="src">{src}</p>
  <p class="lede">{bi(card)}</p>
</header>
<article class="concept">
{bi_html(bodies)}
</article>
{rel}
{pager}
<footer class="foot">{bi(load.site['home']['footer'])}</footer>"""
    crumbs = crumb_html([(bi(book["title"]), "index.html"), (bi(c["title"]), None)], 1)
    return page(f'{c["title"]["en"]} · AH distilled', card["en"], 1, body, crumbs)


# ---------------------------------------------------------------- level 1

def build_book(book, books, concepts):
    intro = book["intro"]
    meta = {l: (intro.get(l) or intro.get("en") or ({}, ""))[0] for l in LANGS}
    thesis = {l: meta[l].get("thesis", "") for l in LANGS}
    body_html = {l: render_body((intro.get(l) or intro.get("en") or ({}, ""))[1]) for l in LANGS}
    secs = []
    for sec in book["sections"]:
        sintro = {l: (meta[l].get("sections") or {}).get(sec["id"], "") for l in LANGS}
        cards = "".join(concept_card(concepts[cid], f"{cid}.html") for cid in sec["concepts"])
        secs.append(f"""<section class="book-sec" id="{sec['id']}">
  <h2>{bi(sec['title'])}</h2>
  {f'<p class="sec-intro">{bi(sintro)}</p>' if sintro['en'] else ''}
  <div class="cards">{cards}</div>
</section>""")
    others = "".join(
        f'<a class="chip" href="../{b["id"]}/index.html">{bi(b["title"])}</a>' for b in books if b is not book)
    kind = {"en": "Book" if book["kind"] == "book" else "Talks & trainings",
            "sl": "Knjiga" if book["kind"] == "book" else "Predavanja in treningi"}
    jump = "".join(f'<a href="#{s["id"]}">{bi(s["title"])}</a>' for s in book["sections"])
    body = f"""<header class="page-head">
  <p class="eyebrow">{bi(kind)} · {len(book['concept_ids'])} {bi(UI['concepts'])}</p>
  <h1>{bi(book['title'])}</h1>
  <p class="src">{bi(book['subtitle'])}</p>
  {f'<p class="lede thesis">{bi(thesis)}</p>' if thesis['en'] else ''}
  <nav class="jump">{jump}</nav>
</header>
<div class="book-intro">{bi_html(body_html)}</div>
{''.join(secs)}
<section class="related"><h2>{bi(UI['other_books'])}</h2><div class="chips">{others}</div></section>
<footer class="foot">{bi(load.site['home']['footer'])}</footer>"""
    crumbs = crumb_html([(bi(book["title"]), None)], 1)
    return page(f'{book["title"]["en"]} · AH distilled', book["subtitle"]["en"], 1, body, crumbs)


# ---------------------------------------------------------------- level 0

def build_home(cat, site, concepts):
    h = site["home"]
    tiles = []
    for b in cat["books"]:
        meta = {l: (b["intro"].get(l) or b["intro"].get("en") or ({}, ""))[0] for l in LANGS}
        card = {l: meta[l].get("card", "") for l in LANGS}
        n = len(b["concept_ids"])
        tiles.append(f"""<a class="tile tile-{b['id']}" href="{b['id']}/index.html">
  <span class="tile-kind">{bi({'en': 'Book' if b['kind']=='book' else 'Talks', 'sl': 'Knjiga' if b['kind']=='book' else 'Predavanja'})} · {n} {bi(UI['concepts'])}</span>
  <span class="tile-title">{bi(b['title'])}</span>
  <span class="tile-sub">{bi(b['subtitle'])}</span>
  {f'<span class="tile-card">{bi(card)}</span>' if card['en'] else ''}
  <span class="tile-go">{bi(UI['open_book'])}</span>
</a>""")
    big = [c for c in concepts.values() if c.get("big")]
    bigcards = "".join(concept_card(c, f'{c["book"]["id"]}/{c["id"]}.html', show_book=True) for c in big)
    flow = "".join(f"<li>{bi(x)}</li>" for x in h["flow"])
    plan = "".join(f'<div class="week"><span class="t">{bi(x["t"])}</span><p>{bi(x)}</p></div>' for x in h["plan"])
    body = f"""<header class="page-head home-head">
  <p class="eyebrow">AH distilled · {bi(h['eyebrow'])}</p>
  <h1>{bi(h['title'])}</h1>
  <p class="lede">{bi(h['lede'])}</p>
</header>
<section class="home-sec">
  <h2>{bi(h['books_title'])}</h2>
  <div class="tiles">{''.join(tiles)}</div>
  <h3 class="flow-title">{bi(h['flow_title'])}</h3>
  <ol class="flow">{flow}</ol>
</section>
<section class="home-sec">
  <h2>{bi(h['big_title'])}</h2>
  <p class="sec-intro">{bi(h['big_lede'])}</p>
  <div class="cards">{bigcards}</div>
</section>
<section class="home-sec plan">
  <h2>{bi(h['plan_title'])}</h2>
  {plan}
</section>
<section class="home-sec guru">
  <h2>{bi(h['guru_title'])}</h2>
  <p>{bi(h['guru'])}</p>
  <p class="kb-links"><a href="kb/ah-distilled-kb.en.md">ah-distilled-kb.en.md</a> · <a href="kb/ah-distilled-kb.sl.md">ah-distilled-kb.sl.md</a> · <a href="kb/index.json">index.json</a></p>
</section>
<footer class="foot">{bi(h['footer'])}</footer>"""
    crumbs = '<span aria-current="page">AH distilled</span>'
    return page("AH distilled", h["lede"]["en"], 0, body, crumbs)


# ---------------------------------------------------------------- knowledge-base export

def build_kb(cat, concepts):
    index = {"name": "AH distilled", "description": "Alex Hormozi's business frameworks, distilled.",
             "languages": list(LANGS), "books": []}
    for l in LANGS:
        lines = [f"# AH distilled — knowledge base ({l.upper()})", "",
                 "Paraphrased study notes on Alex Hormozi's business frameworks. Each concept ends with how Alex would apply it.", ""]
        for b in cat["books"]:
            lines += [f"# {b['title'][l]} — {b['subtitle'][l]}", ""]
            intro = b["intro"].get(l) or b["intro"].get("en")
            if intro:
                if intro[0].get("thesis"):
                    lines += [f"**{intro[0]['thesis']}**", ""]
                lines += [re.sub(r"^(#+)", r"#\1", intro[1], flags=re.M), ""]
            for cid in b["concept_ids"]:
                c = concepts[cid]
                doc = c["docs"].get(l) or c["docs"].get("en")
                if not doc:
                    continue
                m = doc[0]
                lines += [f"## {m.get('title', c['title'][l])}", ""]
                lines += [f"- id: {cid}", f"- book: {b['title']['en']} / {c['section']['title']['en']}"]
                if m.get("term"):
                    lines.append(f"- original term: {m['term']}")
                if m.get("key"):
                    lines.append(f"- key: {m['key']}")
                if m.get("related"):
                    lines.append(f"- related: {', '.join(m['related'])}")
                lines += ["", m.get("card", ""), ""]
                body = re.sub(r"\s*\{#[^}]+\}", "", doc[1])
                body = re.sub(r"^(#+)", r"##\1", body, flags=re.M)
                lines += [body, ""]
        (KB / f"ah-distilled-kb.{l}.md").write_text("\n".join(lines), encoding="utf-8")
    for b in cat["books"]:
        bi_ = {"id": b["id"], "title": b["title"], "subtitle": b["subtitle"], "url": f"{b['id']}/", "sections": []}
        for s in b["sections"]:
            bi_["sections"].append({"id": s["id"], "title": s["title"], "concepts": [
                {"id": cid, "title": concepts[cid]["title"], "url": f"{b['id']}/{cid}.html",
                 "card": {l: field(concepts[cid], "card", l) for l in LANGS},
                 "key": {l: field(concepts[cid], "key", l) for l in LANGS},
                 "source": {l: f"kb/{b['id']}/{cid}.{l}.md" for l in LANGS if l in concepts[cid]["docs"]},
                 "ready": ready(concepts[cid])} for cid in s["concepts"]]})
        index["books"].append(bi_)
    (KB / "index.json").write_text(json.dumps(index, ensure_ascii=False, indent=1), encoding="utf-8")


def redirect(target):
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Moved · AH distilled</title>
<link rel="canonical" href="{target}"><meta http-equiv="refresh" content="0; url={target}">
</head><body><p>This page moved to <a href="{target}">{target}</a>.</p></body></html>
"""


def main():
    cat, site, concepts = load()
    load.site = site
    written = 0
    for b in cat["books"]:
        d = OUT / b["id"]
        d.mkdir(exist_ok=True)
        (d / "index.html").write_text(build_book(b, cat["books"], concepts), encoding="utf-8")
        ids = [cid for cid in b["concept_ids"] if ready(concepts[cid])]
        for i, cid in enumerate(ids):
            prev_c = concepts[ids[i - 1]] if i > 0 else None
            next_c = concepts[ids[i + 1]] if i + 1 < len(ids) else None
            (d / f"{cid}.html").write_text(build_concept(concepts[cid], prev_c, next_c, concepts), encoding="utf-8")
            written += 1
    (OUT / "index.html").write_text(build_home(cat, site, concepts), encoding="utf-8")
    for old, new in OLD_URLS.items():
        (OUT / old).write_text(redirect(new), encoding="utf-8")
    build_kb(cat, concepts)
    missing = [f"{c['book']['id']}/{cid}.{l}.md" for cid, c in concepts.items() for l in LANGS if l not in c["docs"]]
    print(f"built {written} concept pages, {len(cat['books'])} books")
    if missing:
        print("missing sources:", len(missing))
        for m in missing:
            print("  ", m)


if __name__ == "__main__":
    sys.exit(main())
