#!/usr/bin/env node
// Scaffold a new explainer in a private workspace (default ~/explainer-studio), outside this repo,
// so source PDFs and drafts never end up in the public skill.
//
//   node scripts/new-video.mjs <slug> [--title "Video title"] [--workspace DIR]
//   node scripts/new-video.mjs --sync-brand [--workspace DIR]   # re-copy brand/ after editing the bible
import fs from 'node:fs';
import path from 'node:path';
import {DEFAULT_WORKSPACE, ROOT, args, pascal, run} from './lib.mjs';

const a = args();
const ws = path.resolve(a.workspace ?? DEFAULT_WORKSPACE);
const skip = new Set(['node_modules', 'out', '.git']);

const copyTree = (from, to, {exampleOnly = false} = {}) =>
  fs.cpSync(from, to, {
    recursive: true,
    verbatimSymlinks: true,
    filter: (src) => {
      const rel = path.relative(from, src);
      if (rel.split(path.sep).some((p) => skip.has(p))) return false;
      // only ship the reference example into a fresh workspace
      if (exampleOnly && /^src[\\/]videos[\\/][^\\/]+/.test(rel) && !rel.startsWith(path.join('src', 'videos', 'who-sees-what'))) return false;
      return true;
    },
  });

const ensureWorkspace = () => {
  if (fs.existsSync(path.join(ws, 'engine', 'node_modules'))) return;
  console.log(`Creating workspace at ${ws}`);
  fs.mkdirSync(ws, {recursive: true});
  for (const d of ['brand', 'scripts', 'docs', 'products']) copyTree(path.join(ROOT, d), path.join(ws, d));
  copyTree(path.join(ROOT, 'engine'), path.join(ws, 'engine'), {exampleOnly: true});
  fs.copyFileSync(path.join(ROOT, 'SKILL.md'), path.join(ws, 'SKILL.md'));
  fs.writeFileSync(path.join(ws, '.gitignore'), 'node_modules\nout\n');
  run('npm', ['install', '--no-audit', '--no-fund'], {cwd: path.join(ws, 'engine')});
  // Remotion's bundler needs esbuild's native binary
  run('npm', ['approve-scripts', 'esbuild'], {cwd: path.join(ws, 'engine')});
  run('npm', ['rebuild', 'esbuild'], {cwd: path.join(ws, 'engine')});
};

if (a['sync-brand']) {
  fs.rmSync(path.join(ws, 'brand'), {recursive: true, force: true});
  copyTree(path.join(ROOT, 'brand'), path.join(ws, 'brand'));
  fs.rmSync(path.join(ws, 'products'), {recursive: true, force: true});
  copyTree(path.join(ROOT, 'products'), path.join(ws, 'products'));
  console.log(`Synced brand/ and products/ into ${ws}`);
  process.exit(0);
}

const slug = a._[0];
if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
  console.error('Usage: node scripts/new-video.mjs <slug-in-kebab-case> [--title "..."] [--workspace DIR]');
  process.exit(1);
}

ensureWorkspace();
const dir = path.join(ws, 'engine', 'src', 'videos', slug);
if (fs.existsSync(dir)) {
  console.error(`${dir} already exists`);
  process.exit(1);
}
fs.mkdirSync(dir, {recursive: true});
const title = a.title ?? slug.replace(/-/g, ' ');
const tmpl = (f) => fs.readFileSync(path.join(ROOT, 'scripts', 'templates', f), 'utf8').replaceAll('__ID__', pascal(slug)).replaceAll('__SLUG__', slug).replaceAll('__TITLE__', title);
fs.writeFileSync(path.join(dir, 'video.tsx'), tmpl('video.tsx.tmpl'));
fs.writeFileSync(path.join(dir, 'storyboard.json'), tmpl('storyboard.json.tmpl'));
fs.writeFileSync(path.join(dir, 'plates.json'), '{}\n');

console.log(`
Created ${dir}
  storyboard.json  fill in the scenes (schema: docs/storyboard.schema.json)
  video.tsx        build one component per scene
  plates.json      filled by scripts/runway-plates.mjs (optional)

Preview: cd ${path.join(ws, 'engine')} && npx remotion studio src/index.ts
Render:  node ${path.join(ws, 'scripts', 'render.mjs')} ${slug}`);
