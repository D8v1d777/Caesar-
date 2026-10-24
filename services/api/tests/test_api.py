from itertools import product

import pytest
from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)
METRICS = {
    "revenue": "USD",
    "active_customers": "customers",
    "conversion_rate": "percent",
}
PERIODS = ["2026-Q1", "2026-Q2", "2026-Q3", "2026-Q4"]


def test_health_marks_synthetic_mode() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "mode": "synthetic-demo"}


def test_metric_returns_value_and_provenance() -> None:
    response = client.post(
        "/v1/demo/metrics",
        json={"metric": "revenue", "period": "2026-Q2"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["value"] == 205100.0
    assert body["unit"] == "USD"
    assert body["source"] == "checked-in synthetic fixture"
    assert body["definition"]
    assert body["period"] == "2026-Q2"
    assert body["freshness"] == "synthetic_fixture"
    assert body["is_synthetic"] is True
    assert "not for business decisions" in body["warning"].lower()


def test_metric_contract_discloses_allowlists_and_synthetic_only_mode() -> None:
    response = client.get("/v1/demo/metrics")
    assert response.status_code == 200
    body = response.json()
    assert set(body["allowed_metrics"]) == set(METRICS)
    assert body["allowed_periods"] == PERIODS
    assert "synthetic" in body["warning"].lower()
    assert "company data" in body["warning"].lower()


@pytest.mark.parametrize(("metric", "period"), list(product(METRICS, PERIODS)))
def test_every_allowed_metric_period_pair_returns_complete_provenance(
    metric: str, period: str
) -> None:
    response = client.post(
        "/v1/demo/metrics",
        json={"metric": metric, "period": period},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["metric"] == metric
    assert body["period"] == period
    assert isinstance(body["value"], (int, float))
    assert body["value"] >= 0
    assert body["unit"] == METRICS[metric]
    assert body["source"] == "checked-in synthetic fixture"
    assert body["definition"]
    assert body["freshness"] == "synthetic_fixture"
    assert body["is_synthetic"] is True


def test_unknown_metric_is_rejected() -> None:
    response = client.post(
        "/v1/demo/metrics",
        json={"metric": "employee_salary", "period": "2026-Q2"},
    )
    assert response.status_code == 422


def test_unknown_period_is_rejected() -> None:
    response = client.post(
        "/v1/demo/metrics",
        json={"metric": "revenue", "period": "all-time"},
    )
    assert response.status_code == 422


def test_unknown_fields_are_rejected() -> None:
    response = client.post(
        "/v1/demo/metrics",
        json={"metric": "revenue", "period": "2026-Q2", "sql": "SELECT *"},
    )
    assert response.status_code == 422


@pytest.mark.parametrize(
    "payload",
    [
        {},
        {"metric": "revenue"},
        {"period": "2026-Q2"},
        {"metric": None, "period": "2026-Q2"},
        {"metric": "revenue", "period": None},
        {"metric": ["revenue"], "period": "2026-Q2"},
    ],
)
def test_missing_or_wrongly_typed_fields_are_rejected(payload: dict) -> None:
    response = client.post("/v1/demo/metrics", json=payload)
    assert response.status_code == 422
