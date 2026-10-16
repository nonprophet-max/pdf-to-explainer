# Product fact files

Brand identity (palette, type, logo, voice, status) comes from the Persistent Labs design system. These files add what the design system deliberately doesn't hold: **sourced product facts** for videos — what you may state, qualifiers you must keep, motifs that show it, and lines that already work.

Load one only when the source PDF (or the request) touches that product. Folders are grouped by brand id (`scripts/brands.mjs list`).

| Brand | Product | Load when the source mentions | File |
|---|---|---|---|
| privateinference | Private mode (enclave inference) | private mode, enclave, TEE, attestation, encrypted prompt, ciphertext | `privateinference/private-mode/SKILL.md` |
| privateinference | Private payments on Aztec | Aztec, x402, cUSDC, private payment, payer hidden, ZEC | `privateinference/aztec-payments/SKILL.md` |
| privateinference | Vault sessions | vault, session, no account, refund, unspent funds, testnet | `privateinference/vault-sessions/SKILL.md` |
| privateinference | Chat and API | API, OpenAI-compatible, SDK, models, one wallet | `privateinference/api/SKILL.md` |
| privateinference | Competitive landscape | zkAPI, Venice, OpenRouter, AntSeed, comparison | `privateinference/landscape/SKILL.md` |

No fact files exist yet for Persistent Labs, FireFlow, Unfazed.dev, Lanni or Galactica: build only from the source PDF and the brand's design-system reference, and keep claims to what they state.

Facts are as of **October 2026**. When a source PDF is newer and disagrees, the PDF wins — update the file. Product **status** (live, upcoming) always comes from the design system.

To add a product: create `products/<brand>/<product>/SKILL.md` with the same headings (What it is / Facts you may state / Keep these qualifiers / Don't say / Motifs / Lines that work / Sources) and add a row above.
