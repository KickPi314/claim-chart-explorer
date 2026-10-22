import data from "@/data/claimChart.json";
import { buildClaimChart, strengthFor, THRESHOLDS } from "@/lib/matcher";
import type { ClaimChartData } from "@/lib/types";

const tiny: ClaimChartData = {
  patent: {
    id: "P",
    number: "P-1",
    title: "Test",
    assignee: "Test",
    filed: "2000-01-01",
    granted: "2001-01-01",
    url: "https://example.com",
    claimNumber: 1,
    preamble: "A method comprising:",
    claimText: "A method comprising: storing customer addresses; launching a rocket.",
  },
  elements: [
    { id: "1a", label: "Store addresses", text: "storing customer shipping addresses in a database" },
    { id: "1b", label: "Rocket", text: "launching a rocket into orbit" },
  ],
  priorArt: [
    {
      id: "D1",
      number: "D-1",
      title: "Address book",
      assignee: "A",
      filed: "1990-01-01",
      granted: "1991-01-01",
      url: "https://example.com/d1",
      passages: [
        { id: "D1-p1", text: "The database stores each customer's shipping addresses. It is fast." },
        { id: "D1-p2", text: "A keyboard is attached to the terminal." },
      ],
    },
  ],
};

describe("buildClaimChart", () => {
  const chart = buildClaimChart(tiny);

  it("produces one cell per element and document", () => {
    expect(chart.cells).toHaveLength(tiny.elements.length * tiny.priorArt.length);
  });

  it("picks the passage and sentence that actually match", () => {
    const cell = chart.cells.find((c) => c.elementId === "1a")!;
    expect(cell.bestPassageId).toBe("D1-p1");
    expect(cell.bestSentence).toBe("The database stores each customer's shipping addresses.");
    expect(cell.strength).toBe("strong");
    expect(cell.matchedTerms).toEqual(expect.arrayContaining(["customer", "shipping", "addresses"]));
  });

  it("flags an element with nothing in common as a weak match with no passage", () => {
    const cell = chart.cells.find((c) => c.elementId === "1b")!;
    expect(cell.score).toBe(0);
    expect(cell.bestPassageId).toBeNull();
    expect(chart.summary.find((s) => s.elementId === "1b")).toMatchObject({
      strength: "weak",
      bestDocId: null,
    });
  });
});

describe("strengthFor", () => {
  it("buckets scores at the thresholds", () => {
    expect(strengthFor(THRESHOLDS.strong)).toBe("strong");
    expect(strengthFor(THRESHOLDS.partial)).toBe("partial");
    expect(strengthFor(THRESHOLDS.partial - 0.01)).toBe("weak");
  });
});

describe("sample data", () => {
  const chart = buildClaimChart(data as ClaimChartData);

  it("keeps every score between 0 and 1", () => {
    for (const c of chart.cells) {
      expect(c.score).toBeGreaterThanOrEqual(0);
      expect(c.score).toBeLessThanOrEqual(1);
    }
  });

  it("does not find strong prior art for the single-action element", () => {
    expect(chart.summary.find((s) => s.elementId === "1b")!.strength).not.toBe("strong");
  });
});
