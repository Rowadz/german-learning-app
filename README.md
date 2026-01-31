# German Learning App

A flashcard and quiz web application for learning German vocabulary. Built with React, TypeScript, Redux Toolkit, and daisyUI.

## Features

- **Flashcards**: Review vocabulary with flip cards showing noun, phrase, example, and translation
- **Quizzes**: Test your knowledge with multiple choice and typing challenges
- **Categories**: Browse vocabulary by topic (home, work, street, friends, love, cleaning, food, shopping, travel, health)
- **Bookmarks**: Save entries for later review
- **Progress Tracking**: Mark entries as new, learning, or known
- **Dark/Light Theme**: Toggle between themes
- **Offline-First**: All data persisted in localStorage
- **Import/Export**: Backup and restore your data

## Tech Stack

- React 19 + TypeScript
- Vite 7
- Redux Toolkit for state management
- Tailwind CSS v4 + daisyUI v5
- React Router v7 (HashRouter for GitHub Pages)

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the app.

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Deployment to GitHub Pages

### Option 1: Using gh-pages package

1. Update the `base` in `vite.config.ts` to match your repository name:
   ```ts
   base: '/your-repo-name/',
   ```

2. Update the `homepage` in `package.json`:
   ```json
   "homepage": "https://yourusername.github.io/your-repo-name"
   ```

3. Deploy:
   ```bash
   npm run deploy
   ```

### Option 2: Using GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

Then enable GitHub Pages in your repository settings, selecting "GitHub Actions" as the source.

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── CategoryList.tsx
│   ├── EntryCard.tsx
│   ├── Flashcard.tsx
│   ├── Navbar.tsx
│   ├── QuizEngine.tsx
│   ├── QuizResults.tsx
│   ├── QuizSetup.tsx
│   ├── SearchBar.tsx
│   ├── StatsCard.tsx
│   └── WordForm.tsx
├── data/
│   └── seedData.ts      # Initial vocabulary data (120+ entries)
├── hooks/
│   └── useAppStore.ts   # Typed Redux hooks
├── pages/               # Route components
│   ├── BookmarksPage.tsx
│   ├── CategoriesPage.tsx
│   ├── CategoryDetailPage.tsx
│   ├── FlashcardsPage.tsx
│   ├── HomePage.tsx
│   ├── ManagePage.tsx
│   ├── QuizzesPage.tsx
│   └── SettingsPage.tsx
├── store/               # Redux slices
│   ├── bookmarksSlice.ts
│   ├── entriesSlice.ts
│   ├── index.ts
│   ├── progressSlice.ts
│   ├── quizzesSlice.ts
│   └── uiSlice.ts
├── types/
│   └── index.ts         # TypeScript type definitions
├── utils/
│   └── localStorage.ts  # Persistence utilities
├── App.tsx
├── index.css
└── main.tsx
```

## Data Model

Each vocabulary entry includes:
- `id`: Unique identifier
- `category`: One of 10 categories
- `noun`: German noun with article (e.g., "die Tür")
- `phrase`: Verb phrase (e.g., "die Tür aufschließen")
- `example`: German example sentence
- `translation`: English translation
- `tags`: Optional array of tags

## localStorage Schema

Data is persisted with versioning for future migrations:

```typescript
interface PersistedState {
  version: number;
  entries: VocabEntry[];
  progress: Record<string, EntryProgress>;
  bookmarks: Bookmark[];
  quizHistory: QuizAttempt[];
  theme: 'light' | 'dark';
}
```

## License

MIT
