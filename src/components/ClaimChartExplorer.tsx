"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MatchResponse } from "@/lib/types";
import { ChartTable, type CellRef } from "./ChartTable";
import { ClaimText } from "./ClaimText";
import { PassagePanel } from "./PassagePanel";
import { PatentFigure } from "./PatentFigure";
import { SummaryBar } from "./SummaryBar";

// A "discriminated union": the `status` field tells TypeScript which other
// fields exist, so `state.data` can only be read once status is "ready".
type FetchState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: MatchResponse };

/**
 * Top-level client component. It owns the app's state (the fetched chart and
 * the selected cell) and passes pieces down to presentational children as props.
 */
export function ClaimChartExplorer({ endpoint = "/api/match" }: { endpoint?: string }) {
  const [state, setState] = useState<FetchState>({ status: "loading" });
  const [selected, setSelected] = useState<CellRef | null>(null);
  // Bumping this number re-runs the fetch effect, which is how "Retry" works.
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // AbortController cancels the request if the component unmounts (or the
    // effect re-runs) before the response arrives, so we never set state on
    // a stale request.
    const controller = new AbortController();

    fetch(endpoint, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
        return res.json() as Promise<MatchResponse>;
      })
      .then((data) => setState({ status: "ready", data }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setState({ status: "error", message: err instanceof Error ? err.message : String(err) });
      });

    return () => controller.abort();
  }, [endpoint, attempt]);

  // useCallback keeps the same function identity between renders, so the
  // panel's Escape-key effect isn't torn down and re-added on every render.
  const closePanel = useCallback(() => setSelected(null), []);

  // On narrow screens the panel sits below the table, so bring it into view
  // when a cell is chosen. On wide screens it's already visible beside the table.
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (selected && window.matchMedia?.("(max-width: 1023px)").matches) {
      panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selected]);

  if (state.status === "loading") return <LoadingState />;

  if (state.status === "error") {
    return (
      <div role="alert" className="rounded-[2px] border border-rule-strong p-5">
        <p className="font-semibold">The claim chart could not be loaded.</p>
        <p className="mt-1 text-sm text-muted">{state.message}. Check that the dev server is running, then try again.</p>
        <button
          type="button"
          onClick={() => {
            setState({ status: "loading" });
            setAttempt((n) => n + 1);
          }}
          className="mt-4 rounded-[2px] bg-strong px-4 py-2 text-sm font-semibold text-on-strong transition-[filter] hover:brightness-110"
        >
          Retry
        </button>
      </div>
    );
  }

  const { data } = state;

  if (data.elements.length === 0 || data.priorArt.length === 0) {
    return (
      <div className="rounded-[2px] border border-dashed border-rule-strong p-10 text-center">
        <p className="font-semibold">Nothing to chart yet</p>
        <p className="mt-1 text-sm text-muted">
          Add claim elements and at least one prior-art reference to src/data/claimChart.json.
        </p>
      </div>
    );
  }

  // Values derived from state are computed during render, not stored in more state.
  const cell = selected
    ? data.cells.find((c) => c.elementId === selected.elementId && c.docId === selected.docId)
    : undefined;
  const element = data.elements.find((e) => e.id === selected?.elementId);
  const doc = data.priorArt.find((d) => d.id === selected?.docId);

  // Clicking an element in the claim text opens its closest reference.
  function pickElement(elementId: string) {
    const best = data.summary.find((s) => s.elementId === elementId)?.bestDocId;
    setSelected({ elementId, docId: best ?? data.priorArt[0].id });
  }

  return (
    <div className="flex flex-col gap-12">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] lg:gap-14">
        <section aria-labelledby="claim-heading">
          <h2 id="claim-heading" className="text-base font-semibold">
            Claim {data.patent.claimNumber}
          </h2>
          <p className="mt-1 text-[13px] text-muted">Select an element to see its closest passage.</p>
          <div className="mt-4">
            <ClaimText
              preamble={data.patent.preamble}
              elements={data.elements}
              summary={data.summary}
              selectedId={selected?.elementId ?? null}
              onPick={pickElement}
            />
          </div>
        </section>
        <SummaryBar
          elements={data.elements}
          docs={data.priorArt}
          summary={data.summary}
          onJump={(elementId, docId) => setSelected({ elementId, docId })}
        />
      </div>

      {/* minmax(0, …) lets the column shrink below the table's width, so the
          table scrolls inside its own box instead of widening the page. */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section aria-labelledby="chart-heading" className="flex min-w-0 flex-col gap-3">
          <h2 id="chart-heading" className="text-base font-semibold">
            Claim chart
          </h2>
          <ChartTable
            elements={data.elements}
            docs={data.priorArt}
            cells={data.cells}
            thresholds={data.thresholds}
            selected={selected}
            onSelect={setSelected}
          />
          <p className="text-[13px] text-muted">
            Arrow keys move between cells. Enter opens a cell and Escape closes it.
          </p>
        </section>

        <div ref={panelRef} className="scroll-mt-6 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-[2px] border border-rule p-5">
            {cell && element && doc ? (
              <PassagePanel element={element} doc={doc} cell={cell} onClose={closePanel} />
            ) : (
              <div>
                <h2 className="text-base font-semibold">Passage</h2>
                <p className="mt-1 text-sm text-muted">
                  Select a cell in the chart, or an element in the claim, to read the matching text from the
                  prior art.
                </p>
                <PatentFigure className="mt-6 border-t border-rule pt-6" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div role="status" aria-label="Loading claim chart" className="flex flex-col gap-12">
      <div className="grid gap-10 lg:grid-cols-[7fr_4fr] lg:gap-14">
        <div className="h-48 animate-pulse rounded-[2px] bg-surface" />
        <div className="h-48 animate-pulse rounded-[2px] bg-surface" />
      </div>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="h-[520px] animate-pulse rounded-[2px] bg-surface" />
        <div className="hidden h-64 animate-pulse rounded-[2px] bg-surface lg:block" />
      </div>
      <span className="sr-only">Loading claim chart</span>
    </div>
  );
}
