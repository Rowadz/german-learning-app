# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start development server (http://localhost:5173)
npm run build        # TypeScript check + production build
npm run lint         # Run ESLint
npm run preview      # Preview production build locally
npm run deploy       # Build and deploy to GitHub Pages via gh-pages
```

## Architecture

This is a React 19 + TypeScript flashcard/quiz app for German vocabulary, using Vite 7 as the build tool.

### State Management

Redux Toolkit with five slices (`src/store/`):
- **entriesSlice**: Vocabulary entries with search/filter state
- **progressSlice**: Learning status (new/learning/known) per entry
- **bookmarksSlice**: Saved entries for review
- **quizzesSlice**: Quiz history and active session state
- **uiSlice**: Theme and sidebar state

State is auto-persisted to localStorage with 500ms debounce. Load/save handled via `src/utils/localStorage.ts`.

Use typed hooks from `src/hooks/useAppStore.ts`:
```typescript
import { useAppDispatch, useAppSelector } from '../hooks/useAppStore';
```

### Routing

HashRouter (for GitHub Pages compatibility) with routes defined in `App.tsx`:
- `/` - Home
- `/flashcards` - Flashcard review
- `/quizzes` - Quiz mode
- `/categories` - Category list
- `/categories/:categoryId` - Category detail
- `/bookmarks` - Saved entries
- `/manage` - Add/edit vocabulary
- `/settings` - App settings

### Styling

Tailwind CSS v4 + daisyUI v5. Configured via `@tailwindcss/vite` plugin in `vite.config.ts`.

### Types

Core types in `src/types/index.ts`:
- `VocabEntry`: Vocabulary item (noun, phrase, example, translation, category)
- `Category`: 10 predefined categories (home, work, street, friends, love, cleaning, food, shopping, travel, health)
- `QuizType`: 'noun-to-phrase' | 'phrase-to-translation' | 'typing'
- `LearningStatus`: 'new' | 'learning' | 'known'

### Deployment

Auto-deploys to GitHub Pages on push to main via `.github/workflows/deploy.yml`. The `base` path in `vite.config.ts` is set to `/german-learning-app/`.
