# PART 4 — GRAPH + ANALYSIS

## Neo4j

Create nodes and edges with provenance.

Example:

```cypher
MATCH (a:Person)-[:DRIVES]->(v:Vehicle)<-[:DRIVES]-(b:Person)
RETURN a, v, b
```

## Analysis

For each relevant person pair calculate explainable features.

Example:

```text
shared_vehicle = 1
shared_location = 1
temporal_similarity = 0.8
path_strength = 0.9
```

Combine into a prototype score.

## Lead object

A lead must contain:

- lead_id
- entities
- score
- reasons
- supporting records
- graph paths
- status

## Important

Graph analysis produces candidate leads.

It does not determine criminality.
