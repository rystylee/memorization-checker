import type { TextSegment } from '@/lib/types';

interface HighlightedTextProps {
  label: string;
  segments: TextSegment[];
  highlightColor?: string;
}

export function HighlightedText({
  label,
  segments,
  highlightColor = 'bg-yellow-200 dark:bg-yellow-700'
}: HighlightedTextProps) {
  return (
    <div>
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </h3>
      <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 whitespace-pre-wrap break-words">
        {segments.map((segment, idx) => (
          <span
            key={idx}
            className={segment.isMatch ? highlightColor : ''}
          >
            {segment.text}
          </span>
        ))}
      </div>
    </div>
  );
}
