# Criminal Network Intelligence MVP — START HERE

## What this folder is

This is the **starter/context pack for Antigravity** for Smart India Hackathon Problem Statement 26189.

It is intentionally written so that an AI coding agent can understand the project **before writing code**.

Do not treat this as a collection of disconnected technical documents.

The project has one central story:

> Fragmented crime/intelligence records contain entities and relationships that are difficult to discover manually. The MVP converts those records into a connected Knowledge Graph, analyzes the graph for potentially meaningful hidden relationships, and presents evidence-backed leads to an investigator for verification.

## Read order

Antigravity should read these in this order:

1. `PROJECT_CONTEXT.md` — the complete mental model of the product
2. `AGENTS.md` — permanent project rules
3. `docs/PRD.md` — what the product must do
4. `docs/SYSTEM_DESIGN.md` — how the product is structured
5. `docs/DATA_MODEL.md` — what data means
6. `docs/AI_LOGIC.md` — what "AI analysis" means in the MVP
7. `docs/DEMO_SCENARIO.md` — the exact demo we want to work
8. `docs/UI_SPEC.md` — what the finished dashboard should look like
9. `docs/API_CONTRACT.md` — backend/frontend contract
10. `docs/BUILD_PLAN.md` — implementation order

Then use the context parts when implementing individual phases.

## Important

Do NOT start by building every technology listed in the architecture.

Build the smallest working vertical slice first:

Data → entities → relationships → entity resolution → graph → lead → evidence → dashboard → investigator verification.

The MVP must work end-to-end before optional technologies are added.
