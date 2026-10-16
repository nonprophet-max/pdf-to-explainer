// The visual vocabulary. Every prop that takes a time is in ticks (30 per second).
// Positions are in the 9:16 stage space (1080 wide, 1920 tall); Scene maps them onto 16:9.
import React from 'react';
import {Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {CAPTION, TICK_FPS} from './cadence';
import {useTheme} from './theme';

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Current time in ticks (30/s), independent of render fps. */
export const useTick = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (f * TICK_FPS) / fps;
};

export const useSpr = (delay = 0, config: Record<string, number> = {damping: 12, mass: 0.6}) => {
  const t = useTick();
  return spring({frame: t - delay, fps: TICK_FPS, config});
};

/** Linear ramp 0→1 between two ticks. */
export const useRamp = (a: number, b: number) => interpolate(useTick(), [a, b], [0, 1], clamp);

export const At: React.FC<{x: number; y: number; z?: number; children?: React.ReactNode; style?: React.CSSProperties}> = ({x, y, z, children, style}) => (
  <div style={{position: 'absolute', left: x, top: y, transform: 'translate(-50%,-50%)', zIndex: z, ...style}}>{children}</div>
);

export const Pop: React.FC<{delay?: number; rot?: number; children?: React.ReactNode}> = ({delay = 0, rot = 0, children}) => {
  const s = useSpr(delay, {damping: 10, mass: 0.7});
  return <div style={{transform: `scale(${s}) rotate(${(1 - s) * rot}deg)`}}>{children}</div>;
};

/** Show children between two ticks, with short fades. */
export const Window: React.FC<{from?: number; to?: number; children?: React.ReactNode}> = ({from, to, children}) => {
  const t = useTick();
  const o = (from === undefined ? 1 : interpolate(t, [from, from + 8], [0, 1], clamp)) * (to === undefined ? 1 : interpolate(t, [to - 8, to], [1, 0], clamp));
  return <div style={{position: 'absolute', inset: 0, opacity: o}}>{children}</div>;
};

// ---------- captions ----------

// at = earliest start (tick); the pause rule may push it later. A "\n" in t breaks the block there by hand.
export type CaptionLine = {t: string; at?: number};

const PAUSE_TICKS = CAPTION.pauseSec * TICK_FPS;

const wordsOf = (t: string) => t.trim().split(/\s+/);
const rowsOf = (t: string) => t.split('\n').map((r) => r.trim().split(/\s+/).filter(Boolean));

/** When each caption block actually starts and lands, after applying the 0.5 s pause rule. */
export const scheduleCaption = (lines: CaptionLine[]) => {
  let prevLand = -Infinity;
  return lines.map((l, i) => {
    const words = wordsOf(l.t).length;
    const start = Math.max(l.at ?? (i === 0 ? CAPTION.firstAtTicks : 0), prevLand + PAUSE_TICKS);
    const land = start + (words - 1) * CAPTION.wordGapTicks + CAPTION.settleTicks;
    prevLand = land;
    return {start, land, words};
  });
};

// Logs "[caption-wrap] …" when the browser wraps a block so that one word sits alone on a line
// (scripts/render.mjs --stills collects these). Hand breaks ("\n") are the author's choice and not reported.
// Only in check renders (safe zones on), once the brand fonts are in.
export const ChecksCtx = React.createContext(false);
const useWrapCheck = (ref: React.RefObject<HTMLDivElement>, lines: CaptionLine[], size: number) => {
  const on = React.useContext(ChecksCtx);
  React.useEffect(() => {
    const el = ref.current;
    if (!on || !el) return;
    el.querySelectorAll<HTMLElement>('[data-row]').forEach((row) => {
      const tops = Array.from(row.children as HTMLCollectionOf<HTMLElement>).map((w) => w.offsetTop);
      const perLine = tops.reduce<number[]>((acc, top, i) => (i > 0 && Math.abs(top - tops[i - 1]) < 2 ? (acc[acc.length - 1]++, acc) : [...acc, 1]), []);
      if (perLine.length > 1 && perLine.includes(1)) {
        const text = lines[Number(row.dataset.block)].t.replace(/[*]/g, '').replace(/\s+/g, ' ');
        console.warn(`[caption-wrap] "${text}" at ${size} px wraps into ${perLine.length} lines (${perLine.join('+')} words)`);
      }
    });
  });
};

