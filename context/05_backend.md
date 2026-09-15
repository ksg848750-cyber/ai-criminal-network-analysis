# PART 5 — BACKEND

Use FastAPI.

Keep a simple structure such as:

```text
backend/
  app/
    main.py
    routes/
    services/
    models/
    graph/
    analysis/
    ingestion/
```

Do not over-engineer.

The backend should expose:

- health
- cases
- entities
- graph
- leads
- lead detail
- lead review
- ingest
- analyze

Keep business logic outside route handlers.
