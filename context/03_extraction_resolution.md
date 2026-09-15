# PART 3 — EXTRACTION + ENTITY RESOLUTION

## Extraction

For structured CSV, fields already identify entities.

For descriptions, optionally use spaCy NER/rules.

The output should be:

```text
entities[]
relationships[]
provenance[]
```

## Resolution

Normalize:

- lowercase/casefold
- whitespace
- punctuation
- common abbreviations

Then compare:

- exact normalized match
- identifier match
- attribute overlap
- fuzzy similarity

Return:

```text
candidate_match
confidence
reasons
```

Never auto-merge on name similarity alone when contradictory evidence exists.
