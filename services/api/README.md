# Caesar API — synthetic demo only

This small FastAPI service is an API contract spike for the developer team. It serves a fixed synthetic dataset and validates a constrained metric request. It does **not** connect to a company database, model provider, or identity provider.

## Run

Use Python 3.11+:

```powershell
cd services/api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements-dev.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Open `http://127.0.0.1:8000/docs` for the local OpenAPI page.

## Test

```powershell
python -m pytest -q
```

## Contract guarantees in this spike

- Only allowlisted metrics and time periods are accepted.
- Values are generated from a checked-in synthetic fixture, never inferred by a model.
- Metric responses include source, definition, period, freshness label, and synthetic-data disclosure.
- Invalid metric names and periods fail validation.

## Not production-ready

No authentication, tenant isolation, database connection, model adapter, durable approval journal, rate limiting, or production deployment configuration is included. Keep this service bound to loopback for local demos. Do not expose it to a network or pass it real company data. The front-end demo currently does not call this API.
