---
name: pdf-to-explainer
description: Turn a PDF (or any document) into a short, silent, kinetic 2.5D paper-cutout explainer video in the Private Inference brand, vertical 9:16 for TikTok, Reels and Shorts, dark or light, with optional Runway-generated background plates. Use whenever someone hands over a PDF, one-pager, report or doc and asks for a video, explainer, animation, reel, short or clip from it — even with no other instructions.
---

# PDF → explainer video

You turn a document into a 30–45 second explainer that a muted viewer understands: one idea per scene, captions that spring in word by word, a small cast of paper-cutout objects that mean the same thing every time, and a fixed cadence.

This skill is self-contained:

| Path | What it is | When to read |
|---|---|---|
| `brand/BRAND.md` | Brand bible: palettes, type, logo, motion, visual vocabulary, voice, claims discipline | **Always**, before the storyboard |
| `brand/tokens.json` | Machine values the engine uses | When changing look |
| `products/INDEX.md` | Product subskills and when to load each | **Always** skim; then load only the matching `products/<name>/SKILL.md` |
| `engine/` | Remotion engine: `src/engine/parts.tsx` (components), `Scene.tsx`, `Video.tsx`, `cadence.ts` | When building scenes |
| `engine/src/videos/who-sees-what/` | Complete reference video + its storyboard | Before writing your first scene |
| `docs/storyboard.schema.json` | Storyboard format | When writing `storyboard.json` |
| `docs/other-models.md` | Using this with other video models | Only if not building with the engine |
| `scripts/` | `new-video`, `render`, `runway-plates`, `export-prompts` | Throughout |

## Defaults — don't ask, just build

A bare "make a video from this PDF" is a complete request. Use these unless the person said otherwise, and state them in one line when you deliver:

- **Format:** vertical 9:16 (1080×1920, 60 fps) for TikTok, Reels and Shorts, with phone safe zones respected. 16:9 only if someone explicitly asks for landscape (add `formats: ['9x16', '16x9']` to the VideoDef and `--formats 9x16,16x9` when rendering).
- **Theme:** the brand default (`tokens.json → defaultTheme`, dark). Light on request; both are one flag.
- **Length:** 30–45 s including holds and outro → usually 5–7 content scenes.
- **Audio:** none. Silent, caption-led, readable on mute.
- **Plates:** none, unless the person asks for Runway / generated visuals.

Only stop to ask if the PDF can't be read, or it is marked internal/confidential **and** the person wants it public (see Sensitivity).

## Workflow

1. **Read the source.** `pdftotext -layout <file> -` (install poppler with `brew install poppler` if missing). Claude can also Read the PDF directly. Note page numbers for claims.
2. **Load context.** Read `brand/BRAND.md`. Match the source against `products/INDEX.md` and read only the product files that apply. Product files carry approved facts, required qualifiers (beta, testnet...) and lines that already work.
3. **Check sensitivity.** Look for "internal", "confidential", "draft", "not for distribution", staging URLs, unannounced dates or numbers. If present: build only from facts that are public (in a product file or clearly public in the source), list everything else under `source.excluded`, and tell the person what you left out.
4. **Storyboard** (below). Write `storyboard.json`. For simple requests don't wait for approval — show the storyboard table alongside the finished video.
5. **Scaffold:** `node scripts/new-video.mjs <slug> --title "<Title>"`. This creates (once) a private workspace at `~/explainer-studio` with the engine installed, then `engine/src/videos/<slug>/` with `video.tsx`, `storyboard.json`, `plates.json`. Work there, not in this repo: source material must never land in the public skill.
6. **Build** one React component per scene in `video.tsx` from `parts.tsx` components. Copy patterns from the reference video. Set each scene's `ticks = baseSeconds × 30`.
7. **Check layouts:** `node scripts/render.mjs <slug> --stills --themes dark` renders the frame just before each cut, with the phone safe zones overlaid in red. Look at every one (Claude: Read the PNGs). Fix overlaps, orphaned caption words, things off-stage, and any caption or key label inside a red zone.
8. **Render:** `node scripts/render.mjs <slug>` → `engine/out/<slug>-<format>-<theme>.mp4`. Add `--themes dark,light` for both. Copy finals where the person wants them (Desktop by default).
9. **Deliver:** the files, the storyboard table, what you left out and why, and any claim the person should double-check (comparisons especially).

## Storyboard

### The arc
Pick 5–7 scenes from this order. Every video has a hook and a conclusion; the conclusion is always last.

| Role | Job | Typical length |
|---|---|---|
| `hook` | One question or tension a stranger feels in 3 s | 3.5–4 s |
| `problem` | Name the two (max three) things at stake | 4–5 s |
| `context` | Show how it usually works and where it goes wrong | 5–6 s |
| `how` / `solution` | Show our way, step by step on the same stage | 6–8 s |
| `proof` | A mechanism detail, safeguard or number that makes it believable | 5–6 s |
| `comparison` | Side by side, ours highlighted (use landscape facts) | 4–5 s |
| `conclusion` | The takeaway in 2–5 words per line | 3.5–4.5 s |

