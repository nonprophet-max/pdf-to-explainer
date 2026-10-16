---
name: pdf-to-explainer
description: Turn a PDF (or any document) into a short, silent, kinetic 2.5D paper-cutout explainer video — vertical 9:16 for TikTok, Reels and Shorts — in any brand or sub-brand of the Persistent Labs design system (Persistent Labs, FireFlow and its parts, Unfazed.dev, Lanni, Private Inference, Galactica), dark or light, with optional Runway-generated backgrounds. Use whenever someone hands over a PDF, one-pager, report or doc and asks for a video, explainer, animation, reel, short or clip from it — even with no other instructions.
---

# PDF → explainer video

You turn a document into a 30–45 second vertical explainer a muted viewer understands: one idea per scene, captions that arrive one sentence at a time, a small cast of paper-cutout objects that always mean the same thing, and a fixed cadence. The look and rhythm are this skill's; the **brand** — palette, type, logo, voice, product status — comes from the Persistent Labs design system.

| Path | What it is | When to read |
|---|---|---|
| `docs/VIDEO-BIBLE.md` | Cadence, format, safe zones, look, motion, visual vocabulary, copy and claims rules | **Always**, first |
| `scripts/brands.mjs` | Syncs the design system and builds brand packs; `list` / `info <brand>` | **Always**, to pick the brand |
| `.design-system/plugins/<brand>-brand/…` | The chosen brand's own skill and reference (voice, status, approved lines) | **Always**, for the chosen brand (`brands.mjs info` prints the paths) |
| `products/INDEX.md` | Product fact files per brand, and when to load each | Skim; load only matching files |
| `engine/src/videos/who-sees-what/` | Complete reference video + storyboard | Before writing your first scene |
| `engine/src/engine/parts.tsx` | Components (the visual vocabulary) | When building scenes |
| `docs/storyboard.schema.json` | Storyboard format | When writing `storyboard.json` |
| `docs/other-models.md` | Other agents and video models | Only if not building with the engine |

## Defaults — don't ask, just build

"Make a video from this PDF" is a complete request. Use these unless the person said otherwise, and state them in one line when you deliver:

- **Brand:** the one the person names; else the product the PDF is clearly about (a PDF about Private Inference → `privateinference`); else the parent, `persistent-labs`. Sub-brands are explicit picks (e.g. `fireflow/memorytree`): they keep the product identity with their own accent and label.
- **Format:** vertical 9:16, 1080×1920, 60 fps. Landscape only if asked (see Building scenes).
- **Theme:** dark. Light, or both, on request.
- **Length:** 30–45 s → usually 5–7 content scenes. **Audio:** none. **Plates:** none unless asked.

Ask only if the PDF can't be read, or the brand is genuinely ambiguous between two products. An internal source is not a reason to ask: build the public-safe cut (Sensitivity, below) and say so when you deliver. Ask only when the person explicitly wants internal-only details in the video, or says it is for an internal audience — then confirm who will see it before including them.

## Workflow

1. **Read the source:** `pdftotext -layout <file> -` (install poppler if missing), or Read the PDF. Note page numbers.
2. **Load the rules:** `docs/VIDEO-BIBLE.md`.
3. **Pick the brand:** `node scripts/brands.mjs sync` (fetches or updates the design system), then `node scripts/brands.mjs list` and `info <brand>`. Read the brand's design-system `SKILL.md` and reference (paths printed by `info`) for voice, status, approved lines and do/avoid lists.
4. **Load product facts** from `products/INDEX.md` that match the source and brand.
5. **Check sensitivity** (rules in **Sensitivity**, below): any internal marking makes the whole source internal. Then build only from the allowed facts, list the rest in `source.excluded`, and say what you left out.
6. **Storyboard** (below) → `storyboard.json`. For simple requests don't wait for approval; show the storyboard table with the finished video.
7. **Scaffold:** `node scripts/new-video.mjs <slug> --brand <id> --title "<Title>"` (run from the skill repo). This creates a private workspace at `~/explainer-studio` (engine installed, design system synced) on first use, and `engine/src/videos/<slug>/`. Work there — never put source material in the skill repo.
   - If the workspace was made by another skill version, it **stops** (exit 2) instead of upgrading: an upgrade swaps the engine under every video already there. Tell the person, then either re-run with `--update` (backs up the old engine to `~/explainer-studio/.backups/` and type-checks every video; fix or restore any it reports) or use `--workspace <new dir>` to leave the old videos alone.
   - **From here on, run every script from the workspace copy**: `node ~/explainer-studio/scripts/<script>.mjs <slug>` (steps 9–10, plates, shot lists). The skill repo's own engine only holds the reference video. If you run the repo copy by mistake it falls back to `~/explainer-studio` when it can't find the slug; `--workspace DIR` picks another workspace.
