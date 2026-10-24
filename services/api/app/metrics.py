from .models import MetricName, MetricResult, Period


# Fixed fixtures are deliberately synthetic. Never replace these with live data
# without separate authorization, tenant isolation, and security review.
_FIXTURES: dict[MetricName, dict[Period, float]] = {
    "revenue": {"2026-Q1": 182_400.0, "2026-Q2": 205_100.0, "2026-Q3": 219_800.0, "2026-Q4": 231_600.0},
    "active_customers": {"2026-Q1": 1_240.0, "2026-Q2": 1_318.0, "2026-Q3": 1_407.0, "2026-Q4": 1_492.0},
    "conversion_rate": {"2026-Q1": 3.1, "2026-Q2": 3.4, "2026-Q3": 3.6, "2026-Q4": 3.8},
}
_METADATA: dict[MetricName, tuple[str, str]] = {
    "revenue": ("USD", "Synthetic gross revenue in US dollars for the selected quarter."),
    "active_customers": ("customers", "Synthetic count of active customers in the selected quarter."),
    "conversion_rate": ("percent", "Synthetic percentage of eligible visits that converted in the selected quarter."),
}


def read_metric(metric: MetricName, period: Period) -> MetricResult:
    unit, definition = _METADATA[metric]
    return MetricResult(
        metric=metric,
        value=_FIXTURES[metric][period],
        unit=unit,  # type: ignore[arg-type]
        period=period,
        source="checked-in synthetic fixture",
        definition=definition,
        freshness="synthetic_fixture",
    )
