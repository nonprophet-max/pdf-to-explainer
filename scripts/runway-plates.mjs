#!/usr/bin/env node
// Generate per-scene background plates with Runway (text-to-video), then wire them into the video.
// Plates are moving paper-cutout backdrops with no text; the engine keeps captions, brand and
// cadence crisp on top. Needs RUNWAYML_API_SECRET (https://dev.runwayml.com).
//
//   node scripts/runway-plates.mjs <slug> [--brand <id>] [--formats 9x16] [--model gen4.5] [--scenes hook,pi-path] [--dry-run]
//
// Only scenes whose storyboard entry has a "plate" object are generated. Costs credits:
// --dry-run prints each request and its seconds without calling the API. Scene lengths come from the
// engine composition (video.tsx), not storyboard.json (--from-storyboard approximates them without the
// engine); the prompts come from storyboard.json.
import fs from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';
import {GENERATIVE, args, engineFor, readPack, readStoryboard, timingFor, videoDir} from './lib.mjs';

const a = args();
const slug = a._[0];
if (!slug) {
  console.error('Usage: node scripts/runway-plates.mjs <slug> [--formats 9x16] [--model gen4.5] [--scenes a,b] [--dry-run]');
  process.exit(1);
}
const engine = engineFor(a, slug);
const sb = readStoryboard(engine, slug);
const pack = readPack(engine, a.brand ?? sb.brand);
const theme = pack.themes[sb.theme ?? 'dark'];
const formats = String(a.formats ?? (sb.formats ?? ['9x16']).join(',')).split(',');
const model = a.model ?? 'gen4.5';
const only = a.scenes ? new Set(String(a.scenes).split(',')) : null;
// gen4.5 text-to-video: ratio 1280:720 or 720:1280, integer duration 2–10 s, prompt ≤ 1000 chars
const RATIO = {'9x16': '720:1280', '16x9': '1280:720'};

const style = GENERATIVE.stylePrompt;
const promptFor = (scene, format) =>
  [
    scene.plate.prompt,
    style,
    `Palette: background ${theme.bg}, paper ${theme.paper2}, one accent ${theme.accent}`,
    format === '9x16' ? 'Vertical phone composition' : 'Wide composition; keep the left 40% empty for captions',
    GENERATIVE.rules,
  ]
    .map((x) => x.trim().replace(/\.$/, ''))
    .join('. ')
    .slice(0, 1000);

const timing = await timingFor(a, engine, slug, sb, formats[0]);
const times = Object.fromEntries(timing.scenes.map((t) => [t.id, t]));
const jobs = sb.scenes
  .filter((s) => s.plate && times[s.id] && (!only || only.has(s.id)))
  .flatMap((s) => formats.map((f) => ({s, f, duration: Math.min(10, Math.max(2, Math.ceil(times[s.id].seconds)))})));

if (!jobs.length) {
  console.log('No scenes with a "plate" in storyboard.json — nothing to generate.');
  process.exit(0);
}
console.log(`${jobs.length} plate(s), ${jobs.reduce((n, j) => n + j.duration, 0)} s of ${model} video`);

if (a['dry-run']) {
  for (const j of jobs) console.log(`\n[${j.s.id} ${j.f}] ${RATIO[j.f]} ${j.duration}s\n${promptFor(j.s, j.f)}`);
  process.exit(0);
}
if (!process.env.RUNWAYML_API_SECRET) {
  console.error('Set RUNWAYML_API_SECRET first.');
  process.exit(1);
}

const require = createRequire(path.join(engine, 'package.json'));
const RunwayML = require('@runwayml/sdk').default;
const client = new RunwayML();
const outDir = path.join(engine, 'public', 'plates', slug);
fs.mkdirSync(outDir, {recursive: true});

for (const j of jobs) {
  const file = path.join(outDir, `${j.s.id}-${j.f}.mp4`);
  if (fs.existsSync(file) && !a.force) {
    console.log(`skip ${path.basename(file)} (exists; --force to redo)`);
    continue;
  }
  console.log(`generating ${path.basename(file)} ...`);
  const task = await client.textToVideo
    .create({model, promptText: promptFor(j.s, j.f), ratio: RATIO[j.f], duration: j.duration, ...(j.s.plate.seed ? {seed: j.s.plate.seed} : {})})
    .waitForTaskOutput();
  const res = await fetch(task.output[0]);
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
}

// plates.json → video.tsx picks them up via withPlates()
const platesPath = path.join(videoDir(engine, slug), 'plates.json');
const plates = fs.existsSync(platesPath) ? JSON.parse(fs.readFileSync(platesPath, 'utf8')) : {};
for (const j of jobs) plates[j.s.id] = `plates/${slug}/${j.s.id}-{format}.mp4`;
fs.writeFileSync(platesPath, JSON.stringify(plates, null, 2) + '\n');
console.log(`Updated ${platesPath}`);
