import { Link } from 'react-router-dom';
import { useAppSelector } from '../hooks/useAppStore';
import { selectAllEntries } from '../store/entriesSlice';
import { selectBookmarkCount } from '../store/bookmarksSlice';
import { selectKnownCount, selectLearningCount, selectNewCount } from '../store/progressSlice';
import { selectQuizStats } from '../store/quizzesSlice';
import { StatsCard, StatsGrid } from '../components/StatsCard';

export function HomePage() {
  const entries = useAppSelector(selectAllEntries);
  const bookmarkCount = useAppSelector(selectBookmarkCount);
  const knownCount = useAppSelector(selectKnownCount);
  const learningCount = useAppSelector(selectLearningCount);
  const newCount = useAppSelector(selectNewCount);
  const quizStats = useAppSelector(selectQuizStats);

  const totalEntries = entries.length;
  const progressPercentage = totalEntries > 0 ? Math.round((knownCount / totalEntries) * 100) : 0;

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
      {/* Hero Section */}
      <div className="hero bg-base-200 rounded-box mb-6 sm:mb-8">
        <div className="hero-content text-center py-8 sm:py-12 px-4">
          <div className="max-w-md">
            <h1 className="text-3xl sm:text-5xl font-bold">🇩🇪 Willkommen!</h1>
            <p className="py-4 sm:py-6 text-sm sm:text-base">
              Master German vocabulary with flashcards and quizzes. Learn practical phrases
              for everyday situations.
            </p>
            <div className="flex gap-2 sm:gap-4 justify-center flex-col sm:flex-row">
              <Link to="/flashcards" className="btn btn-primary btn-sm sm:btn-md">
                Start Flashcards
              </Link>
              <Link to="/quizzes" className="btn btn-secondary btn-sm sm:btn-md">
                Take a Quiz
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Your Progress</h2>
      <StatsGrid columns={4}>
        <StatsCard
          title="Total Words"
          value={totalEntries}
          description="Vocabulary entries"
          icon="📚"
        />
        <StatsCard
          title="Mastered"
          value={knownCount}
          description={`${progressPercentage}% complete`}
          icon="✅"
        />
        <StatsCard
          title="Learning"
          value={learningCount}
          description="In progress"
          icon="📖"
        />
        <StatsCard
          title="Bookmarked"
          value={bookmarkCount}
          description="Saved for review"
          icon="🔖"
        />
      </StatsGrid>

      {/* Progress Overview */}
      <div className="mt-6 sm:mt-8">
        <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Learning Progress</h2>
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
              {/* Progress Ring */}
              <div className="flex flex-col items-center justify-center">
                <div
                  className="radial-progress text-primary"
                  style={{ '--value': progressPercentage, '--size': '8rem' } as React.CSSProperties}
                >
                  <span className="text-xl sm:text-2xl font-bold">{progressPercentage}%</span>
                </div>
                <p className="mt-2 text-sm text-base-content/70">Overall Progress</p>
              </div>

              {/* Progress Bars */}
              <div className="flex-1 space-y-3 sm:space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs sm:text-sm font-medium">New Words</span>
                    <span className="text-xs sm:text-sm">{newCount}</span>
                  </div>
                  <progress
                    className="progress progress-neutral w-full h-2 sm:h-3"
                    value={newCount}
                    max={totalEntries}
                  ></progress>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs sm:text-sm font-medium">Learning</span>
                    <span className="text-xs sm:text-sm">{learningCount}</span>
                  </div>
                  <progress
                    className="progress progress-warning w-full h-2 sm:h-3"
                    value={learningCount}
                    max={totalEntries}
                  ></progress>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs sm:text-sm font-medium">Known</span>
                    <span className="text-xs sm:text-sm">{knownCount}</span>
                  </div>
                  <progress
                    className="progress progress-success w-full h-2 sm:h-3"
                    value={knownCount}
                    max={totalEntries}
                  ></progress>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quiz Stats */}
      <div className="mt-6 sm:mt-8">
        <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Quiz Performance</h2>
        <StatsGrid columns={4}>
          <StatsCard
            title="Quizzes Taken"
            value={quizStats.totalAttempts}
            icon="📝"
          />
          <StatsCard
            title="Average Score"
            value={`${quizStats.averageScore}%`}
            icon="📊"
          />
          <StatsCard
            title="Best Score"
            value={`${quizStats.bestScore}%`}
            icon="🏆"
          />
          <StatsCard
            title="Total Questions"
            value={quizStats.totalQuestions}
            description={`${quizStats.totalCorrect} correct`}
            icon="✓"
          />
        </StatsGrid>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 sm:mt-8">
        <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          <Link to="/flashcards" className="card bg-primary text-primary-content hover:shadow-lg transition-shadow active:scale-95">
            <div className="card-body items-center text-center p-3 sm:p-6">
              <span className="text-2xl sm:text-4xl">📇</span>
              <h3 className="card-title text-sm sm:text-lg">Flashcards</h3>
              <p className="text-xs sm:text-sm opacity-80 hidden sm:block">Review vocabulary</p>
            </div>
          </Link>

          <Link to="/quizzes" className="card bg-secondary text-secondary-content hover:shadow-lg transition-shadow active:scale-95">
            <div className="card-body items-center text-center p-3 sm:p-6">
              <span className="text-2xl sm:text-4xl">📝</span>
              <h3 className="card-title text-sm sm:text-lg">Quiz</h3>
              <p className="text-xs sm:text-sm opacity-80 hidden sm:block">Test your knowledge</p>
            </div>
          </Link>

          <Link to="/categories" className="card bg-accent text-accent-content hover:shadow-lg transition-shadow active:scale-95">
            <div className="card-body items-center text-center p-3 sm:p-6">
              <span className="text-2xl sm:text-4xl">📁</span>
              <h3 className="card-title text-sm sm:text-lg">Categories</h3>
              <p className="text-xs sm:text-sm opacity-80 hidden sm:block">Browse by topic</p>
            </div>
          </Link>

          <Link to="/bookmarks" className="card bg-warning text-warning-content hover:shadow-lg transition-shadow active:scale-95">
            <div className="card-body items-center text-center p-3 sm:p-6">
              <span className="text-2xl sm:text-4xl">🔖</span>
              <h3 className="card-title text-sm sm:text-lg">Bookmarks</h3>
              <p className="text-xs sm:text-sm opacity-80 hidden sm:block">{bookmarkCount} saved</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
