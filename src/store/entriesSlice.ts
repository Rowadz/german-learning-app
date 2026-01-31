import { createSlice, createSelector, type PayloadAction } from '@reduxjs/toolkit';
import type { VocabEntry, Category } from '../types';
import { seedData } from '../data/seedData';
import { v4 as uuidv4 } from 'uuid';
import type { RootState } from './index';

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

export default entriesSlice.reducer;
