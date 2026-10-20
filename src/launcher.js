/*! launcher · one app launcher for mutaafaziz.com, digitalcraftai.com and cto.digitalcraftai.com · MIT
 *
 * One list of apps, one palette (⌘K), one launch. Each site picks a skin (light or dark plus
 * CSS variables) and how it opens: a dock at the bottom, or a button the site already has.
 * Everything renders in a shadow root, so a site's styles never leak in or out.
 *
 *   Launcher.mount({ trigger: el, theme: 'dark', here: 'cto' })   open from a site's own button
 *   Launcher.mount({ target: el })                                render a grid button into el
 *   Launcher.mount({ mode: 'dock' })                               the mutaafaziz.com dock
 *
 * ES5 on purpose: sites inline or vendor it as-is, no build step.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(root);
  else root.Launcher = factory(root);
}(typeof self !== 'undefined' ? self : this, function (root) {
  'use strict';

  var VERSION = '1.0.2';

  // 64×64 app icons, each self-contained (its own gradients), plus two 24×24 glyphs
  var ICONS = {
    oa: "<defs><linearGradient id=\"lg-oa\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#0A3D91\"/><stop offset=\".6\" stop-color=\"#4C9BEA\"/><stop offset=\".6\" stop-color=\"#5E7F45\"/><stop offset=\"1\" stop-color=\"#34502A\"/></linearGradient></defs><rect width=\"64\" height=\"64\" rx=\"14\" fill=\"url(#lg-oa)\"/><path d=\"M28.5 38.4h7l11 25.6h-29z\" fill=\"#2B2F36\"/><path d=\"M31.4 41h1.2l.5 5h-2.2zM31 49h2l.7 7.5h-3.4z\" fill=\"#F5F5F5\"/><path d=\"M32 8.5c1.2 0 1.9 1.4 1.9 3.6v6.4l11.6 6.2v2.8l-11.6-3.3v6.6l3.6 2.7v2.1L32 34.2l-5.5 1.4v-2.1l3.6-2.7v-6.6l-11.6 3.3v-2.8l11.6-6.2v-6.4c0-2.2.7-3.6 1.9-3.6z\" fill=\"#fff\"/>",
    ot: "<defs><linearGradient id=\"lg-sun\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#FFD25E\"/><stop offset=\"1\" stop-color=\"#FF3EA5\"/></linearGradient></defs><rect width=\"64\" height=\"64\" rx=\"14\" fill=\"#150726\"/><circle cx=\"32\" cy=\"36\" r=\"15\" fill=\"url(#lg-sun)\"/><path d=\"M15 33h34v1.6H15zM15 37h34v2.2H15z\" fill=\"#150726\"/><path d=\"M0 40h64v10C64 57.7 57.7 64 50 64H14C6.3 64 0 57.7 0 50z\" fill=\"#22093F\"/><path d=\"M32 40L6 64M32 40L19 64M32 40L45 64M32 40l26 24M2 44.5h60M0 51h64M0 59h64\" stroke=\"#FF3EA5\" stroke-width=\"1.1\" fill=\"none\" opacity=\".85\"/><text x=\"32\" y=\"30\" text-anchor=\"middle\" font-family=\"Arial Black,Helvetica Neue,Arial,sans-serif\" font-weight=\"900\" font-style=\"italic\" font-size=\"21\" fill=\"#5CF2FF\" stroke=\"#1B0A33\" stroke-width=\"1.2\" paint-order=\"stroke\">88</text>",
    cg: "<rect width=\"64\" height=\"64\" rx=\"14\" fill=\"#0B0B0C\"/><g transform=\"rotate(-8 32 38)\"><path d=\"M27.5 44l-1.7 7M32.5 44.2v8M37.5 44l1.7 7\" stroke=\"#fff\" stroke-opacity=\".5\" stroke-width=\"1.3\" stroke-linecap=\"round\" fill=\"none\"/><path d=\"M8.5 39.4l.6-3.8q.4-1.5 2.4-1.9l11.6-1.3c3.4-2.9 6.9-3.9 10.4-3.7 2.5.2 4.5 1.4 6 2.8l12.6 2.5q3 .8 3 3l-.4 2.4z\" fill=\"#fff\"/><path d=\"M25.6 32.4c2.6-2.1 5.2-2.7 7.8-2.5 1.8.2 3.4 1 4.4 2.2z\" fill=\"#0B0B0C\"/><circle cx=\"18.5\" cy=\"39.4\" r=\"4.1\" fill=\"#0B0B0C\" stroke=\"#fff\" stroke-width=\"1.5\"/><circle cx=\"46\" cy=\"39.4\" r=\"4.1\" fill=\"#0B0B0C\" stroke=\"#fff\" stroke-width=\"1.5\"/></g>",
    "180": "<rect width=\"64\" height=\"64\" rx=\"14\" fill=\"#0E5A2E\"/><path d=\"M8 12v40M20 12v40M44 12v40M56 12v40\" stroke=\"#fff\" stroke-opacity=\".22\" stroke-width=\"1.2\"/><text x=\"32\" y=\"39\" text-anchor=\"middle\" font-family=\"Arial Black,Helvetica Neue,Arial,sans-serif\" font-weight=\"900\" font-size=\"18\" fill=\"#fff\" letter-spacing=\"-.5\">18-0</text>",
    fe: "<rect width=\"64\" height=\"64\" rx=\"14\" fill=\"#0F172A\"/><rect x=\"9\" y=\"9\" width=\"27\" height=\"27\" rx=\"4\" fill=\"#22C55E\"/><rect x=\"39\" y=\"9\" width=\"16\" height=\"16\" rx=\"3\" fill=\"#38BDF8\"/><rect x=\"39\" y=\"28\" width=\"16\" height=\"8\" rx=\"2\" fill=\"#64748B\"/><rect x=\"9\" y=\"39\" width=\"17\" height=\"16\" rx=\"3\" fill=\"#F59E0B\"/><rect x=\"29\" y=\"39\" width=\"12\" height=\"16\" rx=\"3\" fill=\"#64748B\"/><rect x=\"44\" y=\"39\" width=\"11\" height=\"16\" rx=\"3\" fill=\"#475569\"/>",
    fxp: "<defs><linearGradient id=\"lg-xp\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#2F6FD0\"/><stop offset=\"1\" stop-color=\"#8CC4FF\"/></linearGradient></defs><rect width=\"64\" height=\"64\" rx=\"14\" fill=\"url(#lg-xp)\"/><path d=\"M0 44c14-9 34-11 64-4v10c0 7.7-6.3 14-14 14H14C6.3 64 0 57.7 0 50z\" fill=\"#3E9B3A\"/><path d=\"M20 30l12-10 12 10v14H20z\" fill=\"#fff\"/><path d=\"M17 31l15-13 15 13\" stroke=\"#C0392B\" stroke-width=\"3\" fill=\"none\" stroke-linejoin=\"round\"/><rect x=\"28.5\" y=\"34\" width=\"7\" height=\"10\" rx=\"1\" fill=\"#2F6FD0\"/><rect x=\"38\" y=\"9\" width=\"17\" height=\"10\" rx=\"5\" fill=\"#3AA43A\" stroke=\"#fff\" stroke-width=\"1\"/><text x=\"46.5\" y=\"16.9\" text-anchor=\"middle\" font-family=\"Arial,sans-serif\" font-weight=\"bold\" font-style=\"italic\" font-size=\"7.5\" fill=\"#fff\">XP</text>",
    siq: "<rect width=\"64\" height=\"64\" rx=\"14\" fill=\"#F26B1D\"/><circle cx=\"29\" cy=\"34\" r=\"15\" fill=\"none\" stroke=\"#fff\" stroke-width=\"2.4\"/><path d=\"M14 34h30M29 19v30M18.5 23.5c5 4.5 5 16.5 0 21M39.5 23.5c-5 4.5-5 16.5 0 21\" stroke=\"#fff\" stroke-width=\"2\" fill=\"none\"/><path d=\"M48 22c2.5 2.5 2.5 7.5 0 10M52 18.5c4.5 4.5 4.5 12.5 0 17\" stroke=\"#fff\" stroke-width=\"2.2\" fill=\"none\" stroke-linecap=\"round\"/>",
    af: "<defs><radialGradient id=\"lg-af\" cx=\".5\" cy=\".42\" r=\".7\"><stop offset=\"0\" stop-color=\"#16302C\"/><stop offset=\"1\" stop-color=\"#070B0D\"/></radialGradient></defs><rect width=\"64\" height=\"64\" rx=\"14\" fill=\"url(#lg-af)\"/><g fill=\"#7BE3C3\"><circle cx=\"32\" cy=\"12\" r=\"1.3\"/><circle cx=\"24\" cy=\"14\" r=\"1.2\"/><circle cx=\"40\" cy=\"14\" r=\"1.2\"/><circle cx=\"18\" cy=\"19\" r=\"1.2\"/><circle cx=\"46\" cy=\"19\" r=\"1.2\"/><circle cx=\"15\" cy=\"26\" r=\"1.2\"/><circle cx=\"49\" cy=\"26\" r=\"1.2\"/><circle cx=\"15\" cy=\"34\" r=\"1.2\"/><circle cx=\"49\" cy=\"34\" r=\"1.2\"/><circle cx=\"17\" cy=\"42\" r=\"1.2\"/><circle cx=\"47\" cy=\"42\" r=\"1.2\"/><circle cx=\"21\" cy=\"49\" r=\"1.2\"/><circle cx=\"43\" cy=\"49\" r=\"1.2\"/><circle cx=\"27\" cy=\"54\" r=\"1.2\"/><circle cx=\"37\" cy=\"54\" r=\"1.2\"/></g><g fill=\"#E8B648\"><circle cx=\"24\" cy=\"38\" r=\"1.1\"/><circle cx=\"27\" cy=\"43\" r=\"1.1\"/><circle cx=\"30\" cy=\"47\" r=\"1.1\"/><circle cx=\"34\" cy=\"47\" r=\"1.1\"/><circle cx=\"37\" cy=\"43\" r=\"1.1\"/><circle cx=\"40\" cy=\"38\" r=\"1.1\"/><circle cx=\"28\" cy=\"51\" r=\"1.1\"/><circle cx=\"32\" cy=\"52\" r=\"1.1\"/><circle cx=\"36\" cy=\"51\" r=\"1.1\"/></g><path d=\"M18 29l9 2.5 1.5 3.5-9-1zM46 29l-9 2.5-1.5 3.5 9-1z\" fill=\"#E6FFF7\"/>",
    dc: "<defs><linearGradient id=\"lg-dc\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#12293A\"/><stop offset=\"1\" stop-color=\"#0A1016\"/></linearGradient></defs><rect width=\"64\" height=\"64\" rx=\"14\" fill=\"url(#lg-dc)\"/><path d=\"M19 17h11a15 15 0 0 1 0 30H19z\" fill=\"none\" stroke=\"#33C3F0\" stroke-width=\"5\" stroke-linejoin=\"round\"/><path d=\"M50 9l4.5 4.5L50 18l-4.5-4.5z\" fill=\"#C96E2C\"/>",
    cto: "<defs><linearGradient id=\"lg-cto\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#2A1A10\"/><stop offset=\"1\" stop-color=\"#0B0B0C\"/></linearGradient></defs><rect width=\"64\" height=\"64\" rx=\"14\" fill=\"url(#lg-cto)\"/><path d=\"M43.3 22.1A15 15 0 1 0 43.3 41.9\" fill=\"none\" stroke=\"#F2EDE4\" stroke-width=\"5\" stroke-linecap=\"round\"/><path d=\"M32 26.5l5.5 5.5-5.5 5.5-5.5-5.5z\" fill=\"#C96E2C\"/>",
    mz: "<rect width=\"64\" height=\"64\" rx=\"14\" fill=\"#F3F1EC\"/><path d=\"M17 46V19l15 16 15-16v27\" fill=\"none\" stroke=\"#15181B\" stroke-width=\"5\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"50\" cy=\"13\" r=\"3.5\" fill=\"#7BE3C3\"/>",
    _find: "<circle cx=\"10.5\" cy=\"10.5\" r=\"6.5\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"/><path d=\"M15.5 15.5L21 21\" stroke=\"currentColor\" stroke-width=\"2.2\" stroke-linecap=\"round\"/>",
    _go: "<path d=\"M7 17L17 7M9 7h8v8\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>",
    _grid: "<g fill=\"currentColor\"><circle cx=\"5\" cy=\"5\" r=\"2.2\"/><circle cx=\"12\" cy=\"5\" r=\"2.2\"/><circle cx=\"19\" cy=\"5\" r=\"2.2\"/><circle cx=\"5\" cy=\"12\" r=\"2.2\"/><circle cx=\"12\" cy=\"12\" r=\"2.2\"/><circle cx=\"19\" cy=\"12\" r=\"2.2\"/><circle cx=\"5\" cy=\"19\" r=\"2.2\"/><circle cx=\"12\" cy=\"19\" r=\"2.2\"/><circle cx=\"19\" cy=\"19\" r=\"2.2\"/></g>"
  };

  // The apps. Order is the dock's order; kind groups them in the palette. Deep links only
  // where the target app really reads them (see each repo's AGENTS.md § URL parameters).
  var APPS = [
    { id: 'dc', name: 'Digital Craft AI', tip: 'AI systems for traditional industries, on retainer.', href: 'https://digitalcraftai.com/', color: '#0A1016', kind: 'Company', kw: 'digital craft ai company construction contractors real estate events lead response estimates voice agents demos' },
    { id: 'cto', name: 'Fractional CTO', tip: 'Strategic technology leadership on retainer, from Digital Craft AI.', href: 'https://cto.digitalcraftai.com/', color: '#0B0B0C', kind: 'Company', kw: 'cto fractional chief technology officer retainer engineering leadership roadmap architecture' },
    { id: 'mz', name: 'Mutaaf Aziz', tip: 'The founder: work, writing, and every edition since 1996.', href: 'https://mutaafaziz.com/', color: '#F3F1EC', kind: 'Company', kw: 'mutaaf aziz founder resume portfolio mission control about' },
    { id: 'oa', name: 'OpenAero DFW', tip: "Fly a 737 over real satellite imagery of DFW, in today's weather.", href: 'https://mutaafaziz.com/openaero/', color: '#1E6FD9', kind: 'Game', kw: 'flight simulator plane fly 737 cessna dfw dallas fort worth love field weather satellite' },
    { id: 'ot', name: 'OUTATIME 88', tip: 'Neon time-travel racer. Hit 88 mph to jump eras.', href: 'https://mutaafaziz.com/outatime/', color: '#150726', kind: 'Game', kw: 'racer racing car neon 88 mph time travel arcade drift boost' },
    { id: 'cg', name: 'COLD GAS', tip: 'Jump a roadster over parked EVs on ten cold-gas thrusters.', href: 'https://mutaafaziz.com/coldgas/', color: '#0B0B0C', kind: 'Game', kw: 'cold gas stunt jump roadster electric ev car thrusters ramp barrel roll 360 landing judges 3d' },
    { id: '180', name: '18-0', tip: 'Spin a franchise and an era, fill seven slots, chase a perfect season.', href: 'https://18-0.co', color: '#0E5A2E', kind: 'Game', kw: 'eighteen football nfl history draft perfect season' },
    { id: 'fe', name: 'fantasy-edge', tip: 'Every fantasy league on one board, sized by leverage.', href: 'https://mutaaf.github.io/fantasy-edge/', color: '#0F172A', kind: 'App', kw: 'fantasy football leagues leverage vision pro tv' },
    { id: 'fxp', name: 'Family XP', tip: 'A Windows-XP-style family OS that runs on your own Mac.', href: 'https://mutaaf.github.io/family-xp/', color: '#2F6FD0', kind: 'App', kw: 'family os windows xp chores kids arcade mac' },
    { id: 'siq', name: 'SportsIQ', tip: 'Voice-first coaching intelligence for youth sports.', href: 'https://youthsportsiq.com', color: '#F26B1D', kind: 'App', kw: 'sportsiq coaching youth sports basketball voice practice' },
    { id: 'af', name: 'aurora-field', tip: 'The open-source particle library behind the skies and the hero stories.', href: 'https://mutaaf.github.io/aurora-field/', color: '#0B1416', kind: 'Library', kw: 'aurora-field particles webgl sky helm ranger open source library web component storyboard' }
  ];
  var KINDS = [['Company', 'Company'], ['App', 'Apps'], ['Game', 'Games'], ['Library', 'Library']];

  var CSS = [
    ':host{all:initial;font-family:var(--l-font,inherit);color:var(--l-fg);-webkit-font-smoothing:antialiased}',
    ':host([data-theme=light]){--l-fg:#1D1D1F;--l-mute:rgba(29,29,31,.62);--l-panel:rgba(255,255,255,.94);--l-dock:rgba(255,255,255,.72);--l-line:rgba(0,0,0,.08);--l-hover:rgba(0,0,0,.055);--l-scrim:rgba(0,0,0,.28);--l-accent:#0066CC;--l-shadow:0 24px 70px rgba(0,0,0,.22)}',
    ':host([data-theme=dark]){--l-fg:#E6ECEF;--l-mute:rgba(230,236,239,.6);--l-panel:rgba(13,17,20,.96);--l-dock:rgba(11,15,18,.78);--l-line:rgba(255,255,255,.1);--l-hover:rgba(255,255,255,.07);--l-scrim:rgba(0,0,0,.55);--l-accent:#7BE3C3;--l-shadow:0 24px 70px rgba(0,0,0,.6)}',
    '*{box-sizing:border-box}',
    'svg.ic{display:block;width:100%;height:100%}',
    '.trig{all:unset;box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;width:var(--l-trigger,40px);height:var(--l-trigger,40px);border-radius:50%;color:inherit;cursor:pointer;transition:background .2s}',
    '.trig:hover{background:var(--l-hover)}.trig svg{width:20px;height:20px}',
    '.trig:focus-visible,a:focus-visible,button:focus-visible{outline:2px solid var(--l-accent);outline-offset:3px}',
    // dock (desktop) and thumb button (phones)
    '.dock{position:fixed;left:50%;bottom:calc(14px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:9998;display:flex;align-items:flex-end;gap:8px;padding:8px;border-radius:20px;background:var(--l-dock);-webkit-backdrop-filter:saturate(180%) blur(22px);backdrop-filter:saturate(180%) blur(22px);border:1px solid var(--l-line);box-shadow:0 10px 40px rgba(0,0,0,.18)}',
    '.dock a,.dock button{all:unset;position:relative;display:block;width:44px;height:44px;cursor:pointer;transition:transform .18s ease}',
    '.dock a:hover,.dock a:focus-visible,.dock button:hover{transform:translateY(-6px) scale(1.25)}',
    '.dock a.recent::after{content:"";position:absolute;left:50%;bottom:-6px;width:4px;height:4px;margin-left:-2px;border-radius:50%;background:currentColor;opacity:.7}',
    '.dock .find{display:flex;align-items:center;justify-content:center;border-radius:12px;background:var(--l-hover)}.dock .find svg{width:20px;height:20px}',
    '.dock .sep{align-self:stretch;width:1px;margin:2px 0;background:currentColor;opacity:.18}',
    '.bub{position:absolute;left:50%;bottom:calc(100% + 12px);transform:translate(-50%,4px);width:max-content;max-width:220px;padding:7px 10px;border-radius:9px;background:var(--l-panel);border:1px solid var(--l-line);box-shadow:0 6px 20px rgba(0,0,0,.18);font-size:12px;line-height:1.35;opacity:0;pointer-events:none;transition:opacity .15s,transform .15s}',
    '.bub b{display:block;font-size:12.5px}.bub span{display:block;color:var(--l-mute)}',
    '.dock a:hover .bub,.dock a:focus-visible .bub,.dock button:hover .bub{opacity:1;transform:translate(-50%,0) scale(.8);transform-origin:50% 100%}',
    '.fab{all:unset;display:none;position:fixed;left:16px;bottom:calc(16px + env(safe-area-inset-bottom));z-index:9998;width:52px;height:52px;border-radius:50%;align-items:center;justify-content:center;background:var(--l-dock);-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px);border:1px solid var(--l-line);box-shadow:0 8px 28px rgba(0,0,0,.2);cursor:pointer}.fab svg{width:22px;height:22px}',
    '@media (max-width:900px){.dock{display:none}.fab{display:flex}}',
    // palette: a centred box on desktop, a bottom sheet on phones
    '.pal[hidden]{display:none}.pal{position:fixed;inset:0;z-index:9999}',
    '.scrim{position:absolute;inset:0;background:var(--l-scrim);animation:lf .18s ease}',
    '.box{position:absolute;left:50%;top:14vh;transform:translateX(-50%);width:min(620px,calc(100vw - 32px));max-height:68vh;display:flex;flex-direction:column;overflow:hidden;border-radius:16px;background:var(--l-panel);color:var(--l-fg);border:1px solid var(--l-line);box-shadow:var(--l-shadow);-webkit-backdrop-filter:saturate(160%) blur(24px);backdrop-filter:saturate(160%) blur(24px);animation:lr .2s ease;outline:none}',
    '.grab{display:none}',
    '.field{display:flex;align-items:center;gap:12px;padding:14px 18px;border-bottom:1px solid var(--l-line)}.field svg{flex:0 0 auto;width:20px;height:20px;opacity:.6}',
    '.field input{all:unset;flex:1;min-width:0;font-size:18px;line-height:1.4;padding:4px 0;color:inherit}.field input::placeholder{color:var(--l-mute)}',
    'kbd{font:11px/1 ui-monospace,"SF Mono",Menlo,Consolas,monospace;padding:4px 6px;border-radius:5px;border:1px solid currentColor;opacity:.45}',
    'ul{list-style:none;margin:0;padding:6px 8px 10px;overflow-y:auto;overscroll-behavior:contain;flex:1}',
    '.h{padding:12px 10px 5px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--l-mute)}',
    '.opt{display:flex;align-items:center;gap:12px;padding:8px 10px;min-height:48px;border-radius:10px;cursor:pointer;color:inherit;text-decoration:none}',
    '.opt[aria-selected=true]{background:var(--l-hover)}',
    '.opt .oi{flex:0 0 auto;width:34px;height:34px}',
    '.tile{display:flex;width:34px;height:34px;align-items:center;justify-content:center;border-radius:9px;background:var(--l-hover);color:var(--l-accent)}.tile svg{width:18px;height:18px}',
    '.opt .ot{flex:1;min-width:0}.opt .ot b{display:block;font-size:15px;font-weight:600}.opt .ot span{display:block;font-size:12.5px;color:var(--l-mute);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.opt .ok{flex:0 0 auto;font-size:11px;color:var(--l-mute)}',
    '.none{padding:22px 10px;color:var(--l-mute);font-size:14px}',
    '.foot{margin:0;padding:9px 18px;font-size:11.5px;color:var(--l-mute);border-top:1px solid var(--l-line)}',
    '@media (max-width:900px){.box{top:auto;left:0;right:0;bottom:0;transform:none;width:auto;max-height:84vh;border-radius:22px 22px 0 0;padding-bottom:env(safe-area-inset-bottom);animation:ls .24s ease}.grab{display:block;width:40px;height:5px;margin:8px auto 2px;border-radius:3px;background:currentColor;opacity:.22;touch-action:none}.foot{display:none}.field{touch-action:none}}',
    '.fly{position:fixed;inset:0;z-index:10000;pointer-events:none;clip-path:circle(0 at 50% 50%);transition:clip-path .42s cubic-bezier(.6,0,.2,1)}',
    '@keyframes lf{from{opacity:0}}@keyframes lr{from{opacity:0;transform:translate(-50%,8px)}}@keyframes ls{from{transform:translateY(100%)}}',
    '@media (prefers-reduced-motion:reduce){.scrim,.box{animation:none}.dock a,.dock button,.fly{transition:none}}'
  ].join('');

  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  // every rendered icon gets its own gradient ids: a gradient inside a hidden copy (the dock on
  // phones) would otherwise blank every later copy that points at the same id
  var uid = 0;
  var own = function (body) { var n = ++uid; return body.replace(/(id="|url\(#)(lg-[a-z0-9-]+)/g, '$1$2-' + n); };
  var svg = function (id, vb) { return '<svg class="ic" viewBox="' + (vb || '0 0 64 64') + '" aria-hidden="true" focusable="false">' + own(ICONS[id] || '') + '</svg>'; };
  var reduced = function () { return !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches); };
  var typing = function (e) {
    var path = e.composedPath ? e.composedPath() : [e.target], i, el;
    for (i = 0; i < path.length; i++) {
      el = path[i];
      if (el && el.nodeType === 1 && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable)) return true;
    }
    return false;
  };
  var store = {
    get: function (k) { try { return JSON.parse(root.localStorage.getItem(k)) || []; } catch (e) { return []; } },
    set: function (k, v) { try { root.localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } }
  };

  function mount(opts) {
    opts = opts || {};
    var doc = root.document;
    if (!doc || !doc.body || !doc.body.attachShadow) return null;
    var mode = opts.mode || (opts.trigger || opts.target ? 'button' : 'dock');
    var key = opts.storageKey || 'launcher_recent';
    var here = opts.here || null;
    var pick = opts.apps;
    var apps = (pick ? pick.map(function (id) { for (var i = 0; i < APPS.length; i++) if (APPS[i].id === id) return APPS[i]; return null; }) : APPS.slice())
      .filter(function (a) { return a && a.id !== here; });
    var actions = (opts.actions || []).map(function (a, i) { return { id: 'act' + i, name: a.name, tip: a.tip || '', href: a.href || null, run: a.run || null, kind: 'Action', kw: a.kw || '', icon: a.icon || null, color: a.color || null }; });
    var listeners = [];
    var on = function (el, ev, fn, o) { el.addEventListener(ev, fn, o || false); listeners.push([el, ev, fn, o || false]); };

    // the shadow host for the palette, dock and launch flood
    var host = doc.createElement('div');
    host.setAttribute('data-launcher', VERSION);
    host.setAttribute('data-theme', opts.theme === 'dark' ? 'dark' : 'light');
    var vars = opts.vars || {}, k;
    for (k in vars) if (Object.prototype.hasOwnProperty.call(vars, k)) host.style.setProperty(k, vars[k]);
    var sr = host.attachShadow({ mode: 'open' });
    var html = '<style>' + CSS + '</style>';
    if (mode === 'dock') {
      html += '<nav class="dock" aria-label="' + esc(opts.label || 'Launch an app') + '">' + apps.map(function (a) {
        return '<a href="' + esc(a.href) + '" data-id="' + a.id + '">' + svg(a.id) + '<span class="bub"><b>' + esc(a.name) + '</b><span>' + esc(a.tip) + '</span></span></a>';
      }).join('') + '<span class="sep" aria-hidden="true"></span><button type="button" class="find" aria-haspopup="dialog" aria-keyshortcuts="Meta+K Control+K /">' + svg('_find', '0 0 24 24') + '<span class="bub"><b>Search apps</b><span>⌘K, Ctrl+K, or /</span></span></button></nav>' +
        '<button type="button" class="fab" aria-haspopup="dialog" aria-label="Apps">' + svg('_grid', '0 0 24 24') + '</button>';
    }
    html += '<div class="pal" hidden><div class="scrim" data-close></div><div class="box" role="dialog" aria-modal="true" aria-label="' + esc(opts.label || 'Launch an app') + '" tabindex="-1">' +
      '<div class="grab" aria-hidden="true"></div>' +
      '<div class="field">' + svg('_find', '0 0 24 24') + '<input type="text" role="combobox" aria-expanded="true" aria-controls="ll" aria-autocomplete="list" aria-label="Search apps" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Search apps"><kbd>esc</kbd></div>' +
      '<ul id="ll" role="listbox" aria-label="Apps"></ul>' +
      '<p class="foot" aria-hidden="true">↑ ↓ to move · ↵ to launch · ⌘↵ new tab · esc to close</p></div></div><div class="fly" aria-hidden="true"></div>';
    sr.innerHTML = html;
    doc.body.appendChild(host);

    var pal = sr.querySelector('.pal'), box = sr.querySelector('.box'), input = sr.querySelector('input'), list = sr.querySelector('ul'), fly = sr.querySelector('.fly');
    var shown = [], active = 0, opener = null, overflow = '';

    // the site's own button, or a grid button rendered into target
    var trigger = opts.trigger || null, tHost = null;
    if (!trigger && opts.target) {
      tHost = doc.createElement('span');
      tHost.style.display = 'inline-flex';
      tHost.setAttribute('data-theme', host.getAttribute('data-theme'));
      var tsr = tHost.attachShadow({ mode: 'open' });
      tsr.innerHTML = '<style>' + CSS + '</style><button type="button" class="trig" aria-haspopup="dialog" aria-label="' + esc(opts.label || 'Apps') + '" aria-keyshortcuts="Meta+K Control+K /">' + svg('_grid', '0 0 24 24') + '</button>';
      opts.target.appendChild(tHost);
      trigger = tsr.querySelector('button');
    }
    if (trigger) {
      trigger.setAttribute('aria-haspopup', 'dialog');
      trigger.setAttribute('aria-expanded', 'false');
      on(trigger, 'click', function (e) { e.preventDefault(); toggle(trigger); });
    }

    function recent() {
      var ids = store.get(key), out = [], i, j;
      for (i = 0; i < ids.length; i++) for (j = 0; j < apps.length; j++) if (apps[j].id === ids[i]) out.push(apps[j]);
      return out;
    }
    function score(a, q) {
      var name = a.name.toLowerCase(), hay = (name + ' ' + a.tip + ' ' + a.kw + ' ' + a.kind).toLowerCase(), words = q.split(/\s+/), i;
      if (name.indexOf(q) === 0) return 3;
      if (name.indexOf(q) >= 0) return 2;
      for (i = 0; i < words.length; i++) if (words[i] && hay.indexOf(words[i]) < 0) return 0;
      return 1;
    }
    function row(a, i) {
      // actions sit on a tile with a 24×24 glyph (theirs, or an arrow); apps show their own icon
      var ic = a.kind === 'Action' ? '<span class="tile"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + (a.icon || ICONS._go) + '</svg></span>' : svg(a.id);
      return '<li><a class="opt" role="option" id="lo' + i + '" data-i="' + i + '" aria-selected="' + (i === active) + '"' + (a.href ? ' href="' + esc(a.href) + '"' : '') + '>' +
        '<span class="oi">' + ic + '</span><span class="ot"><b>' + esc(a.name) + '</b><span>' + esc(a.tip) + '</span></span><span class="ok">' + esc(a.kind === 'Action' ? '' : a.kind) + '</span></a></li>';
    }
    function render() {
      var q = input.value.trim().toLowerCase(), out = '', groups = [], n = 0, i, g;
      shown = [];
      if (q) {
        var hits = actions.concat(apps).map(function (a) { return { a: a, s: score(a, q) }; }).filter(function (h) { return h.s > 0; });
        hits.sort(function (x, y) { return y.s - x.s; });
        groups.push(['', hits.map(function (h) { return h.a; })]);
      } else {
        var rec = recent();
        if (rec.length) groups.push(['Recent', rec]);
        if (actions.length) groups.push(['', actions]);
        for (i = 0; i < KINDS.length; i++) {
          g = apps.filter(function (a) { return a.kind === KINDS[i][0] && rec.indexOf(a) < 0; });
          if (g.length) groups.push([KINDS[i][1], g]);
        }
      }
      if (active >= 0) active = Math.max(0, active);
      for (i = 0; i < groups.length; i++) {
        if (!groups[i][1].length) continue;
        if (groups[i][0]) out += '<li class="h" role="presentation">' + esc(groups[i][0]) + '</li>';
        for (g = 0; g < groups[i][1].length; g++) { shown.push(groups[i][1][g]); out += row(groups[i][1][g], n++); }
      }
      if (active >= shown.length) active = shown.length - 1;
      list.innerHTML = shown.length ? out : '<li class="none">Nothing matches "' + esc(input.value.trim()) + '".</li>';
      select(active);
    }
    function select(i) {
      var opts2 = list.querySelectorAll('.opt'), j;
      active = Math.max(0, Math.min(i, shown.length - 1));
      for (j = 0; j < opts2.length; j++) opts2[j].setAttribute('aria-selected', String(j === active));
      if (opts2[active]) {
        input.setAttribute('aria-activedescendant', 'lo' + active);
        if (opts2[active].scrollIntoView) opts2[active].scrollIntoView({ block: 'nearest' });
      } else input.removeAttribute('aria-activedescendant');
    }

    function open(from) {
      if (!pal.hidden) return;
      opener = from || doc.activeElement;
      pal.hidden = false;
      overflow = doc.documentElement.style.overflow;
      doc.documentElement.style.overflow = 'hidden';
      input.value = ''; active = 0; render();
      if (trigger) trigger.setAttribute('aria-expanded', 'true');
      // phones don't get the keyboard thrown at them
      if (root.matchMedia && root.matchMedia('(max-width: 900px)').matches) box.focus(); else input.focus();
      if (opts.onOpen) opts.onOpen();
    }
    function close() {
      if (pal.hidden) return;
      pal.hidden = true;
      box.style.transform = '';
      doc.documentElement.style.overflow = overflow;
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
      if (opener && opener.focus) opener.focus();
    }
    function toggle(from) { if (pal.hidden) open(from); else close(); }

    function launch(a, e, el) {
      if (!a) return;
      if (a.kind !== 'Action') {
        var ids = store.get(key).filter(function (id) { return id !== a.id; });
        ids.unshift(a.id); store.set(key, ids.slice(0, 4));
        markRecent();
      }
      if (opts.onLaunch) { try { opts.onLaunch({ id: a.id, name: a.name, href: a.href, kind: a.kind }); } catch (err) { /* analytics never blocks a launch */ } }
      if (a.run) { close(); a.run(); return; }
      if (!a.href) return;
      if (e && (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1)) { root.open(a.href, '_blank', 'noopener'); return; }
      if (reduced() || !a.color || opts.flood === false) { root.location.assign(a.href); return; }
      var r = el && el.getBoundingClientRect ? el.getBoundingClientRect() : { left: root.innerWidth / 2, top: root.innerHeight / 2, width: 0, height: 0 };
      var at = (r.left + r.width / 2) + 'px ' + (r.top + r.height / 2) + 'px';
      fly.style.transition = 'none';
      fly.style.background = a.color;
      fly.style.clipPath = 'circle(0 at ' + at + ')';
      void fly.offsetWidth;
      fly.style.transition = '';
      fly.style.clipPath = 'circle(150vmax at ' + at + ')';
      root.setTimeout(function () { root.location.assign(a.href); }, 380);
    }
    function markRecent() {
      if (mode !== 'dock') return;
      var ids = store.get(key), links = sr.querySelectorAll('.dock a'), i;
      for (i = 0; i < links.length; i++) links[i].classList.toggle('recent', ids.indexOf(links[i].getAttribute('data-id')) >= 0);
    }
    var byId = function (id) { for (var i = 0; i < apps.length; i++) if (apps[i].id === id) return apps[i]; return null; };

    // palette events
    on(input, 'input', function () { active = 0; render(); });
    on(box, 'keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); select(active + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); select(active - 1); }
      else if (e.key === 'Enter') { e.preventDefault(); launch(shown[active], e, list.querySelectorAll('.opt .oi')[active]); }
      else if (e.key === 'Escape' || ((e.metaKey || e.ctrlKey) && !e.altKey && (e.key === 'k' || e.key === 'K'))) { e.preventDefault(); close(); }
      else if (e.key === 'Tab') { e.preventDefault(); input.focus(); }
      e.stopPropagation();
    });
    on(list, 'click', function (e) {
      var t = e.target.closest ? e.target.closest('.opt') : null;
      if (!t) return;
      var a = shown[+t.getAttribute('data-i')];
      if (a && a.href && (e.metaKey || e.ctrlKey || e.shiftKey)) return;   // the browser opens it in a new tab
      e.preventDefault();
      launch(a, e, t.querySelector('.oi'));
    });
    on(list, 'mousemove', function (e) {
      var t = e.target.closest ? e.target.closest('.opt') : null;
      if (t && +t.getAttribute('data-i') !== active) select(+t.getAttribute('data-i'));
    });
    on(sr.querySelector('.scrim'), 'click', close);

    // phones: drag the sheet down to dismiss
    var y0 = null, dy = 0;
    on(box, 'pointerdown', function (e) {
      if (!(root.matchMedia && root.matchMedia('(max-width: 900px)').matches)) return;
      if (!(e.target.closest && e.target.closest('.grab,.field'))) return;
      y0 = e.clientY; dy = 0; box.style.transition = 'none';
    });
    on(root, 'pointermove', function (e) { if (y0 === null) return; dy = Math.max(0, e.clientY - y0); box.style.transform = 'translateY(' + dy + 'px)'; });
    on(root, 'pointerup', function () {
      if (y0 === null) return;
      y0 = null; box.style.transition = 'transform .2s ease';
      if (dy > 90) close(); else box.style.transform = '';
    });

    // the dock
    if (mode === 'dock') {
      on(sr.querySelector('.dock'), 'click', function (e) {
        var a = e.target.closest ? e.target.closest('a') : null;
        if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        launch(byId(a.getAttribute('data-id')), e, a);
      });
      on(sr.querySelector('.find'), 'click', function (e) { toggle(e.currentTarget); });
      on(sr.querySelector('.fab'), 'click', function (e) { toggle(e.currentTarget); });
      markRecent();
    }

    // ⌘K / Ctrl+K toggles; / opens when you're not typing
    if (opts.shortcuts !== false) {
      on(doc, 'keydown', function (e) {
        if ((e.metaKey || e.ctrlKey) && !e.altKey && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); toggle(trigger); }
        else if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey && pal.hidden && !typing(e)) { e.preventDefault(); open(trigger); }
      });
    }
    // coming back with the browser's back button (a page restored from the back-forward cache): no
    // leftover flood. pageshow also fires on the first load, often after a quick ⌘K, so only on restore.
    on(root, 'pageshow', function (e) { if (!e.persisted) return; fly.style.transition = 'none'; fly.style.clipPath = 'circle(0 at 50% 50%)'; close(); });

    return {
      open: function () { open(trigger); },
      close: close,
      toggle: function () { toggle(trigger); },
      isOpen: function () { return !pal.hidden; },
      destroy: function () {
        close();
        for (var i = 0; i < listeners.length; i++) listeners[i][0].removeEventListener(listeners[i][1], listeners[i][2], listeners[i][3]);
        if (host.parentNode) host.parentNode.removeChild(host);
        if (tHost && tHost.parentNode) tHost.parentNode.removeChild(tHost);
        if (trigger && !tHost) { trigger.removeAttribute('aria-expanded'); }
      }
    };
  }

  return {
    VERSION: VERSION,
    apps: function () { return APPS.map(function (a) { var o = {}, k; for (k in a) o[k] = a[k]; return o; }); },
    icon: function (id) { return ICONS[id] ? '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">' + own(ICONS[id]) + '</svg>' : null; },
    mount: mount
  };
}));
