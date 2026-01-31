import { useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/useAppStore';
import { selectAllEntries } from '../store/entriesSlice';
import { selectBookmarkIds } from '../store/bookmarksSlice';
import { startQuiz } from '../store/quizzesSlice';
import type { Category, QuizSettings, QuizType } from '../types';
import { CATEGORIES } from '../types';

interface QuizSetupProps {
  onStart?: () => void;
}

export function QuizSetup({ onStart }: QuizSetupProps) {
  const dispatch = useAppDispatch();
  const allEntries = useAppSelector(selectAllEntries);
  const bookmarkIds = useAppSelector(selectBookmarkIds);

  const [questionCount, setQuestionCount] = useState<5 | 10 | 20>(10);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const [quizType, setQuizType] = useState<QuizType>('noun-to-phrase');

  // Filter available entries based on settings
  const availableEntries = useMemo(() => {
    let entries = allEntries;

    if (selectedCategories.length > 0) {
      entries = entries.filter((e) => selectedCategories.includes(e.category));
    }

    if (bookmarkedOnly) {
      entries = entries.filter((e) => bookmarkIds.has(e.id));
    }

    return entries;
  }, [allEntries, selectedCategories, bookmarkedOnly, bookmarkIds]);

  const handleCategoryToggle = (category: Category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleSelectAllCategories = () => {
    if (selectedCategories.length === CATEGORIES.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(CATEGORIES.map((c) => c.id));
    }
  };

  const handleStartQuiz = () => {
    if (availableEntries.length < 4) {
      alert('Need at least 4 entries to start a quiz. Please adjust your filters.');
      return;
    }

    const settings: QuizSettings = {
      questionCount: Math.min(questionCount, availableEntries.length) as 5 | 10 | 20,
      categories: selectedCategories.length > 0 ? selectedCategories : CATEGORIES.map((c) => c.id),
      bookmarkedOnly,
      quizType,
    };

    dispatch(startQuiz({ settings, entries: availableEntries }));
    onStart?.();
  };

  const canStart = availableEntries.length >= 4;

  return (
    <div className="card bg-base-200 shadow-xl max-w-2xl mx-auto">
      <div className="card-body">
        <h2 className="card-title text-2xl mb-4">Quiz Settings</h2>

        {/* Quiz Type */}
        <div className="form-control w-full mb-4">
          <label className="label">
            <span className="label-text font-semibold">Quiz Type</span>
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              className={`btn ${quizType === 'noun-to-phrase' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setQuizType('noun-to-phrase')}
            >
              Noun → Phrase
            </button>
            <button
              className={`btn ${quizType === 'phrase-to-translation' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setQuizType('phrase-to-translation')}
            >
              Phrase → Translation
            </button>
            <button
              className={`btn ${quizType === 'typing' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setQuizType('typing')}
            >
              Typing Challenge
            </button>
          </div>
        </div>

        {/* Number of Questions */}
        <div className="form-control w-full mb-4">
          <label className="label">
            <span className="label-text font-semibold">Number of Questions</span>
          </label>
          <div className="flex gap-2">
            {([5, 10, 20] as const).map((count) => (
              <button
                key={count}
                className={`btn ${questionCount === count ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setQuestionCount(count)}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="form-control w-full mb-4">
          <label className="label">
            <span className="label-text font-semibold">Categories</span>
            <button className="btn btn-xs btn-ghost" onClick={handleSelectAllCategories}>
              {selectedCategories.length === CATEGORIES.length ? 'Clear all' : 'Select all'}
            </button>
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => (
              <button
                key={category.id}
                className={`btn btn-sm ${
                  selectedCategories.includes(category.id) ? 'btn-secondary' : 'btn-outline'
                }`}
                onClick={() => handleCategoryToggle(category.id)}
              >
                {category.icon} {category.name}
              </button>
            ))}
          </div>
          <label className="label">
            <span className="label-text-alt">
              {selectedCategories.length === 0
                ? 'All categories selected'
                : `${selectedCategories.length} categories selected`}
            </span>
          </label>
        </div>

        {/* Bookmarked Only */}
        <div className="form-control mb-4">
          <label className="label cursor-pointer justify-start gap-4">
            <input
              type="checkbox"
              className="checkbox checkbox-primary"
              checked={bookmarkedOnly}
              onChange={(e) => setBookmarkedOnly(e.target.checked)}
            />
            <span className="label-text">Bookmarked entries only</span>
          </label>
        </div>

        {/* Available entries count */}
        <div className="alert mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="stroke-info h-6 w-6 shrink-0"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <span>
            {availableEntries.length} entries available
            {!canStart && ' (need at least 4)'}
          </span>
        </div>

        {/* Start button */}
        <div className="card-actions justify-end">
          <button
            className="btn btn-primary btn-lg"
            onClick={handleStartQuiz}
            disabled={!canStart}
          >
            Start Quiz
          </button>
        </div>
      </div>
    </div>
  );
}
