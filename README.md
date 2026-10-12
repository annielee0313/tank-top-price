# Why Similar Tank Tops Can Cost $5 — or $700

A scrollytelling data story about what's actually inside the price of a plain white tank top: fabric, labor, and everything else.

**Live:** `https://annielee0313.github.io/tank-top-price/` *(after first deploy)*

---

## Repo structure

```
tank-top-price/
├── README.md                  ← you are here (also the repo plan)
├── docs/
│   ├── data-collection-plan.md
│   └── methodology.md         ← assumptions, known issues and their fixes
├── data/
│   ├── raw/                   ← scraped HTML (GITIGNORED)
│   ├── manual/tanks.csv       ← hand-verified product data (source of truth)
│   ├── reference/
│   │   ├── fabric_costs.csv
│   │   └── wages.csv
│   └── processed/tanks.json   ← generated; what the site loads
├── scripts/                   ← Python data pipeline
│   ├── config.py              ← YARDS_*, SAM_MINUTES_* + citations
│   ├── (scrape.py, clean.py)  ← to write during real collection
│   ├── build_costs.py         ← material / labor / retail-gap → tanks.json
│   └── validate.py            ← runs in CI
├── design/
│   └── sketches/              ← scans of hand-drawn storyboards
├── site/                      ← front end (Vite)
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── public/data/           ← tanks.json copied here (generated, gitignored)
│   └── src/
│       ├── main.js            ← loads data, fills {{tokens}} in copy, wires Scrollama
│       ├── stage.js           ← sticky graphic: one function per scroll step
│       ├── explorer.js        ← full grid: sort (GSAP Flip), composition ↔ cost view
│       ├── card.js            ← detail card / mobile bottom sheet
│       ├── format.js          ← $ / % formatting, country flags
│       ├── viz/tank.js        ← SVG tank silhouette fill + donut (D3)
│       └── styles/main.css
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

## Getting started

You need Node 20+ and Python 3.11+ (no extra Python packages for the pipeline).

```bash
cd site
npm install
npm run dev        # rebuilds data/processed/tanks.json, then serves http://localhost:5173
```

Edit any CSV in `data/`, then run `npm run data` (or restart `npm run dev`) to rebuild the numbers.

```bash
python3 scripts/validate.py            # everyday data checks
python3 scripts/validate.py --release  # pre-publish: fails while mock data remains
```

## Watching it as you build

| Where | What you see | When |
|---|---|---|
| **Browser at `localhost:5173`** | the page itself; saves to `site/src` reload instantly | every save |
| **VS Code Source Control panel** | exactly which files changed, line by line | before every commit |
| **GitHub → Commits / Pull requests** | the history of the project, one PR per feature | every push |
| **GitHub → Actions** | data validation + deploy runs (green ✓ / red ✗) | every push to `main` |
| **GitHub Pages URL** | the live public version | ~1 min after each push to `main` |

The data is currently **mock**. A yellow banner shows on the page until every row in `data/manual/tanks.csv` has `is_mock = false`.

## Credits

Reporting, design and development: Annie Lee. Scrollytelling structure inspired by Alvin Chang's work at The Pudding.
