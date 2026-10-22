import type { Strength } from "@/lib/types";

/**
 * Show a score with fixed decimals, truncated rather than rounded, so 0.149
 * reads as "0.14" and never looks like it reached the 0.15 threshold.
 */
export function formatScore(score: number, digits = 2): string {
  const factor = 10 ** digits;
  return (Math.floor(score * factor) / factor).toFixed(digits);
}

// One place for how each match strength looks, so the table, claim text and
// legend always agree. Strength is one blue hue, darker = stronger, and every
// cell also prints its score, so color is never the only signal.
export const STRENGTH_STYLES: Record<
  Strength,
  { label: string; cell: string; swatch: string; underline: string }
> = {
  strong: {
    label: "Strong match",
    cell: "bg-strong text-on-strong",
    swatch: "bg-strong",
    underline: "decoration-strong decoration-[3px]",
  },
  partial: {
    label: "Partial match",
    cell: "bg-partial text-on-partial",
    swatch: "bg-partial",
    underline: "decoration-partial decoration-[3px]",
  },
  weak: {
    label: "No strong match",
    cell: "bg-bg text-muted",
    swatch: "bg-bg ring-1 ring-inset ring-rule-strong",
    underline: "decoration-rule-strong decoration-1 decoration-dashed",
  },
};