8. **Build** `video.tsx`: one Stage per scene, captions in the scene list. Copy patterns from the reference video.
9. **Check:** `node ~/explainer-studio/scripts/render.mjs <slug> --stills` → the frame 0.3 s before each cut, safe zones overlaid in red, plus a list of caption blocks the browser wrapped badly (one word alone on a line). Look at every still (Claude: Read the PNGs). Fix every wrap warning, overlaps, anything off-stage, and any caption or key label in a red zone. With `--themes light` too if delivering light.
10. **Render:** `node ~/explainer-studio/scripts/render.mjs <slug>` (`--themes dark,light` for both; `--brand <id>` restyles the same video as another brand — identity and outro only, so captions that name a product still need rewriting). Copy finals where the person wants them (Desktop by default).
11. **Deliver:** files, brand used, storyboard table, what you left out and why, claims to double-check.

## Storyboard

### The arc
5–7 scenes in this order. Every video has a hook and a conclusion; the conclusion is last.

| Role | Job | Blocks |
|---|---|---|
| `hook` | One tension a stranger feels in 3 s | 2 |
| `problem` | The two (max three) things at stake | 2–3 |
| `context` | How it usually works, where it goes wrong | 3–4 |
| `how` / `solution` | Our way, step by step on the same stage | 3–4 |
| `proof` | A mechanism, safeguard or number that makes it believable | 2–3 |
| `comparison` | Side by side, ours highlighted | 1–2 |
| `conclusion` | The takeaway, 2–5 words per block | 2 |

Then the engine adds the closing brand animation. Use `outro.note` for status ("Upcoming", "On testnet"); `outro.tagline` only for an approved line.

### Language
The brand's voice (from its design-system reference) comes first. Then VIDEO-BIBLE → Copy: each caption **block** is one sentence or phrase that stands alone, because it gets its own beat; 2–4 blocks, ~6–16 words per scene; 1–3 `*highlighted` words; every claim sourced in `claims`.

**Line length.** A caption line is 960 px wide and fits about **1850 ÷ size** characters (spaces included): ~18 at 100–104 px, ~21 at 88 px, ~23 at 80 px. Longer blocks wrap, and a wrap that leaves one word alone reads badly. Shorten the block, lower its `size`, or break it by hand between phrases with `\n` (`'Your prompt\nstays *encrypted'` — word timing is unchanged). `--stills` measures the real wrap in the brand font and lists every bad one.

### Sensitivity
A source is **internal** if any page says internal, confidential, draft, "not for distribution" or similar, or it shows staging/preview URLs or unannounced plans. Treat the whole document as internal, not just the marked page. Set `source.sensitivity` accordingly.

For an internal source:
- **Allowed facts:** what the loaded product files (`products/`) and the brand's design-system reference already state, plus third-party facts the source cites from public sources (e.g. a public blog about a competitor) — cite those as `public:<where>`. Use the internal PDF only to **choose and order** those facts and to find the story.
- **Always leave out** (and list each in `source.excluded`): environment names (staging, preview), unannounced URLs or domains, test results and their numbers, timings and benchmarks, roadmap dates and versions, open gaps and blockers, partners or wallets not publicly named, people, forks and where code came from, contract/protocol internals the product files don't state (message formats, windows, timeouts, proof systems), and prices or limits.
- **Don't write internal facts into `products/`.** That folder ships in a public repo. If the internal source disagrees with a product file, keep the product file's version in the video and report the conflict to the person instead.
- Deliver with one line: "Built the public-safe cut from an internal source; left out: …".

