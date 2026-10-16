// Closing brand animation: logo spins in, name, tagline, URL pill, optional status note.
import React from 'react';
import {Img, staticFile} from 'remotion';
import {body, display} from './fonts';
import {useFormat} from './format';
import {Pop, useSpr} from './parts';
import {BRAND, useTheme} from './theme';

export type OutroProps = {tagline?: string; url?: string; note?: string};

export const Outro: React.FC<OutroProps> = ({tagline = BRAND.tagline, url = BRAND.url, note}) => {
  const C = useTheme();
  const k = useFormat() === '16x9' ? 0.8 : 1;
  const logo = useSpr(2, {damping: 10, mass: 0.8});
  return (
    <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 34 * k}}>
      <div style={{transform: `scale(${logo}) rotate(${(1 - logo) * -120}deg)`, filter: C.drop, marginBottom: 20 * k}}>
        <Img src={staticFile(`brand/${BRAND.logo}`)} style={{width: 260 * k, height: 260 * k}} />
      </div>
      <Pop delay={10}>
        <div style={{fontFamily: display, fontWeight: 300, fontSize: 108 * k, color: C.text, whiteSpace: 'nowrap', letterSpacing: -2, lineHeight: 1}}>{BRAND.name}</div>
      </Pop>
      <Pop delay={18}>
        <div style={{fontFamily: display, fontWeight: 300, fontSize: 62 * k, color: C.accentText, whiteSpace: 'nowrap'}}>{tagline}</div>
      </Pop>
      <Pop delay={28}>
        <div style={{fontFamily: body, fontWeight: 600, fontSize: 48 * k, color: C.ink, background: C.gold, padding: `${22 * k}px ${52 * k}px`, borderRadius: 20, boxShadow: C.sh(), marginTop: 20 * k}}>{url}</div>
      </Pop>
      {note ? (
        <Pop delay={34}>
          <div style={{fontFamily: body, fontSize: 30 * k, color: C.grey, whiteSpace: 'nowrap'}}>{note}</div>
        </Pop>
      ) : null}
    </div>
  );
};
