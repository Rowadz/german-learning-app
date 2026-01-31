import { createSlice, createSelector, type PayloadAction } from '@reduxjs/toolkit';
import type { EntryProgress, LearningStatus } from '../types';
import type { RootState } from './index';

interface ProgressState {
  items: Record<string, EntryProgress>;
}

const initialState: ProgressState = {
  items: {},
};

const progressSlice = createSlice({
  name: 'progress',
  initialState,
  reducers: {
    setProgress: (state, action: PayloadAction<Record<string, EntryProgress>>) => {
      state.items = action.payload;
    },
    setEntryStatus: (
      state,
      action: PayloadAction<{ entryId: string; status: LearningStatus }>
    ) => {
      const { entryId, status } = action.payload;
      if (!state.items[entryId]) {
        state.items[entryId] = {
          entryId,
          status,
          timesReviewed: 0,
          correctAnswers: 0,
          incorrectAnswers: 0,
        };
      } else {
        state.items[entryId].status = status;
      }
    },
    recordReview: (
      state,
      action: PayloadAction<{ entryId: string; correct: boolean }>
    ) => {
      const { entryId, correct } = action.payload;
      if (!state.items[entryId]) {
        state.items[entryId] = {
          entryId,
          status: 'learning',
          timesReviewed: 1,
          lastReviewed: new Date().toISOString(),
          correctAnswers: correct ? 1 : 0,
          incorrectAnswers: correct ? 0 : 1,
        };
      } else {
        state.items[entryId].timesReviewed++;
        state.items[entryId].lastReviewed = new Date().toISOString();
        if (correct) {
          state.items[entryId].correctAnswers++;
        } else {
          state.items[entryId].incorrectAnswers++;
        }
      }
    },
    resetEntryProgress: (state, action: PayloadAction<string>) => {
      delete state.items[action.payload];
    },
    resetAllProgress: (state) => {
      state.items = {};
    },
  },
});

export const {
  setProgress,
  setEntryStatus,
  recordReview,
  resetEntryProgress,
  resetAllProgress,
} = progressSlice.actions;

// Selectors
export const selectAllProgress = (state: RootState) => state.progress.items;

export const selectEntryProgress = createSelector(
  [selectAllProgress, (_state: RootState, entryId: string) => entryId],
  (progress, entryId) => progress[entryId]
);

export const selectEntryStatus = createSelector(
  [selectAllProgress, (_state: RootState, entryId: string) => entryId],
  (progress, entryId): LearningStatus => progress[entryId]?.status || 'new'
);

export const selectKnownCount = createSelector([selectAllProgress], (progress) =>
  Object.values(progress).filter((p) => p.status === 'known').length
);

export const selectLearningCount = createSelector([selectAllProgress], (progress) =>
  Object.values(progress).filter((p) => p.status === 'learning').length
);

export const selectNewCount = createSelector(
  [selectAllProgress, (state: RootState) => state.entries.items],
  (progress, entries) => {
    const progressIds = new Set(Object.keys(progress));
    return entries.filter((e) => !progressIds.has(e.id) || progress[e.id]?.status === 'new').length;
  }
);

export const selectProgressByCategory = createSelector(
  [
    selectAllProgress,
    (state: RootState) => state.entries.items,
    (_state: RootState, category: string) => category,
  ],
  (progress, entries, category) => {
    const categoryEntries = entries.filter((e) => e.category === category);
    const known = categoryEntries.filter((e) => progress[e.id]?.status === 'known').length;
    const learning = categoryEntries.filter((e) => progress[e.id]?.status === 'learning').length;
    const newItems = categoryEntries.length - known - learning;

    return { known, learning, new: newItems, total: categoryEntries.length };
  }
);

export default progressSlice.reducer;
