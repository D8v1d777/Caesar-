export type ApprovalSnapshot = {
  title: string;
  detail: string;
  chart: string;
  reason: string;
  metricResult: {
    metric: string;
    value: number;
    unit: string;
    period: string;
    source: string;
    definition: string;
    freshness: string;
    is_synthetic: boolean;
    warning: string;
  } | null;
};

/**
 * Deterministic content binding for the UI approval state.
 * This is a stale-approval guard, not cryptographic authorization.
 */
export function getProposalApprovalKey(snapshot: ApprovalSnapshot): string {
  return JSON.stringify({
    title: snapshot.title,
    detail: snapshot.detail,
    chart: snapshot.chart,
    reason: snapshot.reason,
    metricResult: snapshot.metricResult ? {
      metric: snapshot.metricResult.metric,
      value: snapshot.metricResult.value,
      unit: snapshot.metricResult.unit,
      period: snapshot.metricResult.period,
      source: snapshot.metricResult.source,
      definition: snapshot.metricResult.definition,
      freshness: snapshot.metricResult.freshness,
      is_synthetic: snapshot.metricResult.is_synthetic,
      warning: snapshot.metricResult.warning,
    } : null,
  });
}
