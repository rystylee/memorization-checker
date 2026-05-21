import type { Match, TextSegment } from './types';
import { tokenize, tokenizeWithPositions, type TokenPosition } from './tokenizer';

/**
 * Detects if text contains primarily Japanese characters
 */
function isJapaneseText(text: string): boolean {
  const japanesePattern = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
  return japanesePattern.test(text);
}

/**
 * Generates highlighted segments using position mapping
 * This approach directly maps token positions to character positions
 */
function generateSegmentsWithPositions(
  text: string,
  positions: TokenPosition[],
  tokenToMatch: Map<number, number>
): TextSegment[] {
  if (positions.length === 0) {
    return [{ text, isMatch: false }];
  }

  const segments: TextSegment[] = [];
  let currentPos = 0;

  // Create character-level match map
  const charToMatch = new Map<number, number>();
  for (let tokenIdx = 0; tokenIdx < positions.length; tokenIdx++) {
    const matchIdx = tokenToMatch.get(tokenIdx);
    if (matchIdx !== undefined) {
      const pos = positions[tokenIdx];
      for (let charPos = pos.start; charPos < pos.end; charPos++) {
        charToMatch.set(charPos, matchIdx);
      }
    }
  }

  // Build segments by scanning through the text
  let segmentStart = 0;
  let currentMatchIndex: number | undefined = charToMatch.get(0);

  for (let i = 1; i <= text.length; i++) {
    const nextMatchIndex = i < text.length ? charToMatch.get(i) : undefined;

    // When match status changes, create a segment
    if (nextMatchIndex !== currentMatchIndex) {
      const segmentText = text.substring(segmentStart, i);
      segments.push({
        text: segmentText,
        isMatch: currentMatchIndex !== undefined,
        matchIndex: currentMatchIndex
      });

      segmentStart = i;
      currentMatchIndex = nextMatchIndex;
    }
  }

  return segments.length > 0 ? segments : [{ text, isMatch: false }];
}

/**
 * Generates highlighted segments for Japanese text
 */
function generateJapaneseSegments(
  text: string,
  tokens: string[],
  tokenToMatch: Map<number, number>
): TextSegment[] {
  const segments: TextSegment[] = [];
  let currentSegment = '';
  let currentIsMatch = false;
  let currentMatchIndex: number | undefined;
  let tokenIndex = 0;

  // Process each character in the original text
  for (const char of text) {
    // Skip whitespace and punctuation (they're not in tokens)
    if (/[\s\u3000、。「」『』（）・！？]/.test(char)) {
      currentSegment += char;
      continue;
    }

    // This character should be a token
    const matchIndex = tokenToMatch.get(tokenIndex);
    const isMatch = matchIndex !== undefined;

    // If match status changed, save current segment and start new one
    if (currentSegment && (currentIsMatch !== isMatch || currentMatchIndex !== matchIndex)) {
      segments.push({
        text: currentSegment,
        isMatch: currentIsMatch,
        matchIndex: currentMatchIndex
      });
      currentSegment = '';
    }

    currentSegment += char;
    currentIsMatch = isMatch;
    currentMatchIndex = matchIndex;
    tokenIndex++;
  }

  // Push final segment
  if (currentSegment) {
    segments.push({
      text: currentSegment,
      isMatch: currentIsMatch,
      matchIndex: currentMatchIndex
    });
  }

  return segments.length > 0 ? segments : [{ text, isMatch: false }];
}

/**
 * Generates highlighted segments for English text
 */
function generateEnglishSegments(
  text: string,
  tokens: string[],
  tokenToMatch: Map<number, number>
): TextSegment[] {
  const segments: TextSegment[] = [];
  let currentSegment: string[] = [];
  let currentIsMatch = false;
  let currentMatchIndex: number | undefined;
  let tokenIndex = 0;

  // Split text into parts (words and non-words)
  const parts = text.split(/(\b\w+\b)/);

  for (const part of parts) {
    if (/\b\w+\b/.test(part)) {
      // This is a word token
      const token = tokens[tokenIndex];

      if (token && /[a-z0-9]/.test(token)) {
        const matchIndex = tokenToMatch.get(tokenIndex);
        const isMatch = matchIndex !== undefined;

        // Check if we need to start a new segment
        if (currentSegment.length > 0 && (currentIsMatch !== isMatch || currentMatchIndex !== matchIndex)) {
          segments.push({
            text: currentSegment.join(''),
            isMatch: currentIsMatch,
            matchIndex: currentMatchIndex
          });
          currentSegment = [];
        }

        currentSegment.push(part);
        currentIsMatch = isMatch;
        currentMatchIndex = matchIndex;
        tokenIndex++;
      } else {
        // Token was filtered out, treat as non-match
        currentSegment.push(part);
      }
    } else {
      // This is whitespace or punctuation, add to current segment
      currentSegment.push(part);
    }
  }

  // Push final segment
  if (currentSegment.length > 0) {
    segments.push({
      text: currentSegment.join(''),
      isMatch: currentIsMatch,
      matchIndex: currentMatchIndex
    });
  }

  return segments.length > 0 ? segments : [{ text, isMatch: false }];
}

