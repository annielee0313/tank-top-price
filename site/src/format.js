import * as d3 from 'd3';

export const FLAGS = {
  Bangladesh: '🇧🇩', China: '🇨🇳', Vietnam: '🇻🇳', Egypt: '🇪🇬',
  Portugal: '🇵🇹', Italy: '🇮🇹', USA: '🇺🇸',
};

export const fmtPrice = (p) =>
  p >= 100 ? `$${d3.format(',')(Math.round(p))}` : `$${Number.isInteger(p) ? p : p.toFixed(2)}`;

export const fmtCost = d3.format('$.2f');

export const fmtShare = (s) => (s < 0.01 ? d3.format('.2%')(s) : d3.format('.1%')(s));

export const fmtComp = (t) =>
  t.composition.map((c) => `${c.pct}% ${c.label.toLowerCase()}`).join(', ');

export const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
