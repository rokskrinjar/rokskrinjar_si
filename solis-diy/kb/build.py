#!/usr/bin/env python3
"""Build the Skobi knowledge base for /api/solis.

Sources (solis-diy/kb/ and solis-diy/assets/):
  company.md        public facts about Solis Timber
  concept.md        what the concept is, market facts, concept prices
  diy.md            DIY woodworking knowledge base (species, products, 33 projects, finishing, Q&A)
  catalog.json      products, sections, species, prices, delivery (shared with the planner)
  projects.json     planner templates and idea prompts (shared with the guide)
  index.html, business.html   the English text of the pages, so Skobi can talk about what is on them
  economics.json    the economics page: the model in assets/econ.js is run with node for all scenarios
  /projects/experience.json, /projects.json   the author's public CV and projects (as on /projects/)

Output: repo-root/api/_solis_kb.js (export default "<markdown>").
Run: python3 solis-diy/kb/build.py   (no Python dependencies; needs node for the economics figures)
"""
import json
import re
import subprocess
from html.parser import HTMLParser
from pathlib import Path

KB = Path(__file__).resolve().parent
SITE = KB.parent
ROOT = SITE.parent


def catalog_md(cat):
    out = ["# CATALOG (the only products, species and sections the planner accepts)", "",
           "Use these ids in cutlist blocks. Sections are thickness x width in mm (planed sizes for planed/radial, nominal for sawn). "
           "Board products (planed, radial, dry, fresh) come in 3 m and 4 m stock and are cut to length; parts max 4000 mm. "
           "bsh and kvh are cut to length from long beams.", ""]
    for sid, s in cat["species"].items():
        out.append(f"- species `{sid}`: {s['en']} / {s['sl']}, price factor {s['factor']}, density {s['density']} kg/m³")
    out.append("")
    for p in cat["products"]:
        soon = " (COMING SOON, can be requested)" if p.get("soon") else ""
        out.append(f"## product `{p['id']}`: {p['en']['name']} / {p['sl']['name']}{soon}")
        out.append(f"- {p['en']['short']} Uses: {p['en']['use']}")
        out.append(f"- species: {', '.join('`'+s+'`' for s in p['species'])}; moisture {p['moisture']}")
        out.append(f"- sections: {', '.join(p['sections'])}")
        out.append(f"- part length {p['minLen']}–{p['maxLen']} mm" + (f"; stock lengths {', '.join(str(x) for x in p['stock'])} mm" if p.get("stock") else "; cut to length"))
        price = f"- concept price {p['price']} €/m³ incl. VAT"
        if p.get("benchmark"):
            price += f" (Slovenian DIY-store average about {p['benchmark']} €/m³)"
        if p.get("knotfree"):
            price += f"; knot-free +{int(p['knotfree']*100)} %"
        if p.get("ht"):
            price += f"; HT heat treatment +{p['ht']} €/m³"
        out.append(price)
        if p.get("edges"):
            out.append("- option: sharp or rounded edges")
        out.append("")
    out.append("## Extras (by-products)")
    for x in cat["extras"]:
        bulk = f", from {x['bulk']['from']} bags {x['bulk']['price']} €" if x.get("bulk") else ""
        out.append(f"- {x['en']} / {x['sl']}: {x['price']} €{bulk}")
    f = cat["fees"]
    out.append(f"\nFees: cutting {f['cut']} € per cut; orders under {f['smallOrder']['below']} € pay {f['smallOrder']['fee']} €.")
    return "\n".join(out)


def projects_md(proj):
    out = ["# PLANNER TEMPLATES", "",
           "Link a template as a markdown link, e.g. [Raised bed](planner.html#p=raised-bed). Parameters are in mm and can be set in the link, "
           "e.g. planner.html#p=raised-bed&L=3000&W=1200&H=600&v=larch.", ""]
    for p in proj["planner"]:
        params = ", ".join(
            f"{q['id']}={q['en']}" + (f" {q['min']}–{q['max']} (default {q['def']})" if "min" in q else f" options {q.get('options', [0, 1])} (default {q['def']})")
            for q in p["params"])
        variants = ", ".join(f"{v['id']} ({v['en']})" for v in p["variants"])
        out.append(f"## `{p['id']}`: {p['en']['title']} / {p['sl']['title']} (difficulty {p['level']}, {'outdoor' if p['where'] == 'out' else 'indoor'})")
        out.append(f"- {p['en']['intro']}")
        out.append(f"- params: {params}")
        out.append(f"- variants: {variants}")
        out.append(f"- tools: {p['en']['tools']} Finish: {p['en']['finish']}")
        out.append(f"- mistakes: {' '.join(p['en']['mistakes'])}")
        out.append("")
    out.append("Other ideas shown on the guide page (answer them yourself, with a cutlist block): " +
               "; ".join(f"{i['en']['title']} / {i['sl']['title']}" for i in proj["ideas"]))
    return "\n".join(out)


