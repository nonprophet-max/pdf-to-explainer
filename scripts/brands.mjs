#!/usr/bin/env node
// Brand packs from the Persistent Labs design system.
//
// The design system (github.com/nonprophet-max/persistent-labs-design-system) is the single source of
// truth for every brand and sub-brand. This script keeps a local checkout of it and turns each brand
// into a "brand pack" the video engine renders with: palette (dark + light, derived from the brand's
// tokens), logo, bundled fonts, URL and status.
//
//   node scripts/brands.mjs sync            # clone or update the design system, then build all packs
//   node scripts/brands.mjs build           # rebuild packs from the local checkout
//   node scripts/brands.mjs list            # brands and sub-brands you can pick
//   node scripts/brands.mjs info <brand>    # pack summary + which design-system files to read
//
// Checkout location: $DESIGN_SYSTEM_DIR, else <skill root>/.design-system.
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {ROOT, args} from './lib.mjs';

const REPO = process.env.DESIGN_SYSTEM_REPO ?? 'https://github.com/nonprophet-max/persistent-labs-design-system.git';
const DS = path.resolve(process.env.DESIGN_SYSTEM_DIR ?? path.join(ROOT, '.design-system'));
const ENGINE = path.join(ROOT, 'engine');
const PACKS = path.join(ENGINE, 'src', 'brand-packs');
const PUBLIC = path.join(ENGINE, 'public', 'brands');
const PARENT = 'persistent-labs';

