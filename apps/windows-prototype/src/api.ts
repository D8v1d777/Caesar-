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
  const result: unknown = await response.json();
  if (!isDemoMetricResult(result) || result.metric !== metric || result.period !== period) {
    throw new Error("Synthetic API returned an invalid or mismatched metric response.");
  }
  return result;
}

function isDemoMetricResult(value: unknown): value is DemoMetricResult {
  if (typeof value !== "object" || value === null) return false;
  const result = value as Record<string, unknown>;
  return typeof result.metric === "string" &&
    typeof result.value === "number" && Number.isFinite(result.value) && result.value >= 0 &&
    ["USD", "customers", "percent"].includes(String(result.unit)) &&
    typeof result.period === "string" && typeof result.source === "string" && result.source.length > 0 &&
    typeof result.definition === "string" && result.definition.length > 0 &&
    result.freshness === "synthetic_fixture" && result.is_synthetic === true &&
    typeof result.warning === "string" && result.warning.length > 0;
}