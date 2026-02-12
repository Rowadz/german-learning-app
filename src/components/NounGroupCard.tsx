// NounGroupCard Component
// Collapsible card showing a noun with all its associated verbs

import { useState } from 'react';
import type { NounGroup, VocabEntry, LearningStatus } from '../types';
import { useAppSelector, useAppDispatch } from '../hooks/useAppStore';
import { selectEntriesForNoun } from '../store/entriesSlice';
import { selectEntryStatus, setEntryStatus, selectNounGroupProgress } from '../store/progressSlice';
import { selectIsBookmarked, toggleBookmark } from '../store/bookmarksSlice';
import { PrefixHighlighter } from './PrefixHighlighter';
import { getCategoryInfo } from '../types';

interface NounGroupCardProps {
  nounGroup: NounGroup;
  defaultExpanded?: boolean;
  onVerbClick?: (entry: VocabEntry) => void;
  onStudyClick?: (nounGroup: NounGroup) => void;
  onQuizClick?: (nounGroup: NounGroup) => void;
  showActions?: boolean;
  compact?: boolean;
}

export function NounGroupCard({
  nounGroup,
  defaultExpanded = false,
  onVerbClick,
  onStudyClick,
  onQuizClick,
  showActions = true,
  compact = false,
}: NounGroupCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  // Get all entries for this noun
  const entries = useAppSelector((state) =>
    selectEntriesForNoun(state, nounGroup.noun)
  );

  // Get progress for this noun group
  const progress = useAppSelector((state) =>
    selectNounGroupProgress(state, nounGroup.entryIds)
  );

  const categoryInfo = getCategoryInfo(nounGroup.category);
  const verbCount = nounGroup.entryIds.length;
  const hasOpposites = nounGroup.verbPairs.some(p => p.relationship === 'opposite');

  // Calculate mastery percentage
  const masteryPercent = verbCount > 0
    ? Math.round((progress.mastered / verbCount) * 100)
    : 0;

  if (compact) {
    return (
      <div
        className="card bg-base-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => onVerbClick?.(entries[0])}
      >
        <div className="card-body p-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base">{nounGroup.noun}</h3>
              <p className="text-xs text-base-content/60">
                {verbCount} verb{verbCount !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="text-right">
              <div
                className="radial-progress text-primary text-xs"
                style={{ '--value': masteryPercent, '--size': '2.5rem' } as React.CSSProperties}
              >
                {masteryPercent}%
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-200 shadow-md">
      {/* Header - Always visible */}
      <div
        className="card-body p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Category icon */}
            <span className="text-2xl" title={categoryInfo.name}>
              {categoryInfo.icon}
            </span>

            {/* Noun with article */}
            <div>
              <h3 className="text-lg font-bold">
                <span className="text-primary">{nounGroup.article}</span>
                {' '}
                <span>{nounGroup.nounBase}</span>
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="badge badge-sm badge-outline">
                  {verbCount} verb{verbCount !== 1 ? 's' : ''}
                </span>
                {hasOpposites && (
                  <span className="badge badge-sm badge-accent badge-outline" title="Has opposite verb pairs">
                    opposites
                  </span>
                )}
                {progress.hasWeakVerbs && (
                  <span className="badge badge-sm badge-warning badge-outline" title="Some verbs need practice">
                    needs practice
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs text-base-content/60">Mastery</div>
              <div className="text-sm font-medium">
                {progress.mastered}/{verbCount}
              </div>
            </div>
            <div
              className="radial-progress text-primary"
              style={{ '--value': masteryPercent, '--size': '3rem' } as React.CSSProperties}
            >
              <span className="text-xs">{masteryPercent}%</span>
            </div>

            {/* Expand/collapse indicator */}
            <span className={`transition-transform ${expanded ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </div>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4">
          <div className="divider my-2"></div>

          {/* Verb list */}
          <div className="space-y-2">
            {entries.map((entry) => (
              <VerbRow
                key={entry.id}
                entry={entry}
                nounGroup={nounGroup}
                onClick={() => onVerbClick?.(entry)}
              />
            ))}
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex gap-2 mt-4 justify-end">
              <button
                className="btn btn-sm btn-outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onStudyClick?.(nounGroup);
                }}
              >
                Study
              </button>
              <button
                className="btn btn-sm btn-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  onQuizClick?.(nounGroup);
                }}
              >
                Quiz
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Individual verb row within the card
interface VerbRowProps {
  entry: VocabEntry;
  nounGroup: NounGroup;
  onClick?: () => void;
}

function VerbRow({ entry, nounGroup, onClick }: VerbRowProps) {
  const dispatch = useAppDispatch();
  const status = useAppSelector((state) => selectEntryStatus(state, entry.id));
  const isBookmarked = useAppSelector((state) => selectIsBookmarked(state, entry.id));

  // Check if this entry has an opposite in the group
  const oppositeEntryId = nounGroup.verbPairs.find(
    (p) => p.relationship === 'opposite' &&
      (p.verb1EntryId === entry.id || p.verb2EntryId === entry.id)
  );

  const handleStatusChange = (e: React.MouseEvent, newStatus: LearningStatus) => {
    e.stopPropagation();
    dispatch(setEntryStatus({ entryId: entry.id, status: newStatus }));
  };

  const handleBookmarkToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(toggleBookmark(entry.id));
  };

  return (
    <div
      className="flex items-center justify-between p-2 rounded-lg bg-base-100 hover:bg-base-300 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex-1">
        {/* Phrase with prefix highlighting */}
        <div className="flex items-center gap-2">
          <PrefixHighlighter
            phrase={entry.phrase}
            noun={entry.noun}
            verbInfo={entry.verbInfo}
            showCase
            highlightStyle="color"
            size="sm"
          />
          {oppositeEntryId && (
            <span className="text-xs text-accent" title="Has opposite verb">
              ←→
            </span>
          )}
        </div>

        {/* Translation */}
        <div className="text-xs text-base-content/60 mt-0.5">
          {entry.translation}
        </div>
      </div>

      {/* Status and actions */}
      <div className="flex items-center gap-2">
        {/* Status indicator */}
        <StatusBadge status={status} />

        {/* Bookmark button */}
        <button
          className={`btn btn-xs btn-ghost ${isBookmarked ? 'text-warning' : 'text-base-content/40'}`}
          onClick={handleBookmarkToggle}
          title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
        >
          {isBookmarked ? '★' : '☆'}
        </button>

        {/* Quick status buttons */}
        <div className="join hidden sm:flex">
          <button
            className={`btn btn-xs join-item ${status === 'new' ? 'btn-neutral' : 'btn-ghost'}`}
            onClick={(e) => handleStatusChange(e, 'new')}
            title="Mark as new"
          >
            N
          </button>
          <button
            className={`btn btn-xs join-item ${status === 'learning' ? 'btn-warning' : 'btn-ghost'}`}
            onClick={(e) => handleStatusChange(e, 'learning')}
            title="Mark as learning"
          >
            L
          </button>
          <button
            className={`btn btn-xs join-item ${status === 'known' ? 'btn-success' : 'btn-ghost'}`}
            onClick={(e) => handleStatusChange(e, 'known')}
            title="Mark as known"
          >
            K
          </button>
        </div>
      </div>
    </div>
  );
}

// Status badge component
function StatusBadge({ status }: { status: LearningStatus }) {
  switch (status) {
    case 'known':
      return <span className="badge badge-success badge-xs">Known</span>;
    case 'learning':
      return <span className="badge badge-warning badge-xs">Learning</span>;
    default:
      return <span className="badge badge-neutral badge-xs">New</span>;
  }
}

export default NounGroupCard;
