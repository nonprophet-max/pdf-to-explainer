import React from 'react';

export const FORMATS = {
  '9x16': {width: 1080, height: 1920},
  '16x9': {width: 1920, height: 1080},
} as const;
export type Format = keyof typeof FORMATS;

// Vertical first (TikTok, Reels, Shorts). 16:9 renders only when a video opts in.
export const DEFAULT_FORMATS: Format[] = ['9x16'];

// Platform UI covers these areas on phones (TikTok/Reels/Shorts, 1080×1920). Keep captions and
// key labels out of them; decoration may pass through.
export const SAFE_ZONES = [
  {name: 'status bar', x: 0, y: 0, w: 1080, h: 140},
  {name: 'action buttons', x: 960, y: 700, w: 120, h: 900},
  {name: 'caption + nav', x: 0, y: 1600, w: 1080, h: 320},
];

export const FormatCtx = React.createContext<Format>('9x16');
export const useFormat = () => React.useContext(FormatCtx);
