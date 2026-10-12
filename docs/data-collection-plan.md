# Data Collection Plan — *Why Similar Tank Tops Can Cost $5 — or $700*

Goal: a small, fully sourced dataset of **18 plain white tank tops** (fallback: 8–10). It has to support every scroll trigger:

| Scene | Data it needs |
|---|---|
| 1–2 Shein vs. The Row | price, composition |
| 3 Cost per yard bar | `fabric_costs.csv` |
| 4–5 Material cost + donut | composition × cost/yard × yards |
| 6–7 Brandy vs. The Row | price, composition, country |
| 8 Wage by country bar | `wages.csv` |
| 9–11 Full grid, sort, tooltip, Est Cost view | everything above + labor estimate |

---

## 1. The four datasets

### 1a. `data/manual/tanks.csv`: one row per product (the core dataset)

| Column | Example | Notes |
|---|---|---|
| `tank_id` | `the-row-frankie` | slug, stable forever |
| `brand` | The Row | |
| `product_name` | Frankie Tank | as listed |
| `url` | https://… | US storefront |
| `archive_url` | https://web.archive.org/web/… | **save on the day you collect** (prices change) |
| `date_collected` | 2026-10-14 | ISO date |
| `price_listed` | 690 | **full price, not sale** |
| `currency` | USD | collect from US sites to avoid FX |
| `on_sale` | false | if true, record full price and note it |
| `composition_raw` | "100% Cotton" | verbatim text from the page/label |
| `cotton_pct` / `polyester_pct` / `elastane_pct` / `other_pct` | 100 / 0 / 0 / 0 | must sum to 100 |
| `other_fibers` | "modal" | what "other" is |
| `cotton_type` | conventional / organic / pima / supima / egyptian / unspecified | drives the graduated-blue shading |
| `cotton_tier` | 1–3 | your judgement call, documented in methodology |
| `fabric_construction` | rib / jersey / interlock | |
| `fabric_weight_gsm` | 180 | often missing; optional |
| `country_of_manufacture` | Italy | |
| `country_source` | product page / care label photo / customer service / press | how you know |
| `country_caveat` | true | e.g. Brandy Melville / Prato → asterisk in viz |
| `caveat_note` | "NYT 2024; HBO doc" | short text + link for the annotation |
| `verified_by` / `verified_date` | AL / 2026-10-20 | second-pass check |
| `status` | draft / verified / excluded | |
| `is_mock` | true / false | `validate.py --release` fails while any row is mock |
| `notes` | | |

**Inclusion criteria.** Every tank must be: women's sleeveless tank, white or ivory, no visible logo or graphic, sold on the brand's own US site, with fiber composition published somewhere. Record country of manufacture where you can find it. A missing country doesn't exclude a tank, but it can't appear in the country sort.

**Candidate list across the price ladder. Check that each product still exists before adding it:**

| Tier | Candidates |
|---|---|
| Ultra-fast fashion (<$15) | **Shein** (anchor), H&M, Zara, Uniqlo, Old Navy |
| Mid ($15–$80) | **Brandy Melville** (anchor), **Kotn** (anchor), Gap, Everlane, Aritzia, Skims, COS, Abercrombie |
| Premium ($80–$300) | Vince, Toteme, Khaite, Lemaire, Sporty & Rich |
| Luxury ($300+) | **The Row** (anchor), Jil Sander, Prada, Bottega Veneta (plain tanks only) |

Aim for **about 4–5 per tier** so the grid's price gradient looks continuous rather than clumped.

### 1b. `data/reference/fabric_costs.csv`: cost per yard (scene 3)

`fiber, cost_per_yard_low, cost_per_yard_mid, cost_per_yard_high, unit, source_name, source_url, date_accessed, notes`

- Collect **low, mid and high** values for each fiber from at least two sources: Mood Fabrics retail, Alibaba wholesale listings, and Textile Exchange / USDA commodity reports for raw fiber context. The mockup uses one number per fiber. A range is easier to defend.
- Add cotton tiers (conventional, combed, organic, pima/supima, Egyptian Giza) so the graduated-blue shading has a real cost basis.
- ⚠️ **Fix this before you build.** Nobody buys "elastane fabric by the yard" for a tank. Elastane is a 2–8% fiber inside a blended knit. Two options:
  1. **Story model (recommended for the piece):** cost = Σ(fiber % × fiber $/yard) × yards. It's simple and easy to read. State the method openly in the methodology note.
  2. **Cross-check model (do it once to sanity-check):** look up the per-yard price of the actual blended knit, e.g. "95/5 poly-spandex jersey". Compare that with the price option 1 gives you. If the two differ a lot, show the range.
- **Yardage assumption:** the mockup numbers ($1.62 for Shein, $3.80 for The Row) assume **1 yard**, but the annotation says 1–1.5 yards. Set one base value in config (`YARDS_PER_TANK = 1.0`) and show the 1.5-yard upper bound in the tooltip or methodology note.

### 1c. `data/reference/wages.csv`: garment wage by country (scene 8)

`country, iso3, wage_monthly_local, currency, year, wage_basis, source_name, source_url, fx_rate_to_usd, fx_year, wage_hourly_usd, notes`

