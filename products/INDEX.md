# Product subskills

Load a product file only when the source PDF (or the request) touches that product. Each one lists the facts you may state, the qualifiers you must keep, the motifs that show it, and lines that already work.

| Product | Load when the source mentions | File |
|---|---|---|
| Private mode (enclave inference) | private mode, enclave, TEE, attestation, encrypted prompt, ciphertext | `private-mode/SKILL.md` |
| Private payments on Aztec | Aztec, x402, cUSDC, private payment, payer hidden, ZEC | `aztec-payments/SKILL.md` |
| Vault sessions | vault, session, no account, refund, unspent funds, testnet | `vault-sessions/SKILL.md` |
| API and models | API, OpenAI-compatible, SDK, models, one wallet | `api/SKILL.md` |
| Competitive landscape | zkAPI, Venice, OpenRouter, AntSeed, comparison, side by side | `landscape/SKILL.md` |

Facts here are as of **October 2026**, from PI's public material. When a source PDF is newer and disagrees, the PDF wins — and update the product file.

To add a product: copy any folder, keep the same headings (What it is / Facts you may state / Keep these qualifiers / Don't say / Motifs / Lines that work / Sources), and add a row above.
