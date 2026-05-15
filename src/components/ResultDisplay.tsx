import type { EvaluationResult } from '@/lib/types';
import { MetricsCard } from './MetricsCard';

interface ResultDisplayProps {
  result: EvaluationResult | null;
  isProcessing: boolean;
}

export function ResultDisplay({ result, isProcessing }: ResultDisplayProps) {
  if (isProcessing) {
    return (
      <div className="my-8 text-center text-gray-500 dark:text-gray-400">
        Processing...
      </div>
    );
  }

  if (!result) {
    return (
      <div className="my-8 text-center text-gray-500 dark:text-gray-400">
        Enter text in both fields to see results
      </div>
    );
  }

  const coveragePercent = (result.coverageScore * 100).toFixed(1);

  return (
    <div className="my-8">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
        Evaluation Results
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricsCard
          title="Coverage Score"
          value={`${coveragePercent}%`}
          description="Percentage of reference text covered"
        />
        <MetricsCard
          title="Total Matches"
          value={result.totalMatches}
          description="Number of matching segments"
        />
        <MetricsCard
          title="Longest Match"
          value={`${result.longestMatchLength} words`}
          description="Length of longest continuous match"
        />
        <MetricsCard
          title="All Matches"
          value={result.matches.length}
          description="Total match segments (including small)"
        />
      </div>
      {result.longestMatchText && (
        <div className="mt-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Longest Match Preview
          </h3>
          <p className="text-sm text-gray-800 dark:text-gray-200 italic">
            &ldquo;{result.longestMatchText.substring(0, 200)}
            {result.longestMatchText.length > 200 ? '...' : ''}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
}
