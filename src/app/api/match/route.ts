import data from "@/data/claimChart.json";
import { buildClaimChart } from "@/lib/matcher";
import type { ClaimChartData } from "@/lib/types";

// GET /api/match
// Scores every claim element against every prior-art passage and returns the
// whole chart as JSON. It reads only a bundled file, so Next.js can prerender
// it at build time and serve it as a static response.
export async function GET() {
  const chart = buildClaimChart(data as ClaimChartData);
  return Response.json(chart);
}
