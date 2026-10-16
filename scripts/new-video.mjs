#!/usr/bin/env node
// Scaffold a new explainer in a private workspace (default ~/explainer-studio), outside this repo,
// so source PDFs and drafts never end up in the public skill.
//
//   node scripts/new-video.mjs <slug> --brand <id> [--title "Video title"] [--workspace DIR]
//   node scripts/new-video.mjs --sync-brand [--workspace DIR]   # update the design system + brand packs and products/
//   node scripts/new-video.mjs --update [--workspace DIR]       # upgrade the workspace engine to this skill version
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

const VERSION = fs.readFileSync(path.join(ROOT, 'VERSION'), 'utf8').trim();
const stamp = path.join(ws, '.skill-version');

// Create the workspace, or upgrade it when the skill version changed. Videos in engine/src/videos are kept.
const ensureWorkspace = () => {
  const fresh = !fs.existsSync(path.join(ws, 'engine', 'node_modules'));
  if (!fresh && fs.existsSync(stamp) && fs.readFileSync(stamp, 'utf8').trim() === VERSION && !a.update) return;
  console.log(fresh ? `Creating workspace at ${ws}` : `Updating workspace ${ws} to skill ${VERSION} (your videos are kept)`);
  fs.mkdirSync(ws, {recursive: true});
  for (const d of ['scripts', 'docs', 'products']) {
    fs.rmSync(path.join(ws, d), {recursive: true, force: true});
    copyTree(path.join(ROOT, d), path.join(ws, d));
  }
  fs.rmSync(path.join(ws, 'engine', 'src', 'engine'), {recursive: true, force: true});
  copyTree(path.join(ROOT, 'engine'), path.join(ws, 'engine'), {exampleOnly: true});
  for (const f of ['SKILL.md', 'AGENTS.md', 'VERSION']) fs.copyFileSync(path.join(ROOT, f), path.join(ws, f));
  fs.rmSync(path.join(ws, 'brand'), {recursive: true, force: true}); // pre-2.0 built-in brand
  fs.writeFileSync(path.join(ws, '.gitignore'), 'node_modules\nout\n');
  run('npm', ['install', '--no-audit', '--no-fund'], {cwd: path.join(ws, 'engine')});
  // Remotion's bundler needs esbuild's native binary
  run('npm', ['approve-scripts', 'esbuild'], {cwd: path.join(ws, 'engine')});
  run('npm', ['rebuild', 'esbuild'], {cwd: path.join(ws, 'engine')});
  run('node', [path.join(ws, 'scripts', 'brands.mjs'), 'sync']);
  fs.writeFileSync(stamp, VERSION + '\n');
};

if (a['sync-brand']) {
  ensureWorkspace();
  run('node', [path.join(ws, 'scripts', 'brands.mjs'), 'sync']);
  fs.rmSync(path.join(ws, 'products'), {recursive: true, force: true});
  copyTree(path.join(ROOT, 'products'), path.join(ws, 'products'));
  console.log(`Updated brand packs and products/ in ${ws}`);
  process.exit(0);
}

if (a.update) {
  ensureWorkspace();
  process.exit(0);
}

const slug = a._[0];
if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
  console.error('Usage: node scripts/new-video.mjs <slug-in-kebab-case> --brand <id> [--title "..."] [--workspace DIR]');
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
const brand = String(a.brand ?? 'persistent-labs');
if (!fs.existsSync(path.join(ws, 'engine', 'src', 'brand-packs', `${brand.replace('/', '--')}.json`))) {
  console.error(`Unknown brand "${brand}". See: node ${path.join(ws, 'scripts', 'brands.mjs')} list`);
  process.exit(1);
}
const tmpl = (f) => fs.readFileSync(path.join(ROOT, 'scripts', 'templates', f), 'utf8').replaceAll('__ID__', pascal(slug)).replaceAll('__SLUG__', slug).replaceAll('__TITLE__', title).replaceAll('__BRAND__', brand);
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
