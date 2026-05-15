interface MetricsCardProps {
  title: string;
  value: string | number;
  description?: string;
}

export function MetricsCard({ title, value, description }: MetricsCardProps) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
        {title}
      </h3>
      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
        {value}
      </div>
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-500">
          {description}
        </p>
      )}
    </div>
  );
}
