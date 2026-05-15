'use client';

import { useState, useEffect, useMemo } from 'react';
import { Header } from '@/components/Header';
import { TextInput } from '@/components/TextInput';
import { ResultDisplay } from '@/components/ResultDisplay';
import { HighlightedText } from '@/components/HighlightedText';
import { evaluate } from '@/lib/evaluator';
import { generateReferenceHighlights, generateComparisonHighlights } from '@/lib/highlighter';
import type { EvaluationResult, TextSegment } from '@/lib/types';

export default function Home() {
  const [referenceText, setReferenceText] = useState('');
  const [comparisonText, setComparisonText] = useState('');
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Debounced evaluation
  useEffect(() => {
    if (!referenceText.trim() || !comparisonText.trim()) {
      setResult(null);
      return;
    }

    setIsProcessing(true);
    const timeoutId = setTimeout(() => {
      try {
        const evaluationResult = evaluate(referenceText, comparisonText);
        setResult(evaluationResult);
      } catch (error) {
        console.error('Evaluation error:', error);
        setResult(null);
      } finally {
        setIsProcessing(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [referenceText, comparisonText]);

  // Generate highlights
  const referenceSegments: TextSegment[] = useMemo(() => {
    if (!result || result.matches.length === 0) {
      return [{ text: referenceText, isMatch: false }];
    }
    return generateReferenceHighlights(referenceText, result.matches);
  }, [referenceText, result]);

  const comparisonSegments: TextSegment[] = useMemo(() => {
    if (!result || result.matches.length === 0) {
      return [{ text: comparisonText, isMatch: false }];
    }
    return generateComparisonHighlights(comparisonText, result.matches);
  }, [comparisonText, result]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Header />

        {/* Text Input Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6" style={{ height: '300px' }}>
          <TextInput
            label="Reference Text (Book/Source)"
            value={referenceText}
            onChange={setReferenceText}
            placeholder="Enter the reference text here..."
          />
          <TextInput
            label="Comparison Text (Generated/Recall)"
            value={comparisonText}
            onChange={setComparisonText}
            placeholder="Enter the comparison text here..."
          />
        </div>

        {/* Results Display */}
        <ResultDisplay result={result} isProcessing={isProcessing} />

        {/* Highlighted Text Displays */}
        {result && result.matches.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <HighlightedText
              label="Reference Text (Highlighted Matches)"
              segments={referenceSegments}
              highlightColor="bg-blue-200 dark:bg-blue-800"
            />
            <HighlightedText
              label="Comparison Text (Highlighted Matches)"
              segments={comparisonSegments}
              highlightColor="bg-green-200 dark:bg-green-800"
            />
          </div>
        )}
      </div>
    </div>
  );
}
