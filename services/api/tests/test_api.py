from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


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
    assert body["freshness"] == "synthetic_fixture"
    assert body["is_synthetic"] is True
    assert "not for business decisions" in body["warning"]


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
