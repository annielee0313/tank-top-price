# Why Similar Tank Tops Can Cost $5 — or $700

A scrollytelling data story about what's actually inside the price of a plain white tank top: fabric, labor, and everything else.

**Live:** `https://<your-username>.github.io/tank-top-price/` *(after first deploy)*

---

## Repo structure

```
tank-top-price/
├── README.md                  ← you are here (also the repo plan)
├── LICENSE                    ← MIT for code
├── DATA_LICENSE               ← CC BY 4.0 for data/processed + data/reference
├── docs/
│   ├── data-collection-plan.md
│   ├── methodology.md         ← public-facing: assumptions, caveats, sources
│   └── sources.md             ← every citation, with archive links
├── data/
│   ├── raw/                   ← scraped HTML + screenshots (GITIGNORED)
│   ├── manual/tanks.csv       ← hand-verified product data (source of truth)
│   ├── reference/
│   │   ├── fabric_costs.csv
│   │   └── wages.csv
│   └── processed/tanks.json   ← generated; what the site loads
├── scripts/                   ← Python data pipeline
│   ├── config.py              ← YARDS_PER_TANK, SAM_MINUTES + citations
│   ├── scrape.py              ← JSON-LD price + composition suggestions
│   ├── clean.py               ← fiber-name normalization
│   ├── build_costs.py         ← material / labor / retail-gap → tanks.json
│   └── validate.py            ← runs in CI
├── design/
│   ├── sketches/              ← scans of hand-drawn storyboards
│   └── figma.md               ← links to Figma frames
├── site/                      ← front end (Vite)
│   ├── index.html
│   ├── package.json
│   ├── public/data/           ← tanks.json copied here at build
│   └── src/
│       ├── main.js
│       ├── scrolly.js         ← Scrollama step → scene state
│       ├── scenes/            ← one module per scroll trigger (01-hook.js … 09-grid.js)
│       ├── viz/
│       │   ├── tank.js        ← SVG silhouette + composition fill (D3)
│       │   ├── tankGrid.js    ← grid layout, sort, GSAP reorder
│       │   ├── donut.js       ← Est Cost view
│       │   └── detailCard.js  ← tooltip / mobile bottom sheet
│       ├── embeds/            ← Datawrapper iframe wrappers
│       └── styles/
└── .github/workflows/
    ├── validate-data.yml      ← runs scripts/validate.py on every PR touching data/
    └── deploy.yml             ← builds site/ → GitHub Pages on push to main
```

## Stack

| Layer | Tools |
|---|---|
| Data | Python 3.11+, `requests`, `beautifulsoup4`, `pandas` |
| Front end | Vite (no framework), D3 v7, Scrollama, GSAP |
| Simple charts | Datawrapper (cost per yard, wage by country) embedded via iframe |
| Hosting | GitHub Pages via Actions |

Why vanilla JS + Vite: the piece is one page with a handful of D3 modules. A framework adds weight without solving any problem here, and Vite gives fast reloads plus a static `dist/` for Pages.

## Workflow

- **`main`** is always deployable and protected: PRs only, CI must pass.
- Branch per feature: `data/collect-tier-luxury`, `viz/tank-grid-sort`, `scene/06-brandy`.
- **Tag `data-v1.0`** when the dataset is frozen. Any later data change gets a new tag and a line in `docs/methodology.md` → *Changelog*.
- `data/processed/` is generated. Rebuild it with `python scripts/build_costs.py` and never hand-edit it.

## Milestones (as GitHub Milestones + Issues)

| # | Milestone | Done when |
|---|---|---|
| M0 | **Setup** | repo, Pages deploy of a "hello" page, CI green |
| M1 | **Data v1** | 18 tanks verified, `validate.py` green, tagged `data-v1.0` |
| M2 | **Scroll skeleton** | all 11 steps fire in order with placeholder content |
| M3 | **Scenes 1–7** | two-tank hook, material fill, cost per yard, donut, Brandy vs. The Row |
| M4 | **Datawrapper charts** | cost per yard + wages published and embedded |
| M5 | **Grid (scenes 9–11)** | composition fills, sort by price / cotton % / country, hover + detail card |
| M6 | **Est Cost view** | tank ↔ donut toggle with GSAP transition |
| M7 | **Mobile + a11y** | 3-col grid, tap = hover, bottom sheet, `prefers-reduced-motion`, keyboard sort, alt text |
| M8 | **Editorial + launch** | methodology page, Prato caveats approved, social card, launch |

Open one issue per scroll trigger, labelled `scene`, `viz`, `data`, `a11y` or `editorial`.

## Running locally

```bash
# data
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python scripts/validate.py

# site (once scaffolded)
cd site && npm install && npm run dev
```

## Credits

Reporting, design and development: Annie Lee. Scrollytelling structure inspired by Alvin Chang's work at The Pudding.
