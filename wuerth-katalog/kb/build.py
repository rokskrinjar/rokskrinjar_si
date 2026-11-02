#!/usr/bin/env python3
"""Build Račko's knowledge base for /api/wuerth.

Sources (wuerth-katalog/):
  assets/catalog.json   trolleys, assortments, sets, modules, spots to reconcile (all from the PDF)
  kb/concept.md         what the concept is
  kb/wuerth.md          public facts about the company, the Group, evidence, law
  priloznosti.html, podatki.html, prodaja.html   the text of the pages, so Račko can talk about them
  /projects/experience.json, /projects.json      the author's public CV and projects (shared with Solis DIY's builder)

Output: repo-root/api/_wuerth_kb.js (export default "<markdown>").
Run: python wuerth-katalog/kb/build.py   (no dependencies)
"""
import importlib.util
import json
import re
from pathlib import Path

KB = Path(__file__).resolve().parent
SITE = KB.parent
ROOT = SITE.parent

# PageText and author_md live in the Solis DIY builder; reuse them rather than keep two copies.
_spec = importlib.util.spec_from_file_location("solis_build", ROOT / "solis-diy" / "kb" / "build.py")
solis = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(solis)

MADE = ("Rok read the 60-page PDF in text and image form, turned it into structured data with a source page on every record and a script that checks every code, "
        "measure and sum against the PDF, measured the foam sizes from the page geometry, and built on that the search, comparison, drawer configurator and Račko. "
        "He then ran the catalogue itself as an analysis (which sets the assortments reuse, how many drawers stay empty) and wrote the ranked list of options for sales analytics and AI. "
        "He used AI throughout, for reading, research, code and the assistant itself.")


def page_md(name, title):
    p = solis.PageText()
    p.feed((SITE / name).read_text(encoding="utf-8"))
    return f"# PAGE {name}: {title}\n\nText as shown on the page. Parts drawn by scripts are summarised elsewhere in this knowledge base.\n\n{p.text()}"


def pack(C, v, arts):
    """The page's first-fit packing (assets/common.js): bays of 8 units, biggest sets first."""
    sets = {s["art"]: s for s in C["seti"]}
    n = v["predali"] * v["polja"]
    bays = [8] * n
    for m in sorted((sets[a]["modul"] for a in arts), reverse=True):
        for i in range(n):
            if bays[i] >= m:
                bays[i] -= m
                break
    used = sum(1 for d in range(v["predali"]) if any(bays[b] < 8 for b in range(d * v["polja"], (d + 1) * v["polja"])))
    return used


COLOURS = {"3020": "red", "5010": "blue", "5012": "light blue", "7035": "light grey", "7047": "grey", "9017": "black"}


def colour(b):
    return f"RAL {b['ral']} ({COLOURS[b['ral']]})" if b["ral"] in COLOURS else "green Fendt Edition"


def options_md():
    """The scores sit in data attributes on priloznosti.html, so the page text does not carry them."""
    html = (SITE / "priloznosti.html").read_text(encoding="utf-8")
    rows = re.findall(r'<article id="o\d+"[^>]*data-v="(\d)" data-i="(\d)"[^>]*>.*?class="n">(\d+)</span><h3>(.*?)</h3>', html, re.S)
    return "\n".join(["# OPTIONS: scores (author's judgement, value and feasibility 1-5, in rank order; the author would start with 1, 2 and 4, because 3 first needs a check of what the Group already has and 4 is the base under everything else)"] +
                     [f"- {n}. {t}: value {v}, feasibility {i}" for v, i, n, t in rows])


def mm(v, k):
    return f"{v[k]} mm" if v.get(k) else "not stated"


