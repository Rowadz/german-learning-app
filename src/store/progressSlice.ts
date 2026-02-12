import { createSlice, createSelector, type PayloadAction } from '@reduxjs/toolkit';
import type { EntryProgress, LearningStatus, SkillType } from '../types';
import type { RootState } from './index';
import { calculateNextReview } from '../utils/spacedRepetition';

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
          // Initialize enhanced fields
          recognitionScore: correct ? 100 : 0,
          productionScore: 50, // Neutral start
          confusedWith: [],
          easeFactor: 2.5,
          interval: 0,
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
    // Enhanced: Record recognition review (multiple choice quizzes)
    recordRecognitionReview: (
      state,
      action: PayloadAction<{ entryId: string; correct: boolean; responseTime?: number }>
    ) => {
      const { entryId, correct } = action.payload;
      const now = new Date().toISOString();

      if (!state.items[entryId]) {
        state.items[entryId] = {
          entryId,
          status: 'learning',
          timesReviewed: 1,
          lastReviewed: now,
          correctAnswers: correct ? 1 : 0,
          incorrectAnswers: correct ? 0 : 1,
          recognitionScore: correct ? 100 : 0,
          productionScore: 50,
          confusedWith: [],
          easeFactor: 2.5,
          interval: 0,
          lastRecognitionReview: now,
        };
      } else {
        const progress = state.items[entryId];
        progress.timesReviewed++;
        progress.lastReviewed = now;
        progress.lastRecognitionReview = now;

        if (correct) {
          progress.correctAnswers++;
        } else {
          progress.incorrectAnswers++;
        }

        // Update recognition score with weighted average (recent performance weighted more)
        const newScore = correct ? 100 : 0;
        const currentScore = progress.recognitionScore ?? 50;
        progress.recognitionScore = Math.round(currentScore * 0.7 + newScore * 0.3);

        // Update spaced repetition parameters
        const srResult = calculateNextReview(progress, correct ? 4 : 1);
        progress.easeFactor = srResult.easeFactor;
        progress.interval = srResult.interval;
        progress.nextReviewDate = srResult.nextReviewDate;
      }
    },
    // Enhanced: Record production review (typing quizzes)
    recordProductionReview: (
      state,
      action: PayloadAction<{ entryId: string; correct: boolean; partialScore?: number }>
    ) => {
      const { entryId, correct, partialScore } = action.payload;
      const now = new Date().toISOString();

      if (!state.items[entryId]) {
        state.items[entryId] = {
          entryId,
          status: 'learning',
          timesReviewed: 1,
          lastReviewed: now,
          correctAnswers: correct ? 1 : 0,
          incorrectAnswers: correct ? 0 : 1,
          recognitionScore: 50,
          productionScore: partialScore ?? (correct ? 100 : 0),
          confusedWith: [],
          easeFactor: 2.5,
          interval: 0,
          lastProductionReview: now,
        };
      } else {
        const progress = state.items[entryId];
        progress.timesReviewed++;
        progress.lastReviewed = now;
        progress.lastProductionReview = now;

        if (correct) {
          progress.correctAnswers++;
        } else {
          progress.incorrectAnswers++;
        }

        // Update production score with weighted average
        const score = partialScore ?? (correct ? 100 : 0);
        const currentScore = progress.productionScore ?? 50;
        progress.productionScore = Math.round(currentScore * 0.7 + score * 0.3);

        // Production is harder - use stricter quality rating
        const quality = correct ? (partialScore && partialScore >= 90 ? 5 : 4) : 1;
        const srResult = calculateNextReview(progress, quality);
        progress.easeFactor = srResult.easeFactor;
        progress.interval = srResult.interval;
        progress.nextReviewDate = srResult.nextReviewDate;
      }
    },
    // Enhanced: Record when user confuses two entries
    recordConfusion: (
      state,
      action: PayloadAction<{ entryId: string; confusedWithId: string }>
    ) => {
      const { entryId, confusedWithId } = action.payload;

      // Ensure the entry exists
      if (!state.items[entryId]) {
        state.items[entryId] = {
          entryId,
          status: 'learning',
          timesReviewed: 0,
          correctAnswers: 0,
          incorrectAnswers: 0,
          confusedWith: [confusedWithId],
          easeFactor: 2.5,
          interval: 0,
        };
      } else {
        const progress = state.items[entryId];
        if (!progress.confusedWith) {
          progress.confusedWith = [];
        }
        // Add if not already in the list
        if (!progress.confusedWith.includes(confusedWithId)) {
          progress.confusedWith.push(confusedWithId);
        }
      }

      // Also record confusion on the other entry
      if (!state.items[confusedWithId]) {
        state.items[confusedWithId] = {
          entryId: confusedWithId,
          status: 'learning',
          timesReviewed: 0,
          correctAnswers: 0,
          incorrectAnswers: 0,
          confusedWith: [entryId],
          easeFactor: 2.5,
          interval: 0,
        };
      } else {
        const otherProgress = state.items[confusedWithId];
        if (!otherProgress.confusedWith) {
          otherProgress.confusedWith = [];
        }
        if (!otherProgress.confusedWith.includes(entryId)) {
          otherProgress.confusedWith.push(entryId);
        }
      }
    },
    // Clear confusion between two entries (when user demonstrates they know the difference)
    clearConfusion: (
      state,
      action: PayloadAction<{ entryId: string; confusedWithId: string }>
    ) => {
      const { entryId, confusedWithId } = action.payload;

      if (state.items[entryId]?.confusedWith) {
        state.items[entryId].confusedWith = state.items[entryId].confusedWith!.filter(
          id => id !== confusedWithId
        );
      }

      if (state.items[confusedWithId]?.confusedWith) {
        state.items[confusedWithId].confusedWith = state.items[confusedWithId].confusedWith!.filter(
          id => id !== entryId
        );
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
  recordRecognitionReview,
  recordProductionReview,
  recordConfusion,
  clearConfusion,
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

// ============ ENHANCED SELECTORS ============

/**
 * Get entries that are weak (low scores) and need more practice
 */
export const selectWeakEntries = createSelector(
  [selectAllProgress, (state: RootState) => state.entries.items],
  (progress, entries) => {
    return entries.filter(entry => {
      const p = progress[entry.id];
      if (!p) return true; // New entries are considered weak

      // Weak if either score is low
      const recognitionWeak = (p.recognitionScore ?? 50) < 60;
      const productionWeak = (p.productionScore ?? 50) < 50;

      return recognitionWeak || productionWeak;
    });
  }
);

/**
 * Get weak entries for a specific noun
 */
export const selectWeakEntriesForNoun = createSelector(
  [selectAllProgress, (state: RootState) => state.entries.items, (_: RootState, noun: string) => noun],
  (progress, entries, noun) => {
    return entries.filter(entry => {
      if (entry.noun !== noun) return false;

      const p = progress[entry.id];
      if (!p) return true;

      return (p.recognitionScore ?? 50) < 60 || (p.productionScore ?? 50) < 50;
    });
  }
);

/**
 * Get all confused pairs (entries that users often mix up)
 */
export const selectConfusedPairs = createSelector(
  [selectAllProgress],
  (progress) => {
    const pairs: Array<{ entry1: string; entry2: string; count: number }> = [];
    const processedPairs = new Set<string>();

    Object.values(progress).forEach(p => {
      p.confusedWith?.forEach(confusedId => {
        const pairKey = [p.entryId, confusedId].sort().join('-');
        if (!processedPairs.has(pairKey)) {
          // Count how often they're confused (both directions)
          const otherProgress = progress[confusedId];
          const count = 1 + (otherProgress?.confusedWith?.includes(p.entryId) ? 1 : 0);

          pairs.push({
            entry1: p.entryId,
            entry2: confusedId,
            count,
          });
          processedPairs.add(pairKey);
        }
      });
    });

    // Sort by confusion frequency
    return pairs.sort((a, b) => b.count - a.count);
  }
);

/**
 * Get entries that are due for review based on spaced repetition
 */
export const selectEntriesDueForReview = createSelector(
  [selectAllProgress],
  (progress) => {
    const now = new Date();
    return Object.values(progress)
      .filter(p => {
        if (!p.nextReviewDate) return true; // No scheduled review = needs review
        return new Date(p.nextReviewDate) <= now;
      })
      .map(p => p.entryId);
  }
);

/**
 * Get entries with their scores for a specific skill type
 */
export const selectEntriesBySkillScore = createSelector(
  [selectAllProgress, (state: RootState) => state.entries.items, (_: RootState, skillType: SkillType) => skillType],
  (progress, entries, skillType) => {
    return entries.map(entry => {
      const p = progress[entry.id];
      const score = skillType === 'recognition'
        ? (p?.recognitionScore ?? 50)
        : (p?.productionScore ?? 50);

      return {
        entry,
        score,
        timesReviewed: p?.timesReviewed ?? 0,
      };
    }).sort((a, b) => a.score - b.score); // Sorted by score ascending (weakest first)
  }
);

/**
 * Get average scores by skill type
 */
export const selectAverageScores = createSelector(
  [selectAllProgress],
  (progress) => {
    const values = Object.values(progress);
    if (values.length === 0) {
      return { recognition: 0, production: 0, overall: 0 };
    }

    const recognition = values.reduce((sum, p) => sum + (p.recognitionScore ?? 50), 0) / values.length;
    const production = values.reduce((sum, p) => sum + (p.productionScore ?? 50), 0) / values.length;
    const overall = (recognition + production) / 2;

    return {
      recognition: Math.round(recognition),
      production: Math.round(production),
      overall: Math.round(overall),
    };
  }
);

/**
 * Get progress statistics for a noun group
 */
export const selectNounGroupProgress = createSelector(
  [selectAllProgress, (_: RootState, entryIds: string[]) => entryIds],
  (progress, entryIds) => {
    const progressItems = entryIds.map(id => progress[id]).filter(Boolean);

    if (progressItems.length === 0) {
      return {
        mastered: 0,
        learning: 0,
        new: entryIds.length,
        avgRecognition: 0,
        avgProduction: 0,
        hasWeakVerbs: true,
      };
    }

    const mastered = progressItems.filter(p => p.status === 'known').length;
    const learning = progressItems.filter(p => p.status === 'learning').length;
    const newCount = entryIds.length - progressItems.length;

    const avgRecognition = progressItems.reduce((sum, p) => sum + (p.recognitionScore ?? 50), 0) / progressItems.length;
    const avgProduction = progressItems.reduce((sum, p) => sum + (p.productionScore ?? 50), 0) / progressItems.length;

    const hasWeakVerbs = progressItems.some(
      p => (p.recognitionScore ?? 50) < 60 || (p.productionScore ?? 50) < 50
    );

    return {
      mastered,
      learning,
      new: newCount,
      avgRecognition: Math.round(avgRecognition),
      avgProduction: Math.round(avgProduction),
      hasWeakVerbs,
    };
  }
);

export default progressSlice.reducer;
