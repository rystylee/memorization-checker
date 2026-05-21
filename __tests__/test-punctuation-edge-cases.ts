/**
 * Test edge cases with punctuation positioning
 */

import { evaluateWithPositions } from '../src/lib/evaluator';
import { generateReferenceHighlightsWithPositions, generateComparisonHighlightsWithPositions } from '../src/lib/highlighter';

console.log('=== Test Case 1: Match ending with punctuation ===\n');

const ref1 = 'これはテストです。次の文章。';
const comp1 = 'これはテストです。別の文章。';

const result1 = evaluateWithPositions(ref1, comp1);
console.log('Reference:', ref1);
console.log('Comparison:', comp1);
console.log('Matches:', result1.matches.length, '\n');

const refSeg1 = generateReferenceHighlightsWithPositions(
  result1.referenceText,
  result1.referencePositions,
  result1.matches
);
const compSeg1 = generateComparisonHighlightsWithPositions(
  result1.comparisonText,
  result1.comparisonPositions,
  result1.matches
);

console.log('Reference segments:');
refSeg1.forEach((seg, idx) => {
  console.log(`  [${idx}] ${seg.isMatch ? '✅' : '⬜'}: "${seg.text}"`);
});

console.log('\nComparison segments:');
compSeg1.forEach((seg, idx) => {
  console.log(`  [${idx}] ${seg.isMatch ? '✅' : '⬜'}: "${seg.text}"`);
});

console.log('\n=== Test Case 2: Multiple punctuation marks ===\n');

const ref2 = 'あああ、、、いいい！！！ううう？？？';
const comp2 = 'あああいいいううう';

const result2 = evaluateWithPositions(ref2, comp2);
console.log('Reference:', ref2);
console.log('Comparison:', comp2);
console.log('Matches:', result2.matches.length, '\n');

const refSeg2 = generateReferenceHighlightsWithPositions(
  result2.referenceText,
  result2.referencePositions,
  result2.matches
);
const compSeg2 = generateComparisonHighlightsWithPositions(
  result2.comparisonText,
  result2.comparisonPositions,
  result2.matches
);

console.log('Reference segments:');
refSeg2.forEach((seg, idx) => {
  console.log(`  [${idx}] ${seg.isMatch ? '✅' : '⬜'}: "${seg.text}"`);
});

console.log('\nComparison segments:');
compSeg2.forEach((seg, idx) => {
  console.log(`  [${idx}] ${seg.isMatch ? '✅' : '⬜'}: "${seg.text}"`);
});

console.log('\n=== Test Case 3: Spaces between matches ===\n');

const ref3 = 'あああ　　いいい　　ううう';
const comp3 = 'あああいいいううう';

const result3 = evaluateWithPositions(ref3, comp3);
console.log('Reference:', ref3);
console.log('Comparison:', comp3);
console.log('Matches:', result3.matches.length, '\n');

const refSeg3 = generateReferenceHighlightsWithPositions(
  result3.referenceText,
  result3.referencePositions,
  result3.matches
);
const compSeg3 = generateComparisonHighlightsWithPositions(
  result3.comparisonText,
  result3.comparisonPositions,
  result3.matches
);

console.log('Reference segments:');
refSeg3.forEach((seg, idx) => {
  console.log(`  [${idx}] ${seg.isMatch ? '✅' : '⬜'}: "${seg.text}"`);
});

console.log('\nComparison segments:');
compSeg3.forEach((seg, idx) => {
  console.log(`  [${idx}] ${seg.isMatch ? '✅' : '⬜'}: "${seg.text}"`);
});

console.log('\n✅ Punctuation edge case tests completed!');
