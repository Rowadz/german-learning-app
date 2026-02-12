import { useState, useMemo, useCallback } from "react";
import { useAppSelector } from "../hooks/useAppStore";
import {
  selectFilteredEntries,
  selectNounsWithMultipleVerbs,
  selectAllEntries,
} from "../store/entriesSlice";
import { selectBookmarkIds } from "../store/bookmarksSlice";
import { selectAllProgress, selectWeakEntries } from "../store/progressSlice";
import { Flashcard } from "../components/Flashcard";
import { SearchBar } from "../components/SearchBar";
import { PrefixHighlighter, MaskedPrefix } from "../components/PrefixHighlighter";
import type { Category, LearningStatus, FlashcardMode, VocabEntry, NounGroup } from "../types";
import { CATEGORIES } from "../types";

type FilterMode = "all" | "bookmarked" | "new" | "learning" | "known" | "weak";

// Flashcard mode descriptions for tooltip
const FLASHCARD_MODE_INFO: Record<FlashcardMode, { name: string; description: string }> = {
  standard: {
    name: "Standard",
    description: "Classic flip card: noun on front, phrase and example on back",
  },
  "verb-focused": {
    name: "Verb Focus",
    description: "Group cards by noun, cycle through all verbs for each noun",
  },
  "progressive-reveal": {
    name: "Progressive",
    description: "Reveal information step by step: verb, then example, then translation",
  },
  "prefix-drill": {
    name: "Prefix Drill",
    description: "Hide separable prefixes - test your recall of verb prefixes",
  },
  "opposite-recall": {
    name: "Opposites",
    description: "Show one verb, try to recall the opposite action",
  },
};

