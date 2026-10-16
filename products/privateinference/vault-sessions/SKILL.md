---
name: pi-vault-sessions
description: Facts, qualifiers and visuals for Private Inference vault sessions on Aztec (one session, no account, unspent funds returned). Load when a source mentions vaults, sessions, refunds or no-account use.
---

# Vault sessions on Aztec

## What it is
Instead of an account, each chat session is paid from its own small vault on Aztec. The session isn't tied to an account, and money you don't spend comes back.

## Facts you may state
- One session, no account.
- Payer and amount stay hidden (paid on Aztec).
- Unspent funds come back through the contract.
- Combines with private mode, so the prompt is hidden too.
- Next: vault sessions on mainnet, then hiding which session a request draws from, so not even the PI ledger can tie two requests together.

## Keep these qualifiers
- **Status:** the Persistent Labs design system lists Private Inference as an **upcoming** product. Don't present it as live; put the status in the outro note.
- **Testnet.** Say "on Aztec testnet" or put "Sessions on Aztec testnet" in the outro note. Never imply mainnet.
- "Next" items are plans, not features: phrase as "next", "coming", never present tense.

## Don't say
- "Live" or "available now" without "testnet".
- Internal implementation details (contract internals, timings, staging, fees) unless the source PDF is public and states them.

## Motifs
`Vault` (safe door) inside `Fog`; coin slides in and disappears; at close the vault wheel spins and a coin returns to the `User` ("the rest, back to you").

## Lines that work
- "One session. *No *account."
- "What you don't spend *comes *back."

## Sources
PI, "Who sees what when you pay for AI", 7 October 2026 (public).
