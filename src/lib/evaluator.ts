import type { EvaluationResult } from './types';
import { tokenize } from './tokenizer';
import { findMatches } from './matcher';

/**
 * Evaluates the similarity between reference and comparison texts
 *
 * @param referenceText - The reference text (book/source text)
 * @param comparisonText - The comparison text (generated/recall text)
 * @param k - K-gram length for matching (default: 5)
 * @returns Evaluation result with coverage score, longest match, and all matches
 */
export function evaluate(
  referenceText: string,
  comparisonText: string,
  k: number = 5
): EvaluationResult {
  // Tokenize both texts
  const bookTokens = tokenize(referenceText);
  const genTokens = tokenize(comparisonText);

  // Handle edge cases
  if (bookTokens.length === 0 || genTokens.length === 0) {
    return {
      coverageScore: 0,
      longestMatchLength: 0,
      longestMatchText: '',
      totalMatches: 0,
      matches: []
    };
  }

  // Find all matches
  const matches = findMatches(bookTokens, genTokens, k);

  // Calculate coverage score
  const coverageScore = calculateCoverageScore(matches, bookTokens.length);

  // Find longest match
  const { longestMatchLength, longestMatchText } = findLongestMatch(matches);

  // Count matches with length >= k
  const totalMatches = matches.filter(m => m.length >= k).length;

  return {
    coverageScore,
    longestMatchLength,
    longestMatchText,
    totalMatches,
    matches
  };
}

/**
 * Calculates what percentage of the reference text is covered by matches
 *
 * @param matches - Array of matches
 * @param totalTokens - Total number of tokens in reference text
 * @returns Coverage score between 0 and 1
 */
function calculateCoverageScore(matches: any[], totalTokens: number): number {
  if (totalTokens === 0 || matches.length === 0) {
    return 0;
  }

  // Create a boolean array to track which tokens are covered
  const covered = new Array(totalTokens).fill(false);

  // Mark all tokens that are part of a match
  for (const match of matches) {
    for (let i = match.bookStart; i < match.bookEnd; i++) {
      covered[i] = true;
    }
  }

  // Count covered tokens
  const coveredCount = covered.filter(Boolean).length;

  return coveredCount / totalTokens;
}

/**
 * Finds the longest match in an array of matches
 *
 * @param matches - Array of matches
 * @returns Object with longest match length and text
 */
function findLongestMatch(matches: any[]): {
  longestMatchLength: number;
  longestMatchText: string;
} {
  if (matches.length === 0) {
    return {
      longestMatchLength: 0,
      longestMatchText: ''
    };
  }

  let longest = matches[0];
  for (const match of matches) {
    if (match.length > longest.length) {
      longest = match;
    }
  }

  return {
    longestMatchLength: longest.length,
    longestMatchText: longest.text
  };
}