def catalogue_md(C):
    src = C["vir"]
    sets = {s["art"]: s for s in C["seti"]}
    groups = {g["id"]: g["naziv"] for g in C["skupine"]}
    out = [f"# THE CATALOGUE: {src['naslov']} ({src['leto']}, {src['strani']} pages, without prices)", "",
           "Everything here comes from the PDF. Page numbers are the PDF's. Use the ids in the izbor block exactly as written here.", "",
           "## How foam and drawers work (page 25)",
           "- System carbon foam inserts fit all the catalogue's work trolleys and the system cases (page 25).",
           "- Foam sizes: " + "; ".join(f"{m['oznaka']} = {m['mere']} ({m['opis']})" for m in C["moduli"]) + ".",
           "- A 8.4.1 module fills one bay. Standard, Compact and Basic 8.4 drawers have one bay. Basic 8.8 and WE have two. WE XXL has three (layout seen on pages 11 and 24).",
           "- A bay takes four quarters: for example two 4.4.1 sets, or one 4.4.1 and two 2.4.1. Foam size per set was measured from the catalogue's layout, it is not printed as text.",
           "- The catalogue does not say how many drawers have which height, whether foam behaves differently in deep drawers, or what a set weighs.",
           "- Measures are as printed; the catalogue does not say whether the width includes the handle.", "",
           "## Trolleys", ]
    for v in C["vozicki"]:
        out.append(f"### {v['naziv']} (id {v['id']}, page {v['stran']})")
        out.append(f"- Size: width {mm(v, 'sirina')}, depth {mm(v, 'globina')}, height {mm(v, 'visina')}.")
        d = f"{v['predali']} drawers" + (f", {v['izvlek']}" if v["izvlek"] else "")
        if v["predal"]:
            d += f", inside {v['predal'][0]} x {v['predal'][1]} mm, heights {v['visine'][0]} / {v['visine'][1]} mm"
        out.append(f"- {d}; bays per drawer {v['polja']}, bays in all {v['predali'] * v['polja']}.")
        load = lambda n: f"{n} kg" if n else "not stated"
        out.append(f"- Load: drawer {load(v['nosilnost_predala'])}, total {load(v['nosilnost_skupaj'])}.")
        if v["kolesa"]:
            out.append(f"- Wheels: {v['kolesa']}. Locking: {v['zapiranje']}. Opening: {v['odpiranje']}.")
        out.append("- Features: " + "; ".join(v["lastnosti"]) + ".")
        out.append("- Codes (empty trolley): " + "; ".join(f"{b['art']} {colour(b)}" + (f", {b['opomba']}" if b.get("opomba") and b["ral"] != "FENDT" else "") for b in v["barve"]) + ".")
        if v["dodatki"]:
            out.append("- Accessories: " + "; ".join(f"{x['art']} {x['naziv']}" for x in v["dodatki"]) + ".")
        if v.get("rezervni_deli"):
            r = v["rezervni_deli"]
            out.append(f"- Spare parts (page {r['stran']}, drawing without names, description read from the drawing): " + "; ".join(f"{x['art']} {x['risba']}" for x in r["deli"]) + ".")
    out += ["", "## Assortments (trolley with tools; the catalogue gives only the empty trolley's code)"]
    for a in C["sestavi"]:
        v = next(x for x in C["vozicki"] if x["id"] == a["voz"])
        used = pack(C, v, [x[0] for x in a["seti"]])
        total = sum(x[1] for x in a["seti"])
        note = "" if total == a["kosov"] else f" (sets as labelled on the page add up to {total}, see the spots to reconcile)"
        out.append(f"- {a['naziv']} (id {a['id']}, page {a['stran']}, trolley {a['art']}, {a['kosov']} pieces{note}): foam in {used} of {v['predali']} drawers. Sets: " +
                   "; ".join(f"{x[0]} {sets[x[0]]['naziv']} " + (f"{x[1]}-part" if x[1] == sets[x[0]]["kosov"] else f"labelled {x[1]}-part on this page, {sets[x[0]]['kosov']} pieces is the value that holds elsewhere") for x in a["seti"]) + ".")
    out += ["", "## Foam sets (art code, name, pieces, foam size, page)"]
    for g in C["skupine"]:
        out.append(f"### {g['naziv']}")
        for s in (x for x in C["seti"] if x["skupina"] == g["id"]):
            mod = next(m["oznaka"] for m in C["moduli"] if m["id"] == s["modul"])
            line = f"- {s['art']} {s['naziv']}" + (f", {s['kosov']} pieces" if s["kosov"] else "") + f", foam {mod}, page {s['stran']}"
            if s.get("vsebina"):
                line += ". Contents: " + "; ".join(f"{r['a']} {r['n']}" for r in s["vsebina"])
            else:
                line += ". No contents table in the catalogue"
            out.append(line + ".")
    out += ["", "## Spots in the catalogue to reconcile (mention only when relevant to the answer, kindly, as something to confirm)"]
    out += [f"- {u['kaj']} (page {u['stran']}): {u['opis']} {u['predlog']}" for u in C["usklajevanje"]]
    out += ["", "## Words the trade uses",
            "ragla, cegetna, račna = račna ključ; šraufenciger, odvijač = izvijač; cange, kliješta = klešče; nasadni, gedora, orehi = natični ključi; seger, zeger = klešče za varovalne obročke; "
            "inbus, hex, šestrob = imbus; torx = TX; udarni ključ, udarni nastavek = strojni natični (but set 0965 905 501 has impact screwdrivers, udarni izvijači); elektro, izolirano = look at the sets marked VDE; dleto = sekač; turpija = pila; kolica, servisni voziček, orodni voziček = voziček za orodje."]
    return "\n".join(out)


def main():
    C = json.loads((SITE / "assets" / "catalog.json").read_text(encoding="utf-8"))
    parts = [
        (KB / "concept.md").read_text(encoding="utf-8"),
        catalogue_md(C),
        page_md("priloznosti.html", "Options for sales analytics and AI (\"Zakaj ta koncept\")"),
        options_md(),
        page_md("prodaja.html", "The sales view"),
        page_md("podatki.html", "From the PDF to data"),
        solis.author_md(exclude=("solis-diy", "aktiva-ai", "wuerth-katalog"), made=MADE),
        (KB / "wuerth.md").read_text(encoding="utf-8"),
    ]
    text = "\n\n---\n\n".join(s.strip() for s in parts) + "\n"
    out = ROOT / "api" / "_wuerth_kb.js"
    out.write_text("// Generated by wuerth-katalog/kb/build.py. Do not edit by hand.\nexport default " + json.dumps(text, ensure_ascii=False) + ";\n", encoding="utf-8")
    print(f"wrote {out.relative_to(ROOT)}: {len(text):,} characters")


if __name__ == "__main__":
    main()
