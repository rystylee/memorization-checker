/**
 * Test script for position-based highlight functionality
 * This tests the new implementation that correctly handles punctuation
 */

import { evaluateWithPositions } from '../src/lib/evaluator';
import { generateReferenceHighlightsWithPositions, generateComparisonHighlightsWithPositions } from '../src/lib/highlighter';

console.log('=== Position-Based Highlight Test: Japanese with Punctuation ===\n');

const japaneseRef = '或日の暮方の事である。一人の下人が、羅生門の下で雨やみを待つてゐた。';
const japaneseComp = '或日の暮方の事である。下人は羅生門の下で雨やみを待つてゐた。';

const result1 = evaluateWithPositions(japaneseRef, japaneseComp);
console.log('📊 Matches found:', result1.matches.length);
console.log('Coverage:', (result1.coverageScore * 100).toFixed(1) + '%\n');

const refSegments = generateReferenceHighlightsWithPositions(
  result1.referenceText,
  result1.referencePositions,
  result1.matches
);
const compSegments = generateComparisonHighlightsWithPositions(
  result1.comparisonText,
  result1.comparisonPositions,
  result1.matches
);

console.log('Reference Text:', japaneseRef);
console.log('Reference segments:', refSegments.length);
refSegments.forEach((seg, idx) => {
  console.log(`  [${idx}] ${seg.isMatch ? '✅ MATCH' : '⬜ NO MATCH'}: "${seg.text}"`);
});

console.log('\nComparison Text:', japaneseComp);
console.log('Comparison segments:', compSegments.length);
compSegments.forEach((seg, idx) => {
  console.log(`  [${idx}] ${seg.isMatch ? '✅ MATCH' : '⬜ NO MATCH'}: "${seg.text}"`);
});

// Verify that matched segments are identical in both texts
console.log('\n=== Verifying Match Consistency ===');
const refMatches = refSegments.filter(s => s.isMatch).map(s => s.text.replace(/[\s\u3000、。「」『』（）・！？]/g, ''));
const compMatches = compSegments.filter(s => s.isMatch).map(s => s.text.replace(/[\s\u3000、。「」『』（）・！？]/g, ''));

console.log('Reference matched tokens:', refMatches);
console.log('Comparison matched tokens:', compMatches);

// Check if matched content is the same (ignoring punctuation)
let allMatch = true;
for (let i = 0; i < Math.min(refMatches.length, compMatches.length); i++) {
  if (refMatches[i] !== compMatches[i]) {
    console.log(`❌ Mismatch at index ${i}:`);
    console.log(`   Reference:  "${refMatches[i]}"`);
    console.log(`   Comparison: "${compMatches[i]}"`);
    allMatch = false;
  }
}

if (allMatch && refMatches.length === compMatches.length) {
  console.log('✅ All matched segments are consistent!');
} else if (refMatches.length !== compMatches.length) {
  console.log(`⚠️  Different number of matched segments: Ref=${refMatches.length}, Comp=${compMatches.length}`);
}

console.log('\n=== Position-Based Highlight Test: English ===\n');

const englishRef = 'The quick brown fox jumps over the lazy dog.';
const englishComp = 'The quick brown fox runs over the lazy cat.';

const result2 = evaluateWithPositions(englishRef, englishComp);
console.log('📊 Matches found:', result2.matches.length);
console.log('Coverage:', (result2.coverageScore * 100).toFixed(1) + '%\n');

const refSegments2 = generateReferenceHighlightsWithPositions(
  result2.referenceText,
  result2.referencePositions,
  result2.matches
);
const compSegments2 = generateComparisonHighlightsWithPositions(
  result2.comparisonText,
  result2.comparisonPositions,
  result2.matches
);

console.log('Reference segments:', refSegments2.length);
refSegments2.forEach((seg, idx) => {
  console.log(`  [${idx}] ${seg.isMatch ? '✅ MATCH' : '⬜ NO MATCH'}: "${seg.text}"`);
});

console.log('\nComparison segments:', compSegments2.length);
compSegments2.forEach((seg, idx) => {
  console.log(`  [${idx}] ${seg.isMatch ? '✅ MATCH' : '⬜ NO MATCH'}: "${seg.text}"`);
});

console.log('\n✅ Position-based highlight test completed!');
