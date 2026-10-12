"""Sanity checks for the tank dataset. Exits non-zero on any failure (used in CI)."""
import csv
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TANKS = ROOT / "data/manual/tanks.csv"
FABRICS = ROOT / "data/reference/fabric_costs.csv"
WAGES = ROOT / "data/reference/wages.csv"

FIBER_COLS = {"cotton_pct": "cotton", "polyester_pct": "polyester", "elastane_pct": "elastane"}


def read(path):
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def num(value):
    return float(value) if value.strip() else 0.0


def main():
    tanks, fabrics, wages = read(TANKS), read(FABRICS), read(WAGES)
    known_fibers = {r["fiber"].strip().lower() for r in fabrics}
    known_countries = {r["country"].strip() for r in wages}
    errors, seen = [], set()

    for i, t in enumerate(tanks, start=2):  # row 1 is the header
        tid = t["tank_id"] or f"row {i}"
        if t["status"] == "excluded":
            continue
        if tid in seen:
            errors.append(f"{tid}: duplicate tank_id")
        seen.add(tid)

        total = sum(num(t[c]) for c in FIBER_COLS) + num(t["other_pct"])
        if abs(total - 100) > 0.5:
            errors.append(f"{tid}: fiber percentages sum to {total}, not 100")

        if num(t["price_listed"]) <= 0:
            errors.append(f"{tid}: price_listed must be > 0")
        if t["currency"] != "USD":
            errors.append(f"{tid}: currency is {t['currency']!r}, expected USD")

        for col, fiber in FIBER_COLS.items():
            if num(t[col]) > 0 and fiber not in known_fibers:
                errors.append(f"{tid}: {fiber} has no row in fabric_costs.csv")

        country = t["country_of_manufacture"].strip()
        if country and country not in known_countries:
            errors.append(f"{tid}: country {country!r} has no row in wages.csv")

        if t["status"] == "verified" and not (t["archive_url"] and t["verified_date"]):
            errors.append(f"{tid}: verified rows need archive_url and verified_date")

    for e in errors:
        print(f"✗ {e}")
    print(f"{len(tanks)} tanks checked, {len(errors)} problem(s).")
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
