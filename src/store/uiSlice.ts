import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Theme, UIState } from '../types';
import type { RootState } from './index';

const initialState: UIState = {
  theme: 'light',
  sidebarOpen: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload;
      document.documentElement.setAttribute('data-theme', action.payload);
    },
    toggleTheme: (state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      state.theme = newTheme;
      document.documentElement.setAttribute('data-theme', newTheme);
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
  },
});

export const { setTheme, toggleTheme, setSidebarOpen, toggleSidebar } = uiSlice.actions;

// Selectors
export const selectTheme = (state: RootState) => state.ui.theme;
export const selectSidebarOpen = (state: RootState) => state.ui.sidebarOpen;

export default uiSlice.reducer;
