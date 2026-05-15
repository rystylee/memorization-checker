/**
 * Test script for Rashomon texts (羅生門)
 */

import { readFileSync } from 'fs';
import { evaluate } from './src/lib/evaluator';

console.log('=== Memorization Checker: 羅生門テスト ===\n');

// Read the text files
const referenceText = readFileSync('./羅生門/羅生門_原文.txt', 'utf-8');
const comparisonText = readFileSync('./羅生門/羅生門_生成文.txt', 'utf-8');

console.log('📖 原文サイズ:', referenceText.length, 'characters');
console.log('📝 生成文サイズ:', comparisonText.length, 'characters\n');

// Measure processing time
const startTime = Date.now();
const result = evaluate(referenceText, comparisonText);
const endTime = Date.now();
const processingTime = endTime - startTime;

console.log('⏱️  処理時間:', processingTime, 'ms\n');

console.log('=== 評価結果 ===');
console.log('📊 カバレッジスコア:', (result.coverageScore * 100).toFixed(2) + '%');
console.log('   (原文の何%が生成文に含まれているか)');
console.log();
console.log('🔢 一致数（k=5以上）:', result.totalMatches);
console.log('   (5単語以上の連続した一致の数)');
console.log();
console.log('📏 すべての一致セグメント:', result.matches.length);
console.log();
console.log('⭐ 最長一致:');
console.log('   - 長さ:', result.longestMatchLength, '単語');
console.log('   - テキスト:', result.longestMatchText.substring(0, 200));
if (result.longestMatchText.length > 200) {
  console.log('     ...(省略)...');
}
console.log();

// Show top 5 longest matches
console.log('=== トップ5の長い一致 ===');
const sortedMatches = [...result.matches].sort((a, b) => b.length - a.length);
sortedMatches.slice(0, 5).forEach((match, idx) => {
  console.log(`\n${idx + 1}. 長さ: ${match.length} 単語`);
  console.log(`   原文位置: ${match.bookStart}-${match.bookEnd}`);
  console.log(`   生成文位置: ${match.genStart}-${match.genEnd}`);
  const preview = match.text.substring(0, 100);
  console.log(`   テキスト: ${preview}${match.text.length > 100 ? '...' : ''}`);
});

console.log('\n\n✅ 羅生門テスト完了！');
console.log(`パフォーマンス: ${processingTime}ms で処理完了`);
