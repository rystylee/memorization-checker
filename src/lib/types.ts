/**
 * Represents a single match between reference and comparison texts
 */
export interface Match {
  /** Start position in reference text tokens (0-indexed) */
  bookStart: number;
  /** End position in reference text tokens (exclusive) */
  bookEnd: number;
  /** Start position in comparison text tokens (0-indexed) */
  genStart: number;
  /** End position in comparison text tokens (exclusive) */
  genEnd: number;
  /** Length of the match in words */
  length: number;
  /** The actual matched text */
  text: string;
}

/**
 * Result of evaluating text similarity
 */
export interface EvaluationResult {
  /** Coverage score: percentage of reference text covered by matches (0-1) */
  coverageScore: number;
  /** Length of the longest match in words */
  longestMatchLength: number;
  /** Text of the longest match */
  longestMatchText: string;
  /** Total number of matches with length >= k */
  totalMatches: number;
  /** Array of all detected matches */
  matches: Match[];
}

/**
 * K-gram index mapping k-gram strings to their positions in the token array
 */
export type KGramIndex = Map<string, number[]>;

/**
 * Text segment for highlighting display
 */
export interface TextSegment {
  /** The text content of this segment */
  text: string;
  /** Whether this segment is part of a match */
  isMatch: boolean;
  /** Match index (for coloring), if this is a match segment */
  matchIndex?: number;
}
