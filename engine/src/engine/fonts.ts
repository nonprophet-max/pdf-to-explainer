// Loads a brand pack's bundled fonts (copied from the design system) before the first frame renders.
import {useEffect, useState} from 'react';
import {cancelRender, continueRender, delayRender, staticFile} from 'remotion';
import {BrandPack} from './theme';

export const useBrandFonts = (pack: BrandPack) => {
  const [handle] = useState(() => delayRender(`fonts for ${pack.id}`));
  useEffect(() => {
    Promise.all(
      pack.fonts.faces.map(async (f) => {
        const face = new FontFace(f.family, `url(${staticFile(f.src)}) format('woff2')`, {weight: f.weight});
        document.fonts.add(await face.load());
      }),
    )
      .then(() => continueRender(handle))
      .catch((e) => cancelRender(e));
  }, [handle, pack]);
};
