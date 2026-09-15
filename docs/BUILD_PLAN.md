# BUILD PLAN

## Phase 0 — Understand

Read:

- PROJECT_CONTEXT.md
- AGENTS.md
- PRD
- SYSTEM_DESIGN
- DATA_MODEL
- AI_LOGIC
- DEMO_SCENARIO
- UI_SPEC

Do not code yet.

## Phase 1 — Data

Build:

- sample dataset
- loader
- normalization
- validation

Output:

```text
clean_records.json
```

## Phase 2 — Extraction

Build:

- entity extraction
- relationship extraction
- provenance

Output:

```text
entities.json
relationships.json
```

## Phase 3 — Entity resolution

Build:

- name normalization
- deterministic matching
- fuzzy matching
- confidence

Output:

```text
resolved_entities.json
```

## Phase 4 — Graph

Build:

- Neo4j connection
- node creation
- relationship creation
- graph query endpoints

Verify the demo graph manually.

## Phase 5 — Analysis

Build:

- graph features
- temporal features
- transparent lead score
- lead explanations

Verify the planted demo lead.

## Phase 6 — Backend

Build FastAPI endpoints.

## Phase 7 — Frontend

Build React dashboard.

First make:

- graph
- lead card
- evidence
- verification

Then add charts.

## Phase 8 — Integrity

Add:

- SHA-256 evidence hashing
- audit records
- review status

## Phase 9 — Integration

Run complete flow from fresh data to dashboard.

## Phase 10 — Polish

Only now consider:

- GDS algorithms
- richer NLP
- animations
- Docker
- optional ML/GNN
- optional blockchain demonstration

## Golden rule

Do not build Phase 10 before Phase 9 works.