/** Kinetic caption: blocks (lines) spring in word by word. A word starting with * is highlighted. */
export const Caption: React.FC<{lines: CaptionLine[]; size?: number; style?: React.CSSProperties}> = ({lines, size = 88, style}) => {
  const C = useTheme();
  const t = useTick();
  const sched = scheduleCaption(lines);
  const ref = React.useRef<HTMLDivElement>(null);
  useWrapCheck(ref, lines, size);
  return (
    <div ref={ref} style={{fontFamily: C.fonts.display, fontWeight: 500, fontSize: size, lineHeight: 1.12, color: C.text, letterSpacing: -1, ...style}}>
      {lines.map((l, li) => {
        let n = 0; // word index within the block, across hand breaks
        return rowsOf(l.t).map((ws, ri) => (
          <div key={`${li}-${ri}`} data-row data-block={li} style={{display: 'flex', flexWrap: 'wrap', columnGap: size * 0.26}}>
            {ws.map((w, i) => {
              const hi = w.startsWith('*');
              // consecutive highlighted words share one marker: square, touching inner edges
              const joinL = hi && i > 0 && ws[i - 1].startsWith('*');
              const joinR = hi && i < ws.length - 1 && ws[i + 1].startsWith('*');
              const gap = size * 0.13;
              const pad = size * 0.1;
              const r = size * 0.14;
              const s = spring({frame: t - (sched[li].start + n++ * CAPTION.wordGapTicks), fps: TICK_FPS, config: {damping: 11, mass: 0.5}});
              const marker = hi && C.highlight === 'marker';
              return (
                <span
                  key={i}
                  style={{
                    display: 'inline-block',
                    color: marker ? C.ink : hi ? C.accentText : C.text,
                    background: marker ? C.accent : undefined,
                    padding: marker ? `0 ${joinR ? gap : pad}px 0 ${joinL ? gap : pad}px` : undefined,
                    margin: marker ? `0 ${joinR ? -gap : -pad * 0.6}px 0 ${joinL ? -gap : -pad * 0.6}px` : undefined,
                    borderRadius: marker ? `${joinL ? 0 : r}px ${joinR ? 0 : r}px ${joinR ? 0 : r}px ${joinL ? 0 : r}px` : undefined,
                    opacity: Math.min(1, s * 2),
                    transform: `translateY(${(1 - s) * 50}px) scale(${0.6 + 0.4 * s}) rotate(${(1 - s) * -6}deg)`,
                    textShadow: marker ? 'none' : C.textShadow,
                  }}
                >
                  {hi ? w.slice(1) : w}
                </span>
              );
            })}
          </div>
        ));
      })}
    </div>
  );
};

/** Title + optional sub-line. Accent by default (ours); tone="neutral" for third parties and plain notes. */
export const Label: React.FC<{title: string; sub?: string; tone?: 'accent' | 'neutral'}> = ({title, sub, tone = 'accent'}) => {
  const C = useTheme();
  return (
    <div style={{textAlign: 'center', fontFamily: C.fonts.body, whiteSpace: 'nowrap'}}>
      <div style={{fontSize: 40, fontWeight: 600, color: tone === 'neutral' ? C.text : C.accentText}}>{title}</div>
      {sub ? <div style={{fontSize: 29, color: C.grey, marginTop: 4}}>{sub}</div> : null}
    </div>
  );
};

export const LaneLabel: React.FC<{text: string; color?: string}> = ({text, color}) => {
  const C = useTheme();
  return <div style={{fontFamily: C.fonts.body, fontWeight: 600, fontSize: 34, letterSpacing: 8, color: color ?? C.accentText}}>{text}</div>;
};

