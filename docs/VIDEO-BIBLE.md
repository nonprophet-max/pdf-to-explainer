---
name: video-bible
description: Brand-neutral rules for pdf-to-explainer videos — look, motion, caption cadence, visual vocabulary, copy and claims. Brand identity (palette, type, logo, voice) comes from the Persistent Labs design system. Always loaded by the pdf-to-explainer skill.
---

# Video bible

How every explainer looks, moves and reads, whatever the brand. **Identity is not here**: palette, typography, logo, voice and product status come from the selected brand in the Persistent Labs design system (see `scripts/brands.mjs` and SKILL.md). Where the two disagree, the brand wins on identity and voice; this bible wins on cadence and format.

## Format

- **Vertical 9:16, 1080×1920, 60 fps**, for TikTok, Reels and Shorts. Silent, readable on mute.
- **Phone safe zones:** platform UI covers the top 140 px, the right 120 px between y 700 and 1600, and the bottom 320 px. Captions, labels and anything that must be read stay out of them; decoration may pass through. The watermark sits in the status-bar strip on purpose.
- 30–45 s including holds and outro.

## Cadence (the engine enforces it)

| Moment | Rule |
|---|---|
| Caption blocks | Each block (one sentence or phrase) appears word by word, 0.1 s between words. |
| Between blocks | **0.5 s pause** after a block has fully landed before the next starts — including between a scene's title/first sentence and what follows. |
| End of each scene | **1.15 s hold**: nothing new appears, then a quick crossfade. |
| After the conclusion | **2 s hold** before the closing brand animation. |
| Closing brand animation | 3.2 s: logo, name or wordmark, sub-brand label, approved line/URL if any, quiet endorsement. |

Scene length = the later of (last animation settles) and (last caption block lands + reading time: 0.22 s per word, at least 1.5 s), then the hold. Don't pad scenes or fake holds.

## Look: 2.5D paper cutout

- Flat paper shapes with a hard edge shadow and a soft long shadow; a fine paper grain over everything.
- Slow camera push-in (×1.045) with a slight tilt per scene; background rays and two large soft discs drift slower than the foreground for depth.
- Calm, roomy layouts: one idea per scene.
- **One accent:** the brand's. Use it for the 1–3 highlighted words per scene, for what is "ours" (our card, our row, the enclave), and for payment. State colors (✓ success, ✗ danger) come from the design system's semantic colors, never from the accent.
- Highlighted words use the accent as text color, or — when the accent is too light to read as text on the background (e.g. Pi gold on light) — as a marker behind the word. The brand pack decides.

## Motion

- Objects **pop** in on springs (slight overshoot, small rotation). Words spring in one by one.
- Eyes **open with a lid**, never pop; they blink softly on their own schedules and glide their gaze toward what they watch.
- Travel is linear along dashed lanes; arrivals settle, they don't bounce.
- Where a brand's motion guidance speaks to this (e.g. "no perpetual running animation"), follow it.

## Visual vocabulary

Use these consistently so the audience learns them. Components live in `engine/src/engine/parts.tsx`.

| Meaning | Motif | Component |
|---|---|---|
| Payment / money | accent coin with $ | `Coin` |
| Anonymous payer | mask dropping onto the coin | `Mask` |
| A prompt / request / message | speech bubble with text lines | `Bubble` |
| Encrypted data | bubble turns dark with gibberish + padlock | `Bubble dark`, `Lock` |
| Someone who can see | open eye watching the thing | `Eye look=` |
| Someone who can't see | closed eye | `Eye closed` |
| A party or a hop | paper card with label and "what it sees" | `Card` |
| Ours / trusted | accent-topped card, highlighted row | `Card accent` |
| Privacy layer | drifting paper fog that swallows things | `Fog` |
| Secure enclave (TEE) | glowing accent-bordered box | `Enclave` |
| Deposit / contract | safe door with wheel | `Vault` |
| Credential / API key | key | `Key` |
| Signed receipt / voucher | ticket with signature | `Voucher` |
| Proof | card with a check | `Proof` |
| Time window | draining ring with minutes | `Timer` |
| Path | dashed lane | `Lane` |
| The user | round head + body | `User` |
| Device | laptop with the brand mark | `Laptop` |
| Comparison | rows with ✓ ✗ ~ | `ComparisonGrid` |
| The brand | logo from the design system | `Logo` |

## Copy

The brand's voice comes first (read its design-system reference). Within it:

- **One idea per scene**, 2–4 caption blocks, about 6–16 words. Hook and conclusion are the shortest.
- **Each block is one sentence or phrase** — it gets its own 0.5 s beat, so write blocks that stand alone.
- **Highlight 1–3 words per scene** with `*`: the words a muted viewer must catch.
- Concrete over abstract; "you" for the viewer, "we" for the brand; fragments welcome; digits for numbers.
- Never: hype ("revolutionary", "military-grade", "100% anonymous"), exclamation marks, emojis, jargon without a picture.

## Claims

- Every factual caption traces to the source PDF or a product file; record it in the storyboard `claims` with a page.
- Keep source qualifiers (beta, testnet, in private mode, open models, dates) — in a footnote or the outro note if they don't fit.
- **The design system's product status wins:** if it marks a product upcoming, don't present it as live. Add the status to the outro note.
- Use only taglines the design system marks as approved. "Proposed" headlines and placeholder copy are not approved.
- Design does not establish capabilities: don't imply privacy, security, availability or compliance guarantees the source doesn't state.
- Comparisons: each product in its most private mode, cite "per public docs, <month year>", "~" when it depends.
- Sources marked internal/confidential: leave internal-only details out and list them in `source.excluded`.
