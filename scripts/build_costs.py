"""Build data/processed/tanks.json (and the site's copy) from the CSVs.

Run from the repo root:  python3 scripts/build_costs.py
"""
import csv
import json
import shutil
from datetime import date
from pathlib import Path

import config

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data/processed/tanks.json"
SITE_OUT = ROOT / "site/public/data/tanks.json"


def read(path):
    with open(ROOT / path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def num(value):
    return float(value) if value and value.strip() else 0.0


def truthy(value):
    return value.strip().lower() == "true"


def composition(t):
    """Fiber bands bottom-to-top, with the cost key and CSS class for each."""
    tier = int(num(t["cotton_tier"]) or 1)
    cotton_name = {"unspecified": "Cotton", "conventional": "Cotton"}.get(
        t["cotton_type"], f"{t['cotton_type'].title()} cotton"
    )
    bands = [
        ("cotton", f"cotton_t{tier}", f"cotton-{tier}", cotton_name, num(t["cotton_pct"])),
        ("other", t["other_fibers"].strip().lower(), "other",
         t["other_fibers"].strip().title() or "Other", num(t["other_pct"])),
        ("polyester", "polyester", "polyester", "Polyester", num(t["polyester_pct"])),
        ("elastane", "elastane", "elastane", "Elastane", num(t["elastane_pct"])),
    ]
    return [
        {"fiber": fiber, "cost_key": key, "cls": cls, "label": label, "pct": pct}
        for fiber, key, cls, label, pct in bands
        if pct > 0
    ]


def main():
    fabrics = {r["fiber"]: r for r in read("data/reference/fabric_costs.csv")}
    wages = {}
    for w in read("data/reference/wages.csv"):
        hourly = num(w["wage_monthly_local"]) / config.HOURS_PER_MONTH / (num(w["fx_rate_to_usd"]) or 1)
        wages[w["country"]] = {**w, "hourly": round(hourly, 2)}

    tanks = []
    for t in read("data/manual/tanks.csv"):
        if t["status"] == "excluded":
            continue
        price = num(t["price_listed"])
        comp = composition(t)
        cost_per_yard = sum(c["pct"] / 100 * num(fabrics[c["cost_key"]]["cost_per_yard_mid"]) for c in comp)
        material = cost_per_yard * config.YARDS_BASE

        wage = wages.get(t["country_of_manufacture"])
        hourly = wage["hourly"] if wage else None
        labor = lambda minutes: (minutes / 60 * hourly) if hourly else None  # noqa: E731
        labor_base = labor(config.SAM_MINUTES_BASE)

        tanks.append({
            "id": t["tank_id"],
            "brand": t["brand"],
            "product": t["product_name"],
            "price": price,
            "country": t["country_of_manufacture"] or None,
            "country_caveat": truthy(t["country_caveat"]),
            "caveat_note": t["caveat_note"] or None,
            "cotton_pct": num(t["cotton_pct"]),
            "cotton_tier": int(num(t["cotton_tier"]) or 0),
            "construction": t["fabric_construction"] or None,
            "composition": comp,
            "material_cost": round(material, 2),
            "material_cost_high": round(cost_per_yard * config.YARDS_HIGH, 2),
            "wage_hourly": hourly,
            "labor_cost": round(labor_base, 2) if hourly else None,
            "labor_cost_low": round(labor(config.SAM_MINUTES_LOW), 2) if hourly else None,
            "labor_cost_high": round(labor(config.SAM_MINUTES_HIGH), 2) if hourly else None,
            "material_share": material / price,
            "labor_share": (labor_base / price) if hourly else 0,
            "retail_gap": round(price - material - (labor_base or 0), 2),
            "is_mock": truthy(t["is_mock"]),
        })

    out = {
        "meta": {
            "generated": date.today().isoformat(),
            "is_mock": any(t["is_mock"] for t in tanks),
            "assumptions": {
                "yards_base": config.YARDS_BASE,
                "yards_high": config.YARDS_HIGH,
                "sam_minutes": [config.SAM_MINUTES_LOW, config.SAM_MINUTES_BASE, config.SAM_MINUTES_HIGH],
                "hours_per_month": config.HOURS_PER_MONTH,
            },
        },
        "tanks": sorted(tanks, key=lambda t: t["price"]),
        "fabrics": [
            {"fiber": k, "label": f["label"], "low": num(f["cost_per_yard_low"]),
             "mid": num(f["cost_per_yard_mid"]), "high": num(f["cost_per_yard_high"]), "method": f["method"]}
            for k, f in fabrics.items()
        ],
        "wages": sorted(
            [{"country": c, "hourly": w["hourly"], "basis": w["wage_basis"], "note": w["notes"] or None}
             for c, w in wages.items()],
            key=lambda w: w["hourly"],
        ),
    }

    OUT.write_text(json.dumps(out, indent=2))
    SITE_OUT.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy(OUT, SITE_OUT)
    print(f"Wrote {len(tanks)} tanks → {OUT.relative_to(ROOT)} and {SITE_OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
