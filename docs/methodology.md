# Methodology & known issues

How each number in the piece is produced, and how each problem found in the pitch is handled.
Every assumption lives in [`scripts/config.py`](../scripts/config.py), the data in [`data/`](../data), and the math in [`scripts/build_costs.py`](../scripts/build_costs.py).

```
material_cost = Σ(fiber % × fabric $/yard) × YARDS_BASE
labor_cost    = (SAM_MINUTES / 60) × hourly garment wage in the country of manufacture
retail_gap    = price − material_cost − labor_cost
```

---

## 1. Brandy Melville price mismatch

**Problem:** the pitch lists Brandy's tank at both $24 and $14, and the "$676 apart" line depends on which is right.

**Fix (already built):** no number is typed into the story copy by hand. The copy uses tokens such as `{{price:brandy-melville}}` and `{{gap:brandy-melville:the-row}}`, which `site/src/main.js` fills from `tanks.json`. Change the price once in `tanks.csv` and every sentence updates with it.

**To do on collection day:** record the full (non-sale) price on the US site and add an archive link. If Brandy sells more than one plain tank, pick the one closest to the others in cut and fabric, and give the reason in `notes`.

## 2. How much fabric a tank uses

**Problem:** the mockup's material costs assume 1 yard, but the annotation says 1 to 1.5 yards.

**Fix (already built):** `YARDS_BASE = 1.0` drives the story numbers. `YARDS_HIGH = 1.5` gives an upper bound, which the detail card shows as "up to $X at 1.5 yd". Both values live in config, so if you find a better source, change one line.

**To do:** cite a source for the yardage, such as a pattern-yield reference or a costing breakdown for a basic knit top.

## 3. Elastane isn't sold by the yard on its own

**Problem:** elastane is 2–8% of a blended knit, so "elastane fabric per yard" doesn't exist on the market.

**Fix:** keep the readable fiber-weighted model for the story, but **back-solve** elastane's per-yard figure from real blended fabrics:

```
elastane $/yd = (95/5 poly-spandex jersey $/yd − 0.95 × 100% polyester jersey $/yd) / 0.05
```

That makes elastane's figure what the market actually charges extra for stretch. The `method` column in `fabric_costs.csv` marks the row `implied_from_blend`.

**To do:** collect 2–3 matched pairs (e.g. 100% poly jersey vs. 95/5 poly-spandex jersey from the same supplier), compute the implied value, and use the median.

## 4. Labor cost depends on how long a tank takes to sew

**Problem:** labor = sewing time × wage, but no sewing time was sourced.

**Fix (already built):** sewing time is stored as **standard allowed minutes (SAM)** with low, base and high values (`SAM_MINUTES_*` in config). The story uses the base value, and the detail card shows labor as a range (e.g. "$1.27–$2.38"). The placeholder values (8 / 10 / 15 min) are **unsourced mock values**.

**To do:** find one citable SAM for a basic sleeveless knit top, such as an apparel-engineering SAM table or a published garment costing breakdown, and add the citation to `SAM_SOURCE`.

## 5. Mixing wage types

**Problem:** average garment earnings (ILOSTAT) and statutory minimum wages (WageIndicator) are different measures. Putting both in one bar chart would compare unlike things.

**Fix (already built):** each row in `wages.csv` has a `wage_basis` column, and `validate.py` **fails** if the file mixes bases. Prefer ILOSTAT mean earnings for ISIC division 14 (wearing apparel). If a country needs the fallback, either switch every country to minimum wages or label that bar.

## 6. "Made in Italy" isn't the full story

**Problem:** Brandy Melville's label says Italy, but reporting (NYT 2024; HBO documentary) points to Prato's informal workshops.

**Fix (already built):** `country_caveat` and `caveat_note` in `tanks.csv` add an asterisk to the flag in the story, the grid and the detail card, with the note shown in the card. Italian wages are labelled as a floor estimate.

**To do:** add links to the reporting in `caveat_note`, and agree the wording with your editor.

## 7. Cotton grades

Cotton is shaded by tier: 1 = conventional / unspecified, 2 = organic / combed, 3 = pima / supima / Egyptian. Each tier has its own cost per yard. The Row says only "100% cotton", so it is tier 1 until proven otherwise. That probably **understates** its fabric cost. Say this in the copy, because it slightly weakens the "0.55%" punchline.

---

## Pre-publish checklist

```bash
python3 scripts/validate.py --release   # fails while any mock data or MOCK sources remain
```
