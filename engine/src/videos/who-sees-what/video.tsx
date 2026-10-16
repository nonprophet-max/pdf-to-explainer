// Example: "Who sees what when you pay for AI" (from PI's public privacy comparison, 7 Oct 2026).
// Stage coordinates are 9:16 (1080×1920); timings are ticks (30/s).
import React from 'react';
import {interpolate} from 'remotion';
import {Scene} from '../../engine/Scene';
import {VideoDef, withPlates} from '../../engine/Video';
import {At, Bubble, Card, Coin, ComparisonGrid, Enclave, Eye, Fog, Footnote, Lane, LaneLabel, Laptop, Lock, Pop, clamp, useSpr, useTick} from '../../engine/parts';
import {useTheme} from '../../engine/theme';
import {body, display} from '../../engine/fonts';
import plates from './plates.json';

const PAY_X = 290;
const PROMPT_X = 790;

const Person: React.FC = () => {
  const C = useTheme();
  return (
    <div style={{position: 'relative', width: 300, height: 300}}>
      <div style={{position: 'absolute', left: 85, top: 0, width: 130, height: 130, borderRadius: '50%', background: C.surface, boxShadow: C.sh()}} />
      <div style={{position: 'absolute', left: 30, top: 140, width: 240, height: 200, borderRadius: '120px 120px 30px 30px', background: C.paper3, boxShadow: C.sh()}} />
    </div>
  );
};

// Hook
const Hook: React.FC<{dur: number}> = ({dur}) => {
  const C = useTheme();
  const t = useTick();
  const coinS = useSpr(18, {damping: 9, mass: 0.8});
  const bubS = useSpr(28, {damping: 9, mass: 0.8});
  const bob = (o: number) => Math.sin((t + o) / 9) * 12;
  return (
    <Scene dur={dur} caption={{top: 300, size: 104, lines: [{t: 'You pay for AI.', at: 4}, {t: "But who's *watching?", at: 42}]}} stageTop={680} stageBottom={1600}>
      <At x={150} y={780}><Eye size={120} delay={56} seed={1} look={[390, 400]} /></At>
      <At x={890} y={650}><Eye size={96} delay={62} seed={2} look={[-350, 530]} /></At>
      <At x={150} y={1520}><Eye size={86} delay={68} seed={3} look={[390, -340]} /></At>
      <At x={880} y={1540}><Eye size={110} delay={74} seed={4} look={[-340, -360]} /></At>
      <At x={540} y={1450}><div style={{width: 880, height: 56, borderRadius: 28, background: C.paper2, boxShadow: C.sh()}} /></At>
      <At x={540} y={1180}><Pop delay={0}><Person /></Pop></At>
      <At x={540} y={1300}><Pop delay={6}><Laptop /></Pop></At>
      <At x={interpolate(coinS, [0, 1], [540, 290])} y={interpolate(coinS, [0, 1], [1250, 900]) + bob(0)}>
        <div style={{transform: `scale(${coinS}) rotate(${(1 - coinS) * -90}deg)`}}><Coin /></div>
      </At>
      <At x={interpolate(bubS, [0, 1], [540, 760])} y={interpolate(bubS, [0, 1], [1250, 880]) + bob(20)}>
        <div style={{transform: `scale(${bubS}) rotate(${(1 - bubS) * 60}deg)`}}><Bubble /></div>
      </At>
    </Scene>
  );
};

