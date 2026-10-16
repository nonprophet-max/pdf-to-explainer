---
name: brand-bible
description: Private Inference brand bible for explainer videos — identity, palettes (dark and light), type, logo, motion language, visual vocabulary, copy voice and claims discipline. Always loaded by the pdf-to-explainer skill.
---

# Private Inference — brand bible

The single source of truth for how PI explainers look, move and read. `tokens.json` holds the machine values the engine uses; this file explains them. Product facts live in `products/`, not here.

## Identity

| | |
|---|---|
| Name | Private Inference (short: PI) |
| URL | privateinference.gg |
| Tagline | Access AI privately. |
| Secondary line | One wallet, every model. |
| Logo | `assets/logo.svg`: warm gold disc (`#FBD78E`) with a dark four-point star cut through it |

Logo rules: show it on the closing animation and as the small top-left watermark (48 px, grey label "Private Inference"). The watermark sits in the status-bar strip on purpose: it's decorative, and captions own the space below it. Don't recolor, outline, stretch or put it on a busy plate. Minimum size 48 px.

## Palettes

Dark is the default. Light follows the site's light theme. Both are full themes in `tokens.json`.

| Role | Dark | Light |
|---|---|---|
| Background | `#1e1e1e` charcoal | `#F5F3EE` warm off-white |
| Cards / paper | `#303030` | `#FFFFFF` |
| Main text | `#F4EFE4` cream | `#1A1A1A` |
| Secondary text | `#BFBFBF` | `#7F7F7F` |
| Accent fill (coin, pills, highlights) | `#FBD78E` gold | `#FBD78E` gold |
| Accent text (highlighted words) | `#FBD78E` | `#D49A2A` (darker for contrast) |
| Lines, lanes | `#444444` | `#D6D1C6` |
| Negative mark (✗) | `#E8826F` | `#D9604A` |

Gold is the only accent. Use it for the one or two words that carry each caption, for the thing that is ours (PI's row, PI's card, the enclave), and for payment. Never use more than one extra hue.

## Type

- **Display: Poppins.** Captions 500 weight, tight tracking (-1). Brand name and tagline in the outro 300 weight.
- **Body: Inter.** Card labels 600, sub-labels 500, footnotes 400.
- Caption sizes (1080×1920): hook and conclusion 100–104 px, explanatory scenes 78–92 px. Never below 72 px — these are watched on phones.

## Look: 2.5D paper cutout

- Flat paper shapes with a hard 5 px edge shadow and a soft long shadow (dark) or a warm faint shadow (light).
- Slow camera push-in (×1.045) with a slight tilt per scene; background rays and two large soft discs drift slower than the foreground, which gives depth.
- A fine paper grain over everything.
- Calm, roomy layouts: one idea per scene, generous empty space.
- **Vertical, phone-first.** Videos are 9:16 for TikTok, Reels and Shorts. Keep captions and anything that must be read out of the platform UI: the top 140 px, the right 120 px between y 700 and 1600, and the bottom 320 px. Decoration may pass through.

## Motion

- Things **pop** in on springs (slight overshoot, small rotation) and words spring in one by one, 3 ticks apart.
- Eyes **open with a lid**, never pop. They blink softly on their own schedules and glide their gaze toward what they're watching.
- Travel is linear along dashed lanes; arrivals settle, they don't bounce.
- Cuts are quick 7-tick crossfades with a slight push.
- **Cadence:** every content scene holds **1.15 s** after its animation settles; the last content scene (the conclusion) holds **2 s**; then the closing brand animation (logo spin-in, name, tagline, URL pill, optional status note, 3.2 s). The engine enforces this; don't fake holds inside scenes.
- No music, no sound effects. Videos are silent and readable on mute.

## Visual vocabulary

Use these consistently so the audience learns them. Components are in `engine/src/engine/parts.tsx`.

| Meaning | Motif | Component |
|---|---|---|
| Payment / money | gold coin with $ | `Coin` |
| Anonymous payer | mask dropping onto the coin | `Mask` |
| A prompt / request | cream speech bubble with text lines | `Bubble` |
| Encrypted data | bubble turns dark with gold gibberish + padlock | `Bubble dark`, `Lock` |
| Someone who can see | open eye that watches the thing | `Eye look=` |
| Someone who can't see | closed eye (curved line) | `Eye closed` |
| A party or a hop | paper card with label and short "what it sees" | `Card` |
| Ours / trusted | gold-topped card (`accent`), gold row | `Card accent` |
| Privacy layer (Aztec) | drifting paper fog that swallows the coin | `Fog` |
| Secure enclave (TEE) | glowing gold-bordered box where the lock opens | `Enclave` |
| Deposit / contract | safe door with three-spoke wheel | `Vault` |
| API key / credential | gold key | `Key` |
| Signed receipt / voucher | gold ticket with signature squiggle | `Voucher` |
| Proof | card with a check | `Proof` |
| Time window | draining gold ring with minutes | `Timer` |
| Path | dashed lane | `Lane` |
| The user | round head + body | `User` |
| Comparison | rows with ✓ ✗ ~ marks, ours highlighted | `ComparisonGrid` |

## Voice and copy

- **Plain and confident.** Short sentences and fragments. Talk to "you". Say "we" for PI.
- **One idea per scene**, 2–4 caption lines, about 6–16 words. Hook and conclusion are shortest.
- **Highlight 1–3 words per scene** with `*` — the words a muted viewer must catch.
- **Concrete over abstract:** "Aztec hides who paid" beats "enhanced payment confidentiality".
- **Parallel structure** where it helps: "Payer hidden. Prompt hidden."
- Never: hype ("revolutionary", "military-grade", "100% anonymous"), jargon without a picture (say "secure enclave", show the box), exclamation marks, emojis, questions in more than one scene.
- Digits for numbers ("15-minute", "$0.05").

## Claims discipline

- Every factual caption must trace to the source PDF or a product file. Record it in the storyboard `claims`.
- Keep qualifiers the source has: **beta**, **testnet**, **in private mode**, **open models**, dates. Put them in a footnote or the outro note if they don't fit the caption.
- Never say "nobody can link you" when the source says an account still ties requests together.
- Comparisons: compare each product in its most private mode, cite "per public docs, <month year>", and use "~" (depends) instead of forcing ✓/✗.
- If the source is marked internal or confidential, leave internal-only details out and list them in the storyboard `source.excluded`.

## Generative plates (Runway and other models)

Optional moving backdrops behind scenes. Prompt style lives in `tokens.json → generative`. Plates never contain text, logos, UI or faces; captions, brand and diagrams always come from the engine on top.
