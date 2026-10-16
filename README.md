# pdf-to-explainer

A skill that turns a PDF into a short, silent, kinetic **2.5D paper-cutout explainer video** — vertical 9:16 for TikTok, Reels and Shorts, dark or light — with a fixed, readable cadence and a persistent brand bible. Built for Claude Code; optional moving backdrops come from **Runway**. Works with other agents and video models too.

Drop in a PDF, say "make a video from this", and get:

- a 6–7 scene storyboard (hook → problem → how it works → proof → conclusion),
- captions that spring in word by word, highlighted where it matters,
- a consistent visual vocabulary (coin = payment, speech bubble = prompt, eyes = who can see, fog = privacy layer, gold box = enclave...),
- **cadence:** 1.15 s hold at the end of every scene, 2 s after the conclusion, then the closing brand animation,
- vertical MP4s at 1080×1920, 60 fps, with captions and key labels kept clear of the platform UI (safe zones checked on every scene).

## Install (Claude Code)

```bash
git clone https://github.com/nonprophet-max/pdf-to-explainer ~/.claude/skills/pdf-to-explainer
```

Requirements: Node 18+, and `pdftotext` (`brew install poppler`). The first video sets up a private workspace at `~/explainer-studio` (Remotion + headless Chrome, ~1 minute).

Then, in Claude Code:

> Make an explainer video from ~/Downloads/report.pdf

That's the whole prompt. Claude reads `SKILL.md`, loads the brand bible and the product files that match the PDF, writes the storyboard, builds and checks every scene in both formats, and renders.

## What's inside

```
SKILL.md                 the workflow (Claude loads this)
AGENTS.md                same, for other coding agents
brand/
  BRAND.md               brand bible: palettes, type, logo, motion, visual vocabulary, voice, claims rules
  tokens.json            the values the engine renders with (dark + light themes, generative style)
  assets/logo.svg
products/
  INDEX.md               which product file to load when
  <product>/SKILL.md     product subskills: approved facts, required qualifiers, motifs, lines that work
engine/                  Remotion engine
  src/engine/            parts (components), Scene (layout), Video (cadence), format (safe zones), cadence.ts
  src/videos/who-sees-what/   reference video + storyboard
scripts/
  new-video.mjs          scaffold a video in the private workspace
  render.mjs             render MP4s (or --stills: one frame per scene) in every format/theme
  runway-plates.mjs      generate per-scene backdrops with Runway gen4.5
  export-prompts.mjs     shot list for any video model or editor
docs/
  storyboard.schema.json
  other-models.md
```

## Commands

```bash
node scripts/new-video.mjs my-video --title "My video"       # scaffold in ~/explainer-studio
node scripts/render.mjs my-video --stills                     # one still per scene, safe zones overlaid
node scripts/render.mjs my-video --themes dark,light          # final MP4s
RUNWAYML_API_SECRET=... node scripts/runway-plates.mjs my-video --dry-run   # preview Runway jobs
node scripts/export-prompts.mjs my-video                      # shot list for other models
```

Run them from the workspace (`~/explainer-studio/scripts/...`) once it exists. To render the reference video from this repo: `cd engine && npm install && npx remotion studio src/index.ts`.

## Runway

Runway has no Claude connector, so the skill calls the Runway API through the official SDK. Plates are text-free moving backdrops (gen4.5 text-to-video, 720:1280 vertical, 2–10 s, looped); the engine keeps captions, diagrams and brand sharp on top. Set `RUNWAYML_API_SECRET` from [dev.runwayml.com](https://dev.runwayml.com). Generation costs credits — use `--dry-run` first.

## Landscape

Vertical is the default and the point. If you ever need 16:9, the engine can lay the same scenes out side by side (captions left, stage right): add `formats: ['9x16', '16x9']` to the video and render with `--formats 9x16,16x9`.

## Other models

The storyboard is model-agnostic. Agents that can run Node use the engine as-is (see `AGENTS.md`). Video models (Runway, Veo, Sora, Kling...) can render a fully generative cut from `export-prompts` output; captions and the brand outro are added in post with the same cadence. See `docs/other-models.md`.

## Another brand

Replace `brand/` (bible, tokens, logo) and `products/`, and change the two font imports in `engine/src/engine/fonts.ts` if the fonts change. The engine, cadence and workflow stay the same.

## Privacy

Source PDFs, drafts and renders live in the workspace, never in this repo (`.gitignore` blocks PDFs and videos). The skill checks sources for internal/confidential markings and leaves internal-only details out of anything it builds.

## License

Code: MIT. The Private Inference name, logo and brand bible are not covered by the MIT license — see `LICENSE`.
