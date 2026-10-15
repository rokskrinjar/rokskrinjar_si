"""Sync the "Recent" choice from Rok's local Excel file into projects.json.

projects-settings.xlsx (repo root, git-ignored locally) has one row per project.
Its "Recent" column (Yes/No) decides which projects get a big card under Recent
on rokskrinjar.si/projects/. Projects that exist in projects.json but not yet in
the Excel file are added to it with their current setting.

Usage:  python tools/sync_projects.py
"""
import json
import sys
from pathlib import Path

from openpyxl import Workbook, load_workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.worksheet.datavalidation import DataValidation

ROOT = Path(__file__).resolve().parent.parent
JSON = ROOT / "projects.json"
XLSX = ROOT / "projects-settings.xlsx"
SHEET = "Projects"
HEADERS = ["Recent", "Title", "Date", "Slug", "Link"]
YES = {"yes", "y", "true", "1", "x", "da"}


def to_bool(v):
    return str(v).strip().lower() in YES if v is not None else False


def link(p):
    return "https://rokskrinjar.si" + (p.get("href") or f"/{p['slug']}/")


def read_settings():
    """Return {slug: recent} from the Excel file, or {} if it doesn't exist yet."""
    if not XLSX.exists():
        return {}
    ws = load_workbook(XLSX, data_only=True)[SHEET]
    cols = {str(c.value).strip(): i for i, c in enumerate(ws[1]) if c.value}
    out = {}
    for row in ws.iter_rows(min_row=2, values_only=True):
        slug = row[cols["Slug"]] if "Slug" in cols else None
        if slug:
            out[str(slug).strip()] = to_bool(row[cols["Recent"]])
    return out


def write_settings(items, recent):
    wb = Workbook()
    ws = wb.active
    ws.title = SHEET
    ws.append(HEADERS)
    for p in items:
        ws.append(["Yes" if recent[p["slug"]] else "No", p.get("title", ""), p.get("date", ""), p["slug"], link(p)])
    head = PatternFill("solid", fgColor="1A1A1A")
    for c in ws[1]:
        c.font = Font(bold=True, color="FFFFFF")
        c.fill = head
        c.alignment = Alignment(vertical="center")
    for col, width in zip("ABCDE", (10, 40, 12, 18, 44)):
        ws.column_dimensions[col].width = width
    ws.freeze_panes = "A2"
    dv = DataValidation(type="list", formula1='"Yes,No"', allow_blank=False)
    ws.add_data_validation(dv)
    dv.add(f"A2:A{max(ws.max_row, 2) + 200}")
    for row in ws.iter_rows(min_row=2, max_col=1):
        row[0].fill = PatternFill("solid", fgColor="EEF5FC")
    note = wb.create_sheet("How to use")
    for line in [
        "Recent = Yes  →  big card under Recent on rokskrinjar.si/projects/",
        "Recent = No   →  compact row under More projects",
        "Only the Recent column is read. Title, Date and Link are filled in from projects.json.",
        "After saving, double-click tools\\sync-projects.bat to publish.",
    ]:
        note.append([line])
    note.column_dimensions["A"].width = 90
    wb.save(XLSX)


def main():
    items = json.loads(JSON.read_text(encoding="utf-8"))
    settings = read_settings()

    changed, added = [], []
    recent = {}
    for p in items:
        slug = p["slug"]
        if slug in settings:
            recent[slug] = settings[slug]
            if bool(p.get("recent")) != recent[slug]:
                changed.append(f"{p.get('title', slug)}: Recent = {'Yes' if recent[slug] else 'No'}")
        else:
            recent[slug] = bool(p.get("recent"))
            added.append(p.get("title", slug))
        p["recent"] = recent[slug]

    unknown = sorted(set(settings) - {p["slug"] for p in items})

    if changed:
        JSON.write_text("[\n" + ",\n".join("  " + json.dumps(p, ensure_ascii=False) for p in items) + "\n]\n", encoding="utf-8", newline="\n")
    try:
        write_settings(items, recent)
    except PermissionError:
        # projects.json is already updated; only the Excel refresh (titles, new rows) is skipped.
        print(f"  ! {XLSX.name} is open in Excel, so new projects weren't added to it. Close it and run again to refresh it.")

    for c in changed:
        print("  changed:", c)
    for a in added:
        print("  added to Excel:", a)
    for u in unknown:
        print(f"  ! '{u}' is in Excel but not in projects.json, dropped from the list")
    if not (changed or added or unknown):
        print("  No changes.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
