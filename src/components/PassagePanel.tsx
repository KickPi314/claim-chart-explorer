"use client";

import { useEffect } from "react";
import { highlightSegments } from "@/lib/highlight";
import type { ClaimElement, MatchCell, PriorArtDoc } from "@/lib/types";
import { formatScore, STRENGTH_STYLES } from "./strength";

interface PassagePanelProps {
  element: ClaimElement;
  doc: PriorArtDoc;
  cell: MatchCell;
  onClose: () => void;
}

/** Side panel showing the best-matching prior-art passage for the selected cell. */
export function PassagePanel({ element, doc, cell, onClose }: PassagePanelProps) {
  const passage = doc.passages.find((p) => p.id === cell.bestPassageId);
  const style = STRENGTH_STYLES[cell.strength];

  // Escape closes the panel from anywhere on the page. The cleanup function
  // removes the listener when the panel unmounts or onClose changes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <aside aria-label="Matching passage" aria-live="polite" className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold leading-snug">
            <span className="mr-2 text-muted">{element.id}</span>
            <span>{element.label}</span>
          </h2>
          <p className="mt-1 text-[13px] text-muted">
            {doc.number}, {doc.title}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close passage panel"
          className="shrink-0 rounded-[2px] border border-rule-strong px-2.5 py-1 text-[13px] font-medium transition-colors hover:bg-surface"
        >
          Close
        </button>
      </div>

      <p className="flex items-center gap-2 text-sm">
        <span className={`inline-block h-3 w-5 rounded-[2px] ${style.swatch}`} />
        {style.label}, score <span className="font-semibold tabular-nums">{formatScore(cell.score, 3)}</span>
      </p>

      <section>
        <h3 className="text-[13px] font-semibold">Claim language</h3>
        <p className="mt-1.5 font-serif text-[15px] leading-[1.75]">
          <Highlighted text={element.text} terms={cell.matchedTerms} />
        </p>
      </section>

      <section>
        <h3 className="text-[13px] font-semibold">Best passage</h3>
        {passage ? (
          <blockquote className="mt-1.5 border-l-2 border-rule pl-4 font-serif text-[15px] leading-[1.75]">
            <PassageText text={passage.text} sentence={cell.bestSentence} terms={cell.matchedTerms} />
          </blockquote>
        ) : (
          <p className="mt-1.5 text-sm text-muted">No passage in this reference shares a word with the element.</p>
        )}
      </section>

      {cell.matchedTerms.length > 0 && (
        <p className="text-[13px] text-muted">
          Shared words:{" "}
          {cell.matchedTerms.map((t, i) => (
            <span key={t}>
              <mark className="rounded-[2px] bg-mark px-1 text-ink">{t}</mark>
              {i < cell.matchedTerms.length - 1 ? " " : ""}
            </span>
          ))}
        </p>
      )}

      <a
        href={doc.url}
        target="_blank"
        rel="noopener noreferrer"
        className="self-start text-sm font-medium text-strong underline underline-offset-4 hover:decoration-2"
      >
        Open {doc.number} on Google Patents
      </a>
    </aside>
  );
}

/** The full passage. The best-scoring sentence stays in full ink; the rest is muted. */
function PassageText({ text, sentence, terms }: { text: string; sentence: string | null; terms: string[] }) {
  const start = sentence ? text.indexOf(sentence) : -1;
  if (!sentence || start < 0) return <Highlighted text={text} terms={terms} />;
  const end = start + sentence.length;
  return (
    <>
      <span className="text-muted">
        <Highlighted text={text.slice(0, start)} terms={terms} />
      </span>
      <span data-testid="best-sentence" className="font-bold text-ink">
        <Highlighted text={sentence} terms={terms} />
      </span>
      <span className="text-muted">
        <Highlighted text={text.slice(end)} terms={terms} />
      </span>
    </>
  );
}

function Highlighted({ text, terms }: { text: string; terms: string[] }) {
  return (
    <>
      {highlightSegments(text, terms).map((seg, i) =>
        seg.match ? (
          <mark key={i} className="rounded-[2px] bg-mark px-0.5 text-inherit">
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </>
  );
}