export function FlashcardsPage() {
  const filteredBySearch = useAppSelector(selectFilteredEntries);
  const bookmarkIds = useAppSelector(selectBookmarkIds);
  const progress = useAppSelector(selectAllProgress);
  const allEntries = useAppSelector(selectAllEntries);
  const multiVerbNouns = useAppSelector(selectNounsWithMultipleVerbs);
  const weakEntries = useAppSelector(selectWeakEntries);

  const [selectedCategory, setSelectedCategory] = useState<Category | "all">(
    "all",
  );
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isShuffled, setIsShuffled] = useState(false);

  // New: Flashcard study mode
  const [flashcardMode, setFlashcardMode] = useState<FlashcardMode>("standard");

  // For verb-focused mode: track current noun group and verb index within group
  const [currentNounIndex, setCurrentNounIndex] = useState(0);
  const [currentVerbInGroup, setCurrentVerbInGroup] = useState(0);

  // For progressive reveal mode
  const [revealLevel, setRevealLevel] = useState(0); // 0=verb, 1=example, 2=translation

  // For prefix drill mode
  const [prefixRevealed, setPrefixRevealed] = useState(false);

  // Filter entries based on all criteria
  const filteredEntries = useMemo(() => {
    let entries = filteredBySearch;

    // Category filter
    if (selectedCategory !== "all") {
      entries = entries.filter((e) => e.category === selectedCategory);
    }

    // Status filter
    if (filterMode === "bookmarked") {
      entries = entries.filter((e) => bookmarkIds.has(e.id));
    } else if (filterMode === "weak") {
      const weakIds = new Set(weakEntries.map(e => e.id));
      entries = entries.filter((e) => weakIds.has(e.id));
    } else if (filterMode !== "all") {
      const statusFilter: LearningStatus = filterMode as LearningStatus;
      entries = entries.filter((e) => {
        const status = progress[e.id]?.status || "new";
        return status === statusFilter;
      });
    }

    return entries;
  }, [filteredBySearch, selectedCategory, filterMode, bookmarkIds, progress, weakEntries]);

  // For verb-focused mode: get relevant noun groups
  const relevantNounGroups = useMemo(() => {
    if (flashcardMode !== "verb-focused") return [];

    let groups = multiVerbNouns;
    if (selectedCategory !== "all") {
      groups = groups.filter(g => g.category === selectedCategory);
    }
    return groups;
  }, [flashcardMode, multiVerbNouns, selectedCategory]);

  // Get entries for current noun group in verb-focused mode
  const currentGroupEntries = useMemo(() => {
    if (flashcardMode !== "verb-focused" || relevantNounGroups.length === 0) return [];
    const group = relevantNounGroups[currentNounIndex];
    if (!group) return [];
    return allEntries.filter(e => group.entryIds.includes(e.id));
  }, [flashcardMode, relevantNounGroups, currentNounIndex, allEntries]);

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

  const handleCategoryChange = useCallback(
    (category: Category | "all") => {
      setSelectedCategory(category);
      handleFilterChange();
    },
    [handleFilterChange],
  );

  const handleModeChange = useCallback(
    (mode: FilterMode) => {
      setFilterMode(mode);
      handleFilterChange();
    },
    [handleFilterChange],
  );

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
    setSelectedCategory("all");
    setFilterMode("all");
    setIsShuffled(false);
    setCurrentIndex(0);
    setFlashcardMode("standard");
    setCurrentNounIndex(0);
    setCurrentVerbInGroup(0);
    setRevealLevel(0);
    setPrefixRevealed(false);
  }, []);

  // Mode-specific navigation handlers
  const handleModeNext = useCallback(() => {
    if (flashcardMode === "verb-focused") {
      // Move to next verb in group, or next group
      if (currentVerbInGroup < currentGroupEntries.length - 1) {
        setCurrentVerbInGroup(prev => prev + 1);
      } else if (currentNounIndex < relevantNounGroups.length - 1) {
        setCurrentNounIndex(prev => prev + 1);
        setCurrentVerbInGroup(0);
      }
    } else if (flashcardMode === "progressive-reveal") {
      // Reveal next level or move to next card
      if (revealLevel < 2) {
        setRevealLevel(prev => prev + 1);
      } else {
        setRevealLevel(0);
        handleNext();
      }
    } else if (flashcardMode === "prefix-drill") {
      // Move to next card, reset reveal
      setPrefixRevealed(false);
      handleNext();
    } else {
      handleNext();
    }
  }, [flashcardMode, currentVerbInGroup, currentGroupEntries.length, currentNounIndex, relevantNounGroups.length, revealLevel, handleNext]);

  const handleModePrevious = useCallback(() => {
    if (flashcardMode === "verb-focused") {
      if (currentVerbInGroup > 0) {
        setCurrentVerbInGroup(prev => prev - 1);
      } else if (currentNounIndex > 0) {
        setCurrentNounIndex(prev => prev - 1);
        // Set to last verb of previous group
        const prevGroup = relevantNounGroups[currentNounIndex - 1];
        if (prevGroup) {
          setCurrentVerbInGroup(prevGroup.entryIds.length - 1);
        }
      }
    } else if (flashcardMode === "progressive-reveal") {
      if (revealLevel > 0) {
        setRevealLevel(prev => prev - 1);
      } else {
        handlePrevious();
        setRevealLevel(2);
      }
    } else if (flashcardMode === "prefix-drill") {
      setPrefixRevealed(false);
      handlePrevious();
    } else {
      handlePrevious();
    }
  }, [flashcardMode, currentVerbInGroup, currentNounIndex, relevantNounGroups, revealLevel, handlePrevious]);

  // Get the current entry based on mode
  const getActiveEntry = useCallback((): VocabEntry | undefined => {
    if (flashcardMode === "verb-focused") {
      return currentGroupEntries[currentVerbInGroup];
    }
    return currentEntry;
  }, [flashcardMode, currentGroupEntries, currentVerbInGroup, currentEntry]);

  // Check if we can go next/previous based on mode
  const canGoNext = useMemo(() => {
    if (flashcardMode === "verb-focused") {
      return currentVerbInGroup < currentGroupEntries.length - 1 ||
             currentNounIndex < relevantNounGroups.length - 1;
    }
    if (flashcardMode === "progressive-reveal") {
      return revealLevel < 2 || currentIndex < shuffledEntries.length - 1;
    }
    return currentIndex < shuffledEntries.length - 1;
  }, [flashcardMode, currentVerbInGroup, currentGroupEntries.length, currentNounIndex, relevantNounGroups.length, revealLevel, currentIndex, shuffledEntries.length]);

  const canGoPrevious = useMemo(() => {
    if (flashcardMode === "verb-focused") {
      return currentVerbInGroup > 0 || currentNounIndex > 0;
    }
    if (flashcardMode === "progressive-reveal") {
      return revealLevel > 0 || currentIndex > 0;
    }
    return currentIndex > 0;
  }, [flashcardMode, currentVerbInGroup, currentNounIndex, revealLevel, currentIndex]);

  const activeEntry = getActiveEntry();

  return (
    <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6">
        Flashcards
      </h1>

      {/* Filters */}
      <div className="card bg-base-200 shadow-md mb-4 sm:mb-6">
        <div className="card-body p-4 sm:p-6">
          {/* Search */}
          <SearchBar placeholder="Search flashcards..." />

          {/* Category Filter */}
          <div className="mt-3 sm:mt-4">
            <label className="label">
              <span className="label-text font-semibold text-sm sm:text-base">
                Category
              </span>
            </label>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              <button
                className={`btn btn-xs sm:btn-sm ${selectedCategory === "all" ? "btn-primary" : "btn-outline"}`}
                onClick={() => handleCategoryChange("all")}
              >
                All
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  className={`btn btn-xs sm:btn-sm ${selectedCategory === cat.id ? "btn-primary" : "btn-outline"}`}
                  onClick={() => handleCategoryChange(cat.id)}
                >
                  <span className="hidden xs:inline">{cat.icon} </span>
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div className="mt-3 sm:mt-4">
            <label className="label">
              <span className="label-text font-semibold text-sm sm:text-base">
                Filter by Status
              </span>
            </label>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              <button
                className={`btn btn-xs sm:btn-sm ${filterMode === "all" ? "btn-primary" : "btn-outline"}`}
                onClick={() => handleModeChange("all")}
              >
                All
              </button>
              <button
                className={`btn btn-xs sm:btn-sm ${filterMode === "bookmarked" ? "btn-warning" : "btn-outline"}`}
                onClick={() => handleModeChange("bookmarked")}
              >
                ★ <span className="hidden xs:inline">Bookmarked</span>
              </button>
              <button
                className={`btn btn-xs sm:btn-sm ${filterMode === "new" ? "btn-neutral" : "btn-outline"}`}
                onClick={() => handleModeChange("new")}
              >
                New
              </button>
              <button
                className={`btn btn-xs sm:btn-sm ${filterMode === "learning" ? "btn-warning" : "btn-outline"}`}
                onClick={() => handleModeChange("learning")}
              >
                Learning
              </button>
              <button
                className={`btn btn-xs sm:btn-sm ${filterMode === "known" ? "btn-success" : "btn-outline"}`}
                onClick={() => handleModeChange("known")}
              >
                Known
              </button>
            </div>
          </div>

          {/* Study Mode Selector */}
          <div className="mt-3 sm:mt-4">
            <label className="label">
              <span className="label-text font-semibold text-sm sm:text-base">
                Study Mode
              </span>
            </label>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {(Object.keys(FLASHCARD_MODE_INFO) as FlashcardMode[]).map((mode) => (
                <button
                  key={mode}
                  className={`btn btn-xs sm:btn-sm ${flashcardMode === mode ? "btn-secondary" : "btn-outline"}`}
                  onClick={() => {
                    setFlashcardMode(mode);
                    setCurrentIndex(0);
                    setCurrentNounIndex(0);
                    setCurrentVerbInGroup(0);
                    setRevealLevel(0);
                    setPrefixRevealed(false);
                  }}
                  title={FLASHCARD_MODE_INFO[mode].description}
                >
                  {FLASHCARD_MODE_INFO[mode].name}
                </button>
              ))}
            </div>
            <p className="text-xs text-base-content/60 mt-1">
              {FLASHCARD_MODE_INFO[flashcardMode].description}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3 sm:mt-4">
            <button
              className={`btn btn-xs sm:btn-sm ${isShuffled ? "btn-accent" : "btn-outline"}`}
              onClick={handleShuffle}
              disabled={flashcardMode === "verb-focused"}
            >
              🔀{" "}
              <span className="hidden sm:inline">
                {isShuffled ? "Shuffled" : "Shuffle"}
              </span>
            </button>
            <button
              className={`btn btn-xs sm:btn-sm ${filterMode === "weak" ? "btn-warning" : "btn-outline"}`}
              onClick={() => handleModeChange(filterMode === "weak" ? "all" : "weak")}
            >
              Focus Weak
            </button>
            <button
              className="btn btn-xs sm:btn-sm btn-outline"
              onClick={handleReset}
            >
              <span className="hidden sm:inline">Reset All</span>
              <span className="sm:hidden">Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Progress indicator */}
      {flashcardMode === "verb-focused" ? (
        relevantNounGroups.length > 0 && (
          <div className="mb-3 sm:mb-4">
            <div className="flex justify-between text-xs sm:text-sm mb-1">
              <span>
                Noun {currentNounIndex + 1}/{relevantNounGroups.length} • Verb {currentVerbInGroup + 1}/{currentGroupEntries.length}
              </span>
              <span className="badge badge-secondary badge-sm">
                {relevantNounGroups[currentNounIndex]?.noun}
              </span>
            </div>
            <progress
              className="progress progress-secondary w-full h-2 sm:h-3"
              value={currentNounIndex * 100 + (currentVerbInGroup + 1) * (100 / (currentGroupEntries.length || 1))}
              max={relevantNounGroups.length * 100}
            ></progress>
          </div>
        )
      ) : shuffledEntries.length > 0 && (
        <div className="mb-3 sm:mb-4">
          <div className="flex justify-between text-xs sm:text-sm mb-1">
            <span>
              Card {currentIndex + 1} of {shuffledEntries.length}
            </span>
            {flashcardMode === "progressive-reveal" && (
              <span className="badge badge-info badge-sm">
                Reveal: {revealLevel + 1}/3
              </span>
            )}
            <span className="hidden xs:inline">
              {Math.round(((currentIndex + 1) / shuffledEntries.length) * 100)}%
              through deck
            </span>
            <span className="xs:hidden">
              {Math.round(((currentIndex + 1) / shuffledEntries.length) * 100)}%
            </span>
          </div>
          <progress
            className="progress progress-primary w-full h-2 sm:h-3"
            value={currentIndex + 1}
            max={shuffledEntries.length}
          ></progress>
        </div>
      )}

      {/* Flashcard - rendered based on mode */}
      {activeEntry ? (
        flashcardMode === "standard" || flashcardMode === "opposite-recall" ? (
          <Flashcard
            key={activeEntry.id}
            entry={activeEntry}
            onNext={canGoNext ? handleModeNext : undefined}
            onPrevious={canGoPrevious ? handleModePrevious : undefined}
          />
        ) : flashcardMode === "verb-focused" ? (
          <VerbFocusedCard
            entry={activeEntry}
            nounGroup={relevantNounGroups[currentNounIndex]}
            groupEntries={currentGroupEntries}
            currentVerbIndex={currentVerbInGroup}
            onNext={canGoNext ? handleModeNext : undefined}
            onPrevious={canGoPrevious ? handleModePrevious : undefined}
          />
        ) : flashcardMode === "progressive-reveal" ? (
          <ProgressiveRevealCard
            entry={activeEntry}
            revealLevel={revealLevel}
            onRevealMore={() => setRevealLevel(prev => Math.min(2, prev + 1))}
            onNext={canGoNext ? handleModeNext : undefined}
            onPrevious={canGoPrevious ? handleModePrevious : undefined}
          />
        ) : flashcardMode === "prefix-drill" ? (
          <PrefixDrillCard
            entry={activeEntry}
            revealed={prefixRevealed}
            onReveal={() => setPrefixRevealed(true)}
            onNext={canGoNext ? handleModeNext : undefined}
            onPrevious={canGoPrevious ? handleModePrevious : undefined}
          />
        ) : (
          <Flashcard
            key={activeEntry.id}
            entry={activeEntry}
            onNext={canGoNext ? handleModeNext : undefined}
            onPrevious={canGoPrevious ? handleModePrevious : undefined}
          />
        )
      ) : flashcardMode === "verb-focused" && relevantNounGroups.length === 0 ? (
        <div className="alert alert-info">
          <span>
            No nouns with multiple verbs found. Try the standard mode or adjust your filters.
          </span>
        </div>
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
          <span>
            No entries match your filters. Try adjusting your selection.
          </span>
        </div>
      )}

      {/* Quick navigation */}
      {shuffledEntries.length > 1 && flashcardMode === "standard" && (
        <div className="flex justify-center gap-2 mt-4 sm:mt-6">
          <button
            className="btn btn-outline btn-xs sm:btn-sm"
            onClick={() => setCurrentIndex(0)}
            disabled={currentIndex === 0}
          >
            <span className="hidden sm:inline">First</span>
            <span className="sm:hidden">⏮</span>
          </button>
          <button
            className="btn btn-outline btn-xs sm:btn-sm"
            onClick={() => setCurrentIndex(shuffledEntries.length - 1)}
            disabled={currentIndex === shuffledEntries.length - 1}
          >
            <span className="hidden sm:inline">Last</span>
            <span className="sm:hidden">⏭</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ============ Mode-Specific Card Components ============

// Verb-Focused Card: Shows noun header and cycles through verbs
interface VerbFocusedCardProps {
  entry: VocabEntry;
  nounGroup: NounGroup | undefined;
  groupEntries: VocabEntry[];
  currentVerbIndex: number;
  onNext?: () => void;
  onPrevious?: () => void;
}

function VerbFocusedCard({
  entry,
  nounGroup,
  groupEntries,
  currentVerbIndex,
  onNext,
  onPrevious,
}: VerbFocusedCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="card bg-base-200 shadow-xl max-w-lg mx-auto">
      <div className="card-body p-4 sm:p-6">
        {/* Noun header - stays constant */}
        <div className="text-center border-b border-base-300 pb-3 mb-4">
          <div className="badge badge-secondary mb-2">{nounGroup?.category}</div>
          <h2 className="text-2xl sm:text-3xl font-bold">{entry.noun}</h2>
          <p className="text-sm text-base-content/60 mt-1">
            Verb {currentVerbIndex + 1} of {groupEntries.length}
          </p>
        </div>

        {/* Current verb */}
        <div
          className="text-center cursor-pointer min-h-[150px] flex flex-col justify-center"
          onClick={() => setShowDetails(!showDetails)}
        >
          <PrefixHighlighter
            phrase={entry.phrase}
            noun={entry.noun}
            verbInfo={entry.verbInfo}
            showCase
            highlightStyle="color"
            size="lg"
            className="font-semibold text-xl sm:text-2xl"
          />

          {showDetails && (
            <div className="mt-4 space-y-2 animate-fade-in">
              <p className="text-base-content/70 italic">{entry.example}</p>
              <p className="text-base-content/50 text-sm">{entry.translation}</p>
            </div>
          )}

          {!showDetails && (
            <p className="text-xs text-base-content/40 mt-4">Tap to reveal details</p>
          )}
        </div>

        {/* Verb indicator dots */}
        <div className="flex justify-center gap-1 my-4">
          {groupEntries.map((_, idx) => (
            <span
              key={idx}
              className={`w-2 h-2 rounded-full ${
                idx === currentVerbIndex ? "bg-primary" : "bg-base-300"
              }`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            className="btn btn-outline btn-sm"
            onClick={onPrevious}
            disabled={!onPrevious}
          >
            ← Previous
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              setShowDetails(false);
              onNext?.();
            }}
            disabled={!onNext}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}

// Progressive Reveal Card: Verb → Example → Translation
interface ProgressiveRevealCardProps {
  entry: VocabEntry;
  revealLevel: number; // 0, 1, or 2
  onRevealMore: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
}

function ProgressiveRevealCard({
  entry,
  revealLevel,
  onRevealMore,
  onNext,
  onPrevious,
}: ProgressiveRevealCardProps) {
  return (
    <div className="card bg-base-200 shadow-xl max-w-lg mx-auto">
      <div className="card-body p-4 sm:p-6">
        {/* Level 0: Always show verb */}
        <div className="text-center mb-4">
          <div className="badge badge-info mb-2">Verb</div>
          <PrefixHighlighter
            phrase={entry.phrase}
            noun={entry.noun}
            verbInfo={entry.verbInfo}
            showCase
            highlightStyle="color"
            size="lg"
            className="font-bold text-xl sm:text-2xl"
          />
        </div>

        {/* Level 1: Show example */}
        {revealLevel >= 1 ? (
          <div className="text-center border-t border-base-300 pt-4 mb-4 animate-fade-in">
            <div className="badge badge-success mb-2">Example</div>
            <p className="text-lg italic text-base-content/80">{entry.example}</p>
          </div>
        ) : (
          <div className="text-center border-t border-base-300 pt-4 mb-4">
            <button
              className="btn btn-outline btn-success btn-sm"
              onClick={onRevealMore}
            >
              Reveal Example
            </button>
          </div>
        )}

        {/* Level 2: Show translation */}
        {revealLevel >= 2 ? (
          <div className="text-center border-t border-base-300 pt-4 mb-4 animate-fade-in">
            <div className="badge badge-warning mb-2">Translation</div>
            <p className="text-base text-base-content/70">{entry.translation}</p>
          </div>
        ) : revealLevel >= 1 ? (
          <div className="text-center border-t border-base-300 pt-4 mb-4">
            <button
              className="btn btn-outline btn-warning btn-sm"
              onClick={onRevealMore}
            >
              Reveal Translation
            </button>
          </div>
        ) : null}

        {/* Navigation */}
        <div className="flex justify-between mt-4">
          <button
            className="btn btn-outline btn-sm"
            onClick={onPrevious}
            disabled={!onPrevious}
          >
            ← Back
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={onNext}
            disabled={!onNext}
          >
            {revealLevel < 2 ? "Skip →" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Prefix Drill Card: Hide prefix, reveal on click
interface PrefixDrillCardProps {
  entry: VocabEntry;
  revealed: boolean;
  onReveal: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
}

function PrefixDrillCard({
  entry,
  revealed,
  onReveal,
  onNext,
  onPrevious,
}: PrefixDrillCardProps) {
  const hasSeparablePrefix = entry.verbInfo?.isSeparable && entry.verbInfo?.prefix;

  return (
    <div className="card bg-base-200 shadow-xl max-w-lg mx-auto">
      <div className="card-body p-4 sm:p-6 text-center">
        {/* Noun context */}
        <div className="mb-4">
          <span className="text-base-content/60">With</span>
          <span className="font-bold text-lg ml-2">{entry.noun}</span>
        </div>

        {/* Masked or revealed phrase */}
        <div className="min-h-[100px] flex items-center justify-center">
          {hasSeparablePrefix ? (
            <MaskedPrefix
              phrase={entry.phrase}
              noun={entry.noun}
              verbInfo={entry.verbInfo}
              revealed={revealed}
              onReveal={onReveal}
              size="lg"
              className="text-xl sm:text-2xl font-semibold"
            />
          ) : (
            <div>
              <p className="text-xl sm:text-2xl font-semibold">{entry.phrase}</p>
              <p className="text-sm text-base-content/60 mt-2">
                (No separable prefix)
              </p>
            </div>
          )}
        </div>

        {/* Translation hint */}
        {revealed && (
          <div className="mt-4 p-3 bg-base-300 rounded-lg animate-fade-in">
            <p className="text-sm text-base-content/70">{entry.translation}</p>
          </div>
        )}

        {/* Hint if not revealed */}
        {!revealed && hasSeparablePrefix && (
          <p className="text-xs text-base-content/40 mt-4">
            Click the blank to reveal the prefix
          </p>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <button
            className="btn btn-outline btn-sm"
            onClick={onPrevious}
            disabled={!onPrevious}
          >
            ← Previous
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={onNext}
            disabled={!onNext}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
