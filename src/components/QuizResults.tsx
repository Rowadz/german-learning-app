import { useAppDispatch, useAppSelector } from "../hooks/useAppStore";
import { selectCurrentAttempt, endQuiz } from "../store/quizzesSlice";
import { useNavigate } from "react-router-dom";

export function QuizResults() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const attempt = useAppSelector(selectCurrentAttempt);

  if (!attempt || !attempt.completed) {
    return null;
  }

  const percentage = Math.round((attempt.score / attempt.totalQuestions) * 100);

  const getGrade = () => {
    if (percentage >= 90)
      return { label: "Excellent!", emoji: "🌟", color: "text-success" };
    if (percentage >= 70)
      return { label: "Good job!", emoji: "👍", color: "text-info" };
    if (percentage >= 50)
      return { label: "Keep practicing!", emoji: "💪", color: "text-warning" };
    return { label: "Need more practice", emoji: "📚", color: "text-error" };
  };

  const grade = getGrade();

  const handleNewQuiz = () => {
    dispatch(endQuiz());
  };

  const handleGoHome = () => {
    dispatch(endQuiz());
    navigate("/");
  };

  const handleViewHistory = () => {
    dispatch(endQuiz());
    navigate("/quizzes", { state: { showHistory: true } });
  };

  return (
    <div className="max-w-2xl mx-auto px-2 sm:px-0">
      {/* Results card */}
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body items-center text-center p-4 sm:p-6">
          <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">{grade.emoji}</div>
          <h2 className={`card-title text-2xl sm:text-3xl ${grade.color}`}>
            {grade.label}
          </h2>

          {/* Score display */}
          <div className="stats stats-vertical lg:stats-horizontal shadow mt-4 sm:mt-6 text-sm sm:text-base">
            <div className="stat place-items-center p-3 sm:p-4">
              <div className="stat-title text-xs sm:text-sm">Score</div>
              <div className="stat-value text-primary text-2xl sm:text-4xl">
                {attempt.score}/{attempt.totalQuestions}
              </div>
              <div className="stat-desc text-xs">{percentage}% correct</div>
            </div>

            <div className="stat place-items-center p-3 sm:p-4">
              <div className="stat-title text-xs sm:text-sm">Quiz Type</div>
              <div className="stat-value text-base sm:text-lg">
                {attempt.settings.quizType === "noun-to-phrase"
                  ? "Noun → Phrase"
                  : attempt.settings.quizType === "phrase-to-translation"
                    ? "Phrase → Translation"
                    : "Typing"}
              </div>
              <div className="stat-desc text-xs">
                {attempt.settings.categories.length} categories
              </div>
            </div>
          </div>

          {/* Progress ring */}
          <div
            className="radial-progress text-primary mt-4 sm:mt-6"
            style={
              {
                "--value": percentage,
                "--size": "6rem",
                "--thickness": "4px",
              } as React.CSSProperties
            }
          >
            <span className="text-lg sm:text-xl font-bold">{percentage}%</span>
          </div>

          {/* Question breakdown */}
          <div className="w-full mt-6">
            <h3 className="font-bold text-lg mb-3">Question Breakdown</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {attempt.questions.map((q, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    q.isCorrect ? "bg-success/20" : "bg-error/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`badge ${q.isCorrect ? "badge-success" : "badge-error"}`}
                    >
                      {index + 1}
                    </span>
                    <span className="text-sm truncate max-w-xs">
                      {q.question}
                    </span>
                  </div>
                  <span>{q.isCorrect ? "✓" : "✗"}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="card-actions justify-center mt-6 flex-wrap gap-2">
            <button className="btn btn-primary" onClick={handleNewQuiz}>
              New Quiz
            </button>
            <button className="btn btn-outline" onClick={handleViewHistory}>
              View History
            </button>
            <button className="btn btn-ghost" onClick={handleGoHome}>
              Go Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
