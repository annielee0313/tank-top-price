import { fmtPrice, fmtCost, fmtShare, FLAGS } from './format.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** Detail card: a side panel on desktop, a bottom sheet on mobile (see CSS). */
export function createCard(el, data) {
  const body = el.querySelector('.card-body');
  const closeBtn = el.querySelector('.card-close');
  const { yards_base: yb, yards_high: yh } = data.meta.assumptions;
  let opener = null;

  function open(t) {
    opener = document.activeElement;
    const comp = t.composition
      .map((c) => `<li><svg width="10" height="10"><rect class="fill-${c.cls}" width="10" height="10" rx="2"/></svg>${c.pct}% ${esc(c.label)}</li>`)
      .join('');
    const labor = t.labor_cost == null
      ? '<dd>Unknown (no country)</dd>'
      : `<dd>${fmtCost(t.labor_cost_low)}–${fmtCost(t.labor_cost_high)} <span class="muted">(${fmtShare(t.labor_share)})</span></dd>`;
    body.innerHTML = `
      <p class="card-brand">${esc(t.brand)}${t.is_mock ? ' <span class="tag">mock</span>' : ''}</p>
      <h3>${esc(t.product)}</h3>
      <p class="card-price">${fmtPrice(t.price)}</p>
      <dl>
        <dt>Made in</dt><dd>${FLAGS[t.country] ?? ''} ${esc(t.country ?? 'Unknown')}${t.country_caveat ? '*' : ''}</dd>
        ${t.caveat_note ? `<dd class="caveat">* ${esc(t.caveat_note)}</dd>` : ''}
        <dt>Garment wage</dt><dd>${t.wage_hourly != null ? `~${fmtCost(t.wage_hourly)}/hr` : 'Unknown'}</dd>
        <dt>Composition</dt><dd><ul class="comp">${comp}</ul></dd>
        <dt>Est. material</dt><dd>${fmtCost(t.material_cost)} <span class="muted">(${fmtShare(t.material_share)}; up to ${fmtCost(t.material_cost_high)} at ${yh} yd)</span></dd>
        <dt>Est. labor</dt>${labor}
        <dt>Everything else</dt><dd>${fmtCost(t.retail_gap)}</dd>
      </dl>
      <p class="muted small">Material assumes ${yb} yard of fabric. Labor is a range of sewing times.</p>`;
    el.hidden = false;
    closeBtn.focus();
  }

  function close() {
    if (el.hidden) return;
    el.hidden = true;
    opener?.focus();
  }

  closeBtn.addEventListener('click', close);
  document.addEventListener('keydown', (e) => e.key === 'Escape' && close());
  return { open, close };
}
