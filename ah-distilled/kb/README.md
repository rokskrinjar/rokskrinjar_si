# AH distilled — knowledge base

Source of truth for the AH distilled site and for the future "Ask Alex" business adviser.

## Structure

```
kb/
  catalog.yaml              books -> sections -> concepts (ids, titles EN/SL, "big" ideas)
  site.yaml                 home page texts
  <book>/_book.en.md        book introduction (English, primary)
  <book>/_book.sl.md        Slovenian translation
  <book>/<concept>.en.md    concept (English, primary)
  <book>/<concept>.sl.md    Slovenian translation
  build.py                  generates the HTML pages and the exports below
  ah-distilled-kb.en.md     generated: the whole knowledge base in one file
  ah-distilled-kb.sl.md     generated
  index.json                generated: machine-readable catalogue
```

Books: `offers` ($100M Offers), `leads` ($100M Leads), `money` ($100M Money Models), `sales` (Alex's talks: selling and scaling).

## Concept format

Frontmatter: `id`, `book`, `title`, `term` (Alex's original term), `card`, `key`, `apply`, `related`.

Sections, always in this order and with these ids:

| id | EN heading | SL heading |
|---|---|---|
| gist | The gist | Bistvo |
| how | How it works | Kako deluje |
| examples | Examples | Primeri |
| mistakes | Common mistakes | Pogoste napake |
| alex | How Alex would apply it | Kako bi to uporabil Alex |
| worksheet | Worksheet | Delovni list |

The `alex` section holds Alex's default moves and diagnostic questions. It is what the adviser leans on most.

## Build

```
pip install markdown pyyaml
python3 ah-distilled/kb/build.py
```

Pages: `ah-distilled/index.html` (overview), `ah-distilled/<book>/index.html` (book), `ah-distilled/<book>/<concept>.html` (concept).

All content is a paraphrase for personal study. Examples are invented.