Then the engine adds the closing brand animation. Use `outro.note` for a status qualifier ("Sessions now on Aztec testnet").

### Language
Follow BRAND.md → Voice. In short: 2–4 caption lines per scene, ~6–16 words, plain words, "you"/"we", fragments welcome, 1–3 `*highlighted` words per scene, digits for numbers, no hype, no exclamation marks. Each caption claim must be in `claims` with a page reference. Keep source qualifiers.

### Timing
Times inside scenes are **ticks** (30 per second, at any fps).
- Caption lines: first at tick 2–4; later lines start when the previous visual beat lands (≈ every 25–40 ticks). Words land 3 ticks apart.
- Base length: `lastWordLands + max(1.5 s, 0.22 s × captionWords)`, and never before the last animation settles. `cadence.ts → baseTicksFor()` computes it; `captionLandsAt()` in parts gives `lastWordLands`.
- **Cadence (enforced by the engine — don't add your own):** each content scene + **1.15 s** hold → next scene; the conclusion + **2 s** hold → closing brand animation (3.2 s).
- Total = Σ base + 1.15 × (scenes − 1) + 2 + 3.2. Aim for 30–45 s.

### Visuals
Use the visual vocabulary from BRAND.md so meaning stays consistent (coin = payment, bubble = prompt, open eye = can see, closed eye = can't, fog = privacy layer, gold box = enclave...). One stage per scene, objects moving along lanes; ours is gold. Reuse the same positions across scenes when a story continues (payment lane left, prompt lane right).

## Building scenes

```tsx
const Example: React.FC<{dur: number}> = ({dur}) => {
  const t = useTick();                                   // ticks
  const y = interpolate(t, [30, 90], [860, 1500], clamp);
  return (
    <Scene dur={dur} caption={{top: 220, size: 88, lines: [{t: 'Your prompt stays *encrypted', at: 2}, {t: 'until the *enclave.', at: 40}]}}>
      <At x={540} y={1130}><Pop delay={10}><Card label="Gateway" sub="sees ciphertext" /></Pop></At>
      <At x={720} y={1070}><Eye closed delay={50} /></At>
      <At x={540} y={y}><Bubble dark={1} /></At>
    </Scene>
  );
};
```

- **Coordinates are 9:16** (1080 wide, 1920 tall). Captions sit at the top (`top` 200–300); the stage is roughly y 760–1600.
- **Phone safe zones** (`format.ts → SAFE_ZONES`): the status bar (y < 140), the action-button column (x > 960, y 700–1600) and the caption/nav band (y > 1600) are covered by TikTok/Reels UI. Captions, labels, cards and anything the viewer must read stay out of them; lanes, eyes and background shapes may pass through.
- Landscape (only on request): with `formats` including `'16x9'`, captions move to a left column and the stage region `stageTop..stageBottom` is scaled into the right side; set those to the stage's real extent.
- A caption that changes halfway: pass an array of blocks with `show: [fromTick, toTick]`, and wrap each half's stage in `<Window from to>`.
- Eyes: always `delay` + `seed`; give `look` toward what they watch (target minus eye position).
- Never use `useCurrentFrame` directly in scenes; use `useTick`, `useSpr`, `useRamp`.

## Runway plates (optional, Claude + Runway)

Generated moving backdrops behind scenes, composited under the engine's captions and diagrams, so text and brand stay sharp.

1. Add `"plate": {"prompt": "..."}` to the scenes that benefit (usually hook and solution). Describe mood and shapes only — no text, logos or faces. Brand style and palette are appended from `tokens.json → generative`.
2. `node scripts/runway-plates.mjs <slug> --dry-run` to see prompts and seconds (costs money), then run without `--dry-run` with `RUNWAYML_API_SECRET` set. Uses Runway `gen4.5` text-to-video at 720:1280 / 1280:720, one clip per scene and format (2–10 s, looped to the scene length).
3. It downloads to `engine/public/plates/<slug>/` and writes `plates.json`; re-render. Plates are tinted by `plateOpacity` so captions stay readable.

For a fully generative cut on another model, see `docs/other-models.md` and `scripts/export-prompts.mjs`.

## Done checklist
- [ ] Every scene readable on mute; no orphaned single words on a caption line
- [ ] Highlights on the words that matter, max 3 per scene
- [ ] Every claim traced to a page; qualifiers kept (beta, testnet, private mode, dates)
- [ ] Nothing internal from a marked source; exclusions listed
- [ ] Stills checked with safe zones; no caption or key label under platform UI; nothing clipped or overlapping
- [ ] Total 30–45 s; holds come from the engine, not from padding inside scenes
- [ ] Delivered: files + storyboard table + exclusions + claims to double-check
