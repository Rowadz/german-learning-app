// VerbComparison Component
// Side-by-side comparison of opposite or related verbs

import type { VocabEntry, VerbRelationship } from '../types';
import { PrefixHighlighter, VerbBreakdown } from './PrefixHighlighter';
import { useAppSelector } from '../hooks/useAppStore';
import { selectEntryStatus } from '../store/progressSlice';

interface VerbComparisonProps {
  entry1: VocabEntry;
  entry2: VocabEntry;
  relationship?: VerbRelationship;
  highlightDifferences?: boolean;
  showExamples?: boolean;
  showBreakdown?: boolean;
  onEntry1Click?: () => void;
  onEntry2Click?: () => void;
  className?: string;
}

export function VerbComparison({
  entry1,
  entry2,
  relationship = 'opposite',
  highlightDifferences = true,
  showExamples = true,
  showBreakdown = false,
  onEntry1Click,
  onEntry2Click,
  className = '',
}: VerbComparisonProps) {
  const status1 = useAppSelector((state) => selectEntryStatus(state, entry1.id));
  const status2 = useAppSelector((state) => selectEntryStatus(state, entry2.id));

  // Determine relationship symbol
  const relationshipSymbol = relationship === 'opposite' ? '←→' : relationship === 'similar' ? '≈' : '→';
  const relationshipLabel = relationship === 'opposite' ? 'Opposites' : relationship === 'similar' ? 'Similar' : 'Sequence';
  const relationshipColor = relationship === 'opposite' ? 'text-accent' : relationship === 'similar' ? 'text-info' : 'text-success';

  return (
    <div className={`card bg-base-200 shadow-md ${className}`}>
      <div className="card-body p-4">
        {/* Relationship indicator */}
        <div className="text-center mb-3">
          <span className={`badge badge-outline ${relationshipColor.replace('text-', 'badge-')}`}>
            {relationshipLabel}
          </span>
        </div>

        {/* Side-by-side comparison */}
        <div className="grid grid-cols-5 gap-2 items-start">
          {/* Left verb */}
          <div
            className={`col-span-2 p-3 rounded-lg bg-base-100 ${onEntry1Click ? 'cursor-pointer hover:bg-base-300 transition-colors' : ''}`}
            onClick={onEntry1Click}
          >
            <VerbPanel
              entry={entry1}
              status={status1}
              showExample={showExamples}
              showBreakdown={showBreakdown}
              highlightPrefix={highlightDifferences}
            />
          </div>

          {/* Relationship symbol */}
          <div className="col-span-1 flex items-center justify-center">
            <span className={`text-3xl font-bold ${relationshipColor}`}>
              {relationshipSymbol}
            </span>
          </div>

          {/* Right verb */}
          <div
            className={`col-span-2 p-3 rounded-lg bg-base-100 ${onEntry2Click ? 'cursor-pointer hover:bg-base-300 transition-colors' : ''}`}
            onClick={onEntry2Click}
          >
            <VerbPanel
              entry={entry2}
              status={status2}
              showExample={showExamples}
              showBreakdown={showBreakdown}
              highlightPrefix={highlightDifferences}
            />
          </div>
        </div>

        {/* Shared noun indicator */}
        {entry1.noun === entry2.noun && (
          <div className="text-center mt-3 text-sm text-base-content/60">
            Both use: <span className="font-semibold">{entry1.noun}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Individual verb panel
interface VerbPanelProps {
  entry: VocabEntry;
  status: string;
  showExample: boolean;
  showBreakdown: boolean;
  highlightPrefix: boolean;
}

function VerbPanel({
  entry,
  status,
  showExample,
  showBreakdown,
  highlightPrefix,
}: VerbPanelProps) {
  return (
    <div className="space-y-2">
      {/* Phrase with prefix highlighting */}
      <div className="text-center">
        <PrefixHighlighter
          phrase={entry.phrase}
          noun={entry.noun}
          verbInfo={entry.verbInfo}
          showCase
          highlightStyle={highlightPrefix ? 'color' : 'color'}
          size="md"
          className="font-semibold"
        />
      </div>

      {/* Translation */}
      <div className="text-center text-sm text-base-content/70">
        {entry.translation.split('.')[0]}
      </div>

      {/* Verb breakdown */}
      {showBreakdown && entry.verbInfo && (
        <div className="mt-2 flex justify-center">
          <VerbBreakdown verbInfo={entry.verbInfo} />
        </div>
      )}

      {/* Example sentence */}
      {showExample && (
        <div className="mt-2 p-2 bg-base-200 rounded text-xs">
          <div className="italic text-base-content/80">{entry.example}</div>
        </div>
      )}

      {/* Status badge */}
      <div className="text-center">
        <StatusBadge status={status as 'new' | 'learning' | 'known'} />
      </div>
    </div>
  );
}

// Status badge component
function StatusBadge({ status }: { status: 'new' | 'learning' | 'known' }) {
  switch (status) {
    case 'known':
      return <span className="badge badge-success badge-xs">Known</span>;
    case 'learning':
      return <span className="badge badge-warning badge-xs">Learning</span>;
    default:
      return <span className="badge badge-neutral badge-xs">New</span>;
  }
}

// Compact comparison for use in lists
interface CompactComparisonProps {
  entry1: VocabEntry;
  entry2: VocabEntry;
  relationship?: VerbRelationship;
  onClick?: () => void;
}

export function CompactComparison({
  entry1,
  entry2,
  relationship = 'opposite',
  onClick,
}: CompactComparisonProps) {
  const relationshipSymbol = relationship === 'opposite' ? '←→' : relationship === 'similar' ? '≈' : '→';

  return (
    <div
      className={`flex items-center gap-2 p-2 rounded-lg bg-base-200 ${onClick ? 'cursor-pointer hover:bg-base-300 transition-colors' : ''}`}
      onClick={onClick}
    >
      <PrefixHighlighter
        phrase={entry1.verbInfo?.fullVerb || entry1.phrase}
        verbInfo={entry1.verbInfo}
        highlightStyle="color"
        size="sm"
      />
      <span className="text-accent font-bold">{relationshipSymbol}</span>
      <PrefixHighlighter
        phrase={entry2.verbInfo?.fullVerb || entry2.phrase}
        verbInfo={entry2.verbInfo}
        highlightStyle="color"
        size="sm"
      />
    </div>
  );
}

// Grid of verb comparisons
interface VerbComparisonGridProps {
  pairs: Array<{ entry1: VocabEntry; entry2: VocabEntry; relationship: VerbRelationship }>;
  onPairClick?: (entry1: VocabEntry, entry2: VocabEntry) => void;
  compact?: boolean;
}

export function VerbComparisonGrid({
  pairs,
  onPairClick,
  compact = false,
}: VerbComparisonGridProps) {
  if (pairs.length === 0) {
    return (
      <div className="alert alert-info">
        <span>No verb pairs to display.</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-2">
        {pairs.map(({ entry1, entry2, relationship }, index) => (
          <CompactComparison
            key={`${entry1.id}-${entry2.id}-${index}`}
            entry1={entry1}
            entry2={entry2}
            relationship={relationship}
            onClick={() => onPairClick?.(entry1, entry2)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {pairs.map(({ entry1, entry2, relationship }, index) => (
        <VerbComparison
          key={`${entry1.id}-${entry2.id}-${index}`}
          entry1={entry1}
          entry2={entry2}
          relationship={relationship}
          onEntry1Click={() => onPairClick?.(entry1, entry2)}
          onEntry2Click={() => onPairClick?.(entry1, entry2)}
          showExamples={false}
        />
      ))}
    </div>
  );
}

export default VerbComparison;
