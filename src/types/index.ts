// Core data types for the German Learning App

// ============ VERB-RELATED TYPES ============

// Common separable verb prefixes in German
export type SeparablePrefix =
  | 'ab'
  | 'an'
  | 'auf'
  | 'aus'
  | 'bei'
  | 'ein'
  | 'mit'
  | 'nach'
  | 'vor'
  | 'zu'
  | 'zurück'
  | 'zusammen'
  | 'hoch'
  | 'herunter'
  | 'runter'
  | 'raus'
  | 'rein'
  | 'weg'
  | 'weiter';

// German grammatical cases
export type GrammaticalCase = 'Nominativ' | 'Akkusativ' | 'Dativ' | 'Genitiv';

// Verb pattern categories for semantic grouping
export type VerbPatternType =
  | 'movement'
  | 'state-change'
  | 'daily-routine'
  | 'communication'
  | 'transaction'
  | 'creation'
  | 'destruction'
  | 'perception'
  | 'emotion';

// Skill types for tracking different learning abilities
export type SkillType = 'recognition' | 'production';

// Verb metadata extracted from phrases
export interface VerbInfo {
  baseVerb: string;                    // e.g., "schließen"
  fullVerb: string;                    // e.g., "aufschließen"
  prefix?: SeparablePrefix;            // e.g., "auf"
  isSeparable: boolean;
  caseRequired?: GrammaticalCase;      // e.g., "Akkusativ"
  preposition?: string;                // e.g., "mit" for verbs requiring preposition
  prepositionCase?: GrammaticalCase;   // Case required by preposition
  patternTags?: VerbPatternType[];
}

// Relationship types between verbs
export type VerbRelationship = 'opposite' | 'similar' | 'sequence';

// Verb pair representing related verbs (opposites, similar actions)
export interface VerbPair {
  verb1EntryId: string;
  verb2EntryId: string;
  relationship: VerbRelationship;
}

// Noun grouping structure for organizing vocabulary by noun
export interface NounGroup {
  noun: string;              // e.g., "die Tür"
  nounBase: string;          // e.g., "Tür" (without article)
  article: 'der' | 'die' | 'das';
  category: Category;
  entryIds: string[];        // All entries for this noun
  verbPairs: VerbPair[];     // Detected opposite/related pairs
}

// ============ CATEGORIES ============

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
  // Enhanced verb-related fields
  verbInfo?: VerbInfo;           // Parsed verb metadata
  oppositeEntryId?: string;      // Link to opposite action (aufschließen <-> abschließen)
  relatedEntryIds?: string[];    // Other verbs for same noun
}

export type LearningStatus = 'new' | 'learning' | 'known';

export interface EntryProgress {
  entryId: string;
  status: LearningStatus;
  timesReviewed: number;
  lastReviewed?: string;
  correctAnswers: number;
  incorrectAnswers: number;
  // Enhanced tracking for verb-centered learning
  recognitionScore?: number;        // 0-100, multiple choice performance
  productionScore?: number;         // 0-100, typing/production performance
  confusedWith?: string[];          // Entry IDs often confused with this one
  // Spaced repetition (SM-2 algorithm)
  easeFactor?: number;              // Default 2.5, min 1.3
  interval?: number;                // Days until next review
  nextReviewDate?: string;          // ISO date string
  lastRecognitionReview?: string;   // ISO date string
  lastProductionReview?: string;    // ISO date string
}

export interface Bookmark {
  entryId: string;
  createdAt: string;
}

// Original quiz types
export type QuizTypeBasic = 'noun-to-phrase' | 'phrase-to-translation' | 'typing';

// New verb-focused quiz types
export type QuizTypeEnhanced =
  | 'context-verb-selection'    // Given context, pick correct verb
  | 'opposite-action'           // Given verb, identify opposite
  | 'prefix-reconstruction'     // ___schließen -> aufschließen
  | 'fill-in-blank-case'        // Fill blank with correct case/article
  | 'sentence-building'         // Arrange shuffled words
  | 'error-correction'          // Fix the grammatical error
  | 'verb-group-mastery';       // All verbs for one noun

// Combined quiz types
export type QuizType = QuizTypeBasic | QuizTypeEnhanced;

export interface QuizSettings {
  questionCount: 5 | 10 | 20;
  categories: Category[];
  bookmarkedOnly: boolean;
  quizType: QuizType;
  // Enhanced quiz settings
  skillFocus?: SkillType;            // Focus on recognition or production
  prioritizeWeakVerbs?: boolean;     // Prioritize entries with low scores
  includeOpposites?: boolean;        // Include opposite verb pairs
  nounGroupFilter?: string;          // Filter to specific noun group
}

