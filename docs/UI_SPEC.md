# UI SPECIFICATION

## Design goal

The interface should look like an intelligence-analysis tool.

It should NOT look like a generic admin dashboard.

## Main screen

### Header

- product name
- system status
- data source count
- last analysis time

### Left panel

Filters / exploration:

- cases
- people
- vehicles
- phones
- locations
- date range
- relationship type

### Center

Interactive Cytoscape graph.

Nodes should be visually distinguishable by type.

Edges should show relationship labels when useful.

Selecting a node highlights its neighborhood.

### Right panel

Lead/evidence panel.

Example:

```text
POTENTIAL CONNECTION

A-001 ↔ B-002

Score
87%

Why?
✓ Shared vehicle V-014
✓ Related location L-005
✓ Close temporal proximity

Evidence
CASE-101
CASE-102
CASE-103

Status
Requires Verification

[ VERIFY ] [ REJECT ]
```

### Bottom

Timeline / event activity.

## UX rules

- Never bury the lead explanation.
- Never show a score without explanation.
- Make evidence one click away.
- Use clear labels.
- Avoid excessive animations.
- Avoid unnecessary cards.
- Keep the graph as the visual focus.

## Demo priority

1. graph
2. lead
3. evidence
4. timeline
5. verification
6. secondary statistics
