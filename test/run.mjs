// Browser tests for launcher.js: node test/run.mjs (needs playwright's chromium).
import { chromium, devices } from 'playwright';
import { readFileSync } from 'node:fs';
import { parse } from 'acorn';

const SRC = readFileSync(new URL('../src/launcher.js', import.meta.url), 'utf8');
let pass = 0, fail = 0;
const t = async (name, fn) => { try { await fn(); pass++; console.log('  ✓ ' + name); } catch (e) { fail++; console.log('  ✗ ' + name + '\n    ' + (e && e.message)); } };
const ok = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };

await t('the library is plain ES5 (sites inline it as-is)', () => { parse(SRC, { ecmaVersion: 5 }); });
await t('every app has an icon, a name, a tip, an https link and a known kind', async () => {
  const L = (await import('../src/launcher.js')).default;
  for (const a of L.apps()) {
    ok(L.icon(a.id), a.id + ' has no icon');
    ok(a.name && a.tip && /^https:\/\//.test(a.href), a.id + ' is incomplete');
    ok(['Company', 'App', 'Game', 'Library'].includes(a.kind), a.id + ' kind ' + a.kind);
    ok(!/—/.test(a.tip + a.name), a.id + ' has an em-dash');
  }
});

const b = await chromium.launch();
const page = async (body, opts = {}) => {
  const p = await b.newPage(opts);
  const html = '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><body>' + body + '<script>' + SRC + '</script></body>';
  await p.route('https://**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: r.request().url() === 'https://launcher.test/' ? html : '<title>landed</title>' }));
  await p.goto('https://launcher.test/');
  return p;
};
const inShadow = (p, sel) => p.evaluate((s) => { const h = document.querySelector('[data-launcher]'); const el = h && h.shadowRoot.querySelector(s); return el ? { hidden: el.hidden, text: el.textContent, n: h.shadowRoot.querySelectorAll(s).length } : null; }, sel);

await t('button mode: a trigger opens the palette; Escape closes it and gives focus back', async () => {
  const p = await page('<button id="apps">Apps</button><script>window.L = 0;</script>');
  await p.evaluate(() => { window.L = Launcher.mount({ trigger: document.getElementById('apps'), here: 'dc' }); });
  await p.click('#apps');
  ok(await p.evaluate(() => window.L.isOpen()), 'did not open');
  ok((await p.getAttribute('#apps', 'aria-expanded')) === 'true', 'aria-expanded not true');
  await p.keyboard.press('Escape');
  ok(!(await p.evaluate(() => window.L.isOpen())), 'did not close');
  ok(await p.evaluate(() => document.activeElement.id === 'apps'), 'focus not returned');
  await p.close();
});

await t('here: the current site is left out', async () => {
  const p = await page('<button id="apps"></button>');
  await p.evaluate(() => Launcher.mount({ trigger: document.getElementById('apps'), here: 'cto' }).open());
  const names = await p.evaluate(() => [...document.querySelector('[data-launcher]').shadowRoot.querySelectorAll('.opt b')].map((e) => e.textContent));
  ok(!names.includes('Fractional CTO') && names.includes('Digital Craft AI'), names.join(','));
  await p.close();
});

await t('⌘K and Ctrl+K toggle; / opens, but not while typing in a field', async () => {
  const p = await page('<input id="q"><button id="apps"></button>');
  await p.evaluate(() => { window.L = Launcher.mount({ trigger: document.getElementById('apps') }); });
  await p.keyboard.press('Control+k'); ok(await p.evaluate(() => L.isOpen()), 'ctrl+k');
  await p.keyboard.press('Control+k'); ok(!(await p.evaluate(() => L.isOpen())), 'ctrl+k again');
  await p.keyboard.press('Meta+k'); ok(await p.evaluate(() => L.isOpen()), 'meta+k');
  await p.keyboard.press('Escape');
  await p.focus('#q'); await p.keyboard.press('/');
  ok(!(await p.evaluate(() => L.isOpen())), '/ opened while typing');
  ok((await p.inputValue('#q')) === '/', 'the slash was swallowed');
  await p.evaluate(() => document.activeElement.blur()); await p.keyboard.press('/');
  ok(await p.evaluate(() => L.isOpen()), '/ did not open');
  await p.close();
});

await t('search filters by name, tip and keywords; Enter launches the match', async () => {
  const p = await page('<button id="apps"></button>');
  await p.evaluate(() => { window.got = null; window.L = Launcher.mount({ trigger: document.getElementById('apps'), onLaunch: (a) => { window.got = a.id; } }); L.open(); });
  await p.keyboard.type('flight');
  const names = await p.evaluate(() => [...document.querySelector('[data-launcher]').shadowRoot.querySelectorAll('.opt b')].map((e) => e.textContent));
  ok(names.length === 1 && names[0] === 'OpenAero DFW', names.join(','));
  await Promise.all([p.waitForURL('https://mutaafaziz.com/openaero/'), p.keyboard.press('Enter')]);
  await p.close();
});

await t('no match says so instead of an empty box', async () => {
  const p = await page('<button id="apps"></button>');
  await p.evaluate(() => Launcher.mount({ trigger: document.getElementById('apps') }).open());
  await p.keyboard.type('zzqx');
  ok(/Nothing matches/.test((await inShadow(p, '.none')).text));
  await p.close();
});

await t('recents: the last launched app comes first next time', async () => {
  const p = await page('<button id="apps"></button>');
  await p.evaluate(() => { localStorage.setItem('launcher_recent', JSON.stringify(['siq'])); Launcher.mount({ trigger: document.getElementById('apps'), flood: false }).open(); });
  const first = await p.evaluate(() => { const s = document.querySelector('[data-launcher]').shadowRoot; return [s.querySelector('.h').textContent, s.querySelector('.opt b').textContent]; });
  ok(first[0] === 'Recent' && first[1] === 'SportsIQ', first.join(' / '));
  await p.close();
});

await t('actions: a site can add its own rows, and run() fires instead of navigating', async () => {
  const p = await page('<button id="apps"></button>');
  await p.evaluate(() => { window.ran = 0; Launcher.mount({ trigger: document.getElementById('apps'), actions: [{ name: 'Book a call', tip: 'Thirty minutes', run: () => { window.ran++; } }] }).open(); });
  await p.keyboard.type('book'); await p.keyboard.press('Enter');
  ok(await p.evaluate(() => window.ran === 1), 'run not called');
  await p.close();
});

await t('target mode renders a grid button; destroy removes everything', async () => {
  const p = await page('<span id="slot"></span>');
  await p.evaluate(() => { window.L = Launcher.mount({ target: document.getElementById('slot') }); });
  ok(await p.evaluate(() => !!document.querySelector('#slot span').shadowRoot.querySelector('button.trig')), 'no button');
  await p.evaluate(() => L.destroy());
  ok(await p.evaluate(() => !document.querySelector('[data-launcher]') && !document.querySelector('#slot span')), 'left behind');
  await p.close();
});

await t('dock mode: dock on desktop, thumb button and bottom sheet on phones; icons keep their own gradient ids', async () => {
  const p = await page('', { viewport: { width: 1280, height: 800 } });
  await p.evaluate(() => { window.L = Launcher.mount({ mode: 'dock', here: 'mz' }); });
  const d = await p.evaluate(() => { const s = document.querySelector('[data-launcher]').shadowRoot; return [getComputedStyle(s.querySelector('.dock')).display, getComputedStyle(s.querySelector('.fab')).display, s.querySelectorAll('.dock a').length]; });
  ok(d[0] === 'flex' && d[1] === 'none' && d[2] === 12, d.join(','));
  await p.evaluate(() => L.open());
  const ids = await p.evaluate(() => [...document.querySelector('[data-launcher]').shadowRoot.querySelectorAll('[id^="lg-"]')].map((e) => e.id));
  ok(ids.length && new Set(ids).size === ids.length, 'duplicate gradient ids');
  await p.close();
  const ph = await page('', { ...devices['iPhone 13'] });
  await ph.evaluate(() => Launcher.mount({ mode: 'dock' }));
  const m = await ph.evaluate(() => { const s = document.querySelector('[data-launcher]').shadowRoot; return [getComputedStyle(s.querySelector('.dock')).display, getComputedStyle(s.querySelector('.fab')).display]; });
  ok(m[0] === 'none' && m[1] === 'flex', m.join(','));
  await ph.close();
});

await t('opened before the page finishes loading, it stays open (pageshow on first load is not a restore)', async () => {
  const p = await page('<button id="apps"></button>');
  await p.evaluate(() => { window.L = Launcher.mount({ trigger: document.getElementById('apps') }); L.open(); window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: false })); });
  ok(await p.evaluate(() => L.isOpen()), 'a first-load pageshow closed it');
  await p.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
  ok(!(await p.evaluate(() => L.isOpen())), 'a back-forward restore left it open');
  await p.close();
});

await t('reduced motion: launching navigates at once, with no flood', async () => {
  const p = await page('<button id="apps"></button>', { reducedMotion: 'reduce' });
  await p.evaluate(() => Launcher.mount({ trigger: document.getElementById('apps') }).open());
  await p.keyboard.type('18-0');
  await Promise.all([p.waitForURL('https://18-0.co/', { timeout: 2000 }), p.keyboard.press('Enter')]);
  await p.close();
});

await b.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
