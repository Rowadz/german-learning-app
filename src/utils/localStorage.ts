import type { PersistedState, VocabEntry, EntryProgress, Bookmark, QuizAttempt, Theme } from '../types';
import { seedData } from '../data/seedData';

const STORAGE_KEY = 'german-learning-app';
const CURRENT_VERSION = 1;

// Default state for fresh installs
const getDefaultState = (): PersistedState => ({
  version: CURRENT_VERSION,
  entries: seedData,
  progress: {},
  bookmarks: [],
  quizHistory: [],
  theme: 'light',
});

// Migration functions for future updates
const migrations: Record<number, (state: PersistedState) => PersistedState> = {
  // Example migration from version 0 to 1
  // 1: (state) => ({ ...state, newField: defaultValue })
};

const migrateState = (state: PersistedState): PersistedState => {
  let currentState = state;

  while (currentState.version < CURRENT_VERSION) {
    const nextVersion = currentState.version + 1;
    const migrationFn = migrations[nextVersion];

    if (migrationFn) {
      currentState = migrationFn(currentState);
    }

    currentState.version = nextVersion;
  }

  return currentState;
};

// Validate state structure
const validateState = (state: unknown): state is PersistedState => {
  if (!state || typeof state !== 'object') return false;

  const s = state as Record<string, unknown>;

  return (
    typeof s.version === 'number' &&
    Array.isArray(s.entries) &&
    typeof s.progress === 'object' &&
    Array.isArray(s.bookmarks) &&
    Array.isArray(s.quizHistory) &&
    (s.theme === 'light' || s.theme === 'dark')
  );
};

// Load state from localStorage
export const loadState = (): PersistedState => {
  try {
    const serializedState = localStorage.getItem(STORAGE_KEY);

    if (!serializedState) {
      return getDefaultState();
    }

    const parsed = JSON.parse(serializedState);

    if (!validateState(parsed)) {
      console.warn('Invalid state in localStorage, using defaults');
      return getDefaultState();
    }

    // Migrate if needed
    const migrated = migrateState(parsed);

    // Merge seed data with user data (keep user's custom entries)
    const seedIds = new Set(seedData.map(e => e.id));
    const userCustomEntries = migrated.entries.filter(e => e.isCustom || !seedIds.has(e.id));

    // Update seed entries but keep user's progress
    const mergedEntries = [
      ...seedData,
      ...userCustomEntries,
    ];

    return {
      ...migrated,
      entries: mergedEntries,
    };
  } catch (error) {
    console.error('Failed to load state from localStorage:', error);
    return getDefaultState();
  }
};

// Save state to localStorage
export const saveState = (state: PersistedState): void => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serializedState);
  } catch (error) {
    console.error('Failed to save state to localStorage:', error);
  }
};

// Individual save functions for partial updates
export const saveEntries = (entries: VocabEntry[]): void => {
  const state = loadState();
  saveState({ ...state, entries });
};

export const saveProgress = (progress: Record<string, EntryProgress>): void => {
  const state = loadState();
  saveState({ ...state, progress });
};

export const saveBookmarks = (bookmarks: Bookmark[]): void => {
  const state = loadState();
  saveState({ ...state, bookmarks });
};

export const saveQuizHistory = (quizHistory: QuizAttempt[]): void => {
  const state = loadState();
  saveState({ ...state, quizHistory });
};

export const saveTheme = (theme: Theme): void => {
  const state = loadState();
  saveState({ ...state, theme });
  // Also update the HTML attribute for daisyUI
  document.documentElement.setAttribute('data-theme', theme);
};

// Export data as JSON
export const exportData = (): string => {
  const state = loadState();
  return JSON.stringify(state, null, 2);
};

// Import data from JSON
export const importData = (jsonString: string): boolean => {
  try {
    const parsed = JSON.parse(jsonString);

    if (!validateState(parsed)) {
      throw new Error('Invalid data format');
    }

    saveState(parsed);
    return true;
  } catch (error) {
    console.error('Failed to import data:', error);
    return false;
  }
};

// Reset all data
export const resetData = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

// Initialize theme on app load
export const initializeTheme = (): Theme => {
  const state = loadState();
  document.documentElement.setAttribute('data-theme', state.theme);
  return state.theme;
};
