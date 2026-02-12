// Spaced Repetition Algorithm (SM-2 based)
// Reference: https://en.wikipedia.org/wiki/SuperMemo#Algorithm_SM-2

import type { EntryProgress } from '../types';

/**
 * Quality ratings for SM-2 algorithm:
 * 0 - Complete blackout, no recall
 * 1 - Incorrect response, but upon seeing the correct answer, remembered
 * 2 - Incorrect response, but correct answer seemed easy to recall
 * 3 - Correct response with serious difficulty
 * 4 - Correct response after some hesitation
 * 5 - Perfect response
 */
export type QualityRating = 0 | 1 | 2 | 3 | 4 | 5;

export interface SpacedRepetitionResult {
  easeFactor: number;
  interval: number;
  nextReviewDate: string;
}

/**
 * Calculate the next review date based on SM-2 algorithm
 */
export function calculateNextReview(
  progress: EntryProgress,
  quality: QualityRating
): SpacedRepetitionResult {
  // Get current values or defaults
  let easeFactor = progress.easeFactor ?? 2.5;
  let interval = progress.interval ?? 0;

  // Calculate new ease factor
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  // Ensure ease factor doesn't go below 1.3
  easeFactor = Math.max(1.3, easeFactor);

  // Calculate new interval
  if (quality < 3) {
    // If quality is less than 3, reset interval (user failed)
    interval = 1;
  } else if (interval === 0) {
    // First successful review
    interval = 1;
  } else if (interval === 1) {
    // Second successful review
    interval = 6;
  } else {
    // Subsequent successful reviews
    interval = Math.round(interval * easeFactor);
  }

  // Calculate next review date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);

  return {
    easeFactor: Math.round(easeFactor * 100) / 100, // Round to 2 decimal places
    interval,
    nextReviewDate: nextReviewDate.toISOString(),
  };
}

/**
 * Convert a boolean correct/incorrect to a quality rating
 * This is a simplified version for basic quizzes
 */
export function booleanToQuality(correct: boolean, hesitation?: boolean): QualityRating {
  if (!correct) {
    return 1; // Incorrect but remembered after seeing answer
  }
  if (hesitation) {
    return 3; // Correct with difficulty
  }
  return 4; // Correct response
}

/**
 * Convert a partial score (0-100) to a quality rating
 */
export function scoreToQuality(score: number): QualityRating {
  if (score >= 95) return 5; // Perfect
  if (score >= 80) return 4; // Good
  if (score >= 60) return 3; // Acceptable
  if (score >= 40) return 2; // Barely
  if (score >= 20) return 1; // Poor
  return 0; // Blackout
}

/**
 * Check if an entry is due for review
 */
export function isDueForReview(progress: EntryProgress | undefined): boolean {
  if (!progress) return true; // New entries are due

  if (!progress.nextReviewDate) return true; // No scheduled date means it's due

  return new Date(progress.nextReviewDate) <= new Date();
}

/**
 * Get the number of days until the next review
 * Returns negative number if overdue
 */
export function daysUntilReview(progress: EntryProgress | undefined): number {
  if (!progress || !progress.nextReviewDate) return 0;

  const now = new Date();
  const reviewDate = new Date(progress.nextReviewDate);
  const diffTime = reviewDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Sort entries by review priority
 * Entries that are overdue come first, then by how overdue they are
 */
export function sortByReviewPriority(
  entries: Array<{ id: string; progress: EntryProgress | undefined }>
): Array<{ id: string; progress: EntryProgress | undefined }> {
  return [...entries].sort((a, b) => {
    const daysA = daysUntilReview(a.progress);
    const daysB = daysUntilReview(b.progress);

    // Overdue items first (negative days)
    if (daysA < 0 && daysB >= 0) return -1;
    if (daysB < 0 && daysA >= 0) return 1;

    // Among overdue items, most overdue first
    if (daysA < 0 && daysB < 0) return daysA - daysB;

    // Among upcoming items, soonest first
    return daysA - daysB;
  });
}

/**
 * Calculate overall mastery level based on recognition and production scores
 */
export function calculateMasteryLevel(
  recognitionScore: number,
  productionScore: number
): 'new' | 'beginner' | 'intermediate' | 'advanced' | 'mastered' {
  // Production is weighted more heavily as it's harder
  const weightedScore = (recognitionScore * 0.4) + (productionScore * 0.6);

  if (weightedScore < 20) return 'new';
  if (weightedScore < 40) return 'beginner';
  if (weightedScore < 60) return 'intermediate';
  if (weightedScore < 85) return 'advanced';
  return 'mastered';
}

/**
 * Determine optimal quiz type based on current scores
 */
export function suggestQuizType(
  recognitionScore: number | undefined,
  productionScore: number | undefined
): 'recognition' | 'production' | 'mixed' {
  const rec = recognitionScore ?? 50;
  const prod = productionScore ?? 50;

  // If recognition is weak, focus on recognition first
  if (rec < 60) return 'recognition';

  // If recognition is good but production is weak, focus on production
  if (rec >= 60 && prod < 50) return 'production';

  // If both are decent, mix it up
  return 'mixed';
}

/**
 * Calculate learning velocity (improvement rate)
 * Positive = improving, Negative = declining, Zero = stable
 */
export function calculateLearningVelocity(progress: EntryProgress): number {
  if (!progress.timesReviewed || progress.timesReviewed < 2) return 0;

  const accuracy = progress.correctAnswers / progress.timesReviewed;
  const expectedAccuracy = 0.7; // 70% is baseline

  return Math.round((accuracy - expectedAccuracy) * 100);
}
