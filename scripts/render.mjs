#!/usr/bin/env node
// Render a video (silent MP4s), or one still per scene for checking layouts.
//
//   node scripts/render.mjs <slug> [--brand <id>] [--themes dark,light] [--formats 9x16,16x9] [--out DIR] [--stills]
//
// Defaults: 9:16 (vertical), dark, and the brand set in the video. --brand renders it as another brand or
// sub-brand from the design system (output names get the brand id). --stills renders the frame 0.3 s before
// each cut with the phone safe zones overlaid. 16:9 only works for videos whose VideoDef lists it in `formats`.
import fs from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {args, pascal, run} from './lib.mjs';

const a = args();
const slug = a._[0];
if (!slug) {
  console.error('Usage: node scripts/render.mjs <slug> [--brand <id>] [--themes dark,light] [--formats 9x16,16x9] [--out DIR] [--stills]');
  process.exit(1);
}
const engine = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', 'engine');
const formats = String(a.formats ?? '9x16').split(',');
const themes = String(a.themes ?? 'dark').split(',');
const brand = a.brand ? String(a.brand) : '';
const tag = brand ? `-${brand.replace('/', '--')}` : '';
const outDir = path.resolve(a.out ?? path.join(engine, 'out'));
fs.mkdirSync(outDir, {recursive: true});
const id = pascal(slug);
const comps = formats.flatMap((f) => themes.map((t) => ({f, t, comp: `${id}-${f}-${t}`})));

if (a.stills) {
  const require = createRequire(path.join(engine, 'package.json'));
  const load = (m) => import(pathToFileURL(require.resolve(m)).href);
  const {bundle} = await load('@remotion/bundler');
  const {selectComposition, renderStill} = await load('@remotion/renderer');
  console.log('Bundling…');
  const serveUrl = await bundle({entryPoint: path.join(engine, 'src', 'index.ts')});
  const inputProps = {safeZones: true, brand};
  for (const {f, t, comp} of comps) {
    const composition = await selectComposition({serveUrl, id: comp, inputProps});
    for (const cut of composition.props.cuts) {
      const output = path.join(outDir, `${slug}${tag}-${f}-${t}-${cut.id}.png`);
      await renderStill({composition, serveUrl, output, frame: cut.frame, inputProps, scale: 0.5});
      console.log(output);
    }
  }
} else {
  for (const {f, t, comp} of comps) {
    run('npx', ['remotion', 'render', 'src/index.ts', comp, path.join(outDir, `${slug}${tag}-${f}-${t}.mp4`), '--muted', '--crf=18', `--props=${JSON.stringify({brand})}`], {cwd: engine});
  }
}
console.log(`\nDone: ${outDir}`);
