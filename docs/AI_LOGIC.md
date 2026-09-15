# AI / ANALYTICAL LOGIC

## Important

The first MVP does NOT need a sophisticated neural network.

We need a working, explainable analytical baseline.

## Stage 1 — deterministic features

For a pair of people A and B calculate:

- shared vehicle count
- shared phone count
- shared location count
- shared organization count
- number of common cases
- number of graph paths
- shortest path length
- temporal proximity
- repeated interaction count

## Stage 2 — candidate score

Example:

```text
score =
    0.35 * vehicle_similarity
  + 0.25 * location_similarity
  + 0.15 * temporal_similarity
  + 0.15 * path_strength
  + 0.10 * repeated_case_signal
```

These values are demo parameters.

They are NOT scientifically validated probabilities.

Keep the components visible so the user can understand why a lead exists.

## Stage 3 — optional graph algorithms

If time permits:

- PageRank
- community detection
- similarity
- link prediction

Use these as analytical signals.

Do not let them become unexplained black boxes.

## Stage 4 — optional ML/GNN

Only after the baseline works.

Possible future work:

- Node2Vec
- graph embeddings
- PyTorch Geometric
- supervised link prediction
- anomaly detection

The GNN is a future enhancement, not the definition of the MVP.

## False-positive principle

A suspicious-looking graph pattern is not proof.

The dashboard must show:

> Potential connection — requires investigator verification.

## Explanation requirement

Every lead must contain human-readable reasons.

Bad:

```text
prediction = 0.87
```

Good:

```text
score = 0.87

Reasons:
- shared vehicle V-014
- shared location L-005
- events 2 days apart
- 2 independent graph paths
```
