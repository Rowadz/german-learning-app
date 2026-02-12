import { createSlice, createSelector, type PayloadAction } from '@reduxjs/toolkit';
import type { VocabEntry, Category, NounGroup, VerbPatternType } from '../types';
import { seedData } from '../data/seedData';
import { v4 as uuidv4 } from 'uuid';
import type { RootState } from './index';
import {
  groupEntriesByNoun,
  parseVerbInfo,
  areVerbsOpposites,
} from '../utils/verbAnalysis';

interface EntriesState {
  items: VocabEntry[];
  searchQuery: string;
  selectedCategory: Category | null;
}

const initialState: EntriesState = {
  items: seedData,
  searchQuery: '',
  selectedCategory: null,
};

const entriesSlice = createSlice({
  name: 'entries',
  initialState,
  reducers: {
    setEntries: (state, action: PayloadAction<VocabEntry[]>) => {
      state.items = action.payload;
    },
    addEntry: (state, action: PayloadAction<Omit<VocabEntry, 'id' | 'isCustom' | 'createdAt'>>) => {
      const newEntry: VocabEntry = {
        ...action.payload,
        id: uuidv4(),
        isCustom: true,
        createdAt: new Date().toISOString(),
      };
      state.items.push(newEntry);
    },
    updateEntry: (state, action: PayloadAction<VocabEntry>) => {
      const index = state.items.findIndex((e) => e.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    deleteEntry: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((e) => e.id !== action.payload);
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setSelectedCategory: (state, action: PayloadAction<Category | null>) => {
      state.selectedCategory = action.payload;
    },
  },
});

export const {
  setEntries,
  addEntry,
  updateEntry,
  deleteEntry,
  setSearchQuery,
  setSelectedCategory,
} = entriesSlice.actions;

// Selectors
export const selectAllEntries = (state: RootState) => state.entries.items;
export const selectSearchQuery = (state: RootState) => state.entries.searchQuery;
export const selectSelectedCategory = (state: RootState) => state.entries.selectedCategory;

export const selectFilteredEntries = createSelector(
  [selectAllEntries, selectSearchQuery, selectSelectedCategory],
  (entries, searchQuery, selectedCategory) => {
    let filtered = entries;

    if (selectedCategory) {
      filtered = filtered.filter((e) => e.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.noun.toLowerCase().includes(query) ||
          e.phrase.toLowerCase().includes(query) ||
          e.example.toLowerCase().includes(query) ||
          e.translation.toLowerCase().includes(query)
      );
    }

    return filtered;
  }
);

export const selectEntriesByCategory = createSelector(
  [selectAllEntries, (_state: RootState, category: Category) => category],
  (entries, category) => entries.filter((e) => e.category === category)
);

export const selectEntryById = createSelector(
  [selectAllEntries, (_state: RootState, id: string) => id],
  (entries, id) => entries.find((e) => e.id === id)
);

export const selectCategoryCounts = createSelector([selectAllEntries], (entries) => {
  const counts: Record<Category, number> = {
    home: 0,
    work: 0,
    street: 0,
    friends: 0,
    love: 0,
    cleaning: 0,
    food: 0,
    shopping: 0,
    travel: 0,
    health: 0,
  };

  entries.forEach((e) => {
    counts[e.category]++;
  });

  return counts;
});

// ============ NOUN GROUPING SELECTORS ============

/**
 * Group all entries by their noun
 * Returns NounGroup[] with verb pairs detected
 */
export const selectEntriesGroupedByNoun = createSelector(
  [selectAllEntries],
  (entries): NounGroup[] => groupEntriesByNoun(entries)
);

/**
 * Get all unique nouns
 */
export const selectAllNouns = createSelector(
  [selectAllEntries],
  (entries): string[] => [...new Set(entries.map(e => e.noun))]
);

/**
 * Get noun group for a specific noun
 */
export const selectNounGroupByNoun = createSelector(
  [selectEntriesGroupedByNoun, (_state: RootState, noun: string) => noun],
  (groups, noun) => groups.find(g => g.noun === noun)
);

/**
 * Get all entries for a specific noun
 */
export const selectEntriesForNoun = createSelector(
  [selectAllEntries, (_state: RootState, noun: string) => noun],
  (entries, noun) => entries.filter(e => e.noun === noun)
);

/**
 * Get the opposite entry for a given entry
 */
export const selectOppositeEntry = createSelector(
  [selectAllEntries, (_state: RootState, entryId: string) => entryId],
  (entries, entryId) => {
    const entry = entries.find(e => e.id === entryId);
    if (!entry) return null;

    // First check if oppositeEntryId is already set
    if (entry.oppositeEntryId) {
      return entries.find(e => e.id === entry.oppositeEntryId) || null;
    }

    // Otherwise, try to find an opposite dynamically
    const sameNounEntries = entries.filter(
      e => e.noun === entry.noun && e.id !== entry.id
    );

    const entryVerb = entry.verbInfo || parseVerbInfo(entry.phrase, entry.noun);

    for (const other of sameNounEntries) {
      const otherVerb = other.verbInfo || parseVerbInfo(other.phrase, other.noun);
      if (areVerbsOpposites(entryVerb, otherVerb)) {
        return other;
      }
    }

    return null;
  }
);

/**
 * Get related entries (same noun, different verbs)
 */
export const selectRelatedEntries = createSelector(
  [selectAllEntries, (_state: RootState, entryId: string) => entryId],
  (entries, entryId) => {
    const entry = entries.find(e => e.id === entryId);
    if (!entry) return [];

    return entries.filter(e => e.noun === entry.noun && e.id !== entry.id);
  }
);

/**
 * Get entries by verb pattern type
 */
export const selectEntriesByPattern = createSelector(
  [selectAllEntries, (_state: RootState, pattern: VerbPatternType) => pattern],
  (entries, pattern) => {
    return entries.filter(entry => {
      const verbInfo = entry.verbInfo || parseVerbInfo(entry.phrase, entry.noun);
      return verbInfo.patternTags?.includes(pattern);
    });
  }
);

/**
 * Get all noun groups for a specific category
 */
export const selectNounGroupsByCategory = createSelector(
  [selectEntriesGroupedByNoun, (_state: RootState, category: Category) => category],
  (groups, category) => groups.filter(g => g.category === category)
);

/**
 * Get nouns that have multiple verbs (more interesting for learning)
 */
export const selectNounsWithMultipleVerbs = createSelector(
  [selectEntriesGroupedByNoun],
  (groups) => groups.filter(g => g.entryIds.length > 1)
);

/**
 * Get noun groups that have opposite verb pairs
 */
export const selectNounsWithOppositePairs = createSelector(
  [selectEntriesGroupedByNoun],
  (groups) => groups.filter(g => g.verbPairs.some(p => p.relationship === 'opposite'))
);

/**
 * Get statistics about noun groupings
 */
export const selectNounGroupStats = createSelector(
  [selectEntriesGroupedByNoun],
  (groups) => ({
    totalNouns: groups.length,
    nounsWithMultipleVerbs: groups.filter(g => g.entryIds.length > 1).length,
    nounsWithOpposites: groups.filter(g => g.verbPairs.some(p => p.relationship === 'opposite')).length,
    averageVerbsPerNoun: groups.reduce((sum, g) => sum + g.entryIds.length, 0) / groups.length,
    totalOppositePairs: groups.reduce((sum, g) =>
      sum + g.verbPairs.filter(p => p.relationship === 'opposite').length, 0
    ),
  })
);

/**
 * Search entries with noun grouping context
 * Returns entries grouped by noun, filtered by search query
 */
export const selectFilteredNounGroups = createSelector(
  [selectEntriesGroupedByNoun, selectSearchQuery],
  (groups, searchQuery) => {
    if (!searchQuery.trim()) return groups;

    const query = searchQuery.toLowerCase();
    return groups.filter(group => {
      // Match on noun
      if (group.noun.toLowerCase().includes(query)) return true;
      if (group.nounBase.toLowerCase().includes(query)) return true;

      // Match on any entry's phrase or translation
      // We need to check if any entry in this group matches
      return false; // For now, just match on noun
    });
  }
);

export default entriesSlice.reducer;