### Timing — the engine does it
- The engine (`video.tsx`) is the only source of timing and captions: `render.mjs --stills`, `runway-plates.mjs` and `export-prompts.mjs` all read them from the composition. They warn when `storyboard.json` captions or scene ids drift from `video.tsx` — then update the storyboard.
- Caption blocks: first at tick 2; each next block **0.5 s after the previous one has landed** (this includes the gap after the title/first sentence). Give a block an `at` only to make it wait for a visual beat; the engine never starts it earlier than the pause rule allows.
- Scene length = max(`ticks` you set, last block landed + reading time 0.22 s/word, min 1.5 s).
- Then **1.15 s hold** per scene; **2 s hold** after the conclusion; then the 3.2 s brand outro.
- Aim for 30–45 s total; `npx remotion compositions src/index.ts` (in `engine/`) prints each video's length.

## Building scenes

```tsx
// a Stage draws the 9:16 stage; cues[i] = tick at which caption block i starts
const Gateway: React.FC<StageProps> = ({cues}) => {
  const t = useTick();
  const y = interpolate(t, [cues[1], cues[1] + 50], [860, 1350], clamp);
  return (
    <>
      <At x={540} y={1050}><Pop delay={8}><Card label="Gateway" sub="sees ciphertext" /></Pop></At>
      <At x={380} y={990}><Eye closed delay={cues[1] + 20} /></At>
      <At x={540} y={y}><Bubble dark={1} /></At>
    </>
  );
};

const scenes: SceneDef[] = [
  {id: 'gateway', Stage: Gateway, caption: {lines: [{t: 'Your prompt stays *encrypted.'}, {t: 'Only the *enclave can read it.'}]}, stageTop: 780, stageBottom: 1600},
];
```

- **Coordinates are 9:16** (1080×1920). Captions sit on top (`top` 200–300); the stage is roughly y 760–1600; x 80–960.
- **Safe zones:** keep anything readable out of the top 140 px, the right 120 px between y 700–1600, and the bottom 320 px — and **≥ 30 px inside** them, because the camera push-in (×1.045 from the center) grows the stage by the end of each scene: x 920 ends at ~937, x 950 at ~968 (inside the zone). In practice keep readable content within x 80–920. Set `stageTop`/`stageBottom` to the stage's real extent.
- Sync visuals to captions with `cues`; use `useTick`, `useSpr`, `useRamp` — never `useCurrentFrame`.
- `Label` is accent-colored (ours); use `<Label tone="neutral">` for third parties and plain notes.
- Brand comes from the pack: use `useTheme()` colors (`accent`, `text`, `grey`, `success`…) and `C.fonts`; never hard-code brand colors, fonts or logos.
- A caption that changes halfway: pass an array of blocks with `show: [fromTick, toTick]` and wrap each half's stage in `<Window from to>`.
- Landscape (only on request): add `formats: ['9x16', '16x9']` to the VideoDef and render with `--formats 9x16,16x9`; captions move left and the stage region scales into the right.

## Runway plates (optional)

Text-free moving backdrops behind scenes; the engine keeps captions, diagrams and brand sharp on top.

1. Add `"plate": {"prompt": "..."}` to scenes that benefit (usually hook and solution): mood and shapes only. The brand's background and accent are appended automatically.
2. `node ~/explainer-studio/scripts/runway-plates.mjs <slug> --dry-run` (shows prompts and seconds — generation costs credits), then without `--dry-run` with `RUNWAYML_API_SECRET` set. Runway `gen4.5` text-to-video, 720:1280, one clip per scene (2–10 s, looped).
3. It writes `public/plates/<slug>/` and `plates.json`; re-render.

## Done checklist
- [ ] Brand chosen and stated; its design-system voice, status and approved lines respected
- [ ] Caption blocks stand alone; no wrap warnings from `--stills`; 1–3 highlights per scene
- [ ] Every claim traced to a page, product file or public source; qualifiers and product status kept
- [ ] Internal source: only allowed facts used; exclusions listed; nothing written into `products/`
- [ ] Stills checked with safe zones in each delivered theme
- [ ] 30–45 s; cadence left to the engine
- [ ] Delivered: files + brand + storyboard table + exclusions + claims to double-check
