import React from 'react';
import {Composition, Folder} from 'remotion';
import {VideoDef, compositionsFor} from './engine/Video';

// Every src/videos/<slug>/video.tsx default-exports a VideoDef; each gets its formats × 2 themes.
// A video that no longer fits the engine (e.g. written for an older skill version) is skipped with an
// error instead of breaking every other video in the workspace.
const ctx = require.context('./videos', true, /\/video\.tsx$/);
const videos = ctx.keys().flatMap((k) => {
  try {
    const v = ctx<{default: VideoDef}>(k).default;
    return [{v, comps: compositionsFor(v)}];
  } catch (e) {
    console.error(`Skipping ${k}: ${(e as Error).message}. It may need updating for this engine (npx tsc -p . in engine/).`);
    return [];
  }
});

export const RemotionRoot: React.FC = () => (
  <>
    {videos.map(({v, comps}) => (
      <Folder key={v.id} name={v.id}>
        {comps.map((c) => (
          <Composition key={c.id} {...c} />
        ))}
      </Folder>
    ))}
  </>
);
