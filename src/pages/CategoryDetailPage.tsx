import { useParams, Link, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useAppSelector, useAppDispatch } from '../hooks/useAppStore';
import { selectAllEntries, setSearchQuery } from '../store/entriesSlice';
import { selectProgressByCategory } from '../store/progressSlice';
import { selectBookmarkCountByCategory } from '../store/bookmarksSlice';
import { startQuiz } from '../store/quizzesSlice';
import { EntryCard } from '../components/EntryCard';
import { getCategoryInfo, type Category, type QuizSettings } from '../types';
import { CATEGORIES } from '../types';

export function CategoryDetailPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const allEntries = useAppSelector(selectAllEntries);

  const category = categoryId as Category;
  const categoryInfo = getCategoryInfo(category);

  const isValidCategory = CATEGORIES.some((c) => c.id === categoryId);

  const progressCounts = useAppSelector((state) =>
    selectProgressByCategory(state, category)
  );
  const bookmarkCount = useAppSelector((state) =>
    selectBookmarkCountByCategory(state, category)
  );

  const [localSearch, setLocalSearch] = useState('');

  // Filter entries by category and search
  const categoryEntries = useMemo(() => {
    let entries = allEntries.filter((e) => e.category === category);

    if (localSearch.trim()) {
      const query = localSearch.toLowerCase();
      entries = entries.filter(
        (e) =>
          e.noun.toLowerCase().includes(query) ||
          e.phrase.toLowerCase().includes(query) ||
          e.example.toLowerCase().includes(query) ||
          e.translation.toLowerCase().includes(query)
      );
    }

    return entries;
  }, [allEntries, category, localSearch]);

  const handleStartQuiz = () => {
    const entries = allEntries.filter((e) => e.category === category);

    if (entries.length < 4) {
      alert('Need at least 4 entries to start a quiz.');
      return;
    }

    const settings: QuizSettings = {
      questionCount: Math.min(10, entries.length) as 5 | 10 | 20,
      categories: [category],
      bookmarkedOnly: false,
      quizType: 'noun-to-phrase',
    };

    dispatch(startQuiz({ settings, entries }));
    navigate('/quizzes');
  };

  const handleStartFlashcards = () => {
    // Clear global search and navigate to flashcards
    dispatch(setSearchQuery(''));
    navigate(`/flashcards?category=${category}`);
  };

  if (!isValidCategory) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="alert alert-error">
          <span>Category not found</span>
        </div>
        <Link to="/categories" className="btn btn-primary mt-4">
          Back to Categories
        </Link>
      </div>
    );
  }

  const progressPercentage =
    progressCounts.total > 0
      ? Math.round((progressCounts.known / progressCounts.total) * 100)
      : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="breadcrumbs text-sm mb-4">
        <ul>
          <li>
            <Link to="/categories">Categories</Link>
          </li>
          <li>{categoryInfo.name}</li>
        </ul>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <span className="text-5xl">{categoryInfo.icon}</span>
          <div>
            <h1 className="text-3xl font-bold">{categoryInfo.name}</h1>
            <p className="text-base-content/70">{categoryInfo.description}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button className="btn btn-primary" onClick={handleStartFlashcards}>
            📇 Flashcards
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleStartQuiz}
            disabled={categoryEntries.length < 4}
          >
            📝 Quiz
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats stats-vertical md:stats-horizontal shadow mb-6 w-full">
        <div className="stat">
          <div className="stat-title">Total Entries</div>
          <div className="stat-value text-primary">{progressCounts.total}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Bookmarked</div>
          <div className="stat-value text-warning">{bookmarkCount}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Known</div>
          <div className="stat-value text-success">{progressCounts.known}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Progress</div>
          <div className="stat-value">{progressPercentage}%</div>
          <progress
            className="progress progress-success w-20"
            value={progressPercentage}
            max="100"
          ></progress>
        </div>
      </div>

      {/* Search */}
      <div className="form-control mb-6">
        <div className="input-group flex">
          <input
            type="text"
            placeholder={`Search in ${categoryInfo.name}...`}
            className="input input-bordered flex-1"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
          />
          {localSearch && (
            <button className="btn btn-ghost" onClick={() => setLocalSearch('')}>
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Entry count */}
      <div className="mb-4 text-sm text-base-content/70">
        Showing {categoryEntries.length} of {progressCounts.total} entries
      </div>

      {/* Entries Grid */}
      {categoryEntries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoryEntries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} showCategory={false} />
          ))}
        </div>
      ) : (
        <div className="alert alert-info">
          <span>No entries found matching your search.</span>
        </div>
      )}
    </div>
  );
}
