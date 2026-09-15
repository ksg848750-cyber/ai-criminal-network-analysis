# ARCHITECTURAL DECISIONS

## Decision 1 — Knowledge Graph is the core

Neo4j is used because the central problem is relationship analysis.

## Decision 2 — Baseline before GNN

A transparent scoring system is easier to build, explain and debug within the hackathon timeline.

## Decision 3 — Human verification

AI output is a potential lead, not a criminality decision.

## Decision 4 — Synthetic data

The demo uses synthetic/anonymized data to avoid sensitive information.

## Decision 5 — Blockchain is supporting infrastructure

The graph is not stored on blockchain.

Hashes/audit records demonstrate evidence integrity.

## Decision 6 — Kafka is deferred

The MVP does not need real-time distributed streaming.

## Decision 7 — PostgreSQL is optional

Use it only where structured persistence genuinely helps.

Do not add it if it makes the MVP harder to run.

## Decision 8 — Modular monolith first

One understandable backend is preferable to microservices for the MVP.