// ---------- colour helpers ----------
const hex = (h) => {
  const s = h.replace('#', '');
  const f = s.length === 3 ? s.split('').map((c) => c + c).join('') : s;
  return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16));
};
const toHex = (rgb) => '#' + rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('').toUpperCase();
const mix = (a, b, t) => toHex(hex(a).map((v, i) => v + (hex(b)[i] - v) * t));
const rgba = (h, a) => `rgba(${hex(h).join(',')},${a})`;
const lum = (h) => {
  const [r, g, b] = hex(h).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

// ---------- reading the design system ----------
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const skillDir = (plugin) => path.join(DS, 'plugins', plugin, 'skills', plugin);
const pretty = {
  memorytree: 'MemoryTree',
  flamechorus: 'FlameChorus',
  'orchestration-engine': 'Orchestration engine',
};
const SYSTEM_STACK = 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const sync = () => {
  if (fs.existsSync(path.join(DS, '.git'))) {
    console.log(`Updating ${DS}`);
    execFileSync('git', ['-C', DS, 'pull', '--ff-only', '-q'], {stdio: 'inherit'});
  } else {
    console.log(`Cloning ${REPO} → ${DS}`);
    execFileSync('git', ['clone', '-q', '--depth', '1', REPO, DS], {stdio: 'inherit'});
  }
  console.log(`Design system at ${execFileSync('git', ['-C', DS, 'log', '-1', '--format=%h %s']).toString().trim()}`);
};

const fontsFor = (id, dir, refText, product) => {
  const fontsDir = path.join(dir, 'assets', 'fonts');
  const ls = fs.existsSync(fontsDir) ? fs.readdirSync(fontsDir) : [];
  const faces = [];
  const redHat = (fam, file, weight) => ls.includes(file) && faces.push({family: fam, src: file, weight});
  redHat('Red Hat Mono', 'red-hat-mono-latin-variable.woff2', '300 700');
  if (String(product?.['font-family'] ?? '').includes('Poppins')) {
    for (const f of ls.filter((f) => /^poppins-latin-\d+\.woff2$/.test(f))) faces.push({family: 'Poppins', src: f, weight: f.match(/(\d+)/)[1]});
    return {display: '"Poppins", sans-serif', body: '"Poppins", sans-serif', mono: '"Red Hat Mono", ui-monospace, monospace', faces};
  }
  if (/system typography/i.test(refText)) {
    return {display: SYSTEM_STACK, body: SYSTEM_STACK, mono: '"Red Hat Mono", ui-monospace, monospace', faces};
  }
  redHat('Red Hat Display', 'red-hat-display-latin-variable.woff2', '300 900');
  redHat('Red Hat Text', 'red-hat-text-latin-variable.woff2', '300 700');
  return {display: '"Red Hat Display", sans-serif', body: '"Red Hat Text", sans-serif', mono: '"Red Hat Mono", ui-monospace, monospace', faces};
};

// Video palette for one mode, derived from the brand's own tokens.
const themeFor = (mode, t, {accent, accentInk, onAccent, surface}) => {
  const c = t.core;
  const dark = mode === 'dark';
  const bg = dark ? surface?.dark?.surface ?? c.ink : surface ? '#F5F5F5' : c.paper;
  const text = dark ? surface?.dark?.text ?? c['text-dark'] : surface?.light?.text ?? c['text-light'];
  const card = dark ? mix(bg, text, 0.09) : '#FFFFFF';
  const highlightText = dark ? accent : accentInk;
  const highlight = contrast(highlightText, bg) >= (dark ? 3 : 4.5) && highlightText.toUpperCase() !== text.toUpperCase() ? 'text' : 'marker';
  return {
    bg,
    paper: dark ? mix(bg, text, 0.05) : '#FFFFFF',
    paper2: card,
    paper3: dark ? mix(bg, text, 0.15) : mix(bg, text, 0.07),
    line: dark ? mix(bg, text, 0.22) : mix(bg, text, 0.16),
    accent,
    accentDeep: dark ? mix(accent, '#000000', 0.18) : mix(accent, accentInk, 0.35),
    ink: onAccent,
    text,
    surface: dark ? mix(text, accent, 0.05) : '#FFFFFF',
    grey: dark ? mix(bg, text, 0.74) : surface ? mix(bg, text, 0.6) : c['text-light-secondary'],
    mute: dark ? mix(bg, text, 0.5) : mix(bg, text, 0.42),
    red: dark ? c['danger-dark'] : c['danger-light'],
    success: dark ? c['success-dark'] : c['success-light'],
    onSuccess: dark ? c.ink : '#FFFFFF',
    accentText: highlightText,
    highlight,
    cipherBg: dark ? mix(bg, text, 0.15) : mix(bg, '#000000', 0.82),
    cardTop: dark ? mix(bg, text, 0.2) : mix(bg, text, 0.08),
    bubbleLine: dark ? mix(text, bg, 0.3) : mix('#FFFFFF', text, 0.15),
    fogBack: dark ? mix(bg, text, 0.12) : mix(bg, text, 0.04),
    fogFront: dark ? mix(bg, text, 0.18) : mix(bg, text, 0.09),
    enclaveFill: rgba(accent, dark ? 0.08 : 0.16),
    enclaveGlow: rgba(accent, dark ? 0.35 : 0.3),
    rays: dark ? mix(bg, text, 0.05) : mix(bg, text, 0.06),
    blob: dark ? mix(bg, text, 0.025) : mix(bg, '#FFFFFF', 0.7),
    blobShadow: dark ? 'rgba(0,0,0,.5)' : 'rgba(30,30,40,.08)',
    plateOpacity: dark ? 0.35 : 0.25,
    grain: dark ? {opacity: 0.09, blend: 'overlay'} : {opacity: 0.05, blend: 'multiply'},
    textShadow: dark ? '0 4px 0 rgba(0,0,0,.35)' : '0 3px 0 rgba(30,30,40,.06)',
    lidShadow: dark ? '0 3px 0 rgba(0,0,0,.25)' : '0 2px 0 rgba(30,30,40,.10)',
    drop: dark ? 'drop-shadow(0 6px 6px rgba(0,0,0,.5))' : 'drop-shadow(0 6px 8px rgba(30,30,40,.18))',
    shadow: dark ? {rgb: '0,0,0', edgeY: 5, edgeA: 0.35, softY: 16, softBlur: 30, softA: 0.55} : {rgb: '30,30,40', edgeY: 3, edgeA: 0.06, softY: 14, softBlur: 30, softA: 0.14},
  };
};

const svgAspect = (svg) => {
  const m = svg.match(/viewBox="([\d.\s-]+)"/);
  if (!m) return 1;
  const [, , w, h] = m[1].trim().split(/\s+/).map(Number);
  return w / h;
};

const build = () => {
  if (!fs.existsSync(path.join(DS, 'brand-skills.json'))) {
    console.error(`No design system at ${DS}. Run: node scripts/brands.mjs sync`);
    process.exit(1);
  }
  const registry = readJson(path.join(DS, 'brand-skills.json'));
  const dsCommit = execFileSync('git', ['-C', DS, 'log', '-1', '--format=%h']).toString().trim();
  fs.rmSync(PACKS, {recursive: true, force: true});
  fs.rmSync(PUBLIC, {recursive: true, force: true});
  fs.mkdirSync(PACKS, {recursive: true});
  const built = [];

  for (const entry of registry.plugins) {
    const plugin = entry.name;
    const id = plugin.replace(/-brand$/, '');
    const dir = skillDir(plugin);
    const tokens = readJson(path.join(dir, 'references', 'design-tokens.json'));
    const key = id.replace(/-/g, '');
    const product = tokens.products?.[key];
    const identity = tokens.identities?.[key];
    const refFile = ['brand.md', 'design-bible.md'].map((f) => path.join(dir, 'references', f)).find((f) => fs.existsSync(f));
    const refText = fs.readFileSync(refFile, 'utf8');
    const status = id === PARENT ? 'Parent brand' : (refText.match(/^(Upcoming|Live|Established|Existing)[^\n]*/m) ?? [])[0] ?? 'Unknown';
    const url = id === PARENT ? null : (refText.match(/↗\]\((https?:\/\/[^)\s]+)\)/) ?? [])[1]?.replace(/^https?:\/\//, '').replace(/\/$/, '') ?? null;
    const logoFile = identity && fs.existsSync(path.join(dir, 'assets', 'pi', 'mark.svg')) ? 'pi/mark.svg' : `${id}.svg`;
    const logoSvg = fs.readFileSync(path.join(dir, 'assets', logoFile), 'utf8').replace(/<\?xml[^>]*>/, '').trim();
    const fonts = fontsFor(id, dir, refFile.endsWith('brand.md') ? refText : '', product);
    const pub = path.join(PUBLIC, id);
    fs.mkdirSync(path.join(pub, 'fonts'), {recursive: true});
    for (const f of fonts.faces) fs.copyFileSync(path.join(dir, 'assets', 'fonts', f.src), path.join(pub, 'fonts', f.src));
    fonts.faces = fonts.faces.map((f) => ({...f, src: `brands/${id}/fonts/${f.src}`}));

    const surface = identity?.surfaces;
    const accentDark = surface?.dark?.action ?? product?.accent ?? tokens.core.gold;
    const accentLight = surface?.light?.action ?? product?.accent ?? tokens.core.gold;
    const accentInk = product?.['accent-ink'] ?? tokens.core['gold-ink'];
    const onAccent = surface?.dark?.['on-action'] ?? product?.['on-accent'] ?? tokens.core.ink;

    const base = {
      id,
      name: identity?.name ?? entry.product,
      shortName: identity?.shortName ?? entry.product,
      endorsement: id === PARENT ? null : 'by Persistent Labs',
      component: null,
      status,
      url,
      tagline: null,
      logo: {svg: logoSvg, kind: svgAspect(logoSvg) > 3 ? 'wordmark' : 'mark', currentColor: /currentColor|class="mark"/.test(logoSvg)},
      fonts,
      designSystem: {
        commit: dsCommit,
        skill: path.relative(DS, path.join(dir, 'SKILL.md')),
        reference: path.relative(DS, refFile),
        foundations: path.relative(DS, path.join(dir, 'references', 'foundations.md')),
      },
      themes: {
        dark: themeFor('dark', tokens, {accent: accentDark, accentInk, onAccent, surface}),
        light: themeFor('light', tokens, {accent: accentLight, accentInk, onAccent: surface?.light?.['on-action'] ?? onAccent, surface}),
      },
    };
    const write = (p) => {
      fs.writeFileSync(path.join(PACKS, `${p.id.replace('/', '--')}.json`), JSON.stringify(p, null, 2) + '\n');
      built.push(p);
    };
    write(base);

    // Sub-brands: product components (e.g. FireFlow's MemoryTree) keep the product identity with their own accent.
    for (const [comp, ct] of Object.entries(tokens.components?.[key] ?? {})) {
      const compLogo = path.join(dir, 'assets', `${comp}.svg`);
      write({
        ...base,
        id: `${id}/${comp}`,
        component: {id: comp, name: pretty[comp] ?? comp, logo: fs.existsSync(compLogo) ? fs.readFileSync(compLogo, 'utf8').trim() : null},
        themes: {
          dark: themeFor('dark', tokens, {accent: ct.accent, accentInk: ct['accent-ink'], onAccent: ct['on-accent'], surface}),
          light: themeFor('light', tokens, {accent: ct.accent, accentInk: ct['accent-ink'], onAccent: ct['on-accent'], surface}),
        },
      });
    }
  }
  console.log(`Built ${built.length} brand packs from design system ${dsCommit} → ${path.relative(ROOT, PACKS)}`);
  return built;
};

