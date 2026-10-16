// Brand packs (built from the Persistent Labs design system by scripts/brands.mjs) and the theme context.
import React from 'react';

export type ThemeName = 'dark' | 'light';
type FontFaceDef = {family: string; src: string; weight: string};

type RawTheme = {
  bg: string; paper: string; paper2: string; paper3: string; line: string;
  accent: string; accentDeep: string; ink: string; text: string; surface: string;
  grey: string; mute: string; red: string; success: string; onSuccess: string;
  accentText: string; highlight: 'text' | 'marker';
  cipherBg: string; cardTop: string; bubbleLine: string; fogBack: string; fogFront: string;
  enclaveFill: string; enclaveGlow: string; rays: string; blob: string; blobShadow: string;
  plateOpacity: number; grain: {opacity: number; blend: string};
  textShadow: string; lidShadow: string; drop: string;
  shadow: {rgb: string; edgeY: number; edgeA: number; softY: number; softBlur: number; softA: number};
};

export type BrandPack = {
  id: string; // e.g. "privateinference" or "fireflow/memorytree"
  name: string;
  shortName: string;
  endorsement: string | null; // "by Persistent Labs"
  component: {id: string; name: string; logo: string | null} | null; // sub-brand inside a product
  status: string;
  url: string | null;
  tagline: string | null;
  logo: {svg: string; kind: 'mark' | 'wordmark'; currentColor: boolean};
  fonts: {display: string; body: string; mono: string; faces: FontFaceDef[]};
  designSystem: {commit: string; skill: string; reference: string; foundations: string};
  themes: Record<ThemeName, RawTheme>;
};

const ctx = require.context('../brand-packs', false, /\.json$/);
export const PACKS: Record<string, BrandPack> = Object.fromEntries(
  ctx.keys().map((k) => {
    const p = ctx<BrandPack>(k);
    return [p.id, p];
  }),
);

export const makeTheme = (pack: BrandPack, name: ThemeName) => {
  const t = pack.themes[name];
  const s = t.shadow;
  return {
    ...t,
    mode: name,
    fonts: pack.fonts,
    brand: pack,
    sh: (d = 1) => `0 ${s.edgeY * d}px 0 rgba(${s.rgb},${s.edgeA}), 0 ${s.softY * d}px ${s.softBlur * d}px rgba(${s.rgb},${s.softA})`,
  };
};
export type Theme = ReturnType<typeof makeTheme>;

export const getPack = (id: string) => {
  const p = PACKS[id];
  if (!p) throw new Error(`Unknown brand "${id}". Available: ${Object.keys(PACKS).join(', ') || 'none — run node scripts/brands.mjs sync'}`);
  return p;
};

export const ThemeCtx = React.createContext<Theme | null>(null);
export const useTheme = () => {
  const t = React.useContext(ThemeCtx);
  if (!t) throw new Error('useTheme outside a brand ThemeCtx');
  return t;
};
