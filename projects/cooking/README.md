# Moja kuharska knjiga: kako dodajati recepte

Spletna stran: https://rokskrinjar.si/projects/cooking/
Repozitorij (edini vir resnice): https://github.com/rokskrinjar/rokskrinjar_si, veja `main`, mapa `projects/cooking/`

Vsak recept in vsak zapis kuharskega znanja je **ena Markdown datoteka**. Stran sama najde vse datoteke v mapah. Seznama ali kode ni treba urejati. Ko je datoteka na veji `main`, se na strani pokaže v približno 1–2 minutah.

```
projects/cooking/
├── recipes/      # en recept = ena datoteka
├── knowledge/    # en zapis kuharskega znanja = ena datoteka
├── photos/       # fotografije (neobvezno)
└── README.md     # ta navodila
```

## Ime datoteke

- Male črke, brez šumnikov in presledkov, besede ločene z `-`: `piscancji-medaljoni-veloute.md`
- Ime (brez `.md`) je trajni naslov recepta: `?r=piscancji-medaljoni-veloute`. Pozneje ga ne spreminjaj, sicer se povezave pokvarijo.
- Datoteke, ki se začnejo s `_` ali `.`, stran ignorira.

## Recept: `recipes/<ime>.md`

```markdown
---
title: Polno ime recepta
date: 2026-10-14            # datum prve priprave (ali zapisa predloga), LLLL-MM-DD
category: Glavne jedi       # ena kategorija; filtri na strani nastanejo iz teh vrednosti
tags: [piščanec, omake]     # neobvezno
status: preizkuseno         # preizkuseno | predlog | v-razvoju
rating:                     # neobvezno, število 1–5; prazno, če ocene ni
verdict: Bilo je božansko.  # neobvezno, moja ocena z besedami, dobesedno
time: Približno 30 minut    # neobvezno, prosto besedilo
servings: Za 2 osebi        # neobvezno, prosto besedilo
photos: []                  # neobvezno, npr. [photos/ime-1.jpg]
knowledge: []               # neobvezno, imena datotek iz knowledge/ brez .md
---

## Sestavine

- …

## Priprava

1. …

## Kaj je pomembno

- …

## Različice

- …

## Dnevnik priprave

- **14. 10. 2026:** kako je šlo, kaj sem spremenil, kaj ni zabeleženo.
```

- Naslova `## Sestavine` in `## Priprava` naj ostaneta točno tako, saj se na strani spremenita v seznam za odkljukanje med kuhanjem.
- `## Kaj je pomembno`, `## Različice` in `## Dnevnik priprave` so neobvezni; dodaš lahko tudi druge razdelke.
- Kategorije za zdaj: `Glavne jedi`. Novo dodaj le, kadar res potrebuješ, in jo vedno zapiši enako.

## Kuharsko znanje: `knowledge/<ime>.md`

```markdown
---
title: Ime tehnike ali spoznanja
date: 2026-10-14
tags: [omake, tehnike]
recipes: []                 # neobvezno, imena receptov iz recipes/ brez .md
---

Razlaga, triki, opozorila.
```

## Fotografije

Datoteko daj v `photos/` (npr. `photos/piscancji-medaljoni-1.jpg`, širina do ~1600 px, JPG) in jo dodaj v `photos:` pri receptu. Lahko tudi z opisom: `photos: [{src: photos/ime-1.jpg, alt: Kratek opis slike}]`.

## Pravila

1. **Ničesar si ne izmišljuj.** Brez izmišljenih količin, časov, ocen ali fotografij. Česar ne vem, izpusti ali zapiši »ni zabeleženo«.
2. **Ločuj preizkušeno od predlogov.** Recept, ki ga še nisem skuhal, ima `status: predlog`. Ko ga skuham, ga spremeni v `preizkuseno` in dodaj vnos v dnevnik.
3. **Ne briši zgodovine.** Pri ponovni pripravi dodaj nov vnos v `## Dnevnik priprave`. Če je nova različica boljša, jo zapiši pod `## Različice` ali posodobi postopek in v dnevniku napiši, kaj se je spremenilo.
4. **Moje ocene so dobesedne.** `verdict` je moj stavek, `rating` samo, če sem dal številko.
5. **Znanje brez samostojnega recepta** gre v `knowledge/` in se poveže z recepti prek `knowledge:` oziroma `recipes:`.
6. **Ena sprememba, en commit**, npr. `Dodaj recept: Piščančji medaljoni` ali `Posodobi recept: …`.

## Navodila za ChatGPT

Spodnje besedilo kopiraj v navodila ChatGPT projekta (ali na začetek pogovora):

> Moja kuharska knjiga je v GitHub repozitoriju `rokskrinjar/rokskrinjar_si`, veja `main`, mapa `projects/cooking/`. Preden karkoli dodaš, preberi `projects/cooking/README.md` in ga natančno upoštevaj. Ko rečem »Dodaj ta recept v mojo kuharsko knjigo«: (1) preveri, ali recept že obstaja v `projects/cooking/recipes/`; če obstaja, ga posodobi in dodaj vnos v dnevnik, sicer ustvari novo datoteko po predlogi iz README; (2) splošna spoznanja iz pogovora zapiši v `projects/cooking/knowledge/` in jih poveži z receptom; (3) ne izmišljuj si podatkov, ocen ali fotografij, česar ne vem, izpusti; (4) spremembo predlagaj kot commit ali pull request na `main` z jasnim sporočilom; (5) na koncu mi povej, katere datoteke si dodal ali spremenil, in povezavo `https://rokskrinjar.si/projects/cooking/?r=<ime>`.

Če ChatGPT nima pravice pisanja v repozitorij, naj pripravi celotno vsebino datoteke. Dodaš jo ročno na GitHubu: mapa `projects/cooking/recipes/` → *Add file* → *Create new file* → ime `<ime>.md` → prilepi → *Commit changes* na `main`.

## Preverjanje

- Po commitu na `main` počakaj 1–2 minuti in odpri `https://rokskrinjar.si/projects/cooking/`.
- Če se recept ne pokaže: preveri, da je datoteka v `recipes/`, da se konča z `.md` in da je glava med `---` veljaven YAML (dvopičje v besedilu daj v narekovaje, npr. `verdict: "Odlično: ponovim"`).
- Seznam receptov stran prebere prek GitHub API. Brskalnik ga hrani 5 minut, zato je včasih treba stran osvežiti.
