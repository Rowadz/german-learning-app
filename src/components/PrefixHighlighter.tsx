// PrefixHighlighter Component
// Visually highlights separable prefixes in German verb phrases

import type { VerbInfo, GrammaticalCase } from '../types';
import { parseVerbInfo } from '../utils/verbAnalysis';

interface PrefixHighlighterProps {
  phrase: string;
  noun?: string;
  verbInfo?: VerbInfo;
  showCase?: boolean;
  showPattern?: boolean;
  highlightStyle?: 'color' | 'underline' | 'badge' | 'bracket';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Case abbreviations for display
const CASE_LABELS: Record<GrammaticalCase, string> = {
  Nominativ: 'Nom',
  Akkusativ: 'Akk',
  Dativ: 'Dat',
  Genitiv: 'Gen',
};

export function PrefixHighlighter({
  phrase,
  noun,
  verbInfo: providedVerbInfo,
  showCase = false,
  showPattern = false,
  highlightStyle = 'color',
  size = 'md',
  className = '',
}: PrefixHighlighterProps) {
  // Parse verb info if not provided
  const verbInfo = providedVerbInfo || (noun ? parseVerbInfo(phrase, noun) : null);

  // If no verb info or not separable, return plain phrase
  if (!verbInfo || !verbInfo.isSeparable || !verbInfo.prefix) {
    return (
      <span className={`${className} ${getSizeClass(size)}`}>
        {phrase}
        {showCase && verbInfo?.caseRequired && (
          <CaseHint caseType={verbInfo.caseRequired} size={size} />
        )}
      </span>
    );
  }

  // Find the verb in the phrase and split around the prefix
  const { prefix, baseVerb, fullVerb } = verbInfo;

  // Render based on highlight style
  return (
    <span className={`${className} ${getSizeClass(size)}`}>
      {renderHighlightedPhrase(phrase, prefix, baseVerb, fullVerb, highlightStyle)}
      {showCase && verbInfo.caseRequired && (
        <CaseHint caseType={verbInfo.caseRequired} size={size} />
      )}
      {showPattern && verbInfo.patternTags && verbInfo.patternTags.length > 0 && (
        <PatternTags patterns={verbInfo.patternTags} size={size} />
      )}
    </span>
  );
}

// Helper to get size classes
function getSizeClass(size: 'sm' | 'md' | 'lg'): string {
  switch (size) {
    case 'sm':
      return 'text-sm';
    case 'lg':
      return 'text-lg';
    default:
      return 'text-base';
  }
}

// Render the phrase with highlighted prefix
function renderHighlightedPhrase(
  phrase: string,
  prefix: string,
  _baseVerb: string,
  fullVerb: string,
  style: 'color' | 'underline' | 'badge' | 'bracket'
): React.ReactNode {
  // Find the full verb in the phrase
  const verbIndex = phrase.toLowerCase().indexOf(fullVerb.toLowerCase());

  if (verbIndex === -1) {
    // Verb not found, return original phrase
    return phrase;
  }

  const beforeVerb = phrase.slice(0, verbIndex);
  const actualVerb = phrase.slice(verbIndex, verbIndex + fullVerb.length);
  const afterVerb = phrase.slice(verbIndex + fullVerb.length);

  // Split the actual verb into prefix and base
  const prefixPart = actualVerb.slice(0, prefix.length);
  const basePart = actualVerb.slice(prefix.length);

  // Render based on style
  const highlightedPrefix = renderPrefixByStyle(prefixPart, style);

  return (
    <>
      {beforeVerb}
      {highlightedPrefix}
      {basePart}
      {afterVerb}
    </>
  );
}

// Render prefix with different highlight styles
function renderPrefixByStyle(
  prefix: string,
  style: 'color' | 'underline' | 'badge' | 'bracket'
): React.ReactNode {
  switch (style) {
    case 'color':
      return (
        <span className="text-primary font-bold">{prefix}</span>
      );
    case 'underline':
      return (
        <span className="underline decoration-primary decoration-2 underline-offset-2">
          {prefix}
        </span>
      );
    case 'badge':
      return (
        <span className="badge badge-primary badge-sm align-baseline mx-0.5">
          {prefix}
        </span>
      );
    case 'bracket':
      return (
        <span className="text-primary font-semibold">[{prefix}]</span>
      );
    default:
      return <span className="text-primary font-bold">{prefix}</span>;
  }
}

// Case hint component
function CaseHint({
  caseType,
  size,
}: {
  caseType: GrammaticalCase;
  size: 'sm' | 'md' | 'lg';
}) {
  const sizeClass = size === 'sm' ? 'badge-xs' : size === 'lg' ? 'badge-sm' : 'badge-xs';

  return (
    <span
      className={`badge badge-outline badge-info ${sizeClass} ml-1 align-baseline`}
      title={`Requires ${caseType}`}
    >
      + {CASE_LABELS[caseType]}
    </span>
  );
}

// Pattern tags component
function PatternTags({
  patterns,
  size,
}: {
  patterns: string[];
  size: 'sm' | 'md' | 'lg';
}) {
  const sizeClass = size === 'sm' ? 'badge-xs' : size === 'lg' ? 'badge-sm' : 'badge-xs';

  return (
    <span className="ml-2 inline-flex gap-1">
      {patterns.slice(0, 2).map((pattern) => (
        <span
          key={pattern}
          className={`badge badge-ghost ${sizeClass}`}
          title={`Pattern: ${pattern}`}
        >
          {pattern.replace('-', ' ')}
        </span>
      ))}
    </span>
  );
}

// Masked prefix component for drill exercises
interface MaskedPrefixProps {
  phrase: string;
  noun?: string;
  verbInfo?: VerbInfo;
  revealed?: boolean;
  onReveal?: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function MaskedPrefix({
  phrase,
  noun,
  verbInfo: providedVerbInfo,
  revealed = false,
  onReveal,
  size = 'md',
  className = '',
}: MaskedPrefixProps) {
  const verbInfo = providedVerbInfo || (noun ? parseVerbInfo(phrase, noun) : null);

  if (!verbInfo || !verbInfo.isSeparable || !verbInfo.prefix) {
    return <span className={`${className} ${getSizeClass(size)}`}>{phrase}</span>;
  }

  const { prefix, fullVerb } = verbInfo;
  const verbIndex = phrase.toLowerCase().indexOf(fullVerb.toLowerCase());

  if (verbIndex === -1) {
    return <span className={`${className} ${getSizeClass(size)}`}>{phrase}</span>;
  }

  const beforeVerb = phrase.slice(0, verbIndex);
  const actualVerb = phrase.slice(verbIndex, verbIndex + fullVerb.length);
  const afterVerb = phrase.slice(verbIndex + fullVerb.length);
  const basePart = actualVerb.slice(prefix.length);

  return (
    <span className={`${className} ${getSizeClass(size)}`}>
      {beforeVerb}
      {revealed ? (
        <span className="text-success font-bold">{prefix}</span>
      ) : (
        <button
          onClick={onReveal}
          className="btn btn-xs btn-outline btn-primary mx-0.5 min-h-0 h-6 px-2"
          title="Click to reveal prefix"
        >
          ___
        </button>
      )}
      {basePart}
      {afterVerb}
    </span>
  );
}

// Verb breakdown component showing structure
interface VerbBreakdownProps {
  verbInfo: VerbInfo;
  className?: string;
}

export function VerbBreakdown({
  verbInfo,
  className = '',
}: VerbBreakdownProps) {
  const { prefix, baseVerb, fullVerb, isSeparable, caseRequired } = verbInfo;

  if (!isSeparable || !prefix) {
    return (
      <div className={`text-sm ${className}`}>
        <span className="font-mono bg-base-200 px-2 py-1 rounded">{fullVerb}</span>
        {caseRequired && (
          <span className="ml-2 text-info text-xs">+ {CASE_LABELS[caseRequired]}</span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="font-mono bg-primary/20 px-2 py-1 rounded text-primary font-bold">
        {prefix}
      </span>
      <span className="text-base-content/50">+</span>
      <span className="font-mono bg-base-200 px-2 py-1 rounded">{baseVerb}</span>
      <span className="text-base-content/50">=</span>
      <span className="font-mono bg-base-200 px-2 py-1 rounded">{fullVerb}</span>
      {caseRequired && (
        <span className="badge badge-outline badge-info badge-sm">
          + {CASE_LABELS[caseRequired]}
        </span>
      )}
    </div>
  );
}

export default PrefixHighlighter;
