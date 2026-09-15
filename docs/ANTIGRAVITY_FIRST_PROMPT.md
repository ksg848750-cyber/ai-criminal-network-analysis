# FIRST PROMPT FOR ANTIGRAVITY

Paste this into the first project conversation after opening the repository.

---

You are the primary coding agent for this project.

Before writing any code:

1. Read `PROJECT_CONTEXT.md` completely.
2. Read `AGENTS.md`.
3. Read `docs/PRD.md`.
4. Read `docs/SYSTEM_DESIGN.md`.
5. Read `docs/DATA_MODEL.md`.
6. Read `docs/AI_LOGIC.md`.
7. Read `docs/DEMO_SCENARIO.md`.
8. Read `docs/UI_SPEC.md`.
9. Read `docs/BUILD_PLAN.md`.

Do NOT start implementation immediately.

First give me:

### A. Your understanding of the product
Explain in simple words:
- what we are building
- who uses it
- what problem it solves

### B. End-to-end flow
Explain exactly what happens from:
record ingestion → extraction → entity resolution → graph → analysis → lead → evidence → verification.

### C. MVP boundary
List:
- what you will build
- what you will NOT build

### D. Architecture understanding
Explain why each major technology exists and which ones are optional.

### E. Demo understanding
Explain the planted A-001 / B-002 / C-003 scenario and what lead the final system must surface.

### F. Proposed implementation plan
Give a phased plan that keeps the application runnable after every phase.

Do not create a giant enterprise architecture.

Do not add dependencies just because they are mentioned in the documents.

Do not implement GNN/Kafka/blockchain infrastructure before the core vertical slice works.

After I approve your understanding and plan, begin Phase 1.
