import { computeIdf, cosine, splitSentences, stem, tokenize, vectorize } from "@/lib/tfidf";

describe("stem", () => {
  it("collapses common inflections to one stem", () => {
    expect(new Set(["order", "orders", "ordered", "ordering"].map(stem))).toEqual(new Set(["order"]));
    expect(new Set(["store", "stored", "storing"].map(stem))).toEqual(new Set(["stor"]));
  });

  it("matches identifier with identification", () => {
    expect(stem("identifier")).toBe(stem("identification"));
    expect(stem("identified")).toBe(stem("identifying"));
  });
});

describe("tokenize", () => {
  it("drops stopwords, short words and numbers", () => {
    const stems = tokenize("The server, in step 24, sends a request to it.").map((t) => t.stem);
    expect(stems).toEqual(["server", "send", "request"]);
  });
});

describe("splitSentences", () => {
  it("does not split on patent abbreviations", () => {
    const text = "An example is shown in FIG. 5. See U.S. Pat. No. 4,115,870 for details. Done.";
    expect(splitSentences(text)).toEqual([
      "An example is shown in FIG. 5.",
      "See U.S. Pat. No. 4,115,870 for details.",
      "Done.",
    ]);
  });
});

describe("TF-IDF cosine", () => {
  const corpus = ["shopping cart server", "shopping cart browser", "single action order"].map(tokenize);
  const idf = computeIdf(corpus);

  it("gives rarer words a higher IDF", () => {
    expect(idf.get(stem("single"))!).toBeGreaterThan(idf.get(stem("shopping"))!);
  });

  it("is 1 for identical text and 0 for disjoint text", () => {
    const a = vectorize(tokenize("shopping cart server"), idf);
    const b = vectorize(tokenize("single action order"), idf);
    expect(cosine(a, a)).toBeCloseTo(1);
    expect(cosine(a, b)).toBe(0);
  });

  it("returns 0 rather than NaN for empty text", () => {
    expect(cosine(new Map(), new Map())).toBe(0);
  });
});
