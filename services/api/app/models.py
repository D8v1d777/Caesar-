from typing import Literal
from pydantic import BaseModel, ConfigDict, Field


MetricName = Literal["revenue", "active_customers", "conversion_rate"]
Period = Literal["2026-Q1", "2026-Q2", "2026-Q3", "2026-Q4"]


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)


class MetricRequest(StrictModel):
    metric: MetricName
    period: Period


class MetricResult(StrictModel):
    metric: MetricName
    value: float = Field(ge=0)
    unit: Literal["USD", "customers", "percent"]
    period: Period
    source: str
    definition: str
    freshness: Literal["synthetic_fixture"]
    is_synthetic: Literal[True] = True
    warning: str = "Illustrative data only. Not for business decisions."
