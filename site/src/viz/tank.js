import * as d3 from 'd3';

// Every tank and donut is drawn in this 100 × 140 box.
export const TANK_W = 100;
export const TANK_H = 140;
const TOP = 2;
const HEM = 138;

export const TANK_PATH =
  'M30,2 L40,2 C42,20 58,20 60,2 L70,2 C70,22 80,36 92,42 L95,138 L5,138 L8,42 C20,36 30,22 30,2 Z';

let clipCount = 0;

function ensureTank(g) {
  if (!g.select('.tank-outline').empty()) return;
  const id = `tank-clip-${clipCount++}`;
  g.append('clipPath').attr('id', id).append('path').attr('d', TANK_PATH);
  g.append('path').attr('class', 'tank-bg').attr('d', TANK_PATH);
  g.append('g').attr('class', 'fills').attr('clip-path', `url(#${id})`);
  g.append('path').attr('class', 'tank-outline').attr('d', TANK_PATH);
}

/** Tank silhouette filled bottom-up with its fiber composition. */
export function drawTank(g, t, { filled = true, duration = 700 } = {}) {
  g.selectAll('.donut').remove();
  ensureTank(g);
  let y = HEM;
  const bands = t.composition.map((c) => {
    const h = (c.pct / 100) * (HEM - TOP);
    y -= h;
    return { ...c, y, h };
  });
  g.select('.fills')
    .selectAll('rect')
    .data(bands, (d) => d.fiber)
    .join((enter) => enter.append('rect').attr('x', 0).attr('width', TANK_W).attr('y', HEM).attr('height', 0))
    .attr('class', (d) => `fill-${d.cls}`)
    .transition()
    .duration(duration)
    .attr('y', (d) => (filled ? d.y : HEM))
    .attr('height', (d) => (filled ? d.h : 0));
}

/** Donut of the retail price: material, labor (optional), and everything else. */
export function drawDonut(g, t, { withLabor = true, duration = 700 } = {}) {
  g.selectAll('.tank-bg, .fills, .tank-outline, clipPath').remove();
  const segs = [
    { key: 'material', value: t.material_share },
    { key: 'labor', value: withLabor ? t.labor_share : 0 },
  ];
  segs.push({ key: 'gap', value: 1 - segs[0].value - segs[1].value });

  const arc = d3.arc().innerRadius(28).outerRadius(46);
  const pie = d3.pie().sort(null).value((d) => d.value);
  let donut = g.select('.donut');
  if (donut.empty()) donut = g.append('g').attr('class', 'donut').attr('transform', `translate(50,${TANK_H / 2})`);

  donut
    .selectAll('path')
    .data(pie(segs), (d) => d.data.key)
    .join((enter) => enter.append('path').each(function (d) { this._current = { ...d, endAngle: d.startAngle }; }))
    .attr('class', (d) => `seg-${d.data.key}`)
    .transition()
    .duration(duration)
    .attrTween('d', function (d) {
      const i = d3.interpolate(this._current, d);
      this._current = d;
      return (k) => arc(i(k));
    });
}
