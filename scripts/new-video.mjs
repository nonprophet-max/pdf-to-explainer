#!/usr/bin/env node
// Scaffold a new explainer in a private workspace (default ~/explainer-studio), outside this repo,
// so source PDFs and drafts never end up in the public skill.
//
//   node scripts/new-video.mjs <slug> --brand <id> [--title "Video title"] [--workspace DIR]
//   node scripts/new-video.mjs --sync-brand [--workspace DIR]   # update the design system + brand packs and products/
//   node scripts/new-video.mjs --update [--workspace DIR]       # upgrade the workspace engine to this skill version
//
// An existing workspace on another skill version is never upgraded silently: upgrading replaces the shared
// engine (engine/src/engine) under every video in it, so this stops and asks for --update. With --update the
// old engine is backed up to .backups/ and every video is type-checked against the new one.
import {spawnSync} from 'node:child_process';
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

const videosIn = () => {
  const d = path.join(ws, 'engine', 'src', 'videos');
  return fs.existsSync(d) ? fs.readdirSync(d).filter((v) => fs.existsSync(path.join(d, v, 'video.tsx'))) : [];
};

// Create the workspace, or upgrade it when asked (--update). Videos in engine/src/videos are kept.
const ensureWorkspace = () => {
  let backup;
  const fresh = !fs.existsSync(path.join(ws, 'engine', 'node_modules'));
  const current = fs.existsSync(stamp) ? fs.readFileSync(stamp, 'utf8').trim() : fresh ? null : 'pre-2.0';
  if (!fresh && current === VERSION && !a.update) return;
  if (!fresh && !a.update) {
    const vids = videosIn().filter((v) => v !== 'who-sees-what');
    console.error(`The workspace ${ws} runs skill ${current}; this skill is ${VERSION}.
Upgrading replaces its engine, scripts, docs and products/ — videos written for ${current} may stop rendering${vids.length ? ` (${vids.join(', ')})` : ''}.
Either:
  - upgrade it:      node ${path.join(ROOT, 'scripts', 'new-video.mjs')} ${process.argv.slice(2).map((x) => (/\s/.test(x) ? JSON.stringify(x) : x)).join(' ')} --update
                     (backs up the old engine to ${path.join(ws, '.backups')} and type-checks every video), or
  - keep it as is:   use ${current}'s own scripts there, and pass --workspace <new dir> to start a fresh ${VERSION} workspace.`);
    process.exit(2);
  }
  if (fresh) console.log(`Creating workspace at ${ws}`);
  else {
    backup = path.join(ws, '.backups', `${current}-${new Date().toISOString().replace(/[:.]/g, '-')}`);
    console.log(`Updating workspace ${ws} from ${current} to ${VERSION} (your videos are kept; old engine backed up to ${backup})`);
    // everything the upgrade replaces; videos stay where they are
    const src = path.join(ws, 'engine', 'src');
    const engineSrc = fs.existsSync(src) ? fs.readdirSync(src).filter((f) => f !== 'videos').map((f) => path.join('engine', 'src', f)) : [];
    const engineTop = ['package.json', 'package-lock.json', 'tsconfig.json'].map((f) => path.join('engine', f));
    for (const rel of ['scripts', 'docs', 'products', 'brand', ...engineSrc, ...engineTop, 'SKILL.md', 'AGENTS.md', 'VERSION', '.skill-version']) {
      const from = path.join(ws, rel);
      if (fs.existsSync(from)) fs.cpSync(from, path.join(backup, rel), {recursive: true, verbatimSymlinks: true});
    }
  }
  fs.mkdirSync(ws, {recursive: true});
  for (const d of ['scripts', 'docs', 'products']) {
    fs.rmSync(path.join(ws, d), {recursive: true, force: true});
    copyTree(path.join(ROOT, d), path.join(ws, d));
  }
  fs.rmSync(path.join(ws, 'engine', 'src', 'engine'), {recursive: true, force: true});
  copyTree(path.join(ROOT, 'engine'), path.join(ws, 'engine'), {exampleOnly: true});
  for (const f of ['SKILL.md', 'AGENTS.md', 'VERSION']) fs.copyFileSync(path.join(ROOT, f), path.join(ws, f));
  // pre-2.0 built-in brand, and its symlink (dangling once brand/ is gone, which breaks bundling)
  fs.rmSync(path.join(ws, 'brand'), {recursive: true, force: true});
  fs.rmSync(path.join(ws, 'engine', 'public', 'brand'), {recursive: true, force: true});
  fs.writeFileSync(path.join(ws, '.gitignore'), 'node_modules\nout\n.backups\n');
  run('npm', ['install', '--no-audit', '--no-fund'], {cwd: path.join(ws, 'engine')});
  // Remotion's bundler needs esbuild's native binary
  spawnSync('npm', ['approve-scripts', 'esbuild'], {cwd: path.join(ws, 'engine'), stdio: 'ignore'});
  run('npm', ['rebuild', 'esbuild'], {cwd: path.join(ws, 'engine')});
  run('node', [path.join(ws, 'scripts', 'brands.mjs'), 'sync']);
  fs.writeFileSync(stamp, VERSION + '\n');
  if (!fresh) {
    const tsc = spawnSync('npx', ['tsc', '-p', '.'], {cwd: path.join(ws, 'engine'), encoding: 'utf8'});
    if (tsc.status === 0) console.log(`Type check passed for: ${videosIn().join(', ')}. Re-render stills to check layouts.`);
    else {
      const broken = [...new Set([...tsc.stdout.matchAll(/src\/videos\/([^/]+)\//g)].map((m) => m[1]))];
      console.warn(`\nThese videos don't compile against engine ${VERSION}: ${broken.join(', ') || '(see below)'}\n${tsc.stdout.trim()}`);
      console.warn(`Fix them (docs/VIDEO-BIBLE.md, the reference video), or roll back: rm -rf "${ws}/engine/src/engine" && cp -R "${backup}/." "${ws}/" && (cd "${ws}/engine" && npm install).`);
      process.exitCode = 3;
    }
  }
};

if (a['sync-brand']) {
  ensureWorkspace();
  run('node', [path.join(ws, 'scripts', 'brands.mjs'), 'sync']);
  fs.rmSync(path.join(ws, 'products'), {recursive: true, force: true});
  copyTree(path.join(ROOT, 'products'), path.join(ws, 'products'));
  console.log(`Updated brand packs and products/ in ${ws}`);
  process.exit();
}

const slug = a._[0];
if (a.update && !slug) {
  ensureWorkspace();
  process.exit();
}

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
