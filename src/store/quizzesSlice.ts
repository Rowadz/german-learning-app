import { createSlice, createSelector, type PayloadAction } from '@reduxjs/toolkit';
import type { QuizAttempt, QuizQuestion, QuizSettings, QuizSession, QuizType, VocabEntry } from '../types';
import { v4 as uuidv4 } from 'uuid';
import type { RootState } from './index';

interface QuizzesState {
  history: QuizAttempt[];
  session: QuizSession;
}

const initialState: QuizzesState = {
  history: [],
  session: {
    isActive: false,
    currentAttempt: null,
    currentQuestionIndex: 0,
  },
};

// Helper to generate questions
const generateQuestions = (
  entries: VocabEntry[],
  settings: QuizSettings
): QuizQuestion[] => {
  const shuffled = [...entries].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, settings.questionCount);

  return selected.map((entry) => {
    const question: QuizQuestion = {
      entryId: entry.id,
      type: settings.quizType,
      question: '',
      correctAnswer: '',
      options: [],
    };

    if (settings.quizType === 'noun-to-phrase') {
      question.question = entry.noun;
      question.correctAnswer = entry.phrase;

      // Generate wrong options from other entries
      const otherEntries = entries.filter((e) => e.id !== entry.id);
      const wrongOptions = otherEntries
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((e) => e.phrase);

      question.options = [entry.phrase, ...wrongOptions].sort(() => Math.random() - 0.5);
    } else if (settings.quizType === 'phrase-to-translation') {
      question.question = entry.phrase;
      question.correctAnswer = entry.translation;

      const otherEntries = entries.filter((e) => e.id !== entry.id);
      const wrongOptions = otherEntries
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((e) => e.translation);

      question.options = [entry.translation, ...wrongOptions].sort(() => Math.random() - 0.5);
    } else if (settings.quizType === 'typing') {
      question.question = `${entry.noun} - Write the phrase`;
      question.correctAnswer = entry.phrase;
      question.options = undefined;
    }

    return question;
  });
};

const quizzesSlice = createSlice({
  name: 'quizzes',
  initialState,
  reducers: {
    setHistory: (state, action: PayloadAction<QuizAttempt[]>) => {
      state.history = action.payload;
    },
    startQuiz: (
      state,
      action: PayloadAction<{ settings: QuizSettings; entries: VocabEntry[] }>
    ) => {
      const { settings, entries } = action.payload;
      const questions = generateQuestions(entries, settings);

      state.session = {
        isActive: true,
        currentQuestionIndex: 0,
        currentAttempt: {
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          settings,
          questions,
          score: 0,
          totalQuestions: questions.length,
          completed: false,
        },
      };
    },
    answerQuestion: (state, action: PayloadAction<string>) => {
      if (!state.session.currentAttempt) return;

      const question = state.session.currentAttempt.questions[state.session.currentQuestionIndex];
      if (!question) return;

      question.userAnswer = action.payload;

      // Check if correct (for typing, normalize and compare)
      if (state.session.currentAttempt.settings.quizType === 'typing') {
        const normalizedAnswer = action.payload.toLowerCase().trim();
        const normalizedCorrect = question.correctAnswer.toLowerCase().trim();
        question.isCorrect = normalizedAnswer === normalizedCorrect;
      } else {
        question.isCorrect = action.payload === question.correctAnswer;
      }

      if (question.isCorrect) {
        state.session.currentAttempt.score++;
      }
    },
    nextQuestion: (state) => {
      if (!state.session.currentAttempt) return;

      if (state.session.currentQuestionIndex < state.session.currentAttempt.questions.length - 1) {
        state.session.currentQuestionIndex++;
      }
    },
    previousQuestion: (state) => {
      if (state.session.currentQuestionIndex > 0) {
        state.session.currentQuestionIndex--;
      }
    },
    finishQuiz: (state) => {
      if (!state.session.currentAttempt) return;

      state.session.currentAttempt.completed = true;
      state.history.unshift(state.session.currentAttempt);

      // Keep only the last 50 attempts
      if (state.history.length > 50) {
        state.history = state.history.slice(0, 50);
      }
    },
    endQuiz: (state) => {
      state.session = {
        isActive: false,
        currentAttempt: null,
        currentQuestionIndex: 0,
      };
    },
    clearHistory: (state) => {
      state.history = [];
    },
  },
});

export const {
  setHistory,
  startQuiz,
  answerQuestion,
  nextQuestion,
  previousQuestion,
  finishQuiz,
  endQuiz,
  clearHistory,
} = quizzesSlice.actions;

// Selectors
export const selectQuizHistory = (state: RootState) => state.quizzes.history;
export const selectQuizSession = (state: RootState) => state.quizzes.session;
export const selectCurrentAttempt = (state: RootState) => state.quizzes.session.currentAttempt;
export const selectCurrentQuestionIndex = (state: RootState) => state.quizzes.session.currentQuestionIndex;
export const selectIsQuizActive = (state: RootState) => state.quizzes.session.isActive;

export const selectCurrentQuestion = createSelector(
  [selectCurrentAttempt, selectCurrentQuestionIndex],
  (attempt, index) => attempt?.questions[index] || null
);

export const selectQuizProgress = createSelector(
  [selectCurrentAttempt, selectCurrentQuestionIndex],
  (attempt, index) => {
    if (!attempt) return { current: 0, total: 0, percentage: 0 };
    return {
      current: index + 1,
      total: attempt.questions.length,
      percentage: Math.round(((index + 1) / attempt.questions.length) * 100),
    };
  }
);

export const selectQuizStats = createSelector([selectQuizHistory], (history) => {
  if (history.length === 0) {
    return {
      totalAttempts: 0,
      averageScore: 0,
      bestScore: 0,
      totalQuestions: 0,
      totalCorrect: 0,
    };
  }

  const totalAttempts = history.length;
  const completedAttempts = history.filter((a) => a.completed);

  const scores = completedAttempts.map((a) => (a.score / a.totalQuestions) * 100);
  const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const bestScore = scores.length > 0 ? Math.max(...scores) : 0;

  const totalQuestions = completedAttempts.reduce((acc, a) => acc + a.totalQuestions, 0);
  const totalCorrect = completedAttempts.reduce((acc, a) => acc + a.score, 0);

  return {
    totalAttempts,
    averageScore: Math.round(averageScore),
    bestScore: Math.round(bestScore),
    totalQuestions,
    totalCorrect,
  };
});

export const selectRecentAttempts = createSelector(
  [selectQuizHistory],
  (history) => history.slice(0, 10)
);

export const selectQuizTypeStats = createSelector(
  [selectQuizHistory],
  (history) => {
    const stats: Record<QuizType, { attempts: number; avgScore: number }> = {
      'noun-to-phrase': { attempts: 0, avgScore: 0 },
      'phrase-to-translation': { attempts: 0, avgScore: 0 },
      'typing': { attempts: 0, avgScore: 0 },
    };

    const byType: Record<QuizType, number[]> = {
      'noun-to-phrase': [],
      'phrase-to-translation': [],
      'typing': [],
    };

    history.filter(a => a.completed).forEach((attempt) => {
      byType[attempt.settings.quizType].push((attempt.score / attempt.totalQuestions) * 100);
    });

    (Object.keys(byType) as QuizType[]).forEach((type) => {
      const scores = byType[type];
      stats[type].attempts = scores.length;
      stats[type].avgScore = scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;
    });

    return stats;
  }
);

export default quizzesSlice.reducer;
