#!/usr/bin/env node
// Export a storyboard as a model-agnostic shot list (Markdown + JSON), for any video model
// (Runway, Veo, Sora, Kling...) or a human editor. Timings already include the house cadence.
//
//   node scripts/export-prompts.mjs <slug> [--format 9x16|16x9] [--out DIR]
import fs from 'node:fs';
import path from 'node:path';
import {CADENCE, GENERATIVE, args, readPack, readStoryboard, sceneTimes} from './lib.mjs';

const a = args();
const slug = a._[0];
if (!slug) {
  console.error('Usage: node scripts/export-prompts.mjs <slug> [--format 9x16|16x9] [--out DIR]');
  process.exit(1);
}
const engine = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', 'engine');
const sb = readStoryboard(engine, slug);
const pack = readPack(engine, a.brand ?? sb.brand);
const theme = pack.themes[sb.theme ?? 'dark'];
const format = a.format ?? '9x16';
const times = sceneTimes(sb);
const style = `${GENERATIVE.stylePrompt}, palette ${theme.bg} with one accent ${theme.accent}`;
const fmt = (s) => s.toFixed(2);
const clean = (line) => line.replace(/\*/g, '');

const shots = sb.scenes.map((s, i) => ({
  id: s.id,
  role: s.role,
  start: +fmt(times[i].start),
  end: +fmt(times[i].end),
  captions: s.caption.map(clean),
  highlight: s.caption.flatMap((l) => l.split(' ').filter((w) => w.startsWith('*')).map((w) => clean(w).replace(/[.,:;!?]+$/, ''))),
  visual: s.visual,
  prompt: [s.plate?.prompt ?? s.visual, style, GENERATIVE.rules].map((x) => x.trim().replace(/\.$/, '')).join('. ') + '.',
}));
const total = times.at(-1).end + CADENCE.outroSec;

const md = [
  `# ${sb.title} — shot list`,
  ``,
  `Brand ${pack.name}${pack.component ? ` · ${pack.component.name}` : ''} · format ${format} · theme ${sb.theme ?? 'dark'} · total ${fmt(total)} s (approx.; the engine is exact) · silent`,
  ``,
  `Cadence: caption blocks appear ${CADENCE.captionPauseSec} s apart (after the previous block has landed, including after each scene's first line); each scene ends with a ${CADENCE.holdSec} s hold, the last content scene with a ${CADENCE.conclusionHoldSec} s hold, then a ${CADENCE.outroSec} s brand outro.`,
  `Generate visuals without text; add captions in post (kinetic, word by word, highlighted words ${theme.highlight === 'marker' ? `on an ${theme.accent} marker` : `in ${theme.accentText}`}, font ${pack.fonts.display}).`,
  ``,
  ...shots.flatMap((s) => [
    `## ${s.id} (${s.role}) · ${s.start}–${s.end} s`,
    ``,
    `Captions:`,
    ...s.captions.map((c) => `> ${c}`),
    ``,
    `Highlight: ${s.highlight.join(', ') || '—'}`,
    ``,
    `Visual: ${s.visual}`,
    ``,
    `Prompt: ${s.prompt}`,
    ``,
  ]),
  `## outro · ${fmt(times.at(-1).end)}–${fmt(total)} s`,
  ``,
  `Logo spins in, "${pack.name}"${pack.component ? ` with "${pack.component.name}"` : ''}${sb.outro?.tagline ? `, "${sb.outro.tagline}"` : ''}${(sb.outro?.url ?? pack.url) ? `, URL pill "${sb.outro?.url ?? pack.url}"` : ''}${sb.outro?.note ? `, note "${sb.outro.note}"` : ''}${pack.endorsement ? `, "${pack.endorsement}"` : ''}.`,
  ``,
].join('\n');

const outDir = path.resolve(a.out ?? path.join(engine, 'out'));
fs.mkdirSync(outDir, {recursive: true});
fs.writeFileSync(path.join(outDir, `${slug}-shots.md`), md);
fs.writeFileSync(path.join(outDir, `${slug}-shots.json`), JSON.stringify({title: sb.title, format, total, shots}, null, 2));
console.log(`Wrote ${path.join(outDir, `${slug}-shots.md`)} and .json`);
