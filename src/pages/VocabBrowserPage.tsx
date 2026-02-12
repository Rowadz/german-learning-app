// VocabBrowserPage
// Browse vocabulary with noun grouping, verb relationships, and comparisons

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../hooks/useAppStore';
import {
  selectEntriesGroupedByNoun,
  selectNounsWithMultipleVerbs,
  selectNounsWithOppositePairs,
  selectNounGroupStats,
  selectAllEntries,
  selectSearchQuery,
} from '../store/entriesSlice';
import { NounGroupCard } from '../components/NounGroupCard';
import { VerbComparisonGrid } from '../components/VerbComparison';
import { SearchBar } from '../components/SearchBar';
import type { Category, NounGroup, VocabEntry, VerbPair } from '../types';
import { CATEGORIES } from '../types';

type ViewMode = 'grouped' | 'flat' | 'opposites';
type FilterType = 'all' | 'multi-verb' | 'with-opposites';

export function VocabBrowserPage() {
  const navigate = useNavigate();

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('grouped');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [expandAll, setExpandAll] = useState(false);

  // Selectors
  const allNounGroups = useAppSelector(selectEntriesGroupedByNoun);
  const multiVerbNouns = useAppSelector(selectNounsWithMultipleVerbs);
  const nounsWithOpposites = useAppSelector(selectNounsWithOppositePairs);
  const stats = useAppSelector(selectNounGroupStats);
  const searchQuery = useAppSelector(selectSearchQuery);
  const allEntries = useAppSelector(selectAllEntries);

  // Filter noun groups based on current filters
  const filteredNounGroups = useMemo(() => {
    let groups: NounGroup[] = [];

    // Apply filter type
    switch (filterType) {
      case 'multi-verb':
        groups = multiVerbNouns;
        break;
      case 'with-opposites':
        groups = nounsWithOpposites;
        break;
      default:
        groups = allNounGroups;
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      groups = groups.filter(g => g.category === categoryFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      groups = groups.filter(g =>
        g.noun.toLowerCase().includes(query) ||
        g.nounBase.toLowerCase().includes(query)
      );
    }

    return groups;
  }, [allNounGroups, multiVerbNouns, nounsWithOpposites, filterType, categoryFilter, searchQuery]);

  // Get all opposite pairs for the opposites view
  const allOppositePairs = useMemo(() => {
    const pairs: Array<{ entry1: VocabEntry; entry2: VocabEntry; relationship: 'opposite' }> = [];
    const processedPairs = new Set<string>();

    filteredNounGroups.forEach(group => {
      group.verbPairs
        .filter(p => p.relationship === 'opposite')
        .forEach((pair: VerbPair) => {
          const pairKey = [pair.verb1EntryId, pair.verb2EntryId].sort().join('-');
          if (!processedPairs.has(pairKey)) {
            const entry1 = allEntries.find(e => e.id === pair.verb1EntryId);
            const entry2 = allEntries.find(e => e.id === pair.verb2EntryId);
            if (entry1 && entry2) {
              pairs.push({ entry1, entry2, relationship: 'opposite' });
              processedPairs.add(pairKey);
            }
          }
        });
    });

    return pairs;
  }, [filteredNounGroups, allEntries]);

  // Handlers
  const handleVerbClick = (entry: VocabEntry) => {
    navigate(`/flashcards?entryId=${entry.id}`);
  };

  const handleStudyClick = (nounGroup: NounGroup) => {
    navigate(`/flashcards?noun=${encodeURIComponent(nounGroup.noun)}`);
  };

  const handleQuizClick = (nounGroup: NounGroup) => {
    navigate(`/quizzes?noun=${encodeURIComponent(nounGroup.noun)}`);
  };

  const handlePairClick = (entry1: VocabEntry, entry2: VocabEntry) => {
    navigate(`/flashcards?entryId=${entry1.id}&compare=${entry2.id}`);
  };

  return (
    <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Vocabulary Browser</h1>
        <p className="text-base-content/70">
          Explore vocabulary organized by noun, discover verb relationships and opposites.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="stat bg-base-200 rounded-lg p-3">
          <div className="stat-title text-xs">Nouns</div>
          <div className="stat-value text-xl">{stats.totalNouns}</div>
        </div>
        <div className="stat bg-base-200 rounded-lg p-3">
          <div className="stat-title text-xs">With Multiple Verbs</div>
          <div className="stat-value text-xl">{stats.nounsWithMultipleVerbs}</div>
        </div>
        <div className="stat bg-base-200 rounded-lg p-3">
          <div className="stat-title text-xs">Opposite Pairs</div>
          <div className="stat-value text-xl">{stats.totalOppositePairs}</div>
        </div>
        <div className="stat bg-base-200 rounded-lg p-3">
          <div className="stat-title text-xs">Avg Verbs/Noun</div>
          <div className="stat-value text-xl">{stats.averageVerbsPerNoun.toFixed(1)}</div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="card bg-base-200 shadow-md mb-6">
        <div className="card-body p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <SearchBar placeholder="Search nouns..." />
            </div>

            {/* View Mode Toggle */}
            <div className="join">
              <button
                className={`join-item btn btn-sm ${viewMode === 'grouped' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setViewMode('grouped')}
              >
                Grouped
              </button>
              <button
                className={`join-item btn btn-sm ${viewMode === 'opposites' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setViewMode('opposites')}
              >
                Opposites
              </button>
            </div>
          </div>

          {/* Secondary filters */}
          <div className="flex flex-wrap gap-2 mt-3">
            {/* Filter Type */}
            <select
              className="select select-sm select-bordered"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as FilterType)}
            >
              <option value="all">All Nouns</option>
              <option value="multi-verb">Multiple Verbs Only</option>
              <option value="with-opposites">With Opposites Only</option>
            </select>

            {/* Category Filter */}
            <select
              className="select select-sm select-bordered"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as Category | 'all')}
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>

            {/* Expand/Collapse All */}
            {viewMode === 'grouped' && (
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => setExpandAll(!expandAll)}
              >
                {expandAll ? 'Collapse All' : 'Expand All'}
              </button>
            )}

            {/* Results count */}
            <span className="text-sm text-base-content/60 self-center ml-auto">
              {filteredNounGroups.length} noun{filteredNounGroups.length !== 1 ? 's' : ''}
              {viewMode === 'opposites' && ` • ${allOppositePairs.length} pairs`}
            </span>
          </div>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'grouped' ? (
        <GroupedView
          nounGroups={filteredNounGroups}
          expandAll={expandAll}
          onVerbClick={handleVerbClick}
          onStudyClick={handleStudyClick}
          onQuizClick={handleQuizClick}
        />
      ) : (
        <OppositesView
          pairs={allOppositePairs}
          onPairClick={handlePairClick}
        />
      )}

      {/* Empty state */}
      {filteredNounGroups.length === 0 && (
        <div className="alert alert-info">
          <span>No nouns match your current filters. Try adjusting your search or filters.</span>
        </div>
      )}
    </div>
  );
}

