# PROJECT CONTEXT — READ THIS FIRST

## 1. Project identity

**Project:** AI-Powered Criminal Network Analysis System  
**SIH Problem Statement:** 26189  
**Purpose:** Build a prototype intelligence-analysis platform that helps investigators discover potentially meaningful relationships hidden across fragmented crime/intelligence records.

This is a **decision-support and intelligence-analysis prototype**.

It is NOT an autonomous system for declaring someone a criminal.

---

# 2. The problem in simple words

Investigators may have many records:

- FIRs / case records
- police reports
- communication records
- financial transactions
- surveillance reports
- criminal-history records
- intelligence reports
- other structured or unstructured records

The problem is not simply that there is too little data.

The problem is that useful information is spread across records and systems.

For example:

Record A:
- Person: Ravi
- Vehicle: V-014
- Location: L-003

Record B:
- Person: Arjun
- Vehicle: V-014
- Location: L-005

Record C:
- Person: Sameer
- Phone: P-008
- Location: L-005

A human reading each record separately may not immediately notice the larger relationship.

A graph makes the connections visible:

Ravi → V-014 → Arjun → L-005 → Sameer

That connection does NOT automatically prove wrongdoing.

It is a **potential investigative lead**.

---

# 3. The one-sentence product definition

> A system that turns fragmented crime/intelligence records into an evidence-backed relationship graph and highlights potentially meaningful connections for investigators to verify.

---

# 4. The core product loop

Everything we build must support this loop:

```text
Fragmented Records
       ↓
Extract Entities
       ↓
Extract Relationships
       ↓
Resolve Same Entities Across Records
       ↓
Build Knowledge Graph
       ↓
Analyze Graph + Time
       ↓
Find Potential Connections
       ↓
Show Reasons + Supporting Evidence
       ↓
Investigator Verifies / Rejects
```

This is the project.

If a feature does not help this loop, it is probably outside the MVP.

---

# 5. What the system understands

The MVP works with these conceptual objects.

### Entities

- Person
- Phone
- Vehicle
- Location
- Organization
- Account
- Case
- Event
- Transaction
- Communication

### Relationships

Examples:

```text
Person ──USES── Phone
Person ──DRIVES── Vehicle
Person ──VISITS── Location
Person ──INVOLVED_IN── Case
Person ──WORKS_FOR── Organization
Person ──OWNS── Account
Person ──CALLS── Person
Account ──TRANSFERS_TO── Account
```

Not every entity or relationship needs to be fully implemented in V1.

The MVP should prioritize:

**Person, Case, Vehicle, Phone, Location**

and relationships needed for the demo.

---

# 6. What happens to one record

Imagine the input:

```text
Case ID: CASE-101
Person: Ravi Kumar
Vehicle: V-014
Location: L-003
Date: 2026-08-12
Description: Person observed near the location using vehicle V-014.
```

The pipeline turns this into:

### Entities

```text
PERSON:Ravi Kumar
VEHICLE:V-014
LOCATION:L-003
CASE:CASE-101
```

### Relationships

```text
Ravi Kumar ──DRIVES── V-014
Ravi Kumar ──VISITS── L-003
Ravi Kumar ──INVOLVED_IN── CASE-101
```

### Provenance

Every extracted item should retain enough information to answer:

> "Which source record caused the system to create this?"

This is essential for evidence-backed intelligence.

---

# 7. Entity resolution

Entity resolution means determining whether two records probably refer to the same real-world entity.

Example:

```text
Record 1: Ravi Kumar
Record 2: R. Kumar
Record 3: Ravi K
```

The system can normalize names and compare available attributes.

However:

**Do not merge entities just because their names are similar.**

Use supporting attributes where available:

- phone
- vehicle
- location
- organization
- case relationships
- other identifiers in the synthetic dataset

The result should contain a confidence value.

Example:

```text
Ravi Kumar ↔ R. Kumar
Resolution confidence: 0.91
```

The system should retain uncertainty rather than pretending every match is certain.

---

# 8. Knowledge Graph

Neo4j is the core graph store for the MVP.

The graph represents:

```text
Nodes = entities
Edges = relationships
Properties = attributes, timestamps, confidence, provenance
```

Example:

```text
(Ravi)-[:DRIVES]->(V-014)
(Ravi)-[:INVOLVED_IN]->(CASE-101)
(Arjun)-[:DRIVES]->(V-014)
(Arjun)-[:INVOLVED_IN]->(CASE-102)
(Arjun)-[:VISITS]->(L-005)
(Sameer)-[:VISITS]->(L-005)
```

The graph is useful because a relationship can be indirect.

---

# 9. What "AI analysis" means in this MVP

Do not assume we need a giant trained model.

The MVP should first implement a transparent baseline.

For example, a candidate connection between two people can receive points for:

- shared vehicle
- shared phone
- shared location
- close temporal proximity
- repeated cross-case connection
- short/multiple graph paths
- shared organization
- other meaningful links available in the dataset

The exact score is a **prototype analytical score**, not a real-world probability of criminality.

Example:

```text
Candidate: Ravi ↔ Arjun

Shared vehicle          +0.35
Shared location         +0.25
Close in time           +0.15
Multiple graph paths    +0.12
Repeated cross-case link+0.10
--------------------------------
Lead score               0.97
```

The dashboard should explain the score.

Never show:

> "Ravi is a criminal."

Show:

> "Potential relationship detected between Ravi and Arjun."

---

# 10. Evidence-backed lead

Every lead should answer four questions:

### Who?

Which entities are potentially connected?

### Why?

Which relationships or patterns caused the lead?

### When?

When did the relevant events occur?

### Where did it come from?

Which source cases/records support it?

Example:

```text
Potential Connection
Ravi ↔ Arjun

Score: 0.87

Reasons:
• Shared vehicle V-014
• Related location L-005
• Events occurred within a short time window
• Connected through multiple graph paths

Supporting records:
• CASE-101
• CASE-102
• CASE-103

Status:
Requires Investigator Verification
```

---

# 11. Human-in-the-loop principle

This is a hard requirement.

The system provides:

**Potential lead → evidence → explanation**

The investigator decides:

**Verify / Reject / Investigate further**

The system must not autonomously make legal or criminal determinations.

---

# 12. What the final MVP should look like

The finished prototype should feel like an investigator dashboard.

Main areas:

```text
┌─────────────────────────────────────────────────────────────┐
│ CRIMINAL NETWORK INTELLIGENCE                               │
├───────────────┬───────────────────────────────┬─────────────┤
│ Cases /       │                               │ Potential   │
│ Entities      │       Network Graph           │ Lead        │
│               │                               │             │
│ CASE-101      │   Person A ─ Vehicle ─ B      │ Score 0.87  │
│ CASE-102      │                 │             │             │
│ CASE-103      │              Location         │ Reasons     │
│               │                 │             │ Evidence    │
│               │              Person C         │             │
│               │                               │ [VERIFY]    │
│               │                               │ [REJECT]    │
├───────────────┴───────────────────────────────┴─────────────┤
│ Timeline / Activity / Supporting Records                    │
└─────────────────────────────────────────────────────────────┘
```

The graph must be interactive enough for the demo.

Clicking a lead should show:

- involved entities
- score
- reasons
- supporting cases
- timestamps
- relationship types
- source/provenance
- verification controls

---

# 13. Security and blockchain positioning

The SIH theme is Blockchain & Cybersecurity.

Blockchain is NOT the core graph engine.

The core intelligence engine is:

```text
NLP + Entity Resolution + Knowledge Graph + Graph Analysis
```

Blockchain/security supports trust:

```text
Evidence / Finding
       ↓
SHA-256 hash
       ↓
Tamper-evident audit record
```

For the MVP, a local hash-chain or lightweight ledger demonstration is enough.

Do NOT put sensitive raw records or PII on a public blockchain.

Security concepts to demonstrate:

- authentication/authorization as future architecture
- role-based access concept
- encryption in transit/at rest as deployment principle
- audit logs
- evidence integrity
- provenance
- human verification

---

# 14. Existing ecosystem awareness

This project must NOT claim that criminal network graphs are completely new.

India already has systems such as CCTNS and ICJS, and the official CCTNS material references criminal network link analysis.

Therefore our positioning is:

> We build on existing crime-data integration and network-analysis work and focus the MVP on an evidence-backed investigator workflow combining entity resolution, dynamic relationship analysis, temporal context, explainable leads, and human verification.

Do not make unsupported claims such as:

- "No such system exists"
- "We are the first criminal graph"
- "Existing systems cannot find relationships"
- "Our AI will identify criminals"

---

# 15. MVP technology map

### Python
Main processing language and glue.

### Pandas
Data loading, cleaning and transformation.

### spaCy / Transformers
Entity and relationship extraction.

For V1, use spaCy/rules where possible. Transformers are optional for deeper NLP.

### Entity Resolution
Python-based normalization, deterministic rules and fuzzy matching.

### Neo4j
Knowledge Graph storage and querying.

### Neo4j GDS
Graph algorithms if useful.

### scikit-learn
Classical scoring/anomaly methods where useful.

### PyTorch / PyTorch Geometric
Optional later layer for learned graph embeddings/link prediction.

Do NOT make a GNN a dependency for the first working demo.

### FastAPI
Backend API.

### React
Dashboard.

### Cytoscape.js
Interactive graph visualization.

### Plotly
Timelines and analytical charts.

### SHA-256
Evidence/finding integrity.

### PostgreSQL
Structured system-of-record storage if needed.

### Docker
Optional packaging after the core system works.

### Kafka
Production-scale streaming concept only. Not required for first MVP.

---

# 16. What we are NOT building right now

Do not expand scope without explicit approval.

Out of scope for the first MVP:

- real police databases
- real CDR integration
- real financial institution integration
- social-media scraping
- production Kafka cluster
- production blockchain network
- production-grade IAM
- cloud deployment
- microservices
- full enterprise observability
- autonomous criminal classification
- fully trained GNN from scratch
- national-scale graph
- live feeds
- biometric identification

---

# 17. The MVP success condition

The MVP is successful when a demo user can:

1. Load synthetic crime records.
2. See extracted entities.
3. See relationships.
4. See resolved entities.
5. See the Knowledge Graph.
6. Run analysis.
7. Receive a potential connection.
8. See the score and reasons.
9. Open supporting evidence.
10. Verify or reject the lead.
11. See an integrity/audit record.

If these work, we have a successful MVP.

Everything else is secondary.

---

# 18. Development philosophy

Build in vertical slices.

Do NOT spend the first day building infrastructure.

Preferred sequence:

```text
Working data
    ↓
Working extraction
    ↓
Working resolution
    ↓
Working graph
    ↓
Working lead detection
    ↓
Working API
    ↓
Working dashboard
    ↓
Evidence integrity
    ↓
Polish
```

Always keep a runnable state.

If an advanced technology becomes a blocker, simplify it rather than stopping the MVP.

---

# 19. Golden rule for the AI coding agent

Before implementing anything, the agent should be able to explain:

> "What happens when a crime record enters this system?"

The expected answer is:

> It is loaded and normalized, entities and relationships are extracted, entities are resolved across records, the information is represented in a Knowledge Graph, graph and temporal analysis identifies potentially meaningful connections, and the investigator sees an explainable lead backed by source evidence that they can verify or reject.

If the agent cannot explain this, it should read this file again before coding.