export const Footnote: React.FC<{y: number; children: React.ReactNode}> = ({y, children}) => {
  const C = useTheme();
  return <div style={{position: 'absolute', top: y, left: 80, right: 160, textAlign: 'center', fontFamily: C.fonts.body, fontSize: 27, color: C.grey, lineHeight: 1.45}}>{children}</div>;
};

// ---------- objects ----------

/** Payment. */
export const Coin: React.FC<{size?: number; symbol?: string}> = ({size = 150, symbol = '$'}) => {
  const C = useTheme();
  return (
    <div style={{width: size, height: size, borderRadius: '50%', background: C.accent, boxShadow: `inset 0 -${size * 0.06}px 0 ${C.accentDeep}, ${C.sh()}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: C.fonts.display, fontWeight: 600, fontSize: size * 0.52, color: C.ink}}>
      {symbol}
    </div>
  );
};

/** A prompt. dark=1 shows it encrypted. */
export const Bubble: React.FC<{w?: number; h?: number; dark?: number}> = ({w = 210, h = 150, dark = 0}) => {
  const C = useTheme();
  const bg = dark > 0.5 ? C.cipherBg : C.surface;
  return (
    <div style={{position: 'relative', width: w, height: h}}>
      <div style={{position: 'absolute', left: w * 0.16, bottom: -h * 0.12, width: h * 0.32, height: h * 0.32, background: bg, transform: 'rotate(45deg)', boxShadow: C.sh(0.6)}} />
      <div style={{position: 'absolute', inset: 0, borderRadius: h * 0.28, background: bg, boxShadow: C.sh(), border: dark > 0.5 ? `4px solid ${C.accent}` : 'none', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: h * 0.11, padding: `0 ${w * 0.16}px`, boxSizing: 'border-box'}}>
        {dark > 0.5 ? (
          <div style={{fontFamily: C.fonts.mono, color: C.accent, fontSize: h * 0.2, lineHeight: 1.2, wordBreak: 'break-all'}}>a9#f2·x7Q 0e!k·Zr4</div>
        ) : (
          [1, 0.8, 0.55].map((p, i) => <div key={i} style={{height: h * 0.09, width: `${p * 100}%`, borderRadius: 99, background: C.bubbleLine}} />)
        )}
      </div>
    </div>
  );
};

/**
 * An observer. Opens with a lid, blinks softly on its own schedule, glides its gaze.
 * `look` is a direction (target minus eye position); without it the eye idles. `closed` = cannot see.
 */
export const Eye: React.FC<{size?: number; closed?: boolean; delay?: number; seed?: number; look?: [number, number]}> = ({size = 90, closed = false, delay = 0, seed = 1, look}) => {
  const C = useTheme();
  const t = useTick();
  const open = spring({frame: t - delay, fps: TICK_FPS, config: {damping: 20, mass: 0.9, stiffness: 90}});
  const appear = interpolate(open, [0, 0.35], [0, 1], clamp);
  const lift = (1 - open) * 18;
  const w = size;
  const h = size * 0.62;
  if (closed) {
    return (
      <div style={{width: w, height: h, borderRadius: '50%', background: C.paper3, boxShadow: C.sh(0.6), display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: appear, transform: `translateY(${lift}px)`}}>
        <svg width={w * 0.7} height={h * 0.5} viewBox="0 0 70 30">
          <path d="M4 6 Q35 30 66 6" stroke={C.grey} strokeWidth={6} fill="none" strokeLinecap="round" />
        </svg>
      </div>
    );
  }
  const period = 95 + ((seed * 37) % 45);
  const ph = (t + seed * 53) % period;
  const blink = ph < 9 ? Math.sin((ph / 9) * Math.PI) : 0;
  const lid = Math.max(1 - open, blink);
  let gx: number;
  let gy: number;
  if (look) {
    const len = Math.hypot(look[0], look[1]) || 1;
    gx = look[0] / len;
    gy = look[1] / len;
  } else {
    const hold = 45;
    const tt = t + seed * 17;
    const step = Math.floor(tt / hold);
    const k = Easing.inOut(Easing.cubic)(Math.min(1, (tt % hold) / 12));
    const pt = (n: number) => [random(`x${seed}-${n}`) * 2 - 1, (random(`y${seed}-${n}`) * 2 - 1) * 0.6];
    const [ax, ay] = pt(step - 1);
    const [bx, by] = pt(step);
    gx = ax + (bx - ax) * k;
    gy = ay + (by - ay) * k;
  }
  return (
    <div style={{opacity: appear, transform: `translateY(${lift}px)`}}>
      <div style={{width: w, height: h, borderRadius: '50%', background: C.surface, boxShadow: C.sh(0.6), position: 'relative', overflow: 'hidden'}}>
        <div style={{position: 'absolute', width: w * 0.4, height: w * 0.4, borderRadius: '50%', background: C.ink, left: '50%', top: '50%', transform: `translate(calc(-50% + ${gx * w * 0.2}px), calc(-50% + ${gy * h * 0.22}px))`}}>
          <div style={{position: 'absolute', width: w * 0.11, height: w * 0.11, borderRadius: '50%', background: C.surface, opacity: 0.85, left: '22%', top: '18%'}} />
        </div>
        <div style={{position: 'absolute', left: -4, right: -4, top: 0, height: `${lid * 104}%`, background: C.paper3, borderRadius: '0 0 50% 50% / 0 0 40% 40%', boxShadow: C.lidShadow}} />
      </div>
    </div>
  );
};

/** A party or step (service, relay, host...). */
export const Card: React.FC<{label: string; sub?: string; w?: number; accent?: boolean}> = ({label, sub, w = 330, accent}) => {
  const C = useTheme();
  return (
    <div style={{width: w, padding: '22px 26px', boxSizing: 'border-box', borderRadius: 24, background: C.paper2, boxShadow: C.sh(), borderTop: `3px solid ${accent ? C.accent : C.cardTop}`, fontFamily: C.fonts.body, textAlign: 'center'}}>
      <div style={{fontSize: 40, fontWeight: 600, color: C.text}}>{label}</div>
      {sub ? <div style={{fontSize: 27, fontWeight: 500, color: accent ? C.accentText : C.grey, marginTop: 6}}>{sub}</div> : null}
    </div>
  );
};

/** Encryption. open 0→1 swings the shackle open. */
export const Lock: React.FC<{size?: number; open?: number}> = ({size = 80, open = 0}) => {
  const C = useTheme();
  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 80 92" style={{filter: C.drop, overflow: 'visible'}}>
      <g transform={`translate(${open * 18} ${-open * 14}) rotate(${open * 25} 58 40)`}>
        <path d="M20 42 V28 a20 20 0 0 1 40 0 V42" stroke={C.accent} strokeWidth={10} fill="none" strokeLinecap="round" />
      </g>
      <rect x={6} y={40} width={68} height={50} rx={12} fill={C.accent} />
      <circle cx={40} cy={62} r={7} fill={C.ink} />
      <rect x={37} y={62} width={6} height={14} rx={3} fill={C.ink} />
    </svg>
  );
};

/** Dashed path a thing travels along. */
export const Lane: React.FC<{x: number; y1: number; y2: number; grow?: number}> = ({x, y1, y2, grow = 1}) => {
  const C = useTheme();
  return <div style={{position: 'absolute', left: x - 4, top: y1, width: 8, height: (y2 - y1) * grow, borderRadius: 4, background: `repeating-linear-gradient(to bottom, ${C.line} 0 26px, transparent 26px 46px)`}} />;
};

/** Privacy layer (e.g. Aztec): things that enter it can't be seen. */
export const Fog: React.FC<{front?: boolean}> = ({front}) => {
  const C = useTheme();
  const t = useTick();
  const puffs = front
    ? [[-230, 110, 150], [-90, 140, 170], [70, 145, 170], [220, 110, 150]]
    : [[-200, -10, 170], [0, -70, 200], [200, -10, 170]];
  return (
    <div style={{position: 'relative', width: 0, height: 0}}>
      {puffs.map(([x, y, r], i) => (
        <div key={i} style={{position: 'absolute', left: x + Math.sin(t / 18 + i) * 20 - r / 2, top: y + Math.cos(t / 22 + i) * 8 - r / 2, width: r, height: r, borderRadius: '50%', background: front ? C.fogFront : C.fogBack, opacity: front ? 0.92 : 1, boxShadow: C.sh(0.5)}} />
      ))}
    </div>
  );
};

/** Attested enclave (TEE): the only place plaintext exists. flash 0→1 at the moment it unlocks. */
export const Enclave: React.FC<{w?: number; h?: number; flash?: number}> = ({w = 390, h = 255, flash = 0}) => {
  const C = useTheme();
  const t = useTick();
  const glow = 0.5 + 0.5 * Math.sin(t / 7) + flash * 2;
  return <div style={{width: w, height: h, borderRadius: 34, background: C.enclaveFill, border: `6px solid ${C.accentDeep}`, boxShadow: `0 0 ${40 * glow}px ${10 * glow}px ${C.enclaveGlow}, ${C.sh()}`}} />;
};

/** A person. */
export const User: React.FC<{scale?: number}> = ({scale = 1}) => {
  const C = useTheme();
  return (
    <div style={{position: 'relative', width: 160 * scale, height: 170 * scale}}>
      <div style={{position: 'absolute', left: 45 * scale, top: 0, width: 70 * scale, height: 70 * scale, borderRadius: '50%', background: C.surface, boxShadow: C.sh(0.6)}} />
      <div style={{position: 'absolute', left: 15 * scale, top: 78 * scale, width: 130 * scale, height: 92 * scale, borderRadius: `${65 * scale}px ${65 * scale}px ${16 * scale}px ${16 * scale}px`, background: C.paper3, boxShadow: C.sh(0.6)}} />
    </div>
  );
};

/** The brand's logo from its pack. Marks that use currentColor take `color` (default: accent). */
export const Logo: React.FC<{height: number; color?: string; component?: boolean}> = ({height, color, component}) => {
  const C = useTheme();
  const svg = (component && C.brand.component?.logo) || C.brand.logo.svg;
  return (
    <div
      className="brand-logo"
      style={{height, color: color ?? C.accent, display: 'flex', alignItems: 'center'}}
      dangerouslySetInnerHTML={{__html: `<style>.brand-logo svg{height:100%;width:auto;display:block}.brand-logo svg .mark{fill:currentColor}</style>${svg}`}}
    />
  );
};

/** Laptop seen from behind, with the brand mark. */
export const Laptop: React.FC = () => {
  const C = useTheme();
  return (
    <div style={{position: 'relative', width: 420, height: 270}}>
      <div style={{position: 'absolute', left: 30, top: 0, width: 360, height: 230, borderRadius: 22, background: C.paper2, boxShadow: C.sh(), display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <Logo height={C.brand.logo.kind === 'wordmark' ? 30 : 64} />
      </div>
      <div style={{position: 'absolute', left: 0, top: 232, width: 420, height: 30, borderRadius: 15, background: C.line, boxShadow: C.sh(0.6)}} />
    </div>
  );
};

/** A deposit / contract vault (safe door). spin 0→1 turns the wheel. */
export const Vault: React.FC<{w?: number; spin?: number}> = ({w = 240, spin = 0}) => {
  const C = useTheme();
  return (
    <div style={{position: 'relative', width: w, height: w * 0.86, borderRadius: 30, background: C.paper2, boxShadow: C.sh(), border: `4px solid ${C.cardTop}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box'}}>
      {[0.22, 0.68].map((p) => (
        <div key={p} style={{position: 'absolute', left: -w * 0.04, top: `${p * 100}%`, width: w * 0.08, height: w * 0.14, borderRadius: 6, background: C.accentDeep}} />
      ))}
      <div style={{position: 'absolute', inset: w * 0.06, borderRadius: 20, border: `3px solid ${C.cardTop}`}} />
      <svg width={w * 0.5} height={w * 0.5} viewBox="0 0 100 100" style={{transform: `rotate(${spin * 240}deg)`}}>
        <circle cx={50} cy={50} r={30} fill="none" stroke={C.accentDeep} strokeWidth={7} />
        {[0, 120, 240].map((r) => (
          <g key={r} transform={`rotate(${r} 50 50)`}>
            <line x1={50} y1={50} x2={50} y2={4} stroke={C.accentDeep} strokeWidth={7} strokeLinecap="round" />
            <circle cx={50} cy={6} r={6} fill={C.accentDeep} />
          </g>
        ))}
        <circle cx={50} cy={50} r={10} fill={C.accentDeep} />
      </svg>
    </div>
  );
};

/** API key / credential. */
export const Key: React.FC<{w?: number}> = ({w = 210}) => {
  const C = useTheme();
  return (
    <svg width={w} height={w * 0.45} viewBox="0 0 200 90" style={{filter: C.drop}}>
      <circle cx={45} cy={45} r={36} fill={C.accent} />
      <circle cx={45} cy={45} r={13} fill={C.bg} />
      <rect x={76} y={37} width={114} height={16} rx={8} fill={C.accent} />
      <rect x={150} y={48} width={14} height={24} rx={4} fill={C.accent} />
      <rect x={171} y={48} width={14} height={16} rx={4} fill={C.accent} />
    </svg>
  );
};

/** Anonymity: a mask to drop onto a coin or a user. */
export const Mask: React.FC<{w?: number}> = ({w = 170}) => {
  const C = useTheme();
  return (
    <svg width={w} height={w * 0.42} viewBox="0 0 120 50" style={{filter: C.drop}}>
      <path d="M4 18 Q60 -2 116 18 Q120 46 86 46 Q66 46 60 33 Q54 46 34 46 Q0 46 4 18Z" fill={C.ink} />
      <ellipse cx={35} cy={26} rx={13} ry={8} fill={C.accent} />
      <ellipse cx={85} cy={26} rx={13} ry={8} fill={C.accent} />
    </svg>
  );
};

/** A signed receipt / voucher with a running total. */
export const Voucher: React.FC<{text: string}> = ({text}) => {
  const C = useTheme();
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', borderRadius: 12, background: C.accent, boxShadow: C.sh(0.5), borderLeft: `6px dashed ${C.accentDeep}`, fontFamily: C.fonts.body, fontWeight: 600, fontSize: 28, color: C.ink, whiteSpace: 'nowrap'}}>
      {text}
      <svg width={44} height={22} viewBox="0 0 44 22">
        <path d="M2 16 Q8 2 13 12 T24 10 T34 8 T42 14" stroke={C.ink} strokeWidth={3} fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
};

/** A proof card with a check. */
export const Proof: React.FC<{label?: string}> = ({label = 'ZK proof'}) => {
  const C = useTheme();
  return (
    <div style={{width: 230, padding: '24px 0 26px', borderRadius: 26, background: C.paper2, boxShadow: C.sh(), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, fontFamily: C.fonts.body}}>
      <div style={{fontSize: 36, fontWeight: 600, color: C.text}}>{label}</div>
      <Mark m="yes" delay={-99} />
    </div>
  );
};

/** Countdown ring. p 0→1 drains it; label shows the time left. */
export const Timer: React.FC<{p: number; minutes: number; r?: number; hideText?: boolean}> = ({p, minutes, r = 120, hideText}) => {
  const C = useTheme();
  const circ = 2 * Math.PI * r;
  return (
    <div style={{position: 'relative', width: 2 * r + 40, height: 2 * r + 40}}>
      <svg width={2 * r + 40} height={2 * r + 40} style={{filter: C.drop}}>
        <circle cx={r + 20} cy={r + 20} r={r} fill={C.paper2} stroke={C.paper3} strokeWidth={18} />
        <circle cx={r + 20} cy={r + 20} r={r} fill="none" stroke={C.accent} strokeWidth={18} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * p} transform={`rotate(-90 ${r + 20} ${r + 20})`} />
      </svg>
      {hideText ? null : (
        <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: C.fonts.display, fontWeight: 500, fontSize: 64, color: C.text}}>{Math.max(0, Math.ceil(minutes * (1 - p)))}m</div>
      )}
    </div>
  );
};

