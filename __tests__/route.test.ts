/**
 * @jest-environment node
 */
import { GET } from "@/app/api/match/route";
import type { MatchResponse } from "@/lib/types";

describe("GET /api/match", () => {
  it("returns the scored chart as JSON", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");

    const body = (await res.json()) as MatchResponse;
    expect(body.elements.length).toBeGreaterThan(0);
    expect(body.cells).toHaveLength(body.elements.length * body.priorArt.length);
    expect(body.summary).toHaveLength(body.elements.length);
  });
});