class PageText(HTMLParser):
    """English visible text of a page as light markdown: skips Slovenian spans, scripts, the header and the footer."""
    SKIP = {"script", "style", "svg", "header", "footer", "noscript", "form"}
    VOID = {"br", "img", "input", "meta", "link", "hr", "source", "wbr"}
    BLOCK = {"p", "div", "section", "li", "h1", "h2", "h3", "h4", "tr", "ol", "ul", "table", "dl", "dt", "dd"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack, self.skip, self.out = [], 0, []

    def handle_starttag(self, tag, attrs):
        if tag in self.VOID:
            if tag == "br" and not self.skip:
                self.out.append("\n")
            return
        cls = (dict(attrs).get("class") or "").split()
        hide = tag in self.SKIP or "sl" in cls or "vh" in cls
        self.stack.append(hide)
        self.skip += hide
        if not self.skip and tag in self.BLOCK:
            self.out.append("\n" + {"h1": "# ", "h2": "## ", "h3": "### ", "h4": "#### ", "li": "- "}.get(tag, ""))
        if not self.skip and tag in ("td", "th"):
            self.out.append(" | ")

    def handle_endtag(self, tag):
        if tag in self.VOID or not self.stack:
            return
        self.skip -= self.stack.pop()
        if not self.skip and tag in self.BLOCK:
            self.out.append("\n")

    def handle_data(self, data):
        if not self.skip:
            self.out.append(data)

    def text(self):
        t = "".join(self.out)
        t = re.sub(r"[ \t\r\f\v]+", " ", t)
        t = re.sub(r" *\n *", "\n", t)
        t = re.sub(r"^- *\n", "", t, flags=re.M)
        return re.sub(r"\n{3,}", "\n\n", t).strip()


def page_md(name, title):
    p = PageText()
    p.feed((SITE / name).read_text(encoding="utf-8"))
    return f"# PAGE {name}: {title}\n\nEnglish text as shown on the page (it is also shown in Slovenian). Sections drawn by scripts (charts, calculator) are summarised elsewhere in this knowledge base.\n\n{p.text()}"


def economics_md():
    """Run the model from assets/econ.js (the code between its Model and Rendering markers) for every scenario."""
    D = json.loads((SITE / "assets" / "economics.json").read_text(encoding="utf-8"))
    src = (SITE / "assets" / "econ.js").read_text(encoding="utf-8")
    model = src.split("// ---------- Model ----------", 1)[1].split("// ---------- Rendering ----------", 1)[0]
    js = ("var D = " + json.dumps(D) + ", scen = 'base', over = {};\n" + model +
          "var out = {}; ['low', 'base', 'high'].forEach(function (s) { scen = s; out[s] = [1, 2, 3, 4, 5].map(function (y) {"
          " var r = year(y); r.rows = r.rows.map(function (x) { return { id: x.c.id, active: x.active, share: x.share, vol: x.vol }; }); return r; }); });"
          "out.markets = D.countries.map(function (c) { return Object.assign({ id: c.id }, market(c)); });"
          "process.stdout.write(JSON.stringify(out));")
    R = json.loads(subprocess.run(["node", "-e", js], capture_output=True, check=True, encoding="utf-8").stdout)
    tr = lambda v: v.get("en") if isinstance(v, dict) else v
    M = lambda n: f"€{n / 1e9:.2f} bn" if abs(n) >= 1e9 else f"€{n / 1e6:.2f} M" if abs(n) >= 1e6 else f"€{n / 1e3:.0f} k"
    out = ["# PAGE economics.html: Economics and profitability (concept model, figures computed from the page's own model)", "",
           D.get("note", ""), "",
           "## Markets around Straža (per year, excl. VAT)",
           "country | DIY & hardware retail | timber spend | product fit | reach (share of people within a day's truck run) | serviceable market (SAM) | enters in year"]
    for c, m in zip(D["countries"], R["markets"]):
        out.append(f"{tr(c.get('name')) or c['id'].upper()} | {M(c['diy'])} | {M(m['timber'])} | {M(m['fit'])} | {c['reach'] * 100:.0f} % | {M(m['sam'])} | {c['from']}")
    out.append(f"Total SAM: {M(sum(m['sam'] for m in R['markets']))}.")
    out += ["", "## Scenarios"]
    for s, rows in ((s, R[s]) for s in ("low", "base", "high")):
        sc = D["scenarios"][s]
        out.append(f"### Scenario {s}: {tr(sc.get('note')) or ''}".rstrip(": "))
        out.append("year | markets | orders | m³ | revenue | contribution | marketing | staff | platform | build (amortised) | EBIT | cumulative EBIT")
        cum = 0
        for r in rows:
            cum += r["ebit"]
            mk = " ".join(x["id"].upper() for x in r["rows"] if x["active"])
            out.append(f"{r['y']} | {mk} | {r['orders']:,.0f} | {r['m3']:,.0f} | {M(r['rev'])} | {M(r['contrib'])} | {M(r['marketing'])} | {M(r['staff'])} | {M(r['platform'])} | {M(r['capex'])} | {M(r['ebit'])} | {M(cum)}")
        y5 = rows[-1]
        out.append(f"Year 5: EBIT margin {y5['ebit'] / y5['rev'] * 100:.1f} %, average order €{y5['aov']:.0f} incl. VAT, wholesale value of the same timber {M(y5['wholesaleOnly'])}.")
        out.append("")
    out.append("## Assumptions (editable with sliders on the page: " + ", ".join(tr(s.get("label")) or s["id"] for s in D["sliders"]) + ")")
    for k, a in D["assumptions"].items():
        extra = "; ".join(x for x in (tr(a.get("note")), tr(a.get("src"))) if isinstance(x, str) and x)
        v = f"{a['v'] * 100:g} %" if a.get("f") == "pct" else f"{a['v']:,}"
        out.append(f"- {tr(a.get('label')) or k}: {v}" + (f" ({extra})" if extra else ""))
    out += ["", "## How to read it"] + [f"- **{h}**: {t}" for h, t in D["reading"]["en"]]
    out += ["", "## Sources"] + [f"- {s}" for s in D["sources"]]
    return "\n".join(out)


def author_md():
    """The author's public CV, the same data /projects/ shows. Nothing private."""
    exp = json.loads((ROOT / "projects" / "experience.json").read_text(encoding="utf-8"))
    projects = json.loads((ROOT / "projects.json").read_text(encoding="utf-8"))
    out = ["# THE AUTHOR: Rok Skrinjar (public profile, as on rokskrinjar.si/projects/)", "",
           "Rok Skrinjar designed and built this concept. His site rokskrinjar.si/projects/ says: \"Business processes, digitalization, data analytics "
           "and business intelligence, and the practical use of AI. I lead projects where technology makes complex work simple.\"", "",
           "## Experience"]
    for e in exp["experience"]:
        out.append(f"- {', '.join(e['years'])}: {e['role']}, {e['company']}. {e['summary']}")
    out += ["", "## Education"] + [f"- {e['year']}: {e['title']}, {e['school']}" for e in exp["education"]]
    out += ["", "## Other projects on rokskrinjar.si/projects/"]
    for p in sorted(projects, key=lambda p: p["date"], reverse=True):
        out.append(f"- {p['title']} ({p['date']}): {p['description']} Link: /{p['slug']}/")
    out += ["", "## How this concept was made",
            "Rok researched the company, market prices and wood uses from public sources, wrote the guide and 13 projects in Slovenian and English, "
            "built the AI adviser (Skobi) on a knowledge base and the planner that turns a cut list into a production cutting plan, and the business "
            "case and economics model. He used AI throughout, as the business case's section \"What AI did here\" describes."]
    # From Rok's CV, published at his request (2026-10-28). The home address stays out.
    out += ["", "## Contact Rok Skrinjar (write them exactly as these markdown links)",
            "- E-mail: [rok.skrinjar@gmail.com](mailto:rok.skrinjar@gmail.com)",
            "- Phone: [+386 41 388 554](tel:+38641388554)",
            "- LinkedIn: [Rok Skrinjar](https://www.linkedin.com/in/dr-rok-skrinjar-737169b/)"]
    return "\n".join(out)


def main():
    cat = json.loads((SITE / "assets" / "catalog.json").read_text(encoding="utf-8"))
    proj = json.loads((SITE / "assets" / "projects.json").read_text(encoding="utf-8"))
    parts = [
        (KB / "concept.md").read_text(encoding="utf-8"),
        page_md("business.html", "Business case (\"Why this concept\")"),
        economics_md(),
        author_md(),
        page_md("index.html", "The guide"),
        catalog_md(cat),
        projects_md(proj),
        (KB / "company.md").read_text(encoding="utf-8"),
        (KB / "diy.md").read_text(encoding="utf-8"),
    ]
    text = "\n\n---\n\n".join(s.strip() for s in parts) + "\n"
    out = ROOT / "api" / "_solis_kb.js"
    out.write_text("// Generated by solis-diy/kb/build.py. Do not edit by hand.\nexport default " + json.dumps(text, ensure_ascii=False) + ";\n", encoding="utf-8")
    print(f"wrote {out.relative_to(ROOT)}: {len(text):,} characters")


if __name__ == "__main__":
    main()