- **Primary source:** ILOSTAT, *mean nominal monthly earnings of employees by economic activity*, ISIC Rev.4 **division 14 (manufacture of wearing apparel)**.
- **Fallback:** the WageIndicator Foundation's garment-sector minimum wages (the minimum for a garment worker, not average pay). Use it when ILOSTAT has no recent div-14 data.
- **`wage_basis`** (`mean_earnings` or `minimum_wage`): mixing the two is the most common hidden error in charts like this. Label which basis each bar uses.
- `wage_hourly_usd = wage_monthly_local / 173 / fx_rate` (173 = standard hours in a work month, as in your pitch). Use the **annual average FX rate for the same year as the wage** (World Bank or IMF).
- Countries needed: every `country_of_manufacture` value in `tanks.csv`. The current list is BD, CN, VN, EG, PT, IT, US.
- For Italy, add a `notes` entry that ILO figures are a **floor estimate** and point to the Prato reporting.

### 1d. `data/processed/tanks.json`: derived, never hand-edited

`scripts/build_costs.py` builds this from the three CSVs:

```
material_cost   = Σ(pct_i × cost_per_yard_i) × YARDS_PER_TANK
labor_cost      = (SAM_MINUTES / 60) × wage_hourly_usd[country]
retail_gap      = price − material_cost − labor_cost
material_share  = material_cost / price          # donut segment
labor_share     = labor_cost / price             # donut segment
```

- **`SAM_MINUTES`**: the *standard allowed minutes* for sewing one basic sleeveless knit top. Find **one citable source**, such as an apparel-engineering reference or a published costing breakdown. Store it in `scripts/config.py` together with its citation. Don't hard-code an unsourced number. Labor cost is the most assumption-heavy figure in the piece, so the methodology note should say so plainly.
- The Est Cost donut reflects these choices, so keep every assumption in one config file the methodology page can quote.

---

## 2. Collection method: hybrid, not pure scraping

With only 18 products, a fully automated scraper costs more effort than it saves. Shein and many luxury sites render with JavaScript, block bots and use inconsistent markup. Their terms of service may also prohibit scraping. Use the scraper for what it does well, and collect the rest by hand:

1. **`scripts/scrape.py`**, for each URL:
   - checks `robots.txt` and waits a few seconds between requests
   - saves the raw HTML to `data/raw/` (gitignored)
   - tries to read the **schema.org `Product` JSON-LD** (`offers.price`, `priceCurrency`), which most e-commerce sites include
   - searches the page text for composition patterns (`\d+%\s*(cotton|polyester|elastane|spandex|modal|…)`) and records a *suggestion*
   - if the request fails, logs `needs_manual` instead of crashing
2. **Manual pass:** open each page and copy `composition_raw` verbatim. Look for country of manufacture in the details or "care" section. If it's still missing, email customer service and log that as the `country_source`.
3. **Archive:** submit every URL to the Wayback Machine (`https://web.archive.org/save/<url>`) on collection day. Store the snapshot URL as the public citation.

**Normalization rules** (used in `clean.py`):
- spandex = elastane = Lycra → `elastane_pct`
- "cotton blend" with no percentages → `status = excluded` (unknowable)
- body fabric only. Ignore trims, binding and "rib: 95% cotton" sub-specs, and add them to notes
- if sizes list different compositions, use size S or M

---

## 3. Quality checks (`scripts/validate.py`, run in CI)

- [ ] fiber percentages sum to 100 (±0.5)
- [ ] `price_listed > 0`, `currency == USD`
- [ ] every `country_of_manufacture` exists in `wages.csv`
- [ ] every fiber with pct > 0 exists in `fabric_costs.csv`
- [ ] every `status == verified` row has `archive_url` and `verified_date`
- [ ] no duplicate `tank_id`
- [ ] **Manual:** before publishing, someone other than you re-checks 3 random rows against the archive snapshots

⚠️ **Inconsistency already in the pitch:** the Brandy Melville price appears as **$24** on page 2 but **$14** on pages 5–6. See [methodology.md](methodology.md#1-brandy-melville-price-mismatch) for the fix.

---

## 4. Timeline (about 2 weeks for data)

| Days | Work |
|---|---|
| 1 | Lock inclusion criteria, finalize the 18 candidates, set up the CSV templates |
| 2–4 | Scrape + manual pass + archive all 18 tanks |
| 5 | Fabric cost research (≥2 sources per fiber, cotton tiers) |
| 6 | Wage research (ILOSTAT div 14 + WageIndicator), FX conversion |
| 7 | Find and cite SAM; write `config.py`; run `build_costs.py` |
| 8 | `validate.py` green; second-pass verification |
| 9–10 | Write `docs/methodology.md` (assumptions, caveats, Prato note, cotton tiering) |
| — | **Freeze the dataset** (tag `data-v1.0`) before the visualization work speeds up |

## 5. Ethics & legal notes
- Commit **facts and archive links** only. Scraped HTML in `data/raw/` stays out of git.
- No product photography anywhere: the data fills our own SVG tank silhouettes.
- Keep the Brandy Melville labor claims tied to published reporting with links. Agree the wording with your editor before publishing.
