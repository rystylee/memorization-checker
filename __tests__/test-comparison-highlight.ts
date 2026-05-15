/**
 * Debug test for comparison text highlighting
 */

import { readFileSync } from 'fs';
import { evaluate } from './src/lib/evaluator';
import { generateComparisonHighlights } from './src/lib/highlighter';
import { tokenize } from './src/lib/tokenizer';

const referenceText = readFileSync('./羅生門/羅生門_原文.txt', 'utf-8');
const comparisonText = readFileSync('./羅生門/羅生門_生成文.txt', 'utf-8');

console.log('=== Debugging Comparison Highlight Issue ===\n');

const result = evaluate(referenceText, comparisonText);

console.log('Total matches:', result.matches.length);
console.log('Coverage score:', (result.coverageScore * 100).toFixed(2) + '%\n');

// Check first few matches
console.log('First 3 matches:');
result.matches.slice(0, 3).forEach((match, idx) => {
  console.log(`\nMatch ${idx + 1}:`);
  console.log('  bookStart:', match.bookStart, 'bookEnd:', match.bookEnd);
  console.log('  genStart:', match.genStart, 'genEnd:', match.genEnd);
  console.log('  length:', match.length);
  console.log('  text preview:', match.text.substring(0, 50));
});

// Generate comparison highlights
const compSegments = generateComparisonHighlights(comparisonText, result.matches);

console.log('\n\nComparison segments:', compSegments.length);
console.log('\nFirst 10 segments:');
compSegments.slice(0, 10).forEach((seg, idx) => {
  const preview = seg.text.substring(0, 30).replace(/\n/g, '\\n');
  console.log(`  [${idx}] ${seg.isMatch ? '✅ MATCH' : '⬜ NO'} (matchIdx: ${seg.matchIndex}): "${preview}${seg.text.length > 30 ? '...' : ''}"`);
});

// Count match vs non-match segments
const matchCount = compSegments.filter(s => s.isMatch).length;
const nonMatchCount = compSegments.filter(s => !s.isMatch).length;
console.log('\n📊 Match segments:', matchCount);
console.log('📊 Non-match segments:', nonMatchCount);

// Count total characters
const matchChars = compSegments.filter(s => s.isMatch).reduce((sum, s) => sum + s.text.length, 0);
const totalChars = compSegments.reduce((sum, s) => sum + s.text.length, 0);
console.log('\n📏 Match characters:', matchChars);
console.log('📏 Total characters:', totalChars);
console.log('📏 Percentage highlighted:', ((matchChars / totalChars) * 100).toFixed(2) + '%');
