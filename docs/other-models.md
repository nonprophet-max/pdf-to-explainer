# Using this skill with other models

The skill has three layers. Any capable model can use all of them; models with native video generation can swap the middle one.

1. **Storyboard** — model-agnostic (`storyboard.json`, schema in `storyboard.schema.json`). Any LLM can write it by following `SKILL.md`, `docs/VIDEO-BIBLE.md` and the chosen brand's design-system skill.
2. **Picture** — either
   - **the engine** (recommended): deterministic React/Remotion scenes. Needs a model that can write TypeScript and run shell commands; or
   - **a video model** (Runway, Veo, Sora, Kling, Seedance, Wan...): generate one clip per scene from the shot list.
3. **Cadence and finishing** — caption blocks 0.5 s apart, 1.15 s hold per scene, 2 s after the conclusion, 3.2 s brand outro, kinetic captions, silent.

## Engine with generated plates (best of both)
Keep the engine for captions, diagrams and brand, and generate only moving backdrops:
`scripts/runway-plates.mjs` does this with Runway. For another provider, generate a clip per scene from `export-prompts` output, save it as `engine/public/plates/<slug>/<scene>-<format>.mp4`, and add `"<scene>": "plates/<slug>/<scene>-{format}.mp4"` to `plates.json`.

## Fully generative cut
1. Write `storyboard.json` as usual.
2. `node scripts/export-prompts.mjs <slug>` → `<slug>-shots.md` / `.json` with exact start/end times (holds included), captions, highlights, visual notes and a prompt per shot.
3. Generate each shot **without text** (video models still misspell). Clip length = shot length; if the model caps duration, generate the longest it allows and slow-hold the last frame for the hold.
4. Assemble in order, burn in captions in post (word-by-word, one block at a time with 0.5 s between blocks, highlighted words in the brand accent, brand display font — the shot list names it), add the brand outro (logo from the design system's `plugins/<brand>-brand/skills/<brand>-brand/assets/`, name, URL, "by Persistent Labs").
5. Keep the cadence: nothing new appears during a scene's last 1.15 s, 2 s after the conclusion.

## Model notes
- **Claude:** best on the engine path — it reads the PDF, writes the storyboard and scenes, checks stills visually, and drives Runway through `runway-plates.mjs`.
- **Runway (gen4.5):** text-to-video at 720:1280 (vertical; 1280:720 exists for landscape), 2–10 s per clip, prompt ≤ 1000 characters. `gen4_turbo` is cheaper but image-to-video only (render a still with `scripts/render.mjs --stills` and use it as the first frame).
- **Other agents (Codex, Gemini CLI...):** point them at `AGENTS.md`.
