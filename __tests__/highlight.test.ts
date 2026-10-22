import { highlightSegments } from "@/lib/highlight";

describe("highlightSegments", () => {
  it("highlights words whose stem matches, keeping punctuation intact", () => {
    const segments = highlightSegments("Orders are stored, then ordered.", ["order"]);
    expect(segments).toEqual([
      { text: "Orders", match: true },
      { text: " are stored, then ", match: false },
      { text: "ordered", match: true },
      { text: ".", match: false },
    ]);
    expect(segments.map((s) => s.text).join("")).toBe("Orders are stored, then ordered.");
  });

  it("returns the whole text unhighlighted when there are no terms", () => {
    expect(highlightSegments("Nothing here", [])).toEqual([{ text: "Nothing here", match: false }]);
  });
});
