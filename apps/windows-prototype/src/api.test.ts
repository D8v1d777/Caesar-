import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchDemoMetric, type DemoMetricResult } from "./api";

const validResult: DemoMetricResult = {
  metric: "revenue",
  value: 205100,
  unit: "USD",
  period: "2026-Q2",
  source: "checked-in synthetic fixture",
  definition: "Synthetic quarterly revenue total",
  freshness: "synthetic_fixture",
  is_synthetic: true,
  warning: "Synthetic data; not for business decisions.",
};

function mockResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchDemoMetric", () => {
  it("requests the expected local route and returns a fully attributed synthetic result", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse(validResult));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchDemoMetric("revenue", "2026-Q2")).resolves.toEqual(validResult);
    expect(fetchMock).toHaveBeenCalledWith("/api/v1/demo/metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metric: "revenue", period: "2026-Q2" }),
    });
  });

  it("reports an unreachable API with actionable guidance", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    await expect(fetchDemoMetric()).rejects.toThrow(/unreachable/i);
  });

  it("rejects non-success HTTP responses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse({}, 503)));
    await expect(fetchDemoMetric()).rejects.toThrow(/HTTP 503/);
  });

  it("rejects unreadable JSON instead of trusting a broken response", async () => {
    const response = { ok: true, status: 200, json: vi.fn().mockRejectedValue(new SyntaxError("bad json")) };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));
    await expect(fetchDemoMetric()).rejects.toThrow(/unreadable response/i);
  });

  it("rejects a response for a different metric or period", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse({ ...validResult, metric: "active_customers", unit: "customers" })));
    await expect(fetchDemoMetric("revenue", "2026-Q2")).rejects.toThrow(/invalid or mismatched/i);
  });

  it.each([
    ["negative values", { ...validResult, value: -1 }],
    ["non-finite values", { ...validResult, value: Number.NaN }],
    ["wrong units", { ...validResult, unit: "customers" }],
    ["missing source", { ...validResult, source: "" }],
    ["non-synthetic responses", { ...validResult, is_synthetic: false }],
    ["missing warning", { ...validResult, warning: "" }],
  ])("rejects invalid provenance or value: %s", async (_label, body) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse(body)));
    await expect(fetchDemoMetric()).rejects.toThrow(/invalid or mismatched/i);
  });
});
