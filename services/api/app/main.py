from fastapi import FastAPI
from fastapi.responses import JSONResponse

from .metrics import read_metric
from .models import MetricRequest, MetricResult


app = FastAPI(
    title="Caesar Synthetic Demo API",
    version="0.1.0",
    description=(
        "Local-only contract spike. Synthetic fixtures only; no company systems, "
        "identity provider, or AI model is connected."
    ),
)


@app.get("/health", tags=["operations"])
def health() -> dict[str, str]:
    return {"status": "ok", "mode": "synthetic-demo"}


@app.post("/v1/demo/metrics", response_model=MetricResult, tags=["demo"])
def get_demo_metric(request: MetricRequest) -> MetricResult:
    return read_metric(request.metric, request.period)


@app.get("/v1/demo/metrics", tags=["demo"])
def metric_contract() -> JSONResponse:
    return JSONResponse(
        {
            "allowed_metrics": ["revenue", "active_customers", "conversion_rate"],
            "allowed_periods": ["2026-Q1", "2026-Q2", "2026-Q3", "2026-Q4"],
            "warning": "Synthetic fixtures only. This endpoint does not expose company data.",
        }
    )
