# SYSTEM DESIGN

## 1. High-level architecture

```text
                 ┌─────────────────────────┐
                 │ Synthetic Crime Records │
                 │ CSV / JSON              │
                 └────────────┬────────────┘
                              ↓
                 ┌─────────────────────────┐
                 │ Ingestion + Normalizing │
                 │ Python / Pandas         │
                 └────────────┬────────────┘
                              ↓
                 ┌─────────────────────────┐
                 │ Entity + Relationship   │
                 │ Extraction              │
                 │ spaCy / rules           │
                 └────────────┬────────────┘
                              ↓
                 ┌─────────────────────────┐
                 │ Entity Resolution       │
                 │ normalize + match       │
                 └────────────┬────────────┘
                              ↓
              ┌───────────────┴────────────────┐
              ↓                                ↓
      ┌────────────────┐              ┌────────────────┐
      │ PostgreSQL     │              │ Neo4j          │
      │ structured     │              │ Knowledge Graph│
      └────────────────┘              └───────┬────────┘
                                              ↓
                                  ┌─────────────────────┐
                                  │ Graph + Time        │
                                  │ Analysis            │
                                  └──────────┬──────────┘
                                             ↓
                                  ┌─────────────────────┐
                                  │ Potential Leads     │
                                  │ score + explanation │
                                  └──────────┬──────────┘
                                             ↓
                                  ┌─────────────────────┐
                                  │ FastAPI             │
                                  └──────────┬──────────┘
                                             ↓
                          ┌────────────────────────────────┐
                          │ React + Cytoscape + Plotly     │
                          │ Investigator Dashboard         │
                          └───────────────┬────────────────┘
                                          ↓
                               Verify / Reject
                                          ↓
                              Audit + SHA-256 Hash
```

## 2. Data layer

For the MVP, CSV/JSON is enough.

PostgreSQL is optional if it creates unnecessary setup friction.

Neo4j is the main graph store.

Do not create a distributed data architecture for the MVP.

## 3. Processing layer

Processing is organized into:

1. ingest
2. normalize
3. extract
4. resolve
5. graph load
6. analyze
7. generate leads

## 4. Graph layer

Node labels:
- Person
- Case
- Vehicle
- Phone
- Location
- Organization
- Account
- Event
- Transaction
- Communication

Start with:
- Person
- Case
- Vehicle
- Phone
- Location

Edges should carry:
- source record
- timestamp when applicable
- confidence
- extraction method where useful

## 5. Analysis layer

Start with transparent graph features:

- degree
- shared neighbors
- common entities
- path length
- repeated relationships
- temporal proximity

Optional:
- Neo4j GDS
- PageRank
- community detection
- link prediction
- graph embeddings

Only add GNNs if the baseline works and there is enough time.

## 6. API layer

FastAPI exposes read/write endpoints for:

- cases
- entities
- graph
- leads
- reviews
- ingestion
- analysis

See `API_CONTRACT.md`.

## 7. Frontend

React application with:

- network graph
- case/entity explorer
- lead list
- evidence panel
- timeline
- verification controls

Cytoscape.js renders the graph.

Plotly renders analytical charts/timelines.

## 8. Evidence integrity

When a lead/evidence bundle is finalized:

```text
evidence JSON
     ↓
canonical serialization
     ↓
SHA-256
     ↓
hash stored in audit record
```

A future blockchain layer could anchor these hashes.

The MVP does not need a public blockchain.

## 9. Failure handling

If extraction is uncertain:
- retain confidence
- do not silently discard

If entity resolution is uncertain:
- mark as candidate match

If graph analysis cannot generate a lead:
- show no lead rather than inventing one

If Neo4j is unavailable:
- application should provide a clear error

## 10. Trust model

The system provides analytical assistance.

The investigator remains responsible for interpreting the evidence.

The graph is not proof.
The score is not probability of guilt.
The lead is not an accusation.
