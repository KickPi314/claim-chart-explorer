import type { ClaimElement, ElementSummary } from "@/lib/types";
import { STRENGTH_STYLES } from "./strength";

interface ClaimTextProps {
  preamble: string;
  elements: ClaimElement[];
  summary: ElementSummary[];
  selectedId: string | null;
  onPick: (elementId: string) => void;
}

/**
 * The claim itself, set as patent text. Each element is underlined by its best
 * coverage across all references: solid dark blue for strong, light blue for
 * partial, dashed gray for no strong match. Clicking an element opens its
 * closest passage.
 */
export function ClaimText({ preamble, elements, summary, selectedId, onPick }: ClaimTextProps) {
  const strengthOf = (id: string) => summary.find((s) => s.elementId === id)?.strength ?? "weak";

  return (
    <p className="font-serif text-[18px] leading-[2.1] sm:text-[19px]">
      {preamble}{" "}
      {elements.map((element) => {
        const style = STRENGTH_STYLES[strengthOf(element.id)];
        const isSelected = selectedId === element.id;
        return (
          <span key={element.id}>
            <sup className="mr-0.5 font-sans text-[11px] font-semibold text-muted">{element.id}</sup>
            {/* A <button> can't wrap across lines like text (browsers render it as
                inline-block), so this is a span given button semantics by hand. */}
            <span
              role="button"
              tabIndex={0}
              onClick={() => onPick(element.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onPick(element.id);
                }
              }}
              aria-label={`Element ${element.id}, ${element.label}: ${style.label}`}
              aria-pressed={isSelected}
              className={`cursor-pointer rounded-[2px] underline underline-offset-[6px] transition-colors hover:bg-surface ${style.underline} ${
                isSelected ? "bg-surface" : ""
              }`}
            >
              {element.text}
            </span>{" "}
          </span>
        );
      })}
    </p>
  );
}
