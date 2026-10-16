// Shared helpers for the CLI scripts. No dependencies beyond Node 18+.
import {execFileSync, spawnSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath, pathToFileURL} from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ENGINE = path.join(ROOT, 'engine');
export const DEFAULT_WORKSPACE = path.join(os.homedir(), 'explainer-studio');

// Mirrors engine/src/engine/cadence.ts (for docs and shot lists; timings come from the engine)
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

// Which engine a script works on: --workspace DIR if given; else this copy's engine if it has the video;
// else the default workspace (~/explainer-studio), where new-video.mjs puts videos.
export const engineFor = (a, slug) => {
  if (a.workspace) return path.join(path.resolve(String(a.workspace)), 'engine');
  if (!slug || fs.existsSync(videoDir(ENGINE, slug))) return ENGINE;
  const ws = path.join(DEFAULT_WORKSPACE, 'engine');
  if (fs.existsSync(videoDir(ws, slug))) {
    console.log(`No "${slug}" in ${ENGINE}; using the workspace engine ${ws}`);
    return ws;
  }
  console.error(`No video "${slug}" in ${ENGINE} or ${ws}. Scaffold it with new-video.mjs, or pass --workspace DIR.`);
  process.exit(1);
};

// Bundle the engine once and read compositions from it. The engine is the source of truth for timing
// and captions: each composition carries `timing` (scene start/end, captions) and `cuts` in its props.
export const openEngine = async (engine) => {
  const require = createRequire(path.join(engine, 'package.json'));
  const load = (m) => import(pathToFileURL(require.resolve(m)).href);
  const {bundle} = await load('@remotion/bundler');
  const renderer = await load('@remotion/renderer');
  console.log('Bundling…');
  const serveUrl = await bundle({entryPoint: path.join(engine, 'src', 'index.ts')});
  const select = (id, inputProps = {}) => renderer.selectComposition({serveUrl, id, inputProps});
  return {serveUrl, renderer, select};
};

// For a fully generative cut with no video.tsx: approximate the engine's timeline from storyboard.json,
// in the same shape as a composition's `timing` prop. When video.tsx exists, use the composition instead.
export const storyboardTiming = (sb) => {
  const tick = 30;
  const seconds = (s) => {
    let land = -Infinity;
    let words = 0;
    s.caption.forEach((l, i) => {
      const n = l.trim().split(/\s+/).length;
      const start = Math.max(i === 0 ? 2 : 0, land + CADENCE.captionPauseSec * tick);
      land = start + (n - 1) * 3 + 10;
      words += n;
    });
    return Math.max(s.baseSeconds ?? 0, (land + Math.max(1.5, words * 0.22) * tick) / tick);
  };
  let t = 0;
  const scenes = sb.scenes.map((s, i) => {
    const len = seconds(s) + (i === sb.scenes.length - 1 ? CADENCE.conclusionHoldSec : CADENCE.holdSec);
    const out = {id: s.id, start: t, end: t + len, seconds: len, captions: s.caption};
    t += len;
    return out;
  });
  return {fps: sb.fps ?? 60, total: t + CADENCE.outroSec, outroStart: t, scenes};
};

/** Timing from the engine composition, or from the storyboard with --from-storyboard or when there is no video.tsx. */
export const timingFor = async (a, engine, slug, sb, format) => {
  if (a['from-storyboard'] || !fs.existsSync(path.join(videoDir(engine, slug), 'video.tsx'))) {
    console.log('Timing approximated from storyboard.json (no engine composition used).');
    return storyboardTiming(sb);
  }
  const {select} = await openEngine(engine);
  const {timing} = (await select(`${pascal(slug)}-${format}-${sb.theme ?? 'dark'}`)).props;
  checkStoryboard(sb, timing);
  return timing;
};

const plain = (s) => s.replace(/\*/g, '').replace(/\s+/g, ' ').trim();

/** Warn when storyboard.json captions no longer match the scenes in video.tsx. */
export const checkStoryboard = (sb, timing) => {
  const byId = Object.fromEntries(timing.scenes.map((s) => [s.id, s]));
  const warn = [];
  for (const s of sb.scenes) {
    const v = byId[s.id];
    if (!v) warn.push(`storyboard scene "${s.id}" is not in video.tsx`);
    else if (plain(s.caption.join(' ')) !== plain(v.captions.join(' '))) warn.push(`"${s.id}" captions differ: storyboard "${plain(s.caption.join(' / '))}", video "${plain(v.captions.join(' / '))}"`);
  }
  for (const v of timing.scenes) if (!sb.scenes.some((s) => s.id === v.id)) warn.push(`video scene "${v.id}" is not in storyboard.json`);
  for (const w of warn) console.warn(`Warning: ${w} (using the video's version)`);
  return warn;
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