// Problem: two things give you away
const TwoThings: React.FC<{dur: number}> = ({dur}) => {
  const C = useTheme();
  const t = useTick();
  const grow = interpolate(t, [92, 130], [0, 1], clamp);
  const bob = (o: number) => Math.sin((t + o) / 9) * 10;
  return (
    <Scene dur={dur} caption={{top: 300, size: 100, lines: [{t: 'Two things give you *away:', at: 4}, {t: 'the *payment', at: 42}, {t: 'and the *prompt.', at: 70}]}} stageTop={900} stageBottom={1600}>
      <Lane x={PAY_X} y1={1340} y2={1580} grow={grow} />
      <Lane x={PROMPT_X} y1={1340} y2={1580} grow={grow} />
      <At x={PAY_X} y={1060 + bob(0)}><Pop delay={42} rot={-40}><Coin size={190} /></Pop></At>
      <At x={PROMPT_X} y={1060 + bob(20)}><Pop delay={70} rot={40}><Bubble w={250} h={180} /></Pop></At>
      <At x={PAY_X} y={1240}><Pop delay={50}><LaneLabel text="PAYMENT" /></Pop></At>
      <At x={PROMPT_X} y={1240}><Pop delay={78}><LaneLabel text="PROMPT" /></Pop></At>
      <At x={PAY_X} y={1300}><Pop delay={98}><div style={{fontFamily: body, fontSize: 32, color: C.grey}}>who knows who paid?</div></Pop></At>
      <At x={PROMPT_X} y={1300}><Pop delay={104}><div style={{fontFamily: body, fontSize: 32, color: C.grey}}>who reads it?</div></Pop></At>
    </Scene>
  );
};

// Context: the usual path, watched at every stop
const UsualPath: React.FC<{dur: number}> = ({dur}) => {
  const t = useTick();
  const coinY = interpolate(t, [16, 130], [640, 1500], clamp);
  const bubY = interpolate(t, [30, 150], [640, 1520], clamp);
  const pay = [{label: 'Card or chain', sub: 'public trail', y: 820, at: 38}, {label: 'Provider', sub: 'ties usage to you', y: 1180, at: 84}];
  const prompt = [{label: 'Relay', y: 780, at: 54}, {label: 'Host', y: 1040, at: 89}, {label: 'Model', y: 1300, at: 124}];
  return (
    <Scene dur={dur} caption={{size: 78, lines: [{t: 'On most services,', at: 2}, {t: 'someone sees *who *paid,', at: 30}, {t: 'reads *your *prompt,', at: 62}, {t: 'or *both.', at: 100}]}} stageTop={620} stageBottom={1600}>
      <Lane x={PAY_X} y1={640} y2={1580} />
      <Lane x={PROMPT_X} y1={640} y2={1580} />
      {pay.map((c) => (
        <React.Fragment key={c.label}>
          <At x={PAY_X} y={c.y}><Pop delay={4}><Card label={c.label} sub={c.sub} /></Pop></At>
          <At x={PAY_X + 150} y={c.y - 75} z={3}><Eye size={92} delay={c.at - 6} seed={c.y} look={[-150, coinY - (c.y - 75)]} /></At>
        </React.Fragment>
      ))}
      {prompt.map((c) => (
        <React.Fragment key={c.label}>
          <At x={PROMPT_X} y={c.y}><Pop delay={10}><Card label={c.label} sub="reads it" w={300} /></Pop></At>
          <At x={PROMPT_X - 140} y={c.y - 62} z={3}><Eye size={92} delay={c.at - 6} seed={c.y + 7} look={[140, bubY - (c.y - 62)]} /></At>
        </React.Fragment>
      ))}
      <At x={PAY_X} y={coinY} z={2}><Coin size={110} /></At>
      <At x={PROMPT_X} y={bubY} z={2}><Bubble w={150} h={108} /></At>
    </Scene>
  );
};

