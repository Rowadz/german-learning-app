// Core data types for the German Learning App

export type Category =
  | 'home'
  | 'work'
  | 'street'
  | 'friends'
  | 'love'
  | 'cleaning'
  | 'food'
  | 'shopping'
  | 'travel'
  | 'health';

export interface VocabEntry {
  id: string;
  category: Category;
  noun: string;           // e.g., "die Tür"
  phrase: string;         // e.g., "die Tür aufschließen"
  example: string;        // German example sentence
  translation: string;    // English translation
  tags?: string[];
  isCustom?: boolean;     // User-added entry
  createdAt?: string;     // ISO date string
}

export type LearningStatus = 'new' | 'learning' | 'known';

export interface EntryProgress {
  entryId: string;
  status: LearningStatus;
  timesReviewed: number;
  lastReviewed?: string;
  correctAnswers: number;
  incorrectAnswers: number;
}

export interface Bookmark {
  entryId: string;
  createdAt: string;
}

export type QuizType = 'noun-to-phrase' | 'phrase-to-translation' | 'typing';

export interface QuizSettings {
  questionCount: 5 | 10 | 20;
  categories: Category[];
  bookmarkedOnly: boolean;
  quizType: QuizType;
}

export interface QuizQuestion {
  entryId: string;
  type: QuizType;
  question: string;
  correctAnswer: string;
  options?: string[];    // For multiple choice
  userAnswer?: string;
  isCorrect?: boolean;
}

export interface QuizAttempt {
  id: string;
  timestamp: string;
  settings: QuizSettings;
  questions: QuizQuestion[];
  score: number;
  totalQuestions: number;
  completed: boolean;
}

export interface QuizSession {
  isActive: boolean;
  currentAttempt: QuizAttempt | null;
  currentQuestionIndex: number;
}

export type Theme = 'light' | 'dark';

export interface UIState {
  theme: Theme;
  sidebarOpen: boolean;
}

// localStorage state shape
export interface PersistedState {
  version: number;
  entries: VocabEntry[];
  progress: Record<string, EntryProgress>;
  bookmarks: Bookmark[];
  quizHistory: QuizAttempt[];
  theme: Theme;
}

// Category display info
export interface CategoryInfo {
  id: Category;
  name: string;
  icon: string;
  description: string;
}

export const CATEGORIES: CategoryInfo[] = [
  { id: 'home', name: 'Home', icon: '🏠', description: 'Household items and actions' },
  { id: 'work', name: 'Work', icon: '💼', description: 'Office and professional vocabulary' },
  { id: 'street', name: 'Street', icon: '🛣️', description: 'Outdoor and transportation' },
  { id: 'friends', name: 'Friends', icon: '👥', description: 'Social interactions' },
  { id: 'love', name: 'Love', icon: '❤️', description: 'Relationships and emotions' },
  { id: 'cleaning', name: 'Cleaning', icon: '🧹', description: 'Cleaning and tidying' },
  { id: 'food', name: 'Food', icon: '🍽️', description: 'Cooking and eating' },
  { id: 'shopping', name: 'Shopping', icon: '🛒', description: 'Shopping and stores' },
  { id: 'travel', name: 'Travel', icon: '✈️', description: 'Travel and vacations' },
  { id: 'health', name: 'Health', icon: '🏥', description: 'Health and wellness' },
];

export const getCategoryInfo = (category: Category): CategoryInfo => {
  return CATEGORIES.find(c => c.id === category) || CATEGORIES[0];
};
