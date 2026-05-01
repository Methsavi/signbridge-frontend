/**
 * update-styles.mjs
 * Batch-replaces Tailwind class strings in admin JSX files to apply
 * glass-morphism utilities (bg-glass, glass-input, glass-button).
 *
 * Usage:  node scripts/update-styles.mjs
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const TARGET_DIRS = [
  join(__dirname, '../src/pages/admin'),
  join(__dirname, '../src/components/admin'),
];

/** Ordered list of [pattern, replacement] pairs (combined from both passes). */
const REPLACEMENTS = [
  // ── Pass 1 ──────────────────────────────────────────────────────────────
  [/bg-white\/70\s+dark:bg-slate-900\/70\s+backdrop-blur-[a-z0-9]+/g,          'bg-glass'],
  [/bg-white\s+dark:bg-slate-900/g,                                              'bg-glass'],
  [/bg-white\s+dark:bg-slate-800\s+border\s+border-slate-200\s+dark:border-slate-700/g, 'glass-input'],
  [/bg-white\s+dark:bg-slate-800\/50/g,                                          'bg-white/10 dark:bg-black/30 backdrop-blur-md'],
  [/bg-white\s+dark:bg-slate-800/g,                                              'bg-white/5 dark:bg-black/20 backdrop-blur-md'],
  [/bg-slate-50\s+dark:bg-slate-800\/50/g,                                       'bg-white/20 dark:bg-black/40'],
  [/bg-slate-50\s+dark:bg-slate-900\/50/g,                                       'bg-white/10 dark:bg-black/20'],
  [/bg-slate-50\/50\s+dark:bg-slate-800\/20/g,                                   'bg-white/10 dark:bg-black/20'],
  [/hover:bg-slate-50\s+dark:hover:bg-slate-800\/30/g,                           'hover:bg-white/20 dark:hover:bg-white/10'],
  [/bg-blue-600 hover:bg-blue-700/g,                                             'glass-button bg-blue-600/80 hover:bg-blue-600'],

  // ── Pass 2 ──────────────────────────────────────────────────────────────
  [/bg-white\/[0-9]+\s+dark:bg-slate-900\/[0-9]+/g,                             'bg-glass'],
  [/bg-white\/50 border border-slate-200 rounded-lg backdrop-blur-md hover:bg-white\/80 dark:bg-slate-900\/50 dark:border-slate-800 dark:hover:bg-slate-800\/80/g, 'glass-button rounded-lg'],
  [/bg-white\/80 dark:bg-slate-900\/80 border-slate-200\/50 dark:border-slate-800\/50 backdrop-blur-xl/g, 'bg-glass'],
  [/bg-white\/50 focus:bg-white dark:bg-slate-950\/50 dark:focus:bg-slate-900/g, 'glass-input'],
  [/border-2 border-slate-200\/80/g,                                             'border border-white/20'],
  [/bg-white\/95 dark:bg-slate-900\/95 backdrop-blur-md/g,                       'bg-glass'],
  [/bg-white\/20 dark:bg-black\/40 text-slate-500 dark:text-slate-400/g,         'bg-white/20 dark:bg-black/40 text-slate-700 dark:text-slate-300'],
  [/bg-white\/10 dark:bg-black\/20/g,                                            'bg-white/20 dark:bg-black/40 backdrop-blur-md border border-white/20'],
  [/bg-white\/5 dark:bg-black\/20 backdrop-blur-md/g,                            'glass-input'],
  [/bg-slate-200 peer-focus:outline-none/g,                                      'bg-white/20 peer-focus:outline-none'],
  [/after:bg-white(?!\/)/g,                                                      'after:bg-white/80'],
];

function walkJsx(dir, results = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walkJsx(full, results);
    } else if (extname(entry) === '.jsx') {
      results.push(full);
    }
  }
  return results;
}

function processFile(filepath) {
  const original = readFileSync(filepath, 'utf8');
  let updated = original;
  for (const [pattern, replacement] of REPLACEMENTS) {
    updated = updated.replace(pattern, replacement);
  }
  if (updated !== original) {
    writeFileSync(filepath, updated, 'utf8');
    console.log('Updated:', filepath);
  }
}

const files = TARGET_DIRS.flatMap(walkJsx);
files.forEach(processFile);
console.log(`Done — processed ${files.length} file(s).`);
