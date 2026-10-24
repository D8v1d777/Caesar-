import { describe, expect, it } from "vitest";
import { getProposalApprovalKey, type ApprovalSnapshot } from "./proposalApproval";

const base: ApprovalSnapshot = {
  title: "Quarterly revenue",
  detail: "Synthetic revenue total",
  chart: "revenue · 2026-Q2",
  reason: "Source: checked-in fixture",
  metricResult: {
    metric: "revenue",
    value: 205100,
    unit: "USD",
    period: "2026-Q2",
    source: "checked-in synthetic fixture",
    definition: "Synthetic quarterly revenue total",
    freshness: "synthetic_fixture",
    is_synthetic: true,
    warning: "Not for business decisions.",
  },
};

describe("getProposalApprovalKey", () => {
  it("is stable for identical proposal content", () => {
    expect(getProposalApprovalKey(base)).toBe(getProposalApprovalKey({ ...base }));
  });

  it.each([
    ["title", { ...base, title: "Different title" }],
    ["detail", { ...base, detail: "Different detail" }],
    ["chart", { ...base, chart: "different metric" }],
    ["source reason", { ...base, reason: "Different source" }],
    ["metric value", { ...base, metricResult: { ...base.metricResult!, value: 999 } }],
    ["metric period", { ...base, metricResult: { ...base.metricResult!, period: "2026-Q3" } }],
    ["metric source", { ...base, metricResult: { ...base.metricResult!, source: "different fixture" } }],
    ["warning", { ...base, metricResult: { ...base.metricResult!, warning: "Changed warning" } }],
    ["metric removal", { ...base, metricResult: null }],
  ])("changes when approved content changes: %s", (_label, changed) => {
    expect(getProposalApprovalKey(changed)).not.toBe(getProposalApprovalKey(base));
  });
});