// ---------- comparison ----------

export type MarkKind = 'yes' | 'no' | 'some';

export const Mark: React.FC<{m: MarkKind; delay: number; hi?: boolean}> = ({m, delay, hi}) => {
  const C = useTheme();
  const s = useSpr(delay, {damping: 8, mass: 0.5});
  const fill = m === 'yes' ? (hi ? C.ink : C.success) : 'transparent';
  const fg = m === 'yes' ? (hi ? C.accent : C.onSuccess) : m === 'no' ? C.red : C.grey;
  return (
    <div style={{width: 84, height: 84, borderRadius: '50%', background: fill, border: m === 'yes' ? 'none' : `4px solid ${hi ? C.ink : C.line}`, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${s}) rotate(${(1 - s) * -45}deg)`}}>
      <svg width={42} height={42} viewBox="0 0 44 44">
        {m === 'yes' && <path d="M8 23 L18 33 L37 11" stroke={fg} strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
        {m === 'no' && <path d="M11 11 L33 33 M33 11 L11 33" stroke={fg} strokeWidth={6} strokeLinecap="round" />}
        {m === 'some' && <path d="M7 24 Q15 14 22 22 T37 20" stroke={fg} strokeWidth={6} fill="none" strokeLinecap="round" />}
      </svg>
    </div>
  );
};

export type GridRow = {name: string; sub?: string; marks: MarkKind[]; highlight?: boolean};

/**
 * Comparison table. Either highlight a row (one product vs several) or a column (two products).
 * Rows pop in from `start`; marks snap in after.
 */
export const ComparisonGrid: React.FC<{top: number; columns: string[]; rows: GridRow[]; highlightColumn?: number; start?: number; rowH?: number}> = ({top, columns, rows, highlightColumn, start = 6, rowH = 172}) => {
  const C = useTheme();
  return (
    // right: 170 keeps the right edge ≥ 30 px clear of the action-button zone (x 960) after the ×1.045 push-in
    <div style={{position: 'absolute', top, left: 50, right: 170, fontFamily: C.fonts.body}}>
      <div style={{display: 'flex', alignItems: 'center', padding: '0 30px 16px', fontSize: 28, fontWeight: 600}}>
        <div style={{flex: 1}} />
        {columns.map((c, i) => (
          <div key={c} style={{width: 190, display: 'flex', justifyContent: 'center', textAlign: 'center', lineHeight: 1.2}}>
            <div style={i === highlightColumn ? {background: C.accent, color: C.ink, borderRadius: 14, padding: '8px 18px'} : {color: C.grey, maxWidth: 150}}>{c}</div>
          </div>
        ))}
      </div>
      {rows.map((r, i) => (
        <Pop key={r.name} delay={start + i * 5}>
          <div style={{display: 'flex', alignItems: 'center', height: rowH, marginBottom: 18, padding: '0 30px', borderRadius: 28, background: r.highlight ? C.accent : C.paper2, boxShadow: C.sh(), color: r.highlight ? C.ink : C.text}}>
            <div style={{flex: 1}}>
              <div style={{fontSize: 42, fontWeight: 600, lineHeight: 1.15}}>{r.name}</div>
              {r.sub ? <div style={{fontSize: 27, color: r.highlight ? C.ink : C.grey, opacity: r.highlight ? 0.7 : 1, marginTop: 4}}>{r.sub}</div> : null}
            </div>
            {r.marks.map((m, j) => (
              <div key={j} style={{width: 190, display: 'flex', justifyContent: 'center'}}>
                <Mark m={m} hi={r.highlight} delay={start + 22 + i * 6 + j * 3} />
              </div>
            ))}
          </div>
        </Pop>
      ))}
    </div>
  );
};
