import type { Match, KGramIndex } from './types';
import { createKGram } from './tokenizer';

/**
 * Builds a k-gram index from an array of tokens
 *
 * @param tokens - Array of tokens
 * @param k - Length of k-grams (default: 5)
 * @returns Map from k-gram strings to arrays of starting positions
 */
export function buildKGramIndex(tokens: string[], k: number = 5): KGramIndex {
  const index: KGramIndex = new Map();

  for (let i = 0; i <= tokens.length - k; i++) {
    const kgram = createKGram(tokens, i, k);
    if (kgram) {
      const positions = index.get(kgram) || [];
      positions.push(i);
      index.set(kgram, positions);
    }
  }

  return index;
}

/**
 * Finds seed matches (k-gram matches) between reference and comparison texts
 *
 * @param bookTokens - Reference text tokens
 * @param genTokens - Comparison text tokens
 * @param bookIndex - K-gram index of reference text
 * @param k - Length of k-grams
 * @returns Array of seed matches
 */
function findSeeds(
  bookTokens: string[],
  genTokens: string[],
  bookIndex: KGramIndex,
  k: number
): Match[] {
  const seeds: Match[] = [];

  for (let genPos = 0; genPos <= genTokens.length - k; genPos++) {
    const kgram = createKGram(genTokens, genPos, k);
    if (!kgram) continue;

    const bookPositions = bookIndex.get(kgram);
    if (!bookPositions) continue;

    // Create a seed match for each occurrence in the reference text
    for (const bookPos of bookPositions) {
      const tokenSlice = genTokens.slice(genPos, genPos + k);
      const isSingleChar = tokenSlice.every(t => t.length === 1);

      seeds.push({
        bookStart: bookPos,
        bookEnd: bookPos + k,
        genStart: genPos,
        genEnd: genPos + k,
        length: k,
        text: isSingleChar ? tokenSlice.join('') : tokenSlice.join(' ')
      });
    }
  }

  return seeds;
}

/**
 * Extends a match bidirectionally as far as tokens continue to match
 *
 * @param bookTokens - Reference text tokens
 * @param genTokens - Comparison text tokens
 * @param match - Initial seed match to extend
 * @returns Extended match
 */
function extendMatch(
  bookTokens: string[],
  genTokens: string[],
  match: Match
): Match {
  let { bookStart, bookEnd, genStart, genEnd } = match;

  // Extend backward
  while (
    bookStart > 0 &&
    genStart > 0 &&
    bookTokens[bookStart - 1] === genTokens[genStart - 1]
  ) {
    bookStart--;
    genStart--;
  }

  // Extend forward
  while (
    bookEnd < bookTokens.length &&
    genEnd < genTokens.length &&
    bookTokens[bookEnd] === genTokens[genEnd]
  ) {
    bookEnd++;
    genEnd++;
  }

  const length = bookEnd - bookStart;
  const tokenSlice = bookTokens.slice(bookStart, bookEnd);
  const isSingleChar = tokenSlice.every(t => t.length === 1);
  const text = isSingleChar ? tokenSlice.join('') : tokenSlice.join(' ');

  return {
    bookStart,
    bookEnd,
    genStart,
    genEnd,
    length,
    text
  };
}

/**
 * Merges overlapping or adjacent matches in the reference text
 * Only merges if they also overlap in the comparison text
 *
 * @param matches - Array of matches to merge
 * @param bookTokens - Reference text tokens (for reconstructing text)
 * @returns Array of merged matches
 */
function mergeOverlappingMatches(matches: Match[], bookTokens: string[]): Match[] {
  if (matches.length === 0) return [];

  // Sort by bookStart position, then by genStart
  const sorted = [...matches].sort((a, b) => {
    if (a.bookStart !== b.bookStart) return a.bookStart - b.bookStart;
    return a.genStart - b.genStart;
  });

  const merged: Match[] = [];
  let current = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];

    // Check if matches overlap in BOTH reference text AND comparison text
    const bookOverlap = next.bookStart <= current.bookEnd;
    const genOverlap = next.genStart <= current.genEnd;

    if (bookOverlap && genOverlap) {
      // Merge: extend current match to include next match
      const newBookEnd = Math.max(current.bookEnd, next.bookEnd);
      const newGenEnd = Math.max(current.genEnd, next.genEnd);
      const tokenSlice = bookTokens.slice(current.bookStart, newBookEnd);
      const isSingleChar = tokenSlice.every(t => t.length === 1);

      current = {
        bookStart: current.bookStart,
        bookEnd: newBookEnd,
        genStart: current.genStart,
        genEnd: newGenEnd,
        length: newBookEnd - current.bookStart,
        text: isSingleChar ? tokenSlice.join('') : tokenSlice.join(' ')
      };
    } else {
      // No overlap in both texts: save current and move to next
      merged.push(current);
      current = next;
    }
  }

  // Don't forget the last match
  merged.push(current);

  return merged;
}

/**
 * Finds all matches between reference and comparison texts using k-gram seed-and-extend
 *
 * @param bookTokens - Reference text tokens
 * @param genTokens - Comparison text tokens
 * @param k - Length of k-grams for seeding (default: 5)
 * @returns Array of matches, sorted by position in reference text
 */
export function findMatches(
  bookTokens: string[],
  genTokens: string[],
  k: number = 5
): Match[] {
  if (bookTokens.length < k || genTokens.length < k) {
    return [];
  }

  // Step 1: Build k-gram index from reference text
  const bookIndex = buildKGramIndex(bookTokens, k);

  // Step 2: Find seed matches
  const seeds = findSeeds(bookTokens, genTokens, bookIndex, k);

  if (seeds.length === 0) {
    return [];
  }

  // Step 3: Extend each seed match
  const extendedMatches = seeds.map(seed =>
    extendMatch(bookTokens, genTokens, seed)
  );

  // Step 4: Merge overlapping matches
  const mergedMatches = mergeOverlappingMatches(extendedMatches, bookTokens);

  return mergedMatches;
}
