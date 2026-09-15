# AGENTS.md — PERMANENT PROJECT RULES

## Mission

Build a beginner-friendly but convincing MVP for SIH Problem Statement 26189:
**AI-Powered Criminal Network Analysis System.**

The product is an investigator decision-support tool.

## Mandatory first read

Before coding, read:

1. `PROJECT_CONTEXT.md`
2. `docs/PRD.md`
3. `docs/SYSTEM_DESIGN.md`
4. `docs/DATA_MODEL.md`
5. `docs/AI_LOGIC.md`
6. `docs/DEMO_SCENARIO.md`
7. `docs/UI_SPEC.md`
8. `docs/BUILD_PLAN.md`

Then read only the context file relevant to the current phase.

## Non-negotiable product outcome

The MVP must demonstrate:

```text
Synthetic Records
→ Extraction
→ Entity Resolution
→ Knowledge Graph
→ Graph/Temporal Analysis
→ Potential Lead
→ Reasons + Evidence
→ Investigator Verification
```

## Coding rules

1. Prefer simple readable code over clever architecture.
2. Keep modules small.
3. Use clear names.
4. Add comments where the reasoning is non-obvious.
5. Preserve source/provenance information.
6. Preserve uncertainty/confidence.
7. Never present an analytical lead as proof of criminality.
8. Never use real sensitive data for the demo.
9. Build a transparent baseline before adding GNN/deep-learning complexity.
10. Do not introduce a new dependency unless it solves a real MVP need.
11. Keep the application runnable after each phase.
12. Test each phase before moving on.
13. Do not silently expand scope.

## Scope guardrails

Do not implement these unless explicitly requested:

- real CDR integration
- social-media scraping
- production Kafka
- production blockchain
- production cloud infrastructure
- microservices
- enterprise IAM
- autonomous criminal classification
- full-scale GNN training

## Graph rules

The graph is a representation of evidence/relationships.

A graph edge does not mean guilt.

Every important lead should be explainable through:

- relationship types
- timestamps
- source records
- confidence/score
- graph path or shared attributes

## UI rules

The UI should look like an intelligence-analysis dashboard, not a generic CRUD app.

Prioritize:

- graph
- lead cards
- evidence
- timeline
- filters
- clear verification state

## Agent behavior

Before modifying the architecture:

- explain why
- check whether the change is necessary
- preserve the MVP path

After implementation report:

- what changed
- files changed
- how to run it
- tests run
- known limitations
- recommended next step
