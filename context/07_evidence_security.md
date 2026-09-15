# PART 7 — EVIDENCE + SECURITY

## Provenance

Every relationship and lead should point back to source records.

## Hashing

For an evidence bundle:

1. create canonical JSON
2. serialize deterministically
3. calculate SHA-256
4. store hash with timestamp and lead/review ID

## Audit

Record:

- event
- lead_id
- action
- timestamp
- hash
- reviewer when applicable

## Security principles

Prototype:
- no real PII
- local data
- no secrets in repository

Future:
- RBAC
- encryption
- secure deployment
- key management
- immutable audit storage

Blockchain can later anchor hashes.
It is not the graph database.
