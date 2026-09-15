# DEMO SCENARIO

## Goal

Demonstrate that separate records can produce a useful cross-record relationship.

## Records

### CASE-101

```text
Person: A-001
Vehicle: V-014
Location: L-003
Date: 2026-08-12
```

### CASE-102

```text
Person: B-002
Vehicle: V-014
Location: L-005
Date: 2026-08-14
```

### CASE-103

```text
Person: C-003
Phone: P-008
Location: L-005
Date: 2026-08-15
```

## Intended graph

```text
A-001
  │
DRIVES
  │
V-014
  │
DRIVES
  │
B-002
  │
VISITS
  │
L-005
  │
VISITS
  │
C-003
```

## Intended lead

```text
Potential connection:
A-001 ↔ B-002

Example score:
0.87

Reasons:
- shared vehicle V-014
- related location context
- close dates
- cross-case relationship
```

The exact score can change if the implementation uses a different transparent scoring formula.

## Supporting evidence

- CASE-101
- CASE-102
- CASE-103 where applicable

## False-similarity case

Create two records with similar names but different:

- phone
- vehicle
- location
- case relationships

The system should keep them separate unless evidence supports a match.

This demonstrates why entity resolution matters.

## Demo sequence

1. Open dashboard.
2. Show cases.
3. Run ingestion/analysis.
4. Show entity graph.
5. Select the detected lead.
6. Show reasons.
7. Open supporting evidence.
8. Show timeline.
9. Click Verify.
10. Show updated audit/review status.
