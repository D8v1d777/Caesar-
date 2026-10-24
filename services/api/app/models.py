from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, model_validator


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

    @model_validator(mode="after")
    def validate_semantics(self) -> "MetricResult":
        expected_units = {
            "revenue": "USD",
            "active_customers": "customers",
            "conversion_rate": "percent",
        }
        if self.unit != expected_units[self.metric]:
            raise ValueError(f"{self.metric} must use unit {expected_units[self.metric]}")
        if self.metric == "conversion_rate" and self.value > 100:
            raise ValueError("conversion_rate must be between 0 and 100 percent")
        for field_name in ("source", "definition", "warning"):
            if not getattr(self, field_name).strip():
                raise ValueError(f"{field_name} must not be blank")
        return self
