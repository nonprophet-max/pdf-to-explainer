# Agent instructions

This repository is a skill for turning a PDF into a short explainer video in any brand of the Persistent Labs design system. It is written for Claude (see `SKILL.md`, which Claude Code loads as a skill), but the instructions are plain Markdown and work for any coding agent.

**Follow `SKILL.md` exactly** — it is the workflow. Read `docs/VIDEO-BIBLE.md` first, sync the design system with `node scripts/brands.mjs sync`, and read the chosen brand's own skill and reference from `.design-system/plugins/<brand>-brand/` (`node scripts/brands.mjs info <brand>` prints the paths). Load product fact files from `products/` only when the source mentions that product.

If you can't run Node/Remotion but can generate video, follow `docs/other-models.md` (fully generative cut). Whatever renders the picture, keep:

- the storyboard format (`docs/storyboard.schema.json`),
- the cadence: caption blocks 0.5 s apart (including after each scene's first line), 1.15 s hold at the end of each scene, 2 s after the conclusion, then the 3.2 s brand outro,
- the brand's identity and voice from the design system, and the copy and claims rules in the video bible,
- silent, caption-led, vertical 9:16 output (1080×1920) with captions clear of the phone safe zones.

Never commit source documents, drafts, renders or brand assets to this repository. Work in the workspace `scripts/new-video.mjs` creates (default `~/explainer-studio`).
