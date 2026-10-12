import * as d3 from 'd3';
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
import { drawTank, drawDonut, TANK_W, TANK_H } from './viz/tank.js';
import { fmtPrice, fmtShare, FLAGS, prefersReducedMotion } from './format.js';

gsap.registerPlugin(Flip);

const SORTS = {
  price: (a, b) => a.price - b.price,
  cotton: (a, b) => b.cotton_pct - a.cotton_pct || a.price - b.price,
  country: (a, b) => (a.country ?? '~').localeCompare(b.country ?? '~') || a.price - b.price,
};

const LEGENDS = {
  composition: [
    ['fill-cotton-1', 'Cotton'],
    ['fill-cotton-2', 'Organic / combed cotton'],
    ['fill-cotton-3', 'Pima / Supima / Egyptian'],
    ['fill-polyester', 'Polyester'],
    ['fill-elastane', 'Elastane'],
    ['fill-other', 'Other'],
  ],
  cost: [
    ['seg-material', 'Est. material'],
    ['seg-labor', 'Est. labor'],
    ['seg-gap', 'Everything else'],
  ],
};

/** The interactive grid: every tank, sortable, with composition / cost views. */
export function createExplorer({ grid, legend, controls, card, data }) {
  const state = { view: 'composition', sort: 'price' };

  const cells = d3.select(grid).selectAll('button.cell')
    .data([...data.tanks].sort(SORTS.price), (d) => d.id)
    .join('button')
    .attr('class', 'cell')
    .attr('type', 'button')
    .attr('aria-label', (d) => `${d.brand}, ${fmtPrice(d.price)}. Open details`)
    .on('click', (event, d) => card.open(d));

  cells.append('span').attr('class', 'peek');
  cells.append('svg').attr('viewBox', `0 0 ${TANK_W} ${TANK_H}`).attr('aria-hidden', true).append('g');
  const meta = cells.append('span').attr('class', 'meta');
  meta.append('span').attr('class', 'brand').text((d) => d.brand);
  meta.append('span').attr('class', 'price')
    .text((d) => `${fmtPrice(d.price)} ${FLAGS[d.country] ?? ''}${d.country_caveat ? '*' : ''}`);

  const nodeById = new Map(cells.nodes().map((n) => [d3.select(n).datum().id, n]));

  function peekText(d) {
    if (state.view === 'cost') return `Fabric ${fmtShare(d.material_share)} · Labor ${fmtShare(d.labor_share)}`;
    const top = d.composition.reduce((x, y) => (y.pct > x.pct ? y : x));
    return `${top.pct}% ${top.label.toLowerCase()}`;
  }

  function render(duration = prefersReducedMotion() ? 0 : 600) {
    cells.each(function (d) {
      const g = d3.select(this).select('svg g');
      if (state.view === 'cost') drawDonut(g, d, { duration });
      else drawTank(g, d, { duration });
    });
    cells.select('.peek').text(peekText);
    d3.select(legend).selectAll('li').data(LEGENDS[state.view]).join('li')
      .html(([cls, label]) => `<svg width="12" height="12"><rect class="${cls}" width="12" height="12" rx="2"/></svg>${label}`);
    controls.querySelectorAll('[data-view]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.view === state.view));
    controls.querySelectorAll('[data-sort]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.sort === state.sort));
  }

  function sort() {
    const flipState = Flip.getState(grid.children);
    [...data.tanks].sort(SORTS[state.sort]).forEach((t) => grid.appendChild(nodeById.get(t.id)));
    Flip.from(flipState, { duration: prefersReducedMotion() ? 0 : 0.6, ease: 'power2.inOut', stagger: 0.015 });
  }

  controls.addEventListener('click', (event) => {
    const b = event.target.closest('button');
    if (!b) return;
    if (b.dataset.view) state.view = b.dataset.view;
    if (b.dataset.sort) {
      state.sort = b.dataset.sort;
      sort();
    }
    render();
  });

  render(0);
}