// Solution: Private Inference's path
const PiPath: React.FC<{dur: number}> = ({dur}) => {
  const C = useTheme();
  const t = useTick();
  const coinY = interpolate(t, [34, 80], [840, 1120], clamp);
  const coinFade = interpolate(t, [62, 84], [1, 0], clamp);
  const lockS = useSpr(102, {damping: 9, mass: 0.6});
  const dark = interpolate(t, [104, 110], [0, 1], clamp) * interpolate(t, [205, 212], [1, 0], clamp);
  const bubY = interpolate(t, [118, 200], [860, 1390], clamp);
  const open = interpolate(t, [204, 216], [0, 1], clamp);
  return (
    <Scene
      dur={dur}
      caption={{
        top: 200,
        size: 82,
        lines: [
          {t: 'With *Private *Inference:', at: 2},
          {t: 'Aztec hides *who *paid.', at: 34},
          {t: 'Your prompt stays *encrypted', at: 100},
          {t: "until it's inside a *secure *enclave.", at: 140},
        ],
      }}
      stageTop={780}
      stageBottom={1600}
    >
      <Lane x={PAY_X} y1={800} y2={1000} />
      <Lane x={PROMPT_X} y1={800} y2={1250} />
      <At x={PAY_X} y={1150}><Pop delay={20}><Fog /></Pop></At>
      <At x={PAY_X} y={coinY} z={1} style={{opacity: coinFade}}><Coin size={110} /></At>
      <At x={PAY_X} y={1150} z={2}><Pop delay={24}><Fog front /></Pop></At>
      {[[-90, 1100, 84], [70, 1070, 90], [10, 1190, 96]].map(([dx, y, d], i) => (
        <At key={i} x={PAY_X + dx} y={y} z={3}>
          <Pop delay={d} rot={20}><div style={{fontFamily: display, fontWeight: 600, fontSize: 70, color: C.accentText}}>?</div></Pop>
        </At>
      ))}
      <At x={PAY_X} y={1400} z={3}>
        <Pop delay={40}>
          <div style={{textAlign: 'center', fontFamily: body}}>
            <div style={{fontSize: 46, fontWeight: 600, color: C.accentText}}>Aztec</div>
            <div style={{fontSize: 30, color: C.grey, marginTop: 4}}>payer and amount hidden</div>
          </div>
        </Pop>
      </At>
      {[{label: 'CDN', y: 940, at: 136}, {label: 'Supplier', y: 1140, at: 158}].map((c) => (
        <React.Fragment key={c.label}>
          <At x={PROMPT_X} y={c.y}><Pop delay={96}><Card label={c.label} sub="sees ciphertext" w={330} /></Pop></At>
          <At x={PROMPT_X - 150} y={c.y - 62} z={3}><Eye size={88} closed delay={c.at - 6} /></At>
        </React.Fragment>
      ))}
      <At x={PROMPT_X} y={1390}><Pop delay={110}><Enclave w={330} h={230} flash={interpolate(t, [200, 210, 235], [0, 1, 0.3], clamp)} /></Pop></At>
      <At x={PROMPT_X} y={1550}><Pop delay={116}><LaneLabel text="ENCLAVE" /></Pop></At>
      <At x={PROMPT_X} y={bubY} z={4} style={{opacity: interpolate(t, [86, 94], [0, 1], clamp)}}>
        <div style={{position: 'relative'}}>
          <Bubble w={180} h={128} dark={dark} />
          <div style={{position: 'absolute', right: -40, top: -70, transform: `scale(${lockS * interpolate(t, [216, 228], [1, 0], clamp)})`}}>
            <Lock size={76} open={open} />
          </div>
        </div>
      </At>
    </Scene>
  );
};

// Conclusion: side by side
const SideBySide: React.FC<{dur: number}> = ({dur}) => (
  <Scene dur={dur} caption={{top: 210, size: 104, lines: [{t: 'Payer *hidden.', at: 2}, {t: 'Prompt *hidden.', at: 18}]}} stageTop={520} stageBottom={1600}>
    <ComparisonGrid
      top={540}
      columns={['Payer hidden', 'Prompt hidden']}
      rows={[
        {name: 'Private Inference', sub: 'private mode', marks: ['yes', 'yes'], highlight: true},
        {name: 'zkAPI', sub: 'usage not tied to deposit', marks: ['yes', 'no']},
        {name: 'Venice', sub: 'end-to-end encrypted mode', marks: ['no', 'yes']},
        {name: 'OpenRouter', sub: 'confidential endpoint', marks: ['no', 'no']},
        {name: 'AntSeed', sub: 'verified TDX seller', marks: ['no', 'some']},
      ]}
      rowH={156}
    />
    <Footnote y={1470}>Each product in its most private mode, per public docs and code, October 2026.</Footnote>
  </Scene>
);

const video: VideoDef = {
  id: 'WhoSeesWhat',
  title: 'Who sees what when you pay for AI',
  scenes: [
    {id: 'hook', C: Hook, ticks: 120},
    {id: 'two-things', C: TwoThings, ticks: 150},
    {id: 'usual-path', C: UsualPath, ticks: 180},
    {id: 'pi-path', C: PiPath, ticks: 240},
    {id: 'side-by-side', C: SideBySide, ticks: 120},
  ],
  outro: {tagline: 'Access AI privately.'},
};

export default withPlates(video, plates);