// Grouped view component
interface GroupedViewProps {
  nounGroups: NounGroup[];
  expandAll: boolean;
  onVerbClick: (entry: VocabEntry) => void;
  onStudyClick: (nounGroup: NounGroup) => void;
  onQuizClick: (nounGroup: NounGroup) => void;
}

function GroupedView({
  nounGroups,
  expandAll,
  onVerbClick,
  onStudyClick,
  onQuizClick,
}: GroupedViewProps) {
  // Group nouns by category
  const groupedByCategory = useMemo(() => {
    const grouped = new Map<Category, NounGroup[]>();
    nounGroups.forEach(ng => {
      const existing = grouped.get(ng.category) || [];
      grouped.set(ng.category, [...existing, ng]);
    });
    return grouped;
  }, [nounGroups]);

  // If filtering by category, show flat list
  if (groupedByCategory.size === 1) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {nounGroups.map(nounGroup => (
          <NounGroupCard
            key={nounGroup.noun}
            nounGroup={nounGroup}
            defaultExpanded={expandAll}
            onVerbClick={onVerbClick}
            onStudyClick={onStudyClick}
            onQuizClick={onQuizClick}
          />
        ))}
      </div>
    );
  }

  // Show grouped by category
  return (
    <div className="space-y-8">
      {CATEGORIES.map(category => {
        const categoryNouns = groupedByCategory.get(category.id);
        if (!categoryNouns || categoryNouns.length === 0) return null;

        return (
          <div key={category.id}>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>{category.icon}</span>
              <span>{category.name}</span>
              <span className="badge badge-sm badge-outline">{categoryNouns.length}</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categoryNouns.map(nounGroup => (
                <NounGroupCard
                  key={nounGroup.noun}
                  nounGroup={nounGroup}
                  defaultExpanded={expandAll}
                  onVerbClick={onVerbClick}
                  onStudyClick={onStudyClick}
                  onQuizClick={onQuizClick}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Opposites view component
interface OppositesViewProps {
  pairs: Array<{ entry1: VocabEntry; entry2: VocabEntry; relationship: 'opposite' }>;
  onPairClick: (entry1: VocabEntry, entry2: VocabEntry) => void;
}

function OppositesView({ pairs, onPairClick }: OppositesViewProps) {
  if (pairs.length === 0) {
    return (
      <div className="alert alert-info">
        <span>No opposite verb pairs found with current filters.</span>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Opposite Verb Pairs</h2>
        <p className="text-sm text-base-content/60">
          These verbs represent opposite actions. Learning them together helps you understand contrasts.
        </p>
      </div>
      <VerbComparisonGrid
        pairs={pairs}
        onPairClick={onPairClick}
      />
    </div>
  );
}

export default VocabBrowserPage;
