"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import type { ClaimElement, MatchCell, MatchResponse, PriorArtDoc } from "@/lib/types";
import { formatScore, STRENGTH_STYLES } from "./strength";

export interface CellRef {
  elementId: string;
  docId: string;
}

interface ChartTableProps {
  elements: ClaimElement[];
  docs: PriorArtDoc[];
  cells: MatchCell[];
  thresholds: MatchResponse["thresholds"];
  selected: CellRef | null;
  onSelect: (cell: CellRef) => void;
}

/**
 * The claim chart: one row per claim element, one column per prior-art doc.
 *
 * Keyboard support uses a "roving tabindex": only one cell is in the Tab
 * order at a time, and the arrow keys move focus between cells. Enter or
 * Space opens a cell, which is free because each cell is a real <button>.
 */
export function ChartTable({ elements, docs, cells, thresholds, selected, onSelect }: ChartTableProps) {
  // Which cell holds keyboard focus. This is local UI state, so it lives here
  // rather than in the parent.
  const [focus, setFocus] = useState({ row: 0, col: 0 });
  const buttons = useRef(new Map<string, HTMLButtonElement>());

  const key = (row: number, col: number) => `${row}:${col}`;
  const cellAt = (elementId: string, docId: string) =>
    cells.find((c) => c.elementId === elementId && c.docId === docId);

  function moveFocus(row: number, col: number) {
    const r = Math.max(0, Math.min(elements.length - 1, row));
    const c = Math.max(0, Math.min(docs.length - 1, col));
    setFocus({ row: r, col: c });
    buttons.current.get(key(r, c))?.focus();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>, row: number, col: number) {
    const moves: Record<string, [number, number]> = {
      ArrowUp: [row - 1, col],
      ArrowDown: [row + 1, col],
      ArrowLeft: [row, col - 1],
      ArrowRight: [row, col + 1],
      Home: [row, 0],
      End: [row, docs.length - 1],
    };
    const next = moves[e.key];
    if (next) {
      e.preventDefault(); // stop the page from scrolling
      moveFocus(...next);
    }
  }

  return (
    <div className="overflow-x-auto rounded-[2px] border border-rule">
      <table role="grid" aria-label="Claim chart" className="w-full min-w-[680px] border-collapse text-sm">
        <caption className="border-b border-rule bg-surface px-3 py-2 text-left text-[13px] text-muted">
          Cosine similarity of each element to its best sentence in each reference. Strong is{" "}
          {thresholds.strong} or more, partial is {thresholds.partial} or more.
        </caption>
        <thead>
          <tr className="border-b border-rule">
            <th scope="col" className="w-[44%] px-3 py-2.5 text-left align-bottom text-[13px] font-semibold">
              Claim element
            </th>
            {docs.map((doc) => (
              <th
                key={doc.id}
                scope="col"
                className="border-l border-rule px-3 py-2.5 text-left align-bottom font-normal"
              >
                <span className="block text-[13px] font-semibold">{doc.number}</span>
                <span className="mt-0.5 block text-[13px] leading-snug text-muted">{doc.title}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {elements.map((element, row) => (
            <tr key={element.id} className="border-b border-rule last:border-b-0">
              <th scope="row" className="px-3 py-3 text-left align-top font-normal">
                <span className="block font-semibold">
                  <span className="mr-2 text-muted">{element.id}</span>
                  {element.label}
                </span>
                <span className="mt-1 block text-[13px] leading-relaxed text-muted">{element.text}</span>
              </th>
              {docs.map((doc, col) => {
                const cell = cellAt(element.id, doc.id);
                if (!cell) return <td key={doc.id} className="border-l border-rule" />;
                const style = STRENGTH_STYLES[cell.strength];
                const isSelected =
                  selected?.elementId === element.id && selected?.docId === doc.id;
                return (
                  // h-px on the cell lets the button's h-full fill the whole row height.
                  <td key={doc.id} className="h-px border-l border-rule p-0">
                    <button
                      type="button"
                      ref={(el) => {
                        if (el) buttons.current.set(key(row, col), el);
                        else buttons.current.delete(key(row, col));
                      }}
                      tabIndex={focus.row === row && focus.col === col ? 0 : -1}
                      onFocus={() => setFocus({ row, col })}
                      onKeyDown={(e) => handleKeyDown(e, row, col)}
                      onClick={() => onSelect({ elementId: element.id, docId: doc.id })}
                      aria-pressed={isSelected}
                      aria-label={`Element ${element.id} vs ${doc.number}: ${style.label}, score ${formatScore(cell.score)}`}
                      title={`${style.label}, ${formatScore(cell.score, 3)}`}
                      className={`flex h-full min-h-16 w-full items-center justify-center text-[15px] font-medium tabular-nums transition-[filter] hover:brightness-95 focus-visible:-outline-offset-2 ${style.cell} ${
                        isSelected ? "shadow-[inset_0_0_0_2px_var(--ink)]" : ""
                      }`}
                    >
                      {formatScore(cell.score)}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
