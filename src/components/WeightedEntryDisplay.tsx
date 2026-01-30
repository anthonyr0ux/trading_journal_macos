import { calculateWeightedEntry } from '../lib/calculations';

type Entry = {
  price: number;
  percent: number;
};

export function WeightedEntryDisplay({
  entries,
  label = 'Weighted Average Entry'
}: {
  entries: Entry[];
  label?: string;
}) {
  const validEntries = entries.filter(e => e.price > 0 && e.percent > 0);

  // Only show if multiple entries
  if (validEntries.length <= 1) return null;

  // Calculate weighted entry with error handling
  let weightedEntry: number | null = null;
  try {
    weightedEntry = calculateWeightedEntry(validEntries);
  } catch (error) {
    console.error('Failed to calculate weighted entry:', error);
    return null;
  }

  return (
    <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-500/50 rounded-lg">
      <div className="text-xs text-muted-foreground mb-1">
        {label}
      </div>
      <div className="text-lg font-bold font-mono text-gray-900 dark:text-gray-100">
        ${weightedEntry.toFixed(8)}
      </div>
    </div>
  );
}