const packs = () =>
  fs.existsSync(PACKS) ? fs.readdirSync(PACKS).filter((f) => f.endsWith('.json')).map((f) => readJson(path.join(PACKS, f))) : [];

const a = args();
const cmd = a._[0] ?? 'list';
if (cmd === 'sync') {
  sync();
  build();
} else if (cmd === 'build') build();
else if (cmd === 'list') {
  const ps = packs();
  if (!ps.length) {
    console.log('No brand packs yet. Run: node scripts/brands.mjs sync');
    process.exit(0);
  }
  for (const p of ps.sort((x, y) => x.id.localeCompare(y.id)))
    console.log(`${p.id.padEnd(30)} ${(p.component ? `${p.name} · ${p.component.name}` : p.name).padEnd(30)} ${p.status}`);
} else if (cmd === 'info') {
  const p = packs().find((x) => x.id === a._[1]);
  if (!p) {
    console.error(`Unknown brand "${a._[1]}". Run: node scripts/brands.mjs list`);
    process.exit(1);
  }
  const {themes, logo, ...rest} = p;
  console.log(JSON.stringify({...rest, logo: {kind: logo.kind}, accent: {dark: themes.dark.accent, light: themes.light.accent}, highlight: {dark: themes.dark.highlight, light: themes.light.highlight}}, null, 2));
  console.log(`\nRead before writing copy:\n  ${path.join(DS, p.designSystem.skill)}\n  ${path.join(DS, p.designSystem.reference)}`);
} else {
  console.error('Usage: node scripts/brands.mjs sync | build | list | info <brand>');
  process.exit(1);
}
