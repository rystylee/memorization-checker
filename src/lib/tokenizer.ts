/**
 * Token position information
 */
export interface TokenPosition {
  start: number; // Character position in original text
  end: number;   // Character position in original text (exclusive)
}

/**
 * Tokenization result with position information
 */
export interface TokenizeResult {
  tokens: string[];
  positions: TokenPosition[];
}

/**
 * Detects if text contains primarily Japanese characters
 */
function isJapaneseText(text: string): boolean {
  // Check for Hiragana, Katakana, or Kanji characters
  const japanesePattern = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
  return japanesePattern.test(text);
}

/**
 * Tokenizes Japanese text into character-based tokens
 * Removes whitespace and punctuation, tracks original positions
 */
function tokenizeJapanese(text: string): TokenizeResult {
  const tokens: string[] = [];
  const positions: TokenPosition[] = [];

  // Track position in original text
  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    // Skip whitespace and common punctuation
    if (/[\s\u3000、。「」『』（）・！？]/.test(char)) {
      continue;
    }

    // Add token with its position in original text
    tokens.push(char);
    positions.push({ start: i, end: i + 1 });
  }

  return { tokens, positions };
}

/**
 * Tokenizes English text into word tokens
 * Matches behavior of Python's NLTK WordPunctTokenizer, tracks original positions
 */
function tokenizeEnglish(text: string): TokenizeResult {
  const tokens: string[] = [];
  const positions: TokenPosition[] = [];

  // Convert to lowercase for tokenization
  const lowercased = text.toLowerCase();

  // Find all word tokens with their positions
  const regex = /\b\w+\b/g;
  let match;

  while ((match = regex.exec(lowercased)) !== null) {
    const token = match[0];

    // Filter to keep only tokens with alphanumeric characters
    if (/[a-z0-9]/.test(token)) {
      tokens.push(token);
      positions.push({ start: match.index, end: match.index + token.length });
    }
  }

  return { tokens, positions };
}

/**
 * Tokenizes text into an array of tokens (auto-detects language)
 * Legacy function for backward compatibility
 *
 * @param text - The input text to tokenize
 * @returns Array of tokens (characters for Japanese, words for English)
 */
export function tokenize(text: string): string[] {
  return tokenizeWithPositions(text).tokens;
}

/**
 * Tokenizes text with position tracking (auto-detects language)
 *
 * @param text - The input text to tokenize
 * @returns TokenizeResult with tokens and their positions in original text
 */
export function tokenizeWithPositions(text: string): TokenizeResult {
  if (!text || text.trim().length === 0) {
    return { tokens: [], positions: [] };
  }

  // Auto-detect language and use appropriate tokenizer
  if (isJapaneseText(text)) {
    return tokenizeJapanese(text);
  } else {
    return tokenizeEnglish(text);
  }
}

/**
 * Creates a k-gram (sequence of k consecutive tokens) from token array
 *
 * @param tokens - Array of tokens
 * @param startIndex - Starting index for the k-gram
 * @param k - Length of the k-gram
 * @returns Joined k-gram string (space-separated for English, no separator for Japanese), or null if not enough tokens
 */
export function createKGram(tokens: string[], startIndex: number, k: number): string | null {
  if (startIndex + k > tokens.length) {
    return null;
  }

  const slice = tokens.slice(startIndex, startIndex + k);

  // If tokens are single characters (Japanese), join without spaces
  // Otherwise (English words), join with spaces
  const isSingleChar = slice.every(token => token.length === 1);
  return isSingleChar ? slice.join('') : slice.join(' ');
}
