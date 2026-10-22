// Shapes of the raw data file (src/data/claimChart.json).

export interface Patent {
  id: string;
  number: string;
  title: string;
  assignee: string;
  filed: string;
  granted: string;
  url: string;
  claimNumber: number;
  preamble: string;
  claimText: string;
}

export interface ClaimElement {
  id: string; // e.g. "1a"
  label: string; // short human name for the row
  text: string; // exact claim language
}

export interface Passage {
  id: string;
  text: string;
}

export interface PriorArtDoc {
  id: string;
  number: string;
  title: string;
  assignee: string;
  filed: string;
  granted: string;
  url: string;
  passages: Passage[];
}

export interface ClaimChartData {
  patent: Patent;
  elements: ClaimElement[];
  priorArt: PriorArtDoc[];
}

// Shapes returned by GET /api/match.

export type Strength = "strong" | "partial" | "weak";

/** One cell of the chart: how well one prior-art doc covers one claim element. */
export interface MatchCell {
  elementId: string;
  docId: string;
  score: number; // cosine similarity, 0..1
  strength: Strength;
  bestPassageId: string | null;
  bestSentence: string | null; // the sentence within that passage that scored highest
  matchedTerms: string[]; // words shared by the element and the best sentence
}

export interface ElementSummary {
  elementId: string;
  bestScore: number;
  bestDocId: string | null;
  strength: Strength;
}

export interface MatchResponse {
  patent: Patent;
  elements: ClaimElement[];
  priorArt: PriorArtDoc[];
  cells: MatchCell[];
  summary: ElementSummary[];
  thresholds: { strong: number; partial: number };
}
