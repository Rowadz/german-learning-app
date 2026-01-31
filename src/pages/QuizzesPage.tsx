import { useState } from "react";
import { useAppSelector } from "../hooks/useAppStore";
import {
  selectIsQuizActive,
  selectCurrentAttempt,
  selectRecentAttempts,
  selectQuizStats,
  selectQuizTypeStats,
} from "../store/quizzesSlice";
import { QuizSetup } from "../components/QuizSetup";
import { QuizEngine } from "../components/QuizEngine";
import { QuizResults } from "../components/QuizResults";
import { StatsCard, StatsGrid } from "../components/StatsCard";

type TabType = "quiz" | "history" | "stats";

export function QuizzesPage() {
  const isActive = useAppSelector(selectIsQuizActive);
  const currentAttempt = useAppSelector(selectCurrentAttempt);
  const recentAttempts = useAppSelector(selectRecentAttempts);
  const quizStats = useAppSelector(selectQuizStats);
  const typeStats = useAppSelector(selectQuizTypeStats);

  const [activeTab, setActiveTab] = useState<TabType>("quiz");

  // Show results if quiz is completed
  if (currentAttempt?.completed) {
    return (
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6">
          Quiz Results
        </h1>
        <QuizResults />
      </div>
    );
  }

  // Show quiz engine if quiz is active
  if (isActive) {
    return (
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6">
          Quiz in Progress
        </h1>
        <QuizEngine />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6">
        Quizzes
      </h1>

      {/* Tabs */}
      <div className="tabs tabs-boxed mb-4 sm:mb-6 flex-nowrap overflow-x-auto">
        <button
          className={`tab flex-1 sm:flex-none text-xs sm:text-sm ${activeTab === "quiz" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("quiz")}
        >
          <span className="hidden sm:inline">Start Quiz</span>
          <span className="sm:hidden">Quiz</span>
        </button>
        <button
          className={`tab flex-1 sm:flex-none text-xs sm:text-sm ${activeTab === "history" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          History ({recentAttempts.length})
        </button>
        <button
          className={`tab flex-1 sm:flex-none text-xs sm:text-sm ${activeTab === "stats" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("stats")}
        >
          <span className="hidden sm:inline">Statistics</span>
          <span className="sm:hidden">Stats</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "quiz" && <QuizSetup />}

      {activeTab === "history" && (
        <div className="space-y-4">
          {recentAttempts.length === 0 ? (
            <div className="alert alert-info">
              <span>
                No quiz history yet. Take a quiz to see your results here!
              </span>
            </div>
          ) : (
            recentAttempts.map((attempt) => {
              const percentage = Math.round(
                (attempt.score / attempt.totalQuestions) * 100,
              );
              const date = new Date(attempt.timestamp);

              return (
                <div key={attempt.id} className="card bg-base-200 shadow-md">
                  <div className="card-body">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <h3 className="font-bold">
                          {attempt.settings.quizType === "noun-to-phrase"
                            ? "Noun → Phrase"
                            : attempt.settings.quizType ===
                                "phrase-to-translation"
                              ? "Phrase → Translation"
                              : "Typing Challenge"}
                        </h3>
                        <p className="text-sm text-base-content/70">
                          {date.toLocaleDateString()} at{" "}
                          {date.toLocaleTimeString()}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {attempt.settings.bookmarkedOnly && (
                            <span className="badge badge-warning badge-sm">
                              Bookmarked only
                            </span>
                          )}
                          <span className="badge badge-outline badge-sm">
                            {attempt.settings.categories.length} categories
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold">
                            {attempt.score}/{attempt.totalQuestions}
                          </div>
                          <div className="text-sm text-base-content/70">
                            Score
                          </div>
                        </div>

                        <div
                          className="radial-progress text-primary"
                          style={
                            {
                              "--value": percentage,
                              "--size": "4rem",
                            } as React.CSSProperties
                          }
                        >
                          {percentage}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === "stats" && (
        <div className="space-y-6">
          {/* Overall Stats */}
          <div>
            <h2 className="text-xl font-bold mb-4">Overall Performance</h2>
            <StatsGrid columns={4}>
              <StatsCard
                title="Total Quizzes"
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
                title="Questions Answered"
                value={quizStats.totalQuestions}
                description={`${quizStats.totalCorrect} correct`}
                icon="✓"
              />
            </StatsGrid>
          </div>

          {/* Stats by Quiz Type */}
          <div>
            <h2 className="text-xl font-bold mb-4">Performance by Quiz Type</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card bg-base-200 shadow-md">
                <div className="card-body">
                  <h3 className="card-title text-lg">Noun → Phrase</h3>
                  <div className="text-3xl font-bold text-primary">
                    {typeStats["noun-to-phrase"].avgScore}%
                  </div>
                  <p className="text-sm text-base-content/70">
                    {typeStats["noun-to-phrase"].attempts} attempts
                  </p>
                  <progress
                    className="progress progress-primary"
                    value={typeStats["noun-to-phrase"].avgScore}
                    max="100"
                  ></progress>
                </div>
              </div>

              <div className="card bg-base-200 shadow-md">
                <div className="card-body">
                  <h3 className="card-title text-lg">Phrase → Translation</h3>
                  <div className="text-3xl font-bold text-secondary">
                    {typeStats["phrase-to-translation"].avgScore}%
                  </div>
                  <p className="text-sm text-base-content/70">
                    {typeStats["phrase-to-translation"].attempts} attempts
                  </p>
                  <progress
                    className="progress progress-secondary"
                    value={typeStats["phrase-to-translation"].avgScore}
                    max="100"
                  ></progress>
                </div>
              </div>

              <div className="card bg-base-200 shadow-md">
                <div className="card-body">
                  <h3 className="card-title text-lg">Typing Challenge</h3>
                  <div className="text-3xl font-bold text-accent">
                    {typeStats["typing"].avgScore}%
                  </div>
                  <p className="text-sm text-base-content/70">
                    {typeStats["typing"].attempts} attempts
                  </p>
                  <progress
                    className="progress progress-accent"
                    value={typeStats["typing"].avgScore}
                    max="100"
                  ></progress>
                </div>
              </div>
            </div>
          </div>

          {quizStats.totalAttempts === 0 && (
            <div className="alert alert-info">
              <span>Complete some quizzes to see your statistics!</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
