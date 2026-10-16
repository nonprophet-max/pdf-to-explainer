---
name: pi-private-mode
description: Facts, qualifiers and visuals for Private Inference's private mode (prompts encrypted end to end into an attested enclave). Load when a source mentions private mode, enclaves, TEEs, attestation or encrypted prompts.
---

# Private mode (enclave inference)

## What it is
PI's most private way to run a prompt: your side checks the enclave and encrypts the prompt; everything in between carries ciphertext; the model reads plaintext only inside an attested enclave.

## Facts you may state
- Your browser or SDK checks the enclave (attestation), then encrypts the prompt.
- The CDN, PI and the supplier only ever see ciphertext.
- Plaintext exists only inside the enclave.
- The enclave signs the reply and its token count (proof of what ran).
- Works from the browser or the API; nothing to install.

## Keep these qualifiers
- "private mode" — the default path is not end-to-end encrypted.
- "beta" when the source says so; private mode on open models where the source says "open models".
- In private mode the PI ledger still links requests to one account, unless paid through a vault session. Never imply unlinkability.

## Don't say
- "Nobody can see anything" / "100% private" / "untraceable".
- "Military-grade". "Zero-knowledge" (it's attestation + encryption, not ZK).

## Motifs
Bubble → padlock snaps on (bubble turns dark, gold gibberish) → passes cards labelled "sees ciphertext" with closed eyes → unlocks inside the glowing `Enclave`. Caption the box "secure enclave" (plain) or "attested enclave" (precise).

## Lines that work
- "Your prompt stays *encrypted / until it's inside a *secure *enclave."
- "Only the *enclave reads your prompt."
- "Payer *hidden. Prompt *hidden." (with aztec-payments)

## Sources
PI, "Who sees what when you pay for AI", 7 October 2026 (public).
