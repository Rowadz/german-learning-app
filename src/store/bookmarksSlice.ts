import { createSlice, createSelector, type PayloadAction } from '@reduxjs/toolkit';
import type { Bookmark, Category } from '../types';
import type { RootState } from './index';

interface BookmarksState {
  items: Bookmark[];
}

const initialState: BookmarksState = {
  items: [],
};

const bookmarksSlice = createSlice({
  name: 'bookmarks',
  initialState,
  reducers: {
    setBookmarks: (state, action: PayloadAction<Bookmark[]>) => {
      state.items = action.payload;
    },
    addBookmark: (state, action: PayloadAction<string>) => {
      const exists = state.items.some((b) => b.entryId === action.payload);
      if (!exists) {
        state.items.push({
          entryId: action.payload,
          createdAt: new Date().toISOString(),
        });
      }
    },
    removeBookmark: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((b) => b.entryId !== action.payload);
    },
    toggleBookmark: (state, action: PayloadAction<string>) => {
      const index = state.items.findIndex((b) => b.entryId === action.payload);
      if (index !== -1) {
        state.items.splice(index, 1);
      } else {
        state.items.push({
          entryId: action.payload,
          createdAt: new Date().toISOString(),
        });
      }
    },
    clearAllBookmarks: (state) => {
      state.items = [];
    },
  },
});

export const {
  setBookmarks,
  addBookmark,
  removeBookmark,
  toggleBookmark,
  clearAllBookmarks,
} = bookmarksSlice.actions;

// Selectors
export const selectAllBookmarks = (state: RootState) => state.bookmarks.items;

export const selectBookmarkIds = createSelector([selectAllBookmarks], (bookmarks) =>
  new Set(bookmarks.map((b) => b.entryId))
);

export const selectIsBookmarked = createSelector(
  [selectBookmarkIds, (_state: RootState, entryId: string) => entryId],
  (bookmarkIds, entryId) => bookmarkIds.has(entryId)
);

export const selectBookmarkedEntries = createSelector(
  [selectBookmarkIds, (state: RootState) => state.entries.items],
  (bookmarkIds, entries) => entries.filter((e) => bookmarkIds.has(e.id))
);

export const selectBookmarkCount = createSelector(
  [selectAllBookmarks],
  (bookmarks) => bookmarks.length
);

export const selectBookmarkCountByCategory = createSelector(
  [selectBookmarkedEntries, (_state: RootState, category: Category) => category],
  (entries, category) => entries.filter((e) => e.category === category).length
);

export default bookmarksSlice.reducer;
