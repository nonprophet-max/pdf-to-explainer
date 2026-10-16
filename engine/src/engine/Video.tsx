// Assembles a video with the house cadence:
// each content scene + 1.15 s hold, the conclusion + 2 s hold, then the closing brand animation.
// Captions live on the SceneDef so the timeline can size every scene to its reading time.
import React from 'react';
import {AbsoluteFill, Loop, OffthreadVideo, Series, interpolate, staticFile, useVideoConfig} from 'remotion';
import {CADENCE, DEFAULT_FPS, TICK_FPS, framesToTicks, secToFrames, ticksToFrames} from './cadence';
import {useBrandFonts} from './fonts';
import {DEFAULT_FORMATS, FORMATS, Format, FormatCtx, SAFE_ZONES, useFormat} from './format';
import {Outro, OutroProps} from './Outro';
import {CaptionBlock, Scene} from './Scene';
import {ChecksCtx, Logo, clamp, scheduleCaption, useTick} from './parts';
import {ThemeCtx, ThemeName, getPack, makeTheme, useTheme} from './theme';

export type StageProps = {
  dur: number; // scene length in ticks (including the hold)
  cues: number[]; // tick at which each caption block starts, in order — sync visuals to these
};

export type SceneDef = {
  id: string;
  caption: CaptionBlock | CaptionBlock[];
  Stage: React.FC<StageProps>;
  ticks?: number; // minimum base length; the timeline extends it to fit the captions' reading time
  stageTop?: number;
  stageBottom?: number;
  plate?: string; // optional generated background clip under public/, "{format}" is replaced (see withPlates)
};

export type VideoDef = {
  id: string; // PascalCase, used in composition ids
  title: string;
  brand: string; // brand pack id from the design system, e.g. "privateinference", "fireflow/memorytree"
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

const blocksOf = (s: SceneDef) => (Array.isArray(s.caption) ? s.caption : [s.caption]);

/** Base length of a scene in ticks: its own minimum, or the last caption block landing plus reading time. */
export const sceneTicks = (s: SceneDef) => {
  const blocks = blocksOf(s);
  const last = blocks[blocks.length - 1];
  const sched = scheduleCaption(last.lines);
  const words = sched.reduce((n, l) => n + l.words, 0);
  const read = Math.max(1.5, words * 0.22) * TICK_FPS;
  return Math.ceil(Math.max(s.ticks ?? 0, sched[sched.length - 1].land + read));
};

export const sceneCues = (s: SceneDef) => blocksOf(s).flatMap((b) => scheduleCaption(b.lines).map((l) => l.start));

export const timeline = (def: VideoDef, fps = def.fps ?? DEFAULT_FPS) => {
  const hold = secToFrames(CADENCE.holdSec, fps);
  const finalHold = secToFrames(CADENCE.conclusionHoldSec, fps);
  const scenes = def.scenes.map((s, i) => ({...s, frames: ticksToFrames(sceneTicks(s), fps) + (i === def.scenes.length - 1 ? finalHold : hold)}));
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
  const wordmark = C.brand.logo.kind === 'wordmark';
  return (
    <div style={{position: 'absolute', top: wide ? 50 : 90, left: 60, display: 'flex', alignItems: 'center', gap: 16, opacity: o, fontFamily: C.fonts.body, fontSize: 32, color: C.grey}}>
      <Logo height={wordmark ? 34 : 48} color={wordmark ? C.grey : C.accent} />
      {wordmark ? null : C.brand.name}
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

/** Scene timing and captions as the engine renders them; scripts read this instead of storyboard.json. */
export type Timing = {fps: number; total: number; outroStart: number; scenes: {id: string; start: number; end: number; seconds: number; captions: string[]}[]};

export type VideoProps = {safeZones?: boolean; brand?: string; cuts?: {id: string; frame: number}[]; timing?: Timing};

export const makeVideo = (def: VideoDef, format: Format, theme: ThemeName) => {
  const Comp: React.FC<VideoProps> = ({safeZones, brand}) => {
    const {fps} = useVideoConfig();
    const pack = getPack(brand || def.brand);
    const fontsReady = useBrandFonts(pack);
    const C = makeTheme(pack, theme);
    const tl = timeline(def, fps);
    const outroStart = tl.total - tl.outro;
    return (
      <FormatCtx.Provider value={format}>
        <ThemeCtx.Provider value={C}>
          <ChecksCtx.Provider value={!!safeZones && fontsReady}>
            <AbsoluteFill style={{background: C.bg}}>
              <Background />
              <Series>
                {tl.scenes.map((s) => {
                  const dur = framesToTicks(s.frames, fps);
                  return (
                    <Series.Sequence key={s.id} durationInFrames={s.frames} name={s.id}>
                      {s.plate ? <Plate src={s.plate.replace('{format}', format)} frames={s.frames} /> : null}
                      <Scene dur={dur} caption={s.caption} stageTop={s.stageTop} stageBottom={s.stageBottom}>
                        <s.Stage dur={dur} cues={sceneCues(s)} />
                      </Scene>
                    </Series.Sequence>
                  );
                })}
                <Series.Sequence durationInFrames={tl.outro} name="outro">
                  {/* a video's own outro text (URL, status note) only applies to its own brand */}
                  <Outro {...(pack.id === def.brand ? def.outro : {})} />
                </Series.Sequence>
              </Series>
              <Watermark hideFromTick={framesToTicks(outroStart, fps)} />
              <Grain />
              {safeZones && format === '9x16' ? <SafeZones /> : null}
            </AbsoluteFill>
          </ChecksCtx.Provider>
        </ThemeCtx.Provider>
      </FormatCtx.Provider>
    );
  };
  return Comp;
};

export const compositionsFor = (def: VideoDef) => {
  const fps = def.fps ?? DEFAULT_FPS;
  const tl = timeline(def, fps);
  const total = tl.total;
  // frame 0.3 s before each cut, for scripts/render.mjs --stills
  let at = 0;
  const cuts = tl.scenes.map((s) => ({id: s.id, frame: (at += s.frames) - Math.round(0.3 * fps)}));
  const sec = (f: number) => +(f / fps).toFixed(3);
  let from = 0;
  const timing: Timing = {
    fps,
    total: sec(total),
    outroStart: sec(total - tl.outro),
    scenes: tl.scenes.map((s) => {
      const start = from;
      from += s.frames;
      return {id: s.id, start: sec(start), end: sec(from), seconds: sec(s.frames), captions: blocksOf(s).flatMap((b) => b.lines.map((l) => l.t.replace(/\s+/g, ' ')))};
    }),
  };
  return (def.formats ?? DEFAULT_FORMATS).flatMap((format) =>
    (['dark', 'light'] as ThemeName[]).map((theme) => ({
      id: `${def.id}-${format}-${theme}`,
      component: makeVideo(def, format, theme),
      durationInFrames: total,
      fps,
      defaultProps: {safeZones: false, brand: '', cuts, timing} as VideoProps,
      ...FORMATS[format],
    })),
  );
};
