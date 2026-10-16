// The house cadence. Every video built with this engine follows it.
//
// Scene timings are authored in "ticks": 30 per second, whatever fps the video renders at.
// Rendering at 60 fps makes the 1.15 s hold land on an exact frame (69 frames).
export const TICK_FPS = 30;
export const DEFAULT_FPS = 60;

export const CADENCE = {
  // after each content scene's animation settles, before the cut
  holdSec: 1.15,
  // after the last content scene (the conclusion), before the closing brand animation
  conclusionHoldSec: 2,
  // closing brand animation (logo, tagline, URL)
  outroSec: 3.2,
  // camera fade in/out at each cut, in ticks
  fadeTicks: 7,
};

export const secToFrames = (sec: number, fps: number) => Math.round(sec * fps);
export const ticksToFrames = (ticks: number, fps: number) => Math.round((ticks * fps) / TICK_FPS);
export const framesToTicks = (frames: number, fps: number) => (frames * TICK_FPS) / fps;

// Reading-time rule for picking a scene's base length (before the hold):
// last caption word lands, then 0.22 s per caption word, at least 1.5 s.
export const baseTicksFor = (lastWordLandsAtTick: number, captionWords: number) =>
  Math.ceil(lastWordLandsAtTick + Math.max(1.5, captionWords * 0.22) * TICK_FPS);

// Caption blocks: each line (sentence or phrase) is a block. A block starts no sooner than
// 0.5 s after the previous block has fully landed — including the gap after a scene's first line —
// so viewers can take in one sentence before the next appears.
export const CAPTION = {
  pauseSec: 0.5,
  wordGapTicks: 3, // between words of one block
  settleTicks: 10, // spring settle after the last word starts
  firstAtTicks: 2, // default start of a scene's first block
};
