import * as d3 from 'd3';
import { drawTank, drawDonut, TANK_W, TANK_H } from './viz/tank.js';
import { fmtPrice, fmtCost, fmtShare, fmtComp, FLAGS, prefersReducedMotion } from './format.js';

const W = 800;
const H = 520;
const PAIR_HOOK = ['shein', 'the-row'];
const PAIR_COTTON = ['brandy-melville', 'the-row'];

/** The sticky graphic. Each scroll step calls go(n), which sets the scene from scratch. */
export function createStage(svgEl, data) {
  const svg = d3.select(svgEl).attr('viewBox', `0 0 ${W} ${H}`);
  const gTanks = svg.append('g');
  const gOver = svg.append('g');
  const byId = new Map(data.tanks.map((t) => [t.id, t]));
  const a = data.meta.assumptions;
  const dur = () => (prefersReducedMotion() ? 0 : 700);

  // Two tanks side by side, or a 6-column grid for the full set.
  function layout(i, n) {
    if (n <= 2) {
      const s = 1.6;
      const cx = (W / (n + 1)) * (i + 1);
      return { x: cx - (TANK_W * s) / 2, y: 110, s, cx };
    }
    const cols = 6;
    const s = 0.7;
    const cx = (W / cols) * (i % cols) + W / cols / 2;
    return { x: cx - (TANK_W * s) / 2, y: 40 + Math.floor(i / cols) * 160, s, cx };
  }
  const tf = (p, dy = 0) => `translate(${p.x},${p.y + dy}) scale(${p.s})`;

  function setTanks(ids, { view = 'tank', filled = true, withLabor = false } = {}) {
    const list = ids.map((id) => byId.get(id)).filter(Boolean);
    const n = list.length;
    gTanks
      .selectAll('g.stage-tank')
      .data(list, (d) => d.id)
      .join(
        (enter) => enter.append('g').attr('class', 'stage-tank').attr('opacity', 0)
          .attr('transform', (d, i) => tf(layout(i, n), 30)),
        (update) => update,
        (exit) => exit.transition().duration(dur() / 2).attr('opacity', 0).remove(),
      )
      .each(function (d) {
        const g = d3.select(this);
        if (view === 'donut') drawDonut(g, d, { withLabor, duration: dur() });
        else drawTank(g, d, { filled, duration: dur() });
      })
      .transition()
      .duration(dur())
      .attr('opacity', 1)
      .attr('transform', (d, i) => tf(layout(i, n)));
  }

  function text(x, y, str, cls, anchor = 'middle') {
    gOver.append('text').attr('class', cls).attr('x', x).attr('y', y).attr('text-anchor', anchor)
      .attr('opacity', 0).text(str)
      .transition().delay(dur() / 2).duration(dur() / 2).attr('opacity', 1);
  }

  // Lines above each tank (last one emphasised) and brand + price below.
  function labels(ids, fn) {
    ids.forEach((id, i) => {
      const t = byId.get(id);
      if (!t) return;
      const p = layout(i, ids.length);
      const { above = [] } = fn(t);
      above.forEach((str, j) =>
        text(p.cx, p.y - 14 - (above.length - 1 - j) * 20, str, j === above.length - 1 ? 'label-strong' : 'label'));
      text(p.cx, p.y + TANK_H * p.s + 30, t.brand, 'label-brand');
      text(p.cx, p.y + TANK_H * p.s + 56, fmtPrice(t.price), 'label-price');
    });
  }

  // Stand-in for the Datawrapper charts while developing.
  function bars(rows, { title, note, fmt }) {
    const x0 = 230;
    const top = 90;
    const rowH = Math.min(50, 340 / rows.length);
    const x = d3.scaleLinear().domain([0, d3.max(rows, (r) => r.value)]).range([0, W - 90 - x0]);
    text(40, 50, title, 'chart-title', 'start');
    const row = gOver.append('g').selectAll('g').data(rows).join('g')
      .attr('transform', (d, i) => `translate(0,${top + i * rowH})`);
    row.append('text').attr('class', 'bar-label').attr('x', x0 - 12).attr('y', rowH * 0.45)
      .attr('text-anchor', 'end').attr('dominant-baseline', 'middle').text((d) => d.label);
    row.append('rect').attr('class', (d) => d.cls).attr('x', x0).attr('y', rowH * 0.15)
      .attr('height', rowH * 0.6).attr('width', 0)
      .transition().duration(dur()).delay((d, i) => i * 60).attr('width', (d) => x(d.value));
    row.append('text').attr('class', 'bar-value').attr('x', x0 + 6).attr('y', rowH * 0.45)
      .attr('dominant-baseline', 'middle').text((d) => fmt(d.value))
      .transition().duration(dur()).delay((d, i) => i * 60).attr('x', (d) => x0 + x(d.value) + 8);
    if (note) text(40, top + rows.length * rowH + 30, note, 'chart-note', 'start');
  }

  const scenes = {
    1: () => {
      setTanks(PAIR_HOOK, { filled: false });
      labels(PAIR_HOOK, () => ({}));
    },
    2: () => {
      setTanks(PAIR_HOOK);
      labels(PAIR_HOOK, (t) => ({ above: t.composition.map((c) => `${c.pct}% ${c.label}`) }));
    },
    3: () => {
      setTanks([]);
      const keys = ['cotton_t1', 'polyester', 'elastane'];
      bars(
        keys.map((k) => {
          const f = data.fabrics.find((r) => r.fiber === k);
          return { label: f.label, value: f.mid, cls: `fill-${k.replace('cotton_t', 'cotton-')}` };
        }),
        { title: 'Fabric cost per yard', fmt: fmtCost,
          note: `A basic tank uses about ${a.yards_base}–${a.yards_high} yards of fabric` },
      );
    },
    4: () => {
      setTanks(PAIR_HOOK);
      labels(PAIR_HOOK, (t) => ({ above: ['Material est.', fmtCost(t.material_cost)] }));
    },
    5: () => {
      setTanks(PAIR_HOOK, { view: 'donut', withLabor: false });
      labels(PAIR_HOOK, (t) => ({ above: [`${fmtShare(t.material_share)} fabric`] }));
    },
    6: () => {
      setTanks(PAIR_COTTON);
      labels(PAIR_COTTON, (t) => ({ above: [fmtComp(t)] }));
    },
    7: () => {
      setTanks(PAIR_COTTON);
      labels(PAIR_COTTON, (t) => ({
        above: [`${FLAGS[t.country] ?? ''} ${t.country}${t.country_caveat ? '*' : ''}`, `~${fmtCost(t.wage_hourly)}/hr`],
      }));
    },
    8: () => {
      setTanks([]);
      bars(
        data.wages.map((w) => ({ label: `${FLAGS[w.country] ?? ''} ${w.country}`, value: w.hourly, cls: 'seg-labor' })),
        { title: 'Estimated garment worker wage, per hour', fmt: fmtCost,
          note: 'ILO-based estimates. Italy is a floor estimate.' },
      );
    },
    9: () => setTanks(data.tanks.map((t) => t.id)),
  };

  let current = 0;
  return {
    go(step) {
      if (step === current || !scenes[step]) return;
      current = step;
      gOver.selectAll('*').interrupt().remove();
      scenes[step]();
    },
  };
}
