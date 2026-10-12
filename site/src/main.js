import * as d3 from 'd3';
import scrollama from 'scrollama';
import { createStage } from './stage.js';
import { createExplorer } from './explorer.js';
import { createCard } from './card.js';
import { fmtPrice, fmtCost, fmtShare, fmtComp } from './format.js';

// Copy uses tokens like {{price:the-row}} so the text can never disagree with the data.
function fillTokens(data) {
  const byId = new Map(data.tanks.map((t) => [t.id, t]));
  const tank = (id) => {
    if (!byId.has(id)) throw new Error(`no tank ${id}`);
    return byId.get(id);
  };
  const fns = {
    price: (id) => fmtPrice(tank(id).price),
    material: (id) => fmtCost(tank(id).material_cost),
    share: (id) => fmtShare(tank(id).material_share),
    comp: (id) => fmtComp(tank(id)),
    gap: (a, b) => fmtPrice(Math.abs(tank(b).price - tank(a).price)),
    ratio: (a, b) => Math.round(tank(b).price / tank(a).price),
    wage: (c) => fmtCost(data.wages.find((w) => w.country === c).hourly),
    count: () => data.tanks.length,
    yards: () => data.meta.assumptions.yards_base,
  };
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.nodeValue.includes('{{')) continue;
    n.nodeValue = n.nodeValue.replace(/\{\{(\w+)(?::([^}]+))?\}\}/g, (match, fn, args) => {
      try {
        return fns[fn](...(args ? args.split(':') : []));
      } catch (err) {
        console.warn(`Couldn't fill ${match}:`, err.message);
        return '—';
      }
    });
  }
}

async function init() {
  const data = await d3.json(`${import.meta.env.BASE_URL}data/tanks.json`);
  document.getElementById('mock-banner').hidden = !data.meta.is_mock;
  fillTokens(data);

  const stage = createStage(document.getElementById('stage'), data);
  const card = createCard(document.getElementById('card'), data);
  createExplorer({
    grid: document.getElementById('grid'),
    legend: document.getElementById('legend'),
    controls: document.querySelector('#explore .controls'),
    card,
    data,
  });

  const steps = document.querySelectorAll('#scrolly .step');
  const scroller = scrollama();
  scroller
    .setup({ step: '#scrolly .step', offset: 0.6 })
    .onStepEnter(({ element }) => {
      steps.forEach((s) => s.classList.toggle('is-active', s === element));
      stage.go(Number(element.dataset.step));
    });
  window.addEventListener('resize', () => scroller.resize());
  stage.go(1);
}

init();
