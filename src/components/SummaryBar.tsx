import type { ClaimElement, ElementSummary, PriorArtDoc } from "@/lib/types";
import { formatScore, STRENGTH_STYLES } from "./strength";

interface SummaryBarProps {
  elements: ClaimElement[];
  docs: PriorArtDoc[];
  summary: ElementSummary[];
  onJump: (elementId: string, docId: string) => void;
}

/**
 * Coverage in one sentence, then the elements with no strong match. Those are
 * where a novelty argument would start, so each links to its closest passage.
 */
export function SummaryBar({ elements, docs, summary, onJump }: SummaryBarProps) {
  const label = (id: string) => elements.find((e) => e.id === id)?.label ?? id;
  const docNumber = (id: string | null) => docs.find((d) => d.id === id)?.number ?? "none";
  const gaps = summary.filter((s) => s.strength !== "strong");
  const strongCount = summary.length - gaps.length;

  return (
    <section aria-labelledby="summary-heading" className="flex flex-col gap-4">
      <h2 id="summary-heading" className="text-base font-semibold">
        Coverage
      </h2>
      <p className="text-[15px] leading-relaxed text-muted">
        <strong className="font-semibold text-ink">
          {strongCount} of {summary.length} elements
        </strong>{" "}
        have a strong match in at least one reference.
      </p>

      {gaps.length === 0 ? (
        <p className="text-[15px] text-muted">There are no uncovered elements.</p>
      ) : (
        <div>
          <h3 className="text-sm font-semibold">No strong match</h3>
          <ul className="mt-2 divide-y divide-rule border-y border-rule">
            {gaps.map((g) => (
              <li key={g.elementId} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0 text-sm">
                  <p>
                    <span className="mr-2 font-semibold">{g.elementId}</span>
                    {label(g.elementId)}
                  </p>
                  <p className="mt-0.5 text-[13px] text-muted">
                    Closest is {formatScore(g.bestScore)} in {docNumber(g.bestDocId)}
                  </p>
                </div>
                {g.bestDocId && (
                  <button
                    type="button"
                    onClick={() => onJump(g.elementId, g.bestDocId!)}
                    aria-label={`Show closest passage for ${g.elementId}`}
                    className="shrink-0 rounded-[2px] border border-rule-strong px-3 py-1.5 text-[13px] font-medium transition-colors hover:bg-surface"
                  >
                    Show passage
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Legend />
    </section>
  );
}

function Legend() {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-muted" aria-label="Legend">
      {(Object.keys(STRENGTH_STYLES) as (keyof typeof STRENGTH_STYLES)[]).map((s) => (
        <li key={s} className="flex items-center gap-2">
          <span className={`inline-block h-3 w-5 rounded-[2px] ${STRENGTH_STYLES[s].swatch}`} />
          {STRENGTH_STYLES[s].label}
        </li>
      ))}
    </ul>
  );
}
