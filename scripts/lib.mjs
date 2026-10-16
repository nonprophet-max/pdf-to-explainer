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
export const CADENCE = {holdSec: 1.15, conclusionHoldSec: 2, outroSec: 3.2};

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

export const tokens = () => JSON.parse(fs.readFileSync(path.join(ROOT, 'brand', 'tokens.json'), 'utf8'));

export const videoDir = (engine, slug) => path.join(engine, 'src', 'videos', slug);

export const readStoryboard = (engine, slug) => {
  const p = path.join(videoDir(engine, slug), 'storyboard.json');
  if (!fs.existsSync(p)) throw new Error(`No storyboard at ${p}`);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
};

/** Scene start/end times in seconds, following the house cadence. */
export const sceneTimes = (sb) => {
  let t = 0;
  return sb.scenes.map((s, i) => {
    const last = i === sb.scenes.length - 1;
    const len = s.baseSeconds + (last ? CADENCE.conclusionHoldSec : CADENCE.holdSec);
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
