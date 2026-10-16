// Shared helpers for the CLI scripts. No dependencies beyond Node 18+.
import {execFileSync, spawnSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ENGINE = path.join(ROOT, 'engine');
export const DEFAULT_WORKSPACE = path.join(os.homedir(), 'explainer-studio');

// Mirrors engine/src/engine/cadence.ts
export const CADENCE = {holdSec: 1.15, conclusionHoldSec: 2, outroSec: 3.2, captionPauseSec: 0.5};

export const pascal = (slug) => slug.replace(/(^|[-_ ]+)(\w)/g, (_, __, c) => c.toUpperCase());

export const args = (argv = process.argv.slice(2)) => {
  const out = {_: []};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=');
      out[k] = v ?? (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true);
    } else out._.push(a);
  }
  return out;
};

// Brand pack built by scripts/brands.mjs from the design system.
export const readPack = (engine, id) => {
  const p = path.join(engine, 'src', 'brand-packs', `${id.replace('/', '--')}.json`);
  if (!fs.existsSync(p)) throw new Error(`No brand pack "${id}". Run: node scripts/brands.mjs sync (then brands.mjs list)`);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
};

// Style for generated plates (Runway or any video model). Brand colours are appended per brand.
export const GENERATIVE = {
  stylePrompt: 'Abstract 2.5D paper-cutout backdrop: layered matte paper shapes with soft drop shadows, slow gentle parallax drift, shallow depth, calm and minimal, subtle paper grain',
  rules: 'No text, letters, numbers, logos, UI, faces or hands. Keep the top third, the bottom fifth and the right edge calm and low-contrast so captions and app UI stay readable.',
};

export const videoDir = (engine, slug) => path.join(engine, 'src', 'videos', slug);

export const readStoryboard = (engine, slug) => {
  const p = path.join(videoDir(engine, slug), 'storyboard.json');
  if (!fs.existsSync(p)) throw new Error(`No storyboard at ${p}`);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
};

/** Scene start/end times in seconds, following the house cadence. */
// Approximates the engine's timeline from the storyboard (the engine is the source of truth).
const captionSeconds = (lines) => {
  let land = -Infinity;
  let words = 0;
  lines.forEach((l, i) => {
    const n = l.split(' ').length;
    const start = Math.max(i === 0 ? 2 : 0, land + CADENCE.captionPauseSec * 30);
    land = start + (n - 1) * 3 + 10;
    words += n;
  });
  return (land + Math.max(1.5, words * 0.22) * 30) / 30;
};

export const sceneTimes = (sb) => {
  let t = 0;
  return sb.scenes.map((s, i) => {
    const last = i === sb.scenes.length - 1;
    const base = Math.max(s.baseSeconds ?? 0, captionSeconds(s.caption));
    const len = base + (last ? CADENCE.conclusionHoldSec : CADENCE.holdSec);
    const out = {id: s.id, start: t, end: t + len, seconds: len};
    t += len;
    return out;
  });
};

export const run = (cmd, argv, opts = {}) => {
  const r = spawnSync(cmd, argv, {stdio: 'inherit', ...opts});
  if (r.status !== 0) throw new Error(`${cmd} ${argv.join(' ')} failed`);
};

export const has = (cmd) => {
  try {
    execFileSync('which', [cmd], {stdio: 'ignore'});
    return true;
  } catch {
    return false;
  }
};
