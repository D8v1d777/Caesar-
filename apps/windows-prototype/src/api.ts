export type DemoMetricName = "revenue" | "active_customers" | "conversion_rate";
export type DemoPeriod = "2026-Q1" | "2026-Q2" | "2026-Q3" | "2026-Q4";

export type DemoMetricResult = {
  metric: DemoMetricName;
  value: number;
  unit: "USD" | "customers" | "percent";
  period: DemoPeriod;
  source: string;
  definition: string;
  freshness: "synthetic_fixture";
  is_synthetic: true;
  warning: string;
};

const expectedUnits: Record<DemoMetricName, DemoMetricResult["unit"]> = {
  revenue: "USD",
  active_customers: "customers",
  conversion_rate: "percent",
};
const allowedPeriods: readonly DemoPeriod[] = ["2026-Q1", "2026-Q2", "2026-Q3", "2026-Q4"];

export async function fetchDemoMetric(metric: DemoMetricName = "revenue", period: DemoPeriod = "2026-Q2"): Promise<DemoMetricResult> {
  let response: Response;
  try {
    response = await fetch("/api/v1/demo/metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metric, period }),
    });
  } catch {
    throw new Error("Synthetic API is unreachable. Start the local API on 127.0.0.1:8000 and retry.");
  }
  if (!response.ok) throw new Error("Synthetic API rejected the request (HTTP " + response.status + ").");

  let result: unknown;
  try {
    result = await response.json();
  } catch {
    throw new Error("Synthetic API returned an unreadable response.");
  }
  if (!isDemoMetricResult(result) || result.metric !== metric || result.period !== period) {
    throw new Error("Synthetic API returned an invalid or mismatched metric response.");
  }
  return result;
}

function isDemoMetricResult(value: unknown): value is DemoMetricResult {
  if (typeof value !== "object" || value === null) return false;
  const result = value as Record<string, unknown>;
  if (typeof result.metric !== "string" || !(result.metric in expectedUnits)) return false;
  const metric = result.metric as DemoMetricName;
  return typeof result.value === "number" &&
    Number.isFinite(result.value) && result.value >= 0 &&
    (metric !== "conversion_rate" || result.value <= 100) &&
    result.unit === expectedUnits[metric] &&
    typeof result.period === "string" && allowedPeriods.includes(result.period as DemoPeriod) &&
    typeof result.source === "string" && result.source.trim().length > 0 &&
    typeof result.definition === "string" && result.definition.trim().length > 0 &&
    result.freshness === "synthetic_fixture" && result.is_synthetic === true &&
    typeof result.warning === "string" && result.warning.trim().length > 0;
}
