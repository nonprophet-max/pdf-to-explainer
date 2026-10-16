// Assembles a video from scene components with the house cadence:
// each content scene + 1.15 s hold, the conclusion + 2 s hold, then the closing brand animation.
import React from 'react';
import {AbsoluteFill, Img, Loop, OffthreadVideo, Series, interpolate, staticFile, useVideoConfig} from 'remotion';
import {CADENCE, DEFAULT_FPS, framesToTicks, secToFrames, ticksToFrames} from './cadence';
import {body} from './fonts';
import {DEFAULT_FORMATS, FORMATS, Format, FormatCtx, SAFE_ZONES, useFormat} from './format';
import {Outro, OutroProps} from './Outro';
import {clamp, useTick} from './parts';
import {BRAND, THEMES, ThemeCtx, ThemeName, useTheme} from './theme';

export type SceneDef = {
  id: string;
  C: React.FC<{dur: number}>;
  ticks: number; // base length in ticks (30/s): animation + reading time, before the hold
  plate?: string; // optional generated background clip under public/, "{format}" is replaced (see withPlates)
};

export type VideoDef = {
  id: string; // PascalCase, used in composition ids
  title: string;
  scenes: SceneDef[]; // the last one is the conclusion
  outro?: OutroProps;
  fps?: number;
  formats?: Format[]; // default ['9x16']; add '16x9' only when asked for landscape
};

/** Attach generated plates (scripts/runway-plates.mjs writes plates.json: {sceneId: "plates/<slug>/<scene>-{format}.mp4"}). */
export const withPlates = (def: VideoDef, plates: Record<string, string>): VideoDef => ({
  ...def,
  scenes: def.scenes.map((s) => (plates[s.id] ? {...s, plate: plates[s.id]} : s)),
});

export const timeline = (def: VideoDef, fps = def.fps ?? DEFAULT_FPS) => {
  const hold = secToFrames(CADENCE.holdSec, fps);
  const finalHold = secToFrames(CADENCE.conclusionHoldSec, fps);
  const scenes = def.scenes.map((s, i) => ({...s, frames: ticksToFrames(s.ticks, fps) + (i === def.scenes.length - 1 ? finalHold : hold)}));
  const outro = secToFrames(CADENCE.outroSec, fps);
  return {scenes, outro, total: scenes.reduce((a, s) => a + s.frames, 0) + outro};
};

const Background: React.FC = () => {
  const C = useTheme();
  const t = useTick();
  const {width: W, height: H} = useVideoConfig();
  const wide = W > H;
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <svg width={W} height={H} style={{position: 'absolute', transform: `translateY(${-t * 0.12}px) rotate(${t * 0.006}deg)`, transformOrigin: '0 100%'}}>
        {Array.from({length: 22}, (_, i) => {
          const a = (-80 + i * 4) * (Math.PI / 180);
          return <line key={i} x1={-40} y1={H + 80} x2={-40 + Math.cos(a) * 4000} y2={H + 80 + Math.sin(a) * 4000} stroke={C.rays} strokeWidth={2} />;
        })}
      </svg>
      <div style={{position: 'absolute', width: 900, height: 900, borderRadius: '50%', background: C.blob, right: wide ? -300 : -420, top: (wide ? -200 : 260) - t * 0.25, boxShadow: `0 20px 60px ${C.blobShadow}`}} />
      <div style={{position: 'absolute', width: 640, height: 640, borderRadius: '50%', background: C.blob, left: -360, top: (wide ? 620 : 1300) - t * 0.18, boxShadow: `0 20px 60px ${C.blobShadow}`}} />
    </AbsoluteFill>
  );
};

// Optional generated plate (e.g. Runway) behind a scene, tinted so captions stay readable.
const Plate: React.FC<{src: string; frames: number}> = ({src, frames}) => {
  const C = useTheme();
  return (
    <AbsoluteFill>
      <Loop durationInFrames={frames}>
        <OffthreadVideo src={staticFile(src)} muted style={{width: '100%', height: '100%', objectFit: 'cover', opacity: C.plateOpacity}} />
      </Loop>
      <AbsoluteFill style={{background: `linear-gradient(180deg, ${C.bg}cc 0%, ${C.bg}55 45%, ${C.bg}aa 100%)`}} />
    </AbsoluteFill>
  );
};

const Grain: React.FC = () => {
  const C = useTheme();
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity: C.grain.opacity, mixBlendMode: C.grain.blend as React.CSSProperties['mixBlendMode']}}>
      <svg width="100%" height="100%">
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={3} />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};

const Watermark: React.FC<{hideFromTick: number}> = ({hideFromTick}) => {
  const C = useTheme();
  const t = useTick();
  const wide = useFormat() === '16x9';
  const o = interpolate(t, [6, 16, hideFromTick - 10, hideFromTick], [0, 1, 1, 0], clamp);
  return (
    <div style={{position: 'absolute', top: wide ? 50 : 90, left: 60, display: 'flex', alignItems: 'center', gap: 16, opacity: o, fontFamily: body, fontSize: 32, color: C.grey}}>
      <Img src={staticFile(`brand/${BRAND.logo}`)} style={{width: 48, height: 48}} />
      {BRAND.name}
    </div>
  );
};

// Translucent overlay of the platform UI areas, for checking stills (render.mjs --stills turns it on).
const SafeZones: React.FC = () => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    {SAFE_ZONES.map((z) => (
      <div key={z.name} style={{position: 'absolute', left: z.x, top: z.y, width: z.w, height: z.h, background: 'rgba(255,0,80,.18)', outline: '2px dashed rgba(255,0,80,.7)'}} />
    ))}
  </AbsoluteFill>
);

export const makeVideo = (def: VideoDef, format: Format, theme: ThemeName) => {
  const Comp: React.FC<{safeZones?: boolean}> = ({safeZones}) => {
    const {fps} = useVideoConfig();
    const tl = timeline(def, fps);
    const outroStart = tl.total - tl.outro;
    return (
      <FormatCtx.Provider value={format}>
        <ThemeCtx.Provider value={THEMES[theme]}>
          <AbsoluteFill style={{background: THEMES[theme].bg}}>
            <Background />
            <Series>
              {tl.scenes.map(({id, C: S, frames, plate}) => (
                <Series.Sequence key={id} durationInFrames={frames} name={id}>
                  {plate ? <Plate src={plate.replace('{format}', format)} frames={frames} /> : null}
                  <S dur={framesToTicks(frames, fps)} />
                </Series.Sequence>
              ))}
              <Series.Sequence durationInFrames={tl.outro} name="outro">
                <Outro {...def.outro} />
              </Series.Sequence>
            </Series>
            <Watermark hideFromTick={framesToTicks(outroStart, fps)} />
            <Grain />
            {safeZones && format === '9x16' ? <SafeZones /> : null}
          </AbsoluteFill>
        </ThemeCtx.Provider>
      </FormatCtx.Provider>
    );
  };
  return Comp;
};

export const compositionsFor = (def: VideoDef) => {
  const fps = def.fps ?? DEFAULT_FPS;
  const total = timeline(def, fps).total;
  return (def.formats ?? DEFAULT_FORMATS).flatMap((format) =>
    (Object.keys(THEMES) as ThemeName[]).map((theme) => ({
      id: `${def.id}-${format}-${theme}`,
      component: makeVideo(def, format, theme),
      durationInFrames: total,
      fps,
      defaultProps: {safeZones: false},
      ...FORMATS[format],
    })),
  );
};
