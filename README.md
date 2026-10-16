# pdf-to-explainer

A skill that turns a PDF into a short, silent, kinetic **2.5D paper-cutout explainer video** — vertical 9:16 for TikTok, Reels and Shorts — in **any brand or sub-brand of the [Persistent Labs design system](https://github.com/nonprophet-max/persistent-labs-design-system)**. Built for Claude Code; optional moving backdrops come from **Runway**. Works with other agents and video models too.

Drop in a PDF, say "make a video from this", and get:

- a 5–7 scene storyboard (hook → problem → how it works → proof → conclusion),
- captions that arrive **one sentence at a time**, with highlighted key words,
- a consistent visual vocabulary (coin = payment, speech bubble = prompt, eyes = who can see, fog = privacy layer, glowing box = enclave…),
- the house **cadence**: 0.5 s between caption blocks (including after each scene's first line), 1.15 s hold at the end of every scene, 2 s after the conclusion, then the closing brand animation,
- vertical MP4s at 1080×1920, 60 fps, with captions kept clear of the platform UI.

## Brands

The skill carries no brand of its own. `scripts/brands.mjs sync` pulls the design system and builds a **brand pack** for every brand and sub-brand — palette (dark and light, derived from the brand's tokens), logo, bundled fonts, URL and status:

| Brand id | |
|---|---|
| `persistent-labs` | Parent brand |
| `fireflow` | FireFlow |
| `fireflow/orchestration-engine`, `fireflow/memorytree`, `fireflow/flamechorus` | FireFlow parts (FireFlow identity, part accent and label) |
| `unfazed` | Unfazed.dev |
| `lanni` | Lanni |
| `privateinference` | Private Inference (its own Poppins identity) |
| `galactica` | Galactica (wordmark) |

For voice, product status and approved lines, the skill reads the chosen brand's own skill and reference from the design system. Any brand added there shows up here after the next sync. Pick a brand by naming it ("…as a FireFlow video") or let the skill infer it from the PDF; render the same video as another brand with `--brand`.

## Install (Claude Code)

```bash
git clone https://github.com/nonprophet-max/pdf-to-explainer ~/.claude/skills/pdf-to-explainer
```

Requirements: Node 18+, git, and `pdftotext` (`brew install poppler`). The first video sets up a private workspace at `~/explainer-studio` (Remotion + headless Chrome + the design system, about a minute).

Then, in Claude Code:

> Make an explainer video from ~/Downloads/report.pdf

or `/pdf-to-explainer ~/Downloads/report.pdf`. Add a brand, theme or length in the same sentence if you want ("…for Lanni, light mode, under 30 seconds").

## What's inside

```
SKILL.md                  the workflow (Claude loads this)
AGENTS.md                 same, for other coding agents
docs/
  VIDEO-BIBLE.md          cadence, format, safe zones, look, motion, visual vocabulary, copy and claims
  storyboard.schema.json  storyboard format
  other-models.md         other agents and video models
products/                 sourced product facts per brand (load on demand)
engine/                   Remotion engine
  src/engine/             parts (components), Scene, Video (cadence + timeline), format (safe zones), theme (brand packs)
  src/videos/who-sees-what/   reference video + storyboard
scripts/
  brands.mjs              sync the design system, build/list brand packs
  new-video.mjs           scaffold the private workspace and a video; --update upgrades it (with backup)
  render.mjs              MP4s, or --stills (one frame per scene, safe zones overlaid, caption-wrap warnings); --brand to re-brand
  runway-plates.mjs       per-scene backdrops with Runway gen4.5 (scene lengths from the engine)
  export-prompts.mjs      shot list for any video model or editor (timings and captions from the engine)
```

## Commands

```bash
node scripts/brands.mjs sync                                  # fetch/update the design system, build packs
node scripts/brands.mjs list                                  # brands and sub-brands
node scripts/new-video.mjs my-video --brand fireflow          # scaffold in ~/explainer-studio (run from this repo)

# from here on, the workspace copy:
node ~/explainer-studio/scripts/render.mjs my-video --stills            # one still per scene, safe zones, wrap warnings
node ~/explainer-studio/scripts/render.mjs my-video --themes dark,light # final MP4s
node ~/explainer-studio/scripts/render.mjs my-video --brand lanni       # same video, another brand
RUNWAYML_API_SECRET=... node ~/explainer-studio/scripts/runway-plates.mjs my-video --dry-run
node ~/explainer-studio/scripts/export-prompts.mjs my-video             # shot list for other models
```

The repo's own `engine/` only holds the reference video; run from the repo, the scripts fall back to `~/explainer-studio` for other slugs (`--workspace DIR` picks another workspace).

`new-video.mjs` never upgrades a workspace made by another skill version on its own, because the upgrade replaces the engine under every video already there. It stops and asks for `--update`, which backs up the old engine to `.backups/`, upgrades, and type-checks every video. A video that no longer compiles is skipped at render time, so the others keep rendering.

To try the reference video from this repo: `node scripts/brands.mjs sync && cd engine && npm install && npx remotion studio src/index.ts`.

## Runway

Runway has no Claude connector, so the skill calls the Runway API through its official SDK. Plates are text-free moving backdrops (gen4.5 text-to-video, 720:1280, 2–10 s, looped) tinted with the brand's background and accent; captions, diagrams and brand stay sharp on top. Set `RUNWAYML_API_SECRET` from [dev.runwayml.com](https://dev.runwayml.com); generation costs credits, so use `--dry-run` first.

## Landscape

Vertical is the default and the point. If you ever need 16:9, the engine lays the same scenes out side by side (captions left, stage right): add `formats: ['9x16', '16x9']` to the video and render with `--formats 9x16,16x9`.

## Privacy

Source PDFs, drafts and renders live in the workspace, never in this repo (`.gitignore` blocks PDFs and videos). The skill checks sources for internal/confidential markings and leaves internal-only details out.

## License

Code: MIT. Brand names, logos, fonts and guidance come from the Persistent Labs design system at build time and keep their own terms (marks are proprietary; fonts are OFL). This repo contains no brand assets.
