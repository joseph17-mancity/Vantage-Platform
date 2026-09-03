export type BenchmarkRecord = {
  gre: number;
  toefl: number;
  cgpa: number;
  outcome: 0 | 1;
};

export type BenchmarkSummary = {
  percentile: number;
  nearbyAdmits: number;
  nearbyApplicants: number;
  sampleSize: number;
};

export function summarizeBenchmark(records: BenchmarkRecord[], gpa: number): BenchmarkSummary {
  const belowOrEqual = records.filter((record) => record.cgpa <= gpa).length;
  const nearby = records.filter((record) => Math.abs(record.cgpa - gpa) <= 0.12);
  const nearbyAdmits = nearby.filter((record) => record.outcome === 1).length;

  return {
    percentile: Math.round((belowOrEqual / Math.max(records.length, 1)) * 100),
    nearbyAdmits,
    nearbyApplicants: nearby.length,
    sampleSize: records.length,
  };
}
