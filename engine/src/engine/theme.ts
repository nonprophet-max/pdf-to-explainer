import React from 'react';
import tokens from '../brand/tokens.json';

type Raw = (typeof tokens.themes)['dark'];
export type ThemeName = keyof typeof tokens.themes;

const withShadow = (t: Raw) => {
  const s = t.shadow;
  return {
    ...t,
    sh: (d = 1) =>
      `0 ${s.edgeY * d}px 0 rgba(${s.rgb},${s.edgeA}), 0 ${s.softY * d}px ${s.softBlur * d}px rgba(${s.rgb},${s.softA})`,
  };
};

export type Theme = ReturnType<typeof withShadow>;
export const THEMES: Record<ThemeName, Theme> = {
  dark: withShadow(tokens.themes.dark),
  light: withShadow(tokens.themes.light as Raw),
};
export const BRAND = tokens;

export const ThemeCtx = React.createContext<Theme>(THEMES.dark);
export const useTheme = () => React.useContext(ThemeCtx);
