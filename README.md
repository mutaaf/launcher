# launcher

One app launcher for **mutaafaziz.com**, **digitalcraftai.com** and **cto.digitalcraftai.com**: the same apps, the same ⌘K palette, the same launch. Each site picks a skin and the way it opens. Zero dependencies, ES5, about 10 KB gzipped, and everything renders in a shadow root so a site's CSS never leaks in or out.

Demo: https://mutaaf.github.io/launcher/

```html
<script src="launcher.js"></script>
<script>
  // open from a button the site already has (the Digital Craft navbars)
  Launcher.mount({ trigger: document.querySelector('#apps'), theme: 'dark', here: 'cto',
                   vars: { '--l-accent': '#C96E2C' } });

  // or render a grid button into a slot
  Launcher.mount({ target: document.querySelector('#slot') });

  // or a bottom dock: the mutaafaziz.com model (a thumb button and bottom sheet on phones)
  Launcher.mount({ mode: 'dock', here: 'mz' });
</script>
```

## Options

| option | default | what it does |
|---|---|---|
| `mode` | `'button'` with `trigger`/`target`, else `'dock'` | where it lives |
| `trigger` | | an element the site owns; clicking it toggles the palette |
| `target` | | an element to render a grid button into |
| `theme` | `'light'` | `'light'` or `'dark'` |
| `vars` | | CSS variables on the host: `--l-accent`, `--l-fg`, `--l-mute`, `--l-panel`, `--l-dock`, `--l-line`, `--l-hover`, `--l-scrim`, `--l-font`, `--l-trigger` |
| `here` | | the id of the site it's on, left out of the list |
| `apps` | all | a list of app ids, to pick and order |
| `actions` | | site rows above the apps: `{ name, tip, href }` or `{ name, tip, run }` |
| `onLaunch` | | `function ({ id, name, href, kind })`, for analytics; never blocks a launch |
| `onOpen` | | called when the palette opens |
| `shortcuts` | `true` | ⌘K / Ctrl+K toggles, `/` opens (never while you're typing) |
| `flood` | `true` | the launch floods the app's colour from its icon, then navigates |
| `storageKey` | `'launcher_recent'` | localStorage key for recents (max 4) |

`mount` returns `{ open, close, toggle, isOpen, destroy }`. `Launcher.apps()` lists the apps; `Launcher.icon(id)` returns an app's icon as an SVG string.

## The apps

The list in `src/launcher.js` is the one source. Adding an app means one row in `APPS` and one 64×64 icon in `ICONS` (self-contained: its own gradients). Link only to things that exist, and deep-link only with parameters the target app really reads (see that repo's AGENTS.md § URL parameters).

Behaviour, from mutaafaziz.com's original: recents first, results grouped by kind, ↑ ↓ ↵, ⌘↵ for a new tab, modifier and middle clicks keep the browser's own new-tab behaviour, reduced motion navigates at once, phones get a bottom sheet you drag down to dismiss and don't get the keyboard thrown at them.

## Sites vendor it

Each site copies `src/launcher.js` in, pinned by hash (the aurora-field pattern), so no site depends on another at runtime:

- digital-craft-architect: `node scripts/launcher.mjs --sync ../launcher`

## Develop

```
npm install
npx playwright install chromium
npm test        # ES5 parse, the app list, and the launcher in a real browser
```
