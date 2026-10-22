import { stem } from "./tfidf";

export interface Segment {
  text: string;
  match: boolean;
}

/**
 * Split text into plain and highlighted segments. A word is highlighted when
 * its stem is one of `terms` (given as written or already stemmed), so the
 * highlighting agrees with how the scorer matched words.
 */
export function highlightSegments(text: string, terms: string[]): Segment[] {
  const wanted = new Set(terms.map((t) => stem(t)));
  if (wanted.size === 0) return [{ text, match: false }];

  const segments: Segment[] = [];
  const push = (part: string, match: boolean) => {
    const last = segments[segments.length - 1];
    if (last && last.match === match) last.text += part;
    else segments.push({ text: part, match });
  };

  // Splitting on a capture group keeps the separators as their own entries.
  for (const part of text.split(/([A-Za-z]+)/)) {
    if (!part) continue;
    const isWord = /^[A-Za-z]+$/.test(part);
    push(part, isWord && part.length >= 3 && wanted.has(stem(part)));
  }
  return segments;
}
