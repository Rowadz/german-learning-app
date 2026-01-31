import { useState, useMemo, useCallback } from 'react';
import { useAppSelector } from '../hooks/useAppStore';
import { selectFilteredEntries } from '../store/entriesSlice';
import { selectBookmarkIds } from '../store/bookmarksSlice';
import { selectAllProgress } from '../store/progressSlice';
import { Flashcard } from '../components/Flashcard';
import { SearchBar } from '../components/SearchBar';
import type { Category, LearningStatus } from '../types';
import { CATEGORIES } from '../types';

type FilterMode = 'all' | 'bookmarked' | 'new' | 'learning' | 'known';

export function FlashcardsPage() {
  const filteredBySearch = useAppSelector(selectFilteredEntries);
  const bookmarkIds = useAppSelector(selectBookmarkIds);
  const progress = useAppSelector(selectAllProgress);

  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isShuffled, setIsShuffled] = useState(false);

  // Filter entries based on all criteria
  const filteredEntries = useMemo(() => {
    let entries = filteredBySearch;

    // Category filter
    if (selectedCategory !== 'all') {
      entries = entries.filter((e) => e.category === selectedCategory);
    }

    // Status filter
    if (filterMode === 'bookmarked') {
      entries = entries.filter((e) => bookmarkIds.has(e.id));
    } else if (filterMode !== 'all') {
      const statusFilter: LearningStatus = filterMode as LearningStatus;
      entries = entries.filter((e) => {
        const status = progress[e.id]?.status || 'new';
        return status === statusFilter;
      });
    }

    return entries;
  }, [filteredBySearch, selectedCategory, filterMode, bookmarkIds, progress]);

  // Shuffle function
  const shuffledEntries = useMemo(() => {
    if (!isShuffled) return filteredEntries;
    return [...filteredEntries].sort(() => Math.random() - 0.5);
  }, [filteredEntries, isShuffled]);

  const currentEntry = shuffledEntries[currentIndex];

  // Reset index when filters change
  const handleFilterChange = useCallback(() => {
    setCurrentIndex(0);
  }, []);

  const handleCategoryChange = useCallback((category: Category | 'all') => {
    setSelectedCategory(category);
    handleFilterChange();
  }, [handleFilterChange]);

  const handleModeChange = useCallback((mode: FilterMode) => {
    setFilterMode(mode);
    handleFilterChange();
  }, [handleFilterChange]);

  const handleNext = useCallback(() => {
    if (currentIndex < shuffledEntries.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, shuffledEntries.length]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const handleShuffle = useCallback(() => {
    setIsShuffled((prev) => !prev);
    setCurrentIndex(0);
  }, []);

  const handleReset = useCallback(() => {
    setSelectedCategory('all');
    setFilterMode('all');
    setIsShuffled(false);
    setCurrentIndex(0);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Flashcards</h1>

      {/* Filters */}
      <div className="card bg-base-200 shadow-md mb-6">
        <div className="card-body">
          {/* Search */}
          <SearchBar placeholder="Search flashcards..." />

          {/* Category Filter */}
          <div className="mt-4">
            <label className="label">
              <span className="label-text font-semibold">Category</span>
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                className={`btn btn-sm ${selectedCategory === 'all' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => handleCategoryChange('all')}
              >
                All
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  className={`btn btn-sm ${selectedCategory === cat.id ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => handleCategoryChange(cat.id)}
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div className="mt-4">
            <label className="label">
              <span className="label-text font-semibold">Filter by Status</span>
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                className={`btn btn-sm ${filterMode === 'all' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => handleModeChange('all')}
              >
                All
              </button>
              <button
                className={`btn btn-sm ${filterMode === 'bookmarked' ? 'btn-warning' : 'btn-outline'}`}
                onClick={() => handleModeChange('bookmarked')}
              >
                ★ Bookmarked
              </button>
              <button
                className={`btn btn-sm ${filterMode === 'new' ? 'btn-neutral' : 'btn-outline'}`}
                onClick={() => handleModeChange('new')}
              >
                New
              </button>
              <button
                className={`btn btn-sm ${filterMode === 'learning' ? 'btn-warning' : 'btn-outline'}`}
                onClick={() => handleModeChange('learning')}
              >
                Learning
              </button>
              <button
                className={`btn btn-sm ${filterMode === 'known' ? 'btn-success' : 'btn-outline'}`}
                onClick={() => handleModeChange('known')}
              >
                Known
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              className={`btn btn-sm ${isShuffled ? 'btn-accent' : 'btn-outline'}`}
              onClick={handleShuffle}
            >
              🔀 {isShuffled ? 'Shuffled' : 'Shuffle'}
            </button>
            <button className="btn btn-sm btn-outline" onClick={handleReset}>
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Progress indicator */}
      {shuffledEntries.length > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>
              Card {currentIndex + 1} of {shuffledEntries.length}
            </span>
            <span>
              {Math.round(((currentIndex + 1) / shuffledEntries.length) * 100)}% through deck
            </span>
          </div>
          <progress
            className="progress progress-primary w-full"
            value={currentIndex + 1}
            max={shuffledEntries.length}
          ></progress>
        </div>
      )}

      {/* Flashcard */}
      {currentEntry ? (
        <Flashcard
          key={currentEntry.id}
          entry={currentEntry}
          onNext={currentIndex < shuffledEntries.length - 1 ? handleNext : undefined}
          onPrevious={currentIndex > 0 ? handlePrevious : undefined}
        />
      ) : (
        <div className="alert alert-info">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="stroke-current shrink-0 w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <span>No entries match your filters. Try adjusting your selection.</span>
        </div>
      )}

      {/* Quick navigation */}
      {shuffledEntries.length > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setCurrentIndex(0)}
            disabled={currentIndex === 0}
          >
            First
          </button>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setCurrentIndex(shuffledEntries.length - 1)}
            disabled={currentIndex === shuffledEntries.length - 1}
          >
            Last
          </button>
        </div>
      )}
    </div>
  );
}