export interface QuizQuestion {
  entryId: string;
  type: QuizType;
  question: string;
  correctAnswer: string;
  options?: string[];           // For multiple choice
  userAnswer?: string;
  isCorrect?: boolean;
  // Enhanced fields for new quiz types
  shuffledWords?: string[];     // For sentence-building quiz
  caseHint?: GrammaticalCase;   // For fill-in-blank-case quiz
  errorPosition?: number;       // For error-correction quiz
  oppositeEntryId?: string;     // For opposite-action quiz
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

// ============ SCENARIO MODE TYPES ============

// Scenario difficulty levels
export type ScenarioDifficulty = 'beginner' | 'intermediate' | 'advanced';

// Types of steps within a scenario
export type ScenarioStepType = 'dialogue' | 'action' | 'question' | 'production';

// Individual step within a scenario
export interface ScenarioStep {
  id: string;
  type: ScenarioStepType;
  prompt: string;                    // German prompt/dialogue
  promptTranslation: string;         // English translation
  expectedResponse?: string;         // Expected user response (for production)
  acceptableResponses?: string[];    // Alternative acceptable answers
  hints?: string[];                  // Progressive hints
  entryIds: string[];                // Related vocab entries
  timeLimit?: number;                // Optional time limit in seconds
  points?: number;                   // Points for this step (default 10)
}

// Complete scenario definition
export interface Scenario {
  id: string;
  name: string;
  nameGerman: string;
  description: string;
  category: Category;
  difficulty: ScenarioDifficulty;
  steps: ScenarioStep[];
  estimatedMinutes: number;
  requiredVocabIds: string[];        // Vocab needed for this scenario
  icon?: string;                     // Emoji or icon
}

// User's progress on a specific scenario
export interface ScenarioProgress {
  scenarioId: string;
  completedSteps: string[];
  bestScore: number;
  totalPossibleScore: number;
  attempts: number;
  lastAttempt?: string;              // ISO date string
  completed: boolean;
}

// Active scenario session state
export interface ScenarioSession {
  scenarioId: string | null;
  currentStepIndex: number;
  score: number;
  responses: Record<string, string>; // stepId -> user response
  hintsUsed: Record<string, number>; // stepId -> hints used count
  startTime?: string;                // ISO date string
}

// ============ FLASHCARD MODE TYPES ============

// Different flashcard study modes
export type FlashcardMode =
  | 'standard'           // Current flip behavior
  | 'verb-focused'       // Shows all verbs for a noun
  | 'progressive-reveal' // Verb → Example → Translation
  | 'prefix-drill'       // Hide prefix, reveal on tap
  | 'opposite-recall';   // Show one, recall opposite

// Flashcard session settings
export interface FlashcardSettings {
  mode: FlashcardMode;
  nounGroupFilter?: string;          // Study specific noun group
  prioritizeWeakVerbs?: boolean;
  includeOpposites?: boolean;
  shuffleOrder?: boolean;
}

// ============ HELPER CONSTANTS ============

// Mapping of opposite prefixes for auto-detection
export const OPPOSITE_PREFIXES: Record<string, string[]> = {
  'auf': ['ab', 'zu'],
  'ab': ['auf', 'an'],
  'ein': ['aus'],
  'aus': ['ein', 'an'],
  'an': ['aus', 'ab'],
  'hoch': ['herunter', 'runter'],
  'herunter': ['hoch', 'rauf'],
  'runter': ['hoch', 'rauf'],
  'raus': ['rein'],
  'rein': ['raus'],
  'weg': ['her', 'hin'],
  'zu': ['auf'],
};

// Common verb base forms and their patterns
export const VERB_PATTERNS: Record<string, VerbPatternType[]> = {
  'schließen': ['state-change', 'daily-routine'],
  'öffnen': ['state-change', 'daily-routine'],
  'machen': ['creation', 'daily-routine'],
  'schalten': ['state-change'],
  'fahren': ['movement'],
  'gehen': ['movement'],
  'nehmen': ['transaction'],
  'geben': ['transaction'],
  'schreiben': ['communication', 'creation'],
  'lesen': ['perception'],
  'sehen': ['perception'],
  'hören': ['perception'],
  'sprechen': ['communication'],
  'kochen': ['creation', 'daily-routine'],
  'waschen': ['daily-routine'],
  'räumen': ['daily-routine'],
  'drehen': ['state-change'],
  'stellen': ['movement', 'state-change'],
  'legen': ['movement'],
  'setzen': ['movement'],
};
