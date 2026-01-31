import { useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../hooks/useAppStore";
import {
  selectBookmarkedEntries,
  clearAllBookmarks,
} from "../store/bookmarksSlice";
import { startQuiz } from "../store/quizzesSlice";
import { EntryCard } from "../components/EntryCard";
import type { QuizSettings } from "../types";
import { CATEGORIES } from "../types";

export function BookmarksPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const bookmarkedEntries = useAppSelector(selectBookmarkedEntries);

  const handleStartQuiz = () => {
    if (bookmarkedEntries.length < 4) {
      alert("Need at least 4 bookmarked entries to start a quiz.");
      return;
    }

    const settings: QuizSettings = {
      questionCount: Math.min(10, bookmarkedEntries.length) as 5 | 10 | 20,
      categories: CATEGORIES.map((c) => c.id),
      bookmarkedOnly: true,
      quizType: "noun-to-phrase",
    };

    dispatch(startQuiz({ settings, entries: bookmarkedEntries }));
    navigate("/quizzes");
  };

  const handleStartFlashcards = () => {
    navigate("/flashcards?filter=bookmarked");
  };

  const handleClearAll = () => {
    if (confirm("Are you sure you want to remove all bookmarks?")) {
      dispatch(clearAllBookmarks());
    }
  };

  // Group bookmarks by category
  const groupedByCategory = bookmarkedEntries.reduce(
    (acc, entry) => {
      if (!acc[entry.category]) {
        acc[entry.category] = [];
      }
      acc[entry.category].push(entry);
      return acc;
    },
    {} as Record<string, typeof bookmarkedEntries>,
  );

  const categoryOrder = CATEGORIES.map((c) => c.id as string);
  const sortedCategories = Object.keys(groupedByCategory).sort(
    (a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b),
  );

  return (
    <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
            Bookmarks
          </h1>
          <p className="text-sm sm:text-base text-base-content/70">
            {bookmarkedEntries.length} saved entries
          </p>
        </div>

        {bookmarkedEntries.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <button
              className="btn btn-primary btn-sm sm:btn-md"
              onClick={handleStartFlashcards}
            >
              <span className="hidden xs:inline">📇 </span>
              <span className="hidden sm:inline">Review All</span>
              <span className="sm:hidden">Review</span>
            </button>
            <button
              className="btn btn-secondary btn-sm sm:btn-md"
              onClick={handleStartQuiz}
              disabled={bookmarkedEntries.length < 4}
            >
              <span className="hidden xs:inline">📝 </span>
              <span className="hidden sm:inline">Quiz Bookmarks</span>
              <span className="sm:hidden">Quiz</span>
            </button>
            <button
              className="btn btn-outline btn-error btn-sm sm:btn-md"
              onClick={handleClearAll}
            >
              <span className="hidden sm:inline">Clear All</span>
              <span className="sm:hidden">Clear</span>
            </button>
          </div>
        )}
      </div>

      {bookmarkedEntries.length === 0 ? (
        <div className="text-center py-8 sm:py-12">
          <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🔖</div>
          <h2 className="text-xl sm:text-2xl font-bold mb-2">
            No bookmarks yet
          </h2>
          <p className="text-sm sm:text-base text-base-content/70 mb-4 sm:mb-6">
            Bookmark entries while studying to save them for later review.
          </p>
          <button
            className="btn btn-primary btn-sm sm:btn-md"
            onClick={() => navigate("/flashcards")}
          >
            Start Studying
          </button>
        </div>
      ) : (
        <div className="space-y-6 sm:space-y-8">
          {sortedCategories.map((categoryId) => {
            const categoryInfo = CATEGORIES.find((c) => c.id === categoryId);
            const entries = groupedByCategory[categoryId];

            return (
              <div key={categoryId}>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span>{categoryInfo?.icon}</span>
                  <span>{categoryInfo?.name}</span>
                  <span className="badge badge-outline">{entries.length}</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {entries.map((entry) => (
                    <EntryCard
                      key={entry.id}
                      entry={entry}
                      showCategory={false}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
