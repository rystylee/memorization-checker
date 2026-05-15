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
 * Removes whitespace and punctuation
 */
function tokenizeJapanese(text: string): string[] {
  // Remove whitespace and common punctuation
  const cleaned = text.replace(/[\s\u3000、。「」『』（）・！？]/g, '');

  // Convert to array of characters
  return Array.from(cleaned);
}

/**
 * Tokenizes English text into word tokens
 * Matches behavior of Python's NLTK WordPunctTokenizer
 */
function tokenizeEnglish(text: string): string[] {
  // Convert to lowercase
  const lowercased = text.toLowerCase();

  // Extract word tokens using word boundary regex
  const tokens = lowercased.match(/\b\w+\b/g) || [];

  // Filter to keep only tokens with alphanumeric characters
  return tokens.filter(token => /[a-z0-9]/.test(token));
}

/**
 * Tokenizes text into an array of tokens (auto-detects language)
 *
 * @param text - The input text to tokenize
 * @returns Array of tokens (characters for Japanese, words for English)
 */
export function tokenize(text: string): string[] {
  if (!text || text.trim().length === 0) {
    return [];
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
