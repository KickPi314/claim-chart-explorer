import {
  computeIdf,
  cosine,
  sharedTerms,
  splitSentences,
  tokenize,
  vectorize,
  type Token,
  type Vector,
} from "./tfidf";
import type {
  ClaimChartData,
  ElementSummary,
  MatchCell,
  MatchResponse,
  Strength,
} from "./types";

// Cut-offs for coloring cells. Chosen by looking at the score spread on the
// sample data: unrelated sentences land under ~0.15, and sentences that
// restate the element's key terms land above ~0.23.
export const THRESHOLDS = { strong: 0.23, partial: 0.15 } as const;

export function strengthFor(score: number): Strength {
  if (score >= THRESHOLDS.strong) return "strong";
  if (score >= THRESHOLDS.partial) return "partial";
  return "weak";
}

/** Map each stem back to the first way it was written in the claim element, for display. */
function surfaceForms(tokens: Token[]): Map<string, string> {
  const forms = new Map<string, string>();
  for (const t of tokens) if (!forms.has(t.stem)) forms.set(t.stem, t.surface.toLowerCase());
  return forms;
}

interface Sentence {
  passageId: string;
  text: string;
  vector: Vector;
}

/**
 * Score every claim element against every sentence of every prior-art
 * document. A cell's score is its best sentence's score. Matching against
 * sentences rather than whole paragraphs stops a short claim element from
 * being diluted by a long paragraph that only matches in one place.
 */
export function buildClaimChart(data: ClaimChartData): MatchResponse {
  const elementTokens = data.elements.map((e) => tokenize(e.text));

  // IDF uses whole passages (plus the claim elements) as its "documents", so
  // words common to the whole domain ("computer", "user") are down-weighted.
  const idf = computeIdf([
    ...elementTokens,
    ...data.priorArt.flatMap((doc) => doc.passages.map((p) => tokenize(p.text))),
  ]);

  const elementVecs = elementTokens.map((t) => vectorize(t, idf));
  const docSentences: Sentence[][] = data.priorArt.map((doc) =>
    doc.passages.flatMap((p) =>
      splitSentences(p.text).map((text) => ({
        passageId: p.id,
        text,
        vector: vectorize(tokenize(text), idf),
      })),
    ),
  );

  const cells: MatchCell[] = [];
  data.elements.forEach((element, ei) => {
    const forms = surfaceForms(elementTokens[ei]);
    data.priorArt.forEach((doc, di) => {
      let best: { score: number; sentence: Sentence | null } = { score: 0, sentence: null };
      for (const sentence of docSentences[di]) {
        const score = cosine(elementVecs[ei], sentence.vector);
        if (score > best.score) best = { score, sentence };
      }
      cells.push({
        elementId: element.id,
        docId: doc.id,
        score: best.score,
        strength: strengthFor(best.score),
        bestPassageId: best.sentence?.passageId ?? null,
        bestSentence: best.sentence?.text ?? null,
        matchedTerms: best.sentence
          ? sharedTerms(elementVecs[ei], best.sentence.vector).map((s) => forms.get(s) ?? s)
          : [],
      });
    });
  });

  const summary: ElementSummary[] = data.elements.map((element) => {
    const row = cells.filter((c) => c.elementId === element.id);
    const top = row.reduce<MatchCell | null>((a, c) => (!a || c.score > a.score ? c : a), null);
    const bestScore = top?.score ?? 0;
    return {
      elementId: element.id,
      bestScore,
      bestDocId: top && top.score > 0 ? top.docId : null,
      strength: strengthFor(bestScore),
    };
  });

  return { ...data, cells, summary, thresholds: { ...THRESHOLDS } };
}
