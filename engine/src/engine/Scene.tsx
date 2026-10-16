// One scene = caption + stage. Authors place stage objects in 9:16 coordinates (1080×1920).
// 9:16: caption on top, stage as authored.
// 16:9: caption in a left column, the stage region (stageTop..1920) scaled into the right side.
import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {CADENCE} from './cadence';
import {useFormat} from './format';
import {Caption, CaptionLine, clamp, useTick} from './parts';

export type CaptionBlock = {
  lines: CaptionLine[];
  size?: number; // 9:16 font size; 16:9 uses 76% of it
  top?: number; // 9:16 only, default 220
  show?: [number, number]; // optional window in ticks, for scenes whose caption changes halfway
};

const CaptionWindow: React.FC<{b: CaptionBlock; children: React.ReactNode}> = ({b, children}) => {
  const t = useTick();
  if (!b.show) return <>{children}</>;
  const [a, z] = b.show;
  const o = interpolate(t, [a, a + 8], [0, 1], clamp) * interpolate(t, [z - 8, z], [1, 0], clamp);
  return <div style={{opacity: o}}>{children}</div>;
};

export const Scene: React.FC<{
  dur: number; // ticks, provided by the timeline
  caption?: CaptionBlock | CaptionBlock[];
  stageTop?: number; // where stage content starts in 9:16 space
  stageBottom?: number; // where it ends (default 1900); tighten it so 16:9 can scale the stage up
  children?: React.ReactNode;
}> = ({dur, caption, stageTop = 780, stageBottom = 1900, children}) => {
  const t = useTick();
  const format = useFormat();
  const fade = CADENCE.fadeTicks;
  const inn = interpolate(t, [0, fade], [0, 1], clamp);
  const out = interpolate(t, [dur - fade, dur], [1, 0], clamp);
  const push = interpolate(t, [0, dur], [1, 1.045]);
  const tilt = interpolate(t, [0, dur], [3, -1.5]);
  const blocks = caption ? (Array.isArray(caption) ? caption : [caption]) : [];

  const camera = (content: React.ReactNode) => (
    <AbsoluteFill style={{opacity: Math.min(inn, out), perspective: 1800}}>
      <AbsoluteFill style={{transform: `rotateX(${tilt}deg) scale(${push * interpolate(out, [0, 1], [1.08, 1]) * interpolate(inn, [0, 1], [0.96, 1])})`}}>{content}</AbsoluteFill>
    </AbsoluteFill>
  );

  if (format === '9x16') {
    return camera(
      <>
        {blocks.map((b, i) => (
          <CaptionWindow key={i} b={b}>
            <Caption lines={b.lines} size={b.size ?? 88} style={{position: 'absolute', top: b.top ?? 220, left: 60, right: 60}} />
          </CaptionWindow>
        ))}
        {children}
      </>,
    );
  }

  // 16:9
  const area = {x: 880, y: 50, w: 980, h: 980};
  const stageH = stageBottom - stageTop;
  const s = Math.min(area.w / 1080, area.h / stageH);
  return camera(
    <>
      <div style={{position: 'absolute', left: 110, top: 0, bottom: 0, width: 760, display: 'grid', alignContent: 'center'}}>
        {blocks.map((b, i) => (
          <div key={i} style={{gridArea: '1 / 1'}}>
            <CaptionWindow b={b}>
              <Caption lines={b.lines} size={(b.size ?? 88) * 0.76} />
            </CaptionWindow>
          </div>
        ))}
      </div>
      <div style={{position: 'absolute', left: area.x + (area.w - 1080 * s) / 2, top: area.y + (area.h - stageH * s) / 2, width: 1080, height: stageH, transform: `scale(${s})`, transformOrigin: '0 0'}}>
        <div style={{position: 'absolute', left: 0, top: -stageTop, width: 1080, height: 1920}}>{children}</div>
      </div>
    </>,
  );
};
