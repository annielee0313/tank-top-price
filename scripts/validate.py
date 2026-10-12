"""Sanity checks for the tank dataset. Exits non-zero on any failure (used in CI).

  python3 scripts/validate.py            # everyday check (mock rows allowed)
  python3 scripts/validate.py --release  # pre-publish: no mock rows, all verified
"""
import csv
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TANKS = ROOT / "data/manual/tanks.csv"
FABRICS = ROOT / "data/reference/fabric_costs.csv"
WAGES = ROOT / "data/reference/wages.csv"


def read(path):
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def num(value):
    return float(value) if value.strip() else 0.0


def main():
    release = "--release" in sys.argv
    tanks, fabrics, wages = read(TANKS), read(FABRICS), read(WAGES)
    known_fibers = {r["fiber"].strip().lower() for r in fabrics}
    known_countries = {r["country"].strip() for r in wages}
    errors, seen = [], set()

    bases = {r["wage_basis"] for r in wages}
    if len(bases) > 1:
        errors.append(f"wages.csv mixes wage bases {sorted(bases)} — label each bar or pick one")

    for i, t in enumerate(tanks, start=2):  # row 1 is the header
        tid = t["tank_id"] or f"row {i}"
        if t["status"] == "excluded":
            continue
        if tid in seen:
            errors.append(f"{tid}: duplicate tank_id")
        seen.add(tid)

        pcts = {f: num(t[f"{f}_pct"]) for f in ("cotton", "polyester", "elastane", "other")}
        total = sum(pcts.values())
        if abs(total - 100) > 0.5:
            errors.append(f"{tid}: fiber percentages sum to {total}, not 100")

        if num(t["price_listed"]) <= 0:
            errors.append(f"{tid}: price_listed must be > 0")
        if t["currency"] != "USD":
            errors.append(f"{tid}: currency is {t['currency']!r}, expected USD")

        needed = {
            "cotton": f"cotton_t{int(num(t['cotton_tier']) or 1)}",
            "polyester": "polyester",
            "elastane": "elastane",
            "other": t["other_fibers"].strip().lower(),
        }
        for fiber, key in needed.items():
            if pcts[fiber] > 0 and key not in known_fibers:
                errors.append(f"{tid}: {key or 'other (unnamed)'} has no row in fabric_costs.csv")

        country = t["country_of_manufacture"].strip()
        if country and country not in known_countries:
            errors.append(f"{tid}: country {country!r} has no row in wages.csv")

        if t["status"] == "verified" and not (t["archive_url"] and t["verified_date"]):
            errors.append(f"{tid}: verified rows need archive_url and verified_date")

        if release:
            if t["is_mock"].strip().lower() == "true":
                errors.append(f"{tid}: still mock data")
            elif t["status"] != "verified":
                errors.append(f"{tid}: not verified")

    if release:
        for r in fabrics + wages:
            if r["source_name"] in ("", "MOCK"):
                errors.append(f"reference row {r.get('fiber') or r.get('country')}: needs a real source")

    for e in errors:
        print(f"✗ {e}")
    print(f"{len(tanks)} tanks checked, {len(errors)} problem(s).")
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
