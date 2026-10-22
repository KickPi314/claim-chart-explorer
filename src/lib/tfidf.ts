// A small, dependency-free TF-IDF + cosine similarity implementation.
//
// TF-IDF turns each piece of text into a vector of word weights:
//   - TF (term frequency): how often a word appears in this text.
//   - IDF (inverse document frequency): how rare the word is across all texts.
// Multiplying them means words that are frequent here but rare elsewhere
// ("purchaser", "cart") count a lot, and words that appear everywhere
// ("computer", "user") count a little. Cosine similarity then measures the
// angle between two vectors: 1 = same word mix, 0 = no words in common.

const STOPWORDS = new Set(
  `a about above after again all also an and any are as at be been before being
  below between both but by can could did do does each either for from further
  had has have having he her here his how i if in into is it its itself may more
  most must no nor not of on once only or other our out over own same she should
  so some such than that the their them then there these they this those through
  to too under until up upon very was we were what when where which while who
  whom why will with would you your
  said wherein whereby thereof therein herein hereby comprising comprises
  includes including fig figs step steps`.split(/\s+/),
);

/** Reduce a word to a crude stem so "ordering", "ordered" and "orders" all match "order". */
export function stem(word: string): string {
  let w = word.toLowerCase();
  if (w.length > 4 && w.endsWith("ies")) w = w.slice(0, -3) + "y";
  else if (w.endsWith("sses")) w = w.slice(0, -2);
  else if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) w = w.slice(0, -1);

  // "identification", "identifier", "identified", "identifying" -> "ident".
  const ify = w.match(/^(.{3,})if(?:ication|ier|ied|ying|y)$/);
  if (ify) return ify[1];

  if (w.length > 5 && w.endsWith("ing")) w = w.slice(0, -3);
  else if (w.length > 4 && w.endsWith("ed")) w = w.slice(0, -2);
  else if (w.length > 7 && w.endsWith("ment")) w = w.slice(0, -4);

  // "store" / "stored" / "storing" all end up as "stor".
  if (w.length > 3 && w.endsWith("e")) w = w.slice(0, -1);
  return w;
}

export interface Token {
  surface: string; // the word as written
  stem: string;
}

/** Split text into meaningful tokens: letters only, no stopwords, no 1-2 letter words. */
export function tokenize(text: string): Token[] {
  const words = text.match(/[A-Za-z]+/g) ?? [];
  const tokens: Token[] = [];
  for (const surface of words) {
    const lower = surface.toLowerCase();
    if (lower.length < 3 || STOPWORDS.has(lower)) continue;
    tokens.push({ surface, stem: stem(lower) });
  }
  return tokens;
}

// Abbreviations that end in a period but don't end a sentence.
const ABBREVIATION = /(?:\b[A-Z]|U\.S|Pat|No|Nos|FIG|FIGS|Ser|e\.g|i\.e|etc)\.$/;

/** Split a paragraph into sentences without breaking on "FIG." or "U.S. Pat. No.". */
export function splitSentences(text: string): string[] {
  const pieces = text.split(/(?<=[.?!])\s+(?=[A-Z("])/);
  const sentences: string[] = [];
  for (const piece of pieces) {
    const prev = sentences[sentences.length - 1];
    if (prev !== undefined && ABBREVIATION.test(prev)) sentences[sentences.length - 1] = `${prev} ${piece}`;
    else sentences.push(piece);
  }
  return sentences;
}

export type Vector = Map<string, number>;

/**
 * Inverse document frequency for every stem in the corpus.
 * Uses the smoothed form idf = ln((1 + N) / (1 + df)) + 1, so no word gets a
 * weight of exactly 0 and we never divide by zero.
 */
export function computeIdf(corpus: Token[][]): Map<string, number> {
  const df = new Map<string, number>();
  for (const doc of corpus) {
    for (const s of new Set(doc.map((t) => t.stem))) {
      df.set(s, (df.get(s) ?? 0) + 1);
    }
  }
  const n = corpus.length;
  const idf = new Map<string, number>();
  for (const [s, count] of df) {
    idf.set(s, Math.log((1 + n) / (1 + count)) + 1);
  }
  return idf;
}

/** Build a TF-IDF vector: raw term count times IDF. Cosine handles length normalization. */
export function vectorize(tokens: Token[], idf: Map<string, number>): Vector {
  const v: Vector = new Map();
  for (const { stem: s } of tokens) {
    v.set(s, (v.get(s) ?? 0) + (idf.get(s) ?? 1));
  }
  return v;
}

export function cosine(a: Vector, b: Vector): number {
  let dot = 0;
  // Iterate over the smaller vector; only shared terms contribute to the dot product.
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  for (const [term, weight] of small) {
    const other = large.get(term);
    if (other !== undefined) dot += weight * other;
  }
  const norm = (v: Vector) => Math.sqrt([...v.values()].reduce((sum, x) => sum + x * x, 0));
  const denom = norm(a) * norm(b);
  return denom === 0 ? 0 : dot / denom;
}

/** Stems present in both vectors, heaviest combined weight first. */
export function sharedTerms(a: Vector, b: Vector): string[] {
  return [...a.keys()]
    .filter((t) => b.has(t))
    .sort((x, y) => a.get(y)! * b.get(y)! - a.get(x)! * b.get(x)!);
}