/**
 * Generates highlighted segments for the reference text
 *
 * @param text - Original reference text
 * @param matches - Array of matches found in the text
 * @returns Array of text segments with highlighting info
 */
export function generateReferenceHighlights(
  text: string,
  matches: Match[]
): TextSegment[] {
  const tokens = tokenize(text);

  if (tokens.length === 0) {
    return [{ text, isMatch: false }];
  }

  // Create a map of token positions to match indices
  const tokenToMatch = new Map<number, number>();
  matches.forEach((match, idx) => {
    for (let i = match.bookStart; i < match.bookEnd; i++) {
      tokenToMatch.set(i, idx);
    }
  });

  // Use appropriate segmentation based on language
  if (isJapaneseText(text)) {
    return generateJapaneseSegments(text, tokens, tokenToMatch);
  } else {
    return generateEnglishSegments(text, tokens, tokenToMatch);
  }
}

/**
 * Generates highlighted segments for the comparison text
 *
 * @param text - Original comparison text
 * @param matches - Array of matches found in the text
 * @returns Array of text segments with highlighting info
 */
export function generateComparisonHighlights(
  text: string,
  matches: Match[]
): TextSegment[] {
  const tokens = tokenize(text);

  if (tokens.length === 0) {
    return [{ text, isMatch: false }];
  }

  // Create a map of token positions to match indices
  const tokenToMatch = new Map<number, number>();
  matches.forEach((match, idx) => {
    for (let i = match.genStart; i < match.genEnd; i++) {
      tokenToMatch.set(i, idx);
    }
  });

  // Use appropriate segmentation based on language
  if (isJapaneseText(text)) {
    return generateJapaneseSegments(text, tokens, tokenToMatch);
  } else {
    return generateEnglishSegments(text, tokens, tokenToMatch);
  }
}

/**
 * Generates highlighted segments for the reference text using position mapping
 * This is the improved version that correctly handles punctuation and whitespace
 *
 * @param text - Original reference text
 * @param positions - Token position information
 * @param matches - Array of matches found in the text
 * @returns Array of text segments with highlighting info
 */
export function generateReferenceHighlightsWithPositions(
  text: string,
  positions: TokenPosition[],
  matches: Match[]
): TextSegment[] {
  if (positions.length === 0) {
    return [{ text, isMatch: false }];
  }

  // Create a map of token indices to match indices
  const tokenToMatch = new Map<number, number>();
  matches.forEach((match, idx) => {
    for (let i = match.bookStart; i < match.bookEnd; i++) {
      tokenToMatch.set(i, idx);
    }
  });

  return generateSegmentsWithPositions(text, positions, tokenToMatch);
}

/**
 * Generates highlighted segments for the comparison text using position mapping
 * This is the improved version that correctly handles punctuation and whitespace
 *
 * @param text - Original comparison text
 * @param positions - Token position information
 * @param matches - Array of matches found in the text
 * @returns Array of text segments with highlighting info
 */
export function generateComparisonHighlightsWithPositions(
  text: string,
  positions: TokenPosition[],
  matches: Match[]
): TextSegment[] {
  if (positions.length === 0) {
    return [{ text, isMatch: false }];
  }

  // Create a map of token indices to match indices
  const tokenToMatch = new Map<number, number>();
  matches.forEach((match, idx) => {
    for (let i = match.genStart; i < match.genEnd; i++) {
      tokenToMatch.set(i, idx);
    }
  });

  return generateSegmentsWithPositions(text, positions, tokenToMatch);
}
