// Closing brand animation, from the brand pack: logo, name (or wordmark), sub-brand label,
// optional line and URL, and the quiet "by Persistent Labs" endorsement.
import React from 'react';
import {useFormat} from './format';
import {Logo, Pop, useSpr} from './parts';
import {useTheme} from './theme';

export type OutroProps = {
  tagline?: string; // only an approved line (the design system lists none for some brands)
  url?: string | null; // defaults to the brand's URL from the design system, if it has one
  note?: string; // status qualifier, e.g. "Upcoming"
};

export const Outro: React.FC<OutroProps> = ({tagline, url, note}) => {
  const C = useTheme();
  const b = C.brand;
  const k = useFormat() === '16x9' ? 0.8 : 1;
  const logo = useSpr(2, {damping: 10, mass: 0.8});
  const link = url === undefined ? b.url : url;
  const wordmark = b.logo.kind === 'wordmark';
  return (
    <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 30 * k, padding: '0 80px'}}>
      <div style={{transform: `scale(${logo}) rotate(${(1 - logo) * (wordmark ? -8 : -120)}deg)`, filter: C.drop, marginBottom: 16 * k}}>
        <Logo height={(wordmark ? 120 : 240) * k} color={wordmark ? C.text : C.accent} />
      </div>
      {wordmark ? null : (
        <Pop delay={10}>
          <div style={{fontFamily: C.fonts.display, fontWeight: 300, fontSize: 104 * k, color: C.text, whiteSpace: 'nowrap', letterSpacing: -2, lineHeight: 1}}>{b.name}</div>
        </Pop>
      )}
      {b.component ? (
        <Pop delay={14}>
          <div style={{display: 'flex', alignItems: 'center', gap: 14, fontFamily: C.fonts.body, fontWeight: 600, fontSize: 40 * k, color: C.accentText}}>
            {b.component.logo ? <ComponentIcon /> : null}
            {b.component.name}
          </div>
        </Pop>
      ) : null}
      {tagline ? (
        <Pop delay={18}>
          <div style={{fontFamily: C.fonts.display, fontWeight: 300, fontSize: 58 * k, color: C.highlight === 'marker' ? C.text : C.accentText, textAlign: 'center'}}>{tagline}</div>
        </Pop>
      ) : null}
      {link ? (
        <Pop delay={26}>
          <div style={{fontFamily: C.fonts.body, fontWeight: 600, fontSize: 46 * k, color: C.ink, background: C.accent, padding: `${20 * k}px ${48 * k}px`, borderRadius: 20, boxShadow: C.sh(), marginTop: 14 * k}}>{link}</div>
        </Pop>
      ) : null}
      {note ? (
        <Pop delay={32}>
          <div style={{fontFamily: C.fonts.body, fontSize: 30 * k, color: C.grey, whiteSpace: 'nowrap'}}>{note}</div>
        </Pop>
      ) : null}
      {b.endorsement ? (
        <Pop delay={36}>
          <div style={{fontFamily: C.fonts.body, fontSize: 28 * k, color: C.mute, marginTop: 10 * k}}>{b.endorsement}</div>
        </Pop>
      ) : null}
    </div>
  );
};

const ComponentIcon: React.FC = () => <Logo height={44} component />;
