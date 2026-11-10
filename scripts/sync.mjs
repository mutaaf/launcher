#!/usr/bin/env node
// The app list is generated from Cast List (github.com/mutaaf/cast-list), the portfolio's one catalog.
//   node scripts/sync.mjs           rewrite APPS in src/launcher.js from https://mutaafaziz.com/cast/api/launcher
//   node scripts/sync.mjs --check   exit 1 if APPS differs from the catalog (CI runs this)
// Icons stay here (ICONS, keyed by the same id); a new app needs one, and the tests say so.
import { readFileSync, writeFileSync } from 'node:fs';

const FEED = process.env.CAST_FEED ?? 'https://mutaafaziz.com/cast/api/launcher';
const FILE = new URL('../src/launcher.js', import.meta.url);
const q = (s) => (String(s).includes("'") ? JSON.stringify(String(s)) : `'${String(s).replace(/\\/g, '\\\\')}'`);
export const render = (apps) => `var APPS = [\n${apps.map((a) => `    { id: ${q(a.id)}, name: ${q(a.name)}, tip: ${q(a.tip)}, href: ${q(a.href)}, color: ${q(a.color)}, kind: ${q(a.kind)}, kw: ${q(a.kw)} }`).join(',\n')}\n  ];`;
const BLOCK = /var APPS = \[[\s\S]*?\n  \];/;

const res = await fetch(FEED);
if (!res.ok) { console.error(`Cast List answered ${res.status}`); process.exit(2); }
const { version, apps } = await res.json();
const src = readFileSync(FILE, 'utf8'), next = src.replace(BLOCK, render(apps));
if (process.argv.includes('--check')) {
  if (next !== src) { console.error(`APPS differs from Cast List (catalog ${version}). Run: node scripts/sync.mjs`); process.exit(1); }
  console.log(`APPS matches Cast List (catalog ${version}, ${apps.length} apps)`);
} else { writeFileSync(FILE, next); console.log(`APPS written from Cast List (catalog ${version}, ${apps.length} apps)`); }
