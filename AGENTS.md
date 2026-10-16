# Agent instructions

This repository is a skill for turning a PDF into a short branded explainer video. It is written for Claude (see `SKILL.md`, which Claude Code loads as a skill), but the instructions are plain Markdown and work for any coding agent.

**Follow `SKILL.md` exactly** — it is the workflow. Read `brand/BRAND.md` before writing anything, and load product files from `products/` only when the source mentions that product.

If you can't run Node/Remotion but can generate video, follow `docs/other-models.md` (fully generative cut). Whatever renders the picture, keep:

- the storyboard format (`docs/storyboard.schema.json`),
- the cadence: 1.15 s hold at the end of each scene, 2 s after the conclusion, then the 3.2 s brand outro,
- the copy rules and claims discipline in `brand/BRAND.md`,
- silent, caption-led, vertical 9:16 output (1080×1920) with captions clear of the phone safe zones.

Never commit source documents, drafts or renders to this repository. Work in the workspace `scripts/new-video.mjs` creates (default `~/explainer-studio`).
