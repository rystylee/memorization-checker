/**
 * Simple test script to verify the memorization checker algorithm
 */

import { evaluate } from './src/lib/evaluator';

// Test Case 1: Exact match
console.log('=== Test Case 1: Exact Match ===');
const text1 = 'The quick brown fox jumps over the lazy dog';
const result1 = evaluate(text1, text1);
console.log('Coverage Score:', (result1.coverageScore * 100).toFixed(1) + '%');
console.log('Total Matches:', result1.totalMatches);
console.log('Longest Match:', result1.longestMatchLength, 'words');
console.log('Expected: 100% coverage\n');

// Test Case 2: Partial match (5+ words)
console.log('=== Test Case 2: Partial Match (5+ words) ===');
const reference2 = 'The quick brown fox jumps over the lazy dog';
const comparison2 = 'The quick brown fox jumps in the garden';
const result2 = evaluate(reference2, comparison2);
console.log('Coverage Score:', (result2.coverageScore * 100).toFixed(1) + '%');
console.log('Total Matches:', result2.totalMatches);
console.log('Longest Match:', result2.longestMatchLength, 'words');
console.log('Longest Match Text:', result2.longestMatchText);
console.log('Expected: Partial match on "the quick brown fox jumps" (5 words)\n');

// Test Case 3: No match
console.log('=== Test Case 3: No Match ===');
const reference3 = 'The quick brown fox';
const comparison3 = 'A lazy dog sleeps';
const result3 = evaluate(reference3, comparison3);
console.log('Coverage Score:', (result3.coverageScore * 100).toFixed(1) + '%');
console.log('Total Matches:', result3.totalMatches);
console.log('Expected: 0% coverage\n');

// Test Case 4: Multiple matches
console.log('=== Test Case 4: Multiple Matches ===');
const reference4 = 'The cat sat on the mat. The dog sat on the rug.';
const comparison4 = 'The cat sat on the mat and slept. Later, the dog sat on the rug.';
const result4 = evaluate(reference4, comparison4);
console.log('Coverage Score:', (result4.coverageScore * 100).toFixed(1) + '%');
console.log('Total Matches:', result4.totalMatches);
console.log('All Matches:', result4.matches.length);
console.log('Longest Match:', result4.longestMatchLength, 'words');
console.log('Expected: High coverage with multiple matching phrases\n');

console.log('✅ All test cases completed!');
