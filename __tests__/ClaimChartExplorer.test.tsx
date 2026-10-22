import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import data from "@/data/claimChart.json";
import { ClaimChartExplorer } from "@/components/ClaimChartExplorer";
import { buildClaimChart } from "@/lib/matcher";
import type { ClaimChartData } from "@/lib/types";

const chart = buildClaimChart(data as ClaimChartData);

// Replace the browser's fetch with a fake that returns our chart, so the test
// doesn't need a running server.
function mockFetch(response: Partial<Response>) {
  global.fetch = jest.fn().mockResolvedValue(response) as jest.Mock;
}

afterEach(() => jest.restoreAllMocks());

describe("<ClaimChartExplorer />", () => {
  it("shows a loading state, then the chart", async () => {
    mockFetch({ ok: true, json: async () => chart });
    render(<ClaimChartExplorer />);

    expect(screen.getByRole("status", { name: /loading/i })).toBeInTheDocument();
    const grid = await screen.findByRole("grid", { name: "Claim chart" });

    // A header row plus one row per claim element.
    expect(within(grid).getAllByRole("row")).toHaveLength(chart.elements.length + 1);
    expect(global.fetch).toHaveBeenCalledWith("/api/match", expect.anything());
  });

  it("opens the passage panel on click and closes it with Escape", async () => {
    const user = userEvent.setup();
    mockFetch({ ok: true, json: async () => chart });
    render(<ClaimChartExplorer />);

    const cell = await screen.findByRole("button", { name: /Element 1d vs US 4,734,858/ });
    await user.click(cell);

    const panel = screen.getByRole("complementary", { name: "Matching passage" });
    expect(within(panel).getByText("Retrieve stored purchaser info")).toBeInTheDocument();
    expect(within(panel).getAllByRole("mark").length).toBeGreaterThan(0);
    expect(within(panel).getByTestId("best-sentence")).toBeInTheDocument();
    expect(cell).toHaveAttribute("aria-pressed", "true");

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("complementary", { name: "Matching passage" })).not.toBeInTheDocument();
  });

  it("opens an element's closest passage from the claim text, by click or Enter", async () => {
    const user = userEvent.setup();
    mockFetch({ ok: true, json: async () => chart });
    render(<ClaimChartExplorer />);

    const best = chart.summary.find((s) => s.elementId === "1b")!;
    const bestDoc = chart.priorArt.find((d) => d.id === best.bestDocId)!;

    await user.click(await screen.findByRole("button", { name: /^Element 1b, / }));
    const panel = screen.getByRole("complementary", { name: "Matching passage" });
    expect(within(panel).getByText(`${bestDoc.number}, ${bestDoc.title}`)).toBeInTheDocument();

    await user.keyboard("{Escape}");
    screen.getByRole("button", { name: /^Element 1a, / }).focus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("complementary", { name: "Matching passage" })).toBeInTheDocument();
  });

  it("moves focus between cells with the arrow keys", async () => {
    const user = userEvent.setup();
    mockFetch({ ok: true, json: async () => chart });
    render(<ClaimChartExplorer />);

    const first = await screen.findByRole("button", { name: /Element 1a vs US 4,734,858/ });
    first.focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("button", { name: /Element 1a vs US 5,715,314/ })).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("button", { name: /Element 1b vs US 5,715,314/ })).toHaveFocus();
  });

  it("lists elements without a strong match in the summary", async () => {
    mockFetch({ ok: true, json: async () => chart });
    render(<ClaimChartExplorer />);

    const summary = await screen.findByRole("region", { name: "Coverage" });
    const gaps = chart.summary.filter((s) => s.strength !== "strong");
    expect(within(summary).getByText(new RegExp(`${chart.summary.length - gaps.length} of`))).toBeInTheDocument();
    expect(within(summary).getByText(/Single-action request/)).toBeInTheDocument();
  });

  it("shows an error with a working retry button", async () => {
    const user = userEvent.setup();
    mockFetch({ ok: false, status: 500 });
    render(<ClaimChartExplorer />);

    expect(await screen.findByRole("alert")).toHaveTextContent("status 500");

    mockFetch({ ok: true, json: async () => chart });
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByRole("grid")).toBeInTheDocument();
  });

  it("shows an empty state when there is nothing to chart", async () => {
    mockFetch({ ok: true, json: async () => ({ ...chart, elements: [], cells: [], summary: [] }) });
    render(<ClaimChartExplorer />);
    expect(await screen.findByText("Nothing to chart yet")).toBeInTheDocument();
  });
});
