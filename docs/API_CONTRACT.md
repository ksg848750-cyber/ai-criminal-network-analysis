# API CONTRACT

Base path:

```text
/api
```

## GET /health

Returns service status.

## GET /cases

Returns cases.

## GET /cases/{case_id}

Returns case details and related entities.

## GET /entities/{entity_id}

Returns entity details and graph neighbors.

## GET /graph

Returns graph nodes and edges.

Optional filters:
- entity type
- case
- date range
- relationship type

## GET /leads

Returns candidate investigative leads.

## GET /leads/{lead_id}

Returns:

- entities
- score
- reasons
- supporting records
- paths
- status

## POST /leads/{lead_id}/review

Request:

```json
{
  "decision": "VERIFIED",
  "comment": "Reviewed supporting records."
}
```

## POST /ingest

Loads synthetic records.

## POST /analyze

Runs graph/temporal analysis and generates candidate leads.

## Design rule

The API should return evidence references with leads.

Do not return only a numeric score.
