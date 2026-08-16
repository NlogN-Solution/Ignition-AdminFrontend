/**
 * No `/dashboard/stats` or time-series endpoint exists on the backend yet — every count in this
 * module is a real total pulled from the relevant list endpoint (`limit=1`, reading `total`).
 * The one exception is the sparkline/trend shown on each stat card: there is no history endpoint
 * to derive a real 7-point trend from, so `syntheticSeries` fabricates a small, deterministic
 * series around the real current total purely for the visual. Replace this function (only this
 * function) once a real analytics endpoint exists — nothing else in the UI needs to change.
 */
export function syntheticSeries(seed: string, current: number): { sparkline: number[]; trend: number } {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 100000;
  }
  const points = 7;
  const base = Math.max(current * 0.7, 1);
  const sparkline = Array.from({ length: points }, (_, i) => {
    const wobble = Math.sin(hash + i * 1.7) * 0.15 + 1;
    const progress = i / (points - 1);
    return Math.max(0, Math.round((base + (current - base) * progress) * wobble));
  });
  sparkline[points - 1] = current;
  const trend = sparkline[0] === 0 ? 0 : Math.round(((current - sparkline[0]) / sparkline[0]) * 100);
  return { sparkline, trend };
}
