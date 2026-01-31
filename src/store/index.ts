import { configureStore } from '@reduxjs/toolkit';
import entriesReducer from './entriesSlice';
import progressReducer from './progressSlice';
import bookmarksReducer from './bookmarksSlice';
import quizzesReducer from './quizzesSlice';
import uiReducer from './uiSlice';
import { loadState, saveState } from '../utils/localStorage';

// Load persisted state
const persistedState = loadState();

export const store = configureStore({
  reducer: {
    entries: entriesReducer,
    progress: progressReducer,
    bookmarks: bookmarksReducer,
    quizzes: quizzesReducer,
    ui: uiReducer,
  },
  preloadedState: {
    entries: {
      items: persistedState.entries,
      searchQuery: '',
      selectedCategory: null,
    },
    progress: {
      items: persistedState.progress,
    },
    bookmarks: {
      items: persistedState.bookmarks,
    },
    quizzes: {
      history: persistedState.quizHistory,
      session: {
        isActive: false,
        currentAttempt: null,
        currentQuestionIndex: 0,
      },
    },
    ui: {
      theme: persistedState.theme,
      sidebarOpen: false,
    },
  },
});

// Subscribe to store changes and save to localStorage
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

store.subscribe(() => {
  // Debounce saves to avoid too frequent writes
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(() => {
    const state = store.getState();
    saveState({
      version: 1,
      entries: state.entries.items,
      progress: state.progress.items,
      bookmarks: state.bookmarks.items,
      quizHistory: state.quizzes.history,
      theme: state.ui.theme,
    });
  }, 500);
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
