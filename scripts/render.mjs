#!/usr/bin/env node
// Render a video in every requested format and theme (silent MP4s).
//
//   node scripts/render.mjs <slug> [--themes dark,light] [--formats 9x16,16x9] [--out DIR] [--stills]
//
// Defaults: 9:16 (vertical) and the brand's default theme. --stills renders one PNG per scene instead
// (the frame just before each cut) with the phone safe zones overlaid, for checking layouts quickly.
// 16:9 only works for videos whose VideoDef lists it in `formats`.
import fs from 'node:fs';
import path from 'node:path';
import {args, pascal, readStoryboard, run, sceneTimes, tokens} from './lib.mjs';

const a = args();
const slug = a._[0];
if (!slug) {
  console.error('Usage: node scripts/render.mjs <slug> [--themes dark,light] [--formats 9x16,16x9] [--out DIR] [--stills]');
  process.exit(1);
}
const engine = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', 'engine');
const formats = String(a.formats ?? '9x16').split(',');
const themes = String(a.themes ?? tokens().defaultTheme).split(',');
const outDir = path.resolve(a.out ?? path.join(engine, 'out'));
fs.mkdirSync(outDir, {recursive: true});
const id = pascal(slug);
const npx = (argv) => run('npx', ['remotion', ...argv], {cwd: engine});

for (const f of formats) {
  for (const t of themes) {
    const comp = `${id}-${f}-${t}`;
    if (a.stills) {
      // one still per scene, 0.3 s before its cut (60 fps)
      const sb = readStoryboard(engine, slug);
      for (const s of sceneTimes(sb)) {
        const frame = Math.max(0, Math.round((s.end - 0.3) * (sb.fps ?? 60)));
        npx(['still', 'src/index.ts', comp, path.join(outDir, `${slug}-${f}-${t}-${s.id}.png`), `--frame=${frame}`, '--scale=0.5', '--props={"safeZones":true}']);
      }
    } else {
      npx(['render', 'src/index.ts', comp, path.join(outDir, `${slug}-${f}-${t}.mp4`), '--muted', '--crf=18']);
    }
  }
}
console.log(`\nDone: ${outDir}`);
