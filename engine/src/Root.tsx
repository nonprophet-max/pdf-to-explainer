import React from 'react';
import {Composition, Folder} from 'remotion';
import {VideoDef, compositionsFor} from './engine/Video';

// Every src/videos/<slug>/video.tsx default-exports a VideoDef; each gets 2 formats × 2 themes.
const ctx = require.context('./videos', true, /\/video\.tsx$/);
const videos: VideoDef[] = ctx.keys().map((k) => ctx<{default: VideoDef}>(k).default);

export const RemotionRoot: React.FC = () => (
  <>
    {videos.map((v) => (
      <Folder key={v.id} name={v.id}>
        {compositionsFor(v).map((c) => (
          <Composition key={c.id} {...c} />
        ))}
      </Folder>
    ))}
  </>
);
