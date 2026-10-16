---
name: pi-landscape
description: How other private-AI products compare with Private Inference (zkAPI, Venice, OpenRouter, AntSeed), each in its most private mode, as of October 2026. Load for comparison scenes or when a source names these products.
---

# Competitive landscape (October 2026)

Each product in its most private mode, as described in its public docs and code. Re-check before reusing after October 2026.

| Product | Who reads the prompt | Who knows who paid | If the operator disappears | Pay with |
|---|---|---|---|---|
| Private Inference (private mode) | Only the enclave | Nobody on chain (Aztec hides payer and amount); vault session needs no account | Vault session: unspent funds return via the contract (testnet) | USDC on Base, cUSDC on Aztec, ZEC |
| zkAPI (Ethereum Foundation) | OpenRouter and the model host; never zkAPI | Deposit public on Ethereum; usage not tied to it | Exit on chain after a challenge period | ETH deposit on Ethereum |
| Venice (E2EE mode, Pro) | Only the enclave in E2EE mode; otherwise Venice and its GPU hosts | Venice, by account or wallet; USDC top-ups public | Prepaid credits held by Venice | Card, USDC on Base or Solana, DIEM |
| OpenRouter (confidential Phala endpoint) | OpenRouter; the host too unless confidential endpoint | OpenRouter, by account; crypto top-ups public | Prepaid credits held by OpenRouter | Card, AliPay, USDC |
| AntSeed (verified TDX seller) | The seller, unless a verified TDX seller | The seller, by wallet; deposits and settlements public on Base | Close and recover after a 15-minute grace period | USDC on Base |

## Grid marks that are fair (payer hidden / prompt hidden)
PI ✓ ✓ · zkAPI ✓ (usage not tied to deposit) ✗ · Venice ✗ ✓ · OpenRouter ✗ ✗ · AntSeed ✗ ~ (depends on seller).

## Rules
- Always label the mode ("E2EE mode", "confidential endpoint") under the name.
- Footnote: "Each product in its most private mode, per public docs and code, October 2026."
- Use "~" when it depends. Don't add products or columns not in a source.
- Name competitors only for comparison, never to disparage.

## Sources
PI, "Who sees what when you pay for AI", 7 October 2026 (public), pages 1–2.
