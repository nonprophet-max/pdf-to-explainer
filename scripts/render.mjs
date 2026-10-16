#!/usr/bin/env node
// Render a video (silent MP4s), or one still per scene for checking layouts.
//
//   node scripts/render.mjs <slug> [--brand <id>] [--themes dark,light] [--formats 9x16,16x9] [--out DIR] [--stills]
//
// Defaults: 9:16 (vertical), dark, and the brand set in the video. --brand renders it as another brand or
// sub-brand from the design system (output names get the brand id). --stills renders the frame 0.3 s before
// each cut with the phone safe zones overlaid, and warns about caption blocks that wrap badly. 16:9 only works
// for videos whose VideoDef lists it in `formats`.
//
// Run the workspace copy (node ~/explainer-studio/scripts/render.mjs <slug>). Run from elsewhere, it uses
// its own engine if that has the video, else ~/explainer-studio; --workspace DIR picks another one.
import fs from 'node:fs';
import path from 'node:path';
import {args, engineFor, openEngine, pascal, run} from './lib.mjs';

const a = args();
const slug = a._[0];
if (!slug) {
  console.error('Usage: node scripts/render.mjs <slug> [--brand <id>] [--themes dark,light] [--formats 9x16,16x9] [--out DIR] [--stills]');
  process.exit(1);
}
const engine = engineFor(a, slug);
const formats = String(a.formats ?? '9x16').split(',');
const themes = String(a.themes ?? 'dark').split(',');
const brand = a.brand ? String(a.brand) : '';
const tag = brand ? `-${brand.replace('/', '--')}` : '';
const outDir = path.resolve(a.out ?? path.join(engine, 'out'));
fs.mkdirSync(outDir, {recursive: true});
const id = pascal(slug);
const comps = formats.flatMap((f) => themes.map((t) => ({f, t, comp: `${id}-${f}-${t}`})));

if (a.stills) {
  const {serveUrl, renderer, select} = await openEngine(engine);
  const inputProps = {safeZones: true, brand};
  // Caption measures its real line breaks in the browser and logs "[caption-wrap] …" (see parts.tsx)
  const wraps = new Set();
  const onBrowserLog = (log) => {
    if (log.text.startsWith('[caption-wrap]')) wraps.add(log.text.slice(15));
  };
  for (const {f, t, comp} of comps) {
    const composition = await select(comp, inputProps);
    for (const cut of composition.props.cuts) {
      const output = path.join(outDir, `${slug}${tag}-${f}-${t}-${cut.id}.png`);
      await renderer.renderStill({composition, serveUrl, output, frame: cut.frame, inputProps, scale: 0.5, onBrowserLog});
      console.log(output);
    }
  }
  if (wraps.size) {
    console.warn('\nCaption blocks that wrap badly (a single word alone on a wrapped line). Shorten the block, lower its size,');
    console.warn('or break it by hand with "\\n" between phrases:');
    for (const w of wraps) console.warn(`  ${w}`);
  }
} else {
  for (const {f, t, comp} of comps) {
    run('npx', ['remotion', 'render', 'src/index.ts', comp, path.join(outDir, `${slug}${tag}-${f}-${t}.mp4`), '--muted', '--crf=18', `--props=${JSON.stringify({brand})}`], {cwd: engine});
  }
}
console.log(`\nDone: ${outDir}`);
