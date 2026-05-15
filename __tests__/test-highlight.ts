/**
 * Test script for highlight functionality
 */

import { evaluate } from './src/lib/evaluator';
import { generateReferenceHighlights, generateComparisonHighlights } from './src/lib/highlighter';

console.log('=== Highlight Test: Japanese ===\n');

const japaneseRef = '或日の暮方の事である。一人の下人が、羅生門の下で雨やみを待つてゐた。';
const japaneseComp = '或日の暮方の事である。下人は羅生門の下で雨やみを待つてゐた。';

const result1 = evaluate(japaneseRef, japaneseComp);
console.log('📊 Matches found:', result1.matches.length);
console.log('Coverage:', (result1.coverageScore * 100).toFixed(1) + '%\n');

const refSegments = generateReferenceHighlights(japaneseRef, result1.matches);
const compSegments = generateComparisonHighlights(japaneseComp, result1.matches);

console.log('Reference segments:', refSegments.length);
refSegments.forEach((seg, idx) => {
  console.log(`  [${idx}] ${seg.isMatch ? '✅ MATCH' : '⬜ NO MATCH'}: "${seg.text.substring(0, 30)}${seg.text.length > 30 ? '...' : ''}"`);
});

console.log('\nComparison segments:', compSegments.length);
compSegments.forEach((seg, idx) => {
  console.log(`  [${idx}] ${seg.isMatch ? '✅ MATCH' : '⬜ NO MATCH'}: "${seg.text.substring(0, 30)}${seg.text.length > 30 ? '...' : ''}"`);
});

console.log('\n=== Highlight Test: English ===\n');

const englishRef = 'The quick brown fox jumps over the lazy dog';
const englishComp = 'The quick brown fox runs over the lazy cat';

const result2 = evaluate(englishRef, englishComp);
console.log('📊 Matches found:', result2.matches.length);
console.log('Coverage:', (result2.coverageScore * 100).toFixed(1) + '%\n');

const refSegments2 = generateReferenceHighlights(englishRef, result2.matches);
const compSegments2 = generateComparisonHighlights(englishComp, result2.matches);

console.log('Reference segments:', refSegments2.length);
refSegments2.forEach((seg, idx) => {
  console.log(`  [${idx}] ${seg.isMatch ? '✅ MATCH' : '⬜ NO MATCH'}: "${seg.text}"`);
});

console.log('\nComparison segments:', compSegments2.length);
compSegments2.forEach((seg, idx) => {
  console.log(`  [${idx}] ${seg.isMatch ? '✅ MATCH' : '⬜ NO MATCH'}: "${seg.text}"`);
});

console.log('\n✅ Highlight test completed!');
